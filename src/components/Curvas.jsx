import React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export default function Curvas({ datos = [], datosWBS = [] }) {
  const listaCurva = Array.isArray(datos) ? datos : []
  const listaWBS = Array.isArray(datosWBS) ? datosWBS : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. SECCIÓN GRÁFICO CURVA S (Izquierda) */}
      <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Avance de Comisionamiento — Curva S</h2>
          <p className="text-xs text-slate-400">
            Avance acumulado semanal (Cortes día Viernes desde 19/08 hasta 18/12)
          </p>
        </div>

        <div className="h-80 w-full">
          {listaCurva.length === 0 ? (
            <div className="h-full flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
              <p className="text-sm text-slate-500">
                Carga un archivo .XER o .XLSX para visualizar la Curva S
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={listaCurva} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="etiqueta" 
                  stroke="#64748b" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                />
                <YAxis
                  stroke="#64748b"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  formatter={(val, name) => [val !== null && val !== undefined ? `${val}%` : 'Sin datos', name]}
                />
                <Legend verticalAlign="top" height={36} />
                
                {/* Línea Base Planificada (Azul) - Se extiende de Agosto a Diciembre */}
                <Line
                  type="monotone"
                  dataKey="planificado"
                  name="Línea Base (Plan)"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 6 }}
                />

                {/* Ejecutado Real (Verde) - Se corta automáticamente en la Data Date */}
                <Line
                  type="monotone"
                  dataKey="real"
                  name="Ejecutado (Real)"
                  stroke="#4ade80"
                  strokeWidth={3}
                  connectNulls={false}
                  dot={{ r: 3, fill: '#4ade80' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. SECCIÓN TABLA WBS NIVEL 3 (Derecha) */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl shadow-lg backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-4">Avance Ponderado por WBS (Nivel 3)</h2>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {listaWBS.length === 0 ? (
            <p className="text-xs text-slate-500">Sin datos de WBS para mostrar.</p>
          ) : (
            listaWBS.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
                <span className="w-1/2 text-slate-300 truncate font-medium">{item.wbs || 'General'}</span>
                <span className="w-1/6 text-right text-slate-400">{`${item.horasBase || item.horasTotales || 0} h`}</span>
                <span className="w-1/6 text-right font-bold text-cyan-400">{`${item.avancePorcentaje || item.avancePonderado || 0}%`}</span>

                {/* Barra de progreso de la WBS */}
                <div className="w-1/6 ml-2 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-2 rounded-full"
                    style={{ width: `${Math.min(100, item.avancePorcentaje || item.avancePonderado || 0)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}