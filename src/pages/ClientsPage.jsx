import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { findAllClients, removeClient } from "../services/ClientService";

export const ClientsPage = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
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
            title: "¿Eliminar cliente?",
            text: `¿Seguro que deseas eliminar a "${clientName}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                const clientId = client.id || client.idCliente;
                await removeClient(clientId);
                setClients((prev) => prev.filter((item) => (item.id || item.idCliente) !== clientId));
                Swal.fire({
                    title: "¡Eliminado!",
                    text: "Cliente eliminado correctamente.",
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

    const filteredClients = clients.filter((c) => {
        const query = searchTerm.toLowerCase();
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

    const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const getInitials = (c) => {
        const fn = c.firstName || c.nombres || "";
        const ln = c.lastName || c.apellidos || "";
        const first = fn.charAt(0).toUpperCase();
        const second = ln.charAt(0).toUpperCase();
        return `${first}${second}` || "CL";
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
            {/* Header superior */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100/60 flex items-center justify-center text-teal-600 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                            Lista de Clientes
                        </h1>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">
                            Gestión de clientes, historial de atención y líneas de crédito
                        </p>
                    </div>
                </div>

                <Link
                    to="/clients/register"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-200 self-start sm:self-auto"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Nuevo Cliente</span>
                </Link>
            </div>

            {/* Tarjeta principal con tabla */}
            <div className="bg-white rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                {/* Barra de Filtros */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                            placeholder="Buscar por nombre, DNI, teléfono, email..."
                            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wider uppercase">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                        <span>{filteredClients.length} CLIENTES ENCONTRADOS</span>
                    </div>
                </div>

                {/* Tabla de Registros */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <svg className="animate-spin h-7 w-7 text-teal-600 mb-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            <span className="text-xs font-medium text-slate-500">Cargando base de clientes...</span>
                        </div>
                    ) : paginatedClients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.5"
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold text-slate-700 mb-1">
                                {searchTerm ? "No se encontraron coincidencias" : "No hay clientes registrados"}
                            </h3>
                            <p className="text-xs text-slate-400 max-w-sm mb-4">
                                {searchTerm
                                    ? `No hay ningún cliente que coincida con "${searchTerm}".`
                                    : "Comienza registrando a tus clientes para asociar recetas, ventas y condiciones de crédito."}
                            </p>
                            {!searchTerm && (
                                <Link
                                    to="/clients/register"
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                                >
                                    + Registrar Primer Cliente
                                </Link>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/40">
                                    <th className="py-3.5 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        CLIENTE
                                    </th>
                                    <th className="py-3.5 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        CONTACTO
                                    </th>

                                    <th className="py-3.5 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        CRÉDITO / SALDO
                                    </th>
                                    <th className="py-3.5 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                        ESTADO
                                    </th>
                                    <th className="py-3.5 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                                        ACCIONES
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
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

                                    return (
                                        <tr key={clientId} className="hover:bg-slate-50/60 transition-colors">
                                            {/* CLIENTE / PACIENTE */}
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">

                                                    <div>
                                                        <span className="font-bold text-slate-800 text-sm block">
                                                            {fullName}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {doc ? (
                                                                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                                    Dni: {doc}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 italic">
                                                                    Sin documento
                                                                </span>
                                                            )}
                                                            {(c.healthInsurance || c.obraSocial) && (
                                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/60">
                                                                    {c.healthInsurance || c.obraSocial}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* CONTACTO */}
                                            <td className="py-3.5 px-5">
                                                <div className="space-y-0.5">
                                                    {(c.phone || c.telefono) && (
                                                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                            <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                                />
                                                            </svg>
                                                            <span>{c.phone || c.telefono}</span>
                                                        </div>
                                                    )}
                                                    {c.email && (
                                                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                                            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                                />
                                                            </svg>
                                                            <span className="truncate max-w-[170px]">{c.email}</span>
                                                        </div>
                                                    )}
                                                    {!(c.phone || c.telefono) && !c.email && (
                                                        <span className="italic text-slate-400 font-normal">Sin contacto</span>
                                                    )}
                                                </div>
                                                {c.address || c.direccion ? (
                                                    <div className="flex items-start gap-1.5 text-slate-600 max-w-[200px]">
                                                        <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                            />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="line-clamp-2">{c.address || c.direccion}</span>
                                                    </div>
                                                ) : (
                                                    <span className="italic text-slate-400 font-normal">Sin dirección</span>
                                                )}
                                            </td>



                                            {/* CRÉDITO / SALDO */}
                                            <td className="py-3.5 px-5">
                                                <div className="space-y-0.5">
                                                    <div className="text-slate-700 font-semibold">
                                                        Límite: <span className="font-bold">S/ {limit.toFixed(2)}</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Saldo:{" "}
                                                        <span className={balance > 0 ? "font-bold text-rose-600" : "font-medium text-emerald-600"}>
                                                            S/ {balance.toFixed(2)}
                                                        </span>
                                                        {(c.creditDays || c.diasCredito) > 0 && (
                                                            <span className="text-slate-400 ml-1">
                                                                • {c.creditDays || c.diasCredito} días
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* ESTADO */}
                                            <td className="py-3.5 px-5 text-center">
                                                {isClientActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                                        ACTIVO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                        INACTIVO
                                                    </span>
                                                )}
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="py-3.5 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/clients/edit/${clientId}`)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                                                        title="Editar cliente"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(c)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Eliminar cliente"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
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

                {/* Paginación */}
                {!isLoading && filteredClients.length > 0 && (
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <span>Mostrar:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>por página</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((page) => {
                                    if (totalPages <= 5) return true;
                                    return (
                                        page === 1 ||
                                        page === totalPages ||
                                        Math.abs(page - currentPage) <= 1
                                    );
                                })
                                .map((page, index, array) => {
                                    const prev = array[index - 1];
                                    const showEllipsis = prev && page - prev > 1;

                                    return (
                                        <div key={page} className="flex items-center gap-1">
                                            {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${currentPage === page
                                                    ? "bg-teal-700 text-white shadow-sm"
                                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        </div>
                                    );
                                })}

                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
