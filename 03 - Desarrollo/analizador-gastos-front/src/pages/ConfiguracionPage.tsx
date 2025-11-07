import { useState } from 'react';
import { User, Camera, Mail, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from '../components/ui/button';
import { useAuthStore } from '../stores/authStore';
import { ChangePasswordModal } from '../components/user/ChangePasswordModal';
import { apiClient } from '../services/api';

export default function ConfiguracionPage() {
  const { user } = useAuthStore();
  const [newPhoto] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || ''
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveProfile = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await apiClient.put('/usuarios/me', formData);
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      // Actualizar el store con los nuevos datos (por ahora solo refrescamos)
      if (user) {
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload();
      }
    } catch (err: unknown) {
      console.error('Error al actualizar perfil:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setError(axiosError.response?.data?.detail || 'Error al actualizar el perfil');
      } else {
        setError('Error al actualizar el perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      nombre: user?.nombre || '',
      email: user?.email || ''
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
          <p className="text-gray-600">Personaliza tu perfil y preferencias</p>
        </div>

        <div className="grid gap-6">
          {/* Perfil de Usuario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Perfil de Usuario
              </CardTitle>
              <CardDescription>Administra tu información personal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mensajes de error y éxito */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                  {success}
                </div>
              )}

              {/* Foto de Perfil */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {newPhoto ? (
                      <img 
                        src={newPhoto} 
                        alt="Foto de perfil" 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(formData.nombre || user?.nombre || 'Usuario')
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-gray-300 rounded-full p-2 shadow-lg border border-gray-200 cursor-not-allowed">
                    <Camera className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Foto de Perfil</h3>
                  <p className="text-sm text-gray-500">
                    Próximamente podrás cambiar tu foto de perfil
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Esta funcionalidad estará disponible en una futura actualización
                  </p>
                </div>
              </div>

              {/* Nombre de Usuario */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa tu nombre"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-900">{user?.nombre || 'No especificado'}</span>
                  </div>
                )}
              </div>

              {/* Usuario (solo lectura) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre de Usuario</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-900">@{user?.usuario || 'No especificado'}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    El nombre de usuario es único y no se puede modificar
                  </p>
                </div>
              </div>

              {/* Email (solo lectura) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Correo Electrónico
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-900">{user?.email || 'No especificado'}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    El correo electrónico no se puede modificar
                  </p>
                </div>
              </div>

              {/* Estado de la cuenta */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estado de la Cuenta</label>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user?.estado === 'activo' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.estado === 'activo' ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      Editar Perfil
                    </Button>
                    <Button
                      onClick={() => setShowPasswordModal(true)}
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      Cambiar Contraseña
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cambiar Contraseña */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}