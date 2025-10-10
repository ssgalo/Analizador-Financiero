import { Modal } from "../ui/modal"
import { Button } from "../ui/button"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
import type { Gasto } from "../../services/api"
import { formatCurrency, formatDisplayDate } from "../../utils/formatters"

interface ModalEliminarGastoProps {
  isOpen: boolean
  gasto: Gasto | null
  isDeleting: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ModalEliminarGasto({ 
  isOpen, 
  gasto, 
  isDeleting, 
  onConfirmar, 
  onCancelar 
}: ModalEliminarGastoProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancelar}
      title="Confirmar Eliminación"
    >
      <div className="space-y-4">
        {/* Icono de advertencia */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Mensaje */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            ¿Estás seguro que deseas eliminar este gasto?
          </h3>
          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Detalles del gasto */}
        {gasto && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Comercio:</span>
              <span className="text-gray-900">{gasto.comercio}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Descripción:</span>
              <span className="text-gray-900">{gasto.descripcion}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Monto:</span>
              <span className="text-gray-900 font-semibold">
                ${formatCurrency(gasto.monto)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Fecha:</span>
              <span className="text-gray-900">
                {formatDisplayDate(gasto.fecha)}
              </span>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onCancelar}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirmar}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
