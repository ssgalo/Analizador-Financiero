import { useState } from 'react';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { apiClient } from '../../services/api';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    contraseña_actual: '',
    contraseña_nueva: '',
    confirmar_contraseña: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!formData.contraseña_actual || !formData.contraseña_nueva || !formData.confirmar_contraseña) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (formData.contraseña_nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.contraseña_nueva !== formData.confirmar_contraseña) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/usuarios/cambiar-contraseña', {
        contraseña_actual: formData.contraseña_actual,
        contraseña_nueva: formData.contraseña_nueva
      });

      setSuccess('Contraseña actualizada correctamente');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      console.error('Error al cambiar contraseña:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setError(axiosError.response?.data?.detail || 'Error al cambiar la contraseña');
      } else {
        setError('Error al cambiar la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Cambiar Contraseña</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Contraseña Actual */}
          <div>
            <label htmlFor="contraseña_actual" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <input
              type="password"
              id="contraseña_actual"
              value={formData.contraseña_actual}
              onChange={(e) => setFormData({ ...formData, contraseña_actual: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa tu contraseña actual"
              disabled={loading}
            />
          </div>

          {/* Nueva Contraseña */}
          <div>
            <label htmlFor="contraseña_nueva" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="contraseña_nueva"
              value={formData.contraseña_nueva}
              onChange={(e) => setFormData({ ...formData, contraseña_nueva: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa tu nueva contraseña"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div>
            <label htmlFor="confirmar_contraseña" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirmar_contraseña"
              value={formData.confirmar_contraseña}
              onChange={(e) => setFormData({ ...formData, confirmar_contraseña: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirma tu nueva contraseña"
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
