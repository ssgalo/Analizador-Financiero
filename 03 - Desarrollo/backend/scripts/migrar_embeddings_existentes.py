#!/usr/bin/env python3
"""
Script de Migración de Embeddings
==================================
Genera embeddings para todos los gastos e ingresos existentes que no los tienen.

Uso:
    python scripts/migrar_embeddings_existentes.py [--tipo gasto|ingreso|all]

Autor: Sistema de Analizador Financiero
Fecha: 12 noviembre 2025
"""

import sys
import os
import asyncio
import argparse
from decimal import Decimal
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.crud.session import SessionLocal
from app.models.gasto import Gasto
from app.models.ingreso import Ingreso
from app.models.embeddings import GastoEmbedding, IngresoEmbedding
from app.services.embeddings_service import EmbeddingsService


class EmbeddingsMigrator:
    """Migrador de embeddings para datos existentes"""
    
    def __init__(self):
        self.embeddings_service = EmbeddingsService()
        self.stats = {
            'gastos_procesados': 0,
            'gastos_creados': 0,
            'gastos_errores': 0,
            'ingresos_procesados': 0,
            'ingresos_creados': 0,
            'ingresos_errores': 0,
        }
    
    def _generar_texto_gasto(self, gasto: Gasto) -> str:
        """
        Genera el texto descriptivo para un gasto.
        
        Args:
            gasto: Objeto Gasto
            
        Returns:
            Texto formateado para embeddings
        """
        # Información básica
        partes = [
            f"Gasto: {gasto.descripcion or 'Sin descripción'}",
            f"Monto: ${gasto.monto:.2f} {gasto.moneda}",
            f"Fecha: {gasto.fecha.strftime('%d/%m/%Y')}",
        ]
        
        # Categoría
        if gasto.categoria:
            partes.append(f"Categoría: {gasto.categoria.nombre}")
        
        # Comercio
        if gasto.comercio:
            partes.append(f"Comercio: {gasto.comercio}")
        
        return " | ".join(partes)
    
    def _generar_texto_ingreso(self, ingreso: Ingreso) -> str:
        """
        Genera el texto descriptivo para un ingreso.
        
        Args:
            ingreso: Objeto Ingreso
            
        Returns:
            Texto formateado para embeddings
        """
        # Información básica
        partes = [
            f"Ingreso: {ingreso.descripcion or 'Sin descripción'}",
            f"Monto: ${ingreso.monto:.2f} {ingreso.moneda}",
            f"Fecha: {ingreso.fecha.strftime('%d/%m/%Y')}",
        ]
        
        # Tipo de ingreso
        if ingreso.tipo:
            partes.append(f"Tipo: {ingreso.tipo}")
        
        # Fuente
        if ingreso.fuente:
            partes.append(f"Fuente: {ingreso.fuente}")
        
        # Recurrente
        if ingreso.recurrente:
            partes.append("Ingreso recurrente")
        
        # Notas
        if ingreso.notas:
            partes.append(f"Notas: {ingreso.notas}")
        
        return " | ".join(partes)
    
    def _generar_metadata_gasto(self, gasto: Gasto) -> dict:
        """Genera metadata JSONB para un gasto"""
        return {
            'categoria': gasto.categoria.nombre if gasto.categoria else None,
            'monto': float(gasto.monto),
            'moneda': gasto.moneda,
            'fecha': gasto.fecha.isoformat(),
            'comercio': gasto.comercio,
            'fuente': gasto.fuente,
            'estado': gasto.estado,
        }
    
    def _generar_metadata_ingreso(self, ingreso: Ingreso) -> dict:
        """Genera metadata JSONB para un ingreso"""
        return {
            'tipo': ingreso.tipo,
            'monto': float(ingreso.monto),
            'moneda': ingreso.moneda,
            'fecha': ingreso.fecha.isoformat(),
            'fuente': ingreso.fuente,
            'es_recurrente': ingreso.recurrente,
            'frecuencia': ingreso.frecuencia,
            'estado': ingreso.estado,
        }
    
    def migrar_gastos(self, db: Session, limite: int = None) -> None:
        """
        Migra gastos sin embeddings.
        
        Args:
            db: Sesión de base de datos
            limite: Límite de gastos a procesar (None = todos)
        """
        print("\n" + "="*60)
        print("🔄 MIGRANDO GASTOS")
        print("="*60)
        
        # Encontrar gastos sin embeddings
        query = db.query(Gasto).outerjoin(
            GastoEmbedding,
            Gasto.id_gasto == GastoEmbedding.gasto_id
        ).filter(
            GastoEmbedding.id == None,  # Gastos sin embedding
            Gasto.estado == 'confirmado'  # Solo confirmados
        )
        
        if limite:
            query = query.limit(limite)
        
        gastos = query.all()
        total = len(gastos)
        
        print(f"📊 Gastos sin embeddings: {total}")
        
        if total == 0:
            print("✅ Todos los gastos ya tienen embeddings")
            return
        
        print("\n🚀 Iniciando procesamiento...\n")
        
        for i, gasto in enumerate(gastos, 1):
            try:
                self.stats['gastos_procesados'] += 1
                
                # Generar texto
                texto = self._generar_texto_gasto(gasto)
                
                # Generar embedding
                print(f"[{i}/{total}] Procesando gasto #{gasto.id_gasto}...", end=" ")
                embedding = self.embeddings_service.generate_embedding(texto)
                
                if not embedding:
                    print("❌ Error generando embedding")
                    self.stats['gastos_errores'] += 1
                    continue
                
                # Crear registro de embedding
                gasto_embedding = GastoEmbedding(
                    gasto_id=gasto.id_gasto,
                    embedding=embedding,
                    texto_original=texto,
                    metadata_=self._generar_metadata_gasto(gasto)
                )
                
                db.add(gasto_embedding)
                db.commit()
                
                print("✅")
                self.stats['gastos_creados'] += 1
                
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                self.stats['gastos_errores'] += 1
                db.rollback()
                continue
        
        print("\n" + "-"*60)
        print(f"✅ Gastos procesados: {self.stats['gastos_procesados']}")
        print(f"✅ Embeddings creados: {self.stats['gastos_creados']}")
        print(f"❌ Errores: {self.stats['gastos_errores']}")
        print("-"*60)
    
    def migrar_ingresos(self, db: Session, limite: int = None) -> None:
        """
        Migra ingresos sin embeddings.
        
        Args:
            db: Sesión de base de datos
            limite: Límite de ingresos a procesar (None = todos)
        """
        print("\n" + "="*60)
        print("🔄 MIGRANDO INGRESOS")
        print("="*60)
        
        # Encontrar ingresos sin embeddings
        query = db.query(Ingreso).outerjoin(
            IngresoEmbedding,
            Ingreso.id_ingreso == IngresoEmbedding.ingreso_id
        ).filter(
            IngresoEmbedding.id == None  # Ingresos sin embedding
        )
        
        if limite:
            query = query.limit(limite)
        
        ingresos = query.all()
        total = len(ingresos)
        
        print(f"📊 Ingresos sin embeddings: {total}")
        
        if total == 0:
            print("✅ Todos los ingresos ya tienen embeddings")
            return
        
        print("\n🚀 Iniciando procesamiento...\n")
        
        for i, ingreso in enumerate(ingresos, 1):
            try:
                self.stats['ingresos_procesados'] += 1
                
                # Generar texto
                texto = self._generar_texto_ingreso(ingreso)
                
                # Generar embedding
                print(f"[{i}/{total}] Procesando ingreso #{ingreso.id_ingreso}...", end=" ")
                embedding = self.embeddings_service.generate_embedding(texto)
                
                if not embedding:
                    print("❌ Error generando embedding")
                    self.stats['ingresos_errores'] += 1
                    continue
                
                # Crear registro de embedding
                ingreso_embedding = IngresoEmbedding(
                    ingreso_id=ingreso.id_ingreso,
                    embedding=embedding,
                    texto_original=texto,
                    metadata_=self._generar_metadata_ingreso(ingreso)
                )
                
                db.add(ingreso_embedding)
                db.commit()
                
                print("✅")
                self.stats['ingresos_creados'] += 1
                
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                self.stats['ingresos_errores'] += 1
                db.rollback()
                continue
        
        print("\n" + "-"*60)
        print(f"✅ Ingresos procesados: {self.stats['ingresos_procesados']}")
        print(f"✅ Embeddings creados: {self.stats['ingresos_creados']}")
        print(f"❌ Errores: {self.stats['ingresos_errores']}")
        print("-"*60)
    
    def imprimir_resumen_final(self):
        """Imprime resumen final de la migración"""
        print("\n" + "="*60)
        print("📊 RESUMEN FINAL DE MIGRACIÓN")
        print("="*60)
        print(f"Gastos:")
        print(f"  • Procesados: {self.stats['gastos_procesados']}")
        print(f"  • Embeddings creados: {self.stats['gastos_creados']}")
        print(f"  • Errores: {self.stats['gastos_errores']}")
        print(f"\nIngresos:")
        print(f"  • Procesados: {self.stats['ingresos_procesados']}")
        print(f"  • Embeddings creados: {self.stats['ingresos_creados']}")
        print(f"  • Errores: {self.stats['ingresos_errores']}")
        print(f"\nTotal:")
        total_procesados = self.stats['gastos_procesados'] + self.stats['ingresos_procesados']
        total_creados = self.stats['gastos_creados'] + self.stats['ingresos_creados']
        total_errores = self.stats['gastos_errores'] + self.stats['ingresos_errores']
        print(f"  • Total procesados: {total_procesados}")
        print(f"  • Total embeddings creados: {total_creados}")
        print(f"  • Total errores: {total_errores}")
        
        if total_errores == 0 and total_creados > 0:
            print(f"\n✅ ¡Migración completada exitosamente!")
        elif total_errores > 0:
            print(f"\n⚠️ Migración completada con {total_errores} errores")
        else:
            print(f"\nℹ️ No había datos para migrar")
        
        print("="*60 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Migra embeddings para gastos e ingresos existentes"
    )
    parser.add_argument(
        '--tipo',
        choices=['gasto', 'ingreso', 'all'],
        default='all',
        help='Tipo de datos a migrar (default: all)'
    )
    parser.add_argument(
        '--limite',
        type=int,
        default=None,
        help='Límite de registros a procesar por tipo (default: todos)'
    )
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("🚀 SCRIPT DE MIGRACIÓN DE EMBEDDINGS")
    print("="*60)
    print(f"Tipo: {args.tipo}")
    print(f"Límite: {args.limite if args.limite else 'Sin límite'}")
    print("="*60)
    
    # Crear migrador
    migrator = EmbeddingsMigrator()
    
    # Obtener sesión de base de datos
    db = SessionLocal()
    
    try:
        if args.tipo in ['gasto', 'all']:
            migrator.migrar_gastos(db, limite=args.limite)
        
        if args.tipo in ['ingreso', 'all']:
            migrator.migrar_ingresos(db, limite=args.limite)
        
        # Resumen final
        migrator.imprimir_resumen_final()
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Migración interrumpida por el usuario")
        migrator.imprimir_resumen_final()
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
