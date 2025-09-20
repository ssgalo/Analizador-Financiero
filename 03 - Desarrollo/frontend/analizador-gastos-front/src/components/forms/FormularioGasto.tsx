import React, { useState, useEffect } from "react"
import { Modal } from "../ui/modal"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select } from "../ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Save, X, Loader2, DollarSign, FileText, Tag, Building } from "lucide-react"
import type { Gasto, Categoria } from "../../services/mockApi"
import { formatDateToLocal, formatDateToISO, getCurrentDateISO, formatNumber, parseLocalNumber } from "../../utils/formatters"
import { DateInput } from "../ui/date-input"
import { useColors } from "../../hooks/useColors"

interface FormularioGastoProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (gasto: Omit<Gasto, 'id_gasto' | 'fecha_creacion' | 'fecha_modificacion'>) => Promise<void>
  onUpdate?: (id: number, gasto: Partial<Gasto>) => Promise<void>
  categorias: Categoria[]
  gastoEditar?: Gasto | null
  isLoading?: boolean
}

interface FormData {
  fecha: string // En formato dd/mm/yyyy para mostrar al usuario
  monto: string // En formato local con coma decimal
  descripcion: string
  comercio: string
  id_categoria: string
}

interface FormErrors {
  fecha?: string
  monto?: string
  descripcion?: string
  comercio?: string
  id_categoria?: string
}

const FormularioGasto: React.FC<FormularioGastoProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  categorias,
  gastoEditar,
  isLoading = false
}) => {
  const { colors, getHoverStyles } = useColors()
  
  const [formData, setFormData] = useState<FormData>({
    fecha: formatDateToLocal(getCurrentDateISO()),
    monto: '',
    descripcion: '',
    comercio: '',
    id_categoria: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Llenar formulario cuando se edita un gasto
  useEffect(() => {
    if (gastoEditar) {
      setFormData({
        fecha: formatDateToLocal(gastoEditar.fecha),
        monto: formatNumber(gastoEditar.monto),
        descripcion: gastoEditar.descripcion,
        comercio: gastoEditar.comercio,
        id_categoria: gastoEditar.id_categoria.toString()
      })
    } else {
      // Resetear formulario para nuevo gasto
      setFormData({
        fecha: formatDateToLocal(getCurrentDateISO()),
        monto: '',
        descripcion: '',
        comercio: '',
        id_categoria: ''
      })
    }
    setErrors({})
  }, [gastoEditar, isOpen])

  const opcionesCategorias = [
    { value: '', label: 'Selecciona una categoría' },
    ...categorias.map(cat => ({ value: cat.id_categoria.toString(), label: cat.nombre }))
  ]



  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    
    // Formatear monto automáticamente (la fecha la maneja DateInput)
    if (field === 'monto') {
      // Permitir solo números, puntos y comas
      formattedValue = value.replace(/[^\d.,]/g, '');
      // Asegurar solo una coma decimal
      const parts = formattedValue.split(',');
      if (parts.length > 2) {
        formattedValue = parts[0] + ',' + parts.slice(1).join('');
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validar fecha formato dd/mm/yyyy
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida'
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.fecha)) {
      newErrors.fecha = 'Formato de fecha inválido (dd/mm/aaaa)'
    } else {
      // Validar que la fecha sea válida
      const [day, month, year] = formData.fecha.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        newErrors.fecha = 'Fecha inválida'
      }
    }

    // Validar monto en formato local
    if (!formData.monto) {
      newErrors.monto = 'El monto es requerido'
    } else {
      const monto = parseLocalNumber(formData.monto);
      if (isNaN(monto) || monto <= 0) {
        newErrors.monto = 'El monto debe ser mayor a 0'
      }
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida'
    }

    if (!formData.comercio.trim()) {
      newErrors.comercio = 'El comercio es requerido'
    }

    if (!formData.id_categoria) {
      newErrors.id_categoria = 'La categoría es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const gastoData = {
        id_usuario: 1, // Por ahora hardcodeado
        fecha: formatDateToISO(formData.fecha), // Convertir de dd/mm/yyyy a yyyy-mm-dd
        monto: parseLocalNumber(formData.monto), // Convertir de formato local a número
        descripcion: formData.descripcion.trim(),
        comercio: formData.comercio.trim(),
        id_categoria: parseInt(formData.id_categoria),
        fuente: 'manual' as const,
        estado: 'activo' as const
      }

      if (gastoEditar && onUpdate) {
        await onUpdate(gastoEditar.id_gasto, gastoData)
      } else {
        await onSubmit(gastoData)
      }

      onClose()
    } catch (error) {
      console.error('Error al guardar gasto:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const isEditMode = !!gastoEditar
  const title = isEditMode ? 'Editar Gasto' : 'Nuevo Gasto'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          {/* Información del formulario */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-teal" />
                <span>Información del Gasto</span>
              </CardTitle>
              <CardDescription>
                {isEditMode 
                  ? 'Actualiza la información del gasto seleccionado'
                  : 'Completa los datos para registrar un nuevo gasto'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primera fila: Fecha y Monto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <DateInput
                    label="Fecha"
                    value={formData.fecha}
                    onChange={(value) => handleInputChange('fecha', value)}
                    error={errors.fecha}
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    label="Monto" 
                    placeholder="0,00"
                    value={formData.monto}
                    onChange={(e) => handleInputChange('monto', e.target.value)}
                    error={errors.monto}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Segunda fila: Comercio y Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Building className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input
                    label="Comercio"
                    placeholder="Ej: Supermercado Disco"
                    value={formData.comercio}
                    onChange={(e) => handleInputChange('comercio', e.target.value)}
                    error={errors.comercio}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Tag className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Select
                    label="Categoría"
                    options={opcionesCategorias}
                    value={formData.id_categoria}
                    onChange={(e) => handleInputChange('id_categoria', e.target.value)}
                    error={errors.id_categoria}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tercera fila: Descripción */}
              <Input
                label="Descripción"
                placeholder="Ej: Compra semanal de verduras y carnes"
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                error={errors.descripcion}
              />
            </CardContent>
          </Card>
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            {...getHoverStyles('outline')}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            style={{
              backgroundColor: colors.primary,
              color: 'white'
            }}
            {...getHoverStyles('primary')}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSubmitting 
              ? (isEditMode ? 'Actualizando...' : 'Guardando...') 
              : (isEditMode ? 'Actualizar' : 'Guardar')
            }
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export { FormularioGasto }