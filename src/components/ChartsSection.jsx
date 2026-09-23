import { useMemo } from 'react'
import Curvas from './Curvas'
import { calcularCurvaS, calcularAvanceWBS } from '../utils/chartData'

function ChartsSection({ datos = [] }) {
  const curvaS = useMemo(() => calcularCurvaS(datos), [datos])
  const datosWBS = useMemo(() => calcularAvanceWBS(datos), [datos])

  return (
    <div className="w-full mb-6">
      <Curvas datos={curvaS || []} datosWBS={datosWBS || []} />
    </div>
  )
}

export default ChartsSection