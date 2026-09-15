import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getCompanyInfo, saveOrUpdateCompany } from "../services/CompanyService";

export const CompanyPage = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    setIsLoading(true);
    getCompanyInfo()
      .then((res) => {
        if (res.data) {
          setFormData({
            id: res.data.id || null,
            legalName: res.data.legalName || "Farmacia SAC",
            commercialName: res.data.commercialName || "Farmacia SAC",
            taxId: res.data.taxId || "20258585874",
            phone: res.data.phone || "",
            address: res.data.address || "Lima Perú",
            email: res.data.email || "",
            ticketFooterText1: res.data.ticketFooterText1 || "¡Gracias por su compra!",
            ticketFooterText2: res.data.ticketFooterText2 || "",
            logoUrl: res.data.logoUrl || "",
          });
        }
      })
      .catch((err) => {
        console.error("Error al cargar datos de la empresa:", err);
        setFormData((prev) => ({
          ...prev,
          legalName: "Farmacia SAC",
          commercialName: "Farmacia SAC",
          taxId: "20258585874",
          address: "Lima Perú",
          ticketFooterText1: "¡Gracias por su compra!",
          ticketFooterText2: "",
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        title: "Archivo no válido",
        text: "Por favor selecciona una imagen válida (PNG, JPG o SVG)",
        icon: "warning",
        confirmButtonColor: "#09090b",
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL("image/png", 0.9);
        setFormData((prev) => ({
          ...prev,
          logoUrl: optimizedDataUrl,
        }));
      };
      img.onerror = () => {
        setFormData((prev) => ({
          ...prev,
          logoUrl: event.target.result,
        }));
      };
    };
  };

  const handleRemoveLogo = (e) => {
    if (e) e.stopPropagation();
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
      Swal.fire({
        title: "Campo requerido",
        text: "La Razón Social es obligatoria.",
        icon: "warning",
        confirmButtonColor: "#09090b",
      });
      return;
    }

    if (!formData.taxId.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "El RUC / Identificación Fiscal es obligatorio.",
        icon: "warning",
        confirmButtonColor: "#09090b",
      });
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
        window.dispatchEvent(new CustomEvent("companyInfoUpdated", { detail: res.data }));
      }
      Swal.fire({
        title: "¡Configuración Guardada!",
        text: "Los datos de la empresa se actualizaron correctamente.",
        icon: "success",
        confirmButtonColor: "#09090b",
        timer: 2000,
      });
    } catch (error) {
      console.error("Error al guardar empresa:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo guardar la información de la empresa.",
        icon: "error",
        confirmButtonColor: "#09090b",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-7 w-7 text-zinc-900" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          Cargando datos de la empresa...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
        <span
          className="hover:text-zinc-900 cursor-pointer transition-colors"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </span>
        <span>/</span>
        <span className="hover:text-zinc-900 cursor-pointer transition-colors">
          Configuración
        </span>
        <span>/</span>
        <span className="text-zinc-950 font-bold">Datos de la Empresa</span>
      </div>

      {/* 2. Header de la Página */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-zinc-900 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                IDENTIDAD CORPORATIVA
              </span>
              <span className="bg-zinc-100 text-zinc-800 border border-zinc-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                RUC: {formData.taxId || "—"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Información de la Empresa
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Datos fiscales, comerciales, logotipo y encabezados para los comprobantes de venta y reportes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-mono font-bold text-xs shadow transition-all cursor-pointer tracking-wider uppercase disabled:opacity-50 self-start sm:self-auto"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Formulario */}
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Datos Fiscales y Contacto (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100">
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                  Datos Fiscales y de Contacto
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Razón Social */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Razón Social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleChange}
                  required
                  placeholder="Ej. VidSalud SAC"
                  className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                />
              </div>

              {/* Nombre Comercial */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  name="commercialName"
                  value={formData.commercialName}
                  onChange={handleChange}
                  placeholder="Ej. VidSalud Farmacia"
                  className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                />
              </div>

              {/* RUC / NIT */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  RUC / NIT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  required
                  placeholder="Ej. 20258585874"
                  className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-mono font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej. (01) 456-7890"
                  className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-mono font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                />
              </div>

              {/* Dirección */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Dirección del Establecimiento
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ej. Av. Principal 1234, Lima, Perú"
                  className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Correo Electrónico Corporativo
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contacto@farmacia.com"
                  className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                />
              </div>
            </div>

            {/* Separador: Textos de Ticket */}
            <div className="pt-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100">
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                  Textos Predefinidos de Comprobante
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    Línea 1 (Agradecimiento)
                  </label>
                  <input
                    type="text"
                    name="ticketFooterText1"
                    value={formData.ticketFooterText1}
                    onChange={handleChange}
                    placeholder="Ej. ¡Gracias por su compra!"
                    className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    Línea 2 (Políticas / Advertencias)
                  </label>
                  <input
                    type="text"
                    name="ticketFooterText2"
                    value={formData.ticketFooterText2}
                    onChange={handleChange}
                    placeholder="Ej. Revise su medicamento antes de retirarse"
                    className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Logotipo Corporativo (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100">
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                  Logotipo Corporativo
                </h2>
              </div>
            </div>

            {/* Enlace URL Directo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                URL o Enlace Web del Logo
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="logoUrl"
                  value={formData.logoUrl || ""}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full h-10 pl-9 pr-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                />
                <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="text-[10px] font-mono text-zinc-400">
                Puede ingresar un enlace web directo o cargar un archivo local abajo.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Cuadro de Carga y Vista Previa */}
            <div className="border-2 border-dashed border-zinc-300 hover:border-zinc-500 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all bg-zinc-50/50 min-h-[220px] relative">
              {formData.logoUrl ? (
                <div className="flex flex-col items-center w-full">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-zinc-200 mb-3 max-h-36 max-w-full flex items-center justify-center">
                    <img
                      src={formData.logoUrl}
                      alt="Logo de la Empresa"
                      className="max-h-28 max-w-full object-contain"
                      onError={(e) => {
                        e.target.title = "No se pudo cargar la imagen";
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="text-xs font-mono font-bold text-zinc-900 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Cambiar Archivo
                    </button>
                    <span className="text-zinc-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-xs font-mono font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 group-hover:border-zinc-900 transition-colors mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors uppercase tracking-wider font-mono">
                    Subir imagen local
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1 font-mono">
                    PNG, JPG o SVG (máx. 2MB)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pie: Botón Guardar Cambios */}
        <div className="pt-5 border-t border-zinc-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-mono font-bold text-xs shadow transition-all cursor-pointer tracking-wider uppercase disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyPage;
