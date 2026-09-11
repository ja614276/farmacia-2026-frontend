import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getCollectionsStats, getDebtorsRanking } from "../services/ClientPaymentService";
import { getActiveCashSession } from "../services/CashSessionService";

export const CollectionsPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPendingPortfolio: 0,
        debtorsCount: 0,
        recoveredToday: 0,
        recentPayments: [],
    });
    const [debtors, setDebtors] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [isCashOpen, setIsCashOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [statsRes, debtorsRes, cashRes] = await Promise.all([
                getCollectionsStats(),
                getDebtorsRanking(),
                getActiveCashSession().catch(() => ({ data: null })),
            ]);
            setStats(statsRes.data || {
                totalPendingPortfolio: 0,
                debtorsCount: 0,
                recoveredToday: 0,
                recentPayments: [],
            });
            setDebtors(debtorsRes.data || []);
            const session = cashRes?.data;
            setActiveSession(session || null);
            setIsCashOpen(Boolean(session && session.status === "ABIERTA"));
        } catch (error) {
            console.error("Error al cargar cobranzas:", error);
            Swal.fire("Error", "No se pudo obtener la información de cobranzas", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleNavigateToRegister = (clientId = null) => {
        if (!isCashOpen) {
            Swal.fire({
                title: "Caja Cerrada",
                text: "Solo si la caja está abierta se puede acceder a cobrar, ya que se necesita un empleado activo para registrar ventas y cobros.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Abrir Caja",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#4f46e5",
                cancelButtonColor: "#64748b",
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate("/cash-sessions/open");
                }
            });
            return;
        }

        if (clientId) {
            navigate(`/collections/register?clientId=${clientId}`);
        } else {
            navigate("/collections/register");
        }
    };

    // Filtro de búsqueda en el Ranking de Deudores
    const filteredDebtors = debtors.filter((d) => {
        const query = searchTerm.toLowerCase();
        const name = (d.fullName || `${d.firstName || ""} ${d.lastName || ""}`).toLowerCase();
        const doc = (d.identification || "").toLowerCase();
        return name.includes(query) || doc.includes(query);
    });

    // Helper para iniciales del cliente
    const getInitials = (name) => {
        if (!name) return "CL";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
            {/* Header del Panel de Cobranzas */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        Panel de Cobranzas
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Gestión de créditos, saldos y recuperación de cartera.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isCashOpen && activeSession ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold text-emerald-900">Caja #{activeSession.id} Abierta</span>
                            <span className="text-emerald-700 font-medium hidden sm:inline">
                                • Resp: <strong className="font-semibold text-emerald-950">{activeSession.openingEmployeeName || `ID ${activeSession.openingEmployeeId}`}</strong>
                            </span>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="font-bold text-rose-900">Caja Cerrada</span>
                            <button
                                type="button"
                                onClick={() => navigate("/cash-sessions/open")}
                                className="underline font-bold text-rose-700 hover:text-rose-900 ml-1"
                            >
                                Abrir
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => handleNavigateToRegister()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nuevo Pago / Abono</span>
                    </button>
                </div>
            </div>

            {/* Tarjetas KPI Superiores (Imagen 1) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Cartera Total Pendiente */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Cartera Total Pendiente
                        </span>
                        <div className="text-2xl font-black text-[#4338ca]">
                            S/ {(stats.totalPendingPortfolio || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                            Total adeudado por clientes
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4f46e5] flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>

                {/* Clientes con Deuda */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Clientes con Deuda
                        </span>
                        <div className="text-2xl font-black text-rose-500">
                            {stats.debtorsCount || 0}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                            Usuarios con saldo mayor a S/ 0
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>

                {/* Recuperado Hoy */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Recuperado Hoy
                        </span>
                        <div className="text-2xl font-black text-emerald-600">
                            S/ {(stats.recoveredToday || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                            Abonos registrados hoy
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Grid Principal: Ranking de Deudores (8 Cols) vs Lateral (4 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLUMNA IZQUIERDA: Ranking de Deudores (8 Cols) */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                    {/* Header de la sección y barra de búsqueda */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h2 className="text-sm font-extrabold text-slate-800">
                                Ranking de Deudores
                            </h2>
                        </div>

                        {/* Input Buscador */}
                        <div className="relative w-full sm:w-64">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                    <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>

                    {/* Tabla de Deudores */}
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <svg className="animate-spin h-6 w-6 text-[#4f46e5] mb-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-xs font-medium">Cargando deudores...</span>
                            </div>
                        ) : filteredDebtors.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xs font-bold text-slate-700">Sin cartera vencida</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {searchTerm ? "No hay clientes que coincidan con la búsqueda." : "Todos los clientes están al día con sus pagos."}
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="py-3 px-4">CLIENTE</th>
                                        <th className="py-3 px-4">SALDO ACTUAL</th>
                                        <th className="py-3 px-4">CRÉDITO</th>
                                        <th className="py-3 px-4 text-right">ACCIÓN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {filteredDebtors.map((debtor) => {
                                        const initials = getInitials(debtor.fullName || debtor.firstName);
                                        const usedPct = Number(debtor.usedPercentage || 0);

                                        return (
                                            <tr key={debtor.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* CLIENTE */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4f46e5] font-black text-xs flex items-center justify-center flex-shrink-0">
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <span className="font-extrabold text-slate-800 block text-xs">
                                                                {debtor.fullName || `${debtor.firstName || ""} ${debtor.lastName || ""}`}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">
                                                                DÍAS DE CRÉDITO: {debtor.creditDays || 30}D
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* SALDO ACTUAL */}
                                                <td className="py-3 px-4">
                                                    <span className="font-black text-slate-800 text-xs">
                                                        S/ {(debtor.currentBalance || 0).toFixed(2)}
                                                    </span>
                                                </td>

                                                {/* CRÉDITO */}
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            usedPct >= 80
                                                                ? "bg-rose-100 text-rose-800"
                                                                : usedPct >= 50
                                                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                                                : "bg-emerald-100 text-emerald-800"
                                                        }`}>
                                                            {usedPct.toFixed(0)}% usado
                                                        </span>
                                                        <div className="text-[10px] text-slate-400 mt-1 font-medium">
                                                            Límite: S/ {(debtor.creditLimit || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* ACCIÓN */}
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNavigateToRegister(debtor.id)}
                                                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] font-bold text-xs rounded-xl transition-all shadow-sm hover:shadow"
                                                    >
                                                        Gestionar Pago
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA (4 Cols): Últimos Abonos + Consejo de Cartera */}
                <div className="lg:col-span-4 space-y-5">
                    
                    {/* Últimos Abonos (Imagen 1) */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                                </svg>
                                <h3 className="text-xs font-bold text-slate-700">
                                    Últimos Abonos
                                </h3>
                            </div>
                        </div>

                        {(!stats.recentPayments || stats.recentPayments.length === 0) ? (
                            <div className="py-12 text-center text-xs text-slate-400 italic">
                                Sin pagos recientes.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.recentPayments.slice(0, 5).map((pay) => (
                                    <div key={pay.id} className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                                        <div className="min-w-0 pr-2">
                                            <span className="font-bold text-slate-800 text-xs block truncate">
                                                {pay.clientName || "Cliente"}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block truncate">
                                                {pay.paymentDate ? pay.paymentDate.slice(0, 16).replace("T", " ") : "Reciente"} • {pay.paymentMethodName || "EFECTIVO"}
                                            </span>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="font-black text-emerald-600 text-xs block">
                                                + S/ {Number(pay.amount || 0).toFixed(2)}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-400 block">
                                                {pay.series}-{pay.receiptNumber}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2 text-center border-t border-slate-100">
                            <Link
                                to="/sales"
                                className="text-xs font-bold text-[#4f46e5] hover:text-[#4338ca] transition-colors"
                            >
                                Ver historial completo
                            </Link>
                        </div>
                    </div>

                    {/* Consejo de Cartera (Imagen 1) */}
                    <div className="bg-gradient-to-br from-[#4f46e5] to-[#3730a3] text-white p-5 rounded-2xl shadow-sm">
                        <h4 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Consejo de Cartera
                        </h4>
                        <p className="text-xs text-indigo-100 leading-relaxed">
                            Realiza un seguimiento a los clientes que superen el 80% de su límite de crédito para evitar riesgos de impago.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
