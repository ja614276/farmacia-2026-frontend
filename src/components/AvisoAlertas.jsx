import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllLots, getSettings } from "../services/SettingsService.js";

export const AvisoAlertas = ({ onKpiUpdate, isStandalonePage = false }) => {
    const navigate = useNavigate();
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("all"); // 'all' | 'LOW_STOCK' | 'EXPIRING' | 'BOTH' | 'EXPIRED'
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("urgency"); // 'urgency' | 'expiration' | 'stock' | 'name'
    const [showGuide, setShowGuide] = useState(true);
    const [copiedLotId, setCopiedLotId] = useState(null);
    const [settings, setSettings] = useState({
        alertExpirationDays: 30,
        alertMinStockPercent: 20,
        alertEnableExpiration: true,
        alertEnableMinStock: true,
    });

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [loadedSettings, lotsData] = await Promise.all([
                getSettings(),
                getAllLots()
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
        } catch (err) {
            console.error("Error al cargar avisos de lotes:", err);
            setError("No se pudieron cargar los datos de inventario para generar las alertas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Procesa, evalúa y categoriza con precisión cada lote
    const processedAlerts = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const expDaysLimit = Number(settings.alertExpirationDays) || 30;
        const stockPercentLimit = Number(settings.alertMinStockPercent) || 20;

        return lots.map((lot) => {
            // 1. Análisis de Vencimiento
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

            // 2. Análisis de Stock
            const cantInicial = Number(lot.cantidadInicial) || 1;
            const cantActual = Number(lot.cantidadActual) || 0;
            const stockPercent = Math.max(0, Math.round((cantActual / cantInicial) * 100));
            const isLowStock = stockPercent <= stockPercentLimit;

            const hasExpirationAlert = settings.alertEnableExpiration && (isExpiringSoon || isExpired);
            const hasStockAlert = settings.alertEnableMinStock && isLowStock;

            // 3. Categorización exacta según los 4 colores requeridos:
            // - NEGRO: Ya vencieron (isExpired)
            // - MORADO: Ambas alertas (Bajo stock y Por vencer)
            // - ROJO: Solo por vencer (sin bajo stock y no vencido aún)
            // - AMARILLO: Solo stock bajo (no por vencer ni vencido)
            let alertCategory = null; // 'EXPIRED' | 'BOTH' | 'EXPIRING' | 'LOW_STOCK'
            let urgencyScore = 0; // Para ordenación

            if (settings.alertEnableExpiration && isExpired) {
                alertCategory = "EXPIRED"; // NEGRO
                urgencyScore = 1000 + Math.abs(daysUntilExp || 0);
            } else if (hasExpirationAlert && isExpiringSoon && hasStockAlert && isLowStock) {
                alertCategory = "BOTH"; // MORADO
                urgencyScore = 500 - (daysUntilExp || 0) + (100 - stockPercent);
            } else if (hasExpirationAlert && isExpiringSoon) {
                alertCategory = "EXPIRING"; // ROJO
                urgencyScore = 300 - (daysUntilExp || 0);
            } else if (hasStockAlert && isLowStock) {
                alertCategory = "LOW_STOCK"; // AMARILLO
                urgencyScore = 100 + (100 - stockPercent);
            }

            return {
                ...lot,
                daysUntilExp,
                isExpiringSoon,
                isExpired,
                stockPercent,
                hasExpirationAlert,
                hasStockAlert,
                alertCategory,
                urgencyScore,
                productTitle: lot.nombreProducto || `Producto #${lot.idProducto || "S/N"}`,
            };
        }).filter((item) => item.alertCategory !== null);
    }, [lots, settings]);

    // Notificar al Dashboard o vistas superiores
    useEffect(() => {
        if (typeof onKpiUpdate === "function") {
            const lowStockCount = processedAlerts.filter((a) => a.hasStockAlert).length;
            const expiringCount = processedAlerts.filter((a) => a.hasExpirationAlert).length;
            onKpiUpdate({
                stockBajo: lowStockCount,
                lotesVencer: expiringCount,
            });
        }
    }, [processedAlerts, onKpiUpdate]);

    // Contadores por categoría de color
    const counts = useMemo(() => {
        return {
            total: processedAlerts.length,
            lowStock: processedAlerts.filter((a) => a.alertCategory === "LOW_STOCK").length,
            expiring: processedAlerts.filter((a) => a.alertCategory === "EXPIRING").length,
            both: processedAlerts.filter((a) => a.alertCategory === "BOTH").length,
            expired: processedAlerts.filter((a) => a.alertCategory === "EXPIRED").length,
        };
    }, [processedAlerts]);

    // Filtrado y ordenación
    const filteredAndSortedAlerts = useMemo(() => {
        let result = processedAlerts.filter((item) => {
            if (activeTab !== "all" && item.alertCategory !== activeTab) {
                return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchProduct = (item.productTitle || "").toLowerCase().includes(q);
                const matchLot = (item.nroLote || "").toLowerCase().includes(q);
                const matchCode = (item.codigoBarras || "").toLowerCase().includes(q);
                const matchConc = (item.concentracion || "").toLowerCase().includes(q);
                return matchProduct || matchLot || matchCode || matchConc;
            }

            return true;
        });

        return result.sort((a, b) => {
            if (sortBy === "urgency") {
                return b.urgencyScore - a.urgencyScore;
            }
            if (sortBy === "expiration") {
                const aDays = a.daysUntilExp !== null ? a.daysUntilExp : 9999;
                const bDays = b.daysUntilExp !== null ? b.daysUntilExp : 9999;
                return aDays - bDays;
            }
            if (sortBy === "stock") {
                return a.stockPercent - b.stockPercent;
            }
            if (sortBy === "name") {
                return (a.productTitle || "").localeCompare(b.productTitle || "");
            }
            return 0;
        });
    }, [processedAlerts, activeTab, searchQuery, sortBy]);

    // Manejador para filtrar al hacer clic en la guía de colores
    const handleGuideColorClick = (category) => {
        if (activeTab === category) {
            setActiveTab("all"); // desactiva filtro si ya está seleccionado
        } else {
            setActiveTab(category);
        }
    };

    const handleCopyLot = (lotNumber, id) => {
        if (lotNumber) {
            navigator.clipboard?.writeText(lotNumber);
            setCopiedLotId(id);
            setTimeout(() => setCopiedLotId(null), 2000);
        }
    };

    return (
        <div className="aviso-alertas-root w-100">
            {/* 1. Header Card Principal */}
            <div className="card-glass-panel border rounded-4 p-4 shadow-sm mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="header-icon-box rounded-3 d-flex align-items-center justify-content-center shadow-xs">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#005f60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            </svg>
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2.5 flex-wrap">
                                <h4 className="m-0 fw-bold text-dark" style={{ letterSpacing: "-0.02em" }}>
                                    Avisos y Alertas del Sistema
                                </h4>
                                <span className={`badge-indicator ${counts.total > 0 ? "badge-indicator-urgent" : "badge-indicator-success"}`}>
                                    {counts.total} {counts.total === 1 ? "alerta activa" : "alertas activas"}
                                </span>
                            </div>
                            <p className="text-secondary small m-0 mt-1">
                                Monitoreo inteligente de lotes: Vencimientos a <strong>≤ {settings.alertExpirationDays} días</strong> y Stock de Seguridad al <strong>≤ {settings.alertMinStockPercent}%</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Acciones principales de cabecera */}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setShowGuide(!showGuide)}
                            className={`btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3 py-2 ${
                                showGuide ? "btn-guide-active" : "btn-guide-inactive"
                            }`}
                            title="Mostrar u ocultar la guía explicativa de códigos de color"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span>{showGuide ? "Ocultar Guía de Colores" : "Ver Guía de Colores"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/settings/alerts")}
                            className="btn btn-sm btn-outline-teal d-flex align-items-center gap-2 fw-semibold px-3 py-2"
                            title="Ajustar los umbrales de días y porcentajes de alerta"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span>Configurar Umbrales</span>
                        </button>

                        <button
                            type="button"
                            onClick={loadData}
                            disabled={loading}
                            className="btn btn-sm btn-refresh d-flex align-items-center gap-2 fw-semibold px-3 py-2"
                            title="Actualizar y recalcular alertas del inventario"
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={loading ? "spin-icon" : ""}
                            >
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                <path d="M16 21h5v-5" />
                            </svg>
                            <span>Refrescar</span>
                        </button>
                    </div>
                </div>

                {/* 2. SECCIÓN EXPLICATIVA: GUÍA DE SIGNIFICADO DE COLORES */}
                {showGuide && (
                    <div className="guide-explainer-section rounded-4 p-3.5 mb-4 border">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2.5">
                            <div className="d-flex align-items-center gap-2">
                                <div className="guide-sparkle-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005f60" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h6 className="m-0 fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                                        ¿Por qué se usan estos colores? — Código Cromático y Criterio Farmacéutico
                                    </h6>
                                    <span className="text-secondary small" style={{ fontSize: "0.78rem" }}>
                                        Estándar visual para clasificación clínica, prevención de desabastecimiento y control estricto de caducidades:
                                    </span>
                                </div>
                            </div>
                            <span className="badge bg-white text-muted border px-2.5 py-1 rounded-pill small" style={{ fontSize: "0.72rem" }}>
                                💡 Haz clic en cualquier tarjeta para filtrar la lista
                            </span>
                        </div>

                        <div className="row g-3">
                            {/* CARD AMARILLO: STOCK BAJO */}
                            <div className="col-12 col-md-6 col-xl-3">
                                <div
                                    className={`guide-card-box guide-card-box-yellow p-3 rounded-4 h-100 ${
                                        activeTab === "LOW_STOCK" ? "guide-box-active" : ""
                                    }`}
                                    onClick={() => handleGuideColorClick("LOW_STOCK")}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="color-beacon beacon-yellow"></span>
                                            <span className="fw-bold text-yellow-title" style={{ fontSize: "0.85rem" }}>
                                                Card Amarillo
                                            </span>
                                        </div>
                                        <span className="count-pill pill-yellow">
                                            {counts.lowStock} {counts.lowStock === 1 ? "lote" : "lotes"}
                                        </span>
                                    </div>
                                    <h6 className="guide-box-heading text-dark fw-bold mb-1.5" style={{ fontSize: "0.82rem" }}>
                                        Stock Bajo (≤ {settings.alertMinStockPercent}%)
                                    </h6>
                                    <div className="guide-box-reason p-2 rounded-3 mb-2">
                                        <div className="text-dark fw-bold mb-1" style={{ fontSize: "0.74rem" }}>
                                            ¿Por qué Amarillo?
                                        </div>
                                        <p className="m-0 text-secondary" style={{ fontSize: "0.73rem", lineHeight: "1.4" }}>
                                            Simboliza <strong>advertencia y prevención</strong>. El medicamento está en su nivel de seguridad mínimo. Requiere programar reposición o compra antes de agotar existencia.
                                        </p>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between text-yellow-action small pt-1 border-top border-yellow-light">
                                        <span style={{ fontSize: "0.72rem", fontWeight: "600" }}>Acción: Generar Compra</span>
                                        <span style={{ fontSize: "0.72rem" }}>{activeTab === "LOW_STOCK" ? "✓ Activo" : "Filtrar →"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CARD ROJO: POR VENCER */}
                            <div className="col-12 col-md-6 col-xl-3">
                                <div
                                    className={`guide-card-box guide-card-box-red p-3 rounded-4 h-100 ${
                                        activeTab === "EXPIRING" ? "guide-box-active" : ""
                                    }`}
                                    onClick={() => handleGuideColorClick("EXPIRING")}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="color-beacon beacon-red"></span>
                                            <span className="fw-bold text-red-title" style={{ fontSize: "0.85rem" }}>
                                                Card Rojo
                                            </span>
                                        </div>
                                        <span className="count-pill pill-red">
                                            {counts.expiring} {counts.expiring === 1 ? "lote" : "lotes"}
                                        </span>
                                    </div>
                                    <h6 className="guide-box-heading text-dark fw-bold mb-1.5" style={{ fontSize: "0.82rem" }}>
                                        Por Vencer (≤ {settings.alertExpirationDays} días)
                                    </h6>
                                    <div className="guide-box-reason p-2 rounded-3 mb-2">
                                        <div className="text-dark fw-bold mb-1" style={{ fontSize: "0.74rem" }}>
                                            ¿Por qué Rojo?
                                        </div>
                                        <p className="m-0 text-secondary" style={{ fontSize: "0.73rem", lineHeight: "1.4" }}>
                                            Simboliza <strong>urgencia temporal y prioridad de salida</strong>. El lote está vigente pero su vida útil está por terminar. Debe dispensarse primero bajo regla FEFO para evitar merma.
                                        </p>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between text-red-action small pt-1 border-top border-red-light">
                                        <span style={{ fontSize: "0.72rem", fontWeight: "600" }}>Acción: Despacho FEFO</span>
                                        <span style={{ fontSize: "0.72rem" }}>{activeTab === "EXPIRING" ? "✓ Activo" : "Filtrar →"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CARD MORADO: AMBAS ALERTAS */}
                            <div className="col-12 col-md-6 col-xl-3">
                                <div
                                    className={`guide-card-box guide-card-box-purple p-3 rounded-4 h-100 ${
                                        activeTab === "BOTH" ? "guide-box-active" : ""
                                    }`}
                                    onClick={() => handleGuideColorClick("BOTH")}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="color-beacon beacon-purple"></span>
                                            <span className="fw-bold text-purple-title" style={{ fontSize: "0.85rem" }}>
                                                Card Morado
                                            </span>
                                        </div>
                                        <span className="count-pill pill-purple">
                                            {counts.both} {counts.both === 1 ? "lote" : "lotes"}
                                        </span>
                                    </div>
                                    <h6 className="guide-box-heading text-dark fw-bold mb-1.5" style={{ fontSize: "0.82rem" }}>
                                        Ambas: Bajo Stock y Por Vencer
                                    </h6>
                                    <div className="guide-box-reason p-2 rounded-3 mb-2">
                                        <div className="text-dark fw-bold mb-1" style={{ fontSize: "0.74rem" }}>
                                            ¿Por qué Morado?
                                        </div>
                                        <p className="m-0 text-secondary" style={{ fontSize: "0.73rem", lineHeight: "1.4" }}>
                                            Simboliza <strong>fusión crítica de doble riesgo</strong>. Hay poco inventario y además está a punto de caducar. Exige liquidar el remanente de inmediato y encargar lote nuevo.
                                        </p>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between text-purple-action small pt-1 border-top border-purple-light">
                                        <span style={{ fontSize: "0.72rem", fontWeight: "600" }}>Acción: Liquidar y Reponer</span>
                                        <span style={{ fontSize: "0.72rem" }}>{activeTab === "BOTH" ? "✓ Activo" : "Filtrar →"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CARD NEGRO: YA VENCIDOS */}
                            <div className="col-12 col-md-6 col-xl-3">
                                <div
                                    className={`guide-card-box guide-card-box-black p-3 rounded-4 h-100 ${
                                        activeTab === "EXPIRED" ? "guide-box-active" : ""
                                    }`}
                                    onClick={() => handleGuideColorClick("EXPIRED")}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="color-beacon beacon-black"></span>
                                            <span className="fw-bold text-black-title" style={{ fontSize: "0.85rem" }}>
                                                Card Negro
                                            </span>
                                        </div>
                                        <span className="count-pill pill-black">
                                            {counts.expired} {counts.expired === 1 ? "lote" : "lotes"}
                                        </span>
                                    </div>
                                    <h6 className="guide-box-heading text-dark fw-bold mb-1.5" style={{ fontSize: "0.82rem" }}>
                                        Ya Vencido (Caducidad Superada)
                                    </h6>
                                    <div className="guide-box-reason p-2 rounded-3 mb-2">
                                        <div className="text-dark fw-bold mb-1" style={{ fontSize: "0.74rem" }}>
                                            ¿Por qué Negro?
                                        </div>
                                        <p className="m-0 text-secondary" style={{ fontSize: "0.73rem", lineHeight: "1.4" }}>
                                            Simboliza <strong>bloqueo legal y cese sanitario definitivo</strong>. Producto no apto para venta ni consumo. Debe retirarse inmediatamente de anaqueles y registrarse su baja.
                                        </p>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between text-black-action small pt-1 border-top border-black-light">
                                        <span style={{ fontSize: "0.72rem", fontWeight: "600" }}>Acción: Baja en Inventario</span>
                                        <span style={{ fontSize: "0.72rem" }}>{activeTab === "EXPIRED" ? "✓ Activo" : "Filtrar →"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. BARRA DE CONTROL: TABS, BÚSQUEDA Y ORDENACIÓN */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-3 border-top">
                    {/* Filtros rápidos por pestaña */}
                    <div className="filter-tabs-cluster d-flex align-items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            className={`tab-filter-btn ${activeTab === "all" ? "active" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            <span>Todas</span>
                            <span className="tab-bubble">{counts.total}</span>
                        </button>

                        <button
                            type="button"
                            className={`tab-filter-btn tab-btn-yellow ${activeTab === "LOW_STOCK" ? "active" : ""}`}
                            onClick={() => setActiveTab("LOW_STOCK")}
                        >
                            <span className="tab-dot tab-dot-yellow"></span>
                            <span>Stock Bajo</span>
                            <span className="tab-bubble tab-bubble-yellow">{counts.lowStock}</span>
                        </button>

                        <button
                            type="button"
                            className={`tab-filter-btn tab-btn-red ${activeTab === "EXPIRING" ? "active" : ""}`}
                            onClick={() => setActiveTab("EXPIRING")}
                        >
                            <span className="tab-dot tab-dot-red"></span>
                            <span>Por Vencer</span>
                            <span className="tab-bubble tab-bubble-red">{counts.expiring}</span>
                        </button>

                        <button
                            type="button"
                            className={`tab-filter-btn tab-btn-purple ${activeTab === "BOTH" ? "active" : ""}`}
                            onClick={() => setActiveTab("BOTH")}
                        >
                            <span className="tab-dot tab-dot-purple"></span>
                            <span>Ambas Alertas</span>
                            <span className="tab-bubble tab-bubble-purple">{counts.both}</span>
                        </button>

                        <button
                            type="button"
                            className={`tab-filter-btn tab-btn-black ${activeTab === "EXPIRED" ? "active" : ""}`}
                            onClick={() => setActiveTab("EXPIRED")}
                        >
                            <span className="tab-dot tab-dot-black"></span>
                            <span>Ya Vencidos</span>
                            <span className="tab-bubble tab-bubble-black">{counts.expired}</span>
                        </button>
                    </div>

                    {/* Búsqueda y Ordenamiento */}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="d-flex align-items-center gap-1.5">
                            <span className="text-secondary small d-none d-sm-inline" style={{ fontSize: "0.78rem" }}>
                                Orden:
                            </span>
                            <select
                                className="form-select form-select-sm select-sort-custom shadow-none"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="urgency">Mayor urgencia</option>
                                <option value="expiration">Fecha vencimiento</option>
                                <option value="stock">Menor stock (%)</option>
                                <option value="name">Nombre producto (A-Z)</option>
                            </select>
                        </div>

                        <div className="position-relative search-input-wrapper">
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#64748b"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="position-absolute top-50 start-0 translate-middle-y ms-2.5"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar producto, lote o código..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-control form-control-sm ps-4 pe-4 search-input-field shadow-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-1 p-0 px-1 text-muted border-0"
                                    onClick={() => setSearchQuery("")}
                                    title="Limpiar búsqueda"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. LISTADO DE CARDS DE ALERTAS */}
            {loading ? (
                <div className="card-glass-panel border rounded-4 p-5 text-center shadow-sm">
                    <div className="spinner-border text-teal-custom mb-2" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <h6 className="fw-bold text-dark mt-2 mb-1">Evaluando inventario y lotes clínicos...</h6>
                    <p className="text-secondary small m-0">Calculando fechas de caducidad y umbrales de seguridad de existencias.</p>
                </div>
            ) : error ? (
                <div className="alert alert-warning border rounded-4 p-4 shadow-sm d-flex align-items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>
                        <div className="fw-bold">{error}</div>
                        <div className="small text-muted mt-0.5">Verifica la conexión con el servidor o recarga el módulo.</div>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-dark ms-auto" onClick={loadData}>
                        Reintentar
                    </button>
                </div>
            ) : filteredAndSortedAlerts.length === 0 ? (
                /* Estado Vacío */
                <div className="card-glass-panel border rounded-4 p-5 text-center shadow-sm">
                    <div className="empty-state-icon mx-auto mb-3 shadow-xs">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h5 className="fw-bold text-dark m-0">¡Todo el Inventario en Orden!</h5>
                    <p className="text-secondary small mt-1.5 mb-3" style={{ maxWidth: "460px", margin: "0 auto", lineHeight: "1.4" }}>
                        {searchQuery || activeTab !== "all"
                            ? "No se encontraron lotes que coincidan con los filtros aplicados en esta búsqueda."
                            : `No hay productos con vencimiento a menos de ${settings.alertExpirationDays} días ni lotes con existencia inferior al ${settings.alertMinStockPercent}%.`}
                    </p>
                    {(searchQuery || activeTab !== "all") && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-teal px-3 py-1.5 fw-semibold"
                            onClick={() => {
                                setSearchQuery("");
                                setActiveTab("all");
                            }}
                        >
                            Restablecer todos los filtros
                        </button>
                    )}
                </div>
            ) : (
                /* GRID DE TARJETAS POR COLOR */
                <div className="row g-3.5">
                    {filteredAndSortedAlerts.map((item) => {
                        const { alertCategory } = item;
                        const dateFormatted = item.fechaVencimiento
                            ? String(item.fechaVencimiento).slice(0, 10)
                            : "Sin fecha";

                        // Asignación de clase raíz según la categoría:
                        // LOW_STOCK -> card-theme-yellow
                        // EXPIRING  -> card-theme-red
                        // BOTH      -> card-theme-purple
                        // EXPIRED   -> card-theme-black
                        let themeClass = "card-theme-yellow";
                        if (alertCategory === "EXPIRED") themeClass = "card-theme-black";
                        else if (alertCategory === "BOTH") themeClass = "card-theme-purple";
                        else if (alertCategory === "EXPIRING") themeClass = "card-theme-red";

                        return (
                            <div className="col-12 col-md-6 col-xl-4" key={item.idLote}>
                                <div className={`card-product-alert h-100 rounded-4 shadow-sm d-flex flex-column justify-content-between p-3.5 ${themeClass}`}>
                                    <div>
                                        {/* 1. Cabecera de la Card: Badge de Estado y Número de Lote */}
                                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2.5">
                                            {/* BADGES ESPECÍFICOS POR COLOR */}
                                            {alertCategory === "LOW_STOCK" && (
                                                <span className="card-badge badge-color-yellow">
                                                    <span className="badge-glow-dot glow-yellow"></span>
                                                    <span>STOCK BAJO ({item.stockPercent}%)</span>
                                                </span>
                                            )}

                                            {alertCategory === "EXPIRING" && (
                                                <span className="card-badge badge-color-red">
                                                    <span className="badge-glow-dot glow-red"></span>
                                                    <span>{item.daysUntilExp === 0 ? "¡VENCE HOY!" : `VENCE EN ${item.daysUntilExp} DÍAS`}</span>
                                                </span>
                                            )}

                                            {alertCategory === "BOTH" && (
                                                <span className="card-badge badge-color-purple">
                                                    <span className="badge-glow-dot glow-purple"></span>
                                                    <span>DOBLE ALERTA (STOCK + FECHA)</span>
                                                </span>
                                            )}

                                            {alertCategory === "EXPIRED" && (
                                                <span className="card-badge badge-color-black">
                                                    <span className="badge-glow-dot glow-black"></span>
                                                    <span>LOTE CADUCADO ({Math.abs(item.daysUntilExp)} d)</span>
                                                </span>
                                            )}

                                            {/* Lote con botón de copia */}
                                            <div
                                                className="lot-tag-pill"
                                                onClick={() => handleCopyLot(item.nroLote, item.idLote)}
                                                title="Hacer clic para copiar número de lote"
                                                role="button"
                                            >
                                                <span>Lote: <strong>{item.nroLote || "S/N"}</strong></span>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ms-1">
                                                    {copiedLotId === item.idLote ? (
                                                        <polyline points="20 6 9 17 4 12" />
                                                    ) : (
                                                        <>
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                        </>
                                                    )}
                                                </svg>
                                            </div>
                                        </div>

                                        {/* 2. Título del Producto */}
                                        <h6 className="product-card-name mb-1.5" title={item.productTitle}>
                                            {item.productTitle}
                                        </h6>

                                        {/* 3. Metadatos Farmacéuticos */}
                                        <div className="product-meta-row mb-3 d-flex flex-wrap align-items-center gap-1.5">
                                            {item.concentracion && (
                                                <span className="tag-meta">{item.concentracion}</span>
                                            )}
                                            {item.formaFarmaceutica && (
                                                <span className="tag-meta">{item.formaFarmaceutica}</span>
                                            )}
                                            {item.codigoBarras && (
                                                <span className="tag-meta tag-meta-code">Cód: {item.codigoBarras}</span>
                                            )}
                                        </div>

                                        {/* 4. Panel de Métricas: Stock y Caducidad */}
                                        <div className="metrics-box rounded-3 p-2.5 mb-3">
                                            {/* Existencias y Barra */}
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="metrics-label">Stock en este lote:</span>
                                                <span className="metrics-highlight">
                                                    {item.cantidadActual} de {item.cantidadInicial} uds ({item.stockPercent}%)
                                                </span>
                                            </div>

                                            <div className="progress metrics-progress-bar" style={{ height: "7px" }}>
                                                <div
                                                    className={`progress-bar ${
                                                        alertCategory === "EXPIRED"
                                                            ? "bar-fill-black"
                                                            : alertCategory === "BOTH"
                                                            ? "bar-fill-purple"
                                                            : alertCategory === "EXPIRING"
                                                            ? "bar-fill-red"
                                                            : "bar-fill-yellow"
                                                    }`}
                                                    role="progressbar"
                                                    style={{ width: `${Math.min(100, Math.max(5, item.stockPercent))}%` }}
                                                    aria-valuenow={item.stockPercent}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                />
                                            </div>

                                            {/* Fecha de Expiración */}
                                            <div className="d-flex justify-content-between align-items-center mt-2.5 pt-2 border-top border-metrics-divider">
                                                <span className="metrics-label">Fecha de Vencimiento:</span>
                                                <span className={`metrics-date-badge ${
                                                    alertCategory === "EXPIRED"
                                                        ? "date-expired"
                                                        : alertCategory === "BOTH" || alertCategory === "EXPIRING"
                                                        ? "date-urgent"
                                                        : "date-normal"
                                                }`}>
                                                    {dateFormatted}
                                                </span>
                                            </div>

                                            {/* Rótulo de Advertencia Crítica Sanitaria si está vencido */}
                                            {alertCategory === "EXPIRED" && (
                                                <div className="sanitary-expired-warning rounded-2 p-2 mt-2 text-center">
                                                    ⛔ BLOQUEADO: Prohibida su venta sanitaria.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 5. Acciones de la Tarjeta */}
                                    <div className="card-footer-actions pt-2 border-top d-flex align-items-center gap-2">
                                        {item.idProducto && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-sub-action w-100 fw-semibold"
                                                onClick={() => navigate(`/products/${item.idProducto}/lots`)}
                                                title="Ver todos los lotes de este producto"
                                            >
                                                Ver Lotes
                                            </button>
                                        )}

                                        {alertCategory === "EXPIRED" ? (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-main-action-black w-100 fw-semibold"
                                                onClick={() => navigate("/inventory-adjustments")}
                                                title="Ir al módulo de ajuste para dar de baja este lote"
                                            >
                                                Ajustar / Baja
                                            </button>
                                        ) : alertCategory === "EXPIRING" ? (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-main-action-red w-100 fw-semibold"
                                                onClick={() => navigate("/sales/register")}
                                                title="Priorizar venta rápida de este lote por vencimiento"
                                            >
                                                Priorizar FEFO
                                            </button>
                                        ) : alertCategory === "BOTH" ? (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-main-action-purple w-100 fw-semibold"
                                                onClick={() => navigate("/purchases/register")}
                                                title="Comprar nuevo lote urgente para reponer este producto"
                                            >
                                                Reponer / Comprar
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-main-action-yellow w-100 fw-semibold"
                                                onClick={() => navigate("/purchases/register")}
                                                title="Emitir orden de compra para reabastecer inventario"
                                            >
                                                Reponer Stock
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ESTILOS CSS REFINADOS Y MODERNOS */}
            <style>{`
                .aviso-alertas-root {
                    font-family: inherit;
                }

                .card-glass-panel {
                    background: #ffffff;
                    border-color: #e2e8f0 !important;
                }

                .header-icon-box {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, #e6f4f1 0%, #cceae5 100%);
                }

                .text-teal-custom {
                    color: #005f60;
                }

                .btn-outline-teal {
                    color: #005f60;
                    border-color: #005f60;
                    background: transparent;
                    border-radius: 9px;
                    transition: all 0.2s ease;
                }
                .btn-outline-teal:hover {
                    background: #005f60;
                    color: #ffffff;
                }

                .btn-refresh {
                    background: #f8fafc;
                    border: 1px solid #cbd5e1;
                    color: #334155;
                    border-radius: 9px;
                    transition: all 0.2s ease;
                }
                .btn-refresh:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }

                .spin-icon {
                    animation: spinAnimation 1s linear infinite;
                }
                @keyframes spinAnimation {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .badge-indicator {
                    font-size: 0.76rem;
                    font-weight: 700;
                    padding: 3px 10px;
                    border-radius: 20px;
                    display: inline-flex;
                    align-items: center;
                }
                .badge-indicator-urgent {
                    background: #fee2e2;
                    color: #dc2626;
                    border: 1px solid #fca5a5;
                }
                .badge-indicator-success {
                    background: #d1fae5;
                    color: #059669;
                    border: 1px solid #a7f3d0;
                }

                .btn-guide-active {
                    background: #005f60;
                    color: #ffffff;
                    border: 1px solid #005f60;
                    border-radius: 9px;
                }
                .btn-guide-inactive {
                    background: #f8fafc;
                    color: #475569;
                    border: 1px solid #cbd5e1;
                    border-radius: 9px;
                }

                /* ========================================================
                   GUÍA EXPLICATIVA DE COLORES
                   ======================================================== */
                .guide-explainer-section {
                    background: #fcfdfd;
                    border-color: #e2e8f0 !important;
                }

                .guide-card-box {
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 2px solid transparent;
                }
                .guide-card-box:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
                }
                .guide-box-active {
                    transform: translateY(-2px);
                    box-shadow: 0 0 0 3px rgba(0, 95, 96, 0.25) !important;
                }

                /* Variantes de la guía */
                .guide-card-box-yellow {
                    background: #fffdf5;
                    border-color: #fef08a;
                }
                .guide-card-box-yellow.guide-box-active {
                    border-color: #d97706 !important;
                }
                .text-yellow-title { color: #b45309; }
                .pill-yellow { background: #fef3c7; color: #92400e; }
                .guide-card-box-yellow .guide-box-reason { background: #fef9c3; }
                .border-yellow-light { border-color: #fef08a !important; }
                .text-yellow-action { color: #b45309; }

                .guide-card-box-red {
                    background: #fff8f8;
                    border-color: #fecaca;
                }
                .guide-card-box-red.guide-box-active {
                    border-color: #dc2626 !important;
                }
                .text-red-title { color: #dc2626; }
                .pill-red { background: #fee2e2; color: #991b1b; }
                .guide-card-box-red .guide-box-reason { background: #ffe4e6; }
                .border-red-light { border-color: #fecaca !important; }
                .text-red-action { color: #b91c1c; }

                .guide-card-box-purple {
                    background: #faf7ff;
                    border-color: #e9d5ff;
                }
                .guide-card-box-purple.guide-box-active {
                    border-color: #7c3aed !important;
                }
                .text-purple-title { color: #7c3aed; }
                .pill-purple { background: #f3e8ff; color: #6b21a8; }
                .guide-card-box-purple .guide-box-reason { background: #f5f3ff; }
                .border-purple-light { border-color: #e9d5ff !important; }
                .text-purple-action { color: #6b21a8; }

                .guide-card-box-black {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                }
                .guide-card-box-black.guide-box-active {
                    border-color: #0f172a !important;
                }
                .text-black-title { color: #0f172a; }
                .pill-black { background: #0f172a; color: #ffffff; }
                .guide-card-box-black .guide-box-reason { background: #f1f5f9; }
                .border-black-light { border-color: #cbd5e1 !important; }
                .text-black-action { color: #0f172a; }

                /* Indicadores luminosos */
                .color-beacon {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    display: inline-block;
                }
                .beacon-yellow { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
                .beacon-red { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.5); }
                .beacon-purple { background: #8b5cf6; box-shadow: 0 0 6px rgba(139, 92, 246, 0.5); }
                .beacon-black { background: #0f172a; box-shadow: 0 0 6px rgba(15, 23, 42, 0.5); }

                .count-pill {
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 12px;
                }

                /* ========================================================
                   PESTAÑAS DE FILTRADO Y CONTROLES
                   ======================================================== */
                .tab-filter-btn {
                    background: transparent;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 5px 12px;
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: #475569;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.15s ease;
                }
                .tab-filter-btn:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }
                .tab-filter-btn.active {
                    background: #005f60;
                    border-color: #005f60;
                    color: #ffffff;
                }
                .tab-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .tab-dot-yellow { background: #f59e0b; }
                .tab-dot-red { background: #ef4444; }
                .tab-dot-purple { background: #8b5cf6; }
                .tab-dot-black { background: #0f172a; }

                .tab-bubble {
                    background: rgba(0, 0, 0, 0.08);
                    padding: 1px 7px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                }
                .tab-filter-btn.active .tab-bubble {
                    background: rgba(255, 255, 255, 0.25);
                    color: #ffffff;
                }

                .select-sort-custom {
                    background-color: #f8fafc;
                    border-color: #cbd5e1;
                    border-radius: 9px;
                    font-size: 0.78rem;
                    min-width: 155px;
                }

                .search-input-wrapper {
                    min-width: 230px;
                }
                .search-input-field {
                    background-color: #f8fafc;
                    border-color: #cbd5e1;
                    border-radius: 9px;
                    font-size: 0.8rem;
                }

                /* ========================================================
                   TARJETAS POR COLOR: AMARILLO, ROJO, MORADO Y NEGRO
                   ======================================================== */
                .card-product-alert {
                    border-width: 1.5px;
                    border-style: solid;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .card-product-alert:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08) !important;
                }

                /* --- 1. CARD AMARILLO: STOCK BAJO --- */
                .card-theme-yellow {
                    background: #ffffff;
                    border-color: #fde047;
                    border-top: 5px solid #f59e0b;
                }
                .card-theme-yellow .metrics-box {
                    background: #fffdf5;
                    border: 1px solid #fef08a;
                }
                .badge-color-yellow {
                    background: #fef9c3;
                    color: #b45309;
                    border: 1px solid #fde047;
                }
                .glow-yellow { background: #f59e0b; }
                .bar-fill-yellow { background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%) !important; }
                .btn-main-action-yellow {
                    background: #d97706;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.78rem;
                    padding: 6px 10px;
                    transition: background 0.15s ease;
                }
                .btn-main-action-yellow:hover {
                    background: #b45309;
                    color: #ffffff;
                }

                /* --- 2. CARD ROJO: POR VENCER --- */
                .card-theme-red {
                    background: #ffffff;
                    border-color: #fca5a5;
                    border-top: 5px solid #ef4444;
                }
                .card-theme-red .metrics-box {
                    background: #fff8f8;
                    border: 1px solid #fecaca;
                }
                .badge-color-red {
                    background: #fee2e2;
                    color: #b91c1c;
                    border: 1px solid #fca5a5;
                }
                .glow-red { background: #ef4444; }
                .bar-fill-red { background: linear-gradient(90deg, #ef4444 0%, #f87171 100%) !important; }
                .btn-main-action-red {
                    background: #dc2626;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.78rem;
                    padding: 6px 10px;
                    transition: background 0.15s ease;
                }
                .btn-main-action-red:hover {
                    background: #b91c1c;
                    color: #ffffff;
                }

                /* --- 3. CARD MORADO: AMBAS ALERTAS --- */
                .card-theme-purple {
                    background: #ffffff;
                    border-color: #d8b4fe;
                    border-top: 5px solid #8b5cf6;
                }
                .card-theme-purple .metrics-box {
                    background: #faf7ff;
                    border: 1px solid #e9d5ff;
                }
                .badge-color-purple {
                    background: #f3e8ff;
                    color: #6b21a8;
                    border: 1px solid #d8b4fe;
                }
                .glow-purple { background: #8b5cf6; }
                .bar-fill-purple { background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%) !important; }
                .btn-main-action-purple {
                    background: #7c3aed;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.78rem;
                    padding: 6px 10px;
                    transition: background 0.15s ease;
                }
                .btn-main-action-purple:hover {
                    background: #6d28d9;
                    color: #ffffff;
                }

                /* --- 4. CARD NEGRO: YA VENCIDOS --- */
                .card-theme-black {
                    background: #090d16;
                    border-color: #272f3d;
                    border-top: 5px solid #dc2626;
                    color: #f1f5f9;
                }
                .card-theme-black .product-card-name {
                    color: #ffffff !important;
                }
                .card-theme-black .lot-tag-pill {
                    background: #172033;
                    border-color: #334155;
                    color: #cbd5e1;
                }
                .card-theme-black .tag-meta {
                    background: #172033;
                    border-color: #334155;
                    color: #cbd5e1;
                }
                .card-theme-black .tag-meta-code {
                    color: #94a3b8;
                }
                .card-theme-black .metrics-box {
                    background: #131a29;
                    border: 1px solid #273449;
                }
                .card-theme-black .metrics-label {
                    color: #94a3b8;
                }
                .card-theme-black .metrics-highlight {
                    color: #f8fafc;
                }
                .card-theme-black .border-metrics-divider {
                    border-color: rgba(255, 255, 255, 0.08) !important;
                }
                .badge-color-black {
                    background: #000000;
                    color: #fca5a5;
                    border: 1px solid #dc2626;
                }
                .glow-black { background: #ef4444; }
                .bar-fill-black { background: #ef4444 !important; }
                .card-theme-black .btn-sub-action {
                    background: #172033;
                    border-color: #334155;
                    color: #cbd5e1;
                }
                .card-theme-black .btn-sub-action:hover {
                    background: #273449;
                    color: #ffffff;
                }
                .btn-main-action-black {
                    background: #dc2626;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.78rem;
                    padding: 6px 10px;
                    transition: background 0.15s ease;
                }
                .btn-main-action-black:hover {
                    background: #b91c1c;
                    color: #ffffff;
                }
                .sanitary-expired-warning {
                    background: rgba(220, 38, 38, 0.18);
                    color: #fca5a5;
                    border: 1px dashed #ef4444;
                    font-size: 0.72rem;
                    font-weight: 700;
                }

                /* Elementos comunes de tarjetas */
                .product-card-name {
                    font-size: 0.94rem;
                    font-weight: 700;
                    color: #0f172a;
                    line-height: 1.35;
                }
                .card-badge {
                    font-size: 0.69rem;
                    font-weight: 800;
                    padding: 3px 8px;
                    border-radius: 12px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    letter-spacing: 0.02em;
                }
                .badge-glow-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    display: inline-block;
                }
                .lot-tag-pill {
                    font-size: 0.72rem;
                    font-family: monospace;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    padding: 2px 7px;
                    border-radius: 6px;
                    color: #475569;
                    display: inline-flex;
                    align-items: center;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }
                .lot-tag-pill:hover {
                    background: #e2e8f0;
                }
                .tag-meta {
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 5px;
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }
                .tag-meta-code {
                    font-family: monospace;
                    color: #64748b;
                }

                .metrics-label {
                    font-size: 0.74rem;
                    color: #64748b;
                }
                .metrics-highlight {
                    font-size: 0.76rem;
                    font-weight: 700;
                    color: #0f172a;
                }
                .border-metrics-divider {
                    border-color: rgba(0, 0, 0, 0.06) !important;
                }
                .metrics-date-badge {
                    font-size: 0.76rem;
                    font-weight: 700;
                }
                .date-normal { color: #0f172a; }
                .date-urgent { color: #dc2626; }
                .date-expired { color: #f87171; }

                .btn-sub-action {
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    color: #334155;
                    border-radius: 8px;
                    font-size: 0.78rem;
                    padding: 6px 10px;
                    transition: all 0.15s ease;
                }
                .btn-sub-action:hover {
                    background: #f8fafc;
                    color: #0f172a;
                }

                .empty-state-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: #d1fae5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
};
