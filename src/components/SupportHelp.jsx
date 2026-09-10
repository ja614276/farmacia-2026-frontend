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

    const text = `*SOLICITUD DE SOPORTE*\n` +
      `*Tipo:* ${typeLabels[reportType]}\n` +
      `*Detalle:* ${description.trim() || "Requiero asistencia técnica en el sistema."}`;

    window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="support-wrapper min-vh-100 py-5 px-3 d-flex flex-column align-items-center">
      {/* 1. Header principal con icono farmacéutico estilizado */}
      <div className="card-top-header bg-white rounded-4 p-4 shadow-sm mb-4 border d-flex align-items-center gap-3">
        

        <div className="text-center w-100">
  <div className="d-flex justify-content-center align-items-baseline gap-2">
    <h3 className="m-0 fw-bolder text-dark">Centro de Ayuda & Soporte</h3>
  </div>
  <p className="text-muted m-0 small mt-1 mx-auto" style={{ maxWidth: "580px", lineHeight: "1.4" }}>
    ¿Tienes alguna duda, problema con una venta o requieres asistencia técnica?
    <br />
    Comunícate directamente con el desarrollador del sistema.
  </p>
</div>
      </div>

      {/* 2. Grid de dos columnas */}
      <div className="row g-4 w-100 justify-content-center" style={{ maxWidth: "900px" }}>
        
        {/* Columna Izquierda: Contacto Directo & Disponibilidad */}
        <div className="col-md-6">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white d-flex flex-column justify-content-between">
            <div>
              {/* Encabezado */}
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="badge-tag-icon bg-cyan-soft text-cyan">
                  {/* Ícono Auricular / Soporte Helpdesk */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                </div>
                <h6 className="m-0 fw-bolder text-dark">Datos del Desarrollador del Sistema</h6>
              </div>

              {/* Encargado */}
              <div className="d-flex align-items-center gap-3 mb-3 p-3 bg-light rounded-3 border-subtle">
                <div className="avatar-soft-icon">
                  {/* Ícono Developer / Especialista con Badge */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#006d77"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <small className="text-muted fw-bold text-uppercase d-block" style={{ fontSize: "0.68rem" }}>
                    Software Engineer / Soporte
                  </small>
                  <span className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                    {developerName}
                  </span>
                </div>
              </div>

              {/* WhatsApp Directo (Canal Principal) */}
              <div className="d-flex align-items-center gap-3 mb-2 p-3 bg-light rounded-3 border-subtle">
                <div className="avatar-soft-icon text-success bg-white shadow-xs">
                  {/* Logo Oficial de WhatsApp */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#10b981"
                  >
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 16.48c-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44s-.56-1.35-.77-1.85c-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.99.69.45-.05 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z"/>
                  </svg>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.68rem" }}>
                      WhatsApp (Contacto Principal)
                    </small>
                    
                  </div>
                  <span className="fw-bold text-dark font-monospace" style={{ fontSize: "0.95rem" }}>
                    {phoneFormatted}
                  </span>
                </div>
              </div>

              {/* Horario y SLA con aviso de llamadas */}
              <div className="p-3 border rounded-3 bg-light-subtle mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="text-secondary fw-bold" style={{ fontSize: "0.72rem" }}>
                    HORARIO DE ATENCIÓN
                  </small>
                  <span className="badge bg-white text-secondary border fw-semibold" style={{ fontSize: "0.68rem" }}>
                    Lunes a Viernes
                  </span>
                </div>
                <div className="fw-bold text-dark small">08:00 AM – 01:00 PM</div>
                
                <div className="mt-2 pt-2 border-top">
                  <div className="d-flex align-items-start gap-2 text-muted" style={{ fontSize: "0.72rem" }}>
                    {/* Checkmark circular */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 mt-1"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>
                      Las consultas por <strong>WhatsApp</strong> son respondidas a la brevedad.
                    </span>
                  </div>

                  <div className="d-flex align-items-start gap-2 text-danger mt-1 fw-medium" style={{ fontSize: "0.72rem" }}>
                    {/* Campana de Alerta / Emergencia */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 mt-1"
                    >
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span>
                      <strong>Llamadas telefónicas:</strong> reservadas exclusivamente para emergencias críticas (ej. caja o venta detenida).
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Columna Derecha: Reporte Rápido por WhatsApp */}
        <div className="col-md-6">
          <div className="card border-0 rounded-4 shadow-sm p-4 h-100 bg-white d-flex flex-column justify-content-between">
            <form onSubmit={handleQuickReport} className="d-flex flex-column h-100 justify-content-between">
              <div>
                {/* Encabezado */}
                <div className="d-flex align-items-center gap-2 mb-4">
                  <div className="badge-tag-icon bg-orange-soft text-orange">
                    {/* Ícono de Redacción / Ticket Rápido */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </div>
                  <h6 className="m-0 fw-bolder text-dark">Generar Mensaje Rápido por WhatsApp</h6>
                </div>

                <p className="text-muted small mb-3">
                  Selecciona el motivo y describe brevemente lo sucedido. Se abrirá WhatsApp con el mensaje estructurado para atenderte de inmediato:
                </p>

                {/* Selector de Motivo */}
                <div className="mb-3">
                  <label className="form-label text-secondary fw-bold" style={{ fontSize: "0.75rem" }}>
                    ¿QUÉ OCURRE? *
                  </label>
                  <select
                    className="form-select form-select-sm select-custom"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="urgente_pos">Problema en Caja / Ticketera / Venta / Otros</option>
                    <option value="stock_error">Inconsistencia en Stock o Lote</option>
                    <option value="nuevo_requerimiento">Nueva Función o Configuración</option>
                    <option value="otro">Otra Consulta Operativa</option>
                  </select>
                </div>

                {/* Detalle */}
                <div className="mb-3">
                  <label className="form-label text-secondary fw-bold" style={{ fontSize: "0.75rem" }}>
                    DETALLE ADICIONAL (OPCIONAL)
                  </label>
                  <textarea
                    className="form-control text-area-custom"
                    rows="4"
                    placeholder="Ej: No imprime el ticket de la boleta B001-45 o el lector no lee el código..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Botón Acción Principal con ícono estilizado de WhatsApp */}
              <button
                type="submit"
                className="btn btn-teal-contact w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm mt-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 16.48c-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44s-.56-1.35-.77-1.85c-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.99.69.45-.05 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z"/>
                </svg>
                Enviar Consulta por WhatsApp
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Estilos */}
      <style>{`
        .support-wrapper {
          background-color: #f8fafc;
        }
        .card-top-header {
          width: 100%;
          max-width: 900px;
        }
        .pill-badge-box {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background-color: #e6f4f1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .badge-soporte-online {
          background-color: #d1fae5;
          color: #047857;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .badge-tag-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-cyan-soft { background-color: #e0f2fe; }
        .text-cyan { color: #0284c7; }
        .bg-orange-soft { background-color: #ffedd5; }
        .text-orange { color: #ea580c; }
        .border-subtle {
          border: 1px solid #edf2f7;
        }
        .avatar-soft-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .select-custom, .text-area-custom {
          border-color: #e2e8f0;
          font-size: 0.85rem;
          color: #334155;
        }
        .select-custom:focus, .text-area-custom:focus {
          border-color: #006d77;
          box-shadow: 0 0 0 0.2rem rgba(0, 109, 119, 0.15);
        }
        .btn-teal-contact {
          background-color: #006d77;
          color: #fff;
          border: none;
          border-radius: 8px;
          transition: 0.2s;
        }
        .btn-teal-contact:hover {
          background-color: #084c53;
          color: #fff;
        }
      `}</style>
    </div>
  );
};