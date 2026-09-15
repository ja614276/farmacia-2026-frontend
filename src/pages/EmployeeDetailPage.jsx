import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { getStoredToken } from "../auth/utils/tokenUtils";

export const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useSelector((state) => state.auth);

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const token = getStoredToken();
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

        const response = await axios.get(
          `${baseUrl}/employees/${id}`,
          {
            headers: token ? { Authorization: token } : {},
          }
        );
        setEmployee(response.data);
      } catch (err) {
        console.error("Error al cargar detalle del empleado:", err);
        setError("No se pudo cargar la información del colaborador.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "No registrada";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getInitials = (nombre = "", apellidos = "") => {
    const n = nombre.trim().charAt(0) || "";
    const a = apellidos.trim().charAt(0) || "";
    return (n + a).toUpperCase() || "EM";
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-7 w-7 text-zinc-900" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          Cargando expediente del colaborador...
        </span>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-xl mx-auto bg-white border border-zinc-200 rounded-2xl p-8 text-center shadow-sm my-10">
        <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 mb-3 text-xl font-bold">
          !
        </div>
        <h2 className="text-lg font-bold text-zinc-900 mb-1">
          {error || "Empleado no encontrado"}
        </h2>
        <p className="text-xs text-zinc-500 font-mono mb-5">
          El registro solicitado no existe o no tiene permisos para visualizarlo.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-mono font-bold rounded-xl shadow transition-all uppercase tracking-wider"
          onClick={() => navigate("/employees")}
        >
          Volver a Colaboradores
        </button>
      </div>
    );
  }

  const empId = employee.idEmpleado || employee.id || id;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
        <span
          className="hover:text-zinc-900 cursor-pointer transition-colors"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </span>
        <span>/</span>
        <span
          className="hover:text-zinc-900 cursor-pointer transition-colors"
          onClick={() => navigate("/employees")}
        >
          Colaboradores
        </span>
        <span>/</span>
        <span className="text-zinc-950 font-bold">Expediente #{empId}</span>
      </div>

      {/* 2. Header Superior del Expediente */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-white font-mono font-bold text-lg flex items-center justify-center shadow-sm flex-shrink-0">
            {getInitials(employee.nombre, employee.apellidos)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <span className="bg-zinc-900 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                ID #{empId}
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  employee.activo
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-500 border border-zinc-300"
                }`}
              >
                {employee.activo ? "[CUENTA ACTIVA]" : "[INACTIVO]"}
              </span>
              {employee.admin && (
                <span className="bg-zinc-100 text-zinc-800 border border-zinc-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  ADMINISTRADOR
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              {employee.nombre} {employee.apellidos}
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Cargo: <strong className="text-zinc-800 font-semibold">{employee.cargo || "Sin cargo asignado"}</strong> • Usuario: <span className="text-zinc-700 font-semibold">@{employee.username}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 shadow-xs transition-all cursor-pointer"
            onClick={() => navigate("/employees")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Volver</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-mono font-bold text-xs shadow transition-all cursor-pointer tracking-wider uppercase"
              onClick={() => navigate(`/employees/edit/${empId}`)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Editar Expediente</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Grid de Secciones de Información */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta 1: Identificación Personal */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                Identificación Personal
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">DATOS GENERALES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Nombres</span>
              <span className="font-semibold text-zinc-900 text-sm mt-0.5 block">
                {employee.nombre || "—"}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Apellidos</span>
              <span className="font-semibold text-zinc-900 text-sm mt-0.5 block">
                {employee.apellidos || "—"}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">N° Identificación / DNI</span>
              <span className="font-mono font-semibold text-zinc-900 text-sm mt-0.5 block">
                {employee.nIdentificacion || "No registrado"}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Teléfono / Celular</span>
              <span className="font-mono font-semibold text-zinc-900 text-sm mt-0.5 block">
                {employee.numeroTelefono || "No registrado"}
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Cuenta del Sistema & Credenciales */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                Credenciales & Acceso
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">SEGURIDAD</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Nombre de Usuario</span>
              <span className="font-mono font-bold text-zinc-900 text-sm mt-0.5 block">
                @{employee.username}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Correo Electrónico</span>
              <span className="font-medium text-zinc-900 text-sm mt-0.5 block break-all">
                {employee.email || "No registrado"}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-zinc-400 font-mono text-[11px] block uppercase mb-1.5">Perfil de Acceso</span>
              {employee.admin ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 text-white font-mono text-xs font-bold">
                  <span>●</span>
                  <span>ADMINISTRADOR (ACCESO TOTAL AL SISTEMA)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-300 font-mono text-xs font-bold">
                  <span>○</span>
                  <span>OPERATIVO / CAJERO (ACCESO LIMITADO)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Relación Laboral & Remuneración */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                Relación Laboral & Comisiones
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">CONDICIONES CONTRACTUALES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Cargo Asignado</span>
              <span className="font-semibold text-zinc-900 text-base mt-0.5 block">
                {employee.cargo || "Sin cargo especificado"}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Fecha de Contratación</span>
              <span className="font-semibold text-zinc-900 text-base mt-0.5 block">
                {formatDate(employee.fechaContratacion)}
              </span>
            </div>

            <div>
              <span className="text-zinc-400 font-mono text-[11px] block uppercase">Comisión por Ventas</span>
              <span className="font-mono font-black text-zinc-900 text-base mt-0.5 block">
                {employee.porcentajeComision ? `${employee.porcentajeComision}%` : "0.0%"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
