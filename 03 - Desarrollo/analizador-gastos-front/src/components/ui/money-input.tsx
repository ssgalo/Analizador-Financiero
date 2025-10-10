import React from "react"
import { DollarSign } from "lucide-react"

interface MoneyInputProps {
  label?: string
  value: string // En formato local (ej: "1.234,56")
  onChange: (value: string) => void // Devuelve formato local
  error?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

const MoneyInput: React.FC<MoneyInputProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = "0,00",
  className = "",
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    // Permitir solo números, puntos y comas
    inputValue = inputValue.replace(/[^\d.,]/g, '')
    
    // Asegurar solo una coma decimal
    const parts = inputValue.split(',')
    if (parts.length > 2) {
      inputValue = parts[0] + ',' + parts.slice(1).join('')
    }
    
    // Limitar decimales a 2 dígitos
    if (parts.length === 2 && parts[1].length > 2) {
      inputValue = parts[0] + ',' + parts[1].slice(0, 2)
    }

    onChange(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir backspace, delete, tab, escape, enter, flechas
    if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
      // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true)) {
      return
    }
    // Solo permitir números, punto y coma
    if (!((e.keyCode >= 48 && e.keyCode <= 57) || // números
          (e.keyCode >= 96 && e.keyCode <= 105) || // numpad
          e.keyCode === 188 || // coma
          e.keyCode === 190 || // punto
          e.keyCode === 110)) { // punto numpad
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
        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm 
            ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
            focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
            disabled:opacity-50 ${className}
            ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}
          `}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

export { MoneyInput }