import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { saveSupplier, updateSupplier, findSupplierById } from "../services/SupplierService";

const initialFormState = {
    id: null,
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    isActive: true,
};

export const SupplierForm = ({ supplierSelected = null, onSuccess = null }) => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [formState, setFormState] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const { nombre, contacto, telefono, email, direccion, isActive } = formState;

    const isEditMode = Boolean(formState.id || id || supplierSelected?.id);

    useEffect(() => {
        if (supplierSelected && supplierSelected.id) {
            setFormState({
                id: supplierSelected.id,
                nombre: supplierSelected.nombre || "",
                contacto: supplierSelected.contacto || "",
                telefono: supplierSelected.telefono || "",
                email: supplierSelected.email || "",
                direccion: supplierSelected.direccion || "",
                isActive: supplierSelected.isActive !== undefined ? supplierSelected.isActive : true,
            });
        } else if (id) {
            setIsLoadingData(true);
            findSupplierById(id)
                .then((response) => {
                    if (response.data) {
                        setFormState({
                            id: response.data.id,
                            nombre: response.data.nombre || "",
                            contacto: response.data.contacto || "",
                            telefono: response.data.telefono || "",
                            email: response.data.email || "",
                            direccion: response.data.direccion || "",
                            isActive: response.data.isActive !== undefined ? response.data.isActive : true,
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error al cargar proveedor:", error);
                    Swal.fire("Error", "No se pudo cargar la información del proveedor", "error");
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        } else {
            setFormState(initialFormState);
        }
    }, [supplierSelected, id]);

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
                text: "El nombre o razón social del proveedor es obligatorio.",
                icon: "warning",
                confirmButtonColor: "#0f766e",
            });
            return;
        }

        const targetId = formState.id || id;

        try {
            setIsSubmitting(true);

            if (targetId) {
                await updateSupplier(targetId, formState);
                Swal.fire({
                    title: "¡Actualizado!",
                    text: "Proveedor actualizado correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await saveSupplier(formState);
                Swal.fire({
                    title: "¡Guardado!",
                    text: "Proveedor registrado con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate("/suppliers");
            }
        } catch (error) {
            console.error("Error al persistir proveedor:", error);
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
                    <span>Cargando datos del proveedor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Cabecera del formulario */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shadow-sm flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 3.75v10.5" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                            {isEditMode ? "Editar Proveedor" : "Nuevo Proveedor"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {isEditMode 
                                ? "Modifica los datos del socio comercial o distribuidora" 
                                : "Registra un nuevo socio de suministros farmacéuticos"}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/suppliers")}
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
                    {/* Campo: Distribuidora / Razón Social */}
                    <div className="md:col-span-2">
                        <label 
                            htmlFor="supplier-nombre"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Distribuidora / Razón Social <span className="text-rose-500 font-bold ml-0.5">*</span>
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
                                </svg>
                            </span>
                            <input
                                id="supplier-nombre"
                                type="text"
                                name="nombre"
                                value={nombre}
                                onChange={onInputChange}
                                placeholder="Ej. Distribuidora Farmacéutica del Norte S.A.C."
                                autoFocus
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Persona de Contacto */}
                    <div>
                        <label 
                            htmlFor="supplier-contacto"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Persona de Contacto
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </span>
                            <input
                                id="supplier-contacto"
                                type="text"
                                name="contacto"
                                value={contacto}
                                onChange={onInputChange}
                                placeholder="Ej. Juan Pérez (Representante)"
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Teléfono */}
                    <div>
                        <label 
                            htmlFor="supplier-telefono"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Teléfono de Enlace
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                            </span>
                            <input
                                id="supplier-telefono"
                                type="text"
                                name="telefono"
                                value={telefono}
                                onChange={onInputChange}
                                placeholder="Ej. +51 987 654 321"
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Correo Electrónico */}
                    <div>
                        <label 
                            htmlFor="supplier-email"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Correo Electrónico
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </span>
                            <input
                                id="supplier-email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={onInputChange}
                                placeholder="contacto@distribuidora.com"
                                disabled={isSubmitting}
                                className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* Campo: Ubicación Principal / Dirección */}
                    <div>
                        <label 
                            htmlFor="supplier-direccion"
                            className="block text-sm font-semibold text-slate-700 mb-2"
                        >
                            Ubicación Principal (Dirección)
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                            </span>
                            <input
                                id="supplier-direccion"
                                type="text"
                                name="direccion"
                                value={direccion}
                                onChange={onInputChange}
                                placeholder="Ej. Av. Los Laureles 450, Almacén Central"
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
                                Proveedor Activo para compras y suministros
                            </span>
                        </label>
                    </div>
                </div>

                {/* Acciones del formulario */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigate("/suppliers")}
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
                                <span>{isEditMode ? "Actualizar Proveedor" : "Guardar Proveedor"}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

SupplierForm.propTypes = {
    supplierSelected: PropTypes.object,
    onSuccess: PropTypes.func,
};
