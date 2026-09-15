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
                text: "El nombre o denominación del área de almacenamiento es obligatorio.",
                icon: "warning",
                confirmButtonColor: "#09090b",
            });
            return;
        }

        const targetId = formState.id || id;

        try {
            setIsSubmitting(true);

            if (targetId) {
                await updateLocation(targetId, formState);
                await Swal.fire({
                    title: "¡Actualizada!",
                    text: "Ubicación actualizada correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await saveLocation(formState);
                await Swal.fire({
                    title: "¡Registrada!",
                    text: "Ubicación creada con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            if (onSuccess) onSuccess();
            else navigate("/locations");
        } catch (error) {
            console.error("Error al persistir ubicación:", error);
            const msg = error.response?.data?.message || "Ocurrió un error al guardar la ubicación.";
            Swal.fire("Error", msg, "error");
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
                    <span>Cargando datos de la ubicación...</span>
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
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/locations")}>Ubicaciones</span>
                        <span>/</span>
                        <span className="text-zinc-950 font-bold">{isEditMode ? "Editar" : "Nueva"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                                {isEditMode ? "Editar Ubicación" : "Registrar Nueva Ubicación"}
                            </h1>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Definición de áreas, vitrinas, anaqueles y estantes para inventario.
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Nombre del Área */}
                    <div className="md:col-span-3 space-y-1.5">
                        <label 
                            htmlFor="location-nombre"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Nombre o Código del Área Principal *
                        </label>
                        <input
                            id="location-nombre"
                            type="text"
                            name="nombre"
                            value={nombre}
                            onChange={onInputChange}
                            placeholder="EJ. ESTANTERÍA CENTRAL A, VITRINA REFRIGERADA, ALMACÉN 2"
                            autoFocus
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-semibold uppercase text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Pasillo */}
                    <div className="space-y-1.5">
                        <label 
                            htmlFor="location-pasillo"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Pasillo
                        </label>
                        <input
                            id="location-pasillo"
                            type="text"
                            name="pasillo"
                            value={pasillo}
                            onChange={onInputChange}
                            placeholder="EJ. P-01"
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-mono font-bold uppercase text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Estante */}
                    <div className="space-y-1.5">
                        <label 
                            htmlFor="location-estante"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Estante / Módulo
                        </label>
                        <input
                            id="location-estante"
                            type="text"
                            name="estante"
                            value={estante}
                            onChange={onInputChange}
                            placeholder="EJ. E-03"
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-mono font-bold uppercase text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Nivel */}
                    <div className="space-y-1.5">
                        <label 
                            htmlFor="location-nivel"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Nivel / Baldosa
                        </label>
                        <input
                            id="location-nivel"
                            type="text"
                            name="nivel"
                            value={nivel}
                            onChange={onInputChange}
                            placeholder="EJ. NIVEL 2"
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-mono font-bold uppercase text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="md:col-span-3 space-y-1.5">
                        <label 
                            htmlFor="location-descripcion"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Notas de Almacenamiento / Observaciones
                        </label>
                        <input
                            id="location-descripcion"
                            type="text"
                            name="descripcion"
                            value={descripcion}
                            onChange={onInputChange}
                            placeholder="EJ. MANTENER CADENA DE FRÍO (2°C A 8°C), ZONA DE ALTA ROTACIÓN"
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Checkbox Activo */}
                    <div className="md:col-span-3 pt-1">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={isActive}
                                onChange={onInputChange}
                                className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 border-zinc-300"
                            />
                            <span className="text-xs font-semibold text-zinc-800">
                                Ubicación Activa y habilitada para asignación de productos
                            </span>
                        </label>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-100">
                    <button
                        type="button"
                        onClick={() => navigate("/locations")}
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
                            <span>{isEditMode ? "Actualizar Ubicación" : "Guardar Ubicación"}</span>
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

export default LocationForm;
