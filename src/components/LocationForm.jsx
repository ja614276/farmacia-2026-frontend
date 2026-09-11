import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { saveLocation, updateLocation, findLocationById } from "../services/LocationService";

const initialFormState = {
    id: null,
    nombre: "",
    descripcion: "",
    pasillo: "",
    estante: "",
    nivel: "",
    isActive: true,
};

export const LocationForm = ({ locationSelected = null, onSuccess = null }) => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [formState, setFormState] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const { nombre, descripcion, pasillo, estante, nivel, isActive } = formState;

    const isEditMode = Boolean(formState.id || id || locationSelected?.id);

    useEffect(() => {
        if (locationSelected && locationSelected.id) {
            setFormState({
                id: locationSelected.id,
                nombre: locationSelected.nombre || "",
                descripcion: locationSelected.descripcion || "",
                pasillo: locationSelected.pasillo || "",
                estante: locationSelected.estante || "",
                nivel: locationSelected.nivel || "",
                isActive: locationSelected.isActive !== undefined ? locationSelected.isActive : true,
            });
        } else if (id) {
            setIsLoadingData(true);
            findLocationById(id)
                .then((response) => {
                    if (response.data) {
                        setFormState({
                            id: response.data.id,
                            nombre: response.data.nombre || "",
                            descripcion: response.data.descripcion || "",
                            pasillo: response.data.pasillo || "",
                            estante: response.data.estante || "",
                            nivel: response.data.nivel || "",
                            isActive: response.data.isActive !== undefined ? response.data.isActive : true,
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error al cargar ubicación:", error);
                    Swal.fire("Error", "No se pudo cargar la información de la ubicación", "error");
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        } else {
            setFormState(initialFormState);
        }
    }, [locationSelected, id]);

    const onInputChange = ({ target }) => {
        const { name, value, type, checked } = target;
        setFormState((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        if (!nombre.trim()) {
            Swal.fire({
                title: "Campo requerido",
                text: "El nombre o código del área de almacenamiento es obligatorio.",
                icon: "warning",
                confirmButtonColor: "#0f766e",
            });
            return;
        }

        const targetId = formState.id || id;

        try {
            setIsSubmitting(true);

            if (targetId) {
                await updateLocation(targetId, formState);
                Swal.fire({
                    title: "¡Actualizada!",
                    text: "Ubicación actualizada correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await saveLocation(formState);
                Swal.fire({
                    title: "¡Guardada!",
                    text: "Ubicación de inventario registrada con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate("/locations");
            }
        } catch (error) {
            console.error("Error al persistir ubicación:", error);
            const errorMsg = error.response?.data?.nombre || error.response?.data?.message || "Ocurrió un error en el servidor.";
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
                    <span>Cargando datos de la ubicación...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Cabecera */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-sm flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                            {isEditMode ? "Editar Ubicación" : "Nueva Ubicación"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {isEditMode 
                                ? "Modifica la nomenclatura o distribución del espacio de inventario" 
                                : "Define un nuevo estante, pasillo o área de almacenaje"}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/locations")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span>Volver</span>
                </button>
            </div>

            {/* Formulario */}
            <form
                onSubmit={onSubmit}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Campo: Ubicación / Área Principal */}
                    <div className="md:col-span-3">
                        <label 
                            htmlFor="location-nombre"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Ubicación / Área Principal <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </span>
                            <input
                                id="location-nombre"
                                type="text"
                                name="nombre"
                                value={nombre}
                                onChange={onInputChange}
                                placeholder="Ej. Estante A1, Almacén Central, Refrigerador 01..."
                                autoFocus
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Pasillo */}
                    <div>
                        <label 
                            htmlFor="location-pasillo"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Pasillo (Opcional)
                        </label>
                        <input
                            id="location-pasillo"
                            type="text"
                            name="pasillo"
                            value={pasillo}
                            onChange={onInputChange}
                            placeholder="Ej. Pasillo 02"
                            disabled={isSubmitting}
                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                        />
                    </div>

                    {/* Campo: Estante */}
                    <div>
                        <label 
                            htmlFor="location-estante"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Estante / Sección (Opcional)
                        </label>
                        <input
                            id="location-estante"
                            type="text"
                            name="estante"
                            value={estante}
                            onChange={onInputChange}
                            placeholder="Ej. Columna B"
                            disabled={isSubmitting}
                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                        />
                    </div>

                    {/* Campo: Nivel */}
                    <div>
                        <label 
                            htmlFor="location-nivel"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Nivel / Altura (Opcional)
                        </label>
                        <input
                            id="location-nivel"
                            type="text"
                            name="nivel"
                            value={nivel}
                            onChange={onInputChange}
                            placeholder="Ej. Nivel 3 (Superior)"
                            disabled={isSubmitting}
                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                        />
                    </div>

                    {/* Campo: Notas de Almacenamiento / Descripción */}
                    <div className="md:col-span-3">
                        <label 
                            htmlFor="location-descripcion"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Notas de Almacenamiento (Opcional)
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </span>
                            <textarea
                                id="location-descripcion"
                                name="descripcion"
                                rows={3}
                                value={descripcion}
                                onChange={onInputChange}
                                placeholder="Ej. Área con temperatura controlada (15°C a 25°C), exclusiva para antibióticos y analgésicos..."
                                disabled={isSubmitting}
                                className="w-full pt-2.5 pb-2.5 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Estado Activo */}
                    <div className="md:col-span-3 pt-2">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={isActive}
                                onChange={onInputChange}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Zona activa para asignación y almacenamiento de productos
                            </span>
                        </label>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigate("/locations")}
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
                                <span>{isEditMode ? "Actualizar Ubicación" : "Guardar Ubicación"}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

LocationForm.propTypes = {
    locationSelected: PropTypes.object,
    onSuccess: PropTypes.func,
};
