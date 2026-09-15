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
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* 1. Header Superior */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-zinc-900 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
              ADMINISTRACIÓN & RRHH
            </span>
            <span className="bg-zinc-100 text-zinc-800 border border-zinc-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
              {employees.length} REGISTRADOS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Colaboradores & Personal
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Directorio del personal, credenciales de acceso y asignación de roles operativos.
          </p>
        </div>

        {isAdmin && (
          <button
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-bold text-xs shadow transition-all cursor-pointer tracking-wider uppercase font-mono self-start sm:self-auto"
            onClick={() => navigate("/employees/register")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Nuevo Empleado</span>
          </button>
        )}
      </div>

      {/* 2. Barra de Búsqueda */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96 flex items-center">
          <span className="absolute left-3 text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-all font-sans"
            placeholder="Buscar por nombre, apellido, @usuario o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <span className="text-xs text-zinc-500 font-mono self-end sm:self-auto">
          Mostrando <strong>{filteredEmployees.length}</strong> de <strong>{employees.length}</strong> colaboradores
        </span>
      </div>

      {/* 3. Tabla */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/70 text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-wider">
                <th className="py-3 px-4">NOMBRE</th>
                <th className="py-3 px-4">APELLIDOS</th>
                <th className="py-3 px-4">USUARIO</th>
                <th className="py-3 px-4">TELÉFONO</th>
                <th className="py-3 px-4">CARGO</th>
                <th className="py-3 px-4 text-center">ROL</th>
                <th className="py-3 px-4 text-center">ESTADO</th>
                <th className="py-3 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6 text-zinc-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Cargando directorio de colaboradores...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-zinc-400 font-mono text-xs">
                    No se encontraron colaboradores registrados o coincidentes.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empId = emp.idEmpleado || emp.id;
                  return (
                    <tr key={empId} className="hover:bg-zinc-50/80 transition-colors">
                      {/* 1. Nombre */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            {getInitials(emp.nombre, emp.apellidos)}
                          </div>
                          <span className="font-bold text-zinc-900">
                            {emp.nombre}
                          </span>
                        </div>
                      </td>

                      {/* 2. Apellidos */}
                      <td className="py-3 px-4 text-zinc-800 font-medium">
                        {emp.apellidos || "—"}
                      </td>

                      {/* 3. Usuario */}
                      <td className="py-3 px-4 font-mono font-semibold text-zinc-600">
                        @{emp.username}
                      </td>

                      {/* 4. Teléfono */}
                      <td className="py-3 px-4 font-mono text-zinc-800">
                        {emp.numeroTelefono || <span className="text-zinc-400">—</span>}
                      </td>

                      {/* 5. Cargo */}
                      <td className="py-3 px-4 text-zinc-700">
                        {emp.cargo || "Sin cargo asignado"}
                      </td>

                      {/* 5. Rol */}
                      <td className="py-3 px-4 text-center">
                        {emp.admin ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-white uppercase">
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-300 uppercase">
                            Operativo
                          </span>
                        )}
                      </td>

                      {/* 6. Estado */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            emp.activo ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 border border-zinc-300"
                          }`}
                        >
                          {emp.activo ? "[ACTIVO]" : "[INACTIVO]"}
                        </span>
                      </td>

                      {/* 7. Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {/* Ver Detalle / Expediente */}
                          <button
                            type="button"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition-colors cursor-pointer"
                            title="Ver detalle del empleado"
                            onClick={() => navigate(`/employees/detail/${empId}`)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          {isAdmin && (
                            <>
                              {/* Editar */}
                              <button
                                type="button"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition-colors cursor-pointer"
                                title="Editar empleado"
                                onClick={() => navigate(`/employees/edit/${empId}`)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>

                              {/* Eliminar / Baja */}
                              <button
                                type="button"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition-colors cursor-pointer"
                                title="Dar de baja"
                                onClick={() => handlerDeleteEmployee(empId)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    </div>
  );
};

export default EmployeesPage;