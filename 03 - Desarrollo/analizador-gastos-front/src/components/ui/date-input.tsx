import React, { useState, useEffect, useRef } from "react"
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
  const [isoValue, setIsoValue] = useState("")
  const [internalError, setInternalError] = useState("")
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Convertir valor local a ISO para el input date
  useEffect(() => {
    if (value && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      if (validateDateValue(value)) {
        setIsoValue(formatDateToISO(value))
        setInternalError("")
      } else {
        setIsoValue("")
        setInternalError("Fecha inválida")
      }
    } else {
      setIsoValue("")
      if (value && value.length > 0) {
        setInternalError("Formato incompleto (dd/mm/aaaa)")
      } else {
        setInternalError("")
      }
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
  }

  const handleCalendarClick = () => {
    if (dateInputRef.current && !disabled) {
      dateInputRef.current.showPicker()
    }
  }

  const validateDateValue = (value: string): boolean => {
    // Validar formato completo dd/mm/yyyy
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return false
    }

    const [day, month, year] = value.split('/').map(Number)
    
    // Validar rangos básicos
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
      return false
    }

    // Crear fecha y validar que es real
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    
    // Solo permitir números y barras
    const cleanValue = inputValue.replace(/[^\d/]/g, '')
    
    // Separar en partes
    const parts = cleanValue.split('/')
    
    // Validar cada parte pero mantener la estructura
    let formattedValue = ''
    
    // Procesar día (primera parte)
    if (parts[0] !== undefined) {
      let day = parts[0].slice(0, 2) // Máximo 2 dígitos
      
      // Auto-completar día si es necesario
      if (day.length === 1 && parseInt(day) > 3) {
        day = '0' + day
      }
      
      // Validar día si está completo
      if (day.length === 2) {
        const dayNum = parseInt(day)
        if (dayNum < 1 || dayNum > 31) {
          return // No permitir días inválidos
        }
      }
      
      formattedValue = day
      
      // Agregar barra después del día si hay más contenido o si ya tenía barra
      if (parts.length > 1 || (inputValue.includes('/') && day.length >= 2)) {
        formattedValue += '/'
      }
    }
    
    // Procesar mes (segunda parte)
    if (parts[1] !== undefined) {
      let month = parts[1].slice(0, 2) // Máximo 2 dígitos
      
      // Auto-completar mes si es necesario
      if (month.length === 1 && parseInt(month) > 1) {
        month = '0' + month
      }
      
      // Validar mes si está completo
      if (month.length === 2) {
        const monthNum = parseInt(month)
        if (monthNum < 1 || monthNum > 12) {
          return // No permitir meses inválidos
        }
      }
      
      formattedValue += month
      
      // Agregar barra después del mes si hay más contenido o si ya tenía barra
      if (parts.length > 2 || (inputValue.lastIndexOf('/') > inputValue.indexOf('/') && month.length >= 2)) {
        formattedValue += '/'
      }
    }
    
    // Procesar año (tercera parte)
    if (parts[2] !== undefined) {
      let year = parts[2].slice(0, 4) // Máximo 4 dígitos
      
      // Validar año si está completo
      if (year.length === 4) {
        const yearNum = parseInt(year)
        if (yearNum < 1900 || yearNum > 2100) {
          return // No permitir años fuera del rango
        }
      }
      
      formattedValue += year
    }
    
    // Limitar longitud total
    formattedValue = formattedValue.slice(0, 10)
    
    // Validación final para fechas completas
    if (formattedValue.length === 10 && formattedValue.includes('/')) {
      if (!validateDateValue(formattedValue)) {
        return // No actualizar si la fecha completa es inválida
      }
    }
    
    onChange(formattedValue)
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

  const currentError = error || internalError
  const hasError = Boolean(currentError)

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
            ${hasError ? 'border-red-500 focus-visible:ring-red-500' : ''}
            ${value && !hasError && value.length === 10 ? 'border-green-500' : ''}
          `}
        />
        
        {/* Botón del calendario */}
        <button
          type="button"
          onClick={handleCalendarClick}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
        >
          <Calendar className="h-4 w-4" />
        </button>

        {/* Input date oculto para el selector nativo */}
        <input
          ref={dateInputRef}
          type="date"
          value={isoValue}
          onChange={handleDatePickerChange}
          className="absolute inset-0 opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      </div>
      
      {currentError && (
        <p className="text-sm text-red-500">{currentError}</p>
      )}
      
      {/* Indicador de formato para ayudar al usuario */}
      {!currentError && value && value.length < 10 && (
        <p className="text-xs text-gray-500">
          Formato: dd/mm/aaaa (ejemplo: 25/12/2024)
        </p>
      )}
    </div>
  )
}

export { DateInput }