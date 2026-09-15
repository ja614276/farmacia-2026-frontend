import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

export const PaymentMethodsPage = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    recargo: 0.0,
    activo: true,
  });

  // Base URL de la API
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // Función para obtener headers con token JWT
  const getAuthHeaders = useCallback(() => {
    let rawToken =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      sessionStorage.getItem("jwt");

    if (!rawToken) {
      const storedLogin =
        sessionStorage.getItem("login") || localStorage.getItem("login");
      if (storedLogin) {
        try {
          const parsed = JSON.parse(storedLogin);
          rawToken = parsed.token || parsed.jwt;
        } catch (e) {
          console.error("Error parseando storage:", e);
        }
      }
    }

    if (!rawToken) return { "Content-Type": "application/json" };

    const authHeader = rawToken.startsWith("Bearer ")
      ? rawToken
      : `Bearer ${rawToken}`;

    return {
      Authorization: authHeader,
      "Content-Type": "application/json",
    };
  }, []);

  // 1. READ: Obtener todas las formas de pago del backend
  const fetchPaymentMethods = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ajusta la ruta '/payment-methods' según tu controlador de Spring Boot
      const res = await axios.get(`${baseUrl}/payment-methods`, {
        headers: getAuthHeaders(),
      });
      setPaymentMethods(res.data || []);
    } catch (error) {
      console.error(
        "Error al cargar formas de pago:",
        error.response?.data || error,
      );
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, getAuthHeaders]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  // Métricas rápidas
  const totalMethods = paymentMethods.length;
  const activeMethods = paymentMethods.filter(
    (m) => m.activo ?? m.estado ?? true,
  ).length;
  const withFee = paymentMethods.filter(
  (m) => Number(m.recargoPorcentaje ?? m.recargo ?? m.porcentajeRecargo ?? 0) > 0
).length;

  // Filtrado en tiempo real
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return paymentMethods;
    const q = searchTerm.toLowerCase();
    return paymentMethods.filter(
      (m) =>
        (m.nombre || m.name || "").toLowerCase().includes(q) ||
        (m.descripcion || "").toLowerCase().includes(q),
    );
  }, [paymentMethods, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Apertura de Modal
  const handleOpenModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        nombre: method.nombre || method.name || "",
        descripcion: method.descripcion || "",
        recargo: method.recargoPorcentaje ?? method.recargo ?? 0,
        activo: method.activo ?? method.estado ?? true,
      });
    } else {
      setEditingMethod(null);
      setFormData({
        nombre: "",
        descripcion: "",
        recargo: 0.0,
        activo: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
  };

  // 2. CREATE & UPDATE: Guardar o Editar en BD
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert("El nombre de la forma de pago es requerido.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      recargoPorcentaje: Number(formData.recargo) || 0.0,
      activo: Boolean(formData.activo),
    };

    try {
      if (editingMethod) {
        // PUT /payment-methods/{id}
        const methodId = editingMethod.id || editingMethod.idFormaPago;
        await axios.put(`${baseUrl}/payment-methods/${methodId}`, payload, {
          headers: getAuthHeaders(),
        });
        alert("Forma de pago actualizada correctamente.");
      } else {
        // POST /payment-methods
        await axios.post(`${baseUrl}/payment-methods`, payload, {
          headers: getAuthHeaders(),
        });
        alert("Forma de pago creada con éxito.");
      }
      handleCloseModal();
      await fetchPaymentMethods();
    } catch (error) {
      console.error(
        "Error al persistir forma de pago:",
        error.response?.data || error,
      );
      alert(
        `Error al guardar: ${
          error.response?.data?.message ||
          error.response?.statusText ||
          error.message
        }`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. DELETE: Eliminar de BD
  const handleDelete = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar la forma de pago "${nombre}"?`,
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${baseUrl}/payment-methods/${id}`, {
        headers: getAuthHeaders(),
      });
      alert("Forma de pago eliminada.");
      await fetchPaymentMethods();
    } catch (error) {
      console.error(
        "Error al eliminar forma de pago:",
        error.response?.data || error,
      );
      alert(
        `No se pudo eliminar: ${
          error.response?.data?.message ||
          error.response?.statusText ||
          error.message
        }`,
      );
    }
  };

  // 4. TOGGLE STATUS: Alternar activo / inactivo en BD
  const handleToggleStatus = async (method) => {
    const methodId = method.id || method.idFormaPago;
    const nuevoEstado = !(method.activo ?? method.estado ?? true);

    try {
      // Si tu backend tiene endpoint específico (ej: PATCH /status), puedes cambiarlo aquí
      await axios.put(
        `${baseUrl}/payment-methods/${methodId}`,
        {
          ...method,
          activo: nuevoEstado,
        },
        { headers: getAuthHeaders() },
      );
      // Actualización optimista inmediata en UI
      setPaymentMethods((prev) =>
        prev.map((item) => {
          const currentId = item.id || item.idFormaPago;
          return currentId === methodId
            ? { ...item, activo: nuevoEstado }
            : item;
        }),
      );
    } catch (error) {
      console.error("Error al alternar estado:", error.response?.data || error);
      alert("No se pudo actualizar el estado.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Header Principal */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-zinc-900 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
              CAJA Y FINANZAS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Formas de Pago
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Configuración de canales de cobranza, recargos por comisión y disponibilidad en el POS.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-bold text-xs shadow transition-all cursor-pointer tracking-wider uppercase font-mono self-start sm:self-auto"
          onClick={() => handleOpenModal()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
          <span>Nuevo Método</span>
        </button>
      </div>

      {/* 2. Tarjetas de Resumen KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
              [#] Total Registrados
            </span>
            <span className="text-2xl font-bold text-zinc-900 font-mono tracking-tight mt-1 block">
              {totalMethods}
            </span>
            <span className="inline-block mt-1 text-[10px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
              Canales registrados
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
              [✓] Activos en Caja
            </span>
            <span className="text-2xl font-bold text-zinc-900 font-mono tracking-tight mt-1 block">
              {activeMethods}
            </span>
            <span className="inline-block mt-1 text-[10px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
              Disponibles para venta
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
              [%] Con Recargo / Comisión
            </span>
            <span className="text-2xl font-bold text-zinc-900 font-mono tracking-tight mt-1 block">
              {withFee}
            </span>
            <span className="inline-block mt-1 text-[10px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
              Con tarifa adicional
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96 flex items-center">
          <span className="absolute left-3 text-zinc-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-all font-sans"
            placeholder="Buscar por método o descripción..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
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

        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono self-end sm:self-auto">
          <span>Mostrar:</span>
          <select
            className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg font-bold text-zinc-800 focus:outline-none text-xs"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* 4. Tabla de Formas de Pago */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/70 text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-wider">
                <th className="py-3 px-5" style={{ width: "30%" }}>MÉTODO DE PAGO</th>
                <th className="py-3 px-5" style={{ width: "34%" }}>DESCRIPCIÓN</th>
                <th className="py-3 px-5 text-center" style={{ width: "16%" }}>
                  RECARGO (%)
                </th>
                <th className="py-3 px-5 text-center" style={{ width: "10%" }}>
                  ESTADO
                </th>
                <th className="py-3 px-5 text-right" style={{ width: "10%" }}>
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-20 text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6 text-zinc-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Consultando métodos de pago...</span>
                    </div>
                  </td>
                </tr>
              ) : currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-zinc-400">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">No se encontraron métodos de pago registrados.</span>
                  </td>
                </tr>
              ) : (
                currentRecords.map((method) => {
                  const methodId = method.id || method.idFormaPago;
                  const fee = Number(
                    method.recargoPorcentaje ??
                      method.recargo ??
                      method.porcentajeRecargo ??
                      0,
                  );
                  const isActivo = Boolean(
                    method.activo ?? method.estado ?? true,
                  );

                  return (
                    <tr key={methodId} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Nombre */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center justify-center flex-shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect width="20" height="14" x="2" y="5" rx="2" />
                              <line x1="2" x2="22" y1="10" y2="10" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block text-xs">
                              {method.nombre || method.name}
                            </span>
                            <span className="text-zinc-400 font-mono text-[10px]">
                              ID: #{methodId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Descripción */}
                      <td className="py-3 px-5">
                        <span className="text-zinc-600 text-xs">
                          {method.descripcion ? method.descripcion : "—"}
                        </span>
                      </td>

                      {/* Recargo (%) */}
                      <td className="py-3 px-5 text-center">
                        {fee > 0 ? (
                          <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-xs">
                            +{fee.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="font-mono text-zinc-400 text-xs">
                            0.00%
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(method)}
                          className={`border-0 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all ${
                            isActivo
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-100 text-zinc-600 border border-zinc-300"
                          }`}
                          title="Hacer clic para alternar estado"
                        >
                          {isActivo ? "[ACTIVO]" : "[INACTIVO]"}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition-colors"
                            title="Editar forma de pago"
                            onClick={() => handleOpenModal(method)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition-colors"
                            title="Eliminar forma de pago"
                            onClick={() =>
                              handleDelete(
                                methodId,
                                method.nombre || method.name,
                              )
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Paginación */}
        <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <span>
            Mostrando {filtered.length === 0 ? 0 : startIndex + 1} a{" "}
            {Math.min(startIndex + itemsPerPage, filtered.length)} de{" "}
            {filtered.length} métodos
          </span>

          <div className="flex items-center gap-1.5">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              &lt;
            </button>
            <span className="px-3 py-1 rounded-xl bg-[#09090b] text-white font-bold text-xs">
              Pág. {currentPage} de {totalPages}
            </span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 6. Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-sm text-zinc-900 uppercase font-mono tracking-wider">
                {editingMethod ? "Editar Forma de Pago" : "Nueva Forma de Pago"}
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-600 mb-1.5 uppercase">
                  NOMBRE DEL MÉTODO <span className="text-zinc-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 transition-all font-sans"
                  placeholder="Ej: Yape / Plin, Tarjeta Débito..."
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-600 mb-1.5 uppercase">
                  DESCRIPCIÓN
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl font-medium text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 transition-all font-sans"
                  placeholder="Detalles de uso o indicaciones para caja..."
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-600 mb-1.5 uppercase">
                    RECARGO (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full pl-3 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl font-bold font-mono text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-900 transition-all"
                      value={formData.recargo}
                      onChange={(e) =>
                        setFormData({ ...formData, recargo: e.target.value })
                      }
                    />
                    <span className="absolute right-3 top-2 text-xs font-mono text-zinc-400 font-bold">
                      %
                    </span>
                  </div>
                </div>

                <div className="pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      checked={formData.activo}
                      onChange={(e) =>
                        setFormData({ ...formData, activo: e.target.checked })
                      }
                    />
                    <span className="text-xs font-mono font-bold text-zinc-800 uppercase">
                      {formData.activo ? "[ACTIVO]" : "[INACTIVO]"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-medium text-xs transition-colors cursor-pointer"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-semibold text-xs shadow transition-all disabled:opacity-50 cursor-pointer font-mono"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Guardando..."
                    : editingMethod
                      ? "Guardar Cambios"
                      : "Crear Método"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsPage;
