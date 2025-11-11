"""
Servicio de OCR utilizando EasyOCR + OpenAI GPT-4o-mini
Para procesar facturas, recibos y otros documentos financieros de forma económica
"""

import os
import re
import json
from datetime import datetime
from typing import Optional, Dict, Any
from io import BytesIO
import base64

import easyocr
from PIL import Image
from pdf2image import convert_from_bytes
from openai import OpenAI
import logging
import numpy as np

logger = logging.getLogger(__name__)


class TesseractOpenAIService:
    """Servicio para procesar documentos con EasyOCR + OpenAI GPT-4o-mini"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key or api_key == "your-openai-api-key-here":
            raise ValueError(
                "Falta la API Key de OpenAI. "
                "Asegúrate de configurar OPENAI_API_KEY en el archivo .env"
            )
        
        self.client = OpenAI(api_key=api_key)
        
        # Inicializar EasyOCR con español e inglés
        # gpu=False para usar CPU (más compatible con Docker)
        logger.info("Inicializando EasyOCR con idiomas: español e inglés")
        self.reader = easyocr.Reader(['es', 'en'], gpu=False)
    
    async def process_receipt(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Procesa un recibo/factura y extrae información financiera usando OpenAI Vision
        
        Args:
            file_bytes: Contenido del archivo en bytes
            filename: Nombre del archivo
            
        Returns:
            Dict con los datos extraídos del documento
        """
        try:
            print(f"[DEBUG] Procesando archivo: {filename}")
            logger.info(f"Procesando archivo: {filename}")
            
            # Usar OpenAI Vision directamente con la imagen (mucho más preciso que OCR)
            logger.info("Usando OpenAI Vision para análisis directo de imagen")
            print("[DEBUG] Usando OpenAI Vision (gpt-4o-mini) para análisis directo")
            
            structured_data = await self._analyze_with_vision(file_bytes, filename)
            
            logger.info(f"Datos estructurados extraídos: {structured_data}")
            return structured_data
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error procesando documento: {error_msg}")
            
            # Detectar errores específicos de OpenAI
            if "insufficient_quota" in error_msg or "quota" in error_msg.lower():
                return {
                    "fecha": None,
                    "monto": None,
                    "concepto": f"❌ Error: Sin saldo en OpenAI. {error_msg}",
                    "comercio": "",
                    "categoria_sugerida": None,
                    "moneda_codigo": "ARS",
                    "confianza": 0.0,
                    "texto_completo": ""
                }
            
            return {
                "fecha": None,
                "monto": None,
                "concepto": f"Error: {error_msg}",
                "comercio": "",
                "categoria_sugerida": None,
                "moneda_codigo": "ARS",
                "confianza": 0.0,
                "texto_completo": ""
            }
    
    async def _extract_text_with_tesseract(self, file_bytes: bytes, filename: str) -> str:
        """
        Extrae texto de una imagen o PDF usando EasyOCR directamente (sin preprocesamiento)
        """
        try:
            file_ext = os.path.splitext(filename.lower())[1]
            
            if file_ext == '.pdf':
                # Convertir PDF a imágenes con alta resolución
                images = convert_from_bytes(file_bytes, dpi=300)
                
                # Extraer texto de cada página
                text_parts = []
                for i, image in enumerate(images):
                    logger.info(f"Procesando página {i+1} del PDF con EasyOCR (sin preprocesamiento)")
                    
                    # Convertir directamente a numpy array para EasyOCR
                    img_array = np.array(image)
                    
                    # Extraer texto con EasyOCR
                    # readtext devuelve: [(bbox, text, confidence), ...]
                    results = self.reader.readtext(img_array)
                    
                    # Extraer solo el texto, ordenado por posición vertical
                    text_lines = [result[1] for result in results]
                    text = "\n".join(text_lines)
                    text_parts.append(text)
                
                return "\n\n".join(text_parts)
            
            else:
                # Procesar imagen directamente (sin preprocesamiento)
                image = Image.open(BytesIO(file_bytes))
                
                logger.info(f"Procesando imagen con EasyOCR (sin preprocesamiento). Tamaño: {image.size}")
                
                # Convertir directamente a numpy array para EasyOCR
                img_array = np.array(image)
                
                # Extraer texto con EasyOCR
                # readtext devuelve: [(bbox, text, confidence), ...]
                results = self.reader.readtext(img_array)
                
                # Log de confianza promedio
                if results:
                    avg_confidence = sum(r[2] for r in results) / len(results)
                    logger.info(f"EasyOCR detectó {len(results)} elementos con confianza promedio: {avg_confidence:.2f}")
                
                # Extraer solo el texto, ordenado por posición vertical
                # Ordenar por coordenada Y del bbox para mantener el orden de lectura
                results_sorted = sorted(results, key=lambda x: x[0][0][1])
                text_lines = [result[1] for result in results_sorted]
                text = "\n".join(text_lines)
                
                logger.info(f"Texto extraído: {len(text)} caracteres con EasyOCR")
                return text
                
        except Exception as e:
            logger.error(f"Error en EasyOCR: {str(e)}")
            raise
    
    async def _analyze_with_vision(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Analiza la imagen directamente con GPT-4o-mini Vision (sin OCR previo)
        Mucho más preciso porque ve la imagen completa, no texto procesado
        """
        try:
            # Convertir imagen a base64
            file_ext = os.path.splitext(filename.lower())[1]
            
            if file_ext == '.pdf':
                # Si es PDF, convertir primera página a imagen
                images = convert_from_bytes(file_bytes, dpi=200)
                if not images:
                    raise ValueError("No se pudo convertir PDF a imagen")
                
                # Convertir primera página a bytes
                img_buffer = BytesIO()
                images[0].save(img_buffer, format='PNG')
                img_bytes = img_buffer.getvalue()
                image_base64 = base64.b64encode(img_bytes).decode('utf-8')
                image_format = "png"
            else:
                # Imagen directa
                image_base64 = base64.b64encode(file_bytes).decode('utf-8')
                image_format = file_ext[1:] if file_ext else "jpeg"
            
            print(f"[DEBUG] Imagen convertida a base64 ({len(image_base64)} caracteres)")
            
            # Llamar a OpenAI Vision
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """Eres un experto en análisis de recibos y facturas argentinas. 
Extrae información con precisión. Responde SOLO con JSON válido, sin markdown ni explicaciones.

CATEGORÍAS:
1=Comida, 2=Transporte, 3=Vivienda, 4=Entretenimiento, 28=Supermercado, 30=Suscripciones, 26=Otros

FORMATO DE MONTO:
- Si ves "1.234,56" → es 1234.56 (formato argentino: punto=miles, coma=decimal)
- Si ves "1234.56" → es 1234.56
- Busca el TOTAL final del ticket (no subtotales ni items individuales)"""
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"""Analiza este recibo/factura y extrae la información. Responde SOLO con este JSON:

{{
  "fecha": "YYYY-MM-DD",
  "monto": número_decimal,
  "concepto": "descripción del gasto",
  "comercio": "nombre del negocio",
  "categoria_sugerida": número_categoria,
  "moneda_codigo": "ARS",
  "confianza": decimal_0_a_1
}}

IMPORTANTE:
- fecha: La fecha en el ticket está en formato argentino DD/MM/YYYY o DD/MM/YY (ejemplo: "13/03/2025" o "13/03/25").
  DEBES CONVERTIRLA a formato YYYY-MM-DD (ejemplo: "2025-03-13").
  Si no encuentras fecha en el ticket, usa: {datetime.now().strftime("%Y-%m-%d")}
- monto: El TOTAL FINAL del ticket (no subtotales). Si tiene formato "1.234,56" conviértelo a 1234.56
- concepto: GENERA un resumen descriptivo del gasto basado en lo que ves en el ticket. NO copies texto literal.
  Ejemplos:
  * Si ves items de comida en restaurante → "Almuerzo - langostinos, café, croissant"
  * Si ves combustible → "Carga de combustible 45 litros"
  * Si ves productos variados → "Compra supermercado - lácteos, verduras, limpieza"
  * Si ves café solo → "Café con medialunas"
  Máximo 60 caracteres. Sé específico pero conciso.
- comercio: Nombre del comercio/restaurante que aparece en el ticket (ej: "Starbucks", "Carrefour", "La Parolaccia"). Si no aparece, déjalo vacío "".
- categoria_sugerida: Número según el tipo de negocio/productos
- confianza: 0.9 si los datos son claros, 0.5-0.7 si hay dudas

Responde SOLO el JSON, sin ```json ni explicaciones."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/{image_format};base64,{image_base64}",
                                    "detail": "high"  # Alta calidad para mejor precisión
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0.1  # Muy bajo para máxima precisión
            )
            
            # Extraer información de uso
            usage = response.usage
            prompt_tokens = usage.prompt_tokens
            completion_tokens = usage.completion_tokens
            total_tokens = usage.total_tokens
            
            # Calcular costo aproximado (gpt-4o-mini precios al 2024)
            # Input: $0.150 / 1M tokens, Output: $0.600 / 1M tokens
            input_cost = (prompt_tokens / 1_000_000) * 0.150
            output_cost = (completion_tokens / 1_000_000) * 0.600
            total_cost = input_cost + output_cost
            
            print(f"[DEBUG] ✓ OpenAI Vision completado")
            print(f"[DEBUG] Tokens usados: {total_tokens} (input: {prompt_tokens}, output: {completion_tokens})")
            print(f"[DEBUG] Costo estimado: ${total_cost:.6f} USD (${total_cost * 1000:.4f} por mil llamadas)")
            
            logger.info(f"OpenAI Vision - Tokens: {total_tokens}, Costo: ${total_cost:.6f}")
            
            # Extraer respuesta
            gpt_response = response.choices[0].message.content.strip()
            print(f"[DEBUG] Respuesta de GPT Vision: {gpt_response[:200]}...")
            
            # Limpiar respuesta (remover markdown si existe)
            if gpt_response.startswith("```json"):
                gpt_response = gpt_response[7:]
            if gpt_response.startswith("```"):
                gpt_response = gpt_response[3:]
            if gpt_response.endswith("```"):
                gpt_response = gpt_response[:-3]
            
            gpt_response = gpt_response.strip()
            
            # Parsear JSON
            data = json.loads(gpt_response)
            
            # Validar estructura
            required_keys = ["fecha", "monto", "concepto", "comercio", "categoria_sugerida", "moneda_codigo", "confianza"]
            for key in required_keys:
                if key not in data:
                    data[key] = None if key != "moneda_codigo" else "ARS"
            
            # Asegurar tipos correctos
            if data["monto"] is not None:
                data["monto"] = float(data["monto"])
            
            if data["confianza"] is not None:
                data["confianza"] = float(data["confianza"])
            else:
                data["confianza"] = 0.5
            
            # Asegurar que concepto y comercio sean strings (no null)
            if data.get("concepto") is None:
                data["concepto"] = ""
            if data.get("comercio") is None:
                data["comercio"] = ""
            
            # Agregar información de costo en el texto_completo para que el usuario lo vea
            data["texto_completo"] = f"✓ Procesado con OpenAI Vision\n📊 Tokens: {total_tokens} | 💰 Costo: ${total_cost:.6f} USD"
            
            print(f"[DEBUG] ✓ Datos extraídos:")
            print(f"[DEBUG]   - Fecha: {data['fecha']}")
            print(f"[DEBUG]   - Monto: {data['monto']}")
            print(f"[DEBUG]   - Comercio: '{data['comercio']}'")
            print(f"[DEBUG]   - Concepto: '{data['concepto']}'")
            print(f"[DEBUG]   - Categoría: {data['categoria_sugerida']}")
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parseando JSON de GPT Vision: {str(e)}")
            logger.error(f"Respuesta recibida: {gpt_response}")
            raise ValueError(f"OpenAI Vision devolvió respuesta inválida: {str(e)}")
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error en análisis con GPT Vision: {error_msg}")
            
            # Detectar error de cuota y extraer detalles si están disponibles
            if "insufficient_quota" in error_msg or "quota" in error_msg.lower():
                # Intentar extraer detalles del error
                print(f"[ERROR] ❌ Sin saldo en OpenAI")
                print(f"[ERROR] Detalles: {error_msg}")
                
                raise ValueError(
                    f"❌ Sin saldo en OpenAI API.\n\n"
                    f"💰 Costo estimado por imagen: ~$0.001 - $0.003 USD\n"
                    f"📊 Este archivo hubiera usado ~1000-3000 tokens\n\n"
                    f"Para agregar saldo: https://platform.openai.com/account/billing\n\n"
                    f"Detalles técnicos: {error_msg}"
                )
            
            raise
    
    async def _analyze_with_gpt(self, text: str) -> Dict[str, Any]:
        """
        Analiza el texto extraído con GPT-4o-mini para estructurar los datos
        """
        try:
            prompt = f"""Analiza este documento y extrae información financiera. Responde SOLO con JSON válido:

{{
  "fecha": "YYYY-MM-DD",
  "monto": número decimal,
  "concepto": "",
  "comercio": "",
  "categoria_sugerida": número,
  "moneda_codigo": "ARS",
  "confianza": número decimal 0.0-1.0
}}

CATEGORÍAS DISPONIBLES:
1 = Comida (restaurantes, bares, cafeterías, delivery de comida, fast food)
2 = Transporte (combustible, nafta, diesel, peajes, taxis, Uber, Cabify, transporte público)
3 = Vivienda (alquiler, expensas, mantenimiento de hogar)
4 = Entretenimiento (cine, teatro, eventos, gimnasio, deportes, entretenimiento)
13 = Salud y cuidado personal (farmacias, consultas médicas, medicamentos, productos de higiene, cosméticos)
28 = Supermercado (supermercados, almacenes, compras de comestibles)
30 = Suscripciones (servicios digitales, streaming, membresías online)
26 = Otros (usa SOLO si no encaja en ninguna categoría anterior)

INSTRUCCIONES:

1. FECHA:
   - Busca: "Fecha:", "Date:", formato DD/MM/YYYY o DD-MM-YYYY
   - Si encuentras, convierte a formato YYYY-MM-DD
   - Si NO encuentras fecha, usa: {datetime.now().strftime("%Y-%m-%d")}

2. MONTO (MUY IMPORTANTE - LEE CON CUIDADO):
   - Busca palabras clave: "TOTAL", "Total", "IMPORTE", "Importe", "NETO", generalmente al FINAL del documento
   - REGLAS DE FORMATO:
   
   CASO A - Formato argentino con coma decimal:
     "1.234,56" → 1234.56
     "25.000,00" → 25000.00
     "3.456.789,12" → 3456789.12
     Regla: Si tiene COMA (,) entonces los puntos (.) son separadores de miles
   
   CASO B - Formato internacional con punto decimal:
     "1234.56" → 1234.56 (NO tiene separador de miles, el punto es decimal)
     "25000.00" → 25000.00
     "123.45" → 123.45 (después del punto SOLO 2 dígitos = decimal)
     Regla: Si tiene PUNTO (.) y después SOLO 2 dígitos, el punto es decimal
   
   CASO C - Sin decimales:
     "30100" → 30100.00
     "5000" → 5000.00
   
   - Devuelve SOLO el número decimal sin símbolos: 1234.56

3. COMERCIO:
   - SIEMPRE devuelve cadena VACÍA: ""
   - NO extraigas el nombre del comercio
   - El usuario lo completará manualmente

4. CONCEPTO:
   - SIEMPRE devuelve cadena VACÍA: ""
   - NO generes ninguna descripción
   - El usuario lo completará manualmente

5. CATEGORIA_SUGERIDA (ANALIZA EL CONTENIDO COMPLETO):
   Analiza TODO el texto del documento para determinar la categoría:
   
   - Palabras clave para identificar:
     * Comida (1): "restaurante", "bar", "café", "pizza", "hamburguesa", "menu", "menú", "mesa", "mozo", "delivery", "pedido", nombres de comidas
     * Transporte (2): "combustible", "nafta", "diesel", "litros", "YPF", "Shell", "Axion", "peaje", "taxi", "uber", "viaje"
     * Supermercado (28): "supermercado", "carrefour", "coto", "día", "disco", "jumbo", "walmart", productos variados (verduras + lácteos + limpieza)
     * Entretenimiento (4): "cine", "entrada", "teatro", "gimnasio", "deporte", "evento", "show"
     * Salud y cuidado personal (13): "farmacia", "farmacity", "droguerías", "médico", "consulta", "medicamento", "remedio", "ibuprofeno", "paracetamol", "antibiótico", "shampoo", "crema", "maquillaje", "perfume", "cosméticos", "higiene"
     * Suscripciones (30): "suscripción", "mensual", "Netflix", "Spotify", "servicio digital"
     * Vivienda (3): "alquiler", "expensas", "reparación", "mantenimiento hogar"
   
   - Analiza el CONTEXTO completo, no solo el nombre
   - Si ves productos alimenticios listados → probablemente categoría 1 o 28
   - Si ves litros y precio por litro → probablemente categoría 2
   - Si ves medicamentos, productos de higiene o cosméticos → probablemente categoría 13
   - DEFAULT: 26 (Otros) si no estás seguro

6. CONFIANZA:
   - 0.9-1.0: Fecha, monto y categoría muy claros
   - 0.7-0.8: Monto claro, categoría probable
   - 0.5-0.6: Algunos datos identificados
   - <0.5: Datos poco claros

TEXTO DEL DOCUMENTO:
{text}

RESPONDE SOLO CON EL JSON, SIN EXPLICACIONES."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Modelo más económico
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un asistente experto en análisis de documentos financieros argentinos. Tu tarea es extraer información con precisión. Respondes SOLO con JSON válido, sin texto adicional, markdown o explicaciones."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Balance entre precisión y comprensión contextual
                max_tokens=500  # Suficiente para la respuesta JSON
            )
            
            # Extraer respuesta
            gpt_response = response.choices[0].message.content.strip()
            logger.info(f"Respuesta cruda de GPT: {gpt_response}")
            
            # Limpiar respuesta (remover markdown si existe)
            if gpt_response.startswith("```json"):
                gpt_response = gpt_response[7:]
            if gpt_response.startswith("```"):
                gpt_response = gpt_response[3:]
            if gpt_response.endswith("```"):
                gpt_response = gpt_response[:-3]
            
            gpt_response = gpt_response.strip()
            
            # Parsear JSON
            data = json.loads(gpt_response)
            
            # Log de datos parseados
            logger.info(f"Datos parseados - Comercio: '{data.get('comercio', '')}', Concepto: '{data.get('concepto', '')}', Monto: {data.get('monto', 0)}")
            
            # Validar estructura
            required_keys = ["fecha", "monto", "concepto", "comercio", "categoria_sugerida", "moneda_codigo", "confianza"]
            for key in required_keys:
                if key not in data:
                    data[key] = None if key != "moneda_codigo" else "ARS"
            
            # Asegurar tipos correctos
            if data["monto"] is not None:
                data["monto"] = float(data["monto"])
            
            if data["confianza"] is not None:
                data["confianza"] = float(data["confianza"])
            else:
                data["confianza"] = 0.5
            
            # Asegurar que concepto y comercio sean strings (no null)
            if data["concepto"] is None:
                data["concepto"] = ""
            if data["comercio"] is None:
                data["comercio"] = ""
            
            # Truncar concepto si es muy largo
            if len(data["concepto"]) > 150:
                data["concepto"] = data["concepto"][:147] + "..."
                logger.warning(f"Concepto truncado a 150 caracteres")
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parseando JSON de GPT: {str(e)}")
            logger.error(f"Respuesta recibida: {gpt_response}")
            # Fallback: extraer datos con regex
            return self._fallback_extraction(text)
        
        except Exception as e:
            logger.error(f"Error en análisis con GPT: {str(e)}")
            return self._fallback_extraction(text)
    
    def _fallback_extraction(self, text: str) -> Dict[str, Any]:
        """
        Método de extracción con regex (sin OpenAI) - 100% gratis
        """
        logger.info("Usando método de extracción con regex (sin OpenAI)")
        
        fecha = self._extract_date(text) or datetime.now().strftime("%Y-%m-%d")
        monto = self._extract_amount(text)
        categoria = self._detect_category(text)
        
        # Calcular confianza basada en lo que se pudo extraer
        confianza = 0.0
        if fecha:
            confianza += 0.3
        if monto and monto > 0:
            confianza += 0.5
        if categoria != 26:  # Si no es "Otros"
            confianza += 0.2
        
        logger.info(f"Extracción regex - Fecha: {fecha}, Monto: {monto}, Categoría: {categoria}, Confianza: {confianza}")
        
        return {
            "fecha": fecha,
            "monto": monto,
            "concepto": "",  # Siempre vacío
            "comercio": "",  # Siempre vacío
            "categoria_sugerida": categoria,
            "moneda_codigo": "ARS",
            "confianza": confianza
        }
    
    def _detect_category(self, text: str) -> int:
        """
        Detecta la categoría basándose en palabras clave en el texto
        """
        text_lower = text.lower()
        
        # Comida (1)
        comida_keywords = ['restaurante', 'bar', 'café', 'cafe', 'pizza', 'hamburguesa', 
                          'menu', 'menú', 'mesa', 'mozo', 'delivery', 'pedido', 'comida',
                          'restaurant', 'food', 'cocina', 'parrilla', 'grill']
        if any(keyword in text_lower for keyword in comida_keywords):
            return 1
        
        # Transporte (2)
        transporte_keywords = ['combustible', 'nafta', 'diesel', 'litros', 'ypf', 'shell', 
                              'axion', 'puma', 'esso', 'peaje', 'taxi', 'uber', 'cabify',
                              'gasoil', 'estacion', 'estación', 'servicio']
        if any(keyword in text_lower for keyword in transporte_keywords):
            return 2
        
        # Supermercado (28)
        super_keywords = ['supermercado', 'carrefour', 'coto', 'día', 'dia', 'disco', 
                         'jumbo', 'walmart', 'changomas', 'vea', 'chango', 'super',
                         'almacen', 'almacén', 'verduleria', 'verdulería']
        if any(keyword in text_lower for keyword in super_keywords):
            return 28
        
        # Entretenimiento (4)
        entret_keywords = ['cine', 'teatro', 'gimnasio', 'gym', 'deporte', 'evento',
                          'show', 'entrada', 'ticket', 'pelicula', 'película']
        if any(keyword in text_lower for keyword in entret_keywords):
            return 4
        
        # Suscripciones (30)
        suscr_keywords = ['suscripcion', 'suscripción', 'netflix', 'spotify', 'amazon',
                         'mensual', 'subscription', 'servicio digital', 'streaming']
        if any(keyword in text_lower for keyword in suscr_keywords):
            return 30
        
        # Vivienda (3)
        vivienda_keywords = ['alquiler', 'expensas', 'reparacion', 'reparación', 
                            'mantenimiento', 'inmobiliaria', 'condominio']
        if any(keyword in text_lower for keyword in vivienda_keywords):
            return 3
        
        # Default: Otros (26)
        return 26
    
    def _extract_date(self, text: str) -> Optional[str]:
        """Extrae fecha del texto usando regex"""
        patterns = [
            r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b',
            r'\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b',
            r'\b(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\b',
        ]
        
        meses = {
            "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
            "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
            "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12"
        }
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    groups = match.groups()
                    if len(groups) == 3:
                        if len(groups[0]) == 4:  # YYYY-MM-DD
                            return f"{groups[0]}-{groups[1].zfill(2)}-{groups[2].zfill(2)}"
                        else:  # DD/MM/YYYY
                            return f"{groups[2]}-{groups[1].zfill(2)}-{groups[0].zfill(2)}"
                except:
                    continue
        
        return None
    
    def _extract_amount(self, text: str) -> Optional[float]:
        """
        Extrae monto del texto usando estrategia híbrida:
        1. Busca números cerca de keywords ("Total", "Subtotal", etc.) - PRIORIDAD
        2. Si no encuentra, usa estrategia de número más grande
        """
        print(f"[DEBUG] Buscando monto en texto de {len(text)} caracteres")
        logger.info(f"Buscando monto en texto de {len(text)} caracteres")
        
        # PASO 1: Buscar números CERCA de palabras clave (estrategia contextual)
        keywords = ['total', 'subtotal', 'importe', 'neto', 'pagar', 'abonado']
        text_lower = text.lower()
        
        for keyword in keywords:
            if keyword in text_lower:
                print(f"[DEBUG] Encontrada palabra clave: '{keyword}'")
                
                # Buscar la posición de la keyword
                keyword_pos = text_lower.find(keyword)
                
                # Extraer 200 caracteres alrededor de la keyword (100 antes, 100 después)
                start = max(0, keyword_pos - 100)
                end = min(len(text), keyword_pos + 100)
                context = text[start:end]
                
                print(f"[DEBUG] Contexto alrededor de '{keyword}': {context[:100]}...")
                
                # Buscar números en este contexto
                patterns = [
                    r'([\d]{1,3}(?:[.,][\d]{3})*[.,][\d]{2})',  # 1.234,56
                    r'([\d]{1,3}(?:[.,][\d]{3})+)',              # 1.234
                    r'([\d]+[.,][\d]{2})',                       # 123,56
                    r'([\d]+)',                                   # 123
                ]
                
                context_numbers = []
                for pattern in patterns:
                    matches = re.finditer(pattern, context)
                    for match in matches:
                        amount_str = match.group(1)
                        amount = self._parse_amount_string(amount_str)
                        if amount and 10 <= amount <= 10000000:
                            context_numbers.append(amount)
                            print(f"[DEBUG] Número cerca de '{keyword}': {amount}")
                
                # Si encontramos números cerca de la keyword, usar el más grande de esos
                if context_numbers:
                    # Filtrar números muy grandes (>1M)
                    filtered = [n for n in context_numbers if n < 1000000]
                    if filtered:
                        max_amount = max(filtered)
                        print(f"[DEBUG] ✓ Monto seleccionado (cerca de '{keyword}'): {max_amount}")
                        logger.info(f"Monto extraído (keyword '{keyword}'): {max_amount}")
                        return max_amount
        
        # PASO 2: Si no encontramos con keywords, usar estrategia de número más grande
        print("[DEBUG] No se encontraron keywords de total, usando estrategia de número más grande")
        
        all_numbers = []
        patterns = [
            r'([\d]{1,3}(?:[.,][\d]{3})*[.,][\d]{2})',  # 1.234,56
            r'([\d]{1,3}(?:[.,][\d]{3})+)',              # 1.234
            r'([\d]+[.,][\d]{2})',                       # 123,56
            r'([\d]+)',                                   # 123
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                amount_str = match.group(1)
                amount = self._parse_amount_string(amount_str)
                if amount and 10 <= amount <= 10000000:
                    all_numbers.append(amount)
        
        if not all_numbers:
            print("[DEBUG] No se encontraron números válidos")
            logger.warning("No se pudo extraer ningún monto válido")
            return None
        
        # Filtrar números > 1M
        filtered = [n for n in all_numbers if n < 1000000]
        
        if filtered:
            max_amount = max(filtered)
            print(f"[DEBUG] ✓ Monto seleccionado (el más grande): {max_amount}")
            logger.info(f"Monto extraído: {max_amount}")
            return max_amount
        else:
            min_amount = min(all_numbers)
            print(f"[DEBUG] ✓ Monto seleccionado (todos eran grandes, tomé el menor): {min_amount}")
            return min_amount
    
    def _parse_amount_string(self, amount_str: str) -> Optional[float]:
        """Parsea un string de monto y retorna float - inteligente con formatos argentinos"""
        try:
            # Limpiar espacios
            amount_str = amount_str.strip()
            print(f"[DEBUG] Parseando monto: '{amount_str}'")
            
            # CASO 1: Formato argentino mixto - 1.234,56 o 30.100,00
            if ',' in amount_str and '.' in amount_str:
                # El punto es separador de miles, la coma es decimal
                amount_str = amount_str.replace('.', '').replace(',', '.')
                print(f"[DEBUG] Formato argentino (punto miles + coma decimal): {amount_str}")
            
            # CASO 2: Solo tiene coma - 1234,56
            elif ',' in amount_str:
                # La coma es decimal
                amount_str = amount_str.replace(',', '.')
                print(f"[DEBUG] Formato argentino (solo coma decimal): {amount_str}")
            
            # CASO 3: Solo tiene punto - puede ser miles o decimal
            elif '.' in amount_str:
                parts = amount_str.split('.')
                # Si tiene exactamente 2 decimales después del punto, es decimal
                if len(parts) == 2 and len(parts[1]) == 2:
                    print(f"[DEBUG] Formato decimal (punto): {amount_str}")
                    pass  # Ya está correcto
                # Si tiene 3 dígitos o más después del punto, es separador de miles
                elif len(parts) == 2 and len(parts[1]) >= 3:
                    amount_str = amount_str.replace('.', '')
                    print(f"[DEBUG] Formato separador de miles (punto): {amount_str}")
                # Si solo tiene 1 dígito después del punto, es decimal
                else:
                    print(f"[DEBUG] Formato decimal con 1 dígito: {amount_str}")
                    pass
            
            # CASO 4: Sin separadores - tratar como pesos enteros
            else:
                print(f"[DEBUG] Número sin separadores (pesos enteros): {amount_str}")
            
            result = float(amount_str)
            print(f"[DEBUG] ✓ Resultado parseado: {result}")
            return result
            
        except Exception as e:
            print(f"[DEBUG] ✗ Error parseando monto '{amount_str}': {e}")
            return None
    
    def _extract_concept(self, text: str) -> str:
        """Extrae un concepto descriptivo del texto"""
        words = text.split()[:20]
        return " ".join(words) if words else "Gasto importado"
    
    async def validate_file(self, file_bytes: bytes, filename: str) -> tuple[bool, str]:
        """
        Valida si el archivo es compatible con el servicio OCR
        
        Returns:
            (is_valid, error_message)
        """
        # Extensiones permitidas
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.pdf', '.bmp', '.tiff']
        file_ext = os.path.splitext(filename.lower())[1]
        
        if file_ext not in allowed_extensions:
            return False, f"Tipo de archivo no soportado. Use: {', '.join(allowed_extensions)}"
        
        # Tamaño máximo: 20MB
        max_size = 20 * 1024 * 1024
        if len(file_bytes) > max_size:
            return False, "El archivo es demasiado grande. Máximo 20MB"
        
        # Validar que sea una imagen válida (si no es PDF)
        if file_ext != '.pdf':
            try:
                img = Image.open(BytesIO(file_bytes))
                img.verify()
            except Exception as e:
                return False, f"Archivo de imagen inválido: {str(e)}"
        
        return True, ""


# Instancia singleton del servicio
_ocr_service: Optional[TesseractOpenAIService] = None


def get_ocr_service() -> TesseractOpenAIService:
    """Obtiene la instancia del servicio OCR (singleton)"""
    global _ocr_service
    if _ocr_service is None:
        _ocr_service = TesseractOpenAIService()
    return _ocr_service
