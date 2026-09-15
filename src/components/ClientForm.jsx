import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { saveClient, updateClient, findClientById } from "../services/ClientService";

const initialFormState = {
    id: null,
    firstName: "",
    lastName: "",
    identification: "",
    phone: "",
    email: "",
    address: "",
    healthInsurance: "",
    affiliateNumber: "",
    creditLimit: 0,
    currentBalance: 0,
    creditDays: 0,
    isActive: true,
};

export const ClientForm = ({
    clientSelected = null,
    initialData = null,
    onSuccess = null,
    onSaveSuccess = null,
    onCancel = null,
}) => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [formState, setFormState] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const {
        firstName,
        lastName,
        identification,
        phone,
        email,
        address,
        healthInsurance,
        affiliateNumber,
        creditLimit,
        currentBalance,
        creditDays,
        isActive,
    } = formState;

    const targetClientId =
        id ||
        clientSelected?.id ||
        clientSelected?.idCliente ||
        initialData?.id ||
        initialData?.idCliente;

    const isEditMode = Boolean(targetClientId);

    useEffect(() => {
        const passedData = clientSelected || initialData;
        if (passedData && (passedData.firstName || passedData.nombres || passedData.lastName || passedData.apellidos)) {
            setFormState({
                id: passedData.id || passedData.idCliente || null,
                firstName: passedData.firstName || passedData.nombres || "",
                lastName: passedData.lastName || passedData.apellidos || "",
                identification: passedData.identification || passedData.identificacion || "",
                phone: passedData.phone || passedData.telefono || "",
                email: passedData.email || "",
                address: passedData.address || passedData.direccion || "",
                healthInsurance: passedData.healthInsurance || passedData.obraSocial || "",
                affiliateNumber: passedData.affiliateNumber || passedData.nroAfiliado || "",
                creditLimit: Number(passedData.creditLimit ?? passedData.limiteCredito ?? 0),
                currentBalance: Number(passedData.currentBalance ?? passedData.saldo ?? 0),
                creditDays: Number(passedData.creditDays ?? passedData.diasCredito ?? 0),
                isActive: passedData.isActive !== undefined ? passedData.isActive : true,
            });
        } else if (targetClientId) {
            setIsLoadingData(true);
            findClientById(targetClientId)
                .then((response) => {
                    if (response.data) {
                        const data = response.data;
                        setFormState({
                            id: data.id || data.idCliente,
                            firstName: data.firstName || data.nombres || "",
                            lastName: data.lastName || data.apellidos || "",
                            identification: data.identification || data.identificacion || "",
                            phone: data.phone || data.telefono || "",
                            email: data.email || "",
                            address: data.address || data.direccion || "",
                            healthInsurance: data.healthInsurance || data.obraSocial || "",
                            affiliateNumber: data.affiliateNumber || data.nroAfiliado || "",
                            creditLimit: Number(data.creditLimit ?? data.limiteCredito ?? 0),
                            currentBalance: Number(data.currentBalance ?? data.saldo ?? 0),
                            creditDays: Number(data.creditDays ?? data.diasCredito ?? 0),
                            isActive: data.isActive !== undefined ? data.isActive : true,
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error al cargar cliente:", error);
                    Swal.fire("Error", "No se pudo cargar la información del cliente", "error");
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        } else {
            setFormState(initialFormState);
        }
    }, [clientSelected, initialData, targetClientId]);

    const onInputChange = ({ target }) => {
        const { name, value, type, checked } = target;
        setFormState((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            navigate("/clients");
        }
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        if (!firstName.trim()) {
            Swal.fire({
                title: "Campo requerido",
                text: "El o los nombres del cliente son obligatorios.",
                icon: "warning",
                confirmButtonColor: "#0f766e",
            });
            return;
        }

        if (!lastName.trim()) {
            Swal.fire({
                title: "Campo requerido",
                text: "Los apellidos del cliente son obligatorios.",
                icon: "warning",
                confirmButtonColor: "#0f766e",
            });
            return;
        }

        try {
            setIsSubmitting(true);
            let savedRecord = null;

            if (isEditMode) {
                const response = await updateClient(targetClientId, formState);
                savedRecord = response.data;
                Swal.fire({
                    title: "¡Actualizado!",
                    text: "Cliente actualizado correctamente.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                const response = await saveClient(formState);
                savedRecord = response.data;
                Swal.fire({
                    title: "¡Guardado!",
                    text: "Cliente registrado con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }

            if (onSaveSuccess) {
                onSaveSuccess(savedRecord);
            } else if (onSuccess) {
                onSuccess(savedRecord);
            } else {
                navigate("/clients");
            }
        } catch (error) {
            console.error("Error al persistir cliente:", error);
            const errorMsg =
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Ocurrió un error al procesar los datos del cliente.";
            Swal.fire("Error", errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center min-h-[350px]">
                <div className="flex items-center gap-3 text-teal-700 font-medium text-sm">
                    <svg className="animate-spin h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span>Cargando información del cliente...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="client-form-monochrome max-w-5xl mx-auto px-4 py-5 sm:px-6">
            {/* Header superior */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="w-8 h-8 rounded-md bg-white border border-zinc-300 text-zinc-700 hover:text-black hover:bg-zinc-100 flex items-center justify-center transition-colors shadow-xs"
                        title="Volver al directorio"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <nav aria-label="breadcrumb" className="mb-0.5">
                            <ol className="flex items-center gap-1.5 text-xs text-zinc-500">
                                <li>
                                    <span
                                        className="cursor-pointer text-zinc-800 hover:text-black underline"
                                        onClick={() => navigate("/clients")}
                                    >
                                        Clientes
                                    </span>
                                </li>
                                <li className="text-zinc-400">/</li>
                                <li className="text-zinc-900 font-semibold">{isEditMode ? "Editar" : "Nuevo"}</li>
                            </ol>
                        </nav>
                        <h2 className="text-lg font-bold text-zinc-900 tracking-tight m-0">
                            {isEditMode ? "Editar Registro de Cliente" : "Registrar Nuevo Cliente"}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5 m-0">
                            {isEditMode
                                ? "Actualiza los datos personales, contacto y condiciones crediticias del titular."
                                : "Ingresa los datos personales, fiscales y líneas de crédito asignadas."}
                        </p>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="px-3.5 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-100 shadow-xs transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-black rounded-md shadow-xs transition-colors disabled:opacity-40"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <span>{isEditMode ? "Actualizar Cliente" : "Guardar Cliente"}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Formulario Principal */}
            <form onSubmit={onSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* COLUMNA IZQUIERDA: Datos Personales, Contacto y Seguro (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        {/* Bloque 1: Datos Personales */}
                        <div className="bg-white rounded-md p-4.5 border border-zinc-200 shadow-xs">
                            <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider mb-3.5">
                                <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Datos Personales</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                        Nombre(s) <span className="text-zinc-900">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={firstName}
                                        onChange={onInputChange}
                                        placeholder="Ej: Carlos Alberto"
                                        required
                                        className="w-full px-2.5 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors placeholder:text-zinc-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                        Apellidos <span className="text-zinc-900">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={lastName}
                                        onChange={onInputChange}
                                        placeholder="Ej: Rodríguez Gómez"
                                        required
                                        className="w-full px-2.5 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors placeholder:text-zinc-400"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                        Documento / DNI / RUC
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <rect width="20" height="14" x="2" y="5" rx="2" strokeWidth="2" />
                                                <line x1="2" x2="22" y1="10" y2="10" strokeWidth="2" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            name="identification"
                                            value={identification}
                                            onChange={onInputChange}
                                            placeholder="Ej: 74892314"
                                            className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors placeholder:text-zinc-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bloque 2: Información de Contacto */}
                        <div className="bg-white rounded-md p-4.5 border border-zinc-200 shadow-xs">
                            <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider mb-3.5">
                                <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                                <span>Información de Contacto</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                        Teléfono / Celular
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={phone}
                                        onChange={onInputChange}
                                        placeholder="Ej: +51 987 654 321"
                                        className="w-full px-2.5 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors placeholder:text-zinc-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={onInputChange}
                                        placeholder="cliente@correo.com"
                                        className="w-full px-2.5 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors placeholder:text-zinc-400"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={address}
                                        onChange={onInputChange}
                                        placeholder="Ej: Av. Principal 123, Dpto 4B"
                                        className="w-full px-2.5 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bloque 3: Seguro u Obra Social (Opcional) */}
                        <div className="bg-white rounded-md p-4.5 border border-zinc-200 shadow-xs">
                            <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider mb-3.5">
                                <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                </svg>
                                <span>Seguro Médico / Obra Social (Opcional)</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                        Entidad / Aseguradora
                                    </label>
                                    <input
                                        type="text"
                                        name="healthInsurance"
                                        value={healthInsurance}
                                        onChange={onInputChange}
                                        placeholder="Ej: EsSalud, Rimac, Pacífico"
                                        className="w-full px-2.5 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors placeholder:text-zinc-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                        N° Afiliado / Carnet
                                    </label>
                                    <input
                                        type="text"
                                        name="affiliateNumber"
                                        value={affiliateNumber}
                                        onChange={onInputChange}
                                        placeholder="Ej: POL-882310"
                                        className="w-full px-2.5 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Finanzas, Límites y Estado (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        {/* Bloque: Crédito y Condiciones de Pago */}
                        <div className="bg-white rounded-md p-4.5 border border-zinc-200 shadow-xs">
                            <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider mb-3.5">
                                <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect width="20" height="14" x="2" y="5" rx="2" strokeWidth="2" />
                                    <line x1="2" x2="22" y1="10" y2="10" strokeWidth="2" />
                                </svg>
                                <span>Finanzas y Crédito</span>
                            </div>

                            <div className="flex flex-col gap-3.5">
                                <div className="grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                            Límite Crédito (S/)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-semibold text-zinc-500">
                                                S/
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                name="creditLimit"
                                                value={creditLimit}
                                                onChange={onInputChange}
                                                className="w-full pl-7 pr-2.5 py-1.5 text-xs font-bold text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                            Saldo Actual (S/)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-xs font-semibold text-zinc-500">
                                                S/
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                name="currentBalance"
                                                value={currentBalance}
                                                onChange={onInputChange}
                                                className="w-full pl-7 pr-2.5 py-1.5 text-xs font-bold text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                                        Plazo de Crédito (Días)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="creditDays"
                                        value={creditDays}
                                        onChange={onInputChange}
                                        placeholder="0"
                                        className="w-full px-2.5 py-1.5 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors"
                                    />
                                </div>

                                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-600 text-[11px] leading-relaxed">
                                    <span className="font-bold text-zinc-800">Política de Crédito: </span>
                                    Configura los topes y días según el convenio o historial de pago del cliente. Para operaciones estrictamente al contado, mantén el límite en 0.
                                </div>
                            </div>
                        </div>

                        {/* Bloque: Estado de la Cuenta */}
                        <div className="bg-white rounded-md p-4.5 border border-zinc-200 shadow-xs">
                            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 m-0">
                                Estado del Registro
                            </h3>
                            <label className="flex items-center gap-3 p-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={isActive}
                                    onChange={onInputChange}
                                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
                                />
                                <div>
                                    <span className="text-xs font-bold text-zinc-900 block">
                                        Cliente Activo
                                    </span>
                                    <span className="text-[11px] text-zinc-500 block">
                                        Habilitado para emitir comprobantes y otorgar financiamiento en el punto de venta.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

ClientForm.propTypes = {
    clientSelected: PropTypes.object,
    initialData: PropTypes.object,
    onSuccess: PropTypes.func,
    onSaveSuccess: PropTypes.func,
    onCancel: PropTypes.func,
};