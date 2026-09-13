import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { getProfile, changePassword } from "../services/ProfileService";

export const ProfilePage = () => {
  const { user: authUser } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProfile(authUser?.username);
      setProfile(data);
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      const msg =
        err?.response?.data?.message ||
        "No se pudo cargar la información de su perfil. Verifique su conexión.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [authUser?.username]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Debe ingresar su contraseña actual.";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "Debe ingresar una nueva contraseña.";
    } else if (passwordForm.newPassword.length < 4) {
      errors.newPassword = "La nueva contraseña debe tener al menos 4 caracteres.";
    }

    if (!passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = "Debe confirmar la nueva contraseña.";
    } else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = "Las nuevas contraseñas no coinciden.";
    }

    if (
      passwordForm.currentPassword &&
      passwordForm.newPassword &&
      passwordForm.currentPassword === passwordForm.newPassword
    ) {
      errors.newPassword = "La nueva contraseña no puede ser igual a la actual.";
    }

    return errors;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    const confirmResult = await Swal.fire({
      title: "¿Actualizar Contraseña?",
      text: "Se modificará su clave de acceso al sistema con la nueva ingresada.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0d9488",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, cambiar contraseña",
      cancelButtonText: "Cancelar",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setSubmittingPassword(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
        username: profile?.username || authUser?.username,
      });

      await Swal.fire({
        title: "¡Contraseña Actualizada!",
        text: "Su contraseña de acceso ha sido cambiada exitosamente.",
        icon: "success",
        confirmButtonColor: "#0d9488",
      });

      // Limpiar formulario
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordErrors({});
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      const errorMsg =
        err?.response?.data?.message ||
        "Ocurrió un error al intentar cambiar la contraseña.";
      Swal.fire({
        title: "Error al cambiar contraseña",
        text: errorMsg,
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSubmittingPassword(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "No registrada";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = () => {
    if (profile?.nombre && profile?.apellidos) {
      return `${profile.nombre.charAt(0)}${profile.apellidos.charAt(0)}`.toUpperCase();
    }
    if (profile?.nombre) return profile.nombre.slice(0, 2).toUpperCase();
    if (profile?.username) return profile.username.slice(0, 2).toUpperCase();
    return "US";
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5">
        <div className="spinner-border text-teal mb-3" style={{ width: "3rem", height: "3rem" }} role="status"></div>
        <span className="text-secondary fw-semibold">Cargando datos de su perfil...</span>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-white border rounded-3 p-5 text-center shadow-xs mx-auto" style={{ maxWidth: "600px" }}>
        <div className="text-danger mb-3 fs-2">⚠️</div>
        <h5 className="fw-bold text-dark mb-2">No se pudo cargar el perfil</h5>
        <p className="text-muted small mb-4">{error}</p>
        <button className="btn btn-teal-primary px-4 py-2" onClick={loadProfile}>
          Reintentar Carga
        </button>
      </div>
    );
  }

  const passwordsMatch =
    passwordForm.newPassword &&
    passwordForm.confirmNewPassword &&
    passwordForm.newPassword === passwordForm.confirmNewPassword;

  return (
    <div className="w-100 pb-5">
      {/* 1. Header Banner */}
      <div className="bg-white border rounded-3 p-4 mb-4 shadow-xs">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center text-white fw-bold shadow-sm rounded-circle"
              style={{
                width: "64px",
                height: "64px",
                fontSize: "1.4rem",
                background: "linear-gradient(135deg, #0d9488 0%, #115e59 100%)",
                letterSpacing: "1px",
              }}
            >
              {getInitials()}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h3 className="fw-bold text-dark m-0">
                  {profile?.nombre} {profile?.apellidos}
                </h3>
                {profile?.admin ? (
                  <span className="badge bg-purple-soft text-black border border-purple-subtle px-2.5 py-1" style={{ fontSize: "0.75rem" }}>
                    Administrador
                  </span>
                ) : (
                  <span className="badge bg-light text-black border px-2.5 py-1" style={{ fontSize: "0.75rem" }}>
                    Personal
                  </span>
                )}
                <span
                  className={`badge rounded-pill px-2.5 py-1 ${profile?.activo !== false ? "bg-teal-soft text-black" : "bg-light text-black border"
                    }`}
                  style={{ fontSize: "0.75rem" }}
                >
                  {profile?.activo !== false ? "Usuario Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-muted small m-0 mt-1">
                Usuario:
                <span className="font-monospace text-teal fw-semibold"> @{profile?.username}</span>
                {profile?.cargo && (
                  <>
                    {" "}| Cargo: <strong>{profile.cargo}</strong>
                  </>
                )}
                {profile?.idEmpleado && (
                  <>
                    {" "}| id: <strong>#{profile.idEmpleado}</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="text-md-end">
            <span className="badge bg-light text-secondary border px-3 py-2">
              <i className="bi bi-shield-check me-1 text-teal"></i> Sesión Autenticada
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid de Información y Seguridad */}
      <div className="row g-4">
        {/* Columna Izquierda: Visualización de Datos Personales y Laborales */}
        <div className="col-12 col-lg-7">
          <div className="bg-white border rounded-3 p-4 h-100 shadow-xs">
            <div className="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <span className="accent-bar"></span>
                <h5 className="fw-bold text-dark m-0" style={{ letterSpacing: "-0.2px" }}>
                  Información del Colaborador
                </h5>
              </div>
              <span className="badge bg-light text-muted border" style={{ fontSize: "0.7rem" }}>
                Solo Lectura
              </span>
            </div>

            <p className="text-muted small mb-4">
              Sus datos personales y laborales registrados en el sistema de farmacia. Si requiere actualizar algún dato personal (nombres, DNI, teléfono o cargo), solicítelo al administrador del sistema en el módulo de Empleados.
            </p>

            <div className="row g-3">
              {/* Nombres y Apellidos */}
              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light-subtle h-100">
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
                    Nombres y Apellidos
                  </span>
                  <span className="fw-bold text-dark fs-6">
                    {profile?.nombre} {profile?.apellidos || "—"}
                  </span>
                </div>
              </div>

              {/* DNI / N° Identificación */}
              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light-subtle h-100">
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
                    DNI / N° Identificación
                  </span>
                  <span className="font-monospace fw-bold text-dark fs-6">
                    {profile?.nIdentificacion || "No registrado"}
                  </span>
                </div>
              </div>

              {/* Número Telefónico */}
              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light-subtle h-100">
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
                    Número Telefónico / Celular
                  </span>
                  <span className="font-monospace fw-bold text-teal fs-6 d-flex align-items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {profile?.numeroTelefono || "No registrado"}
                  </span>
                </div>
              </div>

              {/* Cargo Asignado */}
              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light-subtle h-100">
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
                    Cargo Laboral
                  </span>
                  <span className="fw-bold text-dark fs-6">
                    {profile?.cargo || "Personal de Farmacia"}
                  </span>
                </div>
              </div>

              {/* Correo Electrónico */}
              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light-subtle h-100">
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
                    Correo Electrónico
                  </span>
                  <span className="fw-semibold text-dark text-break">
                    {profile?.email || "—"}
                  </span>
                </div>
              </div>

              {/* Nombre de Usuario */}
              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light-subtle h-100">
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
                    Usuario de Acceso
                  </span>
                  <span className="font-monospace fw-bold text-secondary">
                    @{profile?.username}
                  </span>
                </div>
              </div>

              {/* Fecha de Contratación */}
              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light-subtle h-100">
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
                    Fecha de Contratación
                  </span>
                  <span className="fw-semibold text-dark">
                    {formatDate(profile?.fechaContratacion)}
                  </span>
                </div>
              </div>

              {/* Comisión por Venta */}
              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light-subtle h-100">
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1" style={{ fontSize: "0.72rem" }}>
                    Comisión por Venta
                  </span>
                  <span className="font-monospace fw-bold text-dark fs-6">
                    {profile?.porcentajeComision != null ? `${profile.porcentajeComision}%` : "0%"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Cambio de Contraseña Solicitado */}
        <div className="col-12 col-lg-5">
          <div className="bg-white border rounded-3 p-4 h-100 shadow-xs d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
                <span className="accent-bar" style={{ backgroundColor: "#0d9488" }}></span>
                <h5 className="fw-bold text-dark m-0" style={{ letterSpacing: "-0.2px" }}>
                  Seguridad y Contraseña
                </h5>
              </div>

              <div className="alert alert-info py-2.5 px-3 border-0 rounded-2 mb-3 d-flex gap-2" style={{ backgroundColor: "#f0fdfa", color: "#0f766e" }}>
                <div className="mt-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div className="small">
                  Para editar su contraseña, ingrese su <strong>contraseña anterior</strong> y escriba dos veces la <strong>nueva contraseña</strong> para verificar que no haya errores de escritura.
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} id="passwordChangeForm">
                {/* 1. Contraseña Anterior */}
                <div className="mb-3">
                  <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
                    Contraseña Anterior *
                  </label>
                  <div className="input-group">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      className={`form-control modern-input ${passwordErrors.currentPassword ? "is-invalid" : ""}`}
                      placeholder="Ingrese su contraseña actual"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      disabled={submittingPassword}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      style={{ borderColor: "#ced4da" }}
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <div className="text-danger small mt-1">• {passwordErrors.currentPassword}</div>
                  )}
                </div>

                {/* 2. Nueva Contraseña */}
                <div className="mb-3">
                  <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
                    Nueva Contraseña *
                  </label>
                  <div className="input-group">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      className={`form-control modern-input ${passwordErrors.newPassword ? "is-invalid" : ""}`}
                      placeholder="Mínimo 4 caracteres"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      disabled={submittingPassword}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      style={{ borderColor: "#ced4da" }}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <div className="text-danger small mt-1">• {passwordErrors.newPassword}</div>
                  )}
                </div>

                {/* 3. Confirmar Nueva Contraseña */}
                <div className="mb-3">
                  <label className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1" style={{ fontSize: "0.74rem" }}>
                    Confirmar Nueva Contraseña (Repetir) *
                  </label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmNewPassword"
                      className={`form-control modern-input ${passwordErrors.confirmNewPassword ? "is-invalid" : ""}`}
                      placeholder="Vuelva a escribir la nueva contraseña"
                      value={passwordForm.confirmNewPassword}
                      onChange={handlePasswordChange}
                      disabled={submittingPassword}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-start-0"
                      style={{ borderColor: "#ced4da" }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmNewPassword && (
                    <div className="text-danger small mt-1">• {passwordErrors.confirmNewPassword}</div>
                  )}

                  {/* Feedback en vivo de coincidencia */}
                  {passwordForm.newPassword && passwordForm.confirmNewPassword && (
                    <div className="mt-2 small">
                      {passwordsMatch ? (
                        <span className="text-success fw-semibold d-flex align-items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Las contraseñas coinciden correctamente
                        </span>
                      ) : (
                        <span className="text-danger fw-semibold d-flex align-items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Las contraseñas no coinciden
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="pt-3 mt-3 border-top">
              <button
                type="submit"
                form="passwordChangeForm"
                className="btn btn-teal-primary w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2"
                disabled={submittingPassword}
              >
                {submittingPassword ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status"></div>
                    <span>Verificando y Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Actualizar Contraseña</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
