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
        }
    }, [id, supplierSelected]);

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
                text: "Por favor ingresa la denominación o razón social del proveedor.",
                icon: "warning",
                confirmButtonColor: "#09090b",
            });
            return;
        }

        try {
            setIsSubmitting(true);

            if (isEditMode) {
                const targetId = formState.id || id;
                await updateSupplier(targetId, formState);
                await Swal.fire({
                    title: "¡Actualizado!",
                    text: "Proveedor actualizado con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                await saveSupplier(formState);
                await Swal.fire({
                    title: "¡Registrado!",
                    text: "Proveedor registrado con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            if (onSuccess) onSuccess();
            else navigate("/suppliers");
        } catch (error) {
            console.error("Error al persistir proveedor:", error);
            const msg = error.response?.data?.message || "Ocurrió un error al procesar el proveedor.";
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
                    <span>Cargando información del proveedor...</span>
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
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/suppliers")}>Proveedores</span>
                        <span>/</span>
                        <span className="text-zinc-950 font-bold">{isEditMode ? "Editar" : "Nuevo"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v5m4-5v5m4-5v5M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                                {isEditMode ? "Editar Proveedor" : "Registrar Nuevo Proveedor"}
                            </h1>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Datos fiscales y contactos de droguerías o distribuidores farmacéuticos.
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
                    {/* Razón Social */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label 
                            htmlFor="supplier-nombre"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Nombre o Razón Social del Proveedor *
                        </label>
                        <input
                            id="supplier-nombre"
                            type="text"
                            name="nombre"
                            value={nombre}
                            onChange={onInputChange}
                            placeholder="EJ. DROGUERÍA MEDIFARMA S.A.C., QUÍMICA SUIZA"
                            autoFocus
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-semibold uppercase text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Persona de Contacto */}
                    <div className="space-y-1.5">
                        <label 
                            htmlFor="supplier-contacto"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Persona de Contacto / Asesor de Ventas
                        </label>
                        <input
                            id="supplier-contacto"
                            type="text"
                            name="contacto"
                            value={contacto}
                            onChange={onInputChange}
                            placeholder="EJ. LIC. CARLOS MENDOZA"
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-1.5">
                        <label 
                            htmlFor="supplier-telefono"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Teléfono de Contacto
                        </label>
                        <input
                            id="supplier-telefono"
                            type="text"
                            name="telefono"
                            value={telefono}
                            onChange={onInputChange}
                            placeholder="EJ. 01-445-8890 / +51 998877665"
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-mono font-medium text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Correo Electrónico */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label 
                            htmlFor="supplier-email"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Correo Electrónico de Pedidos
                        </label>
                        <input
                            id="supplier-email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={onInputChange}
                            placeholder="pedidos@distribuidora.com"
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-mono font-medium text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Dirección */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label 
                            htmlFor="supplier-direccion"
                            className="block text-xs font-bold text-zinc-800 uppercase tracking-wider"
                        >
                            Dirección Fiscal / Almacén Central
                        </label>
                        <input
                            id="supplier-direccion"
                            type="text"
                            name="direccion"
                            value={direccion}
                            onChange={onInputChange}
                            placeholder="EJ. AV. LOS LAURELES 450, ALMACÉN CENTRAL, LIMA"
                            disabled={isSubmitting}
                            className="w-full h-11 px-3.5 text-xs font-medium uppercase text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs disabled:opacity-60"
                        />
                    </div>

                    {/* Checkbox Activo */}
                    <div className="md:col-span-2 pt-1">
                        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={isActive}
                                onChange={onInputChange}
                                className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950 border-zinc-300"
                            />
                            <span className="text-xs font-semibold text-zinc-800">
                                Proveedor Activo para compras y emisión de comprobantes
                            </span>
                        </label>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-zinc-100">
                    <button
                        type="button"
                        onClick={() => navigate("/suppliers")}
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
                            <span>{isEditMode ? "Actualizar Proveedor" : "Guardar Proveedor"}</span>
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

export default SupplierForm;
