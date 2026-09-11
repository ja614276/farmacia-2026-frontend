import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { findAllAdjustments, deleteAdjustment } from "../services/InventoryAdjustmentService";
import { StockAdjustmentModal } from "../components/StockAdjustmentModal";

export const InventoryAdjustmentsPage = () => {
    const navigate = useNavigate();
    const [adjustments, setAdjustments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("TODOS"); // "TODOS" | "ENTRADA" | "SALIDA"
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Paginación
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const loadAdjustments = async () => {
        try {
            setIsLoading(true);
            const res = await findAllAdjustments();
            setAdjustments(res.data || []);
        } catch (error) {
            console.error("Error al cargar ajustes de inventario:", error);
            Swal.fire("Error", "No se pudo cargar el historial de ajustes de inventario.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAdjustments();
    }, []);

    // Filtrar ajustes por búsqueda y tipo de movimiento
    const filteredAdjustments = useMemo(() => {
        return adjustments.filter((adj) => {
            // Filtro por tipo
            if (filterType !== "TODOS" && adj.tipoAjuste !== filterType) {
                return false;
            }
            // Filtro por búsqueda
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const prod = (adj.productoNombre || "").toLowerCase();
            const lot = (adj.nroLote || "").toLowerCase();
            const mot = (adj.motivo || "").toLowerCase();
            const emp = (adj.empleadoNombre || "").toLowerCase();
            return prod.includes(term) || lot.includes(term) || mot.includes(term) || emp.includes(term);
        });
    }, [adjustments, filterType, searchTerm]);

    // Paginación de resultados
    const totalPages = Math.ceil(filteredAdjustments.length / pageSize) || 1;
    const paginatedAdjustments = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAdjustments.slice(start, start + pageSize);
    }, [filteredAdjustments, currentPage, pageSize]);

    // Resetear a página 1 al cambiar filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, pageSize]);

    // Eliminar / Revertir ajuste de inventario
    const handleDeleteAdjustment = async (adjustment) => {
        const confirmResult = await Swal.fire({
            title: "¿Anular este Ajuste?",
            text: `Se anulará el ajuste de ${adjustment.tipoAjuste} por ${adjustment.cantidad} unidades del producto ${adjustment.productoNombre || ""}. El stock se revertirá en el lote.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#475569",
            confirmButtonText: "Sí, Anular Ajuste",
            cancelButtonText: "Cancelar",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            await deleteAdjustment(adjustment.idAjuste);
            await Swal.fire({
                title: "Ajuste Anulado",
                text: "El movimiento ha sido cancelado y el stock fue restaurado.",
                icon: "success",
                timer: 1800,
                showConfirmButton: false,
            });
            loadAdjustments();
        } catch (error) {
            console.error("Error al anular ajuste:", error);
            const msg = error.response?.data?.message || "No se pudo anular el ajuste.";
            Swal.fire("Error", typeof msg === "string" ? msg : "Error al procesar", "error");
        }
    };

    // Formatear fecha legible (Ej: "18/07/2026, 12:04 a. m.")
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "---";
        try {
            const cleanStr = dateStr.replace(" ", "T");
            const d = new Date(cleanStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6 max-w-[1500px] mx-auto pb-10">
            
            {/* CABECERA (Fiel a Imagen 1) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                        <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                            Ajustes de
                        </span>
                        <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                            Inventarios
                        </span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                        Control manual de stock, traslados entre locales y mermas por lote.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>+ Nuevo</span>
                    </button>
                </div>
            </div>

            {/* BARRA DE BÚSQUEDA Y FILTROS */}
            <div className="bg-[#0e1626] border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                {/* Buscador */}
                <div className="relative w-full md:w-96">
                    <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por producto, lote o motivo..."
                        className="w-full pl-10 pr-4 py-2 bg-[#142036] border border-slate-700/70 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                </div>

                {/* Tabs de Filtro: Todos, Entrada, Salida */}
                <div className="flex items-center gap-1.5 self-start md:self-auto bg-[#142036] p-1 rounded-xl border border-slate-700/60 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setFilterType("TODOS")}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                            filterType === "TODOS"
                                ? "bg-teal-500 text-slate-950 font-black shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Todos ({adjustments.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType("ENTRADA")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            filterType === "ENTRADA"
                                ? "bg-teal-500 text-slate-950 font-black shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Entradas</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType("SALIDA")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            filterType === "SALIDA"
                                ? "bg-rose-500 text-white font-black shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Salidas</span>
                    </button>
                </div>
            </div>

            {/* TABLA PRINCIPAL (Calco fiel de Imagen 1 y Imagen 3) */}
            <div className="bg-[#0e1626] border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800/80 bg-[#121c30]/90 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                <th className="py-4 px-5">FECHA</th>
                                <th className="py-4 px-5">TIPO_AJUSTE</th>
                                <th className="py-4 px-5 text-center">CANTIDAD</th>
                                <th className="py-4 px-5">MOTIVO</th>
                                <th className="py-4 px-5">PRODUCTO</th>
                                <th className="py-4 px-5">LOTE</th>
                                <th className="py-4 px-5">EMPLEADO</th>
                                <th className="py-4 px-5 text-center">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg className="animate-spin h-7 w-7 text-teal-400" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span className="text-xs font-semibold">Cargando registros de inventario...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedAdjustments.length === 0 ? (
                                /* ESTADO VACÍO (Fiel a Imagen 1) */
                                <tr>
                                    <td colSpan="8" className="py-16 text-center text-slate-400 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-[#142036] border border-slate-800 flex items-center justify-center text-slate-500">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                            </div>
                                            <span className="text-slate-400 text-xs">
                                                {searchTerm ? "No se encontraron registros con ese criterio." : "No hay registros para mostrar"}
                                            </span>
                                            {!searchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModalOpen(true)}
                                                    className="px-4 py-2 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 font-bold text-xs rounded-xl transition-all"
                                                >
                                                    Registrar Primer Ajuste
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                /* FILAS CON REGISTROS (Fiel a Imagen 3) */
                                paginatedAdjustments.map((adj) => {
                                    const isEntrada = adj.tipoAjuste === "ENTRADA";

                                    return (
                                        <tr key={adj.idAjuste} className="hover:bg-slate-800/40 transition-colors">
                                            {/* FECHA */}
                                            <td className="py-4 px-5 text-slate-300 font-semibold whitespace-nowrap">
                                                {formatDateTime(adj.fecha)}
                                            </td>

                                            {/* TIPO_AJUSTE */}
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    isEntrada
                                                        ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                                                        : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isEntrada ? "bg-teal-400" : "bg-rose-400"}`} />
                                                    {adj.tipoAjuste}
                                                </span>
                                            </td>

                                            {/* CANTIDAD */}
                                            <td className="py-4 px-5 text-center">
                                                <span className="text-sm font-black text-white">
                                                    {adj.cantidad}
                                                </span>
                                            </td>

                                            {/* MOTIVO */}
                                            <td className="py-4 px-5 text-slate-300 font-medium max-w-xs truncate" title={adj.motivo}>
                                                {adj.motivo || "---"}
                                            </td>

                                            {/* PRODUCTO */}
                                            <td className="py-4 px-5">
                                                <span className="font-black text-slate-100 uppercase block text-xs">
                                                    {adj.productoNombre || "Producto"}
                                                </span>
                                                {adj.productoCodigo && (
                                                    <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                                                        Cód: {adj.productoCodigo}
                                                    </span>
                                                )}
                                            </td>

                                            {/* LOTE */}
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <span className="font-mono font-bold text-teal-400 text-xs px-2.5 py-1 bg-[#142036] rounded-lg border border-slate-800">
                                                    {adj.nroLote || "S/N"}
                                                </span>
                                            </td>

                                            {/* EMPLEADO */}
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <span className="text-slate-300 font-semibold">
                                                    {adj.empleadoNombre || "Admin"}
                                                </span>
                                            </td>

                                            {/* ACCIONES (Botón papelera roja de Imagen 3) */}
                                            <td className="py-4 px-5 text-center whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAdjustment(adj)}
                                                    title="Anular y revertir stock"
                                                    className="w-8 h-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 inline-flex items-center justify-center transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PIE DE TABLA Y PAGINACIÓN (Fiel a Imagen 3) */}
                {filteredAdjustments.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-800/80 bg-[#121c30]/90 text-xs text-slate-400">
                        {/* Selector de Registros por página */}
                        <div className="flex items-center gap-2">
                            <span>Mostrar:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="px-2.5 py-1 bg-[#142036] border border-slate-700 rounded-lg text-slate-200 text-xs font-bold focus:outline-none focus:border-teal-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>por página</span>
                            <span className="text-slate-500 ml-2">
                                (Total: {filteredAdjustments.length} ajustes)
                            </span>
                        </div>

                        {/* Botones de Páginas */}
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="w-8 h-8 rounded-xl bg-[#142036] hover:bg-[#1b2b48] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                                &lt;
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-xl font-bold transition-all ${
                                        currentPage === page
                                            ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/30 font-black"
                                            : "bg-[#142036] hover:bg-[#1b2b48] text-slate-400"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="w-8 h-8 rounded-xl bg-[#142036] hover:bg-[#1b2b48] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DE NUEVO AJUSTE (Imagen 2) */}
            <StockAdjustmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdjustmentSaved={loadAdjustments}
            />

        </div>
    );
};
