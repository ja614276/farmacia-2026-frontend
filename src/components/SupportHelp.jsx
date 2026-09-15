import { useState } from "react";

export const SupportHelp = () => {
  const developerName = "Jose Miguel Alvarez Peña";
  const phoneFormatted = "+51 977 957 891";
  const rawPhone = "977957891";

  // Estado para un formulario de mensaje rápido personalizado
  const [reportType, setReportType] = useState("urgente_pos");
  const [description, setDescription] = useState("");

  const handleQuickReport = (e) => {
    e.preventDefault();
    const typeLabels = {
      urgente_pos: "URGENCIA POS (Caja / Facturación / Impresión / Otros)",
      stock_error: "Consulta sobre Inventario / Lotes",
      nuevo_requerimiento: "Solicitud de Función / Capacitación",
      otro: "Consulta General",
    };

    const text =
      `*SOLICITUD DE SOPORTE CORPORATIVO*\n` +
      `*Tipo:* ${typeLabels[reportType]}\n` +
      `*Detalle:* ${description.trim() || "Requiero asistencia técnica en el sistema."}`;

    window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="w-full pb-10 space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200 font-medium">
                [SISTEMA & CONFIGURACIÓN]
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider bg-[#09090b] text-white px-2 py-0.5 rounded font-medium">
                Mesa de Ayuda
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950 uppercase font-mono">
              Centro de Ayuda & Soporte Técnico
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Asistencia técnica especializada directa, gestión de incidencias operativas y soporte de desarrollo de software.
            </p>
          </div>

          <div className="flex items-center">
            <span className="border border-zinc-200 bg-zinc-50 text-zinc-700 font-mono text-xs px-3.5 py-1.5 rounded flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse"></span>
              Soporte Disponible
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Contacto Directo & Disponibilidad */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-zinc-200 rounded-lg p-6 h-full shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              {/* Header Sección */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-4 bg-[#09090b] rounded-xs"></div>
                  <h3 className="font-bold text-zinc-900 text-sm tracking-tight m-0 uppercase font-mono">
                    Canal Directo de Desarrollo
                  </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded font-medium">
                  Nivel 3 / Core Dev
                </span>
              </div>

              {/* Responsable Técnico */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#09090b] text-white flex items-center justify-center font-mono font-bold text-sm tracking-wider flex-shrink-0 border border-zinc-800">
                  JP
                </div>
                <div>
                  <span className="text-zinc-400 font-mono font-semibold uppercase block text-[10px] tracking-wider">
                    Software Engineer / Especialista
                  </span>
                  <span className="font-bold text-zinc-900 text-sm block">
                    {developerName}
                  </span>
                </div>
              </div>

              {/* Canal WhatsApp */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-mono font-semibold uppercase block text-[10px] tracking-wider">
                      Línea Directa WhatsApp
                    </span>
                    <span className="font-mono font-bold text-zinc-900 text-sm">
                      {phoneFormatted}
                    </span>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${rawPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#09090b] hover:bg-zinc-800 text-white font-mono text-xs px-3 py-1.5 rounded transition-colors"
                >
                  Abrir Chat
                </a>
              </div>

              {/* Horario y Políticas de Soporte */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-mono font-semibold uppercase text-[10px] tracking-wider">
                    Horario de Atención
                  </span>
                  <span className="font-mono text-[10px] uppercase bg-white border border-zinc-200 text-zinc-700 px-2 py-0.5 rounded font-medium">
                    Lunes a Viernes
                  </span>
                </div>
                <div className="font-mono font-bold text-zinc-900 text-sm">
                  08:00 AM – 01:00 PM
                </div>

                <div className="pt-3 border-t border-zinc-200 space-y-2 text-xs text-zinc-600">
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-zinc-900 text-xs mt-0.5">[1]</span>
                    <span>
                      Las consultas por <strong>WhatsApp</strong> son atendidas en orden de recepción y clasificadas según criticidad.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-zinc-900 text-xs mt-0.5">[2]</span>
                    <span>
                      <strong>Llamadas telefónicas de emergencia:</strong> reservadas exclusivamente para incidentes de bloqueo total (POS, caja o base de datos detenida).
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Reporte Rápido por WhatsApp */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-zinc-200 rounded-lg p-6 h-full shadow-sm flex flex-col justify-between">
            <form onSubmit={handleQuickReport} className="flex flex-col h-full justify-between space-y-5">
              <div className="space-y-4">
                {/* Header Sección */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-4 bg-[#09090b] rounded-xs"></div>
                    <h3 className="font-bold text-zinc-900 text-sm tracking-tight m-0 uppercase font-mono">
                      Generar Incidencia Rápida
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded font-medium">
                    WhatsApp Bot Format
                  </span>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed">
                  Seleccione el tipo de solicitud y describa brevemente la situación. Se abrirá una sesión de WhatsApp estructurada con los datos listos para enviar.
                </p>

                {/* Selector de Motivo */}
                <div>
                  <label className="block text-zinc-700 font-mono font-bold uppercase text-[11px] tracking-wider mb-1.5">
                    Clasificación de la Incidencia *
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded bg-white text-zinc-900 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="urgente_pos">Urgencia POS (Caja / Facturación / Impresión / Otros)</option>
                    <option value="stock_error">Consulta sobre Inventario / Lotes / Stock</option>
                    <option value="nuevo_requerimiento">Solicitud de Función / Parámetro / Capacitación</option>
                    <option value="otro">Consulta General u Operativa</option>
                  </select>
                </div>

                {/* Detalle */}
                <div>
                  <label className="block text-zinc-700 font-mono font-bold uppercase text-[11px] tracking-wider mb-1.5">
                    Detalle Adicional (Opcional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2.5 text-xs border border-zinc-300 rounded bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono"
                    rows="5"
                    placeholder="Ejemplo: No imprime el ticket de la boleta B001-0042 o el lector no reconoce el código de barras del lote LOT-441..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Botón Acción Principal */}
              <div className="pt-4 border-t border-zinc-100">
                <button
                  type="submit"
                  className="w-full bg-[#09090b] hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Enviar Consulta por WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};