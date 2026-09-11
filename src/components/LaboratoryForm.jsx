import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { saveLaboratory, updateLaboratory, findLaboratoryById } from "../services/LaboratoryService";

const initialFormState = {
    id: null,
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    isActive: true,
};

export const LaboratoryForm = ({ laboratorySelected = null, onSuccess = null }) => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [formState, setFormState] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const { nombre, telefono, email, direccion, isActive } = formState;

    const isEditMode = Boolean(formState.id || id || laboratorySelected?.id);

    useEffect(() => {
        if (laboratorySelected && laboratorySelected.id) {
            setFormState({
                id: laboratorySelected.id,
                nombre: laboratorySelected.nombre || "",
                telefono: laboratorySelected.telefono || "",
                email: laboratorySelected.email || "",
                direccion: laboratorySelected.direccion || "",
                isActive: laboratorySelected.isActive !== undefined ? laboratorySelected.isActive : true,
            });
        } else if (id) {
            setIsLoadingData(true);
            findLaboratoryById(id)
                .then((response) => {
                    if (response.data) {
                        setFormState({
                            id: response.data.id,
                            nombre: response.data.nombre || "",
                            telefono: response.data.telefono || "",
                            email: response.data.email || "",
                            direccion: response.data.direccion || "",
                            isActive: response.data.isActive !== undefined ? response.data.isActive : true,
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error al cargar laboratorio:", error);
                    Swal.fire("Error", "No se pudo cargar la información del laboratorio", "error");
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        } else {
            setFormState(initialFormState);
        }
    }, [laboratorySelected, id]);

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
                text: "El nombre o fabricante del laboratorio es obligatorio.",
                icon: "warning",
                confirmButtonColor: "#0f766e",
            });
            return;
        }

        const targetId = formState.id || id;

        try {
            setIsSubmitting(true);

            if (targetId) {
                await updateLaboratory(targetId, formState);
                Swal.fire({
                    title: "¡Actualizado!",
                    text: "Laboratorio actualizado correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await saveLaboratory(formState);
                Swal.fire({
                    title: "¡Guardado!",
                    text: "Laboratorio registrado con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate("/laboratories");
            }
        } catch (error) {
            console.error("Error al persistir laboratorio:", error);
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
                    <span>Cargando datos del laboratorio...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Cabecera */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 2v6.292a1 1 0 01-.293.708l-5.414 5.414A4 4 0 007.121 21h9.758a4 4 0 002.828-6.586l-5.414-5.414A1 1 0 0114 8.292V2M8 2h8M6.5 15h11" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                            {isEditMode ? "Editar Laboratorio" : "Registrar Laboratorio"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {isEditMode 
                                ? "Actualiza la información del fabricante farmacéutico" 
                                : "Añade un nuevo fabricante o laboratorio a tu catálogo"}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/laboratories")}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Campo: Nombre del Laboratorio */}
                    <div className="md:col-span-2">
                        <label 
                            htmlFor="lab-nombre"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Nombre del Laboratorio / Fabricante <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </span>
                            <input
                                id="lab-nombre"
                                type="text"
                                name="nombre"
                                value={nombre}
                                onChange={onInputChange}
                                placeholder="Ej. Laboratorios Genfar S.A., Portugal, Bagó..."
                                autoFocus
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Teléfono */}
                    <div>
                        <label 
                            htmlFor="lab-telefono"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Teléfono de Contacto
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                            </span>
                            <input
                                id="lab-telefono"
                                type="text"
                                name="telefono"
                                value={telefono}
                                onChange={onInputChange}
                                placeholder="Ej. (01) 456-7890 / +51 987 654 321"
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Correo Electrónico */}
                    <div>
                        <label 
                            htmlFor="lab-email"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Correo Corporativo
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </span>
                            <input
                                id="lab-email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={onInputChange}
                                placeholder="ventas@laboratorio.com"
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Dirección Fiscal */}
                    <div className="md:col-span-2">
                        <label 
                            htmlFor="lab-direccion"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Dirección Fiscal
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                            </span>
                            <input
                                id="lab-direccion"
                                type="text"
                                name="direccion"
                                value={direccion}
                                onChange={onInputChange}
                                placeholder="Ej. Calle Los Industriales 120, San Isidro, Lima"
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Estado Activo */}
                    <div className="md:col-span-2 pt-2">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={isActive}
                                onChange={onInputChange}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Laboratorio Activo en catálogo de medicamentos
                            </span>
                        </label>
                    </div>
                </div>

                {/* Acciones del formulario */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigate("/laboratories")}
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
                                <span>{isEditMode ? "Actualizar Laboratorio" : "Guardar Laboratorio"}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

LaboratoryForm.propTypes = {
    laboratorySelected: PropTypes.object,
    onSuccess: PropTypes.func,
};
