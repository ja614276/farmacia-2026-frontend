import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { UserRow } from "./UserRow.jsx";
import { useUsers } from "../hooks/useUsers.js";
import { useAuth } from "../auth/hooks/useAuth.js";

export const UserList = ({ onOpenUserModal }) => {
  const { users = [], handlerUserSelectedForm } = useUsers();
  const { login } = useAuth();
  
  // Estados de control para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 1. Filtrado reactivo en memoria
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lower = searchTerm.toLowerCase();
    return users.filter((u) => {
      const username = (u.username || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return username.includes(lower) || email.includes(lower);
    });
  }, [users, searchTerm]);

  // Reiniciar a la página 1 cuando el usuario busca algo
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // 2. Cálculo de paginación limpia
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const startRecord = filteredUsers.length === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + itemsPerPage, filteredUsers.length);

  return (
    <div className="catalogo-wrapper bg-light min-vh-100 py-4 px-3 px-md-5 w-100">
      {/* 1. Header principal */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <div>
            <h3 className="m-0 fw-bolder text-dark">Lista de Usuarios</h3>
            <p className="text-secondary m-0 small">
              Control de cuentas del personal, accesos y roles del sistema
            </p>
          </div>
        </div>

        {login?.isAdmin && (
          <button
            type="button"
            className="btn btn-teal-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm shadow-sm"
            onClick={() => {
              if (handlerUserSelectedForm) {
                handlerUserSelectedForm({
                  id: 0,
                  username: "",
                  password: "",
                  email: "",
                  admin: false,
                });
              }
              if (onOpenUserModal) {
                onOpenUserModal();
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* 2. Barra de búsqueda y contador */}
      <div className="bg-white rounded-3 p-3 mb-4 shadow-sm d-flex flex-wrap justify-content-between align-items-center gap-3 border">
        <div
          className="search-box-custom d-flex align-items-center flex-grow-1"
          style={{ maxWidth: "450px" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="me-2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="form-control border-0 p-0 shadow-none"
            placeholder="Buscar por usuario o correo..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Selector de cantidad por página estilizado */}
          <div className="d-flex align-items-center gap-2 text-secondary small fw-medium">
            <span>Mostrar</span>
            <select
              className="form-select form-select-sm select-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="d-flex align-items-center gap-2 text-muted small fw-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <span>{filteredUsers.length} USUARIOS</span>
          </div>
        </div>
      </div>

      {/* 3. Tabla principal */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden w-100">
        <div className="table-responsive w-100">
          <table className="table table-hover align-middle mb-0 custom-catalog-table w-100">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>#</th>
                <th style={{ width: "32%" }}>USUARIO</th>
                <th style={{ width: "32%" }}>CORREO ELECTRÓNICO</th>
                <th style={{ width: "16%" }}>ROL</th>
                {login?.isAdmin && (
                  <th style={{ width: "12%" }} className="text-end pe-4">
                    ACCIONES
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={login?.isAdmin ? 5 : 4} className="text-center py-5 text-muted">
                    No se encontraron usuarios coincidentes.
                  </td>
                </tr>
              ) : (
                currentUsers.map(({ id, username, email, admin }) => (
                  <UserRow
                    key={id}
                    id={id}
                    username={username}
                    email={email}
                    admin={admin}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Footer con Paginación Moderna */}
        <div className="d-flex flex-wrap justify-content-between align-items-center px-4 py-3 bg-white border-top gap-3">
          <small className="text-muted fw-semibold">
            Mostrando <span className="text-dark fw-bold">{startRecord}</span> a{" "}
            <span className="text-dark fw-bold">{endRecord}</span> de{" "}
            <span className="text-dark fw-bold">{filteredUsers.length}</span> usuarios
          </small>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="Primera página"
            >
              &laquo;
            </button>

            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                return (
                  <span key={page} className="d-inline-flex align-items-center">
                    {prevPage && page - prevPage > 1 && (
                      <span className="px-1 text-muted">...</span>
                    )}
                    <button
                      type="button"
                      className={`btn-page-number ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Siguiente
            </button>

            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Última página"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* Estilos */}
      <style>{`
        .catalogo-wrapper {
          background-color: #f8fafc;
        }
        .pill-badge-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: #e6f4f1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-teal-primary {
          background-color: #006d77;
          color: #fff;
          border: none;
          transition: 0.2s;
        }
        .btn-teal-primary:hover {
          background-color: #0b525b;
          color: #fff;
        }
        .search-box-custom {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 14px;
          border-radius: 8px;
        }
        .search-box-custom input {
          background: transparent;
          font-size: 0.9rem;
          color: #334155;
        }
        .select-per-page {
          width: 65px;
          border-color: #e2e8f0;
          color: #334155;
          cursor: pointer;
        }
        .custom-catalog-table thead th {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          padding: 16px 20px;
          border-bottom: 1px solid #edf2f7;
          background-color: #ffffff;
        }
        .custom-catalog-table tbody td {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.85rem;
          vertical-align: middle;
        }
        .btn-page-nav {
          background-color: #fff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.15s;
        }
        .btn-page-nav:hover:not(:disabled) {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }
        .btn-page-nav:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .btn-page-number {
          background-color: #fff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 600;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin: 0 2px;
          transition: 0.15s;
        }
        .btn-page-number:hover {
          background-color: #f1f5f9;
        }
        .btn-page-number.active {
          background-color: #006d77;
          border-color: #006d77;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

UserList.propTypes = {
  onOpenUserModal: PropTypes.func,
};