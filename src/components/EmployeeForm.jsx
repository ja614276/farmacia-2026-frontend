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
    // Datos User
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
      password: "", // Contraseña siempre vacía para que no se sobreescriba accidentalmente
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
    
    // Regla de tu entidad User: username entre 4 y 8 caracteres
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
      newErrors.password = "La contraseña es obligatoria";
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
    <div className="w-100 bg-white border rounded-3 p-4 p-md-5 user-form-container">
      {/* Cabecera */}
      <div className="pb-4 mb-4 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <span className="accent-bar"></span>
          <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: "-0.3px" }}>
            {isEditing ? "Editar Empleado" : "Registrar Empleado"}
          </h4>
          <span
            className={`badge fw-bold font-monospace ${
              isEditing ? "bg-amber-soft text-amber" : "bg-teal-soft text-teal"
            }`}
            style={{ fontSize: "0.72rem" }}
          >
            {isEditing ? `ID: #${formData.idEmpleado}` : "NUEVO"}
          </span>
        </div>
        <p className="text-muted small m-0 mt-1 ms-3 ps-1">
          {isEditing
            ? `Actualización del expediente y credenciales de ${formData.nombre}`
            : "Complete los datos del empleado y su cuenta de acceso al sistema."}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {/* Nombre */}
          <div className="col-md-6">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              Nombres *
            </label>
            <input
              type="text"
              name="nombre"
              className={`form-control modern-input ${errors.nombre ? "is-invalid" : ""}`}
              placeholder="Ej. Juan Carlos"
              value={formData.nombre}
              onChange={onInputChange}
            />
            {errors.nombre && <div className="text-danger small mt-1">• {errors.nombre}</div>}
          </div>

          {/* Apellidos */}
          <div className="col-md-6">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              Apellidos
            </label>
            <input
              type="text"
              name="apellidos"
              className="form-control modern-input"
              placeholder="Ej. Pérez Ramos"
              value={formData.apellidos}
              onChange={onInputChange}
            />
          </div>

          {/* DNI / N° Identificación */}
          <div className="col-md-4">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              N° Identificación / DNI
            </label>
            <input
              type="text"
              name="nIdentificacion"
              className="form-control modern-input"
              placeholder="Ej. 12345678"
              value={formData.nIdentificacion}
              onChange={onInputChange}
            />
          </div>

          {/* Teléfono / Celular */}
          <div className="col-md-4">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              Teléfono / Celular
            </label>
            <input
              type="text"
              name="numeroTelefono"
              className="form-control modern-input"
              placeholder="Ej. 987654321"
              value={formData.numeroTelefono}
              onChange={onInputChange}
            />
          </div>

          {/* Cargo */}
          <div className="col-md-4">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              Cargo
            </label>
            <input
              type="text"
              name="cargo"
              className="form-control modern-input"
              placeholder="Ej. Cajero, Farmacéutico"
              value={formData.cargo}
              onChange={onInputChange}
            />
          </div>

          {/* % Comisión */}
          <div className="col-md-4">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              % Comisión por Venta
            </label>
            <input
              type="number"
              step="0.1"
              name="porcentajeComision"
              className="form-control modern-input"
              value={formData.porcentajeComision}
              onChange={onInputChange}
            />
          </div>

          {/* Fecha Contratación */}
          <div className="col-md-4">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              Fecha de Contratación
            </label>
            <input
              type="date"
              name="fechaContratacion"
              className="form-control modern-input"
              value={formData.fechaContratacion}
              onChange={onInputChange}
            />
          </div>

          {/* Switch Activo */}
          <div className="col-md-4 d-flex align-items-end">
            <div
              onClick={onToggleActivo}
              className={`p-2 border rounded-3 w-100 d-flex justify-content-between align-items-center cursor-pointer ${
                formData.activo ? "role-box-active" : "role-box-default"
              }`}
              style={{ minHeight: "42px", cursor: "pointer" }}
            >
              <span className="small fw-bold ms-2 text-dark">
                {formData.activo ? "Empleado Activo" : "Empleado Inactivo"}
              </span>
              <div className="form-check form-switch m-0 pe-2">
                <input
                  type="checkbox"
                  role="switch"
                  checked={formData.activo}
                  onChange={onToggleActivo}
                  className="form-check-input custom-checkbox"
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>
          </div>

          {/* Divisor */}
          <div className="col-12 my-2 border-top pt-2">
            <span className="text-muted small fw-bold text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
              Credenciales de Acceso (Usuario)
            </span>
          </div>

          {/* Username */}
          <div className="col-md-4">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              Usuario (4-8 car.) *
            </label>
            <input
              type="text"
              name="username"
              maxLength={8}
              className={`form-control modern-input ${errors.username ? "is-invalid" : ""}`}
              placeholder="Ej. admin"
              value={formData.username}
              onChange={onInputChange}
            />
            {errors.username && <div className="text-danger small mt-1">• {errors.username}</div>}
          </div>

          {/* Email */}
          <div className="col-md-4">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="email"
              className={`form-control modern-input ${errors.email ? "is-invalid" : ""}`}
              placeholder="ejemplo@farmacia.com"
              value={formData.email}
              onChange={onInputChange}
            />
            {errors.email && <div className="text-danger small mt-1">• {errors.email}</div>}
          </div>

          {/* Contraseña */}
          <div className="col-md-4">
            <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
              {isEditing ? "Contraseña (Opcional)" : "Contraseña *"}
            </label>
            <input
              type="password"
              name="password"
              className={`form-control modern-input ${errors.password ? "is-invalid" : ""}`}
              placeholder={isEditing ? "Dejar vacía para conservar" : "••••••••"}
              value={formData.password}
              onChange={onInputChange}
            />
            {errors.password && <div className="text-danger small mt-1">• {errors.password}</div>}
          </div>

          {/* Asignar Administrador */}
          <div className="col-12">
            <div
              className={`p-3 border rounded-3 w-100 ${
                formData.admin ? "role-box-active" : "role-box-default"
              }`}
            >
              <div className="form-check m-0 d-flex align-items-start gap-2">
                <input
                  type="checkbox"
                  name="admin"
                  id="adminCheckbox"
                  checked={formData.admin}
                  className="form-check-input custom-checkbox mt-1"
                  onChange={onCheckboxAdminChange}
                  style={{ cursor: "pointer" }}
                />
                <div>
                  <label
                    className="form-check-label text-dark fw-bold small d-block"
                    htmlFor="adminCheckbox"
                    style={{ cursor: "pointer" }}
                  >
                    Asignar rol de Administrador
                  </label>
                  <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                    {formData.admin
                      ? "Privilegios habilitados para administración general, catálogo y reportes."
                      : "Acceso operativo limitado a ventas en caja y atención al cliente."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3 border-top">
          {onCancel && (
            <button
              type="button"
              className="btn btn-light border px-4 py-2 text-secondary fw-semibold btn-sm rounded-2"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-teal-submit px-4 py-2 fw-semibold btn-sm rounded-2 shadow-xs"
            style={{ minWidth: "140px" }}
          >
            {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Empleado"}
          </button>
        </div>
      </form>

      {/* Estilos acordes a tu diseño actual */}
      <style>{`
        .user-form-container {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .accent-bar {
          width: 4px;
          height: 20px;
          background-color: #006d77;
          border-radius: 2px;
          display: inline-block;
        }
        .text-teal { color: #006d77 !important; }
        .bg-teal-soft { background-color: #e6f4f1 !important; }
        .text-amber { color: #b45309 !important; }
        .bg-amber-soft { background-color: #fef3c7 !important; }
        
        .modern-input {
          border-color: #cbd5e1;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.88rem;
          color: #1e293b;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .modern-input:focus {
          border-color: #006d77;
          box-shadow: 0 0 0 3px rgba(0, 109, 119, 0.12);
        }
        
        .role-box-active {
          background-color: #f0fdfa;
          border-color: #99f6e4 !important;
          transition: all 0.2s ease;
        }
        .role-box-default {
          background-color: #f8fafc;
          border-color: #e2e8f0 !important;
          transition: all 0.2s ease;
        }
        
        .custom-checkbox:checked {
          background-color: #006d77;
          border-color: #006d77;
        }
        
        .btn-teal-submit {
          background-color: #006d77;
          color: #ffffff;
          border: none;
          transition: all 0.15s ease;
        }
        .btn-teal-submit:hover {
          background-color: #084c53;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};