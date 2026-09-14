import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getSettings, saveSettings, getAllLots } from "../services/SettingsService.js";

export const AlertSettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lots, setLots] = useState([]);

    const [form, setForm] = useState({
        alertExpirationDays: 30,
        alertMinStockPercent: 20,
        alertEnableExpiration: true,
        alertEnableMinStock: true,
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
                        alertExpirationDays: settingsData.alertExpirationDays ?? 30,
                        alertMinStockPercent: settingsData.alertMinStockPercent ?? 20,
                        alertEnableExpiration: settingsData.alertEnableExpiration ?? true,
                        alertEnableMinStock: settingsData.alertEnableMinStock ?? true,
                    });
                }
                setLots(Array.isArray(lotsData) ? lotsData : []);
            } catch (error) {
                console.error("Error al cargar configuración de alertas:", error);
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

    // Cálculos en vivo según los valores en pantalla
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
                alertExpirationDays: Number(form.alertExpirationDays),
                alertMinStockPercent: Number(form.alertMinStockPercent),
                alertEnableExpiration: Boolean(form.alertEnableExpiration),
                alertEnableMinStock: Boolean(form.alertEnableMinStock),
            });

            await Swal.fire({
                icon: "success",
                title: "Configuración Guardada",
                text: "Los parámetros de alertas de vencimiento y stock mínimo se han guardado exitosamente.",
                confirmButtonColor: "#005f60",
                timer: 2000,
            });
        } catch (error) {
            console.error("Error al guardar configuración de alertas:", error);
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron guardar las opciones de alertas.",
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
                    <span className="visually-hidden">Cargando alertas...</span>
                </div>
                <p className="text-secondary small mt-3">Cargando opciones de alertas...</p>
                <style>{`.text-teal { color: #005f60; }`}</style>
            </div>
        );
    }

    return (
        <div className="alert-settings-page w-100 min-vh-100 py-4 px-3 px-md-4">
            {/* 1. Header de la Página */}
            <div className="bg-white rounded-3 border p-4 shadow-sm mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="alert-icon-box rounded-3 p-2.5 d-flex align-items-center justify-content-center">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#005f60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            </svg>
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h4 className="m-0 fw-bold text-dark">Configuración de Alertas</h4>
                                <span className="badge bg-teal-subtle text-teal rounded-pill px-2.5 py-1 small fw-bold">
                                    Módulo Preventivo
                                </span>
                            </div>
                            <p className="text-secondary small m-0 mt-1">
                                Administra las alertas preventivas de productos por vencer en el mes siguiente y reposición de stock mínimo en lotes.
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
                                <span>Guardar Alertas</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 2. Tarjetas de Configuración de Alertas */}
            <div className="row g-4 mb-4">
                {/* Alerta de Vencimiento */}
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
                                Esta alerta avisa sobre lotes de medicamentos que caducarán en el transcurso del <strong>siguiente mes</strong> (próximos <strong>{form.alertExpirationDays} días</strong>), mostrándolos en el componente de avisos del Dashboard para coordinar su venta preferente o devolución.
                            </p>

                            <div className="mb-4">
                                <label className="form-label small fw-bold text-dark mb-1">
                                    Días de anticipación para el aviso:
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
                                    Valor recomendado: 30 días para cubrir completamente el mes siguiente.
                                </small>
                            </div>
                        </div>

                        <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                            <span className="small text-secondary fw-semibold">Lotes por vencer detectados:</span>
                            <span className={`badge ${expiringCount > 0 ? "bg-danger" : "bg-success"} rounded-pill px-3 py-1.5 fw-bold`}>
                                {expiringCount} {expiringCount === 1 ? "lote próximo a vencer" : "lotes próximos a vencer"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Alerta de Stock Mínimo (20% inicial) */}
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
                                        <small className="text-secondary">Lotes con stock al 20% o menos respecto al inicial</small>
                                    </div>
                                </div>

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
                                Avisa oportunamente cuando un lote empieza a quedar desabastecido. Se activa automáticamente cuando la <strong>cantidad actual del lote es del {form.alertMinStockPercent}% o menos</strong> con respecto a su cantidad inicial ingresada al almacén.
                            </p>

                            <div className="mb-4">
                                <label className="form-label small fw-bold text-dark mb-1">
                                    Porcentaje de stock crítico:
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
                                    Fórmula: [ Cantidad Actual ≤ Cantidad Inicial × 20% ]
                                </small>
                            </div>
                        </div>

                        <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                            <span className="small text-secondary fw-semibold">Lotes en stock mínimo detectados:</span>
                            <span className={`badge ${lowStockCount > 0 ? "bg-warning text-dark" : "bg-success"} rounded-pill px-3 py-1.5 fw-bold`}>
                                {lowStockCount} {lowStockCount === 1 ? "lote en aviso" : "lotes en aviso"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estilos */}
            <style>{`
                .alert-icon-box {
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
                .bg-teal-subtle {
                    background-color: #ccfbf1;
                }
                .text-teal {
                    color: #0f766e;
                }
                .switch-custom:checked {
                    background-color: #005f60;
                    border-color: #005f60;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};
