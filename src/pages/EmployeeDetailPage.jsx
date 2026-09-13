import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

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
        const token = sessionStorage.getItem("token");
        const authHeader = token?.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;

        const response = await axios.get(
          `http://localhost:8080/employees/${id}`,
          {
            headers: token ? { Authorization: authHeader } : {},
          },
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-teal" role="status"></div>
        <span className="ms-2 text-muted small">
          Cargando datos del empleado...
        </span>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="bg-white border rounded-3 p-5 text-center shadow-xs">
        <div className="text-danger mb-3 fs-3">⚠️</div>
        <h5 className="fw-bold text-dark">
          {error || "Empleado no encontrado"}
        </h5>
        <button
          className="btn btn-sm btn-teal-primary mt-3"
          onClick={() => navigate("/employees")}
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="w-100 pb-5">
      {/* Cabecera Superior */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-white p-4 rounded-3 border shadow-xs">
        <div className="d-flex align-items-center gap-3">
          <div className="detail-avatar fw-bold font-monospace">
            {employee.nombre?.charAt(0)}
            {employee.apellidos?.charAt(0)}
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold text-dark m-0">
                {employee.nombre} {employee.apellidos}
              </h4>
              <span
                className={`badge rounded-pill px-2.5 py-1 ${employee.activo
                  ? "bg-teal-soft text-teal"
                  : "bg-light text-secondary border"
                  }`}
                style={{ fontSize: "0.72rem" }}
              >
                {employee.activo ? "Cuenta Habilitada" : "Inactivo"}
              </span>
            </div>
            <p className="text-muted small m-0 mt-1">
              Id: {employee.idEmpleado} | Cargo:{" "}
              <strong>{employee.cargo || "Sin cargo asignado"}</strong>
            </p>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-light border px-3 py-1.5 btn-sm fw-semibold rounded-2 text-secondary"
            onClick={() => navigate("/employees")}
          >
            ← Volver
          </button>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-teal-primary px-3 py-1.5 btn-sm fw-semibold rounded-2"
              onClick={() => navigate(`/employees/edit/${employee.idEmpleado}`)}
            >
              Editar Expediente
            </button>
          )}
        </div>
      </div>

      {/* Grid de Información Detallada */}
      <div className="row g-4">
        {/* Tarjeta 1: Datos Personales */}
        <div className="col-12 col-md-6">
          <div className="bg-white border rounded-3 p-4 h-100 shadow-xs">
            <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
              <span className="accent-bar"></span>
              <h6
                className="fw-bold text-dark m-0 text-uppercase"
                style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}
              >
                Identificación Personal
              </h6>
            </div>

            <div className="d-flex flex-column gap-3">
              <div>
                <span className="text-muted small d-block">
                  Nombres Completos
                </span>
                <span className="fw-bold text-dark">{employee.nombre}</span>
              </div>
              <div>
                <span className="text-muted small d-block">Apellidos</span>
                <span className="fw-bold text-dark">
                  {employee.apellidos || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted small d-block">
                  N° Identificación / DNI
                </span>
                <span className="font-monospace fw-bold text-dark">
                  {employee.nIdentificacion || "No registrado"}
                </span>
              </div>
              <div>
                <span className="text-muted small d-block">
                  Teléfono / Celular
                </span>
                <span className="font-monospace fw-bold text-teal">
                  {employee.numeroTelefono || "No registrado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Acceso y Credenciales */}
        <div className="col-12 col-md-6">
          <div className="bg-white border rounded-3 p-4 h-100 shadow-xs">
            <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
              <span className="accent-bar"></span>
              <h6
                className="fw-bold text-dark m-0 text-uppercase"
                style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}
              >
                Cuenta del Sistema
              </h6>
            </div>

            <div className="d-flex flex-column gap-3">
              <div>
                <span className="text-muted small d-block">
                  Nombre de Usuario
                </span>
                <span className="font-monospace fw-bold text-secondary">
                  @{employee.username}
                </span>
              </div>
              <div>
                <span className="text-muted small d-block">
                  Correo Corporativo
                </span>
                <span className="fw-semibold text-dark">{employee.email}</span>
              </div>
              <div>
                <span className="text-muted small d-block">
                  Perfil de Seguridad
                </span>
                {employee.admin ? (
                  <span className="badge bg-purple-soft text-purple border border-purple-subtle px-2 py-1">
                    Administrador (Acceso Total)
                  </span>
                ) : (
                  <span className="badge bg-light text-secondary border px-2 py-1">
                    Personal (Acceso Limitado)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Relación Laboral y Comisiones */}
        <div className="col-12">
          <div className="bg-white border rounded-3 p-4 shadow-xs">
            <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
              <span className="accent-bar"></span>
              <h6
                className="fw-bold text-dark m-0 text-uppercase"
                style={{ fontSize: "0.8rem", letterSpacing: "0.5px" }}
              >
                Contratación & Comisiones
              </h6>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <span className="text-muted small d-block">Cargo Asignado</span>
                <span className="fw-bold text-dark">
                  {employee.cargo || "Sin cargo especificado"}
                </span>
              </div>
              <div className="col-md-4">
                <span className="text-muted small d-block">
                  Fecha de Ingreso
                </span>
                <span className="fw-bold text-dark">
                  {formatDate(employee.fechaContratacion)}
                </span>
              </div>
              <div className="col-md-4">
                <span className="text-muted small d-block">
                  Comisión por Ventas
                </span>
                <span className="fw-bold text-dark font-monospace fs-5">
                  {employee.porcentajeComision
                    ? `${employee.porcentajeComision}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .accent-bar { width: 4px; height: 18px; background-color: #006d77; border-radius: 2px; display: inline-block; }
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
        }

        .detail-avatar {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background-color: #e6f4f1;
          color: #006d77;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
};
