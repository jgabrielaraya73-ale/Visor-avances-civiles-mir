import * as XLSX from 'xlsx';

const sanitizeTaskName = (rawText) => {
  if (!rawText) return '';
  let cleaned = rawText.toString().trim();
  cleaned = cleaned.replace(/\?/g, '').trim();
  return cleaned || rawText.toString().trim();
};

const getNormalizedKey = (text) => {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};

export const parseExcelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // 1. Ubicar hoja SEG.CIVIL3 o similar
        let targetSheetName = workbook.SheetNames.find(
          (name) => name.toUpperCase().includes('SEG.CIVIL3') || name.toUpperCase().includes('SEG.CIVIL')
        );

        if (!targetSheetName) {
          targetSheetName = workbook.SheetNames.find((name) => {
            const sheet = workbook.Sheets[name];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            return rows.some((r) =>
              r.some((cell) => String(cell).toLowerCase().includes('tipo / funcion'))
            );
          });
        }

        if (!targetSheetName) targetSheetName = workbook.SheetNames[0];

        const targetSheet = workbook.Sheets[targetSheetName];
        
        // Cargar absolutamente todas las filas sin ignorar filas vacías ni cortar la lectura
        const rawData = XLSX.utils.sheet_to_json(targetSheet, { 
          header: 1, 
          defval: '', 
          blankrows: true 
        });

        if (!rawData || rawData.length === 0) {
          throw new Error(`La hoja "${targetSheetName}" está vacía.`);
        }

        // 2. Extraer Metadatos (Header)
        let headerInfo = {
          contrato: 'N/A',
          proyecto: 'N/A',
          contratista: 'N/A',
          cliente: 'N/A',
          nroReporte: 'N/A',
          ubicacion: 'N/A',
        };

        for (let i = 0; i < Math.min(15, rawData.length); i++) {
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

        // 3. Mapeo directo de columnas (B: Tarea/Categoría = 1, N: Objetivo = 13, O: Real = 14)
        const colTask = 1;
        const colObj = 13;
        const colReal = 14;

        let startRow = 0;
        for (let i = 0; i < Math.min(25, rawData.length); i++) {
          const row = rawData[i];
          if (row && row[colTask] && String(row[colTask]).toLowerCase().includes('tipo / funcion')) {
            startRow = i + 1;
            break;
          }
        }
        if (startRow === 0) startRow = 14;

        const parseNumber = (val) => {
          if (typeof val === 'number') return val;
          if (val === undefined || val === null || val === '') return 0;
          const cleanStr = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
          if (cleanStr === '') return 0;
          const num = parseFloat(cleanStr);
          return isNaN(num) ? 0 : num;
        };

        // Categorías principales reconocidas
        const knownParents = [
          'CAMARAS ELECTRICAS',
          'SHELTER Y GENERADOR',
          'ILUMINACION & PARARRAYOS', 'ILUMINACION Y PARARRAYOS',
          'PILAR ELECTRICO', 'PILAR ELETRICO',
          'TRAMPA SCRAPER RECEPTORA',
          'GALPON (UAM)', 'GALPON UAM',
          'CANEROS E&I', 'CANEROS EI',
          'VALVULA SDV',
          'SOPORTES Y PASARELAS',
          'DRENAJE PLUVIAL',
          'CERCO PERIMETRAL',
          'VEREDAS'
        ];

        // 4. Procesar fila por fila hasta el final absoluto de rawData
        const categoriesMap = {};
        let currentParentName = 'CÁMARAS ELÉCTRICAS';

        for (let i = startRow; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row) continue;

          // Leer directamente el contenido de la columna B (índice 1)
          const cellValue = row[colTask] !== undefined && row[colTask] !== null ? String(row[colTask]).trim() : '';
          if (!cellValue) continue;

          const cellLower = cellValue.toLowerCase();
          if (cellLower.includes('tipo / funcion') || cellValue.toUpperCase() === 'CIVIL') {
            continue;
          }

          const normalizedCell = getNormalizedKey(cellValue);

          // Verificar si es un Encabezado/Categoría Padre
          const isKnownParent = knownParents.some((p) => getNormalizedKey(p) === normalizedCell);

          if (isKnownParent) {
            let displayName = cellValue.toUpperCase();
            if (displayName.includes('PILAR ELE')) displayName = 'PILAR ELÉCTRICO';
            if (displayName.includes('CAMARA')) displayName = 'CÁMARAS ELÉCTRICAS';
            if (displayName.includes('ILUMINAC')) displayName = 'ILUMINACIÓN & PARARRAYOS';
            if (displayName.includes('CERCO')) displayName = 'CERCO PERIMETRAL';
            if (displayName.includes('VEREDA')) displayName = 'VEREDAS';

            currentParentName = displayName;

            if (!categoriesMap[currentParentName]) {
              categoriesMap[currentParentName] = {
                name: currentParentName,
                tasksMap: {}
              };
            }
            continue;
          }

          // Si es Tarea Hija dentro del grupo actual
          if (currentParentName) {
            if (!categoriesMap[currentParentName]) {
              categoriesMap[currentParentName] = {
                name: currentParentName,
                tasksMap: {}
              };
            }

            const cleanTask = sanitizeTaskName(cellValue);
            const taskKey = getNormalizedKey(cleanTask);

            const rawObj = parseNumber(row[colObj]);
            const rawReal = parseNumber(row[colReal]);

            const parentObj = categoriesMap[currentParentName];

            if (!parentObj.tasksMap[taskKey]) {
              parentObj.tasksMap[taskKey] = {
                tarea: cleanTask,
                objetivo: 0,
                ejecutado: 0
              };
            }

            parentObj.tasksMap[taskKey].objetivo += rawObj;
            parentObj.tasksMap[taskKey].ejecutado += rawReal;
          }
        }

        // 5. Mapeo para los filtros y tarjetas del Dashboard
        const categories = Object.values(categoriesMap)
          .map((cat) => {
            const taskList = Object.values(cat.tasksMap).map((t) => {
              const remanente = Math.max(0, t.objetivo - t.ejecutado);
              const porcentaje = t.objetivo > 0 ? (t.ejecutado / t.objetivo) * 100 : 0;
              return {
                tarea: t.tarea,
                objetivoTotal: parseFloat(t.objetivo.toFixed(2)),
                ejecutadoTotal: parseFloat(t.ejecutado.toFixed(2)),
                remanente: parseFloat(remanente.toFixed(2)),
                porcentajeAvance: parseFloat(porcentaje.toFixed(1)),
                unidad: 'm³'
              };
            });

            const catObj = taskList.reduce((acc, t) => acc + t.objetivoTotal, 0);
            const catEjec = taskList.reduce((acc, t) => acc + t.ejecutadoTotal, 0);
            const catRem = Math.max(0, catObj - catEjec);
            const catPorc = catObj > 0 ? (catEjec / catObj) * 100 : 0;

            return {
              categoryName: cat.name,
              objetivoTotal: parseFloat(catObj.toFixed(2)),
              ejecutadoTotal: parseFloat(catEjec.toFixed(2)),
              remanenteTotal: parseFloat(catRem.toFixed(2)),
              porcentajeAvance: parseFloat(catPorc.toFixed(1)),
              tasks: taskList
            };
          })
          .filter((c) => c.tasks.length > 0);

        resolve({ headerInfo, categories });
      } catch (error) {
        console.error('Error procesando Excel:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};