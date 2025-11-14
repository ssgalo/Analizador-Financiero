#!/usr/bin/env python3
"""
Script: test_migration.py
Descripción: Verifica que la migración de pgvector se haya completado correctamente
Autor: Sistema de Analizador Financiero
Fecha: 11 noviembre 2025

Uso:
    python scripts/test_migration.py [--verbose]
"""

import sys
import os
import argparse
from typing import Dict, List, Any, Tuple

# Agregar directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.core.database import engine

# Colores para output
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color


class MigrationTester:
    """Tester para verificar la migración de pgvector."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.tests_passed = 0
        self.tests_failed = 0
        self.warnings = 0
    
    def print_header(self, title: str):
        """Imprime un header formateado."""
        print("\n" + "=" * 70)
        print(title)
        print("=" * 70 + "\n")
    
    def print_success(self, message: str):
        """Imprime mensaje de éxito."""
        print(f"{GREEN}✅ {message}{NC}")
        self.tests_passed += 1
    
    def print_error(self, message: str):
        """Imprime mensaje de error."""
        print(f"{RED}❌ {message}{NC}")
        self.tests_failed += 1
    
    def print_warning(self, message: str):
        """Imprime mensaje de advertencia."""
        print(f"{YELLOW}⚠️  {message}{NC}")
        self.warnings += 1
    
    def print_info(self, message: str):
        """Imprime mensaje informativo."""
        print(f"{BLUE}ℹ️  {message}{NC}")
    
    def test_connection(self) -> bool:
        """Test 1: Verificar conexión a la base de datos."""
        self.print_header("TEST 1: CONEXIÓN A BASE DE DATOS")
        
        try:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT version();"))
                version = result.scalar()
                
                self.print_success("Conexión establecida correctamente")
                if self.verbose:
                    self.print_info(f"PostgreSQL version: {version}")
                
                return True
        except Exception as e:
            self.print_error(f"No se pudo conectar a la base de datos: {str(e)}")
            return False
    
    def test_pgvector_extension(self) -> bool:
        """Test 2: Verificar extensión pgvector instalada."""
        self.print_header("TEST 2: EXTENSIÓN PGVECTOR")
        
        try:
            with engine.connect() as conn:
                # Verificar si la extensión existe
                result = conn.execute(text("""
                    SELECT extname, extversion 
                    FROM pg_extension 
                    WHERE extname = 'vector';
                """))
                
                extension = result.fetchone()
                
                if extension:
                    self.print_success(f"Extensión pgvector instalada (versión: {extension[1]})")
                    
                    # Verificar operadores disponibles
                    result = conn.execute(text("""
                        SELECT COUNT(*) 
                        FROM pg_operator 
                        WHERE oprname IN ('<->', '<=>', '<#>');
                    """))
                    
                    operator_count = result.scalar()
                    
                    if operator_count >= 3:
                        self.print_success(f"Operadores vectoriales disponibles: {operator_count}")
                    else:
                        self.print_warning(f"Solo {operator_count} operadores encontrados (esperados: 3+)")
                    
                    return True
                else:
                    self.print_error("Extensión pgvector NO instalada")
                    return False
                    
        except Exception as e:
            self.print_error(f"Error verificando extensión: {str(e)}")
            return False
    
    def test_embeddings_tables(self) -> bool:
        """Test 3: Verificar tablas de embeddings creadas."""
        self.print_header("TEST 3: TABLAS DE EMBEDDINGS")
        
        try:
            inspector = inspect(engine)
            all_tables = inspector.get_table_names()
            
            required_tables = ['gastos_embeddings', 'ingresos_embeddings']
            found_tables = []
            
            for table in required_tables:
                if table in all_tables:
                    found_tables.append(table)
                    self.print_success(f"Tabla '{table}' existe")
                else:
                    self.print_error(f"Tabla '{table}' NO encontrada")
            
            if len(found_tables) == len(required_tables):
                return True
            else:
                return False
                
        except Exception as e:
            self.print_error(f"Error verificando tablas: {str(e)}")
            return False
    
    def test_table_structure(self) -> bool:
        """Test 4: Verificar estructura de tablas."""
        self.print_header("TEST 4: ESTRUCTURA DE TABLAS")
        
        all_good = True
        
        try:
            with engine.connect() as conn:
                # Verificar columnas de gastos_embeddings
                result = conn.execute(text("""
                    SELECT column_name, data_type, udt_name
                    FROM information_schema.columns
                    WHERE table_name = 'gastos_embeddings'
                    ORDER BY ordinal_position;
                """))
                
                gastos_columns = result.fetchall()
                
                if gastos_columns:
                    self.print_success("Tabla 'gastos_embeddings' tiene columnas")
                    
                    # Verificar columna vector
                    vector_col = [col for col in gastos_columns if col[0] == 'embedding']
                    
                    if vector_col and vector_col[0][2] == 'vector':
                        self.print_success("Columna 'embedding' es tipo VECTOR")
                        
                        # Verificar dimensiones
                        dim_result = conn.execute(text("""
                            SELECT atttypmod 
                            FROM pg_attribute 
                            WHERE attrelid = 'gastos_embeddings'::regclass 
                            AND attname = 'embedding';
                        """))
                        
                        dim = dim_result.scalar()
                        expected_dim = 1536
                        
                        if dim == expected_dim:
                            self.print_success(f"Dimensión del vector: {dim}")
                        else:
                            self.print_warning(f"Dimensión del vector: {dim} (esperado: {expected_dim})")
                    else:
                        self.print_error("Columna 'embedding' NO es tipo VECTOR")
                        all_good = False
                    
                    if self.verbose:
                        self.print_info("Columnas de gastos_embeddings:")
                        for col in gastos_columns:
                            print(f"   - {col[0]}: {col[1]}")
                else:
                    self.print_error("Tabla 'gastos_embeddings' no tiene columnas")
                    all_good = False
                
                # Verificar ingresos_embeddings
                result = conn.execute(text("""
                    SELECT column_name, data_type, udt_name
                    FROM information_schema.columns
                    WHERE table_name = 'ingresos_embeddings'
                    ORDER BY ordinal_position;
                """))
                
                ingresos_columns = result.fetchall()
                
                if ingresos_columns:
                    self.print_success("Tabla 'ingresos_embeddings' tiene columnas")
                    
                    if self.verbose:
                        self.print_info("Columnas de ingresos_embeddings:")
                        for col in ingresos_columns:
                            print(f"   - {col[0]}: {col[1]}")
                else:
                    self.print_error("Tabla 'ingresos_embeddings' no tiene columnas")
                    all_good = False
                
                return all_good
                
        except Exception as e:
            self.print_error(f"Error verificando estructura: {str(e)}")
            return False
    
    def test_indexes(self) -> bool:
        """Test 5: Verificar índices vectoriales."""
        self.print_header("TEST 5: ÍNDICES VECTORIALES")
        
        try:
            with engine.connect() as conn:
                # Verificar índices en gastos_embeddings
                result = conn.execute(text("""
                    SELECT indexname, indexdef
                    FROM pg_indexes
                    WHERE tablename = 'gastos_embeddings'
                    AND indexdef LIKE '%ivfflat%';
                """))
                
                gastos_indexes = result.fetchall()
                
                if gastos_indexes:
                    self.print_success(f"Índices IVFFlat en gastos_embeddings: {len(gastos_indexes)}")
                    
                    if self.verbose:
                        for idx in gastos_indexes:
                            self.print_info(f"   - {idx[0]}")
                else:
                    self.print_warning("No se encontraron índices IVFFlat en gastos_embeddings")
                
                # Verificar índices en ingresos_embeddings
                result = conn.execute(text("""
                    SELECT indexname, indexdef
                    FROM pg_indexes
                    WHERE tablename = 'ingresos_embeddings'
                    AND indexdef LIKE '%ivfflat%';
                """))
                
                ingresos_indexes = result.fetchall()
                
                if ingresos_indexes:
                    self.print_success(f"Índices IVFFlat en ingresos_embeddings: {len(ingresos_indexes)}")
                    
                    if self.verbose:
                        for idx in ingresos_indexes:
                            self.print_info(f"   - {idx[0]}")
                else:
                    self.print_warning("No se encontraron índices IVFFlat en ingresos_embeddings")
                
                return True
                
        except Exception as e:
            self.print_error(f"Error verificando índices: {str(e)}")
            return False
    
    def test_foreign_keys(self) -> bool:
        """Test 6: Verificar foreign keys."""
        self.print_header("TEST 6: FOREIGN KEYS")
        
        try:
            with engine.connect() as conn:
                # Verificar FK en gastos_embeddings
                result = conn.execute(text("""
                    SELECT constraint_name, table_name, column_name
                    FROM information_schema.key_column_usage
                    WHERE table_name = 'gastos_embeddings'
                    AND constraint_name LIKE '%fk%';
                """))
                
                gastos_fks = result.fetchall()
                
                if len(gastos_fks) >= 2:  # FK a gastos y usuarios
                    self.print_success(f"Foreign keys en gastos_embeddings: {len(gastos_fks)}")
                    
                    if self.verbose:
                        for fk in gastos_fks:
                            self.print_info(f"   - {fk[0]}: {fk[2]}")
                else:
                    self.print_warning(f"Solo {len(gastos_fks)} foreign keys en gastos_embeddings (esperados: 2)")
                
                # Verificar FK en ingresos_embeddings
                result = conn.execute(text("""
                    SELECT constraint_name, table_name, column_name
                    FROM information_schema.key_column_usage
                    WHERE table_name = 'ingresos_embeddings'
                    AND constraint_name LIKE '%fk%';
                """))
                
                ingresos_fks = result.fetchall()
                
                if len(ingresos_fks) >= 2:  # FK a ingresos y usuarios
                    self.print_success(f"Foreign keys en ingresos_embeddings: {len(ingresos_fks)}")
                    
                    if self.verbose:
                        for fk in ingresos_fks:
                            self.print_info(f"   - {fk[0]}: {fk[2]}")
                else:
                    self.print_warning(f"Solo {len(ingresos_fks)} foreign keys en ingresos_embeddings (esperados: 2)")
                
                return True
                
        except Exception as e:
            self.print_error(f"Error verificando foreign keys: {str(e)}")
            return False
    
    def test_search_functions(self) -> bool:
        """Test 7: Verificar funciones de búsqueda."""
        self.print_header("TEST 7: FUNCIONES DE BÚSQUEDA VECTORIAL")
        
        try:
            with engine.connect() as conn:
                # Buscar funciones relacionadas con embeddings
                result = conn.execute(text("""
                    SELECT proname, pronargs
                    FROM pg_proc
                    WHERE proname LIKE '%embedding%' OR proname LIKE '%vector%'
                    ORDER BY proname;
                """))
                
                functions = result.fetchall()
                
                if functions:
                    self.print_success(f"Funciones encontradas: {len(functions)}")
                    
                    # Buscar funciones específicas
                    expected_functions = [
                        'search_gastos_by_vector',
                        'search_ingresos_by_vector',
                        'search_combined_by_vector',
                        'get_embedding_stats'
                    ]
                    
                    function_names = [f[0] for f in functions]
                    
                    for expected in expected_functions:
                        if expected in function_names:
                            self.print_success(f"Función '{expected}' existe")
                        else:
                            self.print_warning(f"Función '{expected}' NO encontrada")
                    
                    if self.verbose:
                        self.print_info("Todas las funciones:")
                        for func in functions:
                            print(f"   - {func[0]} ({func[1]} args)")
                else:
                    self.print_warning("No se encontraron funciones de búsqueda")
                
                return True
                
        except Exception as e:
            self.print_error(f"Error verificando funciones: {str(e)}")
            return False
    
    def test_data_integrity(self) -> bool:
        """Test 8: Verificar integridad de datos."""
        self.print_header("TEST 8: INTEGRIDAD DE DATOS")
        
        try:
            with engine.connect() as conn:
                # Contar gastos totales
                result = conn.execute(text("SELECT COUNT(*) FROM gastos;"))
                total_gastos = result.scalar()
                
                # Contar embeddings de gastos
                result = conn.execute(text("SELECT COUNT(*) FROM gastos_embeddings;"))
                total_gastos_emb = result.scalar()
                
                self.print_info(f"Gastos totales: {total_gastos}")
                self.print_info(f"Embeddings de gastos: {total_gastos_emb}")
                
                if total_gastos_emb > 0:
                    coverage = (total_gastos_emb / total_gastos * 100) if total_gastos > 0 else 0
                    self.print_success(f"Cobertura de gastos: {coverage:.1f}%")
                else:
                    self.print_warning("No hay embeddings de gastos generados")
                
                # Contar ingresos totales
                result = conn.execute(text("SELECT COUNT(*) FROM ingresos;"))
                total_ingresos = result.scalar()
                
                # Contar embeddings de ingresos
                result = conn.execute(text("SELECT COUNT(*) FROM ingresos_embeddings;"))
                total_ingresos_emb = result.scalar()
                
                self.print_info(f"Ingresos totales: {total_ingresos}")
                self.print_info(f"Embeddings de ingresos: {total_ingresos_emb}")
                
                if total_ingresos_emb > 0:
                    coverage = (total_ingresos_emb / total_ingresos * 100) if total_ingresos > 0 else 0
                    self.print_success(f"Cobertura de ingresos: {coverage:.1f}%")
                else:
                    self.print_warning("No hay embeddings de ingresos generados")
                
                # Verificar que no haya embeddings huérfanos (sin gasto/ingreso asociado)
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM gastos_embeddings ge
                    LEFT JOIN gastos g ON ge.id_gasto = g.id
                    WHERE g.id IS NULL;
                """))
                
                orphan_gastos = result.scalar()
                
                if orphan_gastos > 0:
                    self.print_warning(f"Embeddings de gastos huérfanos: {orphan_gastos}")
                else:
                    self.print_success("No hay embeddings de gastos huérfanos")
                
                result = conn.execute(text("""
                    SELECT COUNT(*) 
                    FROM ingresos_embeddings ie
                    LEFT JOIN ingresos i ON ie.id_ingreso = i.id
                    WHERE i.id IS NULL;
                """))
                
                orphan_ingresos = result.scalar()
                
                if orphan_ingresos > 0:
                    self.print_warning(f"Embeddings de ingresos huérfanos: {orphan_ingresos}")
                else:
                    self.print_success("No hay embeddings de ingresos huérfanos")
                
                return True
                
        except Exception as e:
            self.print_error(f"Error verificando integridad: {str(e)}")
            return False
    
    def test_vector_operations(self) -> bool:
        """Test 9: Verificar operaciones vectoriales."""
        self.print_header("TEST 9: OPERACIONES VECTORIALES")
        
        try:
            with engine.connect() as conn:
                # Verificar que podemos crear vectores
                result = conn.execute(text("""
                    SELECT '[1,2,3]'::vector(3);
                """))
                
                vector = result.scalar()
                
                if vector:
                    self.print_success("Creación de vectores funciona")
                else:
                    self.print_error("No se pueden crear vectores")
                    return False
                
                # Verificar operadores de distancia
                result = conn.execute(text("""
                    SELECT 
                        '[1,2,3]'::vector(3) <-> '[4,5,6]'::vector(3) as euclidean,
                        '[1,2,3]'::vector(3) <=> '[4,5,6]'::vector(3) as cosine;
                """))
                
                distances = result.fetchone()
                
                if distances:
                    self.print_success(f"Distancia euclidiana: {distances[0]:.4f}")
                    self.print_success(f"Distancia coseno: {distances[1]:.4f}")
                else:
                    self.print_error("Operadores de distancia no funcionan")
                    return False
                
                return True
                
        except Exception as e:
            self.print_error(f"Error verificando operaciones vectoriales: {str(e)}")
            return False
    
    def print_summary(self):
        """Imprime resumen de tests."""
        self.print_header("RESUMEN DE TESTS")
        
        total_tests = self.tests_passed + self.tests_failed
        
        print(f"Total de tests: {total_tests}")
        print(f"{GREEN}✅ Pasados: {self.tests_passed}{NC}")
        print(f"{RED}❌ Fallidos: {self.tests_failed}{NC}")
        print(f"{YELLOW}⚠️  Advertencias: {self.warnings}{NC}")
        print()
        
        if self.tests_failed == 0:
            print(f"{GREEN}🎉 ¡Todos los tests pasaron exitosamente!{NC}")
            
            if self.warnings > 0:
                print(f"{YELLOW}⚠️  Hay {self.warnings} advertencias que deberías revisar{NC}")
            
            return 0
        else:
            print(f"{RED}❌ {self.tests_failed} tests fallaron{NC}")
            print(f"{RED}La migración NO está completa{NC}")
            return 1
    
    def run_all_tests(self) -> int:
        """Ejecuta todos los tests."""
        self.print_header("VERIFICACIÓN DE MIGRACIÓN PGVECTOR")
        
        # Test 1: Conexión
        if not self.test_connection():
            print(f"\n{RED}❌ No se pudo conectar a la base de datos. Abortando.{NC}")
            return 1
        
        # Test 2: Extensión pgvector
        self.test_pgvector_extension()
        
        # Test 3: Tablas de embeddings
        self.test_embeddings_tables()
        
        # Test 4: Estructura de tablas
        self.test_table_structure()
        
        # Test 5: Índices
        self.test_indexes()
        
        # Test 6: Foreign keys
        self.test_foreign_keys()
        
        # Test 7: Funciones de búsqueda
        self.test_search_functions()
        
        # Test 8: Integridad de datos
        self.test_data_integrity()
        
        # Test 9: Operaciones vectoriales
        self.test_vector_operations()
        
        # Resumen
        return self.print_summary()


def main():
    """Función principal."""
    parser = argparse.ArgumentParser(
        description="Verifica que la migración de pgvector se haya completado correctamente"
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Muestra información detallada'
    )
    
    args = parser.parse_args()
    
    tester = MigrationTester(verbose=args.verbose)
    exit_code = tester.run_all_tests()
    
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
