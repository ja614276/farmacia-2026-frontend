import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getSettings, saveSettings, getAllLots } from "../services/SettingsService.js";

export const SettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("alerts"); // 'alerts' | 'tickets'
    const [lots, setLots] = useState([]);

    const [form, setForm] = useState({
        ticketPaperSize: "80mm",
        alertExpirationDays: 30,
        alertMinStockPercent: 20,
        alertEnableExpiration: true,
        alertEnableMinStock: true,
        ticketFooterText1: "¡Gracias por su compra!",
        ticketFooterText2: "",
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [settingsData, lotsData] = await Promise.all([
                    getSettings(),
                    getAllLots()
                ]);

                if (settingsData) {
                    setForm({
                        ticketPaperSize: settingsData.ticketPaperSize || "80mm",
                        alertExpirationDays: settingsData.alertExpirationDays ?? 30,
                        alertMinStockPercent: settingsData.alertMinStockPercent ?? 20,
                        alertEnableExpiration: settingsData.alertEnableExpiration ?? true,
                        alertEnableMinStock: settingsData.alertEnableMinStock ?? true,
                        ticketFooterText1: settingsData.ticketFooterText1 || "¡Gracias por su compra!",
                        ticketFooterText2: settingsData.ticketFooterText2 || "",
                    });
                }
                setLots(Array.isArray(lotsData) ? lotsData : []);
            } catch (error) {
                console.error("Error al cargar configuración:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSelectPaperSize = (size) => {
        setForm((prev) => ({
            ...prev,
            ticketPaperSize: size,
        }));
    };

    // Cálculos en tiempo real del impacto de las alertas configuradas
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiringCount = lots.filter((lot) => {
        if (!form.alertEnableExpiration || !lot.fechaVencimiento) return false;
        const cleanDateStr = lot.fechaVencimiento.replace(" ", "T");
        const expDate = new Date(cleanDateStr);
        if (isNaN(expDate.getTime())) return false;
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= Number(form.alertExpirationDays);
    }).length;

    const lowStockCount = lots.filter((lot) => {
        if (!form.alertEnableMinStock) return false;
        const inicial = Number(lot.cantidadInicial) || 1;
        const actual = Number(lot.cantidadActual) || 0;
        const pct = (actual / inicial) * 100;
        return pct <= Number(form.alertMinStockPercent);
    }).length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await saveSettings({
                ...form,
                alertExpirationDays: Number(form.alertExpirationDays),
                alertMinStockPercent: Number(form.alertMinStockPercent),
            });

            await Swal.fire({
                icon: "success",
                title: "Configuración Guardada",
                text: "Los parámetros de alertas y formato de ticket se han actualizado correctamente.",
                confirmButtonColor: "#005f60",
                timer: 2000,
            });
        } catch (error) {
            console.error("Error al guardar configuración:", error);
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo guardar la configuración. Por favor, intente nuevamente.",
                confirmButtonColor: "#005f60",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-100 min-vh-100 d-flex flex-column align-items-center justify-content-center p-4">
                <div className="spinner-border text-teal" role="status">
                    <span className="visually-hidden">Cargando configuración...</span>
                </div>
                <p className="text-secondary small mt-3">Cargando opciones de configuración...</p>
                <style>{`.text-teal { color: #005f60; }`}</style>
            </div>
        );
    }

    return (
        <div className="settings-page w-100 min-vh-100 py-4 px-3 px-md-4">
            {/* 1. Header de la Página */}
            <div className="bg-white rounded-3 border p-4 shadow-sm mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="settings-header-icon rounded-3 p-2.5 d-flex align-items-center justify-content-center">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#005f60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="m-0 fw-bold text-dark">Configuraciones Generales</h4>
                            <p className="text-secondary small m-0 mt-1">
                                Administra las reglas de alerta de productos y el formato predeterminado de los tickets de impresión.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn btn-save-teal px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 shadow-sm rounded-3"
                    >
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                                <span>Guardar Cambios</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Navegación por pestañas */}
                <div className="d-flex align-items-center gap-2 mt-4 pt-3 border-top">
                    <button
                        type="button"
                        className={`nav-tab-pill ${activeTab === "alerts" ? "active" : ""}`}
                        onClick={() => setActiveTab("alerts")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                        <span>Configurar Alertas</span>
                        <span className="badge-count">{expiringCount + lowStockCount}</span>
                    </button>

                    <button
                        type="button"
                        className={`nav-tab-pill ${activeTab === "tickets" ? "active" : ""}`}
                        onClick={() => setActiveTab("tickets")}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        <span>Configurar Ticket ({form.ticketPaperSize})</span>
                    </button>
                </div>
            </div>

            {/* 2. Contenido del Tab: Configurar Alertas */}
            {activeTab === "alerts" && (
                <div className="row g-4">
                    {/* Tarjeta 1: Alerta de Vencimiento de Productos */}
                    <div className="col-12 col-lg-6">
                        <div className="bg-white rounded-3 border p-4 shadow-sm h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div className="p-2 rounded-3 bg-danger-subtle text-danger">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="m-0 fw-bold text-dark">Alerta de Vencimiento</h6>
                                            <small className="text-secondary">Productos que vencerán en el siguiente mes</small>
                                        </div>
                                    </div>

                                    {/* Switch Toggle */}
                                    <div className="form-check form-switch m-0">
                                        <input
                                            className="form-check-input switch-custom cursor-pointer"
                                            type="checkbox"
                                            name="alertEnableExpiration"
                                            checked={form.alertEnableExpiration}
                                            onChange={handleChange}
                                            id="switchExpiration"
                                        />
                                    </div>
                                </div>

                                <p className="text-secondary small leading-relaxed mb-4">
                                    Esta alerta avisa preventivamente sobre los productos cuyos lotes tienen fecha de caducidad fijada dentro de los próximos <strong>{form.alertExpirationDays} días</strong> (siguiente mes calendario), evitando pérdidas económicas y garantizando la calidad farmacéutica.
                                </p>

                                {/* Input del parámetro */}
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-dark mb-1">
                                        Anticipación de Alerta de Vencimiento:
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            min="1"
                                            max="180"
                                            name="alertExpirationDays"
                                            value={form.alertExpirationDays}
                                            onChange={handleChange}
                                            disabled={!form.alertEnableExpiration}
                                            className="form-control form-control-sm font-weight-bold"
                                            style={{ maxWidth: "140px" }}
                                        />
                                        <span className="input-group-text small bg-light text-muted">días (1 mes = 30 días)</span>
                                    </div>
                                    <small className="text-muted d-block mt-1">
                                        Recomendado: 30 días para cubrir todo el siguiente mes.
                                    </small>
                                </div>
                            </div>

                            {/* Resumen de Detección */}
                            <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                                <span className="small text-secondary fw-semibold">Lotes por vencer detectados:</span>
                                <span className={`badge ${expiringCount > 0 ? "bg-danger" : "bg-success"} rounded-pill px-3 py-1.5 fw-bold`}>
                                    {expiringCount} {expiringCount === 1 ? "lote en riesgo" : "lotes en riesgo"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 2: Alerta de Stock Mínimo (20% inicial) */}
                    <div className="col-12 col-lg-6">
                        <div className="bg-white rounded-3 border p-4 shadow-sm h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div className="p-2 rounded-3 bg-warning-subtle text-warning-emphasis">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                                <line x1="12" y1="9" x2="12" y2="13" />
                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h6 className="m-0 fw-bold text-dark">Alerta de Stock Mínimo</h6>
                                            <small className="text-secondary">Lotes con 20% o menos de su cantidad inicial</small>
                                        </div>
                                    </div>

                                    {/* Switch Toggle */}
                                    <div className="form-check form-switch m-0">
                                        <input
                                            className="form-check-input switch-custom cursor-pointer"
                                            type="checkbox"
                                            name="alertEnableMinStock"
                                            checked={form.alertEnableMinStock}
                                            onChange={handleChange}
                                            id="switchMinStock"
                                        />
                                    </div>
                                </div>

                                <p className="text-secondary small leading-relaxed mb-4">
                                    Notifica automáticamente cuando el lote empieza a agotarse. Se activa cuando la <strong>cantidad actual</strong> es menor o igual al <strong>{form.alertMinStockPercent}%</strong> de la cantidad con la que ingresó el lote originalmente.
                                </p>

                                {/* Input del parámetro */}
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-dark mb-1">
                                        Porcentaje Umbral de Stock Mínimo:
                                    </label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            name="alertMinStockPercent"
                                            value={form.alertMinStockPercent}
                                            onChange={handleChange}
                                            disabled={!form.alertEnableMinStock}
                                            className="form-control form-control-sm font-weight-bold"
                                            style={{ maxWidth: "140px" }}
                                        />
                                        <span className="input-group-text small bg-light text-muted">% de la cantidad inicial</span>
                                    </div>
                                    <small className="text-muted d-block mt-1">
                                        Regla establecida: 20% o menos con respecto a la cantidad inicial del lote.
                                    </small>
                                </div>
                            </div>

                            {/* Resumen de Detección */}
                            <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                                <span className="small text-secondary fw-semibold">Lotes con stock crítico detectados:</span>
                                <span className={`badge ${lowStockCount > 0 ? "bg-warning text-dark" : "bg-success"} rounded-pill px-3 py-1.5 fw-bold`}>
                                    {lowStockCount} {lowStockCount === 1 ? "lote en aviso" : "lotes en aviso"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Contenido del Tab: Configurar Ticket (58mm, 80mm, A4) */}
            {activeTab === "tickets" && (
                <div className="bg-white rounded-3 border p-4 shadow-sm">
                    <div className="mb-4">
                        <h5 className="fw-bold text-dark m-0">Tamaño de Papel para Impresión de Comprobante</h5>
                        <p className="text-secondary small m-0 mt-1">
                            Elige el formato de salida con el que se generará e imprimirá el ticket de venta al pulsar "Imprimir".
                        </p>
                    </div>

                    {/* 3 Tarjetas de Selección de Formato */}
                    <div className="row g-3 mb-4">
                        {/* Opción 1: 58mm */}
                        <div className="col-12 col-md-4">
                            <div
                                className={`card-paper-size rounded-3 p-4 h-100 cursor-pointer border text-center position-relative ${
                                    form.ticketPaperSize === "58mm" ? "selected" : ""
                                }`}
                                onClick={() => handleSelectPaperSize("58mm")}
                            >
                                {form.ticketPaperSize === "58mm" && (
                                    <div className="badge-selected-pill position-absolute top-0 end-0 m-3">
                                        ✓ Activo
                                    </div>
                                )}
                                <div className="paper-icon-wrapper mini mx-auto mb-3">
                                    <div className="paper-sheet paper-58mm">
                                        <div className="sheet-line"></div>
                                        <div className="sheet-line short"></div>
                                        <div className="sheet-line"></div>
                                    </div>
                                </div>
                                <h5 className="fw-bold text-dark mb-1">58 mm</h5>
                                <div className="text-teal small fw-semibold mb-2">Mini Ticket Térmico</div>
                                <p className="text-muted small m-0" style={{ fontSize: "0.78rem" }}>
                                    Formato angosto ideal para impresoras portátiles bluetooth, tickets de 2 pulgadas y terminales móviles.
                                </p>
                            </div>
                        </div>

                        {/* Opción 2: 80mm (Estándar POS) */}
                        <div className="col-12 col-md-4">
                            <div
                                className={`card-paper-size rounded-3 p-4 h-100 cursor-pointer border text-center position-relative ${
                                    form.ticketPaperSize === "80mm" ? "selected" : ""
                                }`}
                                onClick={() => handleSelectPaperSize("80mm")}
                            >
                                {form.ticketPaperSize === "80mm" && (
                                    <div className="badge-selected-pill position-absolute top-0 end-0 m-3">
                                        ✓ Activo
                                    </div>
                                )}
                                <div className="paper-icon-wrapper standard mx-auto mb-3">
                                    <div className="paper-sheet paper-80mm">
                                        <div className="sheet-line"></div>
                                        <div className="sheet-line"></div>
                                        <div className="sheet-line short"></div>
                                        <div className="sheet-line"></div>
                                    </div>
                                </div>
                                <h5 className="fw-bold text-dark mb-1">80 mm</h5>
                                <div className="text-teal small fw-semibold mb-2">Ticket Térmico POS (Estándar)</div>
                                <p className="text-muted small m-0" style={{ fontSize: "0.78rem" }}>
                                    El tamaño más común en farmacias y puntos de venta. Compatible con Epson TM-T20, Bixolon, Star y similares.
                                </p>
                            </div>
                        </div>

                        {/* Opción 3: A4 */}
                        <div className="col-12 col-md-4">
                            <div
                                className={`card-paper-size rounded-3 p-4 h-100 cursor-pointer border text-center position-relative ${
                                    form.ticketPaperSize === "A4" ? "selected" : ""
                                }`}
                                onClick={() => handleSelectPaperSize("A4")}
                            >
                                {form.ticketPaperSize === "A4" && (
                                    <div className="badge-selected-pill position-absolute top-0 end-0 m-3">
                                        ✓ Activo
                                    </div>
                                )}
                                <div className="paper-icon-wrapper full mx-auto mb-3">
                                    <div className="paper-sheet paper-a4">
                                        <div className="sheet-line"></div>
                                        <div className="sheet-line"></div>
                                        <div className="sheet-line"></div>
                                        <div className="sheet-line short"></div>
                                        <div className="sheet-line"></div>
                                    </div>
                                </div>
                                <h5 className="fw-bold text-dark mb-1">A4 (Hoja Bond)</h5>
                                <div className="text-teal small fw-semibold mb-2">Documento Corporativo Formal</div>
                                <p className="text-muted small m-0" style={{ fontSize: "0.78rem" }}>
                                    Impresión en página completa con membrete institucional, ideal para facturación a empresas o impresoras láser/inyección.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Textos del Pie de Ticket */}
                    <div className="pt-4 border-top">
                        <h6 className="fw-bold text-dark mb-3">Mensajes de Pie de Página (Ticket)</h6>
                        <div className="row g-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-semibold text-dark">Texto Línea 1 (Agradecimiento):</label>
                                <input
                                    type="text"
                                    name="ticketFooterText1"
                                    value={form.ticketFooterText1}
                                    onChange={handleChange}
                                    className="form-control form-control-sm"
                                    placeholder="Ej: ¡Gracias por su compra!"
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label small fw-semibold text-dark">Texto Línea 2 (Políticas/Aviso):</label>
                                <input
                                    type="text"
                                    name="ticketFooterText2"
                                    value={form.ticketFooterText2}
                                    onChange={handleChange}
                                    className="form-control form-control-sm"
                                    placeholder="Ej: No se aceptan devoluciones después de 7 días"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Estilos */}
            <style>{`
                .settings-header-icon {
                    background-color: #e6f4f1;
                    width: 48px;
                    height: 48px;
                }
                .btn-save-teal {
                    background-color: #005f60;
                    border: none;
                    transition: all 0.2s ease;
                }
                .btn-save-teal:hover {
                    background-color: #004d4e;
                    transform: translateY(-1px);
                }
                .text-teal {
                    color: #005f60;
                }
                .nav-tab-pill {
                    background-color: transparent;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 7px 16px;
                    font-size: 0.84rem;
                    font-weight: 600;
                    color: #475569;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.15s ease;
                }
                .nav-tab-pill:hover {
                    background-color: #f1f5f9;
                    color: #0f172a;
                }
                .nav-tab-pill.active {
                    background-color: #005f60;
                    border-color: #005f60;
                    color: #ffffff;
                }
                .badge-count {
                    background-color: rgba(0, 0, 0, 0.12);
                    padding: 2px 7px;
                    border-radius: 10px;
                    font-size: 0.72rem;
                }
                .nav-tab-pill.active .badge-count {
                    background-color: rgba(255, 255, 255, 0.25);
                    color: #ffffff;
                }
                .switch-custom:checked {
                    background-color: #005f60;
                    border-color: #005f60;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                .card-paper-size {
                    background-color: #f8fafc;
                    border-color: #e2e8f0;
                    transition: all 0.2s ease;
                }
                .card-paper-size:hover {
                    background-color: #ffffff;
                    border-color: #005f60;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0, 95, 96, 0.08);
                }
                .card-paper-size.selected {
                    background-color: #ffffff;
                    border-color: #005f60;
                    box-shadow: 0 0 0 2px #005f60;
                }
                .badge-selected-pill {
                    background-color: #005f60;
                    color: #ffffff;
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 3px 9px;
                    border-radius: 12px;
                }
                .paper-icon-wrapper {
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .paper-sheet {
                    background-color: #ffffff;
                    border: 1.5px solid #94a3b8;
                    border-radius: 4px;
                    padding: 6px 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .paper-58mm {
                    width: 44px;
                    height: 64px;
                }
                .paper-80mm {
                    width: 60px;
                    height: 70px;
                }
                .paper-a4 {
                    width: 68px;
                    height: 78px;
                }
                .sheet-line {
                    height: 3px;
                    background-color: #cbd5e1;
                    border-radius: 2px;
                    width: 100%;
                }
                .sheet-line.short {
                    width: 60%;
                }
            `}</style>
        </div>
    );
};
