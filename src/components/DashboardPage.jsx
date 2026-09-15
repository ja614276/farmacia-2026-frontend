import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLots, getSettings } from "../services/SettingsService.js";
import { getActiveCashSession } from "../services/CashSessionService.js";
import { findAllSales } from "../services/SaleService.js";
import { findAllClients } from "../services/ClientService.js";

export const DashboardPage = () => {
  const navigate = useNavigate();

  // Estados de control
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Resumen de alertas
  const [alertSummary, setAlertSummary] = useState({
    total: 0,
    lowStock: 0,
    expiring: 0,
    both: 0,
    expired: 0,
  });

  // KPIs principales (3 tarjetas: Stock Crítico, Lotes por Vencer, Clientes Deuda)
  const [kpis, setKpis] = useState({
    stockBajo: 0,
    lotesVencer: 0,
    clientesDeuda: 0,
  });

  // Gráfica: Tendencia de Ventas (7 días)
  const [salesTrend, setSalesTrend] = useState([
    { day: "dom 12", label: "Dom 12", value: 0 },
    { day: "lun 13", label: "Lun 13", value: 0 },
    { day: "mar 14", label: "Mar 14", value: 0 },
    { day: "mié 15", label: "Mié 15", value: 0 },
    { day: "jue 16", label: "Jue 16", value: 0 },
    { day: "vie 17", label: "Vie 17", value: 0 },
    { day: "sáb 18", label: "Sáb 18", value: 0 },
  ]);

  // Gráfica: Ventas por Pago (Hoy)
  const [salesTodayByMethod, setSalesTodayByMethod] = useState([]);
  const [salesTodayTotal, setSalesTodayTotal] = useState(0);

  // Cargar métricas e información real de forma eficiente
  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Cargar Lotes y Configuración de Alertas
      const lotsPromise = getAllLots().catch(() => []);
      const settingsPromise = getSettings().catch(() => null);
      const sessionPromise = getActiveCashSession().catch(() => null);
      const clientsPromise = findAllClients().catch(() => ({ data: [] }));
      const salesPromise = findAllSales().catch(() => ({ data: [] }));

      const [lots, settings, sessionRes, clientsRes, salesRes] = await Promise.all([
        lotsPromise,
        settingsPromise,
        sessionPromise,
        clientsPromise,
        salesPromise,
      ]);

      // Estado de caja activa
      if (sessionRes && sessionRes.data && sessionRes.data.id) {
        setCajaAbierta(true);
        setActiveSession(sessionRes.data);
      } else {
        setCajaAbierta(false);
        setActiveSession(null);
      }

      // Procesar Alertas de Lotes
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const expDaysLimit = settings?.alertExpirationDays ?? 30;
      const stockPercentLimit = settings?.alertMinStockPercent ?? 20;

      let lowStock = 0;
      let expiring = 0;
      let both = 0;
      let expired = 0;

      if (Array.isArray(lots)) {
        lots.forEach((lot) => {
          let daysUntilExp = null;
          let isExp = false;
          let isExpSoon = false;

          if (lot.fechaVencimiento) {
            const cleanDateStr = String(lot.fechaVencimiento).replace(" ", "T");
            const expDate = new Date(cleanDateStr);
            if (!isNaN(expDate.getTime())) {
              const diffTime = expDate.getTime() - now.getTime();
              daysUntilExp = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (daysUntilExp < 0) isExp = true;
              else if (daysUntilExp <= expDaysLimit) isExpSoon = true;
            }
          }

          const cantInicial = Number(lot.cantidadInicial) || 1;
          const cantActual = Number(lot.cantidadActual) || 0;
          const stockPercent = Math.max(0, Math.round((cantActual / cantInicial) * 100));
          const isLowStock = stockPercent <= stockPercentLimit;

          if (isExp) {
            expired++;
          } else if (isExpSoon && isLowStock) {
            both++;
          } else if (isExpSoon) {
            expiring++;
          } else if (isLowStock) {
            lowStock++;
          }
        });
      }

      const totalAlerts = lowStock + expiring + both + expired;
      setAlertSummary({ total: totalAlerts, lowStock, expiring, both, expired });

      // Clientes con deuda pendiente
      const clientList = Array.isArray(clientsRes?.data) ? clientsRes.data : [];
      const clientsWithDebt = clientList.filter(
        (c) => Number(c.currentBalance || c.saldo || 0) > 0
      ).length;

      setKpis({
        stockBajo: lowStock + both,
        lotesVencer: expiring + both + expired,
        clientesDeuda: clientsWithDebt,
      });

      // Procesar Ventas (Tendencia 7 días y Ventas Hoy por método de pago)
      const salesList = Array.isArray(salesRes?.data) ? salesRes.data : [];

      // Generar los últimos 7 días calendario hasta hoy
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        const dayShort = d.toLocaleDateString("es-ES", { weekday: "short" });
        const dayNum = d.getDate();
        days.push({
          iso,
          day: `${dayShort} ${dayNum}`,
          label: `${dayShort.charAt(0).toUpperCase() + dayShort.slice(1)} ${dayNum}`,
          value: 0,
        });
      }

      const todayIso = new Date().toISOString().slice(0, 10);
      let sumToday = 0;
      const methodsMap = {};

      salesList.forEach((sale) => {
        if (sale.isActive === false) return;
        const sDate = String(sale.dateTime || sale.fecha || "").slice(0, 10);
        const total = Number(sale.total || 0);

        // Sumar a la tendencia de 7 días
        const matchDay = days.find((d) => d.iso === sDate);
        if (matchDay) {
          matchDay.value += total;
        }

        // Sumar a ventas de hoy por medio de pago
        if (sDate === todayIso) {
          sumToday += total;
          const method = (sale.paymentMethodName || sale.medioPago || "EFECTIVO").toUpperCase();
          if (!methodsMap[method]) {
            methodsMap[method] = { name: method, total: 0, count: 0 };
          }
          methodsMap[method].total += total;
          methodsMap[method].count += 1;
        }
      });

      setSalesTrend(days);
      setSalesTodayTotal(sumToday);
      setSalesTodayByMethod(Object.values(methodsMap));
    } catch (e) {
      console.warn("Error cargando métricas en dashboard:", e);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Atajos rápidos de teclado (F1 - F6) con rutas correctas
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "F1":
          e.preventDefault();
          navigate("/sales/register");
          break;
        case "F2":
          e.preventDefault();
          navigate("/purchases/register");
          break;
        case "F3":
          e.preventDefault();
          navigate("/products/register");
          break;
        case "F4":
          e.preventDefault();
          navigate("/clients/register");
          break;
        case "F5":
          e.preventDefault();
          navigate("/collections");
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

  // Accesos Rápidos
  const quickActions = [
    {
      title: "Nueva Venta",
      sub: "Punto de facturación",
      route: "/sales/register",
      color: "#0d9488",
      bg: "#ccfbf1",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      ),
    },
    {
      title: "Nueva Compra",
      sub: "Ingreso de stock",
      route: "/purchases/register",
      color: "#059669",
      bg: "#d1fae5",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
    },
    {
      title: "Nuevo Producto",
      sub: "Catálogo farmacéutico",
      route: "/products/register",
      color: "#d97706",
      bg: "#fef3c7",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      ),
    },
    {
      title: "Nuevo Cliente",
      sub: "Ficha de afiliado",
      route: "/clients/register",
      color: "#0284c7",
      bg: "#e0f2fe",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      ),
    },
    {
      title: "Cobranzas",
      sub: "Gestión de cuentas",
      route: "/collections",
      color: "#7c3aed",
      bg: "#ede9fe",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      title: "Reportes",
      sub: "Inteligencia comercial",
      route: "/reports",
      color: "#e11d48",
      bg: "#ffe4e6",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 7-8.5 8.5-5-5L2 17" />
          <path d="M16 7h6v6" />
        </svg>
      ),
    },
  ];

  // Cálculo de puntos SVG para la curva fluida de tendencia
  const maxSalesVal = Math.max(...salesTrend.map((d) => d.value), 10);
  const chartPoints = salesTrend.map((d, index) => {
    const x = (index / (salesTrend.length - 1)) * 540 + 30;
    const ratio = Math.min(1, Math.max(0, d.value / maxSalesVal));
    const y = 185 - ratio * 145; // altura entre 40 y 185
    return { ...d, x, y };
  });

  // Generar el camino Bezier suavizado
  const pathD = chartPoints.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = chartPoints[i - 1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, "");

  const areaD =
    chartPoints.length > 0
      ? `${pathD} L ${chartPoints[chartPoints.length - 1].x} 190 L ${chartPoints[0].x} 190 Z`
      : "";

  return (
    <div className="dashboard-container w-100 min-vh-100 py-4 px-3 px-md-4">
      {/* 1. Header del Panel */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="m-0 fw-bold text-dark dashboard-main-title">Panel de Control Farmacia</h4>
          <p className="text-secondary small m-0 mt-1">
            Monitoreo en tiempo real de operaciones y ventas.
          </p>
        </div>

        {/* Acciones principales de cabecera */}
        <div className="d-flex align-items-center gap-2 flex-wrap position-relative">
          {/* Estado de Caja */}
          {cajaAbierta ? (
            <button
              type="button"
              className="btn btn-caja-activa d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm shadow-sm"
              onClick={() => navigate("/cash-sessions")}
              title="Ver sesión de caja activa"
            >
              <span className="caja-dot"></span>
              Caja Abierta
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-caja-cerrada d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm shadow-sm"
              onClick={() => navigate("/cash-sessions/open")}
              title="Abrir una nueva sesión de caja"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Sin Caja Abierta
            </button>
          )}
        </div>
      </div>

      {/* 2. Tres Tarjetas KPI (Stock Crítico, Lotes por Vencer, Clientes Deuda) */}
      <div className="row g-3 mb-4">
        {/* Stock Crítico */}
        <div
          className="col-12 col-md-4"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/avisos-alertas")}
          title="Ver alertas de stock bajo"
        >
          <div className="card-kpi bg-white p-3.5 rounded-3 shadow-sm border border-kpi-yellow h-100 d-flex justify-content-between align-items-start">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="text-secondary fw-bold text-uppercase d-block" style={{ fontSize: "0.74rem", letterSpacing: "0.04em" }}>
                  Stock Crítico
                </span>
                <span className="badge bg-warning text-dark small" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                  Ver alertas
                </span>
              </div>
              <h2 className="m-0 fw-bold text-dark my-1" style={{ fontSize: "2rem" }}>{kpis.stockBajo}</h2>
              <small className="text-muted" style={{ fontSize: "0.78rem" }}>
                Productos críticos
              </small>
            </div>
            <div className="kpi-icon-wrap text-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
        </div>

        {/* Lotes por Vencer */}
        <div
          className="col-12 col-md-4"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/avisos-alertas")}
          title="Ver alertas de vencimiento"
        >
          <div className="card-kpi bg-white p-3.5 rounded-3 shadow-sm border border-kpi-red h-100 d-flex justify-content-between align-items-start">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="text-secondary fw-bold text-uppercase d-block" style={{ fontSize: "0.74rem", letterSpacing: "0.04em" }}>
                  Lotes por Vencer
                </span>
                <span className="badge bg-danger text-white small" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                  Ver alertas
                </span>
              </div>
              <h2 className="m-0 fw-bold text-dark my-1" style={{ fontSize: "2rem" }}>{kpis.lotesVencer}</h2>
              <small className="text-muted" style={{ fontSize: "0.78rem" }}>
                Próximos 30 días
              </small>
            </div>
            <div className="kpi-icon-wrap text-danger">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Clientes Deuda */}
        <div
          className="col-12 col-md-4"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/collections")}
          title="Ir a cobranzas y saldos pendientes"
        >
          <div className="card-kpi bg-white p-3.5 rounded-3 shadow-sm border border-kpi-blue h-100 d-flex justify-content-between align-items-start">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="text-secondary fw-bold text-uppercase d-block" style={{ fontSize: "0.74rem", letterSpacing: "0.04em" }}>
                  Clientes Deuda
                </span>
                <span className="badge bg-primary text-white small" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                  Cobranzas
                </span>
              </div>
              <h2 className="m-0 fw-bold text-dark my-1" style={{ fontSize: "2rem" }}>{kpis.clientesDeuda}</h2>
              <small className="text-muted" style={{ fontSize: "0.78rem" }}>
                Saldos pendientes
              </small>
            </div>
            <div className="kpi-icon-wrap text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Fila de Gráficos (Tendencia de Ventas & Ventas por Pago) */}
      <div className="row g-3 mb-4">
        {/* Gráfico 1: Tendencia de Ventas (7 días) */}
        <div className="col-12 col-lg-8">
          <div className="bg-white border rounded-3 p-4 shadow-sm h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
                <h6 className="m-0 fw-bold text-dark">Tendencia de Ventas (7 días)</h6>
              </div>
              <span className="badge-trend-indicator">
                S/ {salesTrend.reduce((acc, d) => acc + d.value, 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })} últimos 7 días
              </span>
            </div>

            {/* Render vectorial interactivo de la gráfica con curva Bezier */}
            <div className="chart-canvas-wrapper w-100 position-relative my-2" style={{ height: "230px" }}>
              {/* Eje Y */}
              <div className="d-flex flex-column justify-content-between position-absolute top-0 bottom-0 start-0 text-muted small pe-2" style={{ fontSize: "0.72rem", width: "45px" }}>
                <span>{maxSalesVal >= 1000 ? `${(maxSalesVal / 1000).toFixed(1)}k` : maxSalesVal.toFixed(0)}</span>
                <span>{(maxSalesVal * 0.75 >= 1000 ? `${(maxSalesVal * 0.75 / 1000).toFixed(1)}k` : (maxSalesVal * 0.75).toFixed(0))}</span>
                <span>{(maxSalesVal * 0.5 >= 1000 ? `${(maxSalesVal * 0.5 / 1000).toFixed(1)}k` : (maxSalesVal * 0.5).toFixed(0))}</span>
                <span>{(maxSalesVal * 0.25 >= 1000 ? `${(maxSalesVal * 0.25 / 1000).toFixed(1)}k` : (maxSalesVal * 0.25).toFixed(0))}</span>
                <span>0</span>
              </div>

              {/* Contenedor del trazado SVG */}
              <div className="position-absolute top-0 bottom-0 end-0" style={{ left: "50px" }}>
                <svg className="w-100 h-100" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>

                  {/* Líneas horizontales guías */}
                  {[40, 76, 112, 148, 185].map((y) => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  ))}

                  {/* Relleno de área degradada */}
                  {areaD && <path d={areaD} fill="url(#tealGrad)" />}

                  {/* Línea de tendencia Bezier */}
                  {pathD && <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />}

                  {/* Nodos interactivos de cada día */}
                  {chartPoints.map((p, index) => (
                    <g key={index} onMouseEnter={() => setHoveredPoint(p)} onMouseLeave={() => setHoveredPoint(null)}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="#0d9488"
                        stroke="#ffffff"
                        strokeWidth="2"
                        style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
                      />
                      {/* Tooltip sobre el punto */}
                      {hoveredPoint && hoveredPoint.iso === p.iso && (
                        <g>
                          <rect
                            x={Math.max(10, Math.min(500, p.x - 45))}
                            y={Math.max(5, p.y - 32)}
                            width="90"
                            height="24"
                            rx="5"
                            fill="#0f172a"
                          />
                          <text
                            x={Math.max(55, Math.min(545, p.x))}
                            y={Math.max(21, p.y - 16)}
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="600"
                            textAnchor="middle"
                          >
                            S/ {p.value.toFixed(2)}
                          </text>
                        </g>
                      )}
                    </g>
                  ))}
                </svg>

                {/* Etiquetas Eje X */}
                <div className="d-flex justify-content-between text-muted small pt-2" style={{ fontSize: "0.72rem" }}>
                  {salesTrend.map((d, i) => (
                    <span key={i} className="text-capitalize">{d.day}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Ventas por Pago (Hoy) */}
        <div className="col-12 col-lg-4">
          <div className="bg-white border rounded-3 p-4 shadow-sm h-100 d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <h6 className="m-0 fw-bold text-dark">Ventas por Pago (Hoy)</h6>
              </div>
              {salesTodayTotal > 0 && (
                <span className="badge bg-success-subtle text-success fw-bold" style={{ fontSize: "0.72rem" }}>
                  S/ {salesTodayTotal.toFixed(2)}
                </span>
              )}
            </div>

            {salesTodayByMethod.length > 0 ? (
              <div className="d-flex flex-column gap-3 my-auto py-2">
                {salesTodayByMethod.map((item, idx) => {
                  const percent = salesTodayTotal > 0 ? Math.round((item.total / salesTodayTotal) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="fw-semibold text-dark" style={{ fontSize: "0.78rem" }}>{item.name}</span>
                        <div className="text-muted" style={{ fontSize: "0.74rem" }}>
                          <span className="fw-bold text-dark">S/ {item.total.toFixed(2)}</span> ({percent}%)
                        </div>
                      </div>
                      <div className="progress" style={{ height: "7px", backgroundColor: "#f1f5f9" }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: idx === 0 ? "#0d9488" : idx === 1 ? "#0284c7" : "#10b981",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center p-3">
                <div className="p-3 rounded-circle bg-light mb-2 text-muted">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                  </svg>
                </div>
                <small className="text-muted fw-semibold">Sin transacciones registradas hoy</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Accesos Rápidos */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="badge-tag-icon bg-light text-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#005f60" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div>
            <h6 className="m-0 fw-bold text-dark">Accesos Rápidos</h6>
            <small className="text-secondary" style={{ fontSize: "0.74rem" }}>
              Navega directamente a los módulos más utilizados
            </small>
          </div>
        </div>

        <div className="row g-3">
          {quickActions.map((action, idx) => (
            <div className="col-12 col-sm-6 col-md-4 col-xl-2" key={idx}>
              <div
                className="card-quick-action bg-white border rounded-3 p-3 shadow-sm h-100 d-flex flex-column align-items-center justify-content-center text-center cursor-pointer"
                onClick={() => navigate(action.route)}
                title={`Ir a ${action.title}`}
              >
                <div
                  className="quick-icon-box rounded-3 mb-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: action.bg, color: action.color }}
                >
                  {action.icon}
                </div>

                <div className="fw-bold text-dark small mb-0.5" style={{ fontSize: "0.82rem" }}>
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


      {/* Estilos específicos */}
      <style>{`
        .dashboard-container {
          background-color: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .dashboard-main-title {
          font-size: 1.5rem;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .btn-caja-cerrada {
          background-color: #f87171;
          color: #fff;
          border: none;
          border-radius: 8px;
          transition: 0.15s;
        }
        .btn-caja-cerrada:hover {
          background-color: #ef4444;
          color: #fff;
        }
        .btn-caja-activa {
          background-color: #10b981;
          color: #fff;
          border: none;
          border-radius: 8px;
        }
        .caja-dot {
          width: 8px;
          height: 8px;
          background-color: #fff;
          border-radius: 50%;
          box-shadow: 0 0 6px #ffffff;
        }
        .border-kpi-yellow {
          border-bottom: 3.5px solid #fbbf24 !important;
        }
        .border-kpi-red {
          border-bottom: 3.5px solid #f87171 !important;
        }
        .border-kpi-blue {
          border-bottom: 3.5px solid #38bdf8 !important;
        }
        .card-kpi {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .card-kpi:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06) !important;
        }
        .kpi-icon-wrap {
          padding: 4px;
        }
        .badge-trend-indicator {
          font-size: 0.74rem;
          font-weight: 700;
          color: #0d9488;
          background-color: #ccfbf1;
          padding: 3px 9px;
          border-radius: 6px;
        }
        .badge-tag-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
        }
        .card-quick-action {
          transition: all 0.18s ease;
        }
        .card-quick-action:hover {
          border-color: #005f60 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 95, 96, 0.08) !important;
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