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
                <div style="font-size: 13px; color: #3f3f46; text-align: left; margin-top: 8px; font-family: monospace;">
                    <p><b>Concepto:</b> ${item.concepto}</p>
                    <p><b>Tipo:</b> <span style="font-weight: bold;">${item.tipo}</span></p>
                    <p><b>Monto:</b> S/ ${Number(item.monto || 0).toFixed(2)}</p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
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
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-zinc-900 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                            CAJA Y FINANZAS
                        </span>
                        {activeSession ? (
                            <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-900 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-zinc-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900"></span>
                                TURNO #{activeSession.id} EN CURSO ({activeSession.openingEmployeeName || "Cajero"})
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-500 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-zinc-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                SIN TURNO ACTIVO
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                        <span>Movimientos de Caja</span>
                    </h1>
                    <p className="text-xs text-zinc-500 font-mono mt-1">
                        Control y registro auditado de ingresos y egresos extraordinarios de efectivo.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {/* Botón Refrescar */}
                    <button
                        type="button"
                        onClick={loadMovements}
                        disabled={isLoading}
                        className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 transition-all cursor-pointer hover:shadow-sm"
                        title="Actualizar movimientos"
                    >
                        <svg
                            className={`w-4 h-4 ${isLoading ? "animate-spin text-zinc-900" : ""}`}
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
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-bold text-xs shadow transition-all cursor-pointer tracking-wider uppercase font-mono"
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
                <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                            [+] Ingresos de Efectivo
                        </span>
                        <div className="text-2xl font-bold text-zinc-900 font-mono tracking-tight mt-1">
                            S/ {metrics.totalIngresos.toFixed(2)}
                        </div>
                        <span className="inline-block mt-1 text-[10px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                            {metrics.countIngresos} transacciones
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>

                {/* KPI 2: Egresos de Caja */}
                <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                            [-] Egresos de Efectivo
                        </span>
                        <div className="text-2xl font-bold text-zinc-900 font-mono tracking-tight mt-1">
                            S/ {metrics.totalEgresos.toFixed(2)}
                        </div>
                        <span className="inline-block mt-1 text-[10px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                            {metrics.countEgresos} transacciones
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </div>
                </div>

                {/* KPI 3: Flujo Neto */}
                <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm relative overflow-hidden flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                            [=] Balance Neto
                        </span>
                        <div className="text-2xl font-bold text-zinc-900 font-mono tracking-tight mt-1">
                            {metrics.balanceNeto >= 0 ? "+" : ""} S/ {metrics.balanceNeto.toFixed(2)}
                        </div>
                        <span className="inline-block mt-1 text-[10px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                            Flujo Neto en Gaveta
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                    </div>
                </div>

            </div>

            {/* 3. Barra de Búsqueda y Filtros Rápidos */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Buscador */}
                <div className="relative w-full md:w-96 flex items-center">
                    <span className="absolute left-3 text-zinc-400">
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
                        className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-all font-sans"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Filtro por tipo (Pills interactivos) */}
                <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 font-mono">
                    <button
                        type="button"
                        onClick={() => { setTypeFilter("ALL"); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${typeFilter === "ALL"
                                ? "bg-[#09090b] text-white shadow-sm"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                    >
                        <span>Todos</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${typeFilter === "ALL" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
                            }`}>
                            {movements.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setTypeFilter("INGRESO"); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${typeFilter === "INGRESO"
                                ? "bg-[#09090b] text-white shadow-sm"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200"
                            }`}
                    >
                        <span>+ Ingresos</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${typeFilter === "INGRESO" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
                            }`}>
                            {metrics.countIngresos}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setTypeFilter("EGRESO"); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${typeFilter === "EGRESO"
                                ? "bg-[#09090b] text-white shadow-sm"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200"
                            }`}
                    >
                        <span>- Egresos</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${typeFilter === "EGRESO" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
                            }`}>
                            {metrics.countEgresos}
                        </span>
                    </button>
                </div>
            </div>

            {/* 4. Tabla de Movimientos de Caja */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                        <svg className="animate-spin h-6 w-6 text-zinc-900" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Cargando movimientos de caja...</span>
                    </div>
                ) : currentRecords.length === 0 ? (
                    <div className="py-20 text-center text-zinc-400">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <rect width="20" height="14" x="2" y="5" rx="2" />
                                <line x1="2" x2="22" y1="10" y2="10" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900">No hay movimientos para mostrar</h3>
                        <p className="text-xs text-zinc-500 font-mono mt-1 max-w-sm mx-auto">
                            {searchTerm
                                ? `No se encontraron resultados para "${searchTerm}". Intente con otro término.`
                                : "Aún no se han registrado ingresos o egresos de efectivo en esta caja."}
                        </p>
                        {!searchTerm && (
                            <button
                                type="button"
                                onClick={() => handleOpenModal()}
                                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold text-xs rounded-xl transition-colors"
                            >
                                <span>Registrar primer movimiento</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-100/70 text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-wider">
                                    <th className="py-3 px-5">FECHA / HORA</th>
                                    <th className="py-3 px-5 text-center">TIPO</th>
                                    <th className="py-3 px-5">CONCEPTO / MOTIVO</th>
                                    <th className="py-3 px-5 text-right">MONTO</th>
                                    <th className="py-3 px-5 text-center">RESPONSABLE</th>
                                    <th className="py-3 px-5 text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {currentRecords.map((m) => {
                                    const isIngreso = (m.tipo || "").toUpperCase().includes("INGRESO");
                                    return (
                                        <tr key={m.id} className="hover:bg-zinc-50/80 transition-colors">

                                             {/* FECHA / HORA */}
                                             <td className="py-3 px-5">
                                                 <div className="flex items-center gap-2">
                                                     <span className="text-zinc-400">
                                                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                             <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
                                                         </svg>
                                                     </span>
                                                     <span className="text-zinc-800 font-mono text-xs">
                                                         {formatDateDisplay(m.fechaHora)}
                                                     </span>
                                                 </div>
                                             </td>

                                             {/* TIPO: Badges Monocromáticos */}
                                             <td className="py-3 px-5 text-center">
                                                 {isIngreso ? (
                                                     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-white uppercase">
                                                         + Ingreso
                                                     </span>
                                                 ) : (
                                                     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-800 border border-zinc-300 uppercase">
                                                         - Egreso
                                                     </span>
                                                 )}
                                             </td>

                                             {/* CONCEPTO */}
                                             <td className="py-3 px-5">
                                                 <div className="font-semibold text-zinc-900 text-xs">
                                                     {m.concepto}
                                                 </div>
                                                 {m.sessionId && (
                                                     <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                                                         Sesión ID #{m.sessionId}
                                                     </div>
                                                 )}
                                             </td>

                                             {/* MONTO */}
                                             <td className="py-3 px-5 text-right font-bold font-mono text-xs text-zinc-900">
                                                 {isIngreso ? "+" : "-"} S/ {Number(m.monto || 0).toFixed(2)}
                                             </td>

                                             {/* RESPONSABLE / CAJERO */}
                                             <td className="py-3 px-5 text-center">
                                                 <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[10px]">
                                                     <span className="w-3.5 h-3.5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[9px] font-bold uppercase">
                                                         {(m.usuario || "U")[0]}
                                                     </span>
                                                     <span>{m.usuario || "Admin"}</span>
                                                 </div>
                                             </td>

                                             {/* ACCIONES (Editar y Eliminar) */}
                                             <td className="py-3 px-5 text-right">
                                                 <div className="inline-flex items-center justify-end gap-1.5">
                                                     {/* Editar */}
                                                     <button
                                                         type="button"
                                                         onClick={() => handleOpenModal(m)}
                                                         className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition-colors"
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
                                                         className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition-colors"
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
                <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
                    <div className="flex items-center gap-2">
                        <span>Mostrar:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg font-bold text-zinc-800 focus:outline-none text-xs shadow-xs"
                        >
                            <option value={5}>5 por pág.</option>
                            <option value={10}>10 por pág.</option>
                            <option value={20}>20 por pág.</option>
                            <option value={50}>50 por pág.</option>
                        </select>
                        <span className="text-zinc-400">
                            (Total: {filteredMovements.length} {filteredMovements.length === 1 ? "registro" : "registros"})
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold shadow-xs"
                        >
                            &lt;
                        </button>
                        <span className="px-3 py-1 rounded-xl bg-[#09090b] text-white font-bold text-xs shadow-xs">
                            Pág. {currentPage} de {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold shadow-xs"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* 6. MODAL NUEVO / EDITAR MOVIMIENTO DE CAJA */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">

                        {/* Cabecera del Modal */}
                        <div className="p-5 border-b border-zinc-100 flex items-start justify-between gap-3 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs font-mono font-bold">
                                    S/
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-zinc-900 tracking-tight">
                                        {editingMovement ? "Editar Movimiento de Caja" : "Nuevo Movimiento de Caja"}
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                        Registro financiero para arqueo y control de gaveta
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center text-sm font-bold transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Formulario del Modal */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            {/* Selector Visual de Tipo (Botones Segmentados) */}
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-600 mb-2 uppercase">
                                    TIPO DE OPERACIÓN <span className="text-zinc-400">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3 font-mono">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: "INGRESO" })}
                                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${formData.tipo === "INGRESO"
                                                ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                                                : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                                            }`}
                                    >
                                        <span>+ Ingreso de Efectivo</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: "EGRESO" })}
                                        className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${formData.tipo === "EGRESO"
                                                ? "bg-zinc-900 border-zinc-900 text-white shadow-xs"
                                                : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                                            }`}
                                    >
                                        <span>- Egreso de Efectivo</span>
                                    </button>
                                </div>
                            </div>

                            {/* Monto de la operación */}
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-600 mb-1.5 uppercase">
                                    MONTO DE OPERACIÓN <span className="text-zinc-400">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-2.5 text-xs font-bold font-mono text-zinc-400">
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
                                        className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-xl font-bold font-mono text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Concepto / Motivo */}
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-600 mb-1.5 uppercase">
                                    CONCEPTO / MOTIVO <span className="text-zinc-400">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-2.5 text-zinc-400">
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
                                        className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 transition-all font-sans"
                                    />
                                </div>
                            </div>

                            {/* Fecha y Responsable */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-mono font-bold text-zinc-600 mb-1.5 uppercase">
                                        FECHA Y HORA
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.fechaHora}
                                        onChange={(e) => setFormData({ ...formData, fechaHora: e.target.value })}
                                        className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl font-mono text-zinc-800 focus:bg-white focus:outline-none focus:border-zinc-900 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono font-bold text-zinc-600 mb-1.5 uppercase">
                                        RESPONSABLE
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={formData.usuario}
                                        className="w-full px-3.5 py-2 text-xs bg-zinc-100 border border-zinc-200 rounded-xl font-mono font-semibold text-zinc-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-medium text-xs transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-semibold text-xs shadow transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer font-mono"
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
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
