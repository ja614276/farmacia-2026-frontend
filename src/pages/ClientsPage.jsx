import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { findAllClients, removeClient } from "../services/ClientService";

export const ClientsPage = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("ALL"); // 'ALL' | 'DEBT' | 'ACTIVE'
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const loadClients = async () => {
        try {
            setIsLoading(true);
            const response = await findAllClients();
            setClients(response.data || []);
        } catch (error) {
            console.error("Error al cargar clientes:", error);
            Swal.fire("Error", "No se pudo obtener la lista de clientes", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const handleDelete = async (client) => {
        const clientName =
            client.fullName ||
            `${client.firstName || client.nombres || ""} ${client.lastName || client.apellidos || ""}`.trim() ||
            "este cliente";

        const result = await Swal.fire({
            title: "¿Eliminar registro de cliente?",
            text: `¿Seguro que deseas eliminar a "${clientName}" del directorio?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                const clientId = client.id || client.idCliente;
                await removeClient(clientId);
                setClients((prev) => prev.filter((item) => (item.id || item.idCliente) !== clientId));
                Swal.fire({
                    title: "Cliente Eliminado",
                    text: "El registro ha sido removido del sistema.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error("Error al eliminar cliente:", error);
                Swal.fire("Error", "No se pudo eliminar el cliente.", "error");
            }
        }
    };

    // Métricas del Directorio
    const counts = useMemo(() => {
        const total = clients.length;
        const withDebt = clients.filter((c) => Number(c.currentBalance ?? c.saldo ?? 0) > 0);
        const active = clients.filter((c) => c.isActive !== false).length;
        const totalDebtAmount = withDebt.reduce((acc, c) => acc + Number(c.currentBalance ?? c.saldo ?? 0), 0);

        return {
            total,
            debtCount: withDebt.length,
            totalDebtAmount,
            active,
        };
    }, [clients]);

    // Filtrado unificado
    const filteredClients = useMemo(() => {
        let list = [...clients];

        if (activeTab === "DEBT") {
            list = list.filter((c) => Number(c.currentBalance ?? c.saldo ?? 0) > 0);
        } else if (activeTab === "ACTIVE") {
            list = list.filter((c) => c.isActive !== false);
        }

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            list = list.filter((c) => {
                const firstName = (c.firstName || c.nombres || "").toLowerCase();
                const lastName = (c.lastName || c.apellidos || "").toLowerCase();
                const fullName = `${firstName} ${lastName}`;
                const doc = (c.identification || c.identificacion || "").toLowerCase();
                const phone = (c.phone || c.telefono || "").toLowerCase();
                const email = (c.email || "").toLowerCase();
                const insurance = (c.healthInsurance || c.obraSocial || "").toLowerCase();

                return (
                    fullName.includes(query) ||
                    doc.includes(query) ||
                    phone.includes(query) ||
                    email.includes(query) ||
                    insurance.includes(query)
                );
            });
        }

        return list;
    }, [clients, activeTab, searchTerm]);

    const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div className="clients-monochrome-page w-full min-h-screen py-4 px-3 sm:px-6">
            {/* Header superior y controles */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div>
                    <nav aria-label="breadcrumb" className="mb-1">
                        <ol className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <li>
                                <span
                                    className="cursor-pointer text-zinc-800 hover:text-black underline"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Dashboard
                                </span>
                            </li>
                            <li className="text-zinc-400">/</li>
                            <li className="text-zinc-900 font-semibold">Clientes</li>
                        </ol>
                    </nav>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight m-0">
                        Directorio de Clientes y Pacientes
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5 m-0">
                        Gestión de expedientes de clientes, cuentas corrientes y condiciones de crédito comercial.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                    {/* Buscador */}
                    <div className="relative min-w-[220px] sm:min-w-[260px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Buscar por nombre, DNI, teléfono..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors text-zinc-900 placeholder:text-zinc-400"
                        />
                    </div>

                    {/* Botón Nuevo Cliente */}
                    <Link
                        to="/clients/register"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nuevo Cliente</span>
                    </Link>
                </div>
            </div>

            {/* BARRA CONSOLIDADA DE MÉTRICAS (SIN CARDS - FRANJA ESTRUCTURADA MONOCROMÁTICA) */}
            <div className="clients-summary-strip mb-4">
                <div className="summary-strip-cell" onClick={() => setActiveTab("ALL")}>
                    <span className="summary-label">Total Clientes</span>
                    <span className="summary-val">{counts.total}</span>
                    <span className="summary-hint">Registrados en el sistema</span>
                </div>

                <div className="summary-strip-divider"></div>

                <div className="summary-strip-cell" onClick={() => setActiveTab("ACTIVE")}>
                    <span className="summary-label">Clientes Activos</span>
                    <span className="summary-val">{counts.active}</span>
                    <span className="summary-hint">Habilitados para compra</span>
                </div>

                <div className="summary-strip-divider"></div>

                <div className="summary-strip-cell highlight-cell" onClick={() => setActiveTab("DEBT")}>
                    <span className="summary-label">Con Saldo Pendiente</span>
                    <span className="summary-val">{counts.debtCount}</span>
                    <span className="summary-hint">S/ {counts.totalDebtAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })} en cartera</span>
                </div>
            </div>

            {/* CONTROLES Y PESTAÑAS SEGMENTADAS MONOCROMÁTICAS */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div className="segmented-tabs-wrap d-flex align-items-center">
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === "ALL" ? "tab-btn-active" : ""}`}
                        onClick={() => {
                            setActiveTab("ALL");
                            setCurrentPage(1);
                        }}
                    >
                        Todos ({counts.total})
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === "DEBT" ? "tab-btn-active" : ""}`}
                        onClick={() => {
                            setActiveTab("DEBT");
                            setCurrentPage(1);
                        }}
                    >
                        Con Deuda ({counts.debtCount})
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === "ACTIVE" ? "tab-btn-active" : ""}`}
                        onClick={() => {
                            setActiveTab("ACTIVE");
                            setCurrentPage(1);
                        }}
                    >
                        Activos ({counts.active})
                    </button>
                </div>

                <span className="text-zinc-500 text-xs">
                    {filteredClients.length} cliente(s) listados
                </span>
            </div>

            {/* TABLA CORPORATIVA DE CLIENTES (NO CARDS) */}
            <div className="data-table-wrapper shadow-xs">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="text-center py-16">
                            <div className="spinner-border text-dark spinner-border-sm mb-2" role="status"></div>
                            <p className="text-zinc-500 text-xs m-0">Cargando directorio de clientes...</p>
                        </div>
                    ) : paginatedClients.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" className="mb-2 mx-auto">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h6 className="font-bold text-zinc-900 text-sm m-0">No se encontraron clientes</h6>
                            <p className="text-zinc-500 text-xs m-0 mt-1 max-w-sm mx-auto">
                                {searchTerm
                                    ? `No hay registros que coincidan con "${searchTerm}".`
                                    : activeTab === "DEBT"
                                    ? "No hay clientes con deuda pendiente en esta vista."
                                    : "Aún no se han registrado clientes en el sistema."}
                            </p>
                            {!searchTerm && (
                                <Link
                                    to="/clients/register"
                                    className="inline-block mt-3 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                                >
                                    + Registrar Primer Cliente
                                </Link>
                            )}
                        </div>
                    ) : (
                        <table className="table table-hover align-middle m-0 enterprise-table">
                            <thead>
                                <tr>
                                    <th>CLIENTE / TITULAR</th>
                                    <th style={{ width: "170px" }}>CONTACTO</th>
                                    <th style={{ width: "200px" }}>DIRECCIÓN</th>
                                    <th style={{ width: "170px" }}>CRÉDITO / SALDO</th>
                                    <th style={{ width: "110px" }} className="text-center">ESTADO</th>
                                    <th style={{ width: "130px" }} className="text-end pe-3">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedClients.map((c) => {
                                    const clientId = c.id || c.idCliente;
                                    const fullName =
                                        c.fullName ||
                                        `${c.firstName || c.nombres || ""} ${c.lastName || c.apellidos || ""}`.trim() ||
                                        "Sin nombre";
                                    const doc = c.identification || c.identificacion;
                                    const isClientActive = c.isActive !== false;
                                    const limit = Number(c.creditLimit ?? c.limiteCredito ?? 0);
                                    const balance = Number(c.currentBalance ?? c.saldo ?? 0);
                                    const hasDebt = balance > 0.001;

                                    return (
                                        <tr key={clientId} className={hasDebt ? "row-debt" : ""}>
                                            {/* CLIENTE / TITULAR */}
                                            <td>
                                                <div className="font-semibold text-zinc-900 text-xs">
                                                    {fullName}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {doc ? (
                                                        <span className="tag-mono-doc">
                                                            DNI/RUC: {doc}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-zinc-400 italic">
                                                            Sin documento
                                                        </span>
                                                    )}
                                                    {(c.healthInsurance || c.obraSocial) && (
                                                        <span className="tag-insurance">
                                                            {c.healthInsurance || c.obraSocial}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* CONTACTO */}
                                            <td>
                                                <div className="space-y-0.5 text-xs">
                                                    {(c.phone || c.telefono) ? (
                                                        <div className="flex items-center gap-1.5 text-zinc-800 font-medium">
                                                            <svg className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <span>{c.phone || c.telefono}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-zinc-400 italic">Sin teléfono</span>
                                                    )}

                                                    {c.email && (
                                                        <div className="text-zinc-500 text-[11px] truncate max-w-[150px]">
                                                            {c.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* DIRECCIÓN */}
                                            <td>
                                                {c.address || c.direccion ? (
                                                    <span className="text-zinc-700 text-xs line-clamp-2">
                                                        {c.address || c.direccion}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-zinc-400 italic">Sin dirección registrada</span>
                                                )}
                                            </td>

                                            {/* CRÉDITO / SALDO */}
                                            <td>
                                                <div className="space-y-0.5">
                                                    <div className="text-zinc-600 text-xs">
                                                        Límite: <span className="font-semibold text-zinc-800">S/ {limit.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-xs">
                                                        Saldo:{" "}
                                                        <span className={hasDebt ? "font-bold text-zinc-900" : "text-zinc-400"}>
                                                            S/ {balance.toFixed(2)}
                                                        </span>
                                                        {hasDebt && (
                                                            <span className="ms-1.5 badge-tag tag-pending-debt">
                                                                DEUDA
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* ESTADO */}
                                            <td className="text-center">
                                                {isClientActive ? (
                                                    <span className="badge-tag tag-active">
                                                        ACTIVO
                                                    </span>
                                                ) : (
                                                    <span className="badge-tag tag-inactive">
                                                        INACTIVO
                                                    </span>
                                                )}
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="text-end pe-3">
                                                <div className="inline-flex items-center gap-1">
                                                    {hasDebt && (
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate("/collections")}
                                                            className="p-1 rounded text-zinc-900 hover:bg-zinc-100 transition-colors"
                                                            title="Cobrar / Gestionar cobranza"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <rect width="20" height="14" x="2" y="5" rx="2" strokeWidth="2" />
                                                                <line x1="2" x2="22" y1="10" y2="10" strokeWidth="2" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/clients/edit/${clientId}`)}
                                                        className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                                        title="Editar datos del cliente"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(c)}
                                                        className="p-1 rounded text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                                                        title="Eliminar cliente"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer: Paginación formal */}
                {!isLoading && filteredClients.length > 0 && (
                    <div className="p-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 bg-white">
                        <span className="text-[11px] text-zinc-500">
                            Mostrando {paginatedClients.length} de {filteredClients.length} registros
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="w-7 h-7 rounded border border-zinc-200 flex items-center justify-center text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                &lt;
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((page) => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                .map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-7 h-7 rounded text-xs font-semibold ${
                                            currentPage === page
                                                ? "bg-zinc-900 text-white"
                                                : "border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="w-7 h-7 rounded border border-zinc-200 flex items-center justify-center text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ESTILOS MONOCROMÁTICOS */}
            <style>{`
                .clients-monochrome-page {
                    background-color: #fafafa;
                    color: #09090b;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                /* Franja de Resumen */
                .clients-summary-strip {
                    display: flex;
                    align-items: stretch;
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .summary-strip-cell {
                    flex: 1;
                    padding: 12px 16px;
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
                    font-size: 0.68rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #71717a;
                }
                .summary-val {
                    font-size: 1.45rem;
                    font-weight: 700;
                    color: #09090b;
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                }
                .summary-hint {
                    font-size: 0.7rem;
                    color: #a1a1aa;
                }
                .highlight-cell {
                    background-color: #fcfcfc;
                }

                /* Pestañas Segmentadas */
                .segmented-tabs-wrap {
                    background-color: #f4f4f5;
                    padding: 3px;
                    border-radius: 6px;
                    border: 1px solid #e4e4e7;
                }
                .tab-btn {
                    background: transparent;
                    border: none;
                    color: #71717a;
                    font-size: 0.75rem;
                    font-weight: 500;
                    padding: 5px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .tab-btn:hover {
                    color: #09090b;
                }
                .tab-btn-active {
                    background-color: #09090b !important;
                    color: #ffffff !important;
                    font-weight: 600;
                }

                /* Tabla Corporativa */
                .data-table-wrapper {
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .enterprise-table thead th {
                    background-color: #f4f4f5;
                    color: #52525b;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #e4e4e7;
                    padding: 10px 14px;
                }
                .enterprise-table tbody td {
                    padding: 10px 14px;
                    border-bottom: 1px solid #f4f4f5;
                    font-size: 0.8rem;
                }
                .enterprise-table tbody tr:hover td {
                    background-color: #fafafa;
                }
                .row-debt td {
                    background-color: rgba(9, 9, 11, 0.015);
                }

                /* Tags Monocromáticos */
                .tag-mono-doc {
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    font-size: 0.68rem;
                    background-color: #f4f4f5;
                    border: 1px solid #e4e4e7;
                    padding: 1px 5px;
                    border-radius: 3px;
                    color: #09090b;
                }
                .tag-insurance {
                    font-size: 0.68rem;
                    background-color: #ffffff;
                    border: 1px solid #d4d4d8;
                    padding: 1px 5px;
                    border-radius: 3px;
                    color: #52525b;
                }

                .badge-tag {
                    font-size: 0.66rem;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    padding: 2px 7px;
                    border-radius: 4px;
                    display: inline-block;
                    white-space: nowrap;
                }
                .tag-active {
                    background-color: #09090b;
                    border: 1px solid #09090b;
                    color: #ffffff;
                }
                .tag-inactive {
                    background-color: #f4f4f5;
                    border: 1px solid #d4d4d8;
                    color: #71717a;
                }
                .tag-pending-debt {
                    background-color: #ffffff;
                    border: 1px solid #09090b;
                    color: #09090b;
                    font-size: 0.62rem;
                }
            `}</style>
        </div>
    );
};
