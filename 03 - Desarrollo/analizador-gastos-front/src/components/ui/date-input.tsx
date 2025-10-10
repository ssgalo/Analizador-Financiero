import React, { useState, useEffect } from "react"
import { Calendar } from "lucide-react"
import { formatDateToLocal, formatDateToISO } from "../../utils/formatters"

interface DateInputProps {
  label?: string
  value: string // En formato dd/mm/yyyy
  onChange: (value: string) => void // Devuelve dd/mm/yyyy
  error?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = "dd/mm/aaaa",
  className = "",
  disabled = false
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isoValue, setIsoValue] = useState("")

  // Convertir valor local a ISO para el input date
  useEffect(() => {
    if (value && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      setIsoValue(formatDateToISO(value))
    } else {
      setIsoValue("")
    }
  }, [value])

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value
    if (isoDate) {
      const localDate = formatDateToLocal(isoDate)
      onChange(localDate)
    } else {
      onChange("")
    }
    setShowDatePicker(false)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // Auto-formatear mientras escribe
    const cleanValue = inputValue.replace(/[^\d/]/g, '')
    
    // Auto-agregar barras después del día y mes
    if (cleanValue.length === 2 && !cleanValue.includes('/')) {
      inputValue = cleanValue + '/'
    } else if (cleanValue.length === 5 && cleanValue.split('/').length === 2) {
      inputValue = cleanValue + '/'
    } else {
      inputValue = cleanValue.slice(0, 10) // Limitar a dd/mm/yyyy
    }
    
    onChange(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
      // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true)) {
      return
    }
    // Solo permitir números y /
    if (!((e.keyCode >= 48 && e.keyCode <= 57) || e.keyCode === 191 || e.keyCode === 111)) {
      e.preventDefault()
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Input de texto visible para el usuario */}
        <input
          type="text"
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className={`
            flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
            ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
            focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
            disabled:opacity-50 pr-10 ${className}
            ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}
          `}
        />
        
        {/* Botón del calendario */}
        <button
          type="button"
          onClick={() => setShowDatePicker(true)}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Calendar className="h-4 w-4" />
        </button>

        {/* Input date oculto para abrir el selector nativo */}
        {showDatePicker && (
          <input
            type="date"
            value={isoValue}
            onChange={handleDatePickerChange}
            onBlur={() => setShowDatePicker(false)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            autoFocus
          />
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

export { DateInput }