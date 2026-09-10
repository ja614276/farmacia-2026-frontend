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
    // Si formId no viene, usamos obligatoriamente el id de la URL
    const targetId = formId && Number(formId) > 0 ? formId : id;

    console.log("📌 Submitting empleado con targetId:", targetId);

    await handlerAddEmployee(payload, targetId);
    navigate("/employees");
  };

  const handleCancel = () => {
    navigate("/employees");
  };

  if (fetching) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 bg-white border rounded-3">
        <div className="spinner-border spinner-border-sm text-teal me-2" role="status"></div>
        <span className="text-muted small">Cargando expediente para edición...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <EmployeeForm
        initialData={employeeSelected}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default EmployeesRegisterPage;