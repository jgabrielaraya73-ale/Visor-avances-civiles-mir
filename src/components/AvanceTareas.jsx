import React, { useState } from 'react';

export const AvanceTareas = ({ categories }) => {
  const [selectedCategory, setSelectedCategory] = useState('TODAS');

  if (!categories || categories.length === 0) return null;

  // Filtrar categorías según el botón seleccionado
  const filteredCategories = selectedCategory === 'TODAS'
    ? categories
    : categories.filter((c) => c.categoryName === selectedCategory);

  // Recalcular métricas generales según el filtro activo
  let grandTotalObj = 0;
  let grandTotalReal = 0;

  filteredCategories.forEach((cat) => {
    grandTotalObj += cat.objetivoTotal;
    grandTotalReal += cat.ejecutadoTotal;
  });

  const grandPendiente = Math.max(0, grandTotalObj - grandTotalReal);
  const grandPorcentaje = grandTotalObj > 0 
    ? ((grandTotalReal / grandTotalObj) * 100).toFixed(1) + '%' 
    : '0%';

  return (
    <div className="space-y-8">
      {/* Indicadores Globales / Filtrados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl shadow-lg border-l-4 border-l-blue-500">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Objetivo Total</span>
          <p className="text-3xl font-extrabold text-white mt-1">
            {grandTotalObj.toFixed(2)} <span className="text-lg text-slate-400 font-normal">m³</span>
          </p>
        </div>
        <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl shadow-lg border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ejecutado Real</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">
            {grandTotalReal.toFixed(2)} <span className="text-lg text-slate-400 font-normal">m³</span>
          </p>
        </div>
        <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl shadow-lg border-l-4 border-l-amber-500">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pendiente a Ejecutar</span>
          <p className="text-3xl font-extrabold text-amber-400 mt-1">
            {grandPendiente.toFixed(2)} <span className="text-lg text-slate-400 font-normal">m³</span>
          </p>
        </div>
        <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl shadow-lg border-l-4 border-l-indigo-500">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">% Avance Global</span>
          <p className="text-3xl font-extrabold text-indigo-400 mt-1">{grandPorcentaje}</p>
        </div>
      </div>

      {/* Botones de Filtro por Categorías Padre */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <span className="block text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">
          Filtrar por Categoría Principal:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('TODAS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow ${
              selectedCategory === 'TODAS'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            TODAS LAS CATEGORÍAS
          </button>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategory(cat.categoryName)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow ${
                selectedCategory === cat.categoryName
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {cat.categoryName} ({cat.porcentajeAvance}%)
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Bloques y Tareas Hijas */}
      <div className="space-y-8">
        {filteredCategories.map((cat, catIdx) => (
          <div key={catIdx} className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
            {/* Título de Categoría Naranja / Padre */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/40 pb-4 mb-6 gap-2">
              <h3 className="text-lg font-extrabold text-amber-400 tracking-wide flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                {cat.categoryName}
              </h3>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
                <span>Total: <strong className="text-white">{cat.objetivoTotal} m³</strong></span>
                <span>Ejecutado: <strong className="text-emerald-400">{cat.ejecutadoTotal} m³</strong></span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  {cat.porcentajeAvance}%
                </span>
              </div>
            </div>

            {/* Grid de 3 Columnas para Tareas Hijas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.tasks.map((item, taskIdx) => (
                <div
                  key={taskIdx}
                  className="bg-slate-900/80 border border-slate-700/70 p-4 rounded-xl shadow hover:border-slate-600 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="text-sm font-bold text-slate-100 line-clamp-2 min-h-[2.5rem]" title={item.tarea}>
                        {item.tarea}
                      </h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-extrabold shrink-0 ${
                          item.porcentajeAvance >= 100
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item.porcentajeAvance > 50
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {item.porcentajeAvance}%
                      </span>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          item.porcentajeAvance >= 100
                            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                            : item.porcentajeAvance > 50
                            ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                            : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        }`}
                        style={{ width: `${Math.min(item.porcentajeAvance, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Métricas Inferiores */}
                  <div className="grid grid-cols-3 text-xs border-t border-slate-800 pt-2.5 text-slate-400">
                    <div>
                      <span className="block text-[10px] uppercase text-slate-500 font-semibold">Total</span>
                      <strong className="text-slate-200">{item.objetivoTotal} {item.unidad}</strong>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] uppercase text-slate-500 font-semibold">Ejecutado</span>
                      <strong className="text-emerald-400">{item.ejecutadoTotal} {item.unidad}</strong>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase text-slate-500 font-semibold">Remanente</span>
                      <strong className="text-amber-400">{item.remanente} {item.unidad}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};