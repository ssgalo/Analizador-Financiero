import { useState } from 'react';

export interface ImportedGastoData {
  fecha: string | null;
  monto: number | null;
  concepto: string;
  comercio: string;
  categoria_sugerida: number | null;
  moneda_codigo: string;
  confianza: number;
  texto_completo: string;
}

export const useImportGasto = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedData, setImportedData] = useState<ImportedGastoData | null>(null);

  const openImportModal = () => {
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleDataExtracted = (data: ImportedGastoData) => {
    setImportedData(data);
  };

  const clearImportedData = () => {
    setImportedData(null);
  };

  return {
    isImportModalOpen,
    openImportModal,
    closeImportModal,
    importedData,
    handleDataExtracted,
    clearImportedData,
  };
};
