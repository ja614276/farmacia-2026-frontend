import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [loading, setLoading] = useState(false);

  // Datos mock para KPIs
  const [kpis] = useState({
    stockBajo: 0,
    lotesVencer: 0,
    clientesDeuda: 0,
    recetasVencen: 0,
  });

  // Datos mock para gráfica de tendencia de ventas (7 días)
  const salesData = [
    { day: "dom 12", value: 0 },
    { day: "lun 13", value: 0 },
    { day: "mar 14", value: 0 },
    { day: "mié 15", value: 0 },
    { day: "jue 16", value: 0 },
    { day: "vie 17", value: 0 },
    { day: "sáb 18", value: 0 },
  ];

  // Atajos rápidos de teclado (F1 - F6)
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "F1":
          e.preventDefault();
          navigate("/sales/pos");
          break;
        case "F2":
          e.preventDefault();
          navigate("/purchases/new");
          break;
        case "F3":
          e.preventDefault();
          navigate("/products/register");
          break;
        case "F4":
          e.preventDefault();
          navigate("/clients");
          break;
        case "F5":
          e.preventDefault();
          navigate("/payments");
          break;
        case "F6":
          e.preventDefault();
          navigate("/reports");
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  };

  const quickActions = [
    {
      key: "F1",
      title: "Nueva Venta",
      sub: "Punto de venta",
      route: "/sales/pos",
      color: "#0d9488",
      bg: "#ccfbf1",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      ),
    },
    {
      key: "F2",
      title: "Nueva Compra",
      sub: "Registrar ingreso",
      route: "/purchases/new",
      color: "#059669",
      bg: "#d1fae5",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
    },
    {
      key: "F3",
      title: "Nuevo Producto",
      sub: "Registrar en catálogo",
      route: "/products/register",
      color: "#d97706",
      bg: "#fef3c7",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      ),
    },
    {
      key: "F4",
      title: "Nuevo Cliente",
      sub: "Registrar cliente",
      route: "/clients",
      color: "#0284c7",
      bg: "#e0f2fe",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
    },
    {
      key: "F5",
      title: "Cobrar Pagos",
      sub: "Cobranzas crédito",
      route: "/payments",
      color: "#7c3aed",
      bg: "#ede9fe",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      key: "F6",
      title: "Reportes",
      sub: "Análisis estratégico",
      route: "/reports",
      color: "#e11d48",
      bg: "#ffe4e6",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 7-8.5 8.5-5-5L2 17" />
          <path d="M16 7h6v6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="dashboard-container w-100 min-vh-100 py-4 px-3 px-md-4">
      {/* 1. Header del Panel */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="m-0 fw-bold text-dark">Panel de Control Farmacia</h4>
            </div>
            <p className="text-secondary small m-0 mt-1">
              Monitoreo en tiempo real de operaciones y ventas.
            </p>
          </div>
        </div>

        {/* Botones de acción derecha */}
        <div className="d-flex align-items-center gap-2">
          {cajaAbierta ? (
            <button
              type="button"
              className="btn btn-caja-activa d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm shadow-sm"
              onClick={() => setCajaAbierta(false)}
            >
              <span className="caja-dot"></span>
              Caja Abierta
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-caja-cerrada d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm shadow-sm"
              onClick={() => setCajaAbierta(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Sin Caja Abierta
            </button>
          )}

          <button
            type="button"
            className="btn btn-teal-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm shadow-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? "spin-icon" : ""}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* 2. Cuatro Tarjetas KPI */}
      <div className="row g-3 mb-4">
        {/* Stock Bajo */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-kpi bg-white p-3 rounded-3 shadow-sm border border-kpi-yellow h-100 d-flex justify-content-between align-items-start">
            <div>
              <small className="text-secondary fw-bold text-uppercase d-block" style={{ fontSize: "0.72rem" }}>
                Stock Bajo
              </small>
              <h3 className="m-0 fw-bold text-dark my-1">{kpis.stockBajo}</h3>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Productos críticos
              </small>
            </div>
            <div className="kpi-icon-wrap text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
        </div>

        {/* Lotes por Vencer */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-kpi bg-white p-3 rounded-3 shadow-sm border border-kpi-red h-100 d-flex justify-content-between align-items-start">
            <div>
              <small className="text-secondary fw-bold text-uppercase d-block" style={{ fontSize: "0.72rem" }}>
                Lotes por Vencer
              </small>
              <h3 className="m-0 fw-bold text-dark my-1">{kpis.lotesVencer}</h3>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Próximos 30 días
              </small>
            </div>
            <div className="kpi-icon-wrap text-danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Clientes Deuda */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-kpi bg-white p-3 rounded-3 shadow-sm border border-kpi-blue h-100 d-flex justify-content-between align-items-start">
            <div>
              <small className="text-secondary fw-bold text-uppercase d-block" style={{ fontSize: "0.72rem" }}>
                Clientes Deuda
              </small>
              <h3 className="m-0 fw-bold text-dark my-1">{kpis.clientesDeuda}</h3>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Saldos pendientes
              </small>
            </div>
            <div className="kpi-icon-wrap text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
        </div>

        {/* Recetas Vencen */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-kpi bg-white p-3 rounded-3 shadow-sm border border-kpi-cyan h-100 d-flex justify-content-between align-items-start">
            <div>
              <small className="text-secondary fw-bold text-uppercase d-block" style={{ fontSize: "0.72rem" }}>
                Recetas Vencen
              </small>
              <h3 className="m-0 fw-bold text-dark my-1">{kpis.recetasVencen}</h3>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Próximos 7 días
              </small>
            </div>
            <div className="kpi-icon-wrap text-cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Fila de Gráficos (Tendencia de Ventas & Ventas por Pago) */}
      <div className="row g-3 mb-4">
        {/* Gráfico 1: Tendencia de Ventas */}
        <div className="col-12 col-lg-8">
          <div className="bg-white border rounded-3 p-4 shadow-sm h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              <h6 className="m-0 fw-bold text-dark">Tendencia de Ventas (7 días)</h6>
            </div>

            {/* Render vectorial interactivo de la gráfica */}
            <div className="chart-canvas-wrapper w-100 position-relative my-2" style={{ height: "230px" }}>
              {/* Eje Y */}
              <div className="d-flex flex-column justify-content-between position-absolute top-0 bottom-0 start-0 text-muted small pe-2" style={{ fontSize: "0.72rem", width: "35px" }}>
                <span>1,0</span>
                <span>0,9</span>
                <span>0,8</span>
                <span>0,7</span>
                <span>0,6</span>
                <span>0,5</span>
                <span>0,4</span>
                <span>0,3</span>
                <span>0,2</span>
                <span>0,1</span>
                <span>0</span>
              </div>

              {/* Contenedor del trazado SVG */}
              <div className="position-absolute top-0 bottom-0 end-0" style={{ left: "40px" }}>
                <svg className="w-100 h-100" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {/* Líneas horizontales guías */}
                  {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200].map((y) => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  ))}

                  {/* Línea horizontal base de datos (verde esmeralda) */}
                  <line x1="0" y1="200" x2="600" y2="200" stroke="#0d9488" strokeWidth="3" />

                  {/* Nodos de cada día */}
                  {salesData.map((_, index) => {
                    const x = (index / (salesData.length - 1)) * 580 + 10;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy="200"
                        r="4"
                        fill="#0d9488"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </svg>

                {/* Etiquetas Eje X */}
                <div className="d-flex justify-content-between text-muted small pt-2" style={{ fontSize: "0.72rem" }}>
                  {salesData.map((d, i) => (
                    <span key={i}>{d.day}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Ventas por Pago (Hoy) */}
        <div className="col-12 col-lg-4">
          <div className="bg-white border rounded-3 p-4 shadow-sm h-100 d-flex flex-column">
            <div className="d-flex align-items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <h6 className="m-0 fw-bold text-dark">Ventas por Pago (Hoy)</h6>
            </div>

            <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center p-3">
              <div className="p-3 rounded-circle bg-light mb-2 text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
              </div>
              <small className="text-muted fw-semibold">Sin transacciones registradas hoy</small>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Accesos Rápidos */}
      <div className="mb-2">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="badge-tag-icon bg-light text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#006d77" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div>
            <h6 className="m-0 fw-bold text-dark">Accesos Rápidos</h6>
            <small className="text-secondary" style={{ fontSize: "0.72rem" }}>
              Navega directamente a los módulos más utilizados
            </small>
          </div>
        </div>

        <div className="row g-3">
          {quickActions.map((action, idx) => (
            <div className="col-12 col-sm-6 col-md-4 col-xl-2" key={idx}>
              <div
                className="card-quick-action bg-white border rounded-3 p-3 shadow-sm h-100 position-relative d-flex flex-column align-items-center justify-content-center text-center cursor-pointer"
                onClick={() => navigate(action.route)}
              >
                {/* Badge de atajo F1-F6 en la esquina superior derecha 
                <span className="badge-shortcut position-absolute top-0 end-0 m-2">
                  {action.key}
                </span>
                */}
                
                <div
                  className="quick-icon-box rounded-3 mb-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: action.bg, color: action.color }}
                >
                  {action.icon}
                </div>

                <div className="fw-bold text-dark small" style={{ fontSize: "0.82rem" }}>
                  {action.title}
                </div>
                <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                  {action.sub}
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estilos */}
      <style>{`
        .dashboard-container {
          background-color: #f8fafc;
        }
        .dashboard-badge-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background-color: #e6f4f1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .badge-version-pill {
          background-color: #ccfbf1;
          color: #0f766e;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 20px;
        }
        .btn-caja-cerrada {
          background-color: #f87171;
          color: #fff;
          border: none;
          transition: 0.2s;
        }
        .btn-caja-cerrada:hover {
          background-color: #ef4444;
          color: #fff;
        }
        .btn-caja-activa {
          background-color: #10b981;
          color: #fff;
          border: none;
        }
        .caja-dot {
          width: 8px;
          height: 8px;
          background-color: #fff;
          border-radius: 50%;
        }
        .btn-teal-primary {
          background-color: #006d77;
          color: #fff;
          border: none;
          transition: 0.2s;
        }
        .btn-teal-primary:hover {
          background-color: #0b525b;
          color: #fff;
        }
        .spin-icon {
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Bordes inferiores característicos de los 4 KPIs */
        .border-kpi-yellow {
          border-bottom: 3.5px solid #fbbf24 !important;
        }
        .border-kpi-red {
          border-bottom: 3.5px solid #f87171 !important;
        }
        .border-kpi-blue {
          border-bottom: 3.5px solid #38bdf8 !important;
        }
        .border-kpi-cyan {
          border-bottom: 3.5px solid #00b4d8 !important;
        }
        .card-kpi {
          transition: transform 0.15s ease;
        }
        .card-kpi:hover {
          transform: translateY(-2px);
        }
        .kpi-icon-wrap {
          padding: 4px;
        }
        .text-cyan {
          color: #00b4d8;
        }
        .badge-shortcut {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 700;
        }
        .card-quick-action {
          transition: all 0.2s ease;
        }
        .card-quick-action:hover {
          border-color: #006d77 !important;
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0, 109, 119, 0.08) !important;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .quick-icon-box {
          width: 44px;
          height: 44px;
        }
      `}</style>
    </div>
  );
};