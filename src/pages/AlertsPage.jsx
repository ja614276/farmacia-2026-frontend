import React from "react";
import { useNavigate } from "react-router-dom";
import { AvisoAlertas } from "../components/AvisoAlertas.jsx";

export const AlertsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="alerts-page-container w-100 min-vh-100 py-3 px-2 px-md-4">
            {/* Breadcrumb y encabezado de página */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
                <div>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-1 small text-muted">
                            <li className="breadcrumb-item">
                                <span
                                    style={{ cursor: "pointer", color: "#005f60" }}
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Inicio
                                </span>
                            </li>
                            <li className="breadcrumb-item active text-dark fw-semibold" aria-current="page">
                                Avisos y Alertas
                            </li>
                        </ol>
                    </nav>
                    <div className="d-flex align-items-center gap-2">
                        <h3 className="m-0 fw-bold text-dark" style={{ letterSpacing: "-0.02em" }}>
                            Avisos y Alertas del Sistema
                        </h3>
                    </div>
                    <p className="text-secondary small m-0 mt-1">
                        Centro de control de inventario crítico: monitoreo de lotes con stock bajo, fechas de caducidad próximas y medicamentos vencidos.
                    </p>
                </div>

                {/* Acciones de cabecera */}
                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/settings/alerts")}
                        className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm shadow-sm"
                        title="Ajustar parámetros de alerta"
                        style={{ borderRadius: "10px" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span>Parámetros de Alertas</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/purchases/register")}
                        className="btn btn-teal-header d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm shadow-sm"
                        style={{ borderRadius: "10px" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                            <path d="M3 6h18" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span>Nueva Compra</span>
                    </button>
                </div>
            </div>

            {/* Componente principal de Avisos y Alertas */}
            <AvisoAlertas isStandalonePage={true} />

            <style>{`
                .alerts-page-container {
                    background-color: #f8fafc;
                }
                .btn-teal-header {
                    background-color: #005f60;
                    color: #ffffff;
                    border: none;
                    transition: background-color 0.2s ease;
                }
                .btn-teal-header:hover {
                    background-color: #004b4c;
                    color: #ffffff;
                }
            `}</style>
        </div>
    );
};
