import * as XLSX from 'xlsx';

// Función Inteligente y Dinámica para limpiar y agrupar categorías
const sanitizeCategoryName = (rawText) => {
  if (!rawText) return '';

  let cleaned = rawText.toString().trim();

  // 1. Elimina prefijos típicos de hormigón/especificación (ej. "H35 ", "H-35 ", "H21 ")
  cleaned = cleaned.replace(/^H-?\d+\s*/i, '');

  // 2. Elimina cualquier texto dentro de paréntesis (ej. "(CTE-01@CTE-02)")
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');

  // 3. Elimina signos de interrogación o caracteres basura al final (ej. "???")
  cleaned = cleaned.replace(/[\?\!]+/g, '');

  // 4. Limpia espacios sobrantes
  cleaned = cleaned.trim();

  // Si después de limpiar quedó vacío, devolvemos el texto original trimmed
  return cleaned || rawText.toString().trim();
};

// Clave única normalizada para agrupar (evita duplicados por minúsculas/mayúsculas o tildes)
const getNormalizedKey = (text) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
};

export const parseExcelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!rawData || rawData.length === 0) {
          throw new Error('La planilla está vacía.');
        }

        // 1. Extraer Encabezado/Metadatos del Proyecto
        let headerInfo = {
          contrato: 'N/A',
          proyecto: 'N/A',
          contratista: 'N/A',
          cliente: 'N/A',
          nroReporte: 'N/A',
          ubicacion: 'N/A',
        };

        for (let i = 0; i < Math.min(12, rawData.length); i++) {
          const rowStr = rawData[i].map((c) => String(c).toUpperCase()).join(' ');
          if (rowStr.includes('CONTRATO:')) headerInfo.contrato = rawData[i][2] || rawData[i][3] || 'N/A';
          if (rowStr.includes('PROYECTO:')) headerInfo.proyecto = rawData[i][2] || rawData[i][3] || 'N/A';
          if (rowStr.includes('CONTRATISTA:')) headerInfo.contratista = rawData[i][2] || rawData[i][3] || 'N/A';
          if (rowStr.includes('CLIENTE:')) headerInfo.cliente = rawData[i][2] || rawData[i][3] || 'N/A';
          if (rowStr.includes('NRO. REPORTE:')) headerInfo.nroReporte = rawData[i][2] || rawData[i][3] || 'N/A';
          if (rowStr.includes('UBICACION:') || rowStr.includes('UBICACIÓN:')) {
            headerInfo.ubicacion = rawData[i][2] || rawData[i][3] || 'N/A';
          }
        }

        // 2. Columna D es índice 3 ("Tipo / función"), Col P es 15, Col Q es 16
        const colTask = 3;  
        const colObj = 15;  
        const colReal = 16; 

        let startRow = 16; // Fila 17 por defecto
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
          const row = rawData[i];
          if (row && row[colTask] && String(row[colTask]).toLowerCase().includes('tipo / función')) {
            startRow = i + 1;
            break;
          }
        }

        // 3. Agrupación Dinámica
        const taskMap = {};
        let grandTotalObj = 0;
        let grandTotalReal = 0;

        const parseNumber = (val) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          const cleanStr = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
          const num = parseFloat(cleanStr);
          return isNaN(num) ? 0 : num;
        };

        for (let i = startRow; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const rawTaskName = row[colTask] ? String(row[colTask]).trim() : '';
          
          const objetivo = parseNumber(row[colObj]);
          const ejecutado = parseNumber(row[colReal]);

          // Omitir vacíos, títulos de sección o filas sin métricas
          if (!rawTaskName || rawTaskName.toUpperCase() === 'CIVIL' || (objetivo === 0 && ejecutado === 0)) {
            continue;
          }

          // Limpiamos el nombre automáticamente (sin listas fijas)
          const cleanName = sanitizeCategoryName(rawTaskName);
          const key = getNormalizedKey(cleanName);

          if (!taskMap[key]) {
            taskMap[key] = {
              tarea: cleanName, // Conserva el nombre limpio dinámico
              objetivo: 0,
              ejecutado: 0,
            };
          }

          taskMap[key].objetivo += objetivo;
          taskMap[key].ejecutado += ejecutado;
          grandTotalObj += objetivo;
          grandTotalReal += ejecutado;
        }

        // 4. Mapear Arreglo Final
        const tasks = Object.values(taskMap).map((t) => {
          const remanente = Math.max(0, t.objetivo - t.ejecutado);
          const porcentaje = t.objetivo > 0 ? (t.ejecutado / t.objetivo) * 100 : 0;

          return {
            tarea: t.tarea,
            objetivoTotal: parseFloat(t.objetivo.toFixed(2)),
            ejecutadoTotal: parseFloat(t.ejecutado.toFixed(2)),
            remanente: parseFloat(remanente.toFixed(2)),
            porcentajeAvance: parseFloat(porcentaje.toFixed(1)),
            unidad: 'm³',
          };
        });

        const summaryInfo = {
          objetivoTotal: parseFloat(grandTotalObj.toFixed(2)),
          ejecutadoTotal: parseFloat(grandTotalReal.toFixed(2)),
          pendienteTotal: parseFloat(Math.max(0, grandTotalObj - grandTotalReal).toFixed(2)),
          porcentajeAvance: grandTotalObj > 0 
            ? ((grandTotalReal / grandTotalObj) * 100).toFixed(1) + '%' 
            : '0%',
        };

        resolve({ headerInfo, summaryInfo, tasks });
      } catch (error) {
        console.error('Error procesando Excel:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};