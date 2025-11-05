"""
Servicio de OCR utilizando Tesseract + OpenAI GPT-4o-mini
Para procesar facturas, recibos y otros documentos financieros de forma económica
"""

import os
import re
import json
from datetime import datetime
from typing import Optional, Dict, Any
from io import BytesIO
import base64

import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)


class TesseractOpenAIService:
    """Servicio para procesar documentos con Tesseract OCR + OpenAI GPT-4o-mini"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key or api_key == "your-openai-api-key-here":
            raise ValueError(
                "Falta la API Key de OpenAI. "
                "Asegúrate de configurar OPENAI_API_KEY en el archivo .env"
            )
        
        self.client = OpenAI(api_key=api_key)
        
        # Configurar Tesseract (en Docker ya estará en PATH)
        # En Windows local, descomentar y ajustar la ruta:
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    
    async def process_receipt(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Procesa un recibo/factura y extrae información financiera
        
        Args:
            file_bytes: Contenido del archivo en bytes
            filename: Nombre del archivo
            
        Returns:
            Dict con los datos extraídos del documento
        """
        try:
            logger.info(f"Procesando archivo: {filename}")
            
            # Paso 1: Extraer texto con Tesseract
            extracted_text = await self._extract_text_with_tesseract(file_bytes, filename)
            
            if not extracted_text or len(extracted_text.strip()) < 10:
                logger.warning(f"No se pudo extraer texto suficiente del archivo: {filename}")
                return {
                    "fecha": None,
                    "monto": None,
                    "concepto": "Error: No se pudo leer el documento",
                    "comercio": "",
                    "categoria_sugerida": None,
                    "moneda_codigo": "ARS",
                    "confianza": 0.0,
                    "texto_completo": extracted_text
                }
            
            logger.info(f"Texto extraído: {len(extracted_text)} caracteres")
            
            # Paso 2: Analizar con GPT-4o-mini
            structured_data = await self._analyze_with_gpt(extracted_text)
            
            # Agregar texto completo
            structured_data["texto_completo"] = extracted_text
            
            logger.info(f"Datos estructurados extraídos: {structured_data}")
            return structured_data
            
        except Exception as e:
            logger.error(f"Error procesando documento: {str(e)}")
            return {
                "fecha": None,
                "monto": None,
                "concepto": f"Error: {str(e)}",
                "comercio": "",
                "categoria_sugerida": None,
                "moneda_codigo": "ARS",
                "confianza": 0.0,
                "texto_completo": ""
            }
    
    async def _extract_text_with_tesseract(self, file_bytes: bytes, filename: str) -> str:
        """
        Extrae texto de una imagen o PDF usando Tesseract OCR
        """
        try:
            file_ext = os.path.splitext(filename.lower())[1]
            
            if file_ext == '.pdf':
                # Convertir PDF a imágenes
                images = convert_from_bytes(file_bytes, dpi=300)
                
                # Extraer texto de cada página
                text_parts = []
                for i, image in enumerate(images):
                    logger.info(f"Procesando página {i+1} del PDF")
                    # Usar español + inglés para mejor reconocimiento
                    text = pytesseract.image_to_string(image, lang='spa+eng')
                    text_parts.append(text)
                
                return "\n\n".join(text_parts)
            
            else:
                # Procesar imagen directamente
                image = Image.open(BytesIO(file_bytes))
                
                # Preprocesamiento opcional para mejorar OCR
                # Convertir a escala de grises
                if image.mode != 'L':
                    image = image.convert('L')
                
                # Extraer texto
                text = pytesseract.image_to_string(image, lang='spa+eng')
                return text
                
        except Exception as e:
            logger.error(f"Error en Tesseract OCR: {str(e)}")
            raise
    
    async def _analyze_with_gpt(self, text: str) -> Dict[str, Any]:
        """
        Analiza el texto extraído con GPT-4o-mini para estructurar los datos
        """
        try:
            prompt = f"""Eres un experto en análisis de recibos y facturas argentinas. Analiza el siguiente texto extraído de un documento y devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura:

{{
  "fecha": "YYYY-MM-DD",
  "monto": número decimal,
  "concepto": "",
  "comercio": "nombre del comercio",
  "categoria_sugerida": número (1, 2, 3, 4, 28, 30, 26),
  "moneda_codigo": "ARS",
  "confianza": número decimal 0.0-1.0
}}

Categorías:
1 = Comida (restaurantes, fast food, delivery)
2 = Transporte (combustible, peajes, taxi, Uber)
3 = Vivienda (alquiler, expensas)
4 = Entretenimiento (cine, eventos, gimnasio)
28 = Supermercado (supermercados, almacenes)
30 = Suscripciones (Netflix, Spotify, servicios online)
26 = Otros (default si no estás seguro)

INSTRUCCIONES CRÍTICAS:

1. FECHA:
   - Busca en las primeras 10 líneas: "Fecha:", "Date:", o formato DD/MM/YYYY
   - Si NO encuentras, usa: {datetime.now().strftime("%Y-%m-%d")}
   - Devuelve en formato: YYYY-MM-DD

2. MONTO:
   - Busca "TOTAL" cerca del FINAL del documento
   - FORMATO ARGENTINO: "1.234,56" → convierte a 1234.56
   - FORMATO ARGENTINO: "25.000,00" → convierte a 25000.00
   - Devuelve SOLO el número decimal: 1234.56

3. COMERCIO (MUY IMPORTANTE - LEE LAS PRIMERAS 2-3 LÍNEAS):
   - El nombre del comercio SIEMPRE está en las primeras 2-3 líneas del documento
   - Busca la línea con el texto MÁS GRANDE o que aparece SOLO
   - Puede estar en MAYÚSCULAS o con formato destacado
   - Ignora: direcciones, teléfonos, CUIT, "S.A.", "S.R.L."
   
   EJEMPLOS:
   - Si las primeras líneas dicen: "CARREFOUR\nDirección: Av. Corrientes 123"
     → comercio: "Carrefour"
   
   - Si dice: "YPF - ESTACIÓN DE SERVICIO\nCUIT: 30-12345678-9"
     → comercio: "YPF"
   
   - Si dice: "Farmacity\nFarmacia\nTel: 4567-8900"
     → comercio: "Farmacity"
   
   - Devuelve el nombre limpio, sin símbolos raros
   - Si NO hay nombre claro en las primeras 3 líneas, devuelve ""

4. CONCEPTO:
   - SIEMPRE devuelve cadena VACÍA: ""
   - NO generes ninguna descripción
   - El usuario completará este campo manualmente

5. CATEGORIA_SUGERIDA:
   - Lee el nombre del comercio identificado
   - DEFAULT: 26 (Otros) si no estás seguro
   - Usa categorías específicas solo si el comercio es conocido:
     * Carrefour, Coto, Día, Disco, Jumbo, Walmart → 28
     * YPF, Shell, Axion, Esso, Puma → 2
     * McDonald's, Burger King, Mostaza, Pedidos Ya → 1
     * TODO LO DEMÁS → 26

6. CONFIANZA:
   - 0.8-1.0: Comercio + monto identificados
   - 0.5-0.7: Solo monto identificado
   - <0.5: Datos parciales

TEXTO DEL DOCUMENTO:
{text}

RECUERDA CRÍTICO:
- Comercio: SOLO en las primeras 2-3 líneas
- Concepto: SIEMPRE vacío ""
- Monto: busca "TOTAL" al final"""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Modelo más económico
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un asistente experto en análisis de documentos. SOLO respondes con JSON válido, sin texto adicional, markdown o explicaciones."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,  # Ligeramente más alto para mejor análisis contextual
                max_tokens=800  # Aumentado para permitir mejor análisis del documento
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
        Método de respaldo: extrae datos básicos con expresiones regulares
        """
        logger.info("Usando método de extracción de respaldo")
        
        return {
            "fecha": self._extract_date(text) or datetime.now().strftime("%Y-%m-%d"),
            "monto": self._extract_amount(text),
            "concepto": self._extract_concept(text),
            "comercio": "",
            "categoria_sugerida": None,
            "moneda_codigo": "ARS",
            "confianza": 0.3
        }
    
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
        """Extrae monto del texto usando regex"""
        patterns = [
            r'(?:Total|TOTAL|Importe|IMPORTE|Monto|MONTO)[:\s]*\$?\s*([\d,]+\.?\d*)',
            r'\$\s*([\d,]+\.?\d*)',
            r'([\d,]+\.?\d*)\s*(?:pesos|ARS)',
        ]
        
        amounts = []
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                try:
                    amount_str = match.group(1).replace(',', '')
                    amount = float(amount_str)
                    if amount > 0:
                        amounts.append(amount)
                except:
                    continue
        
        return max(amounts) if amounts else None
    
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
