import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GastosFiltros } from '@components/gastos/GastosFiltros';
import type { Categoria } from '@services/api';

const mockCategorias: Categoria[] = [
  { 
    id_categoria: 1, 
    nombre: 'Alimentación',
    descripcion: 'Gastos de comida y bebida',
    es_personalizada: false
  },
  { 
    id_categoria: 2, 
    nombre: 'Transporte',
    descripcion: 'Gastos de transporte',
    es_personalizada: false
  },
  { 
    id_categoria: 3, 
    nombre: 'Entretenimiento',
    descripcion: 'Gastos de entretenimiento',
    es_personalizada: false
  }
];

const mockProps = {
  filtros: {},
  categorias: mockCategorias,
  onFiltrosChange: jest.fn(),
  onLimpiarFiltros: jest.fn()
};

describe('GastosFiltros Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debería renderizar todos los campos de filtro', () => {
    render(<GastosFiltros {...mockProps} />);

    // Verificar que todos los campos estén presentes
    expect(screen.getByPlaceholderText(/buscar por comercio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/desde/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hasta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
    expect(screen.getByText('Aplicar Filtros')).toBeInTheDocument();
  });

  test('debería permitir escribir en el campo de búsqueda', async () => {
    const user = userEvent.setup();
    render(<GastosFiltros {...mockProps} />);

    const searchInput = screen.getByPlaceholderText(/buscar por comercio/i);
    await user.type(searchInput, 'supermercado');

    expect(searchInput).toHaveValue('supermercado');
  });

  test('debería aplicar filtros al hacer clic en el botón', async () => {
    const user = userEvent.setup();
    render(<GastosFiltros {...mockProps} />);

    // Llenar algunos campos
    const searchInput = screen.getByPlaceholderText(/buscar por comercio/i);
    await user.type(searchInput, 'supermercado');

    const categorySelect = screen.getByLabelText(/categoría/i);
    await user.selectOptions(categorySelect, '1');

    // Hacer clic en aplicar filtros
    const applyButton = screen.getByText('Aplicar Filtros');
    await user.click(applyButton);

    // Verificar que se llamó la función con los filtros correctos
    await waitFor(() => {
      expect(mockProps.onFiltrosChange).toHaveBeenCalledWith(
        expect.objectContaining({
          busqueda: 'supermercado',
          categoria: 1
        })
      );
    });
  });

  test('debería limpiar filtros cuando se hace clic en limpiar', async () => {
    const user = userEvent.setup();
    const propsWithFilters = {
      ...mockProps,
      filtros: {
        busqueda: 'test',
        categoria: 1,
        fecha_desde: '2025-01-01'
      }
    };

    render(<GastosFiltros {...propsWithFilters} />);

    // Hacer clic en limpiar filtros
    const clearButton = screen.getByText('Limpiar Filtros');
    await user.click(clearButton);

    expect(mockProps.onLimpiarFiltros).toHaveBeenCalled();
  });

  test('debería mostrar las categorías en el selector', () => {
    render(<GastosFiltros {...mockProps} />);

    // Verificar que las opciones de categoría estén presentes
    expect(screen.getByText('Todas las categorías')).toBeInTheDocument();
    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.getByText('Entretenimiento')).toBeInTheDocument();
  });

  test('debería realizar búsqueda al presionar Enter', async () => {
    const user = userEvent.setup();
    render(<GastosFiltros {...mockProps} />);

    const searchInput = screen.getByPlaceholderText(/buscar por comercio/i);
    await user.type(searchInput, 'supermercado');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockProps.onFiltrosChange).toHaveBeenCalledWith(
        expect.objectContaining({
          busqueda: 'supermercado'
        })
      );
    });
  });
});