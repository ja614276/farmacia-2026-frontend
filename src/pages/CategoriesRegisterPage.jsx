import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { saveCategory, updateCategory, findCategoryById } from "../services/CategoryService";

const initialCategoryState = {
    nombre: "",
    descripcion: "",
};

export const CategoriesRegisterPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [categoryForm, setCategoryForm] = useState(initialCategoryState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(Boolean(id));

    const { nombre, descripcion } = categoryForm;

    useEffect(() => {
        if (id) {
            setIsLoadingData(true);
            findCategoryById(id)
                .then((response) => {
                    if (response.data) {
                        setCategoryForm({
                            nombre: response.data.nombre || response.data.name || "",
                            descripcion: response.data.descripcion || "",
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error al cargar categoría:", error);
                    Swal.fire("Error", "No se pudo cargar la información de la categoría", "error");
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        }
    }, [id]);

    const onInputChange = ({ target }) => {
        const { name, value } = target;
        setCategoryForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        if (!nombre.trim()) {
            Swal.fire({
                title: "Campo requerido",
                text: "Por favor ingresa el nombre de la categoría.",
                icon: "warning",
                confirmButtonColor: "#0f766e",
            });
            return;
        }

        try {
            setIsSubmitting(true);

            if (id) {
                await updateCategory(id, categoryForm);
                Swal.fire({
                    title: "¡Actualizada!",
                    text: "Categoría actualizada con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await saveCategory(categoryForm);
                Swal.fire({
                    title: "¡Creada!",
                    text: "Nueva categoría guardada con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            navigate("/categories");
        } catch (error) {
            console.error("Error al guardar categoría:", error);
            const errorMsg = error.response?.data?.nombre || error.response?.data?.message || "Ocurrió un error al persistir la categoría.";
            Swal.fire("Error", errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="flex items-center gap-3 text-teal-700 font-medium text-sm">
                    <svg className="animate-spin h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Cargando datos de la categoría...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
            {/* Cabecera / Header superior */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                    {/* Badge con ícono + */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl border border-teal-100/70 shadow-sm flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                            {id ? "Editar Categoría" : "Nueva Categoría"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Organiza tus productos por grupos lógicos
                        </p>
                    </div>
                </div>

                {/* Botón Volver */}
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span>Volver</span>
                </button>
            </div>

            {/* Contenedor de la Tarjeta del Formulario */}
            <form 
                onSubmit={onSubmit}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Campo: Nombre de la Categoría */}
                    <div>
                        <label 
                            htmlFor="category-nombre"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Nombre de la Categoría <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <div className="relative flex items-center">
                            {/* Ícono tipográfico 'T' */}
                            <span 
                                className="absolute left-3.5 text-slate-400 font-serif font-bold text-lg select-none pointer-events-none"
                                aria-hidden="true"
                            >
                                T
                            </span>
                            <input
                                id="category-nombre"
                                type="text"
                                name="nombre"
                                value={nombre}
                                onChange={onInputChange}
                                placeholder="Nombre de la categoría..."
                                autoFocus
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Descripción (Opcional) */}
                    <div>
                        <label 
                            htmlFor="category-descripcion"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Descripción (Opcional)
                        </label>
                        <div className="relative flex items-center">
                            {/* Ícono de documento */}
                            <span 
                                className="absolute left-3.5 text-slate-400 select-none pointer-events-none flex items-center"
                                aria-hidden="true"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </span>
                            <input
                                id="category-descripcion"
                                type="text"
                                name="descripcion"
                                value={descripcion}
                                onChange={onInputChange}
                                placeholder="Breve descripción del grupo..."
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>
                </div>

                {/* Botones de acción inferiores */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
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
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                <span>{id ? "Actualizar Categoría" : "Guardar Categoría"}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
