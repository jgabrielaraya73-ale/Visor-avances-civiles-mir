// Convierte strings de fecha de P6 (ej: "2026-09-18 08:00" o "19-Aug-26") a Timestamp
function toTime(val) {
  if (!val) return null
  const clean = String(val).replace(/[A\*]/g, '').trim()
  if (!clean) return null

  // 1. Si viene en formato ISO YYYY-MM-DD (ej: "2026-09-18 08:00")
  if (clean.includes('-') && clean.split('-')[0].length === 4) {
    const partes = clean.split(' ')[0].split('-')
    const a = parseInt(partes[0], 10)
    const m = parseInt(partes[1], 10) - 1
    const d = parseInt(partes[2], 10)
    return new Date(a, m, d, 12, 0, 0).getTime()
  }

  // 2. Si viene en formato DD-MMM-YY (ej: "19-Aug-26")
  const meses = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
  const partes = clean.split(' ')[0].split(/[\/\.-]/)

  if (partes.length === 3) {
    let d = parseInt(partes[0], 10)
    let mStr = partes[1].toLowerCase()
    let a = parseInt(partes[2], 10)
    if (a < 100) a += 2000

    if (meses[mStr] !== undefined) {
      return new Date(a, meses[mStr], d, 12, 0, 0).getTime()
    }
  }

  const dObj = new Date(clean)
  return isNaN(dObj.getTime()) ? null : dObj.getTime()
}

export function calcularCurvaS(datos) {
  if (!datos || !Array.isArray(datos) || datos.length === 0) return []

  // Rango global del proyecto
  const inicioProyecto = new Date(2026, 7, 19).getTime() // 19 Aug 2026
  const finProyecto = new Date(2026, 11, 18).getTime()   // 18 Dec 2026

  // FIX CLAVE 1: Forzar Data Date del corte real al 25 de Septiembre de 2026
  const tDataDate = new Date(2026, 8, 25, 23, 59, 59).getTime() 

  // FIX CLAVE 2: Parseo de fechas corregido por tarea
  const tareas = datos.map((d) => {
    const start = toTime(d.blStart) || inicioProyecto
    const finish = toTime(d.blFinish) || finProyecto
    const actStart = toTime(d.actStart)

    let hh = d.budgetLaborUnits || 0
    if (hh === 0 && finish >= start) {
      hh = Math.max(1, (finish - start) / (1000 * 3600 * 24))
    }

    return {
      ...d,
      peso: hh,
      tStart: start,
      tFinish: finish,
      tActStart: actStart,
    }
  })

  const totalHH = tareas.reduce((acc, t) => acc + t.peso, 0) || 1

  // Generar la secuencia de cortes semanales (Viernes)
  const cortes = []
  let actual = new Date(inicioProyecto)
  const fechaFin = new Date(finProyecto)

  const offset = (5 + 7 - actual.getDay()) % 7
  actual.setDate(actual.getDate() + offset)

  while (actual <= fechaFin) {
    cortes.push(new Date(actual))
    actual.setDate(actual.getDate() + 7)
  }
  if (cortes[cortes.length - 1].getTime() < finProyecto) {
    cortes.push(new Date(finProyecto))
  }

  return cortes.map((fCorte, idx) => {
    const tCorte = fCorte.getTime()

    // 1. LÍNEA BASE (PLANIFICADO) - Prorrateo diario real entre inicio y fin de la tarea
    let hhPlan = 0
    tareas.forEach((t) => {
      if (tCorte >= t.tFinish) {
        hhPlan += t.peso
      } else if (tCorte > t.tStart && t.tFinish > t.tStart) {
        const duracionTotal = t.tFinish - t.tStart
        const transcurrido = tCorte - t.tStart
        hhPlan += (transcurrido / duracionTotal) * t.peso
      }
    })

    let planPct = Math.min(100, (hhPlan / totalHH) * 100)
    if (idx === cortes.length - 1) planPct = 100

    // 2. EJECUTADO (REAL) - Solo acumula hasta el 25/09; luego pasa 'undefined' para cortar la línea
    let realPct = undefined

    if (tCorte <= tDataDate + (12 * 3600 * 1000)) {
      let hhReal = 0
      tareas.forEach((t) => {
        const pct = t.porcentajeAvance || 0
        if (pct > 0) {
          if (!t.tActStart || tCorte >= t.tActStart) {
            hhReal += (pct / 100) * t.peso
          }
        }
      })
      realPct = Number(Math.min(100, (hhReal / totalHH) * 100).toFixed(2))
    }

    const dia = String(fCorte.getDate()).padStart(2, '0')
    const mes = String(fCorte.getMonth() + 1).padStart(2, '0')

    return {
      fecha: fCorte.toISOString().split('T')[0],
      etiqueta: `${dia}/${mes}`,
      planificado: Number(planPct.toFixed(2)),
      real: realPct,
    }
  })
}

export function calcularAvanceWBS(datos) {
  if (!datos || !Array.isArray(datos)) return []
  const agrupado = {}

  datos.forEach((d) => {
    const hh = d.budgetLaborUnits || 0
    if (hh <= 0) return
    const wbs = d.wbsName || 'General'
    const pct = d.porcentajeAvance || 0

    if (!agrupado[wbs]) {
      agrupado[wbs] = { wbs, totalHH: 0, ganadasHH: 0 }
    }
    agrupado[wbs].totalHH += hh
    agrupado[wbs].ganadasHH += (pct / 100) * hh
  })

  return Object.values(agrupado)
    .map((item) => {
      const pct = item.totalHH > 0 ? (item.ganadasHH / item.totalHH) * 100 : 0
      return {
        wbs: item.wbs,
        horasBase: Math.round(item.totalHH),
        horasTotales: Math.round(item.totalHH),
        avancePorcentaje: Number(pct.toFixed(2)),
        avancePonderado: Number(pct.toFixed(2)),
      }
    })
    .sort((a, b) => b.horasBase - a.horasBase)
}