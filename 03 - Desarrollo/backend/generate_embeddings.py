#!/usr/bin/env python3
"""
Script de Migración de Embeddings
==================================
Genera embeddings para todos los gastos e ingresos existentes en la base de datos.

Este script debe ejecutarse UNA VEZ después de instalar pgvector para poblar
las tablas gastos_embeddings y ingresos_embeddings con los datos históricos.

Uso:
    python generate_embeddings.py [--batch-size 100] [--usuarios ID1,ID2,...] [--force]

Opciones:
    --batch-size: Número de registros a procesar por lote (default: 100)
    --usuarios: IDs de usuarios específicos (default: todos)
    --force: Regenerar embeddings existentes

Autor: Sistema de Analizador Financiero
Fecha: 11 noviembre 2025
"""

import os
import sys
import argparse
import logging
from typing import List, Optional

# Agregar el directorio del backend al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from app.models.gasto import Gasto
from app.models.ingreso import Ingreso
from app.models.embeddings import GastoEmbedding, IngresoEmbedding
from app.services.embeddings_service import EmbeddingsService

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Generar embeddings para gastos e ingresos existentes'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Número de registros por lote (default: 100)'
    )
    parser.add_argument(
        '--usuarios',
        type=str,
        help='IDs de usuarios separados por coma (ej: 1,2,3)'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Regenerar embeddings existentes'
    )
    parser.add_argument(
        '--only-gastos',
        action='store_true',
        help='Solo procesar gastos'
    )
    parser.add_argument(
        '--only-ingresos',
        action='store_true',
        help='Solo procesar ingresos'
    )
    return parser.parse_args()


def get_database_session():
    """Crear sesión de base de datos."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL no está configurada en .env")
    
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def migrate_gastos(
    db,
    embeddings_service: EmbeddingsService,
    batch_size: int,
    usuario_ids: Optional[List[int]],
    force: bool
):
    """
    Migrar embeddings de gastos.
    
    Args:
        db: Sesión de base de datos
        embeddings_service: Servicio de embeddings
        batch_size: Tamaño del lote
        usuario_ids: IDs de usuarios a procesar (None = todos)
        force: Regenerar embeddings existentes
    """
    logger.info("=" * 60)
    logger.info("MIGRANDO GASTOS")
    logger.info("=" * 60)
    
    # Obtener gastos
    query = db.query(Gasto)
    if usuario_ids:
        query = query.filter(Gasto.id_usuario.in_(usuario_ids))
    
    total_gastos = query.count()
    logger.info(f"Total de gastos a procesar: {total_gastos}")
    
    if total_gastos == 0:
        logger.warning("No hay gastos para procesar")
        return
    
    # Procesar en lotes
    processed = 0
    skipped = 0
    errors = 0
    
    for offset in range(0, total_gastos, batch_size):
        gastos_batch = query.offset(offset).limit(batch_size).all()
        logger.info(f"\nProcesando lote {offset // batch_size + 1}: registros {offset + 1} a {offset + len(gastos_batch)}")
        
        for gasto in gastos_batch:
            try:
                # Verificar si ya existe embedding
                existing = db.query(GastoEmbedding).filter(
                    GastoEmbedding.gasto_id == gasto.id_gasto
                ).first()
                
                if existing and not force:
                    skipped += 1
                    continue
                
                # Construir texto
                gasto_dict = {
                    "descripcion": gasto.descripcion,
                    "categoria": gasto.categoria.nombre if gasto.categoria else None,
                    "monto": gasto.monto,
                    "moneda": gasto.moneda,
                    "fecha": gasto.fecha,
                    "comercio": gasto.comercio
                }
                
                texto = embeddings_service.build_gasto_text(gasto_dict)
                
                # Generar embedding
                embedding = embeddings_service.generate_embedding(texto)
                
                if not embedding:
                    logger.error(f"Error generando embedding para gasto {gasto.id_gasto}")
                    errors += 1
                    continue
                
                # Guardar o actualizar
                metadata = embeddings_service.build_metadata(gasto_dict, "gasto")
                
                if existing and force:
                    # Actualizar
                    existing.embedding = embedding
                    existing.texto_original = texto
                    existing.metadata = metadata
                    logger.debug(f"Actualizado embedding para gasto {gasto.id_gasto}")
                else:
                    # Crear nuevo
                    gasto_embedding = GastoEmbedding(
                        gasto_id=gasto.id_gasto,
                        embedding=embedding,
                        texto_original=texto,
                        metadata=metadata
                    )
                    db.add(gasto_embedding)
                    logger.debug(f"Creado embedding para gasto {gasto.id_gasto}")
                
                processed += 1
                
                # Commit cada 10 registros
                if processed % 10 == 0:
                    db.commit()
                    logger.info(f"Progreso: {processed} procesados, {skipped} omitidos, {errors} errores")
            
            except Exception as e:
                logger.error(f"Error procesando gasto {gasto.id_gasto}: {str(e)}")
                errors += 1
                db.rollback()
        
        # Commit final del lote
        db.commit()
    
    logger.info("\n" + "=" * 60)
    logger.info("RESUMEN GASTOS")
    logger.info("=" * 60)
    logger.info(f"Total: {total_gastos}")
    logger.info(f"Procesados: {processed}")
    logger.info(f"Omitidos: {skipped}")
    logger.info(f"Errores: {errors}")


def migrate_ingresos(
    db,
    embeddings_service: EmbeddingsService,
    batch_size: int,
    usuario_ids: Optional[List[int]],
    force: bool
):
    """
    Migrar embeddings de ingresos.
    
    Args:
        db: Sesión de base de datos
        embeddings_service: Servicio de embeddings
        batch_size: Tamaño del lote
        usuario_ids: IDs de usuarios a procesar (None = todos)
        force: Regenerar embeddings existentes
    """
    logger.info("=" * 60)
    logger.info("MIGRANDO INGRESOS")
    logger.info("=" * 60)
    
    # Obtener ingresos
    query = db.query(Ingreso)
    if usuario_ids:
        query = query.filter(Ingreso.id_usuario.in_(usuario_ids))
    
    total_ingresos = query.count()
    logger.info(f"Total de ingresos a procesar: {total_ingresos}")
    
    if total_ingresos == 0:
        logger.warning("No hay ingresos para procesar")
        return
    
    # Procesar en lotes
    processed = 0
    skipped = 0
    errors = 0
    
    for offset in range(0, total_ingresos, batch_size):
        ingresos_batch = query.offset(offset).limit(batch_size).all()
        logger.info(f"\nProcesando lote {offset // batch_size + 1}: registros {offset + 1} a {offset + len(ingresos_batch)}")
        
        for ingreso in ingresos_batch:
            try:
                # Verificar si ya existe embedding
                existing = db.query(IngresoEmbedding).filter(
                    IngresoEmbedding.ingreso_id == ingreso.id_ingreso
                ).first()
                
                if existing and not force:
                    skipped += 1
                    continue
                
                # Construir texto
                ingreso_dict = {
                    "descripcion": ingreso.descripcion,
                    "categoria": ingreso.categoria.nombre if ingreso.categoria else None,
                    "monto": ingreso.monto,
                    "moneda": ingreso.moneda,
                    "fecha": ingreso.fecha
                }
                
                texto = embeddings_service.build_ingreso_text(ingreso_dict)
                
                # Generar embedding
                embedding = embeddings_service.generate_embedding(texto)
                
                if not embedding:
                    logger.error(f"Error generando embedding para ingreso {ingreso.id_ingreso}")
                    errors += 1
                    continue
                
                # Guardar o actualizar
                metadata = embeddings_service.build_metadata(ingreso_dict, "ingreso")
                
                if existing and force:
                    # Actualizar
                    existing.embedding = embedding
                    existing.texto_original = texto
                    existing.metadata = metadata
                    logger.debug(f"Actualizado embedding para ingreso {ingreso.id_ingreso}")
                else:
                    # Crear nuevo
                    ingreso_embedding = IngresoEmbedding(
                        ingreso_id=ingreso.id_ingreso,
                        embedding=embedding,
                        texto_original=texto,
                        metadata=metadata
                    )
                    db.add(ingreso_embedding)
                    logger.debug(f"Creado embedding para ingreso {ingreso.id_ingreso}")
                
                processed += 1
                
                # Commit cada 10 registros
                if processed % 10 == 0:
                    db.commit()
                    logger.info(f"Progreso: {processed} procesados, {skipped} omitidos, {errors} errores")
            
            except Exception as e:
                logger.error(f"Error procesando ingreso {ingreso.id_ingreso}: {str(e)}")
                errors += 1
                db.rollback()
        
        # Commit final del lote
        db.commit()
    
    logger.info("\n" + "=" * 60)
    logger.info("RESUMEN INGRESOS")
    logger.info("=" * 60)
    logger.info(f"Total: {total_ingresos}")
    logger.info(f"Procesados: {processed}")
    logger.info(f"Omitidos: {skipped}")
    logger.info(f"Errores: {errors}")


def main():
    """Función principal."""
    args = parse_arguments()
    
    logger.info("=" * 60)
    logger.info("SCRIPT DE MIGRACIÓN DE EMBEDDINGS")
    logger.info("=" * 60)
    logger.info(f"Batch size: {args.batch_size}")
    logger.info(f"Force regenerate: {args.force}")
    logger.info(f"Only gastos: {args.only_gastos}")
    logger.info(f"Only ingresos: {args.only_ingresos}")
    
    # Parsear usuarios
    usuario_ids = None
    if args.usuarios:
        usuario_ids = [int(u.strip()) for u in args.usuarios.split(',')]
        logger.info(f"Usuarios: {usuario_ids}")
    else:
        logger.info("Usuarios: TODOS")
    
    # Conectar a base de datos
    try:
        db = get_database_session()
        logger.info("✓ Conexión a base de datos establecida")
    except Exception as e:
        logger.error(f"Error conectando a base de datos: {str(e)}")
        return 1
    
    # Inicializar servicio de embeddings
    try:
        embeddings_service = EmbeddingsService()
        logger.info("✓ Servicio de embeddings inicializado")
    except Exception as e:
        logger.error(f"Error inicializando servicio de embeddings: {str(e)}")
        return 1
    
    # Migrar gastos
    if not args.only_ingresos:
        try:
            migrate_gastos(db, embeddings_service, args.batch_size, usuario_ids, args.force)
        except Exception as e:
            logger.error(f"Error migrando gastos: {str(e)}")
            db.rollback()
    
    # Migrar ingresos
    if not args.only_gastos:
        try:
            migrate_ingresos(db, embeddings_service, args.batch_size, usuario_ids, args.force)
        except Exception as e:
            logger.error(f"Error migrando ingresos: {str(e)}")
            db.rollback()
    
    # Cerrar sesión
    db.close()
    
    logger.info("\n" + "=" * 60)
    logger.info("MIGRACIÓN COMPLETADA")
    logger.info("=" * 60)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
