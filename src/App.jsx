import React, { useState } from 'react';
import { parseExcelData } from './utils/excelParser';
import Header from './components/Header';
import { AvanceTareas } from './components/AvanceTareas';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const parsedData = await parseExcelData(file);
      setData(parsedData);
    } catch (error) {
      console.error('Error al procesar el archivo Excel:', error);
      setErrorMessage('Ocurrió un error al procesar el archivo. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="w-full bg-slate-900 border-b border-slate-800">
        <Header info={data?.headerInfo} />
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        <div className="bg-slate-900/90 p-6 rounded-2xl shadow-lg border border-slate-800 text-center">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Cargar Planilla de Seguimiento (.xlsx)
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="block w-full text-sm text-slate-400 max-w-md mx-auto
              file:mr-4 file:py-2.5 file:px-5
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-slate-800 file:text-blue-400
              hover:file:bg-slate-700 hover:file:text-blue-300 cursor-pointer border border-slate-700 rounded-full"
          />
          {loading && <p className="mt-3 text-sm text-blue-400 font-semibold animate-pulse">Procesando datos del Excel...</p>}
          {errorMessage && <p className="mt-3 text-sm text-red-400 font-semibold">{errorMessage}</p>}
        </div>

        {data && (
          <AvanceTareas categories={data.categories} />
        )}
      </main>
    </div>
  );
}

export default App;