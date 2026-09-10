import { useState, useEffect } from "react";
import axios from "axios";

export const initialEmployeeForm = {
  idEmpleado: 0,
  nombre: "",
  apellidos: "",
  nIdentificacion: "",
  cargo: "",
  porcentajeComision: 0,
  fechaContratacion: "",
  activo: true,
  username: "",
  email: "",
  password: "",
  admin: false,
};

export const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // Función robusta para obtener el token desde cualquier parte del Storage
  const getHeaders = () => {
    let token = sessionStorage.getItem("token") || localStorage.getItem("token");

    // Si tu sistema guarda el estado de auth en un JSON serializado (como se ve en useAuth)
    if (!token) {
      try {
        const loginData = JSON.parse(
          sessionStorage.getItem("login") || localStorage.getItem("login") || "{}"
        );
        token = loginData?.token;
      } catch (e) {
        console.error("Error al leer token de login:", e);
      }
    }

    if (!token) {
      console.warn("⚠️ [useEmployees] No se detectó token en sessionStorage ni localStorage.");
      return {};
    }

    // Asegurar prefijo Bearer
    const authValue = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    return {
      Authorization: authValue,
      "Content-Type": "application/json",
    };
  };

  const getEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/employees`, {
        headers: getHeaders(),
      });
      setEmployees(response.data);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEmployees();
  }, []);

  const handlerAddEmployee = async (employee, idFromParam) => {
    try {
      let response;
      // Detección exhaustiva del ID: parámetro directo, idEmpleado o id
      const targetId = idFromParam || employee.idEmpleado || employee.id;

      const headers = getHeaders();
      console.log("🚀 [handlerAddEmployee] targetId:", targetId);
      console.log("🚀 [handlerAddEmployee] Headers enviados:", headers);

      if (targetId && Number(targetId) > 0) {
        // --- EDICIÓN (PUT /employees/{id}) ---
        console.log(`Enviando PUT a ${baseUrl}/employees/${targetId}`);
        response = await axios.put(
          `${baseUrl}/employees/${targetId}`,
          employee,
          { headers }
        );

        setEmployees((prev) =>
          prev.map((e) => {
            const currentId = e.idEmpleado || e.id;
            const updatedId = response.data.idEmpleado || response.data.id;
            return currentId === updatedId ? response.data : e;
          })
        );
      } else {
        // --- CREACIÓN (POST /employees) ---
        console.log(`Enviando POST a ${baseUrl}/employees`);
        response = await axios.post(`${baseUrl}/employees`, employee, {
          headers,
        });

        setEmployees((prev) => [...prev, response.data]);
      }
      return true;
    } catch (error) {
      console.error("Error al guardar empleado:", error.response?.data || error);
      throw error;
    }
  };

  const handlerDeleteEmployee = async (id) => {
    if (!window.confirm("¿Está seguro de dar de baja a este colaborador?")) {
      return;
    }
    try {
      await axios.delete(`${baseUrl}/employees/${id}`, {
        headers: getHeaders(),
      });
      setEmployees((prev) =>
        prev.filter((e) => (e.idEmpleado || e.id) !== id)
      );
    } catch (error) {
      console.error("Error al eliminar empleado:", error);
    }
  };

  return {
    employees,
    initialEmployeeForm,
    loading,
    getEmployees,
    handlerAddEmployee,
    handlerDeleteEmployee,
  };
};