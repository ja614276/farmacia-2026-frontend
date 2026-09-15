import React, { useState, useEffect } from "react";

export const EmployeeForm = ({ initialData = null, onSubmit, onCancel }) => {
  const isEditing = Boolean(initialData?.idEmpleado || initialData?.id);

  const [formData, setFormData] = useState({
    idEmpleado: initialData?.idEmpleado || initialData?.id || 0,
    nombre: initialData?.nombre || "",
    apellidos: initialData?.apellidos || "",
    nIdentificacion: initialData?.nIdentificacion || "",
    numeroTelefono: initialData?.numeroTelefono || "",
    cargo: initialData?.cargo || "",
    porcentajeComision: initialData?.porcentajeComision ?? 0,
    fechaContratacion: initialData?.fechaContratacion
      ? String(initialData.fechaContratacion).substring(0, 10)
      : new Date().toISOString().substring(0, 10),
    activo: initialData?.activo ?? true,
    username: initialData?.username || "",
    email: initialData?.email || "",
    password: "",
    admin: initialData?.admin ?? false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        idEmpleado: initialData.idEmpleado || initialData.id || 0,
        nombre: initialData.nombre || "",
        apellidos: initialData.apellidos || "",
        nIdentificacion: initialData.nIdentificacion || "",
        numeroTelefono: initialData.numeroTelefono || "",
        cargo: initialData.cargo || "",
        porcentajeComision: initialData.porcentajeComision ?? 0,
        fechaContratacion: initialData.fechaContratacion
          ? String(initialData.fechaContratacion).substring(0, 10)
          : "",
        activo: initialData.activo ?? true,
        username: initialData.username || "",
        email: initialData.email || "",
        password: "",
        admin: Boolean(initialData.admin),
      });
    }
  }, [initialData]);

  const onInputChange = ({ target }) => {
    const { name, value, type } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : parseFloat(value)) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const onCheckboxAdminChange = () => {
    setFormData((prev) => ({ ...prev, admin: !prev.admin }));
  };

  const onToggleActivo = () => {
    setFormData((prev) => ({ ...prev, activo: !prev.activo }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es obligatorio";
    } else if (formData.username.trim().length < 4 || formData.username.trim().length > 8) {
      newErrors.username = "Debe tener entre 4 y 8 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Formato de correo no válido";
    }

    if (!isEditing && !formData.password.trim()) {
      newErrors.password = "La contraseña es obligatoria para nuevos registros";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        const payload = {
          nombre: formData.nombre.trim(),
          apellidos: formData.apellidos.trim() || null,
          nIdentificacion: formData.nIdentificacion.trim() || null,
          numeroTelefono: formData.numeroTelefono?.trim() || null,
          cargo: formData.cargo.trim() || null,
          porcentajeComision: Number(formData.porcentajeComision) || 0,
          fechaContratacion: formData.fechaContratacion || null,
          activo: Boolean(formData.activo),
          username: formData.username.trim(),
          email: formData.email.trim(),
          admin: Boolean(formData.admin),
        };

        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        await onSubmit(payload, formData.idEmpleado);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Superior */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-zinc-900 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
              {isEditing ? `EXPEDIENTE #${formData.idEmpleado}` : "NUEVO INGRESO"}
            </span>
            <span className="bg-zinc-100 text-zinc-800 border border-zinc-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              RECURSOS HUMANOS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {isEditing ? `Editar Colaborador: ${formData.nombre}` : "Registrar Nuevo Colaborador"}
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {isEditing
              ? "Actualización de datos generales, credenciales de acceso y porcentajes de comisión."
              : "Ingrese la información personal y las credenciales de acceso para el nuevo personal de farmacia."}
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Volver al Directorio</span>
          </button>
        )}
      </div>

      {/* 2. Formulario Principal */}
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* SECCIÓN 1: Identificación y Datos Personales */}
        <div>
          <div className="flex items-center gap-2.5 pb-3 mb-5 border-b border-zinc-100">
            <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
              1. Identificación y Contacto
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Nombres */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={onInputChange}
                placeholder="Ej. Juan Carlos"
                className={`w-full h-10 px-3.5 bg-zinc-50/60 border rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all ${
                  errors.nombre
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                }`}
              />
              {errors.nombre && (
                <p className="text-[11px] font-mono font-bold text-red-600 mt-1">
                  • {errors.nombre}
                </p>
              )}
            </div>

            {/* Apellidos */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Apellidos
              </label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={onInputChange}
                placeholder="Ej. Pérez Ramos"
                className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
              />
            </div>

            {/* DNI / N° Identificación */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                N° Identificación / DNI
              </label>
              <input
                type="text"
                name="nIdentificacion"
                value={formData.nIdentificacion}
                onChange={onInputChange}
                placeholder="Ej. 12345678"
                className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-mono font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Teléfono / Celular
              </label>
              <input
                type="text"
                name="numeroTelefono"
                value={formData.numeroTelefono}
                onChange={onInputChange}
                placeholder="Ej. 987654321"
                className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-mono font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
              />
            </div>

            {/* Cargo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Cargo / Función
              </label>
              <input
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={onInputChange}
                placeholder="Ej. Farmacéutico, Cajero"
                className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
              />
            </div>

            {/* Estado Activo / Inactivo */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Estado del Colaborador
              </label>
              <div
                onClick={onToggleActivo}
                className={`h-10 px-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  formData.activo
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                    : "bg-zinc-50 text-zinc-600 border-zinc-300"
                }`}
              >
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  {formData.activo ? "[ACTIVO / OPERATIVO]" : "[INACTIVO / BLOQUEADO]"}
                </span>
                <div
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    formData.activo ? "bg-white" : "bg-zinc-300"
                  }`}
                >
                  <div
                    className={`bg-zinc-900 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      formData.activo ? "translate-x-4 bg-zinc-900" : "translate-x-0 bg-white"
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Condiciones Laborales y Comisiones */}
        <div>
          <div className="flex items-center gap-2.5 pb-3 mb-5 border-b border-zinc-100">
            <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
              2. Condiciones de Contrato & Remuneración
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Fecha Contratación */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Fecha de Contratación
              </label>
              <input
                type="date"
                name="fechaContratacion"
                value={formData.fechaContratacion}
                onChange={onInputChange}
                className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
              />
            </div>

            {/* % Comisión por Venta */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                % Comisión por Ventas
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="porcentajeComision"
                  value={formData.porcentajeComision}
                  onChange={onInputChange}
                  placeholder="0.0"
                  className="w-full h-10 pl-3.5 pr-10 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-400">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Credenciales de Acceso */}
        <div>
          <div className="flex items-center gap-2.5 pb-3 mb-5 border-b border-zinc-100">
            <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
              3. Credenciales y Seguridad del Sistema
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            {/* Usuario */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Usuario (4-8 car.) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">
                  @
                </span>
                <input
                  type="text"
                  name="username"
                  maxLength={8}
                  value={formData.username}
                  onChange={onInputChange}
                  placeholder="admin"
                  className={`w-full h-10 pl-7 pr-3.5 bg-zinc-50/60 border rounded-xl text-xs font-mono font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all ${
                    errors.username
                      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-[11px] font-mono font-bold text-red-600 mt-1">
                  • {errors.username}
                </p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onInputChange}
                placeholder="colaborador@farmacia.com"
                className={`w-full h-10 px-3.5 bg-zinc-50/60 border rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                }`}
              />
              {errors.email && (
                <p className="text-[11px] font-mono font-bold text-red-600 mt-1">
                  • {errors.email}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                {isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña de Acceso"} {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={onInputChange}
                placeholder={isEditing ? "Dejar vacío para conservar actual" : "••••••••"}
                className={`w-full h-10 px-3.5 bg-zinc-50/60 border rounded-xl text-xs font-mono font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-all ${
                  errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                }`}
              />
              {errors.password && (
                <p className="text-[11px] font-mono font-bold text-red-600 mt-1">
                  • {errors.password}
                </p>
              )}
            </div>
          </div>

          {/* Permiso Administrador */}
          <div
            onClick={onCheckboxAdminChange}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              formData.admin
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-400"
            }`}
          >
            <input
              type="checkbox"
              id="adminCheckbox"
              checked={formData.admin}
              onChange={onCheckboxAdminChange}
              className="mt-1 w-4 h-4 rounded border-zinc-400 accent-zinc-900 cursor-pointer"
            />
            <div>
              <label
                htmlFor="adminCheckbox"
                className="text-xs font-bold uppercase tracking-wider cursor-pointer block"
              >
                Asignar Rol de Administrador
              </label>
              <p
                className={`text-xs mt-0.5 ${
                  formData.admin ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {formData.admin
                  ? "Este usuario tendrá privilegios completos para gestionar inventarios, reportes, compras y configuración."
                  : "Acceso operativo estándar: caja, emisión de ventas y consultas de inventario."}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          {onCancel && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 shadow-xs transition-all uppercase tracking-wider font-mono cursor-pointer"
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-mono font-bold text-xs shadow transition-all cursor-pointer tracking-wider uppercase disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{isEditing ? "Actualizar Expediente" : "Crear Colaborador"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;