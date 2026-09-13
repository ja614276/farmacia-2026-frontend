import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
    findAllCashMovements,
    saveCashMovement,
    updateCashMovement,
    deleteCashMovement,
} from "../services/CashMovementService";
import { getActiveCashSession } from "../services/CashSessionService";

export const CashMovementsPage = () => {
    const { user } = useSelector((state) => state.auth || {});

    const [movements, setMovements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSession, setActiveSession] = useState(null);

    // Filtros y paginación
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL"); // "ALL", "INGRESO", "EGRESO"
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal Crear / Editar
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMovement, setEditingMovement] = useState(null);

    const getNowFormatted = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        tipo: "INGRESO",
        monto: "",
        concepto: "",
        fechaHora: getNowFormatted(),
        usuario: user?.username || "Admin Sistema",
    });

    // Cargar sesión activa
    useEffect(() => {
        getActiveCashSession()
            .then((res) => setActiveSession(res.data || null))
            .catch(() => setActiveSession(null));
    }, []);

    // Cargar movimientos
    const loadMovements = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await findAllCashMovements();
            setMovements(res.data || []);
        } catch (error) {
            console.error("Error al cargar movimientos:", error);
            Swal.fire("Error", "No se pudieron obtener los movimientos de caja.", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMovements();
    }, [loadMovements]);

    // Resumen financiero KPI calculado en tiempo real
    const metrics = useMemo(() => {
        let totalIngresos = 0;
        let countIngresos = 0;
        let totalEgresos = 0;
        let countEgresos = 0;

        movements.forEach((m) => {
            const val = Number(m.monto || 0);
            const isIngreso = (m.tipo || "").toUpperCase().includes("INGRESO");
            if (isIngreso) {
                totalIngresos += val;
                countIngresos++;
            } else {
                totalEgresos += val;
                countEgresos++;
            }
        });

        const balanceNeto = totalIngresos - totalEgresos;

        return {
            totalIngresos,
            countIngresos,
            totalEgresos,
            countEgresos,
            balanceNeto,
            totalMovimientos: movements.length,
        };
    }, [movements]);

    // Filtrar movimientos por texto y por tipo (Tabs)
    const filteredMovements = useMemo(() => {
        return movements.filter((m) => {
            const isIngreso = (m.tipo || "").toUpperCase().includes("INGRESO");

            // Filtro por tipo
            if (typeFilter === "INGRESO" && !isIngreso) return false;
            if (typeFilter === "EGRESO" && isIngreso) return false;

            // Filtro por término de búsqueda
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase();
            return (
                (m.concepto || "").toLowerCase().includes(q) ||
                (m.tipo || "").toLowerCase().includes(q) ||
                (m.usuario || "").toLowerCase().includes(q) ||
                String(m.monto || "").includes(q)
            );
        });
    }, [movements, searchTerm, typeFilter]);

    // Paginación
    const totalPages = Math.ceil(filteredMovements.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRecords = filteredMovements.slice(startIndex, startIndex + itemsPerPage);

    // Modal Handlers
    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingMovement(item);
            let formattedDate = getNowFormatted();
            if (item.fechaHora) {
                try {
                    formattedDate = item.fechaHora.slice(0, 16);
                } catch {
                    formattedDate = getNowFormatted();
                }
            }
            setFormData({
                tipo: (item.tipo || "INGRESO").toUpperCase(),
                monto: item.monto !== undefined && item.monto !== null ? item.monto : "",
                concepto: item.concepto || "",
                fechaHora: formattedDate,
                usuario: item.usuario || user?.username || "Admin Sistema",
            });
        } else {
            setEditingMovement(null);
            setFormData({
                tipo: "INGRESO",
                monto: "",
                concepto: "",
                fechaHora: getNowFormatted(),
                usuario: user?.username || "Admin Sistema",
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMovement(null);
    };

    // Guardar / Actualizar
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.concepto.trim()) {
            Swal.fire("Atención", "El concepto o motivo es obligatorio.", "warning");
            return;
        }
        if (!formData.monto || Number(formData.monto) <= 0) {
            Swal.fire("Atención", "Ingrese un monto mayor a 0.", "warning");
            return;
        }

        try {
            setIsSubmitting(true);
            const targetId = editingMovement?.id;

            const payload = {
                ...formData,
                monto: Number(formData.monto),
                sessionId: activeSession ? activeSession.id : (editingMovement?.sessionId || null),
            };

            if (editingMovement && targetId) {
                await updateCashMovement(targetId, payload);
                Swal.fire({
                    title: "¡Actualizado!",
                    text: "Movimiento de caja actualizado correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await saveCashMovement(payload);
                Swal.fire({
                    title: "¡Registrado!",
                    text: "Movimiento de caja registrado exitosamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            handleCloseModal();
            await loadMovements();
        } catch (error) {
            console.error("Error al guardar movimiento:", error);
            const msg = error.response?.data?.message || "No se pudo registrar el movimiento.";
            Swal.fire("Error", msg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Eliminar con confirmación
    const handleDelete = async (item) => {
        const isIngreso = (item.tipo || "").toUpperCase().includes("INGRESO");
        const result = await Swal.fire({
            title: "¿Eliminar movimiento de caja?",
            html: `
                <div style="font-size: 13px; color: #475569; text-align: left; margin-top: 8px;">
                    <p><b>Concepto:</b> ${item.concepto}</p>
                    <p><b>Tipo:</b> <span style="color: ${isIngreso ? '#10b981' : '#f43f5e'}; font-weight: bold;">${item.tipo}</span></p>
                    <p><b>Monto:</b> S/ ${Number(item.monto || 0).toFixed(2)}</p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e11d48",
            cancelButtonColor: "#94a3b8",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            try {
                await deleteCashMovement(item.id);
                setMovements((prev) => prev.filter((m) => m.id !== item.id));
                Swal.fire({
                    title: "¡Eliminado!",
                    text: "El movimiento ha sido eliminado exitosamente.",
                    icon: "success",
                    timer: 1400,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error("Error al eliminar movimiento:", error);
                Swal.fire("Error", "No se pudo eliminar el movimiento de caja.", "error");
            }
        }
    };

    // Formatear fecha y hora amigable
    const formatDateDisplay = (dateString) => {
        if (!dateString) return "-";
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* 1. Encabezado Superior con Branding y Acciones */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-teal-50 text-[#005f60] font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-teal-200/60">
                            Caja y Finanzas
                        </span>
                        {activeSession ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Turno #{activeSession.id} en curso ({activeSession.openingEmployeeName || "Cajero"})
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Sin Turno Activo
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span>Movimientos de Caja</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Control y registro detallado de ingresos y egresos extraordinarios de efectivo.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {/* Botón Refrescar */}
                    <button
                        type="button"
                        onClick={loadMovements}
                        disabled={isLoading}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer hover:shadow-sm"
                        title="Actualizar movimientos"
                    >
                        <svg
                            className={`w-4 h-4 ${isLoading ? "animate-spin text-teal-600" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>

                    {/* Botón Nuevo Movimiento */}
                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#005f60] hover:bg-[#004e4f] active:bg-[#003e3f] text-white font-bold text-xs shadow-md shadow-teal-900/10 hover:shadow-teal-900/20 transition-all cursor-pointer tracking-wider uppercase"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Nuevo Movimiento</span>
                    </button>
                </div>
            </div>

            {/* 2. Tarjetas KPI Métricas Financieras */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* KPI 1: Ingresos de Caja */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Ingresos de Efectivo
                        </span>
                        <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight mt-1">
                            + S/ {metrics.totalIngresos.toFixed(2)}
                        </div>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            {metrics.countIngresos} transacciones
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>

                {/* KPI 2: Egresos de Caja */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Egresos de Efectivo
                        </span>
                        <div className="text-2xl font-black text-rose-600 font-mono tracking-tight mt-1">
                            - S/ {metrics.totalEgresos.toFixed(2)}
                        </div>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            {metrics.countEgresos} transacciones
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </div>
                </div>

                {/* KPI 3: Flujo Neto */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Balance Neto
                        </span>
                        <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${metrics.balanceNeto >= 0 ? "text-slate-800" : "text-rose-600"}`}>
                            {metrics.balanceNeto >= 0 ? "+" : ""} S/ {metrics.balanceNeto.toFixed(2)}
                        </div>
                        <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${metrics.balanceNeto >= 0
                                ? "bg-teal-50 text-teal-800 border-teal-100"
                                : "bg-rose-50 text-rose-700 border-rose-100"
                            }`}>
                            Flujo Neto de Caja
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-[#005f60] flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                    </div>
                </div>

            </div>

            {/* 3. Barra de Búsqueda y Filtros Rápidos */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Buscador */}
                <div className="relative w-full md:w-96 flex items-center">
                    <span className="absolute left-3 text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por concepto, usuario, monto..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005f60]/20 focus:border-[#005f60] transition-all"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Filtro por tipo (Pills interactivos) */}
                <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <button
                        type="button"
                        onClick={() => { setTypeFilter("ALL"); setCurrentPage(1); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${typeFilter === "ALL"
                                ? "bg-slate-800 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        <span>Todos</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${typeFilter === "ALL" ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"
                            }`}>
                            {movements.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setTypeFilter("INGRESO"); setCurrentPage(1); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${typeFilter === "INGRESO"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100"
                            }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>Ingresos</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${typeFilter === "INGRESO" ? "bg-emerald-700 text-emerald-100" : "bg-emerald-200/60 text-emerald-800"
                            }`}>
                            {metrics.countIngresos}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setTypeFilter("EGRESO"); setCurrentPage(1); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${typeFilter === "EGRESO"
                                ? "bg-rose-600 text-white shadow-sm"
                                : "bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100"
                            }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        <span>Egresos</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${typeFilter === "EGRESO" ? "bg-rose-700 text-rose-100" : "bg-rose-200/60 text-rose-800"
                            }`}>
                            {metrics.countEgresos}
                        </span>
                    </button>
                </div>
            </div>

            {/* 4. Tabla de Movimientos de Caja */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                        <svg className="animate-spin h-6 w-6 text-[#005f60]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-xs font-semibold text-slate-500">Cargando movimientos de caja...</span>
                    </div>
                ) : currentRecords.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <rect width="20" height="14" x="2" y="5" rx="2" />
                                <line x1="2" x2="22" y1="10" y2="10" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">No hay movimientos para mostrar</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            {searchTerm
                                ? `No se encontraron resultados para "${searchTerm}". Intente con otro término.`
                                : "Aún no se han registrado ingresos o egresos de efectivo en esta caja."}
                        </p>
                        {!searchTerm && (
                            <button
                                type="button"
                                onClick={() => handleOpenModal()}
                                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-50 text-[#005f60] hover:bg-teal-100 font-bold text-xs rounded-xl border border-teal-200 transition-colors"
                            >
                                <span>Registrar primer movimiento</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">FECHA / HORA</th>
                                    <th className="py-3.5 px-5 text-center">TIPO</th>
                                    <th className="py-3.5 px-5">CONCEPTO / MOTIVO</th>
                                    <th className="py-3.5 px-5 text-right">MONTO</th>
                                    <th className="py-3.5 px-5 text-center">RESPONSABLE</th>
                                    <th className="py-3.5 px-5 text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentRecords.map((m) => {
                                    const isIngreso = (m.tipo || "").toUpperCase().includes("INGRESO");
                                    return (
                                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">

                                            {/* FECHA / HORA */}
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
                                                        </svg>
                                                    </span>
                                                    <span className="text-slate-700 font-medium">
                                                        {formatDateDisplay(m.fechaHora)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* TIPO: Badges Modernos */}
                                            <td className="py-3.5 px-5 text-center">
                                                {isIngreso ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                                                        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
                                                        </svg>
                                                        <span>Ingreso</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
                                                        <svg className="w-3 h-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7" />
                                                        </svg>
                                                        <span>Egreso</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* CONCEPTO */}
                                            <td className="py-3.5 px-5">
                                                <div className="font-semibold text-slate-800 text-xs">
                                                    {m.concepto}
                                                </div>
                                                {m.sessionId && (
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        Sesión ID #{m.sessionId}
                                                    </div>
                                                )}
                                            </td>

                                            {/* MONTO */}
                                            <td className="py-3.5 px-5 text-right font-black font-mono text-xs">
                                                {isIngreso ? (
                                                    <span className="text-emerald-700 bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-200/60 inline-block">
                                                        + S/ {Number(m.monto || 0).toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-700 bg-rose-50/70 px-2.5 py-1 rounded-lg border border-rose-200/60 inline-block">
                                                        - S/ {Number(m.monto || 0).toFixed(2)}
                                                    </span>
                                                )}
                                            </td>

                                            {/* RESPONSABLE / CAJERO */}
                                            <td className="py-3.5 px-5 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] font-bold uppercase">
                                                        {(m.usuario || "U")[0]}
                                                    </span>
                                                    <span>{m.usuario || "Admin"}</span>
                                                </div>
                                            </td>

                                            {/* ACCIONES (Editar y Eliminar) */}
                                            <td className="py-3.5 px-5 text-right">
                                                <div className="inline-flex items-center justify-end gap-1.5">
                                                    {/* Editar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenModal(m)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/70 transition-colors"
                                                        title="Editar movimiento"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                    </button>

                                                    {/* Eliminar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(m)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/70 transition-colors"
                                                        title="Eliminar movimiento"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
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

                {/* 5. Footer y Paginación */}
                <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>Mostrar:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none text-xs shadow-xs"
                        >
                            <option value={5}>5 por pág.</option>
                            <option value={10}>10 por pág.</option>
                            <option value={20}>20 por pág.</option>
                            <option value={50}>50 por pág.</option>
                        </select>
                        <span className="text-slate-400 font-medium">
                            (Total: {filteredMovements.length} {filteredMovements.length === 1 ? "registro" : "registros"})
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold shadow-xs"
                        >
                            &lt;
                        </button>
                        <span className="px-3 py-1 rounded-xl bg-[#005f60] text-white font-bold text-xs shadow-xs">
                            Pág. {currentPage} de {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold shadow-xs"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* 6. MODAL NUEVO / EDITAR MOVIMIENTO DE CAJA (Diseño Elegante y Limpio) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">

                        {/* Cabecera del Modal */}
                        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 text-[#005f60] flex items-center justify-center flex-shrink-0 shadow-xs">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <rect width="20" height="14" x="2" y="5" rx="2" />
                                        <line x1="2" x2="22" y1="10" y2="10" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-slate-800 tracking-tight">
                                        {editingMovement ? "Editar Movimiento de Caja" : "Nuevo Movimiento de Caja"}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Registro financiero manual para arqueo y control de caja
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Formulario del Modal */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            {/* Selector Visual de Tipo (Botones Segmentados) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">
                                    TIPO DE OPERACIÓN <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: "INGRESO" })}
                                        className={`py-3 px-4 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${formData.tipo === "INGRESO"
                                                ? "bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-400/20 shadow-xs"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full ${formData.tipo === "INGRESO" ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                                        <span>↓ Ingreso de Efectivo</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: "EGRESO" })}
                                        className={`py-3 px-4 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${formData.tipo === "EGRESO"
                                                ? "bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-400/20 shadow-xs"
                                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                            }`}
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full ${formData.tipo === "EGRESO" ? "bg-rose-500" : "bg-slate-300"}`}></span>
                                        <span>↑ Egreso de Efectivo</span>
                                    </button>
                                </div>
                            </div>

                            {/* Monto de la operación */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                    MONTO DE OPERACIÓN <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-400">
                                        S/
                                    </span>
                                    <input
                                        type="number"
                                        step="0.10"
                                        min="0.10"
                                        required
                                        placeholder="0.00"
                                        value={formData.monto}
                                        onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005f60]/20 focus:border-[#005f60] transition-all"
                                    />
                                </div>
                            </div>

                            {/* Concepto / Motivo */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                    CONCEPTO / MOTIVO <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-2.5 text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Pago de flete, compra de insumos, fondo de cambio..."
                                        value={formData.concepto}
                                        onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005f60]/20 focus:border-[#005f60] transition-all"
                                    />
                                </div>
                            </div>

                            {/* Fecha y Responsable */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                        FECHA Y HORA
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.fechaHora}
                                        onChange={(e) => setFormData({ ...formData, fechaHora: e.target.value })}
                                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005f60]/20 focus:border-[#005f60] transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                        RESPONSABLE
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={formData.usuario}
                                        className="w-full px-3.5 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 rounded-xl bg-[#005f60] hover:bg-[#004e4f] active:bg-[#003e3f] text-white font-bold text-xs shadow-md shadow-teal-900/15 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>{editingMovement ? "Actualizar Movimiento" : "Registrar Movimiento"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
