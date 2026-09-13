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
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
            {/* Cabecera Superior estilo Calco Imagen */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-1.5">
                        <span className="text-[#005f60]">Condiciones</span>
                        <span className="text-[#e27d60]">de Pago</span>
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#005f60] hover:bg-[#004e4f] text-white font-bold text-xs shadow-sm transition-all self-start sm:self-auto uppercase tracking-wider"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Nueva Condicion de Pago</span>
                </button>
            </div>

            {/* Barra de Filtro / Búsqueda */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-4 flex items-center gap-3">
                <span className="text-slate-400 pl-2">
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
                    className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
                />
            </div>

            {/* Tabla de Condiciones de Pago (Calco exacto de la Imagen del usuario) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-teal-700 text-xs font-bold gap-3">
                        <svg className="animate-spin h-5 w-5 text-[#005f60]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Cargando condiciones de pago...</span>
                    </div>
                ) : currentRecords.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <p className="text-slate-400 text-xs font-semibold">No se encontraron condiciones de pago registradas.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-3.5 px-6">NOMBRE</th>
                                    <th className="py-3.5 px-6 text-center">DIAS</th>
                                    <th className="py-3.5 px-6 text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentRecords.map((cond) => {
                                    const itemId = cond.idCondicion || cond.id;
                                    return (
                                        <tr key={itemId || cond.nombre} className="hover:bg-slate-50/70 transition-colors">
                                            {/* NOMBRE */}
                                            <td className="py-3.5 px-6 text-slate-700 text-xs font-medium">
                                                {cond.nombre}
                                            </td>

                                            {/* DIAS */}
                                            <td className="py-3.5 px-6 text-center text-slate-700 text-xs font-medium">
                                                {cond.dias}
                                            </td>

                                            {/* ACCIONES (Íconos en cajas de borde celeste y rojo) */}
                                            <td className="py-3.5 px-6 text-right">
                                                <div className="inline-flex items-center justify-end gap-2">
                                                    {/* Editar */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenModal(cond)}
                                                        className="w-7 h-7 flex items-center justify-center rounded border border-sky-400 text-sky-500 hover:bg-sky-50 transition-colors"
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
                                                        className="w-7 h-7 flex items-center justify-center rounded border border-rose-300 text-rose-500 hover:bg-rose-50 transition-colors"
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

                {/* Footer y Paginación idéntica a la Imagen */}
                <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>Mostrar:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md font-bold text-slate-700 focus:outline-none text-xs"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span>por página</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                        >
                            &lt;
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#005f60] text-white font-bold text-xs">
                            {currentPage}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Crear / Editar Condición de Pago */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                                {editingCondition ? "Editar Condición de Pago" : "Nueva Condición de Pago"}
                            </h3>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                    Nombre de la Condición *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Crédito 30 dias, Contado..."
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                    Días de Plazo *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    placeholder="0 para contado, 30, 60..."
                                    value={formData.dias}
                                    onChange={(e) => setFormData({ ...formData, dias: Number(e.target.value) || 0 })}
                                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Coloca 0 para ventas al contado. Los días se usarán para calcular la fecha de vencimiento de la venta.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="condIsActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="rounded border-slate-300 text-[#005f60] focus:ring-[#005f60]"
                                />
                                <label htmlFor="condIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Habilitado para punto de venta (Activo)
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl bg-[#005f60] hover:bg-[#004e4f] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
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
