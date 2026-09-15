import { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import {
    findAllPaymentConditions,
    savePaymentCondition,
    updatePaymentCondition,
    deletePaymentCondition,
} from "../services/PaymentConditionService";

export const PaymentConditionsPage = () => {
    const [conditions, setConditions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Búsqueda y paginación
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal Crear / Editar
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCondition, setEditingCondition] = useState(null);
    const [formData, setFormData] = useState({
        nombre: "",
        dias: 0,
        isActive: true,
    });

    // Cargar condiciones de pago
    const loadConditions = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await findAllPaymentConditions();
            setConditions(response.data || []);
        } catch (error) {
            console.error("Error al cargar condiciones de pago:", error);
            Swal.fire("Error", "No se pudieron cargar las condiciones de pago.", "error");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConditions();
    }, [loadConditions]);

    // Filtrado
    const filteredConditions = useMemo(() => {
        if (!searchTerm.trim()) return conditions;
        const q = searchTerm.toLowerCase();
        return conditions.filter(
            (c) =>
                (c.nombre || "").toLowerCase().includes(q) ||
                String(c.dias || "").includes(q)
        );
    }, [conditions, searchTerm]);

    // Paginación
    const totalPages = Math.ceil(filteredConditions.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRecords = filteredConditions.slice(startIndex, startIndex + itemsPerPage);

    // Modal Open / Close
    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingCondition(item);
            setFormData({
                nombre: item.nombre || "",
                dias: item.dias !== undefined && item.dias !== null ? item.dias : 0,
                isActive: item.isActive ?? true,
            });
        } else {
            setEditingCondition(null);
            setFormData({
                nombre: "",
                dias: 0,
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCondition(null);
    };

    // Guardar / Actualizar
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim()) {
            Swal.fire("Atención", "El nombre de la condición de pago es obligatorio.", "warning");
            return;
        }

        try {
            setIsSubmitting(true);
            const targetId = editingCondition?.idCondicion || editingCondition?.id;

            if (editingCondition && targetId) {
                await updatePaymentCondition(targetId, formData);
                Swal.fire({
                    title: "¡Actualizado!",
                    text: "Condición de pago actualizada correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await savePaymentCondition(formData);
                Swal.fire({
                    title: "¡Creado!",
                    text: "Condición de pago registrada exitosamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            handleCloseModal();
            await loadConditions();
        } catch (error) {
            console.error("Error al guardar condición de pago:", error);
            const msg = error.response?.data?.message || "No se pudo procesar la solicitud.";
            Swal.fire("Error", msg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Eliminar
    const handleDelete = async (item) => {
        const targetId = item.idCondicion || item.id;
        const result = await Swal.fire({
            title: "¿Eliminar condición de pago?",
            text: `¿Estás seguro de eliminar "${item.nombre}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await deletePaymentCondition(targetId);
                setConditions((prev) => prev.filter((c) => (c.idCondicion || c.id) !== targetId));
                Swal.fire({
                    title: "¡Eliminado!",
                    text: "Condición de pago eliminada.",
                    icon: "success",
                    confirmButtonColor: "#09090b",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error("Error al eliminar:", error);
                Swal.fire("Error", "No se pudo eliminar la condición de pago.", "error");
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Cabecera Superior Corporativa */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-zinc-900 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                          VENTAS & CRÉDITO
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                        Condiciones de Pago
                    </h1>
                    <p className="text-xs text-zinc-500 font-mono mt-1">
                        Configuración de plazos de pago y vencimientos comerciales en ventas.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-bold text-xs shadow transition-all cursor-pointer tracking-wider uppercase font-mono self-start sm:self-auto"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Nueva Condición</span>
                </button>
            </div>

            {/* Barra de Filtro / Búsqueda */}
            <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96 flex items-center">
                    <span className="absolute left-3 text-zinc-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o días de crédito..."
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

                <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono self-end sm:self-auto">
                    <span>Mostrar:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg font-bold text-zinc-800 focus:outline-none text-xs"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* Tabla de Condiciones de Pago */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-zinc-400 text-xs font-mono gap-3">
                        <svg className="animate-spin h-6 w-6 text-zinc-900" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Cargando condiciones de pago...</span>
                    </div>
                ) : currentRecords.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <p className="text-zinc-400 text-xs font-mono">No se encontraron condiciones de pago registradas.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-100/70 text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-wider">
                                    <th className="py-3 px-6">NOMBRE DE LA CONDICIÓN</th>
                                    <th className="py-3 px-6 text-center">DÍAS DE CRÉDITO</th>
                                    <th className="py-3 px-6 text-center">ESTADO</th>
                                    <th className="py-3 px-6 text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {currentRecords.map((cond) => {
                                    const itemId = cond.idCondicion || cond.id;
                                    const isActive = cond.isActive ?? true;
                                    return (
                                        <tr key={itemId || cond.nombre} className="hover:bg-zinc-50/80 transition-colors">
                                            {/* NOMBRE */}
                                            <td className="py-3 px-6 text-zinc-900 text-xs font-bold">
                                                {cond.nombre}
                                            </td>

                                            {/* DIAS */}
                                            <td className="py-3 px-6 text-center text-zinc-900 font-mono text-xs font-bold">
                                                {cond.dias} {cond.dias === 1 ? "día" : "días"}
                                            </td>

                                            {/* ESTADO */}
                                            <td className="py-3 px-6 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                                    isActive ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 border border-zinc-300"
                                                }`}>
                                                    {isActive ? "[ACTIVO]" : "[INACTIVO]"}
                                                </span>
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="py-3 px-6 text-right">
                                                <div className="inline-flex items-center justify-end gap-1.5">
                                                    {/* Editar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenModal(cond)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition-colors"
                                                        title="Editar condición"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                    </button>

                                                    {/* Eliminar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(cond)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition-colors"
                                                        title="Eliminar condición"
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

                {/* Footer y Paginación */}
                <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
                    <span>
                        Mostrando {filteredConditions.length === 0 ? 0 : startIndex + 1} a{" "}
                        {Math.min(startIndex + itemsPerPage, filteredConditions.length)} de{" "}
                        {filteredConditions.length} registros
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                        >
                            &lt;
                        </button>
                        <span className="px-3 py-1 rounded-xl bg-[#09090b] text-white font-bold text-xs">
                            Pág. {currentPage} de {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Crear / Editar Condición de Pago */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-white">
                            <h3 className="font-bold text-sm text-zinc-900 uppercase font-mono tracking-wider">
                                {editingCondition ? "Editar Condición de Pago" : "Nueva Condición de Pago"}
                            </h3>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-600 mb-1.5 uppercase">
                                    Nombre de la Condición <span className="text-zinc-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Crédito 30 dias, Contado..."
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 transition-all font-sans"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-zinc-600 mb-1.5 uppercase">
                                    Días de Plazo <span className="text-zinc-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    placeholder="0 para contado, 30, 60..."
                                    value={formData.dias}
                                    onChange={(e) => setFormData({ ...formData, dias: Number(e.target.value) || 0 })}
                                    className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl font-bold font-mono text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 transition-all"
                                />
                                <p className="text-[10px] font-mono text-zinc-400 mt-1">
                                    0 = venta al contado. Valores mayores calculan automáticamente la fecha de vencimiento.
                                </p>
                            </div>

                            <div className="pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        id="condIsActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                                    />
                                    <span className="text-xs font-mono font-bold text-zinc-800 uppercase">
                                        {formData.isActive ? "[ACTIVO EN PUNTO DE VENTA]" : "[INACTIVO]"}
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100">
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
                                    className="px-5 py-2 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-semibold text-xs shadow transition-all disabled:opacity-50 cursor-pointer font-mono"
                                >
                                    {isSubmitting ? "Guardando..." : (editingCondition ? "Actualizar" : "Guardar")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
