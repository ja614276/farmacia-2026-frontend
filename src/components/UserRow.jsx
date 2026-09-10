import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import { useUsers } from "../hooks/useUsers.js";
import { useAuth } from "../auth/hooks/useAuth.js";

export const UserRow = ({ id, username, email, admin }) => {
  const { handlerRemoveUser, handlerUserSelectedForm } = useUsers();
  const { login } = useAuth();

  const onRemoveUser = () => {
    if (window.confirm(`¿Está seguro de eliminar al usuario "${username}"?`)) {
      handlerRemoveUser(id);
    }
  };

  const onSelectUser = () => {
    handlerUserSelectedForm({
      id,
      username,
      email,
      admin,
    });
  };

  return (
    <tr className="user-item-row align-middle">
      {/* 1. ID */}
      <td className="text-muted fw-semibold" style={{ fontSize: "0.8rem" }}>
        #{id}
      </td>

      {/* 2. Cuenta / Avatar */}
      <td>
        <div className="d-flex align-items-center gap-2">
          <div className="user-avatar-circle">
            {(username || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="fw-bold text-dark text-capitalize" style={{ fontSize: "0.86rem" }}>
              {username}
            </div>
            <small className="text-muted" style={{ fontSize: "0.72rem" }}>
              ID: {id}
            </small>
          </div>
        </div>
      </td>

      {/* 3. Correo Electrónico */}
      <td>
        <div className="d-flex align-items-center gap-2 text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <span style={{ fontSize: "0.84rem" }}>{email}</span>
        </div>
      </td>

      {/* 4. Rol */}
      <td>
        {admin ? (
          <span className="badge-role-admin">
            ADMINISTRADOR
          </span>
        ) : (
          <span className="badge-role-user">
            EMPLEADO
          </span>
        )}
      </td>

      {/* 5. Acciones agrupadas */}
      {login?.isAdmin && (
        <td className="text-end pe-4" style={{ whiteSpace: "nowrap" }}>
          <div className="d-inline-flex align-items-center gap-1">
            
            {/* Editar por Ruta */}
            <NavLink
              to={`/users/edit/${id}`}
              className="btn-action-icon text-secondary"
              title="Editar en página completa"
              onClick={onSelectUser}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </NavLink>

            {/* Eliminar */}
            <button
              type="button"
              className="btn-action-icon text-danger"
              title="Eliminar usuario"
              onClick={onRemoveUser}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </td>
      )}

      <style>{`
        .user-item-row:hover {
          background-color: #fbfcfd !important;
        }
        .user-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #e0f2fe;
          color: #0284c7;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .badge-role-admin {
          color: #059669;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.4px;
        }
        .badge-role-user {
          color: #0284c7;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.4px;
        }
        .btn-action-icon {
          background: transparent;
          border: none;
          padding: 5px;
          border-radius: 5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.15s;
          text-decoration: none;
        }
        .btn-action-icon:hover {
          background-color: #f1f5f9;
          transform: scale(1.1);
        }
      `}</style>
    </tr>
  );
};

UserRow.propTypes = {
  id: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  admin: PropTypes.bool,
};