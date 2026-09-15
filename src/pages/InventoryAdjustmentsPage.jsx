import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
            if (filterType !== "TODOS" && adj.tipoAjuste !== filterType) {
                return false;
            }
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            const prod = (adj.productoNombre || "").toLowerCase();
            const lot = (adj.nroLote || "").toLowerCase();
            const mot = (adj.motivo || "").toLowerCase();
            const emp = (adj.empleadoNombre || "").toLowerCase();
            return prod.includes(term) || lot.includes(term) || mot.includes(term) || emp.includes(term);
        });
    }, [adjustments, filterType, searchTerm]);

    const totalPages = Math.ceil(filteredAdjustments.length / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedAdjustments = filteredAdjustments.slice(startIndex, startIndex + pageSize);

    const startRecord = filteredAdjustments.length === 0 ? 0 : startIndex + 1;
    const endRecord = Math.min(startIndex + pageSize, filteredAdjustments.length);

    // Resetear a página 1 al cambiar filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, pageSize]);

    // Eliminar / Revertir ajuste de inventario
    const handleDeleteAdjustment = async (adjustment) => {
        const confirmResult = await Swal.fire({
            title: "¿Anular este Ajuste?",
            text: `Se anulará el ajuste de ${adjustment.tipoAjuste} por ${adjustment.cantidad} unidades del producto "${adjustment.productoNombre || ""}". El stock será revertido en el lote correspondiente.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
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
        <div className="w-full max-w-[1600px] mx-auto space-y-5 pb-10">
            {/* Header Corporativo Monocromático */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/dashboard")}>Dashboard</span>
                        <span>/</span>
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/products")}>Inventario</span>
                        <span>/</span>
                        <span className="text-zinc-950 font-bold">Ajustes de Stock</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                                Ajustes de Inventario y Mermas
                            </h1>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Auditoría de existencias físicas, traslados internos y justificación de bajas por lote.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Registrar Ajuste</span>
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda y Pestañas de Filtro */}
            <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Buscador */}
                <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" strokeWidth="2" />
                            <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por producto, lote, motivo o responsable..."
                        className="w-full h-10 pl-10 pr-4 bg-zinc-50/60 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-400 hover:text-zinc-900 font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Tabs de Filtro: Todos, Entrada, Salida */}
                <div className="flex items-center gap-1.5 self-start md:self-auto bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs font-bold">
                    <button
                        type="button"
                        onClick={() => setFilterType("TODOS")}
                        className={`px-3 py-1.5 rounded-md transition-all text-xs ${
                            filterType === "TODOS"
                                ? "bg-zinc-900 text-white shadow-xs"
                                : "text-zinc-600 hover:text-zinc-900"
                        }`}
                    >
                        Todos ({adjustments.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType("ENTRADA")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs ${
                            filterType === "ENTRADA"
                                ? "bg-zinc-900 text-white shadow-xs"
                                : "text-zinc-600 hover:text-zinc-900"
                        }`}
                    >
                        <span>Entradas (+)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterType("SALIDA")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs ${
                            filterType === "SALIDA"
                                ? "bg-zinc-900 text-white shadow-xs"
                                : "text-zinc-600 hover:text-zinc-900"
                        }`}
                    >
                        <span>Salidas (-)</span>
                    </button>
                </div>
            </div>

            {/* Tabla Principal */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-zinc-100/80 border-b border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                <th className="py-3 px-4">FECHA Y HORA</th>
                                <th className="py-3 px-4">TIPO MOVIMIENTO</th>
                                <th className="py-3 px-4 text-center">CANTIDAD</th>
                                <th className="py-3 px-4">MOTIVO / JUSTIFICACIÓN</th>
                                <th className="py-3 px-4">MEDICAMENTO</th>
                                <th className="py-3 px-4">LOTE ASIGNADO</th>
                                <th className="py-3 px-4">RESPONSABLE</th>
                                <th className="py-3 px-4 text-center">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/70 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="py-20 text-center text-zinc-600">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg className="animate-spin h-6 w-6 text-zinc-900" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span className="text-xs font-semibold">Cargando registros de auditoría...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedAdjustments.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-16 text-center text-zinc-500">
                                        <div className="max-w-sm mx-auto flex flex-col items-center">
                                            <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <span className="font-bold text-zinc-900 text-sm">Sin movimientos de ajuste</span>
                                            <p className="text-xs text-zinc-400 mt-0.5 mb-3">
                                                {searchTerm ? "No hay registros coincidentes con la búsqueda." : "No se han registrado ajustes manuales de stock."}
                                            </p>
                                            {!searchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModalOpen(true)}
                                                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    + Registrar Primer Ajuste
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedAdjustments.map((adj) => {
                                    const isEntrada = adj.tipoAjuste === "ENTRADA";

                                    return (
                                        <tr key={adj.idAjuste} className="hover:bg-zinc-50/70 transition-colors">
                                            {/* FECHA */}
                                            <td className="py-3.5 px-4 font-mono text-zinc-600 font-medium whitespace-nowrap">
                                                {formatDateTime(adj.fecha)}
                                            </td>

                                            {/* TIPO_AJUSTE */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                                                    isEntrada
                                                        ? "bg-zinc-900 text-white"
                                                        : "bg-zinc-100 text-zinc-900 border border-zinc-300"
                                                }`}>
                                                    {isEntrada ? "+ ENTRADA" : "- SALIDA"}
                                                </span>
                                            </td>

                                            {/* CANTIDAD */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="font-mono font-black text-zinc-950 text-xs">
                                                    {adj.cantidad} UND
                                                </span>
                                            </td>

                                            {/* MOTIVO */}
                                            <td className="py-3.5 px-4 text-zinc-700 max-w-xs truncate" title={adj.motivo}>
                                                {adj.motivo || <span className="text-zinc-400 italic">Sin motivo especificado</span>}
                                            </td>

                                            {/* PRODUCTO */}
                                            <td className="py-3.5 px-4">
                                                <span className="font-bold text-zinc-950 uppercase block text-xs">
                                                    {adj.productoNombre || "Producto"}
                                                </span>
                                                {adj.productoCodigo && (
                                                    <span className="font-mono text-[10px] text-zinc-400 block">
                                                        CÓD: {adj.productoCodigo}
                                                    </span>
                                                )}
                                            </td>

                                            {/* LOTE */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="font-mono font-bold text-xs px-2 py-0.5 bg-zinc-100 border border-zinc-300 text-zinc-900 rounded">
                                                    {adj.nroLote || "S/N"}
                                                </span>
                                            </td>

                                            {/* EMPLEADO */}
                                            <td className="py-3.5 px-4 whitespace-nowrap text-zinc-700 font-medium">
                                                {adj.empleadoNombre || "Admin"}
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAdjustment(adj)}
                                                    title="Anular movimiento y restaurar stock"
                                                    className="p-1.5 text-zinc-400 hover:text-red-700 hover:bg-zinc-100 rounded transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                {/* Footer de Paginación */}
                {!isLoading && filteredAdjustments.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-zinc-200 bg-zinc-50/50 text-xs text-zinc-600">
                        <div>
                            Mostrando <span className="font-bold text-zinc-900">{startRecord}</span> a{" "}
                            <span className="font-bold text-zinc-900">{endRecord}</span> de{" "}
                            <span className="font-bold text-zinc-900">{filteredAdjustments.length}</span> registros
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    className="px-2.5 py-1 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors"
                                >
                                    Anterior
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                                            currentPage === page
                                                ? "bg-zinc-900 text-white"
                                                : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    className="px-2.5 py-1 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Nuevo Ajuste */}
            <StockAdjustmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdjustmentSaved={loadAdjustments}
            />
        </div>
    );
};

export default InventoryAdjustmentsPage;
