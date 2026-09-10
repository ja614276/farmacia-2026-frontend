import { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export const ClientForm = ({ initialData, onSaveSuccess, onCancel }) => {
  const isEditing = Boolean(initialData?.idCliente || initialData?.id);

  const [formData, setFormData] = useState({
    nombres: initialData?.nombres || "",
    apellidos: initialData?.apellidos || "",
    identificacion: initialData?.identificacion || "",
    telefono: initialData?.telefono || "",
    email: initialData?.email || "",
    direccion: initialData?.direccion || "",
    limiteCredito: initialData?.limiteCredito ?? 0,
    saldo: initialData?.saldo ?? 0,
    diasCredito: initialData?.diasCredito ?? 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const getAuthHeaders = () => {
    let rawToken =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      sessionStorage.getItem("jwt");

    if (!rawToken) {
      const storedLogin =
        sessionStorage.getItem("login") || localStorage.getItem("login");
      if (storedLogin) {
        try {
          const parsed = JSON.parse(storedLogin);
          rawToken = parsed.token || parsed.jwt;
        } catch (e) {
          console.error("Error parseando storage de login:", e);
        }
      }
    }

    if (!rawToken) return { "Content-Type": "application/json" };

    const authHeader = rawToken.startsWith("Bearer ")
      ? rawToken
      : `Bearer ${rawToken}`;

    return {
      Authorization: authHeader,
      "Content-Type": "application/json",
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setErrorMsg("Los campos Nombre(s) y Apellidos son obligatorios.");
      return;
    }

    setIsSaving(true);

    const payload = {
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      identificacion: formData.identificacion.trim() || null,
      telefono: formData.telefono.trim() || null,
      email: formData.email.trim() || null,
      direccion: formData.direccion.trim() || null,
      limiteCredito: Number(formData.limiteCredito) || 0,
      saldo: Number(formData.saldo) || 0,
      diasCredito: Number(formData.diasCredito) || 0,
    };

    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      let response;

      if (isEditing) {
        const id = initialData.idCliente || initialData.id;
        response = await axios.put(`${baseUrl}/clients/${id}`, payload, {
          headers: getAuthHeaders(),
        });
      } else {
        response = await axios.post(`${baseUrl}/clients`, payload, {
          headers: getAuthHeaders(),
        });
      }

      if (onSaveSuccess) {
        onSaveSuccess(response.data);
      } else {
        alert("Cliente guardado exitosamente.");
      }
    } catch (error) {
      console.error("Error al registrar cliente:", error.response?.data || error);
      setErrorMsg(
        error.response?.data?.message ||
          "Error al procesar la solicitud en el servidor."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="client-form-container p-4">
      {/* Header superior */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          {onCancel && (
            <button
              type="button"
              className="btn btn-light rounded-circle shadow-sm p-2 d-flex align-items-center justify-content-center border"
              onClick={onCancel}
              style={{ width: "38px", height: "38px" }}
              title="Volver"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-teal d-flex align-items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </span>
              <h4 className="fw-bolder m-0 text-dark">
                {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
              </h4>
            </div>
            <p className="text-muted small m-0">
              Completa la información detallada del cliente para tu sistema.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="d-flex align-items-center gap-2">
          {onCancel && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold shadow-sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            className="btn btn-teal-primary btn-sm px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
          {errorMsg}
        </div>
      )}

      {/* Formulario distribuido */}
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* COLUMNA IZQUIERDA: Datos Personales e Información de Contacto */}
          <div className="col-12 col-lg-7 d-flex flex-column gap-4">
            {/* Tarjeta 1: Datos Personales */}
            <div className="bg-white rounded-4 shadow-sm border p-4 border-top-teal">
              <div className="d-flex align-items-center gap-2 text-indigo fw-bold mb-3 section-title">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>DATOS PERSONALES</span>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted fw-bold small mb-1">
                    Nombre(s) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm custom-input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="nombres"
                      required
                      className="form-control border-start-0 ps-0"
                      placeholder="Ej: Juan Carlos"
                      value={formData.nombres}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted fw-bold small mb-1">
                    Apellidos <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm custom-input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="apellidos"
                      required
                      className="form-control border-start-0 ps-0"
                      placeholder="Ej: Pérez García"
                      value={formData.apellidos}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label text-muted fw-bold small mb-1">
                    Identificación (DNI / RUC / CEE)
                  </label>
                  <div className="input-group input-group-sm custom-input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="identificacion"
                      className="form-control border-start-0 ps-0 font-monospace"
                      placeholder="Ej: 72345678"
                      value={formData.identificacion}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Información de Contacto */}
            <div className="bg-white rounded-4 shadow-sm border p-4 border-top-emerald">
              <div className="d-flex align-items-center gap-2 text-emerald fw-bold mb-3 section-title">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>INFORMACIÓN DE CONTACTO</span>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted fw-bold small mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="input-group input-group-sm custom-input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="telefono"
                      className="form-control border-start-0 ps-0"
                      placeholder="+51 9..."
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted fw-bold small mb-1">
                    Correo Electrónico
                  </label>
                  <div className="input-group input-group-sm custom-input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      className="form-control border-start-0 ps-0"
                      placeholder="ejemplo@correo.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label text-muted fw-bold small mb-1">
                    Dirección Completa
                  </label>
                  <div className="input-group input-group-sm custom-input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="direccion"
                      className="form-control border-start-0 ps-0"
                      placeholder="Calle, Ciudad, Referencia"
                      value={formData.direccion}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Finanzas y Crédito */}
          <div className="col-12 col-lg-5">
            <div className="bg-white rounded-4 shadow-sm border p-4 border-top-rose h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center gap-2 text-rose fw-bold mb-3 section-title">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                  <span>FINANZAS Y CRÉDITO</span>
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label text-muted fw-bold small mb-1">
                      Límite (S/)
                    </label>
                    <div className="input-group input-group-sm custom-input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="limiteCredito"
                        className="form-control border-start-0 ps-0 fw-bold text-dark"
                        value={formData.limiteCredito}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="col-6">
                    <label className="form-label text-muted fw-bold small mb-1">
                      Saldo Actual (S/)
                    </label>
                    <div className="input-group input-group-sm custom-input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="saldo"
                        className="form-control border-start-0 ps-0 fw-bold text-teal"
                        value={formData.saldo}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted fw-bold small mb-1">
                      Días de Crédito permitidos
                    </label>
                    <div className="input-group input-group-sm custom-input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </span>
                      <input
                        type="number"
                        min="0"
                        name="diasCredito"
                        className="form-control border-start-0 ps-0"
                        value={formData.diasCredito}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota informativa al pie de la tarjeta */}
              <div className="p-3 rounded-3 bg-rose-subtle text-rose-dark small mt-4 border border-rose-subtle">
                <span className="fw-bold">Nota: </span>
                Define los parámetros de crédito para este cliente según su historial crediticio.
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Estilos específicos idénticos a tu layout */}
      <style>{`
        .client-form-container {
          background-color: #f8fafc;
          min-height: 100vh;
        }
        .text-teal {
          color: #006d77 !important;
        }
        .btn-teal-primary {
          background-color: #006d77;
          color: #fff;
          border: none;
        }
        .btn-teal-primary:hover {
          background-color: #084c53;
          color: #fff;
        }
        .border-top-teal {
          border-top: 4px solid #6366f1 !important;
        }
        .border-top-emerald {
          border-top: 4px solid #10b981 !important;
        }
        .border-top-rose {
          border-top: 4px solid #f43f5e !important;
        }
        .text-indigo {
          color: #6366f1 !important;
        }
        .text-emerald {
          color: #10b981 !important;
        }
        .text-rose {
          color: #f43f5e !important;
        }
        .bg-rose-subtle {
          background-color: #fff1f2 !important;
        }
        .border-rose-subtle {
          border-color: #fecdd3 !important;
        }
        .text-rose-dark {
          color: #9f1239 !important;
          font-size: 0.78rem;
        }
        .section-title {
          font-size: 0.8rem;
          letter-spacing: 0.5px;
        }
        .custom-input-group .form-control:focus {
          box-shadow: none;
          border-color: #006d77;
        }
        .custom-input-group .input-group-text {
          border-color: #dee2e6;
        }
      `}</style>
    </div>
  );
};

ClientForm.propTypes = {
  initialData: PropTypes.object,
  onSaveSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};