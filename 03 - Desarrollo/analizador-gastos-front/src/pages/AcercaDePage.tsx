import React from 'react';
import { Info, Users, GraduationCap } from 'lucide-react';

const AcercaDePage: React.FC = () => {
  const integrantes = [
    'Ezequiel Catania',
    'Julian Castellana', 
    'Nicolas Militello',
    'Santiago Galo',
    'Stefania Violi'
  ];

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Info className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Acerca de</h1>
              <p className="text-gray-600">Información del proyecto</p>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información del Proyecto */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <GraduationCap className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Proyecto Académico</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Descripción</h3>
                <p className="text-gray-600 leading-relaxed">
                  Proyecto realizado durante el segundo cuatrimestre del 2025 de la materia 
                  <span className="font-semibold text-blue-600"> Inteligencia Artificial Aplicada</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Información del Equipo */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Equipo de Desarrollo</h2>
            </div>
            <div className="space-y-3">
              {integrantes.map((nombre, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {nombre.split(' ').map(n => n.charAt(0)).join('')}
                  </div>
                  <span className="text-gray-900 font-medium">{nombre}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcercaDePage;