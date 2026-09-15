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
      confirmButtonColor: "#09090b",
      cancelButtonColor: "#71717a",
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
        confirmButtonColor: "#09090b",
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
        confirmButtonColor: "#09090b",
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin mb-4"></div>
        <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Cargando perfil corporativo...</span>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center max-w-lg mx-auto shadow-sm my-8">
        <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto mb-4 text-zinc-900">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h5 className="font-bold text-zinc-900 text-base mb-1 font-mono uppercase">No se pudo cargar el perfil</h5>
        <p className="text-zinc-500 text-xs mb-6">{error}</p>
        <button 
          className="bg-[#09090b] hover:bg-zinc-800 text-white font-mono text-xs font-semibold px-4 py-2.5 rounded transition-colors" 
          onClick={loadProfile}
        >
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
    <div className="w-full pb-10 space-y-6">
      {/* 1. Header Banner Monocromático */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#09090b] text-white flex items-center justify-center font-mono font-bold text-xl tracking-wider shadow-sm flex-shrink-0 border border-zinc-800">
              {getInitials()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-zinc-950 tracking-tight m-0">
                  {profile?.nombre} {profile?.apellidos}
                </h2>
                {profile?.admin ? (
                  <span className="bg-[#09090b] text-white font-mono text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded font-medium">
                    Administrador
                  </span>
                ) : (
                  <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 font-mono text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded font-medium">
                    Personal Operativo
                  </span>
                )}
                <span
                  className={`font-mono text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded font-medium ${
                    profile?.activo !== false 
                      ? "bg-zinc-100 text-zinc-900 border border-zinc-300" 
                      : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                  }`}
                >
                  {profile?.activo !== false ? "[USUARIO ACTIVO]" : "[INACTIVO]"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1.5 flex-wrap font-mono">
                <span>
                  Usuario: <strong className="text-zinc-900">@{profile?.username}</strong>
                </span>
                {profile?.cargo && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <span>
                      Cargo: <strong className="text-zinc-900">{profile.cargo}</strong>
                    </span>
                  </>
                )}
                {profile?.idEmpleado && (
                  <>
                    <span className="text-zinc-300">•</span>
                    <span>
                      ID Empleado: <strong className="text-zinc-900">#{profile.idEmpleado}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <span className="border border-zinc-200 bg-zinc-50 text-zinc-700 font-mono text-xs px-3.5 py-1.5 rounded flex items-center gap-2 font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Sesión Autenticada
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid de Información y Seguridad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Visualización de Datos Personales y Laborales */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-zinc-200 rounded-lg p-6 h-full shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 bg-[#09090b] rounded-xs"></div>
                <h3 className="font-bold text-zinc-900 text-sm tracking-tight m-0 uppercase font-mono">
                  Información del Colaborador
                </h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded font-medium">
                Solo Lectura
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
              Sus datos personales y laborales registrados en el sistema de farmacia. Si requiere actualizar algún dato personal (nombres, DNI, teléfono o cargo), solicítelo al administrador del sistema en el módulo de Empleados.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nombres y Apellidos */}
              <div className="p-3.5 border border-zinc-200 rounded bg-zinc-50">
                <span className="text-zinc-400 font-mono font-semibold uppercase block mb-1 text-[10px] tracking-wider">
                  Nombres y Apellidos
                </span>
                <span className="font-bold text-zinc-900 text-sm block">
                  {profile?.nombre} {profile?.apellidos || "—"}
                </span>
              </div>

              {/* DNI / N° Identificación */}
              <div className="p-3.5 border border-zinc-200 rounded bg-zinc-50">
                <span className="text-zinc-400 font-mono font-semibold uppercase block mb-1 text-[10px] tracking-wider">
                  DNI / N° Identificación
                </span>
                <span className="font-mono font-bold text-zinc-900 text-sm block">
                  {profile?.nIdentificacion || "No registrado"}
                </span>
              </div>

              {/* Número Telefónico */}
              <div className="p-3.5 border border-zinc-200 rounded bg-zinc-50">
                <span className="text-zinc-400 font-mono font-semibold uppercase block mb-1 text-[10px] tracking-wider">
                  Número Telefónico / Celular
                </span>
                <span className="font-mono font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {profile?.numeroTelefono || "No registrado"}
                </span>
              </div>

              {/* Cargo Asignado */}
              <div className="p-3.5 border border-zinc-200 rounded bg-zinc-50">
                <span className="text-zinc-400 font-mono font-semibold uppercase block mb-1 text-[10px] tracking-wider">
                  Cargo Laboral
                </span>
                <span className="font-bold text-zinc-900 text-sm block">
                  {profile?.cargo || "Personal de Farmacia"}
                </span>
              </div>

              {/* Correo Electrónico */}
              <div className="p-3.5 border border-zinc-200 rounded bg-zinc-50">
                <span className="text-zinc-400 font-mono font-semibold uppercase block mb-1 text-[10px] tracking-wider">
                  Correo Electrónico
                </span>
                <span className="font-medium text-zinc-900 text-xs block break-all">
                  {profile?.email || "—"}
                </span>
              </div>

              {/* Nombre de Usuario */}
              <div className="p-3.5 border border-zinc-200 rounded bg-zinc-50">
                <span className="text-zinc-400 font-mono font-semibold uppercase block mb-1 text-[10px] tracking-wider">
                  Usuario de Acceso
                </span>
                <span className="font-mono font-bold text-zinc-900 text-sm block">
                  @{profile?.username}
                </span>
              </div>

              {/* Fecha de Contratación */}
              <div className="p-3.5 border border-zinc-200 rounded bg-zinc-50">
                <span className="text-zinc-400 font-mono font-semibold uppercase block mb-1 text-[10px] tracking-wider">
                  Fecha de Contratación
                </span>
                <span className="font-medium text-zinc-900 text-xs block">
                  {formatDate(profile?.fechaContratacion)}
                </span>
              </div>

              {/* Comisión por Venta */}
              <div className="p-3.5 border border-zinc-200 rounded bg-zinc-50">
                <span className="text-zinc-400 font-mono font-semibold uppercase block mb-1 text-[10px] tracking-wider">
                  Comisión por Venta
                </span>
                <span className="font-mono font-bold text-zinc-900 text-sm block">
                  {profile?.porcentajeComision != null ? `${profile.porcentajeComision}%` : "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Cambio de Contraseña Solicitado */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-zinc-200 rounded-lg p-6 h-full shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-zinc-100">
                <div className="w-2 h-4 bg-[#09090b] rounded-xs"></div>
                <h3 className="font-bold text-zinc-900 text-sm tracking-tight m-0 uppercase font-mono">
                  Seguridad y Contraseña
                </h3>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 mb-5 flex items-start gap-2.5">
                <div className="mt-0.5 text-zinc-700 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed m-0">
                  Para editar su contraseña, ingrese su <strong>contraseña anterior</strong> y escriba dos veces la <strong>nueva contraseña</strong> para verificar que no haya errores.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} id="passwordChangeForm" className="space-y-4">
                {/* 1. Contraseña Anterior */}
                <div>
                  <label className="block text-zinc-700 font-mono font-bold uppercase text-[11px] tracking-wider mb-1.5">
                    Contraseña Anterior *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      className={`w-full px-3 py-2 text-xs border rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 pr-10 ${
                        passwordErrors.currentPassword ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 bg-white"
                      }`}
                      placeholder="Ingrese su contraseña actual"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      disabled={submittingPassword}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-700"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="23" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <div className="text-zinc-900 font-mono text-[11px] mt-1 font-medium">• {passwordErrors.currentPassword}</div>
                  )}
                </div>

                {/* 2. Nueva Contraseña */}
                <div>
                  <label className="block text-zinc-700 font-mono font-bold uppercase text-[11px] tracking-wider mb-1.5">
                    Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      className={`w-full px-3 py-2 text-xs border rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 pr-10 ${
                        passwordErrors.newPassword ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 bg-white"
                      }`}
                      placeholder="Mínimo 4 caracteres"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      disabled={submittingPassword}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="23" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <div className="text-zinc-900 font-mono text-[11px] mt-1 font-medium">• {passwordErrors.newPassword}</div>
                  )}
                </div>

                {/* 3. Confirmar Nueva Contraseña */}
                <div>
                  <label className="block text-zinc-700 font-mono font-bold uppercase text-[11px] tracking-wider mb-1.5">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmNewPassword"
                      className={`w-full px-3 py-2 text-xs border rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-zinc-900 pr-10 ${
                        passwordErrors.confirmNewPassword ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 bg-white"
                      }`}
                      placeholder="Vuelva a escribir la nueva contraseña"
                      value={passwordForm.confirmNewPassword}
                      onChange={handlePasswordChange}
                      disabled={submittingPassword}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="23" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmNewPassword && (
                    <div className="text-zinc-900 font-mono text-[11px] mt-1 font-medium">• {passwordErrors.confirmNewPassword}</div>
                  )}

                  {/* Feedback de coincidencia */}
                  {passwordForm.newPassword && passwordForm.confirmNewPassword && (
                    <div className="mt-2 text-xs font-mono">
                      {passwordsMatch ? (
                        <span className="text-zinc-900 font-medium flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          [CONTRASAÑAS COINCIDEN]
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          [LAS CONTRASEÑAS NO COINCIDEN]
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-100">
              <button
                type="submit"
                form="passwordChangeForm"
                className="w-full bg-[#09090b] hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
                disabled={submittingPassword}
              >
                {submittingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-white rounded-full animate-spin"></div>
                    <span>Guardando Contraseña...</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
