import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost';

interface ImportedData {
  fecha: string | null;
  monto: number | null;
  concepto: string;
  comercio: string;
  categoria_sugerida: number | null;
  moneda_codigo: string;
  confianza: number;
  texto_completo: string;
}

interface ImportFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted: (data: ImportedData) => void;
}

const ImportFileModal: React.FC<ImportFileModalProps> = ({ isOpen, onClose, onDataExtracted }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setSuccess(false);
    setUploading(true);

    // Crear preview si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/api/v1/gastos/import-file`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setError(null);
        
        // Pasar datos extraídos al componente padre
        setTimeout(() => {
          onDataExtracted(response.data.data);
          onClose();
        }, 1500);
      } else {
        setError(response.data.message || 'No se pudo extraer información del documento');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        error.response?.data?.detail || 
        error.message || 
        'Error al procesar el archivo. Por favor intente nuevamente.'
      );
    } finally {
      setUploading(false);
    }
  }, [onClose, onDataExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false,
  });

  const handleClose = () => {
    setPreview(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importar Gasto</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sube una imagen o PDF de tu recibo/factura
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} disabled={uploading} />
            
            <div className="flex flex-col items-center space-y-4">
              {uploading ? (
                <>
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                  <p className="text-lg font-medium text-gray-700">
                    Procesando documento...
                  </p>
                  <p className="text-sm text-gray-500">
                    Esto puede tomar unos segundos
                  </p>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <p className="text-lg font-medium text-green-700">
                    ¡Documento procesado exitosamente!
                  </p>
                  <p className="text-sm text-gray-500">
                    Redirigiendo al formulario...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic para seleccionar'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Formatos: JPG, PNG, PDF (máx. 20MB)
                    </p>
                  </div>
                  <div className="flex items-center space-x-6 text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Image size={20} />
                      <span className="text-xs">Imágenes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText size={20} />
                      <span className="text-xs">PDFs</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Vista previa:</h3>
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 Consejos para mejores resultados:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Asegúrate de que el texto sea legible</li>
              <li>Evita sombras o reflejos en la imagen</li>
              <li>Toma la foto directamente desde arriba</li>
              <li>Incluye toda la información relevante (fecha, monto, concepto)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg
                     hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportFileModal;
