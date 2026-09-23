import logo from '../assets/MIR.png'
import fondo1 from '../assets/CV.jpg'
// import fondo2 from '../assets/fondo2.jpg'   // 👈 descomentá si tenés una segunda imagen

/* ============================================
   🎨 PANEL DE CONFIGURACIÓN DEL HEADER
   Tamaños: números en píxeles (px)
   Colores: código hexadecimal (ej: "#ffffff")
   ============================================ */
const CONFIG = {
  // --- Logo ---
  logoAlto: 60,
  logoAncho: 170,
  logoZoom: 1.5,
  logoFondo: true,
  logoColorFondo: '#ffffff',
  logoBordeRedondeado: 8,

  // --- Título ---
  tituloTexto: 'Proyecto - OILTANKING/EBYTEM - PUERTO ROSALES',
  tituloTamaño: 24,
  tituloColor: '#070707',

  // --- Subtítulo ---
  subtituloTexto: 'Seguimiento de avances Civiles',
  subtituloTamaño: 20,
  subtituloColor: '#f30505',

  // --- Fecha (Esquina Superior Derecha) ---
  fechaMostrar: true,
  fechaTamaño: 14,
  fechaColor: '#ffffff',
  fechaFondo: '#00000080', // Transparencia oscura de fondo para resaltar sobre la imagen

  // --- Presentado por (Debajo de la Fecha) ---
  presentadorNombre: 'Araya, Mirta', // 👈 Cambiá el nombre aquí cuando quieras
  presentadorEtiqueta: 'Presentado por: ', // Opcional (ej: "Presentado por: " o "")
  presentadorTamaño: 16,
  presentadorColor: '#ffffff',
  presentadorNegrita: true,

  // --- Fondo del header ---
  headerColorFondo: '#1e293b00',   // se usa si NO hay imagen, o como capa de color sobre la imagen
  headerColorBorde: '#334155',

  // --- Imagen(es) de fondo del header ---
  headerImagenes: [fondo1],       // 👈 poné una o varias: [fondo1] o [fondo1, fondo2]
  headerImagenOpacidad: 1,     // qué tan visible es la imagen (0 = invisible, 1 = totalmente visible)
  headerImagenPosicion: 'center', // center, top, bottom, left, right
}
/* ============================================ */

function Header() {
  const tieneImagenes = CONFIG.headerImagenes && CONFIG.headerImagenes.length > 0

  // Formato dinámico para la fecha de hoy
  const fechaHoy = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <header
      style={{
        backgroundColor: CONFIG.headerColorFondo,
        borderBottom: `1px solid ${CONFIG.headerColorBorde}`,
        position: 'relative',
        overflow: 'hidden',
      }}
      className="px-6 py-4 flex items-center justify-between shadow-lg"
    >
      {/* Capa de imagen(es) de fondo */}
      {tieneImagenes && (
        <div
          className="absolute inset-0 flex"
          style={{ opacity: CONFIG.headerImagenOpacidad }}
        >
          {CONFIG.headerImagenes.map((img, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: CONFIG.headerImagenPosicion,
                backgroundRepeat: 'no-repeat',
              }}
            />
          ))}
        </div>
      )}

      {/* Lado Izquierdo: Logo, Título y Subtítulo */}
      <div className="flex items-center gap-3 relative z-10">
        <div
          style={{
            backgroundColor: CONFIG.logoFondo ? CONFIG.logoColorFondo : 'transparent',
            borderRadius: `${CONFIG.logoBordeRedondeado}px`,
            width: `${CONFIG.logoAncho}px`,
            height: `${CONFIG.logoAlto}px`,
            overflow: 'hidden',
          }}
          className="flex items-center justify-center"
        >
          <img
            src={logo}
            alt="Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `scale(${CONFIG.logoZoom})`,
            }}
          />
        </div>
        <div>
          <h1
            style={{ fontSize: `${CONFIG.tituloTamaño}px`, color: CONFIG.tituloColor }}
            className="font-bold leading-tight"
          >
            {CONFIG.tituloTexto}
          </h1>
          <p style={{ fontSize: `${CONFIG.subtituloTamaño}px`, color: CONFIG.subtituloColor }}>
            {CONFIG.subtituloTexto}
          </p>
        </div>
      </div>

      {/* Lado Derecho: Fecha y Nombre del Presentador */}
      <div className="relative z-10 text-right flex flex-col justify-center items-end gap-1">
        {/* Fecha Actual */}
        {CONFIG.fechaMostrar && (
          <div
            style={{
              fontSize: `${CONFIG.fechaTamaño}px`,
              color: CONFIG.fechaColor,
              backgroundColor: CONFIG.fechaFondo,
            }}
            className="px-2.5 py-0.5 rounded-md font-medium tracking-wide border border-white/20 shadow-sm"
          >
            {fechaHoy}
          </div>
        )}

        {/* Nombre de la persona que presenta */}
        <p
          style={{
            fontSize: `${CONFIG.presentadorTamaño}px`,
            color: CONFIG.presentadorColor,
            fontWeight: CONFIG.presentadorNegrita ? 'bold' : 'normal',
          }}
          className="leading-snug drop-shadow-md"
        >
          <span className="opacity-80 font-normal">{CONFIG.presentadorEtiqueta}</span>
          {CONFIG.presentadorNombre}
        </p>
      </div>
    </header>
  )
}

export default Header