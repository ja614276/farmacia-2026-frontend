import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getSettings, saveSettings } from "../services/SettingsService.js";

export const TicketSettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        ticketPaperSize: "80mm",
        ticketFooterText1: "¡Gracias por su compra!",
        ticketFooterText2: "",
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const settingsData = await getSettings();
                if (settingsData) {
                    setForm({
                        ticketPaperSize: settingsData.ticketPaperSize || "80mm",
                        ticketFooterText1: settingsData.ticketFooterText1 || "¡Gracias por su compra!",
                        ticketFooterText2: settingsData.ticketFooterText2 || "",
                    });
                }
            } catch (error) {
                console.error("Error al cargar configuración de ticket:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectPaperSize = (size) => {
        setForm((prev) => ({
            ...prev,
            ticketPaperSize: size,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await saveSettings({
                ticketPaperSize: form.ticketPaperSize,
                ticketFooterText1: form.ticketFooterText1,
                ticketFooterText2: form.ticketFooterText2,
            });

            await Swal.fire({
                icon: "success",
                title: "Formato Guardado",
                text: `El formato de impresión predeterminado se ha establecido en ${form.ticketPaperSize}.`,
                confirmButtonColor: "#005f60",
                timer: 2000,
            });
        } catch (error) {
            console.error("Error al guardar configuración de ticket:", error);
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo guardar la configuración del ticket.",
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
                    <span className="visually-hidden">Cargando opciones de ticket...</span>
                </div>
                <p className="text-secondary small mt-3">Cargando configuración de impresión...</p>
                <style>{`.text-teal { color: #005f60; }`}</style>
            </div>
        );
    }

    return (
        <div className="ticket-settings-page w-100 min-vh-100 py-4 px-3 px-md-4">
            {/* 1. Header de la Página */}
            <div className="bg-white rounded-3 border p-4 shadow-sm mb-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="ticket-icon-box rounded-3 p-2.5 d-flex align-items-center justify-content-center">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#005f60" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect x="6" y="14" width="12" height="8" />
                            </svg>
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h4 className="m-0 fw-bold text-dark">Configuración de Ticket e Impresión</h4>
                                <span className="badge bg-teal-subtle text-teal rounded-pill px-2.5 py-1 small fw-bold">
                                    Formato: {form.ticketPaperSize}
                                </span>
                            </div>
                            <p className="text-secondary small m-0 mt-1">
                                Elige el tamaño de papel (58mm, 80mm o A4) con el que se emitirán e imprimirán los comprobantes de venta.
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
                                <span>Guardar Configuración</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 2. Selector de Formato de Papel */}
            <div className="bg-white rounded-3 border p-4 shadow-sm mb-4">
                <div className="mb-4">
                    <h5 className="fw-bold text-dark m-0">Selección de Tamaño de Papel</h5>
                    <p className="text-secondary small m-0 mt-1">
                        Haz clic sobre el formato que utiliza tu impresora física. Esta opción será la predeterminada al imprimir.
                    </p>
                </div>

                <div className="row g-4 mb-4">
                    {/* Tarjeta 1: 58 mm */}
                    <div className="col-12 col-md-4">
                        <div
                            className={`card-paper-size rounded-3 p-4 h-100 cursor-pointer border text-center position-relative ${
                                form.ticketPaperSize === "58mm" ? "selected" : ""
                            }`}
                            onClick={() => handleSelectPaperSize("58mm")}
                        >
                            {form.ticketPaperSize === "58mm" && (
                                <div className="badge-selected-pill position-absolute top-0 end-0 m-3">
                                    ✓ Seleccionado
                                </div>
                            )}
                            <div className="paper-icon-wrapper mini mx-auto mb-3">
                                <div className="paper-sheet paper-58mm">
                                    <div className="sheet-line"></div>
                                    <div className="sheet-line short"></div>
                                    <div className="sheet-line"></div>
                                    <div className="sheet-line short"></div>
                                </div>
                            </div>
                            <h5 className="fw-bold text-dark mb-1">58 mm</h5>
                            <div className="text-teal small fw-bold mb-2">Mini Ticket Térmico</div>
                            <p className="text-muted small m-0" style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>
                                Diseñado para impresoras portátiles bluetooth, rollos angostos de 2 pulgadas y puntos de venta móviles.
                            </p>
                        </div>
                    </div>

                    {/* Tarjeta 2: 80 mm */}
                    <div className="col-12 col-md-4">
                        <div
                            className={`card-paper-size rounded-3 p-4 h-100 cursor-pointer border text-center position-relative ${
                                form.ticketPaperSize === "80mm" ? "selected" : ""
                            }`}
                            onClick={() => handleSelectPaperSize("80mm")}
                        >
                            {form.ticketPaperSize === "80mm" && (
                                <div className="badge-selected-pill position-absolute top-0 end-0 m-3">
                                    ✓ Seleccionado
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
                            <div className="text-teal small fw-bold mb-2">Ticket Térmico POS (Estándar)</div>
                            <p className="text-muted small m-0" style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>
                                El formato más utilizado en farmacias y puntos de venta. Compatible con impresoras térmicas de caja como Epson, Bixolon, etc.
                            </p>
                        </div>
                    </div>

                    {/* Tarjeta 3: A4 */}
                    <div className="col-12 col-md-4">
                        <div
                            className={`card-paper-size rounded-3 p-4 h-100 cursor-pointer border text-center position-relative ${
                                form.ticketPaperSize === "A4" ? "selected" : ""
                            }`}
                            onClick={() => handleSelectPaperSize("A4")}
                        >
                            {form.ticketPaperSize === "A4" && (
                                <div className="badge-selected-pill position-absolute top-0 end-0 m-3">
                                    ✓ Seleccionado
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
                            <h5 className="fw-bold text-dark mb-1">A4 (Hoja Completa)</h5>
                            <div className="text-teal small fw-bold mb-2">Documento Corporativo Formal</div>
                            <p className="text-muted small m-0" style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>
                                Formato formal en hoja bond completa para facturas institucionales o impresoras convencionales láser/inyección.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Textos del Pie de Ticket */}
                <div className="pt-4 border-top">
                    <h6 className="fw-bold text-dark mb-2">Mensajes en el Pie del Comprobante</h6>
                    <p className="text-muted small mb-3">
                        Estos textos aparecerán al final del comprobante impreso en cualquiera de los formatos seleccionados.
                    </p>
                    <div className="row g-3">
                        <div className="col-12 col-md-6">
                            <label className="form-label small fw-semibold text-dark">Línea 1 (Agradecimiento o Saludo):</label>
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
                            <label className="form-label small fw-semibold text-dark">Línea 2 (Políticas, Devoluciones o Aviso Legal):</label>
                            <input
                                type="text"
                                name="ticketFooterText2"
                                value={form.ticketFooterText2}
                                onChange={handleChange}
                                className="form-control form-control-sm"
                                placeholder="Ej: No se aceptan cambios ni devoluciones de medicamentos"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Estilos */}
            <style>{`
                .ticket-icon-box {
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
                    font-size: 0.72rem;
                    font-weight: 700;
                    padding: 4px 10px;
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
                .cursor-pointer {
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};
