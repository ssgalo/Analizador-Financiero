"""
Servicio de OCR utilizando Azure AI Document Intelligence (Form Recognizer)
Para procesar facturas, recibos y otros documentos financieros
"""

import os
import re
from datetime import datetime
from typing import Optional, Dict, Any, List
from io import BytesIO

from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from PIL import Image
import logging

logger = logging.getLogger(__name__)


class AzureOCRService:
    """Servicio para procesar documentos con Azure AI Document Intelligence"""
    
    def __init__(self):
        endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
        key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")
        
        if not endpoint or not key:
            raise ValueError(
                "Faltan credenciales de Azure Document Intelligence. "
                "Asegúrate de configurar AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT y AZURE_DOCUMENT_INTELLIGENCE_KEY"
            )
        
        self.client = DocumentAnalysisClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(key)
        )
    
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
            
            # Usar el modelo preentrenado de recibos de Azure
            poller = self.client.begin_analyze_document(
                "prebuilt-receipt",  # Modelo especializado en recibos
                document=BytesIO(file_bytes)
            )
            
            result = poller.result()
            
            # Extraer información del documento
            extracted_data = self._extract_receipt_data(result)
            
            # Si no se encontraron datos con el modelo de recibos, usar el modelo general
            if not extracted_data.get("monto") or not extracted_data.get("fecha"):
                logger.info("Intentando con modelo general de documentos...")
                extracted_data = await self._process_with_general_model(file_bytes)
            
            logger.info(f"Datos extraídos exitosamente: {extracted_data}")
            return extracted_data
            
        except Exception as e:
            logger.error(f"Error procesando documento: {str(e)}")
            # Si falla, intentar con modelo general
            return await self._process_with_general_model(file_bytes)
    
    def _extract_receipt_data(self, result) -> Dict[str, Any]:
        """
        Extrae datos específicos del resultado del análisis de recibos
        """
        extracted = {
            "fecha": None,
            "monto": None,
            "concepto": "",
            "comercio": "",
            "categoria_sugerida": None,
            "moneda_codigo": "ARS",
            "confianza": 0.0,
            "texto_completo": ""
        }
        
        for receipt in result.documents:
            fields = receipt.fields
            
            # Fecha de transacción
            if fields.get("TransactionDate"):
                transaction_date = fields["TransactionDate"].value
                if transaction_date:
                    extracted["fecha"] = transaction_date.strftime("%Y-%m-%d")
                    extracted["confianza"] = max(extracted["confianza"], fields["TransactionDate"].confidence)
            
            # Monto total
            if fields.get("Total"):
                total = fields["Total"].value
                if total:
                    extracted["monto"] = float(total.amount)
                    extracted["moneda_codigo"] = total.currency_code or "ARS"
                    extracted["confianza"] = max(extracted["confianza"], fields["Total"].confidence)
            
            # Nombre del comercio
            if fields.get("MerchantName"):
                merchant = fields["MerchantName"].value
                if merchant:
                    extracted["comercio"] = str(merchant)
                    extracted["concepto"] = f"Compra en {merchant}"
            
            # Items comprados (opcional, para contexto)
            items = []
            if fields.get("Items"):
                for item in fields["Items"].value:
                    item_fields = item.value
                    if item_fields.get("Description"):
                        items.append(str(item_fields["Description"].value))
            
            if items:
                extracted["concepto"] = f"{extracted['concepto']} - {', '.join(items[:3])}"
            
            # Categoría sugerida basada en el comercio
            extracted["categoria_sugerida"] = self._suggest_category(
                extracted["comercio"], 
                extracted["concepto"]
            )
        
        # Obtener texto completo
        extracted["texto_completo"] = result.content
        
        return extracted
    
    async def _process_with_general_model(self, file_bytes: bytes) -> Dict[str, Any]:
        """
        Procesa el documento con el modelo general cuando el modelo de recibos no funciona
        """
        try:
            poller = self.client.begin_analyze_document(
                "prebuilt-document",  # Modelo general
                document=BytesIO(file_bytes)
            )
            
            result = poller.result()
            text = result.content
            
            # Extraer información con expresiones regulares
            extracted = {
                "fecha": self._extract_date(text),
                "monto": self._extract_amount(text),
                "concepto": self._extract_concept(text),
                "comercio": "",
                "categoria_sugerida": None,
                "moneda_codigo": "ARS",
                "confianza": 0.5,  # Confianza media al usar modelo general
                "texto_completo": text
            }
            
            extracted["categoria_sugerida"] = self._suggest_category(
                extracted["comercio"], 
                extracted["concepto"]
            )
            
            return extracted
            
        except Exception as e:
            logger.error(f"Error en modelo general: {str(e)}")
            return {
                "fecha": None,
                "monto": None,
                "concepto": "Error al procesar documento",
                "comercio": "",
                "categoria_sugerida": None,
                "moneda_codigo": "ARS",
                "confianza": 0.0,
                "texto_completo": ""
            }
    
    def _extract_date(self, text: str) -> Optional[str]:
        """Extrae fecha del texto usando regex"""
        # Patrones de fecha comunes
        patterns = [
            r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b',  # DD/MM/YYYY o DD-MM-YYYY
            r'\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b',  # YYYY-MM-DD
            r'\b(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\b',  # DD de mes de YYYY
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
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
        
        # Si no encuentra fecha, usar fecha actual
        return datetime.now().strftime("%Y-%m-%d")
    
    def _extract_amount(self, text: str) -> Optional[float]:
        """Extrae monto del texto usando regex"""
        # Buscar patrones de moneda
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
        
        # Retornar el monto más alto encontrado (suele ser el total)
        return max(amounts) if amounts else None
    
    def _extract_concept(self, text: str) -> str:
        """Extrae un concepto descriptivo del texto"""
        # Tomar las primeras 100 palabras como concepto
        words = text.split()[:15]
        return " ".join(words) if words else "Gasto importado"
    
    def _suggest_category(self, merchant: str, concept: str) -> Optional[int]:
        """
        Sugiere una categoría basada en el comercio y concepto
        Retorna el ID de la categoría sugerida
        """
        text = f"{merchant} {concept}".lower()
        
        # Mapeo de palabras clave a IDs de categoría
        # NOTA: Ajustar estos IDs según las categorías reales en tu base de datos
        category_keywords = {
            1: ["alimento", "comida", "supermercado", "carrefour", "coto", "dia", "restaurant"],
            2: ["transporte", "uber", "cabify", "taxi", "colectivo", "subte", "combustible"],
            3: ["salud", "farmacia", "médico", "hospital", "clínica", "medicina"],
            4: ["entretenimiento", "cine", "teatro", "netflix", "spotify", "juego"],
            5: ["educación", "libro", "curso", "universidad", "escuela"],
            6: ["servicios", "luz", "gas", "agua", "internet", "telefono", "cable"],
            7: ["ropa", "vestimenta", "zapatilla", "indumentaria", "moda"],
        }
        
        for category_id, keywords in category_keywords.items():
            if any(keyword in text for keyword in keywords):
                return category_id
        
        return None  # Categoría no identificada
    
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
_ocr_service: Optional[AzureOCRService] = None


def get_ocr_service() -> AzureOCRService:
    """Obtiene la instancia del servicio OCR (singleton)"""
    global _ocr_service
    if _ocr_service is None:
        _ocr_service = AzureOCRService()
    return _ocr_service
