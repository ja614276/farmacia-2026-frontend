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
                confirmButtonColor: "#09090b",
            });
            return;
        }

        try {
            setIsSubmitting(true);

            if (id) {
                await updateCategory(id, categoryForm);
                await Swal.fire({
                    title: "¡Actualizada!",
                    text: "Categoría actualizada con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await saveCategory(categoryForm);
                await Swal.fire({
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
            <div className="w-full min-h-[350px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-zinc-700 font-semibold text-xs">
                    <svg className="animate-spin h-5 w-5 text-zinc-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Cargando datos de la categoría...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/dashboard")}>Dashboard</span>
                        <span>/</span>
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/categories")}>Categorías</span>
                        <span>/</span>
                        <span className="text-zinc-950 font-bold">{id ? "Editar" : "Nueva"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                                {id ? "Editar Categoría" : "Registrar Nueva Categoría"}
                            </h1>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Definición de grupo terapéutico para clasificación de productos.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
                >
                    Volver
                </button>
            </div>

            {/* Tarjeta del Formulario */}
            <form onSubmit={onSubmit} className="bg-white rounded-xl p-6 sm:p-7 border border-zinc-200 shadow-xs space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Campo: Nombre */}
                    <div className="space-y-1.5">
                        <label 
                            htmlFor="category-nombre"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Nombre de la Categoría *
                        </label>
                        <input
                            id="category-nombre"
                            type="text"
                            name="nombre"
                            value={nombre}
                            onChange={onInputChange}
                            placeholder="EJ. ANALGÉSICOS, ANTIBIÓTICOS, DERMATOLOGÍA"
                            autoFocus
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-semibold uppercase text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Campo: Descripción */}
                    <div className="space-y-1.5">
                        <label 
                            htmlFor="category-descripcion"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Descripción (Opcional)
                        </label>
                        <input
                            id="category-descripcion"
                            type="text"
                            name="descripcion"
                            value={descripcion}
                            onChange={onInputChange}
                            placeholder="Breve descripción del grupo terapéutico..."
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-100">
                    <button
                        type="button"
                        onClick={() => navigate("/categories")}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-sm transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <span>GUARDANDO...</span>
                        ) : (
                            <span>{id ? "Actualizar Categoría" : "Guardar Categoría"}</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CategoriesRegisterPage;
