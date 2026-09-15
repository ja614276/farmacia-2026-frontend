import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLots, getSettings } from "../services/SettingsService.js";
import { findAllClients } from "../services/ClientService.js";

export const AvisoAlertas = ({ onKpiUpdate }) => {
  const navigate = useNavigate();

  const [lots, setLots] = useState([]);
  const [clientsWithDebt, setClientsWithDebt] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros: 'ALL' | 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED' | 'DEBT'
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("urgency"); // 'urgency' | 'name' | 'amount' | 'date'
  const [copiedLotId, setCopiedLotId] = useState(null);

  const [settings, setSettings] = useState({
    alertExpirationDays: 30,
    alertMinStockPercent: 20,
    alertEnableExpiration: true,
    alertEnableMinStock: true,
  });

  // Carga de datos unificada (Lotes + Clientes con Deuda + Configuración)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedSettings, lotsData, clientsRes] = await Promise.all([
        getSettings().catch(() => null),
        getAllLots().catch(() => []),
        findAllClients().catch(() => ({ data: [] })),
      ]);

      if (loadedSettings) {
        setSettings({
          alertExpirationDays: loadedSettings.alertExpirationDays ?? 30,
          alertMinStockPercent: loadedSettings.alertMinStockPercent ?? 20,
          alertEnableExpiration: loadedSettings.alertEnableExpiration ?? true,
          alertEnableMinStock: loadedSettings.alertEnableMinStock ?? true,
        });
      }

      setLots(Array.isArray(lotsData) ? lotsData : []);

      // Procesar clientes con saldo pendiente
      const rawClients = Array.isArray(clientsRes?.data) ? clientsRes.data : [];
      const debtList = rawClients
        .filter((c) => Number(c.currentBalance || c.saldo || 0) > 0)
        .map((c) => ({
          id: `client-${c.id}`,
          originalId: c.id,
          entityType: "CLIENT_DEBT",
          name: `${c.firstName || c.nombres || ""} ${c.lastName || c.apellidos || ""}`.trim() || "Cliente Sin Nombre",
          identification: c.identification || c.identificacion || "S/N",
          phone: c.phone || c.telefono || "Sin teléfono",
          balance: Number(c.currentBalance || c.saldo || 0),
          creditLimit: Number(c.creditLimit || c.limiteCredito || 0),
          creditDays: Number(c.creditDays || c.diasCredito || 0),
          healthInsurance: c.healthInsurance || c.obraSocial || "",
          urgencyScore: 800 + Number(c.currentBalance || c.saldo || 0),
        }));

      setClientsWithDebt(debtList);
    } catch (err) {
      console.error("Error al cargar datos de alertas:", err);
      setError("No se pudieron cargar los datos de inventario o clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Procesar alertas de lotes
  const processedLotAlerts = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expDaysLimit = Number(settings.alertExpirationDays) || 30;
    const stockPercentLimit = Number(settings.alertMinStockPercent) || 20;

    return lots
      .map((lot) => {
        let daysUntilExp = null;
        let isExpiringSoon = false;
        let isExpired = false;

        if (lot.fechaVencimiento) {
          const cleanDateStr = String(lot.fechaVencimiento).replace(" ", "T");
          const expDate = new Date(cleanDateStr);
          if (!isNaN(expDate.getTime())) {
            const diffTime = expDate.getTime() - now.getTime();
            daysUntilExp = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (daysUntilExp < 0) {
              isExpired = true;
            } else if (daysUntilExp <= expDaysLimit) {
              isExpiringSoon = true;
            }
          }
        }

        const cantInicial = Number(lot.cantidadInicial) || 1;
        const cantActual = Number(lot.cantidadActual) || 0;
        const stockPercent = Math.max(0, Math.round((cantActual / cantInicial) * 100));
        const isLowStock = stockPercent <= stockPercentLimit;

        const hasExpirationAlert = settings.alertEnableExpiration && (isExpiringSoon || isExpired);
        const hasStockAlert = settings.alertEnableMinStock && isLowStock;

        let alertCategory = null;
        let urgencyScore = 0;

        if (settings.alertEnableExpiration && isExpired) {
          alertCategory = "EXPIRED";
          urgencyScore = 1000 + Math.abs(daysUntilExp || 0);
        } else if (hasExpirationAlert && isExpiringSoon && hasStockAlert && isLowStock) {
          alertCategory = "BOTH";
          urgencyScore = 600 - (daysUntilExp || 0) + (100 - stockPercent);
        } else if (hasExpirationAlert && isExpiringSoon) {
          alertCategory = "EXPIRING";
          urgencyScore = 400 - (daysUntilExp || 0);
        } else if (hasStockAlert && isLowStock) {
          alertCategory = "LOW_STOCK";
          urgencyScore = 200 + (100 - stockPercent);
        }

        return {
          ...lot,
          id: `lot-${lot.idLote || lot.id || Math.random()}`,
          originalId: lot.idLote || lot.id,
          entityType: "LOT_ALERT",
          daysUntilExp,
          isExpiringSoon,
          isExpired,
          stockPercent,
          cantActual,
          cantInicial,
          hasExpirationAlert,
          hasStockAlert,
          alertCategory,
          urgencyScore,
          productTitle: lot.nombreProducto || `Producto #${lot.idProducto || "S/N"}`,
          barcode: lot.codigoBarras || "",
          location: lot.nombreUbicacion || lot.ubicacion || "Almacén General",
          lotNumber: lot.nroLote || lot.lote || "S/N",
          expirationDateFormatted: lot.fechaVencimiento ? String(lot.fechaVencimiento).slice(0, 10) : "Sin fecha",
        };
      })
      .filter((item) => item.alertCategory !== null);
  }, [lots, settings]);

  // Notificar al Dashboard si corresponde
  useEffect(() => {
    if (typeof onKpiUpdate === "function") {
      const lowStockCount = processedLotAlerts.filter((a) => a.hasStockAlert).length;
      const expiringCount = processedLotAlerts.filter((a) => a.hasExpirationAlert).length;
      onKpiUpdate({
        stockBajo: lowStockCount,
        lotesVencer: expiringCount,
      });
    }
  }, [processedLotAlerts, onKpiUpdate]);

  // Conteo consolidado de métricas
  const counts = useMemo(() => {
    const lowStock = processedLotAlerts.filter((a) => a.alertCategory === "LOW_STOCK" || a.alertCategory === "BOTH").length;
    const expiring = processedLotAlerts.filter((a) => a.alertCategory === "EXPIRING" || a.alertCategory === "BOTH").length;
    const expired = processedLotAlerts.filter((a) => a.alertCategory === "EXPIRED").length;
    const debtClients = clientsWithDebt.length;
    const totalDebtAmount = clientsWithDebt.reduce((acc, c) => acc + c.balance, 0);

    return {
      total: processedLotAlerts.length + debtClients,
      inventoryTotal: processedLotAlerts.length,
      lowStock,
      expiring,
      expired,
      debtClients,
      totalDebtAmount,
    };
  }, [processedLotAlerts, clientsWithDebt]);

  // Filtrado y Ordenación Unificada
  const filteredItems = useMemo(() => {
    let items = [];

    if (activeTab === "ALL") {
      items = [...processedLotAlerts, ...clientsWithDebt];
    } else if (activeTab === "LOW_STOCK") {
      items = processedLotAlerts.filter((a) => a.alertCategory === "LOW_STOCK" || a.alertCategory === "BOTH");
    } else if (activeTab === "EXPIRING") {
      items = processedLotAlerts.filter((a) => a.alertCategory === "EXPIRING" || a.alertCategory === "BOTH");
    } else if (activeTab === "EXPIRED") {
      items = processedLotAlerts.filter((a) => a.alertCategory === "EXPIRED");
    } else if (activeTab === "DEBT") {
      items = [...clientsWithDebt];
    }

    // Filtro por texto de búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => {
        if (item.entityType === "CLIENT_DEBT") {
          return (
            (item.name || "").toLowerCase().includes(q) ||
            (item.identification || "").toLowerCase().includes(q) ||
            (item.phone || "").toLowerCase().includes(q)
          );
        } else {
          return (
            (item.productTitle || "").toLowerCase().includes(q) ||
            (item.lotNumber || "").toLowerCase().includes(q) ||
            (item.barcode || "").toLowerCase().includes(q) ||
            (item.location || "").toLowerCase().includes(q)
          );
        }
      });
    }

    // Ordenación
    return items.sort((a, b) => {
      if (sortBy === "urgency") {
        return (b.urgencyScore || 0) - (a.urgencyScore || 0);
      }
      if (sortBy === "name") {
        const nameA = a.entityType === "CLIENT_DEBT" ? a.name : a.productTitle;
        const nameB = b.entityType === "CLIENT_DEBT" ? b.name : b.productTitle;
        return (nameA || "").localeCompare(nameB || "");
      }
      if (sortBy === "amount") {
        const valA = a.entityType === "CLIENT_DEBT" ? a.balance : a.cantActual;
        const valB = b.entityType === "CLIENT_DEBT" ? b.balance : b.cantActual;
        return valB - valA;
      }
      if (sortBy === "date") {
        const daysA = a.daysUntilExp !== null && a.daysUntilExp !== undefined ? a.daysUntilExp : 9999;
        const daysB = b.daysUntilExp !== null && b.daysUntilExp !== undefined ? b.daysUntilExp : 9999;
        return daysA - daysB;
      }
      return 0;
    });
  }, [processedLotAlerts, clientsWithDebt, activeTab, searchQuery, sortBy]);

  const handleCopyLot = (lotNum, id) => {
    if (lotNum && navigator.clipboard) {
      navigator.clipboard.writeText(lotNum);
      setCopiedLotId(id);
      setTimeout(() => setCopiedLotId(null), 1800);
    }
  };

  return (
    <div className="alerts-monochrome-root w-100">
      {/* 1. BARRA CONSOLIDADA DE MÉTRICAS (SIN CARDS - FRANJA ESTRUCTURADA MONOCROMÁTICA) */}
      <div className="summary-strip-container mb-4">
        <div className="summary-strip-cell">
          <span className="summary-label">Total Alertas</span>
          <span className="summary-val">{counts.total}</span>
          <span className="summary-hint">Activas en sistema</span>
        </div>

        <div className="summary-strip-divider"></div>

        <div className="summary-strip-cell" onClick={() => setActiveTab("LOW_STOCK")}>
          <span className="summary-label">Stock Crítico</span>
          <span className="summary-val">{counts.lowStock}</span>
          <span className="summary-hint">≤ {settings.alertMinStockPercent}% capacidad</span>
        </div>

        <div className="summary-strip-divider"></div>

        <div className="summary-strip-cell" onClick={() => setActiveTab("EXPIRING")}>
          <span className="summary-label">Por Vencer</span>
          <span className="summary-val">{counts.expiring}</span>
          <span className="summary-hint">≤ {settings.alertExpirationDays} días</span>
        </div>

        <div className="summary-strip-divider"></div>

        <div className="summary-strip-cell" onClick={() => setActiveTab("EXPIRED")}>
          <span className="summary-label">Ya Vencidos</span>
          <span className="summary-val">{counts.expired}</span>
          <span className="summary-hint">Retiro inmediato</span>
        </div>

        <div className="summary-strip-divider"></div>

        <div className="summary-strip-cell highlight-cell" onClick={() => setActiveTab("DEBT")}>
          <span className="summary-label">Clientes con Deuda</span>
          <span className="summary-val">{counts.debtClients}</span>
          <span className="summary-hint">S/ {counts.totalDebtAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })} en mora</span>
        </div>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS Y FILTRADO (BLANCO Y NEGRO FORMAL) */}
      <div className="toolbar-container mb-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
        {/* Pestañas Segmentadas Monocromáticas */}
        <div className="segmented-tabs-wrap d-flex align-items-center">
          <button
            type="button"
            className={`tab-btn ${activeTab === "ALL" ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            Todas ({counts.total})
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === "LOW_STOCK" ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab("LOW_STOCK")}
          >
            Stock Bajo ({counts.lowStock})
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === "EXPIRING" ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab("EXPIRING")}
          >
            Por Vencer ({counts.expiring})
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === "EXPIRED" ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab("EXPIRED")}
          >
            Vencidos ({counts.expired})
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === "DEBT" ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab("DEBT")}
          >
            Clientes con Deuda ({counts.debtClients})
          </button>
        </div>

        {/* Búsqueda y Ordenamiento */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="search-box position-relative">
            <svg
              className="search-icon position-absolute"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="form-control form-control-sm search-input"
              placeholder="Buscar producto, lote o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                title="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div>

          <div className="sort-box">
            <select
              className="form-select form-select-sm sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="urgency">Prioridad: Mayor urgencia</option>
              <option value="name">Alfabético: Nombre A - Z</option>
              <option value="amount">Monto: Mayor deuda / Stock</option>
              <option value="date">Fecha: Vencimiento próximo</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. TABLA DE REGISTROS CORPORATIVA (NO CARDS - ESTRUCTURA FORMAL EMPRESARIAL) */}
      <div className="data-table-wrapper shadow-xs">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark spinner-border-sm mb-2" role="status"></div>
            <p className="text-secondary small m-0">Cargando registros del sistema...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5 text-dark">
            <p className="fw-semibold m-0">{error}</p>
            <button
              type="button"
              className="btn btn-dark btn-sm mt-2"
              onClick={loadData}
            >
              Reintentar carga
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" className="mb-2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <h6 className="fw-bold text-dark m-0">Sin alertas en esta vista</h6>
            <p className="text-secondary small m-0 mt-1">
              {searchQuery ? "No se encontraron coincidencias para la búsqueda especificada." : "Todos los parámetros seleccionados se encuentran en estado normal."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle m-0 enterprise-table">
              <thead>
                <tr>
                  <th style={{ width: "140px" }}>ESTADO / TIPO</th>
                  <th>DESCRIPCIÓN / TITULAR</th>
                  <th style={{ width: "160px" }}>REFERENCIA</th>
                  <th style={{ width: "160px" }}>MÉTRICA</th>
                  <th style={{ width: "170px" }}>PLAZO / VENCIMIENTO</th>
                  <th style={{ width: "150px" }} className="text-end pe-3">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  if (item.entityType === "CLIENT_DEBT") {
                    // FILA DE CLIENTE CON DEUDA
                    return (
                      <tr key={item.id} className="row-debt">
                        {/* Estado */}
                        <td>
                          <span className="badge-tag tag-debt">
                            DEUDA PENDIENTE
                          </span>
                        </td>

                        {/* Descripción / Titular */}
                        <td>
                          <div className="fw-semibold text-dark item-title">
                            {item.name}
                          </div>
                          <div className="text-secondary item-sub">
                            DNI/RUC: {item.identification}
                            {item.healthInsurance && ` · Afiliado: ${item.healthInsurance}`}
                          </div>
                        </td>

                        {/* Referencia (Contacto) */}
                        <td>
                          <div className="text-dark item-sub-value d-flex align-items-center gap-1.5">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>{item.phone}</span>
                          </div>
                        </td>

                        {/* Métrica (Saldo en deuda) */}
                        <td>
                          <div className="fw-bold text-dark amount-highlight">
                            S/ {item.balance.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-secondary item-sub">
                            Límite: S/ {item.creditLimit.toFixed(2)}
                          </div>
                        </td>

                        {/* Plazo */}
                        <td>
                          <div className="text-dark fw-medium item-sub-value">
                            Crédito a {item.creditDays} días
                          </div>
                          <div className="text-secondary item-sub">
                            Cobranza prioritaria
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="text-end pe-3">
                          <button
                            type="button"
                            className="btn btn-action-black btn-sm"
                            onClick={() => navigate("/collections")}
                            title="Registrar pago o gestionar cobranza"
                          >
                            Gestionar Cobro
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  // FILA DE ALERTA DE INVENTARIO (LOTE / PRODUCTO)
                  const isExpired = item.alertCategory === "EXPIRED";
                  const isBoth = item.alertCategory === "BOTH";
                  const isExpiring = item.alertCategory === "EXPIRING";

                  let tagLabel = "STOCK BAJO";
                  let tagClass = "tag-stock";

                  if (isExpired) {
                    tagLabel = "YA VENCIDO";
                    tagClass = "tag-expired";
                  } else if (isBoth) {
                    tagLabel = "DOBLE ALERTA";
                    tagClass = "tag-both";
                  } else if (isExpiring) {
                    tagLabel = "POR VENCER";
                    tagClass = "tag-expiring";
                  }

                  return (
                    <tr key={item.id} className={isExpired ? "row-expired" : ""}>
                      {/* Estado */}
                      <td>
                        <span className={`badge-tag ${tagClass}`}>
                          {tagLabel}
                        </span>
                      </td>

                      {/* Producto */}
                      <td>
                        <div className="fw-semibold text-dark item-title">
                          {item.productTitle}
                        </div>
                        <div className="text-secondary item-sub">
                          {item.barcode ? `Cód: ${item.barcode} · ` : ""}
                          {item.location}
                        </div>
                      </td>

                      {/* Lote */}
                      <td>
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="lot-code-mono">{item.lotNumber}</span>
                          <button
                            type="button"
                            className="btn-copy-mono"
                            onClick={() => handleCopyLot(item.lotNumber, item.id)}
                            title="Copiar número de lote"
                          >
                            {copiedLotId === item.id ? (
                              <span className="copied-text">Copiado</span>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Métrica Stock */}
                      <td>
                        <div className="fw-semibold text-dark item-sub-value">
                          {item.cantActual} / {item.cantInicial} unid.
                        </div>
                        <div className="stock-meter-track mt-1">
                          <div
                            className="stock-meter-fill"
                            style={{ width: `${Math.min(100, item.stockPercent)}%` }}
                          />
                        </div>
                        <div className="text-secondary item-sub mt-0.5">
                          {item.stockPercent}% del inicial
                        </div>
                      </td>

                      {/* Vencimiento */}
                      <td>
                        <div className="fw-semibold text-dark item-sub-value">
                          {item.expirationDateFormatted}
                        </div>
                        <div className="text-secondary item-sub">
                          {item.daysUntilExp !== null && item.daysUntilExp < 0
                            ? `Venció hace ${Math.abs(item.daysUntilExp)} días`
                            : item.daysUntilExp !== null
                            ? `Quedan ${item.daysUntilExp} días`
                            : "Fecha no fijada"}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="text-end pe-3">
                        <div className="d-inline-flex align-items-center gap-1.5">
                          <button
                            type="button"
                            className="btn btn-action-outline btn-sm"
                            onClick={() => navigate("/inventory-adjustments")}
                            title="Realizar ajuste de stock o baja de lote"
                          >
                            Ajustar
                          </button>
                          <button
                            type="button"
                            className="btn btn-action-black btn-sm"
                            onClick={() => navigate("/purchases/register")}
                            title="Registrar nueva compra de reposición"
                          >
                            Comprar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ESTILOS MONOCROMÁTICOS DE ALTA PRECISIÓN (BLANCO Y NEGRO / GRIS INDUSTRIAL) */}
      <style>{`
        .alerts-monochrome-root {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #09090b;
        }

        /* 1. Franja de Resumen Superior */
        .summary-strip-container {
          display: flex;
          align-items: stretch;
          background-color: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .summary-strip-cell {
          flex: 1;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .summary-strip-cell:hover {
          background-color: #fafafa;
        }
        .summary-strip-divider {
          width: 1px;
          background-color: #e4e4e7;
        }
        .summary-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #71717a;
        }
        .summary-val {
          font-size: 1.6rem;
          font-weight: 700;
          color: #09090b;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .summary-hint {
          font-size: 0.72rem;
          color: #a1a1aa;
        }
        .highlight-cell {
          background-color: #fdfdfd;
        }

        /* 2. Barra de Herramientas */
        .segmented-tabs-wrap {
          background-color: #f4f4f5;
          padding: 3px;
          border-radius: 7px;
          border: 1px solid #e4e4e7;
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: #71717a;
          font-size: 0.78rem;
          font-weight: 500;
          padding: 6px 13px;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .tab-btn:hover {
          color: #09090b;
        }
        .tab-btn-active {
          background-color: #09090b !important;
          color: #ffffff !important;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .search-box {
          width: 280px;
        }
        .search-icon {
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #71717a;
          pointer-events: none;
        }
        .search-input {
          padding-left: 32px;
          padding-right: 28px;
          background-color: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #09090b;
        }
        .search-input:focus {
          border-color: #09090b;
          box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.08);
        }
        .search-clear-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #71717a;
          font-size: 14px;
          cursor: pointer;
        }
        .sort-select {
          border: 1px solid #e4e4e7;
          background-color: #ffffff;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #09090b;
          cursor: pointer;
        }
        .sort-select:focus {
          border-color: #09090b;
          box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.08);
        }

        /* 3. Tabla Corporativa de Datos */
        .data-table-wrapper {
          background-color: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .enterprise-table thead th {
          background-color: #f4f4f5;
          color: #52525b;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #e4e4e7;
          padding: 10px 14px;
        }
        .enterprise-table tbody td {
          padding: 11px 14px;
          border-bottom: 1px solid #f4f4f5;
          font-size: 0.82rem;
        }
        .enterprise-table tbody tr:hover td {
          background-color: #fafafa;
        }
        .row-expired td {
          background-color: rgba(9, 9, 11, 0.015);
        }
        .row-debt td {
          background-color: rgba(9, 9, 11, 0.01);
        }

        .item-title {
          font-size: 0.84rem;
          letter-spacing: -0.01em;
        }
        .item-sub {
          font-size: 0.72rem;
          color: #71717a;
        }
        .item-sub-value {
          font-size: 0.8rem;
        }
        .amount-highlight {
          font-size: 0.95rem;
          letter-spacing: -0.02em;
        }

        /* Etiquetas Monocromáticas */
        .badge-tag {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 4px;
          display: inline-block;
          white-space: nowrap;
        }
        .tag-debt {
          background-color: #ffffff;
          border: 1.5px solid #09090b;
          color: #09090b;
        }
        .tag-expired {
          background-color: #09090b;
          border: 1px solid #09090b;
          color: #ffffff;
        }
        .tag-both {
          background-color: #27272a;
          border: 1px solid #27272a;
          color: #ffffff;
        }
        .tag-expiring {
          background-color: #ffffff;
          border: 1px solid #71717a;
          color: #09090b;
        }
        .tag-stock {
          background-color: #f4f4f5;
          border: 1px solid #d4d4d8;
          color: #09090b;
        }

        /* Lote Monospace */
        .lot-code-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.74rem;
          background-color: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 4px;
          padding: 2px 6px;
          color: #09090b;
        }
        .btn-copy-mono {
          background: transparent;
          border: none;
          color: #71717a;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }
        .btn-copy-mono:hover {
          color: #09090b;
        }
        .copied-text {
          font-size: 0.65rem;
          font-weight: 700;
          color: #09090b;
        }

        /* Micro Barra de Stock */
        .stock-meter-track {
          width: 90px;
          height: 4px;
          background-color: #e4e4e7;
          border-radius: 2px;
          overflow: hidden;
        }
        .stock-meter-fill {
          height: 100%;
          background-color: #09090b;
          border-radius: 2px;
        }

        /* Botones de Acción Monocromáticos */
        .btn-action-black {
          background-color: #09090b;
          color: #ffffff;
          border: 1px solid #09090b;
          border-radius: 5px;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          transition: all 0.12s ease;
        }
        .btn-action-black:hover {
          background-color: #27272a;
          border-color: #27272a;
          color: #ffffff;
        }

        .btn-action-outline {
          background-color: #ffffff;
          color: #09090b;
          border: 1px solid #d4d4d8;
          border-radius: 5px;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 9px;
          transition: all 0.12s ease;
        }
        .btn-action-outline:hover {
          background-color: #f4f4f5;
          border-color: #09090b;
        }
      `}</style>
    </div>
  );
};
