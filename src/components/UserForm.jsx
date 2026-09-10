import { useEffect, useState } from "react";
import { useUsers } from "../hooks/useUsers";

export const UserForm = ({ userSelected, handlerCloseForm }) => {
  const { initialUserForm, handlerAddUser, errors } = useUsers();

  const [userForm, setUserForm] = useState(initialUserForm);
  const [checked, setChecked] = useState(userForm.admin);
  const { id, username, password, email, admin } = userForm;

  useEffect(() => {
    setUserForm({
      ...userSelected,
      password: "",
    });
  }, [userSelected]);

  const onInputChange = ({ target }) => {
    const { name, value } = target;
    setUserForm({
      ...userForm,
      [name]: value,
    });
  };

  const onCheckboxChange = () => {
    setChecked(!checked);
    setUserForm({
      ...userForm,
      admin: !checked,
    });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    handlerAddUser(userForm);
  };

  const onCloseForm = () => {
    if (handlerCloseForm) {
      handlerCloseForm();
    }
    setUserForm(initialUserForm);
  };

  const isEditing = id > 0;

  return (
    <div className="w-100 bg-white border rounded-3 p-4 p-md-5 user-form-container">
      {/* Cabecera Limpia (Sin botón duplicado arriba) */}
      <div className="pb-4 mb-4 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <span className="accent-bar"></span>
          <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: "-0.3px" }}>
            {isEditing ? "Editar Usuario" : "Registrar Usuario"}
          </h4>
          <span
            className={`badge fw-bold font-monospace ${
              isEditing ? "bg-amber-soft text-amber" : "bg-teal-soft text-teal"
            }`}
            style={{ fontSize: "0.72rem" }}
          >
            {isEditing ? `ID: #${id}` : "NUEVO"}
          </span>
        </div>
        <p className="text-muted small m-0 mt-1 ms-3 ps-1">
          {isEditing
            ? `Actualización de credenciales y permisos para el usuario: ${username || ""}`
            : "Ingrese la información requerida para dar de alta un nuevo acceso al sistema."}
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={onSubmit}>
        <input type="hidden" name="id" value={id || 0} />

        <div className="row g-4">
          {/* Nombre de Usuario */}
          <div className="col-md-6">
            <label
              className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1"
              style={{ fontSize: "0.74rem", letterSpacing: "0.4px" }}
            >
              Nombre de Usuario *
            </label>
            <input
              type="text"
              className={`form-control modern-input ${errors?.username ? "is-invalid" : ""}`}
              placeholder="Ej. Abigail"
              name="username"
              value={username || ""}
              onChange={onInputChange}
            />
            {errors?.username && (
              <div className="text-danger small mt-1" style={{ fontSize: "0.75rem" }}>
                • {errors.username}
              </div>
            )}
          </div>

          {/* Correo Electrónico */}
          <div className="col-md-6">
            <label
              className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1"
              style={{ fontSize: "0.74rem", letterSpacing: "0.4px" }}
            >
              Correo Electrónico *
            </label>
            <input
              type="email"
              className={`form-control modern-input ${errors?.email ? "is-invalid" : ""}`}
              placeholder="ejemplo@farmacia.com"
              name="email"
              value={email || ""}
              onChange={onInputChange}
            />
            {errors?.email && (
              <div className="text-danger small mt-1" style={{ fontSize: "0.75rem" }}>
                • {errors.email}
              </div>
            )}
          </div>

          {/* Contraseña (solo en creación) */}
          {isEditing || (
            <div className="col-md-6">
              <label
                className="form-label text-dark-emphasis small fw-bold text-uppercase mb-1"
                style={{ fontSize: "0.74rem", letterSpacing: "0.4px" }}
              >
                Contraseña *
              </label>
              <input
                type="password"
                className={`form-control modern-input ${errors?.password ? "is-invalid" : ""}`}
                placeholder="••••••••"
                name="password"
                value={password || ""}
                onChange={onInputChange}
              />
              {errors?.password && (
                <div className="text-danger small mt-1" style={{ fontSize: "0.75rem" }}>
                  • {errors.password}
                </div>
              )}
            </div>
          )}

          {/* Permiso de Administrador */}
          <div className="col-md-6 d-flex align-items-center">
            <div
              className={`p-3 border rounded-3 w-100 ${isEditing ? "" : "mt-md-3"} ${
                admin ? "role-box-active" : "role-box-default"
              }`}
            >
              <div className="form-check m-0 d-flex align-items-start gap-2">
                <input
                  type="checkbox"
                  name="admin"
                  id="adminCheckbox"
                  checked={admin || false}
                  className="form-check-input custom-checkbox mt-1"
                  onChange={onCheckboxChange}
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
                    {admin
                      ? "Privilegios habilitados para gestión general, catálogo y finanzas."
                      : "Acceso estándar limitado a ventas (POS) y consulta de stock."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones: Único punto de decisión */}
        <div className="d-flex justify-content-end align-items-center gap-2 mt-5 pt-3 border-top">
          {handlerCloseForm && (
            <button
              type="button"
              className="btn btn-light border px-4 py-2 text-secondary fw-semibold btn-sm rounded-2"
              onClick={onCloseForm}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="btn btn-teal-submit px-4 py-2 fw-semibold btn-sm rounded-2 shadow-xs"
            style={{ minWidth: "130px" }}
          >
            {isEditing ? "Guardar Cambios" : "Crear Usuario"}
          </button>
        </div>
      </form>

      {/* Estilos */}
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
          padding: 9px 12px;
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
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};