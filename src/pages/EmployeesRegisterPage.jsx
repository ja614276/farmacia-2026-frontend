import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEmployees } from "../hooks/useEmployees";
import { EmployeeForm } from "../components/EmployeeForm";

export const EmployeesRegisterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employees = [], handlerAddEmployee } = useEmployees();

  const [employeeSelected, setEmployeeSelected] = useState(null);
  const [fetching, setFetching] = useState(Boolean(id));

  useEffect(() => {
    if (id) {
      // 1. Buscar en la lista en memoria
      const emp = employees.find(
        (e) => String(e.idEmpleado) === String(id) || String(e.id) === String(id)
      );

      if (emp) {
        setEmployeeSelected(emp);
        setFetching(false);
      } else {
        // 2. Si se recarga la página (F5), consultar al backend
        const fetchById = async () => {
          try {
            const token = sessionStorage.getItem("token");
            const authHeader = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;
            const response = await fetch(`http://localhost:8080/employees/${id}`, {
              headers: token ? { Authorization: authHeader } : {},
            });

            if (response.ok) {
              const data = await response.json();
              setEmployeeSelected(data);
            } else {
              console.error("No se pudo cargar el empleado con id:", id);
            }
          } catch (error) {
            console.error("Error al obtener empleado para editar:", error);
          } finally {
            setFetching(false);
          }
        };

        fetchById();
      }
    } else {
      setEmployeeSelected(null);
      setFetching(false);
    }
  }, [id, employees]);

  const handleSubmit = async (payload, formId) => {
    const targetId = formId && Number(formId) > 0 ? formId : id;
    await handlerAddEmployee(payload, targetId);
    navigate("/employees");
  };

  const handleCancel = () => {
    navigate("/employees");
  };

  if (fetching) {
    return (
      <div className="w-full min-h-[350px] flex flex-col items-center justify-center gap-3 bg-white border border-zinc-200 rounded-2xl p-10">
        <svg className="animate-spin h-6 w-6 text-zinc-900" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          Cargando expediente para edición...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Breadcrumbs */}
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
        <span className="text-zinc-950 font-bold">
          {id ? `Editar #${id}` : "Nuevo Colaborador"}
        </span>
      </div>

      <EmployeeForm
        initialData={employeeSelected}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EmployeesRegisterPage;