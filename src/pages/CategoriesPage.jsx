import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { findAllCategories, removeCategory } from "../services/CategoryService";

export const CategoriesPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const loadCategories = async () => {
        try {
            setIsLoading(true);
            const response = await findAllCategories();
            setCategories(response.data || []);
        } catch (error) {
            console.error("Error al cargar categorías:", error);
            Swal.fire("Error", "No se pudieron cargar las categorías", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleDelete = async (category) => {
        const result = await Swal.fire({
            title: "¿Eliminar categoría?",
            text: `¿Seguro que deseas eliminar la categoría "${category.nombre || category.name}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await removeCategory(category.id);
                setCategories((prev) => prev.filter((c) => c.id !== category.id));
                Swal.fire({
                    title: "¡Eliminada!",
                    text: "La categoría ha sido eliminada correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error("Error al eliminar categoría:", error);
                Swal.fire("Error", "No se pudo eliminar la categoría.", "error");
            }
        }
    };

    const filteredCategories = categories.filter((c) => {
        const name = (c.nombre || c.name || "").toLowerCase();
        const desc = (c.descripcion || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return name.includes(search) || desc.includes(search);
    });

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Categorías</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Organiza y gestiona las clasificaciones de tus medicamentos y productos
                    </p>
                </div>
                <Link
                    to="/categories/register"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-sm shadow-sm transition-all self-start sm:self-auto"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Nueva Categoría</span>
                </Link>
            </div>

            {/* Barra de búsqueda */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-6">
                <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                    />
                </div>
            </div>

            {/* Tabla de categorías */}
            <div className="bg-white rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-teal-700 text-sm font-medium gap-3">
                        <svg className="animate-spin h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Cargando categorías...</span>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">No se encontraron categorías</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            {searchTerm ? "No hay resultados para tu búsqueda." : "Aún no tienes categorías registradas. Comienza creando una nueva."}
                        </p>
                        {!searchTerm && (
                            <Link
                                to="/categories/register"
                                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-teal-700 hover:text-teal-800"
                            >
                                + Registrar la primera categoría
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-5">ID</th>
                                    <th className="py-3.5 px-5">Nombre</th>
                                    <th className="py-3.5 px-5">Descripción</th>
                                    <th className="py-3.5 px-5">Estado</th>
                                    <th className="py-3.5 px-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCategories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                                            #{cat.id}
                                        </td>
                                        <td className="py-3.5 px-5 font-semibold text-slate-900">
                                            {cat.nombre || cat.name}
                                        </td>
                                        <td className="py-3.5 px-5 text-slate-500 max-w-md truncate">
                                            {cat.descripcion || <span className="italic text-slate-300">Sin descripción</span>}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                cat.isActive !== false
                                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}>
                                                {cat.isActive !== false ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/categories/edit/${cat.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors mr-1"
                                                title="Editar"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(cat)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
