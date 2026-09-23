export function leerXER(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()

    lector.onload = (e) => {
      try {
        const texto = e.target.result
        const lineas = texto.split(/\r?\n/)

        let tablaActual = null
        let camposActuales = []

        const tablas = { PROJECT: [], TASK: [], TASKRSRC: [], PROJWBS: [] }

        for (let i = 0; i < lineas.length; i++) {
          const linea = lineas[i].trim()
          if (!linea) continue

          const partes = linea.split('\t')
          if (partes[0] === '%T') {
            tablaActual = partes[1]
            camposActuales = []
          } else if (partes[0] === '%F') {
            camposActuales = partes.slice(1)
          } else if (partes[0] === '%R' && tablaActual && tablas[tablaActual]) {
            const registro = {}
            partes.slice(1).forEach((val, idx) => {
              registro[camposActuales[idx]] = val !== undefined ? val : ''
            })
            tablas[tablaActual].push(registro)
          }
        }

        // 1. Extraer Data Date del Proyecto
        let dataDate = '2026-09-25 18:00'
        if (tablas.PROJECT.length > 0) {
          const proj = tablas.PROJECT[0]
          dataDate = proj.last_recalculate_date || proj.scd_end_date || proj.plan_start_date || dataDate
        }

        // 2. Sumar Horas Presupuestadas por tarea (Budgeted Labor Units)
        const hhPorTarea = {}
        tablas.TASKRSRC.forEach((r) => {
          const tId = r.task_id
          const qty = parseFloat(r.target_qty) || 0
          hhPorTarea[tId] = (hhPorTarea[tId] || 0) + qty
        })

        // 3. Extraer Jerarquía de WBS
        const mapaWBS = {}
        tablas.PROJWBS.forEach((w) => {
          mapaWBS[w.wbs_id] = { name: w.wbs_name || '', parentId: w.parent_wbs_id }
        })

        const getWBS3 = (wbsId) => {
          let curr = wbsId
          const chain = []
          while (curr && mapaWBS[curr]) {
            chain.unshift(mapaWBS[curr])
            curr = mapaWBS[curr].parentId
          }
          return chain.length >= 3 ? chain[2].name : chain[chain.length - 1]?.name || 'General'
        }

        const datos = []

        // Limpia cualquier indicador 'A' o '*' que coloca P6 en las fechas
        const cleanDate = (str) => {
          if (!str) return null
          const limpio = String(str).replace(/[A\*]/g, '').trim()
          return limpio.length > 0 ? limpio : null
        }

        tablas.TASK.forEach((t) => {
          if (!t.task_code && !t.task_id) return
          if (t.task_type === 'TT_WBS' || t.task_type === 'TT_LOE') return

          // CAUSA DEL ERROR RESUELTA AQUÍ:
          // P6 utiliza distintos campos si la línea base no está fija como Target.
          // Se evalúa en orden de prioridad de P6.
          const blStart = 
            cleanDate(t.target_start_date) || 
            cleanDate(t.early_start_date) || 
            cleanDate(t.restart_date)

          const blFinish = 
            cleanDate(t.target_end_date) || 
            cleanDate(t.early_end_date) || 
            cleanDate(t.reend_date)

          const actStart = cleanDate(t.act_start_date)
          const actFinish = cleanDate(t.act_end_date)

          const budgetHH = hhPorTarea[t.task_id] || parseFloat(t.target_work_qty) || 0
          
          let unitPct = parseFloat(t.unit_complete_pct)
          if (isNaN(unitPct)) unitPct = parseFloat(t.phys_complete_pct)
          if (t.status_code === 'TK_Complete') unitPct = 100
          if (isNaN(unitPct)) unitPct = 0

          datos.push({
            id: String(t.task_code || t.task_id),
            nombre: t.task_name || '',
            wbsName: getWBS3(t.wbs_id),
            budgetLaborUnits: budgetHH,
            porcentajeAvance: unitPct,
            blStart,
            blFinish,
            actStart,
            actFinish,
            status: t.status_code,
            dataDate,
          })
        })

        resolve(datos)
      } catch (err) {
        reject(err)
      }
    }

    lector.onerror = (err) => reject(err)
    lector.readAsText(archivo, 'ISO-8859-1')
  })
}