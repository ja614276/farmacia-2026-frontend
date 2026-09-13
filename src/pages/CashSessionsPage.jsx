import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
    findAllCashSessions,
    getActiveCashSession
} from "../services/CashSessionService";

export const CashSessionsPage = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth || {});

    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Paginación
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [allRes, activeRes] = await Promise.allSettled([
                findAllCashSessions(),
                getActiveCashSession(),
            ]);

            if (allRes.status === "fulfilled" && allRes.value?.data) {
                setSessions(allRes.value.data);
            }
            if (activeRes.status === "fulfilled") {
                // activeRes.value.data puede ser null o el objeto
                setActiveSession(activeRes.value.data || null);
            }
        } catch (error) {
            console.error("Error al cargar datos de sesiones de caja:", error);
            Swal.fire("Error", "No se pudo cargar la información de turnos de caja.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Formateador de fecha/hora: 18/7/2026, 0:52:28
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "Pendiente...";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}, ${d.toLocaleTimeString("es-PE")}`;
        } catch (e) {
            return dateStr;
        }
    };

    // Paginación
    const totalPages = Math.ceil(sessions.length / pageSize) || 1;
    const paginatedSessions = sessions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const hasActiveSession = Boolean(activeSession && activeSession.id);

    // Valida si el usuario en sesión es el mismo que abrió la caja
    const isSessionOwner = (sessionObj) => {
        if (!sessionObj || !user?.username) return false;
        const currentUsername = user.username.trim().toLowerCase();
        const opener = (sessionObj.openingEmployeeName || "").trim().toLowerCase();
        return opener === currentUsername || opener.includes(currentUsername) || currentUsername.includes(opener);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6">
            {/* 1. Encabezado Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        Gestión de Caja
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>📅</span>
                        <span>Control de turnos y arqueos financieros</span>
                    </p>
                </div>

                <div>
                    {hasActiveSession ? (
                        <button
                            type="button"
                            disabled
                            title="Ya existe una sesión de caja activa. Debe cerrar el turno antes de abrir uno nuevo."
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed shadow-none"
                        >
                            <span>Nueva Apertura</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate("/cash-sessions/open")}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#005f60] hover:bg-[#004e4f] active:bg-[#003e3f] text-white font-bold text-xs rounded-xl shadow-md shadow-teal-900/10 transition-all cursor-pointer"
                        >
                            <span>+ Nueva Apertura</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Tarjeta de Estado (Caja Cerrada vs Sesión en Curso) */}
            {isLoading ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 flex items-center justify-center min-h-[100px] text-slate-400 gap-3">
                    <svg className="animate-spin h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs font-medium">Verificando estado de la caja...</span>
                </div>
            ) : hasActiveSession ? (
                /* ESTADO 1: SESIÓN EN CURSO (Replicando Imagen 3 e Imagen 5) */
                <div className="bg-emerald-50/40 border border-emerald-300/80 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_2px_15px_rgba(16,185,129,0.04)]">
                    <div className="flex items-center gap-4">
                        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                                    SESIÓN EN CURSO
                                </span>
                                <span className="text-xs font-bold text-slate-400 font-mono">
                                    ID: #{activeSession.id}
                                </span>
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                                Caja Abierta por:{" "}
                                <span className="text-emerald-700">
                                    {activeSession.openingEmployeeName || "Admin"}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Iniciada el {formatDateTime(activeSession.openingDate)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-emerald-200/60">
                        <div className="text-left md:text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                MONTO INICIAL
                            </span>
                            <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                                S/ {Number(activeSession.initialAmount || 0).toFixed(2)}
                            </div>
                        </div>

                        {isSessionOwner(activeSession) ? (
                            <button
                                type="button"
                                onClick={() => navigate("/cash-sessions/close")}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 hover:shadow-rose-600/30 transition-all cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                                </svg>
                                <span>Cerrar Turno</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => Swal.fire({
                                    title: "Acceso Restringido",
                                    text: `Esta caja fue abierta por ${activeSession.openingEmployeeName || "otro empleado"}. Cada empleado gestiona su propia labor de caja y solo el responsable puede cerrarla.`,
                                    icon: "warning",
                                    confirmButtonColor: "#005f60"
                                })}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                                title={`Solo ${activeSession.openingEmployeeName} puede cerrar este turno`}
                            >
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Turno de {activeSession.openingEmployeeName || "otro cajero"}</span>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* ESTADO 2: CAJA CERRADA (Replicando Imagen 1) */
                <div className="bg-[#fff9ea] border border-[#fde68a] rounded-2xl p-5 sm:p-6 flex items-center gap-3.5 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold text-lg flex-shrink-0">
                        !
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">
                            Caja Cerrada
                        </h2>
                        <p className="text-xs text-slate-600 mt-0.5">
                            Es necesario realizar una apertura para poder registrar ventas hoy.
                        </p>
                    </div>
                </div>
            )}

            {/* 3. Tarjeta de Historial de Turnos */}
            <div className="bg-white rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-600 text-base">💵</span>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                            Historial de Turnos
                        </h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {sessions.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 text-xs italic">
                            No se han registrado turnos anteriores
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/40">
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        APERTURA / CIERRE
                                    </th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        CAJERO
                                    </th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        MONTO INICIAL
                                    </th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        MONTO FINAL
                                    </th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                        ESTADO
                                    </th>
                                    <th className="py-3 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                                        ACCIONES
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedSessions.map((s) => {
                                    const isOpen = s.status === "ABIERTA";
                                    const initial = Number(s.initialAmount || 0);
                                    const final = s.actualFinalAmount !== null && s.actualFinalAmount !== undefined
                                        ? Number(s.actualFinalAmount)
                                        : null;

                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* APERTURA / CIERRE */}
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-teal-600">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    </span>
                                                    <div>
                                                        <span className="font-bold text-slate-800 block text-xs">
                                                            {formatDateTime(s.openingDate)}
                                                        </span>
                                                        {s.closingDate && (
                                                            <span className="text-[11px] text-slate-400 block font-normal mt-0.5">
                                                                Cierre: {formatDateTime(s.closingDate)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* CAJERO */}
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-[#006d77] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                        {(s.openingEmployeeName || "A").charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-slate-800 text-xs">
                                                        {s.openingEmployeeName || "Admin"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* MONTO INICIAL */}
                                            <td className="py-3.5 px-5 font-mono font-bold text-slate-700">
                                                S/ {initial.toFixed(2)}
                                            </td>

                                            {/* MONTO FINAL */}
                                            <td className="py-3.5 px-5 font-mono">
                                                {isOpen ? (
                                                    <span className="text-slate-400 italic">Pendiente...</span>
                                                ) : (
                                                    <span className="font-bold text-slate-800">
                                                        S/ {(final || 0).toFixed(2)}
                                                    </span>
                                                )}
                                            </td>

                                            {/* ESTADO */}
                                            <td className="py-3.5 px-5 text-center">
                                                {isOpen ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white tracking-wider">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                        ABIERTA
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                                        CERRADA
                                                    </span>
                                                )}
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="py-3.5 px-5 text-right">
                                                {isOpen && (
                                                    isSessionOwner(s) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate("/cash-sessions/close")}
                                                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 cursor-pointer"
                                                        >
                                                            Cerrar
                                                        </button>
                                                    ) : (
                                                        <span
                                                            className="text-[11px] text-slate-400 font-medium px-2 py-1 inline-flex items-center gap-1 cursor-help"
                                                            title={`Esta caja fue abierta por ${s.openingEmployeeName || "otro empleado"}. Solo dicho empleado puede cerrarla.`}
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                            </svg>
                                                            <span>Restringido</span>
                                                        </span>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Paginación */}
                {sessions.length > 0 && (
                    <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                        <div className="text-[11px] text-slate-400">
                            Mostrando {paginatedSessions.length} de {sessions.length} turnos registrados
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ‹
                                </button>
                                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-800 text-white font-bold text-xs">
                                    {currentPage}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashSessionsPage;
