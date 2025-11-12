#!/usr/bin/env python3
"""
Script de Benchmark: Comparación de performance con y sin embeddings
Autor: Sistema de Analizador Financiero
Fecha: 12 noviembre 2025

Este script mide y compara métricas de performance entre:
1. Sistema ACTUAL (sin embeddings - trae todos los datos)
2. Sistema NUEVO (con embeddings - trae solo relevantes)

Métricas medidas:
- Tiempo de respuesta
- Tokens consumidos
- Costo estimado por consulta
- Número de registros procesados
- Calidad de respuesta (subjetivo)
"""

import sys
import os
import time
import statistics
from typing import Dict, List, Tuple
from datetime import datetime
import json

# Agregar directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_db
from app.services.embeddings_service import EmbeddingsService
from app.services.vector_search_service import VectorSearchService
from app.services.context_builder_service import ContextBuilderService
from sqlalchemy import select, func
from app.models.gasto import Gasto
from app.models.ingreso import Ingreso


class BenchmarkEmbeddings:
    """Benchmark de performance para embeddings."""
    
    def __init__(self):
        self.embeddings_service = EmbeddingsService()
        self.vector_search_service = VectorSearchService()
        self.context_builder_service = ContextBuilderService()
        
        self.results = {
            'sin_embeddings': {
                'tiempos': [],
                'tokens': [],
                'costos': [],
                'registros': []
            },
            'con_embeddings': {
                'tiempos': [],
                'tokens': [],
                'costos': [],
                'registros': []
            }
        }
        
        # Queries de prueba
        self.test_queries = [
            "¿Cuánto gasté en supermercados este mes?",
            "¿Cuáles fueron mis mayores gastos?",
            "¿Cuánto cobré de salario?",
            "Gastos en transporte",
            "Ingresos por freelance",
            "Balance de noviembre",
            "Gastos en restaurantes",
            "¿Cuánto gasté en salud?",
            "Ingresos del último trimestre",
            "Análisis de gastos en entretenimiento"
        ]
    
    def print_header(self, title: str):
        """Imprime un header formateado."""
        print("\n" + "=" * 80)
        print(title.center(80))
        print("=" * 80 + "\n")
    
    def estimate_tokens(self, text: str) -> int:
        """Estima cantidad de tokens (4 chars ≈ 1 token)."""
        return len(text) // 4
    
    def calculate_cost(self, embedding_tokens: int, gpt4_tokens: int) -> float:
        """Calcula costo total de una consulta."""
        # Embeddings: $0.02 per 1M tokens
        embedding_cost = (embedding_tokens / 1_000_000) * 0.02
        
        # GPT-4: ~$0.03 per 1K input tokens
        gpt4_cost = (gpt4_tokens / 1000) * 0.03
        
        return embedding_cost + gpt4_cost
    
    def benchmark_sin_embeddings(self, user_id: int, db) -> Dict:
        """Simula método ACTUAL: traer todos los datos."""
        start_time = time.time()
        
        # Obtener TODOS los gastos del usuario
        gastos = db.execute(
            select(Gasto).where(Gasto.id_usuario == user_id)
        ).scalars().all()
        
        # Obtener TODOS los ingresos del usuario
        ingresos = db.execute(
            select(Ingreso).where(Ingreso.id_usuario == user_id)
        ).scalars().all()
        
        # Construir contexto ENORME con todos los datos
        context_parts = []
        
        context_parts.append("GASTOS:\n")
        for gasto in gastos:
            context_parts.append(
                f"- {gasto.fecha}: ${gasto.monto} en {gasto.comercio or 'N/A'} "
                f"({gasto.categoria.nombre if gasto.categoria else 'Sin categoría'}) "
                f"- {gasto.descripcion or 'Sin descripción'}\n"
            )
        
        context_parts.append("\nINGRESOS:\n")
        for ingreso in ingresos:
            context_parts.append(
                f"- {ingreso.fecha}: ${ingreso.monto} de {ingreso.origen or 'N/A'} "
                f"({ingreso.categoria.nombre if ingreso.categoria else 'Sin categoría'}) "
                f"- {ingreso.descripcion or 'Sin descripción'}\n"
            )
        
        context = "".join(context_parts)
        
        end_time = time.time()
        
        return {
            'tiempo': end_time - start_time,
            'tokens': self.estimate_tokens(context),
            'registros': len(gastos) + len(ingresos),
            'context_size': len(context)
        }
    
    def benchmark_con_embeddings(self, query: str, user_id: int, db) -> Dict:
        """Método NUEVO: búsqueda vectorial."""
        start_time = time.time()
        
        # Paso 1: Generar embedding de la query (cuenta tokens)
        query_tokens = self.estimate_tokens(query)
        
        # Paso 2: Buscar con vector search (solo trae relevantes)
        results = self.vector_search_service.search_combined(
            query=query,
            user_id=user_id,
            limit=15,
            db=db
        )
        
        # Paso 3: Construir contexto reducido
        context = self.context_builder_service.build_context_from_results(
            results=results,
            user_id=user_id
        )
        
        end_time = time.time()
        
        return {
            'tiempo': end_time - start_time,
            'tokens': self.estimate_tokens(context) + query_tokens,
            'registros': len(results),
            'context_size': len(context),
            'query_tokens': query_tokens
        }
    
    def run_single_benchmark(self, query: str, user_id: int, db) -> Tuple[Dict, Dict]:
        """Ejecuta un benchmark para una query."""
        print(f"📝 Query: {query}")
        
        # Método actual (sin embeddings)
        print("   ⏳ Ejecutando SIN embeddings...", end="", flush=True)
        sin_emb = self.benchmark_sin_embeddings(user_id, db)
        print(" ✅")
        
        # Método nuevo (con embeddings)
        print("   ⏳ Ejecutando CON embeddings...", end="", flush=True)
        con_emb = self.benchmark_con_embeddings(query, user_id, db)
        print(" ✅")
        
        # Calcular costos
        sin_emb['costo'] = self.calculate_cost(0, sin_emb['tokens'])
        con_emb['costo'] = self.calculate_cost(con_emb.get('query_tokens', 10), con_emb['tokens'])
        
        # Mostrar comparación
        print(f"\n   📊 Resultados:")
        print(f"      SIN embeddings: {sin_emb['tiempo']:.3f}s, {sin_emb['tokens']} tokens, "
              f"{sin_emb['registros']} registros, ${sin_emb['costo']:.4f}")
        print(f"      CON embeddings: {con_emb['tiempo']:.3f}s, {con_emb['tokens']} tokens, "
              f"{con_emb['registros']} registros, ${con_emb['costo']:.4f}")
        
        # Mejoras
        mejora_tiempo = ((sin_emb['tiempo'] - con_emb['tiempo']) / sin_emb['tiempo']) * 100
        mejora_tokens = ((sin_emb['tokens'] - con_emb['tokens']) / sin_emb['tokens']) * 100
        mejora_costo = ((sin_emb['costo'] - con_emb['costo']) / sin_emb['costo']) * 100
        
        print(f"\n   ✨ Mejoras:")
        print(f"      Tiempo: {mejora_tiempo:+.1f}%")
        print(f"      Tokens: {mejora_tokens:+.1f}%")
        print(f"      Costo: {mejora_costo:+.1f}%")
        print()
        
        return sin_emb, con_emb
    
    def run_all_benchmarks(self, user_id: int = 1):
        """Ejecuta todos los benchmarks."""
        self.print_header("BENCHMARK: EMBEDDINGS VS SIN EMBEDDINGS")
        
        db = next(get_db())
        
        try:
            # Verificar que hay datos
            total_gastos = db.execute(
                select(func.count(Gasto.id)).where(Gasto.id_usuario == user_id)
            ).scalar()
            
            total_ingresos = db.execute(
                select(func.count(Ingreso.id)).where(Ingreso.id_usuario == user_id)
            ).scalar()
            
            print(f"Usuario ID: {user_id}")
            print(f"Total de gastos: {total_gastos}")
            print(f"Total de ingresos: {total_ingresos}")
            print(f"Total de queries de prueba: {len(self.test_queries)}")
            print()
            
            if total_gastos == 0 and total_ingresos == 0:
                print("⚠️  No hay datos para el usuario especificado")
                return
            
            # Ejecutar benchmarks para cada query
            for i, query in enumerate(self.test_queries, 1):
                print(f"\n[{i}/{len(self.test_queries)}] " + "─" * 70)
                
                sin_emb, con_emb = self.run_single_benchmark(query, user_id, db)
                
                # Guardar resultados
                self.results['sin_embeddings']['tiempos'].append(sin_emb['tiempo'])
                self.results['sin_embeddings']['tokens'].append(sin_emb['tokens'])
                self.results['sin_embeddings']['costos'].append(sin_emb['costo'])
                self.results['sin_embeddings']['registros'].append(sin_emb['registros'])
                
                self.results['con_embeddings']['tiempos'].append(con_emb['tiempo'])
                self.results['con_embeddings']['tokens'].append(con_emb['tokens'])
                self.results['con_embeddings']['costos'].append(con_emb['costo'])
                self.results['con_embeddings']['registros'].append(con_emb['registros'])
            
            # Mostrar resumen
            self.print_summary()
            
            # Guardar resultados en archivo
            self.save_results()
            
        finally:
            db.close()
    
    def print_summary(self):
        """Imprime resumen de todos los benchmarks."""
        self.print_header("RESUMEN DE BENCHMARKS")
        
        sin = self.results['sin_embeddings']
        con = self.results['con_embeddings']
        
        def calc_stats(data):
            return {
                'promedio': statistics.mean(data),
                'mediana': statistics.median(data),
                'min': min(data),
                'max': max(data),
                'total': sum(data)
            }
        
        print("📊 TIEMPO DE RESPUESTA (segundos)")
        print("-" * 80)
        stats_sin_tiempo = calc_stats(sin['tiempos'])
        stats_con_tiempo = calc_stats(con['tiempos'])
        
        print(f"SIN embeddings:")
        print(f"  Promedio: {stats_sin_tiempo['promedio']:.3f}s")
        print(f"  Mediana:  {stats_sin_tiempo['mediana']:.3f}s")
        print(f"  Min/Max:  {stats_sin_tiempo['min']:.3f}s / {stats_sin_tiempo['max']:.3f}s")
        print()
        
        print(f"CON embeddings:")
        print(f"  Promedio: {stats_con_tiempo['promedio']:.3f}s")
        print(f"  Mediana:  {stats_con_tiempo['mediana']:.3f}s")
        print(f"  Min/Max:  {stats_con_tiempo['min']:.3f}s / {stats_con_tiempo['max']:.3f}s")
        print()
        
        mejora_tiempo = ((stats_sin_tiempo['promedio'] - stats_con_tiempo['promedio']) / 
                         stats_sin_tiempo['promedio']) * 100
        print(f"✨ Mejora: {mejora_tiempo:+.1f}%")
        print()
        
        print("\n💬 TOKENS CONSUMIDOS")
        print("-" * 80)
        stats_sin_tokens = calc_stats(sin['tokens'])
        stats_con_tokens = calc_stats(con['tokens'])
        
        print(f"SIN embeddings:")
        print(f"  Promedio: {stats_sin_tokens['promedio']:.0f} tokens")
        print(f"  Total:    {stats_sin_tokens['total']:.0f} tokens")
        print()
        
        print(f"CON embeddings:")
        print(f"  Promedio: {stats_con_tokens['promedio']:.0f} tokens")
        print(f"  Total:    {stats_con_tokens['total']:.0f} tokens")
        print()
        
        mejora_tokens = ((stats_sin_tokens['promedio'] - stats_con_tokens['promedio']) / 
                         stats_sin_tokens['promedio']) * 100
        print(f"✨ Reducción: {mejora_tokens:+.1f}%")
        print()
        
        print("\n💰 COSTO POR CONSULTA")
        print("-" * 80)
        stats_sin_costo = calc_stats(sin['costos'])
        stats_con_costo = calc_stats(con['costos'])
        
        print(f"SIN embeddings:")
        print(f"  Promedio: ${stats_sin_costo['promedio']:.4f} por consulta")
        print(f"  Total:    ${stats_sin_costo['total']:.4f} para {len(sin['costos'])} consultas")
        print()
        
        print(f"CON embeddings:")
        print(f"  Promedio: ${stats_con_costo['promedio']:.4f} por consulta")
        print(f"  Total:    ${stats_con_costo['total']:.4f} para {len(con['costos'])} consultas")
        print()
        
        mejora_costo = ((stats_sin_costo['promedio'] - stats_con_costo['promedio']) / 
                        stats_sin_costo['promedio']) * 100
        ahorro = stats_sin_costo['total'] - stats_con_costo['total']
        print(f"✨ Ahorro: {mejora_costo:+.1f}% (${ahorro:.4f} total)")
        print()
        
        print("\n📦 REGISTROS PROCESADOS")
        print("-" * 80)
        stats_sin_reg = calc_stats(sin['registros'])
        stats_con_reg = calc_stats(con['registros'])
        
        print(f"SIN embeddings: {stats_sin_reg['promedio']:.0f} registros promedio")
        print(f"CON embeddings: {stats_con_reg['promedio']:.0f} registros promedio")
        
        reduccion_datos = ((stats_sin_reg['promedio'] - stats_con_reg['promedio']) / 
                           stats_sin_reg['promedio']) * 100
        print(f"✨ Reducción de datos: {reduccion_datos:+.1f}%")
        print()
        
        # Proyecciones
        self.print_projections(stats_con_costo['promedio'], stats_sin_costo['promedio'])
    
    def print_projections(self, costo_con: float, costo_sin: float):
        """Imprime proyecciones de costo a diferentes escalas."""
        self.print_header("PROYECCIONES DE COSTO")
        
        escalas = [
            (100, "100 consultas/día"),
            (1000, "1,000 consultas/día"),
            (10000, "10,000 consultas/día"),
            (100000, "100,000 consultas/día")
        ]
        
        print(f"{'Escala':<25} {'Sin Embeddings':<20} {'Con Embeddings':<20} {'Ahorro Mensual'}")
        print("-" * 85)
        
        for cantidad, label in escalas:
            mensual = cantidad * 30  # 30 días
            
            costo_sin_mensual = costo_sin * mensual
            costo_con_mensual = costo_con * mensual
            ahorro = costo_sin_mensual - costo_con_mensual
            
            print(f"{label:<25} ${costo_sin_mensual:>12.2f}       ${costo_con_mensual:>12.2f}       ${ahorro:>10.2f}")
        
        print()
    
    def save_results(self):
        """Guarda resultados en archivo JSON."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"benchmark_results_{timestamp}.json"
        
        output = {
            'timestamp': timestamp,
            'test_queries': self.test_queries,
            'results': self.results,
            'summary': {
                'sin_embeddings': {
                    'tiempo_promedio': statistics.mean(self.results['sin_embeddings']['tiempos']),
                    'tokens_promedio': statistics.mean(self.results['sin_embeddings']['tokens']),
                    'costo_promedio': statistics.mean(self.results['sin_embeddings']['costos'])
                },
                'con_embeddings': {
                    'tiempo_promedio': statistics.mean(self.results['con_embeddings']['tiempos']),
                    'tokens_promedio': statistics.mean(self.results['con_embeddings']['tokens']),
                    'costo_promedio': statistics.mean(self.results['con_embeddings']['costos'])
                }
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(output, f, indent=2)
        
        print(f"✅ Resultados guardados en: {filename}")


def main():
    """Función principal."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Benchmark de performance: Con vs Sin embeddings"
    )
    
    parser.add_argument(
        '--user-id',
        type=int,
        default=1,
        help='ID del usuario para el benchmark'
    )
    
    args = parser.parse_args()
    
    benchmark = BenchmarkEmbeddings()
    benchmark.run_all_benchmarks(user_id=args.user_id)


if __name__ == '__main__':
    main()
