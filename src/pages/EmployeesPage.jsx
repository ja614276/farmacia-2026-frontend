import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEmployees } from "../hooks/useEmployees";

export const EmployeesPage = () => {
  const { employees = [], handlerDeleteEmployee, loading } = useEmployees();
  const { isAdmin } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    const nombre = (emp.nombre || "").toLowerCase();
    const apellidos = (emp.apellidos || "").toLowerCase();
    const user = (emp.username || "").toLowerCase();
    const cargo = (emp.cargo || "").toLowerCase();
    const roleText = emp.admin ? "administrador" : "personal operativo cajero";

    return (
      nombre.includes(term) ||
      apellidos.includes(term) ||
      user.includes(term) ||
      cargo.includes(term) ||
      roleText.includes(term)
    );
  });

  const getInitials = (nombre = "", apellidos = "") => {
    const n = nombre.trim().charAt(0) || "";
    const a = apellidos.trim().charAt(0) || "";
    return (n + a).toUpperCase() || "EM";
  };

  return (
    <div className="w-100 pb-5">
      {/* 1. Header Superior */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-white p-4 rounded-3 shadow-xs border">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="accent-bar"></span>
            <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: "-0.3px" }}>
              Colaboradores & Personal
            </h4>
            <span className="badge bg-teal-soft text-teal font-monospace px-2 py-1" style={{ fontSize: "0.75rem" }}>
              {employees.length} REGISTRADOS
            </span>
          </div>
          <p className="text-muted small m-0 mt-1 ms-3 ps-1">
            Directorio del personal, credenciales de acceso y asignación operativa.
          </p>
        </div>

        {isAdmin && (
          <button
            className="btn btn-teal-primary px-3 py-2 fw-semibold btn-sm rounded-2 d-flex align-items-center gap-2 shadow-xs"
            onClick={() => navigate("/employees/register")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Empleado
          </button>
        )}
      </div>

      {/* 2. Barra de Búsqueda */}
      <div className="bg-white p-3 rounded-3 border mb-3 shadow-xs d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="input-group input-group-sm" style={{ maxWidth: "380px" }}>
          <span className="input-group-text bg-light border-end-0 text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Buscar por nombre, apellido, @usuario o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <span className="text-muted small">
          Mostrando <strong>{filteredEmployees.length}</strong> de <strong>{employees.length}</strong> colaboradores
        </span>
      </div>

      {/* 3. Tabla (7 Columnas Solicitadas) */}
      <div className="bg-white rounded-3 border shadow-xs overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.85rem" }}>
            <thead className="table-light border-bottom text-secondary" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>
              <tr>
                <th className="py-3 px-3 text-uppercase">Nombre</th>
                <th className="py-3 px-3 text-uppercase">Apellidos</th>
                <th className="py-3 px-3 text-uppercase">Usuario</th>
                <th className="py-3 px-3 text-uppercase">Cargo</th>
                <th className="py-3 px-3 text-uppercase">Rol</th>
                <th className="py-3 px-3 text-uppercase text-center">Estado</th>
                <th className="py-3 px-3 text-uppercase text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-teal me-2" role="status"></div>
                    Cargando expediente de colaboradores...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No se encontraron empleados registrados o coincidentes.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empId = emp.idEmpleado || emp.id;
                  return (
                    <tr key={empId}>
                      {/* 1. Nombre con avatar */}
                      <td className="px-3 py-2.5">
                        <div className="d-flex align-items-center gap-2.5">
                          <span className="fw-bold text-dark">
                            {emp.nombre}
                          </span>
                        </div>
                      </td>

                      {/* 2. Apellidos */}
                      <td className="px-3 fw-semibold text-dark">
                        {emp.apellidos || "—"}
                      </td>

                      {/* 3. Usuario */}
                      <td className="px-3 font-monospace text-secondary fw-semibold">
                        @{emp.username}
                      </td>

                      {/* 4. Cargo */}
                      <td className="px-3 text-dark">
                        {emp.cargo || "Sin cargo asignado"}
                      </td>

                      {/* 5. Rol */}
                      <td className="px-3">
                        {emp.admin ? (
                          <span className="badge bg-purple-soft text-purple border border-purple-subtle px-2 py-1">
                            Administrador
                          </span>
                        ) : (
                          <span className="badge bg-light text-secondary border px-2 py-1">
                            Personal
                          </span>
                        )}
                      </td>

                      {/* 6. Estado */}
                      <td className="px-3 text-center">
                        <span
                          className={`badge rounded-pill px-2.5 py-1 ${
                            emp.activo ? "bg-teal-soft text-teal" : "bg-light text-secondary border"
                          }`}
                          style={{ fontSize: "0.72rem" }}
                        >
                          {emp.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* 7. Acciones */}
                      <td className="px-3 text-end">
                        <div className="btn-group btn-group-sm">
                          {/* Ver Detalle / Expediente */}
                          <button
                            type="button"
                            className="btn btn-light border text-teal action-btn"
                            title="Ver detalle del empleado"
                            onClick={() => navigate(`/employees/detail/${empId}`)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          {isAdmin && (
                            <>
                              {/* Editar */}
                              <button
                                type="button"
                                className="btn btn-light border text-secondary action-btn"
                                title="Editar empleado"
                                onClick={() => navigate(`/employees/edit/${empId}`)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>

                              {/* Eliminar / Baja */}
                              <button
                                type="button"
                                className="btn btn-light border text-danger action-btn"
                                title="Dar de baja"
                                onClick={() => handlerDeleteEmployee(empId)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .accent-bar {
          width: 4px;
          height: 20px;
          background-color: #006d77;
          border-radius: 2px;
          display: inline-block;
        }
        .text-teal { color: #006d77 !important; }
        .bg-teal-soft { background-color: #e6f4f1 !important; }
        
        .text-purple { color: #5b21b6 !important; }
        .bg-purple-soft { background-color: #f5f3ff !important; }
        .border-purple-subtle { border-color: #ddd6fe !important; }

        .btn-teal-primary {
          background-color: #006d77;
          color: #ffffff;
          border: none;
          transition: all 0.15s ease;
        }
        .btn-teal-primary:hover {
          background-color: #084c53;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .employee-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background-color: #e6f4f1;
          color: #006d77;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          flex-shrink: 0;
        }

        .action-btn {
          padding: 4px 8px;
          transition: background-color 0.15s ease;
        }
        .action-btn:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
};

export default EmployeesPage;