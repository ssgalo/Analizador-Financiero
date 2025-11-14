#!/usr/bin/env python3
"""
Script: populate_embeddings.py
Descripción: Genera embeddings para TODOS los gastos e ingresos existentes
Autor: Sistema de Analizador Financiero
Fecha: 11 noviembre 2025

Uso:
    python scripts/populate_embeddings.py [opciones]
    
Opciones:
    --batch-size N          Tamaño del lote para procesamiento (default: 100)
    --force-regenerate      Regenera embeddings existentes
    --user-id N             Solo procesa registros de este usuario
    --gastos-only           Solo procesa gastos
    --ingresos-only         Solo procesa ingresos
    --dry-run               Muestra qué se haría sin ejecutar
    --verbose               Muestra información detallada
"""

import sys
import os
import argparse
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

# Agregar directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, select, func
from sqlalchemy.orm import Session
from app.crud.session import SessionLocal
from app.models.gasto import Gasto
from app.models.ingreso import Ingreso
from app.models.embeddings import GastoEmbedding, IngresoEmbedding
from app.services.embeddings_service import EmbeddingsService

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('populate_embeddings.log')
    ]
)
logger = logging.getLogger(__name__)


class PopulateEmbeddingsScript:
    """Script para poblar embeddings de gastos e ingresos."""
    
    def __init__(
        self,
        batch_size: int = 100,
        force_regenerate: bool = False,
        user_id: Optional[int] = None,
        gastos_only: bool = False,
        ingresos_only: bool = False,
        dry_run: bool = False,
        verbose: bool = False
    ):
        self.batch_size = batch_size
        self.force_regenerate = force_regenerate
        self.user_id = user_id
        self.gastos_only = gastos_only
        self.ingresos_only = ingresos_only
        self.dry_run = dry_run
        self.verbose = verbose
        
        self.embeddings_service = EmbeddingsService()
        self.stats = {
            'gastos_processed': 0,
            'gastos_skipped': 0,
            'gastos_errors': 0,
            'ingresos_processed': 0,
            'ingresos_skipped': 0,
            'ingresos_errors': 0,
            'total_cost': 0.0,
            'start_time': datetime.now(),
            'end_time': None
        }
    
    def log_info(self, message: str):
        """Log información."""
        logger.info(message)
    
    def log_success(self, message: str):
        """Log éxito."""
        logger.info(f"✅ {message}")
    
    def log_warning(self, message: str):
        """Log advertencia."""
        logger.warning(f"⚠️  {message}")
    
    def log_error(self, message: str):
        """Log error."""
        logger.error(f"❌ {message}")
    
    def print_header(self, title: str):
        """Imprime un header formateado."""
        print("\n" + "=" * 70)
        print(title)
        print("=" * 70 + "\n")
    
    def get_existing_embeddings(self, db: Session, tipo: str) -> set:
        """Obtiene IDs de registros que ya tienen embeddings."""
        if tipo == 'gastos':
            result = db.execute(
                select(GastoEmbedding.gasto_id)
            ).scalars().all()
        else:
            result = db.execute(
                select(IngresoEmbedding.ingreso_id)
            ).scalars().all()
        
        return set(result)
    
    def get_gastos_to_process(self, db: Session) -> List[Gasto]:
        """Obtiene lista de gastos a procesar."""
        query = select(Gasto)
        
        # Filtrar por usuario si se especificó
        if self.user_id:
            query = query.where(Gasto.id_usuario == self.user_id)
        
        # Si no forzamos regeneración, excluir los que ya tienen embeddings
        if not self.force_regenerate:
            existing_ids = self.get_existing_embeddings(db, 'gastos')
            if existing_ids:
                query = query.where(Gasto.id_gasto.not_in(existing_ids))
        
        query = query.order_by(Gasto.id_gasto)
        
        return db.execute(query).scalars().all()
    
    def get_ingresos_to_process(self, db: Session) -> List[Ingreso]:
        """Obtiene lista de ingresos a procesar."""
        query = select(Ingreso)
        
        # Filtrar por usuario si se especificó
        if self.user_id:
            query = query.where(Ingreso.id_usuario == self.user_id)
        
        # Si no forzamos regeneración, excluir los que ya tienen embeddings
        if not self.force_regenerate:
            existing_ids = self.get_existing_embeddings(db, 'ingresos')
            if existing_ids:
                query = query.where(Ingreso.id_ingreso.not_in(existing_ids))
        
        query = query.order_by(Ingreso.id_ingreso)
        
        return db.execute(query).scalars().all()
    
    def process_gastos_batch(self, db: Session, gastos: List[Gasto]) -> int:
        """Procesa un lote de gastos."""
        if self.dry_run:
            self.log_info(f"DRY RUN: Se procesarían {len(gastos)} gastos")
            return len(gastos)
        
        processed = 0
        
        for gasto in gastos:
            try:
                # Generar embedding
                embedding_data = self.embeddings_service.generate_embedding_for_gasto(
                    gasto=gasto,
                    db=db
                )
                
                if not embedding_data:
                    self.log_warning(f"No se pudo generar embedding para gasto {gasto.id_gasto}")
                    self.stats['gastos_skipped'] += 1
                    continue
                
                # Verificar si ya existe
                existing = db.query(GastoEmbedding).filter(
                    GastoEmbedding.gasto_id == gasto.id
                ).first()
                
                if existing and self.force_regenerate:
                    # Actualizar embedding existente
                    existing.embedding = embedding_data['embedding']
                    existing.texto = embedding_data['texto']
                    existing.metadata = embedding_data.get('metadata', {})
                    existing.fecha_actualizacion = datetime.now()
                    
                    if self.verbose:
                        self.log_info(f"Actualizado embedding para gasto {gasto.id_gasto}")
                elif not existing:
                    # Crear nuevo embedding
                    nuevo_embedding = GastoEmbedding(
                        id_gasto=gasto.id_gasto,
                        id_usuario=gasto.id_usuario,
                        embedding=embedding_data['embedding'],
                        texto=embedding_data['texto'],
                        metadata=embedding_data.get('metadata', {})
                    )
                    db.add(nuevo_embedding)
                    
                    if self.verbose:
                        self.log_info(f"Creado embedding para gasto {gasto.id_gasto}")
                else:
                    self.stats['gastos_skipped'] += 1
                    continue
                
                processed += 1
                
                # Commit cada N registros
                if processed % 10 == 0:
                    db.commit()
                    
            except Exception as e:
                self.log_error(f"Error procesando gasto {gasto.id_gasto}: {str(e)}")
                self.stats['gastos_errors'] += 1
                db.rollback()
        
        # Commit final
        try:
            db.commit()
            self.stats['gastos_processed'] += processed
        except Exception as e:
            self.log_error(f"Error en commit final de gastos: {str(e)}")
            db.rollback()
        
        return processed
    
    def process_ingresos_batch(self, db: Session, ingresos: List[Ingreso]) -> int:
        """Procesa un lote de ingresos."""
        if self.dry_run:
            self.log_info(f"DRY RUN: Se procesarían {len(ingresos)} ingresos")
            return len(ingresos)
        
        processed = 0
        
        for ingreso in ingresos:
            try:
                # Generar embedding
                embedding_data = self.embeddings_service.generate_embedding_for_ingreso(
                    ingreso=ingreso,
                    db=db
                )
                
                if not embedding_data:
                    self.log_warning(f"No se pudo generar embedding para ingreso {ingreso.id_ingreso}")
                    self.stats['ingresos_skipped'] += 1
                    continue
                
                # Verificar si ya existe
                existing = db.query(IngresoEmbedding).filter(
                    IngresoEmbedding.ingreso_id == ingreso.id
                ).first()
                
                if existing and self.force_regenerate:
                    # Actualizar embedding existente
                    existing.embedding = embedding_data['embedding']
                    existing.texto = embedding_data['texto']
                    existing.metadata = embedding_data.get('metadata', {})
                    existing.fecha_actualizacion = datetime.now()
                    
                    if self.verbose:
                        self.log_info(f"Actualizado embedding para ingreso {ingreso.id_ingreso}")
                elif not existing:
                    # Crear nuevo embedding
                    nuevo_embedding = IngresoEmbedding(
                        id_ingreso=ingreso.id_ingreso,
                        id_usuario=ingreso.id_usuario,
                        embedding=embedding_data['embedding'],
                        texto=embedding_data['texto'],
                        metadata=embedding_data.get('metadata', {})
                    )
                    db.add(nuevo_embedding)
                    
                    if self.verbose:
                        self.log_info(f"Creado embedding para ingreso {ingreso.id_ingreso}")
                else:
                    self.stats['ingresos_skipped'] += 1
                    continue
                
                processed += 1
                
                # Commit cada N registros
                if processed % 10 == 0:
                    db.commit()
                    
            except Exception as e:
                self.log_error(f"Error procesando ingreso {ingreso.id_ingreso}: {str(e)}")
                self.stats['ingresos_errors'] += 1
                db.rollback()
        
        # Commit final
        try:
            db.commit()
            self.stats['ingresos_processed'] += processed
        except Exception as e:
            self.log_error(f"Error en commit final de ingresos: {str(e)}")
            db.rollback()
        
        return processed
    
    def process_gastos(self, db: Session):
        """Procesa todos los gastos."""
        if self.ingresos_only:
            self.log_info("Saltando gastos (--ingresos-only)")
            return
        
        self.print_header("PROCESANDO GASTOS")
        
        gastos = self.get_gastos_to_process(db)
        total = len(gastos)
        
        if total == 0:
            self.log_info("No hay gastos para procesar")
            return
        
        self.log_info(f"Total de gastos a procesar: {total}")
        
        # Procesar en lotes
        for i in range(0, total, self.batch_size):
            batch = gastos[i:i + self.batch_size]
            batch_num = (i // self.batch_size) + 1
            total_batches = (total + self.batch_size - 1) // self.batch_size
            
            self.log_info(f"Procesando lote {batch_num}/{total_batches} ({len(batch)} gastos)...")
            
            processed = self.process_gastos_batch(db, batch)
            
            progress = ((i + len(batch)) / total) * 100
            self.log_info(f"Progreso: {progress:.1f}% ({i + len(batch)}/{total})")
        
        self.log_success(f"Gastos procesados: {self.stats['gastos_processed']}")
        if self.stats['gastos_skipped'] > 0:
            self.log_warning(f"Gastos omitidos: {self.stats['gastos_skipped']}")
        if self.stats['gastos_errors'] > 0:
            self.log_error(f"Errores en gastos: {self.stats['gastos_errors']}")
    
    def process_ingresos(self, db: Session):
        """Procesa todos los ingresos."""
        if self.gastos_only:
            self.log_info("Saltando ingresos (--gastos-only)")
            return
        
        self.print_header("PROCESANDO INGRESOS")
        
        ingresos = self.get_ingresos_to_process(db)
        total = len(ingresos)
        
        if total == 0:
            self.log_info("No hay ingresos para procesar")
            return
        
        self.log_info(f"Total de ingresos a procesar: {total}")
        
        # Procesar en lotes
        for i in range(0, total, self.batch_size):
            batch = ingresos[i:i + self.batch_size]
            batch_num = (i // self.batch_size) + 1
            total_batches = (total + self.batch_size - 1) // self.batch_size
            
            self.log_info(f"Procesando lote {batch_num}/{total_batches} ({len(batch)} ingresos)...")
            
            processed = self.process_ingresos_batch(db, batch)
            
            progress = ((i + len(batch)) / total) * 100
            self.log_info(f"Progreso: {progress:.1f}% ({i + len(batch)}/{total})")
        
        self.log_success(f"Ingresos procesados: {self.stats['ingresos_processed']}")
        if self.stats['ingresos_skipped'] > 0:
            self.log_warning(f"Ingresos omitidos: {self.stats['ingresos_skipped']}")
        if self.stats['ingresos_errors'] > 0:
            self.log_error(f"Errores en ingresos: {self.stats['ingresos_errors']}")
    
    def print_final_stats(self):
        """Imprime estadísticas finales."""
        self.stats['end_time'] = datetime.now()
        duration = self.stats['end_time'] - self.stats['start_time']
        
        self.print_header("ESTADÍSTICAS FINALES")
        
        print(f"📊 Resumen de procesamiento:")
        print(f"   Duración: {duration}")
        print()
        
        print(f"💰 Gastos:")
        print(f"   ✅ Procesados: {self.stats['gastos_processed']}")
        print(f"   ⏭️  Omitidos: {self.stats['gastos_skipped']}")
        print(f"   ❌ Errores: {self.stats['gastos_errors']}")
        print()
        
        print(f"💵 Ingresos:")
        print(f"   ✅ Procesados: {self.stats['ingresos_processed']}")
        print(f"   ⏭️  Omitidos: {self.stats['ingresos_skipped']}")
        print(f"   ❌ Errores: {self.stats['ingresos_errors']}")
        print()
        
        total_processed = self.stats['gastos_processed'] + self.stats['ingresos_processed']
        total_errors = self.stats['gastos_errors'] + self.stats['ingresos_errors']
        
        print(f"📈 Totales:")
        print(f"   Total procesado: {total_processed}")
        print(f"   Total errores: {total_errors}")
        
        if total_processed > 0:
            success_rate = ((total_processed) / (total_processed + total_errors)) * 100
            print(f"   Tasa de éxito: {success_rate:.1f}%")
        
        print()
        
        # Estimación de costo
        avg_tokens = 100  # tokens promedio por registro
        total_tokens = total_processed * avg_tokens
        estimated_cost = (total_tokens / 1_000_000) * 0.02  # $0.02 per 1M tokens
        
        print(f"💵 Costo estimado de embeddings:")
        print(f"   Tokens estimados: {total_tokens:,}")
        print(f"   Costo: ${estimated_cost:.4f}")
        print()
    
    def run(self):
        """Ejecuta el script completo."""
        try:
            self.print_header("POBLACIÓN DE EMBEDDINGS - ANALIZADOR FINANCIERO")
            
            if self.dry_run:
                self.log_warning("MODO DRY RUN - No se realizarán cambios")
            
            # Configuración
            print(f"⚙️  Configuración:")
            print(f"   Batch size: {self.batch_size}")
            print(f"   Force regenerate: {self.force_regenerate}")
            print(f"   User ID filter: {self.user_id or 'Todos'}")
            print(f"   Gastos only: {self.gastos_only}")
            print(f"   Ingresos only: {self.ingresos_only}")
            print()
            
            # Crear sesión de base de datos
            db = SessionLocal()
            
            try:
                # Procesar gastos
                if not self.ingresos_only:
                    self.process_gastos(db)
                
                # Procesar ingresos
                if not self.gastos_only:
                    self.process_ingresos(db)
                
                # Estadísticas finales
                self.print_final_stats()
                
                if not self.dry_run:
                    self.log_success("🎉 Población completada exitosamente!")
                else:
                    self.log_info("DRY RUN completado")
                
            finally:
                db.close()
                
        except KeyboardInterrupt:
            self.log_warning("\n⚠️  Proceso interrumpido por el usuario")
            sys.exit(1)
        except Exception as e:
            self.log_error(f"Error fatal: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


def main():
    """Función principal."""
    parser = argparse.ArgumentParser(
        description="Genera embeddings para todos los gastos e ingresos existentes"
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Tamaño del lote para procesamiento (default: 100)'
    )
    
    parser.add_argument(
        '--force-regenerate',
        action='store_true',
        help='Regenera embeddings existentes'
    )
    
    parser.add_argument(
        '--user-id',
        type=int,
        help='Solo procesa registros de este usuario'
    )
    
    parser.add_argument(
        '--gastos-only',
        action='store_true',
        help='Solo procesa gastos'
    )
    
    parser.add_argument(
        '--ingresos-only',
        action='store_true',
        help='Solo procesa ingresos'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Muestra qué se haría sin ejecutar'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Muestra información detallada'
    )
    
    args = parser.parse_args()
    
    # Validar argumentos
    if args.gastos_only and args.ingresos_only:
        print("❌ Error: No se pueden usar --gastos-only e --ingresos-only simultáneamente")
        sys.exit(1)
    
    # Crear y ejecutar script
    script = PopulateEmbeddingsScript(
        batch_size=args.batch_size,
        force_regenerate=args.force_regenerate,
        user_id=args.user_id,
        gastos_only=args.gastos_only,
        ingresos_only=args.ingresos_only,
        dry_run=args.dry_run,
        verbose=args.verbose
    )
    
    script.run()


if __name__ == '__main__':
    main()
