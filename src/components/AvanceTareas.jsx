import React from 'react';

export const AvanceTareas = ({ summaryInfo, tasks }) => {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="space-y-8">
      {/* Tarjetas Resumen General Superior (Tema Oscuro) */}
      {summaryInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl shadow-lg border-l-4 border-l-blue-500">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Objetivo Total</span>
            <p className="text-3xl font-extrabold text-white mt-1">{summaryInfo.objetivoTotal} <span className="text-lg text-slate-400 font-normal">m³</span></p>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl shadow-lg border-l-4 border-l-emerald-500">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ejecutado Real</span>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{summaryInfo.ejecutadoTotal} <span className="text-lg text-slate-400 font-normal">m³</span></p>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl shadow-lg border-l-4 border-l-amber-500">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pendiente a Ejecutar</span>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">{summaryInfo.pendienteTotal} <span className="text-lg text-slate-400 font-normal">m³</span></p>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 p-5 rounded-xl shadow-lg border-l-4 border-l-indigo-500">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">% Avance Global</span>
            <p className="text-3xl font-extrabold text-indigo-400 mt-1">{summaryInfo.porcentajeAvance}</p>
          </div>
        </div>
      )}

      {/* Sección Principal con Grid de 3 Columnas por Fila */}
      <div className="bg-slate-800/60 border border-slate-700/80 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-3 flex items-center justify-between">
          <span>Estado de Avance por Tareas (Hormigón H-35)</span>
          <span className="text-xs font-normal text-slate-400 bg-slate-700/60 px-3 py-1 rounded-full">
            {tasks.length} Tareas Consolidadas
          </span>
        </h3>

        {/* Grid: 1 col en celular, 2 en tablet, 3 en pantallas anchas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((item, index) => (
            <div
              key={index}
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

              {/* Métricas Inferiores de la Tarjeta */}
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
    </div>
  );
};