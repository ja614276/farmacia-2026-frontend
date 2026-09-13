import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { getCompanyInfo, saveOrUpdateCompany } from "../services/CompanyService";

export const CompanyPage = () => {
    const [formData, setFormData] = useState({
        id: null,
        legalName: "",
        commercialName: "",
        taxId: "",
        phone: "",
        address: "",
        email: "",
        ticketFooterText1: "",
        ticketFooterText2: "",
        logoUrl: "",
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    // Cargar datos actuales de la empresa
    useEffect(() => {
        setIsLoading(true);
        getCompanyInfo()
            .then((res) => {
                if (res.data) {
                    setFormData({
                        id: res.data.id || null,
                        legalName: res.data.legalName || "VidSalud SAC",
                        commercialName: res.data.commercialName || "VidSalud SAC",
                        taxId: res.data.taxId || "20258585874",
                        phone: res.data.phone || "",
                        address: res.data.address || "Cusco Perú",
                        email: res.data.email || "",
                        ticketFooterText1: res.data.ticketFooterText1 || "¡Gracias por su compra!",
                        ticketFooterText2: res.data.ticketFooterText2 || "No se aceptan devoluciones después de 7 días",
                        logoUrl: res.data.logoUrl || "",
                    });
                }
            })
            .catch((err) => {
                console.error("Error al cargar datos de la empresa:", err);
                // Valores por defecto idénticos a la maqueta
                setFormData((prev) => ({
                    ...prev,
                    legalName: "VidSalud SAC",
                    commercialName: "VidSalud SAC",
                    taxId: "20258585874",
                    address: "Cusco Perú",
                    ticketFooterText1: "¡Gracias por su compra!",
                    ticketFooterText2: "No se aceptan devoluciones después de 7 días",
                }));
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Manejo de carga de imagen de logotipo (Base64)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            Swal.fire("Archivo no válido", "Por favor selecciona un archivo de imagen (PNG, JPG o SVG)", "warning");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            Swal.fire("Archivo muy pesado", "El logo no debe superar los 2MB", "warning");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({
                ...prev,
                logoUrl: reader.result,
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = (e) => {
        e.stopPropagation();
        setFormData((prev) => ({
            ...prev,
            logoUrl: "",
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.legalName.trim()) {
            Swal.fire("Campo requerido", "La Razón Social es obligatoria", "warning");
            return;
        }

        if (!formData.taxId.trim()) {
            Swal.fire("Campo requerido", "El RUC / NIT es obligatorio", "warning");
            return;
        }

        try {
            setIsSaving(true);
            const res = await saveOrUpdateCompany(formData);
            if (res.data) {
                setFormData((prev) => ({
                    ...prev,
                    ...res.data,
                }));
            }
            Swal.fire({
                title: "¡Guardado!",
                text: "Los datos de la empresa se actualizaron correctamente.",
                icon: "success",
                confirmButtonColor: "#005f60",
            });
        } catch (error) {
            console.error("Error al guardar empresa:", error);
            Swal.fire("Error", "No se pudo guardar la información de la empresa.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Tarjeta Principal */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
                
                {/* Encabezado con Icono Edificio */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#005f60]">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                        Información de la Empresa
                    </h1>
                </div>

                {isLoading ? (
                    <div className="py-16 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#005f60] mb-2" />
                        <p className="text-sm">Cargando datos de la empresa...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            
                            {/* COLUMNA IZQUIERDA: Campos de Texto (8 Cols) */}
                            <div className="lg:col-span-8 space-y-4">
                                
                                {/* FILA 1: Razón Social y Nombre Comercial */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Razón Social <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="legalName"
                                            value={formData.legalName}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ej: VidSalud SAC"
                                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005f60]/30 focus:border-[#005f60] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Nombre Comercial
                                        </label>
                                        <input
                                            type="text"
                                            name="commercialName"
                                            value={formData.commercialName}
                                            onChange={handleChange}
                                            placeholder="Ej: VidSalud Farmacia"
                                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005f60]/30 focus:border-[#005f60] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* FILA 2: RUC / NIT y Teléfono */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            RUC / NIT <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="taxId"
                                            value={formData.taxId}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ej: 20258585874"
                                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005f60]/30 focus:border-[#005f60] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Teléfono
                                        </label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Ej: (084) 223344"
                                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005f60]/30 focus:border-[#005f60] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* FILA 3: Dirección */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Ej: Cusco Perú"
                                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005f60]/30 focus:border-[#005f60] transition-colors"
                                    />
                                </div>

                                {/* FILA 4: Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="contacto@vidsalud.com"
                                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005f60]/30 focus:border-[#005f60] transition-colors"
                                    />
                                </div>

                                {/* SEPARADOR: Textos Adicionales (Ticket) */}
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-3 text-xs text-slate-400 font-medium">
                                            Textos Adicionales (Ticket)
                                        </span>
                                    </div>
                                </div>

                                {/* FILA 5: Texto Línea 1 */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Texto Línea 1
                                    </label>
                                    <input
                                        type="text"
                                        name="ticketFooterText1"
                                        value={formData.ticketFooterText1}
                                        onChange={handleChange}
                                        placeholder="Ej: ¡Gracias por su compra!"
                                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005f60]/30 focus:border-[#005f60] transition-colors"
                                    />
                                </div>

                                {/* FILA 6: Texto Línea 2 */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Texto Línea 2
                                    </label>
                                    <input
                                        type="text"
                                        name="ticketFooterText2"
                                        value={formData.ticketFooterText2}
                                        onChange={handleChange}
                                        placeholder="Ej: No se aceptan devoluciones después de 7 días"
                                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005f60]/30 focus:border-[#005f60] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* COLUMNA DERECHA: Logotipo (4 Cols) */}
                            <div className="lg:col-span-4 flex flex-col">
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    Logotipo
                                </label>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <div
                                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                    className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-teal-50/30 min-h-[260px] group relative"
                                >
                                    {formData.logoUrl ? (
                                        <div className="flex flex-col items-center">
                                            <div className="relative p-2 bg-white rounded-xl shadow-sm border border-slate-200 mb-3">
                                                <img
                                                    src={formData.logoUrl}
                                                    alt="Logo Empresa"
                                                    className="max-h-36 max-w-full object-contain"
                                                />
                                            </div>
                                            <span className="text-xs font-semibold text-[#005f60] group-hover:underline">
                                                Cambiar Logo
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="mt-2 text-[11px] text-rose-500 hover:text-rose-700 hover:underline"
                                            >
                                                Eliminar Logo
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            {/* Icono de imagen punteada idéntico a la maqueta */}
                                            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 group-hover:text-[#005f60] group-hover:border-teal-400 transition-colors mb-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                                                Sin Logo
                                            </span>
                                            <span className="text-[10px] text-slate-400 mt-1">
                                                Haz clic para subir imagen
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pie: Botón Guardar Cambios (Verde Azulado alineado a la derecha) */}
                        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-[#005f60] hover:bg-[#004e4f] active:scale-[0.98] text-white px-6 py-2.5 rounded-xl font-semibold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
