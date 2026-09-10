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
    <div className="container-fluid py-4 px-3 px-md-5 bg-light min-vh-100">
      {/* 1. Header Principal */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            
            <span className="badge bg-teal-subtle text-teal fw-bold font-monospace">
              CAJA Y FINANZAS
            </span>
            <h3 className="m-0 fw-bolder text-dark">Formas de Pago</h3>
          </div>
          <p className="text-secondary m-0 small mt-1">
            Configuración de canales de cobranza, recargos por comisión y
            disponibilidad en el POS.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-teal-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-2 shadow-sm"
          onClick={() => handleOpenModal()}
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
          Nuevo Método
        </button>
      </div>

      {/* 2. Tarjetas de Resumen */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold d-block text-uppercase">
                  Total Registrados
                </span>
                <span className="fs-4 fw-bolder text-dark">{totalMethods}</span>
              </div>
              <div className="icon-metric bg-teal-subtle text-teal">
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
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold d-block text-uppercase">
                  Activos en Caja
                </span>
                <span className="fs-4 fw-bolder text-success">
                  {activeMethods}
                </span>
              </div>
              <div className="icon-metric bg-success-subtle text-success">
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
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold d-block text-uppercase">
                  Con Recargo / Comisión
                </span>
                <span className="fs-4 fw-bolder text-amber">{withFee}</span>
              </div>
              <div className="icon-metric bg-amber-subtle text-amber">
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
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white rounded-3 p-3 mb-3 shadow-sm border d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div
          className="d-flex align-items-center flex-grow-1 search-container"
          style={{ maxWidth: "420px" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            className="me-2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="form-control border-0 p-0 shadow-none bg-transparent"
            placeholder="Buscar por método o descripción..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="d-flex align-items-center gap-2 text-secondary small fw-medium">
          <span>Mostrar:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: "70px" }}
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
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 custom-payment-table">
            <thead className="table-light">
              <tr>
                <th style={{ width: "28%" }}>MÉTODO DE PAGO</th>
                <th style={{ width: "34%" }}>DESCRIPCIÓN</th>
                <th style={{ width: "16%" }} className="text-center">
                  RECARGO (%)
                </th>
                <th style={{ width: "12%" }} className="text-center">
                  ESTADO
                </th>
                <th style={{ width: "10%" }} className="text-end pe-4">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted small">
                    <div
                      className="spinner-border spinner-border-sm text-teal me-2"
                      role="status"
                    ></div>
                    Consultando métodos de pago en el servidor...
                  </td>
                </tr>
              ) : currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted small">
                    No se encontraron métodos de pago registrados.
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
                    <tr key={methodId}>
                      {/* Nombre */}
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="payment-icon-box">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
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
                            <span
                              className="fw-bold text-dark d-block"
                              style={{ fontSize: "0.88rem" }}
                            >
                              {method.nombre || method.name}
                            </span>
                            <small
                              className="text-muted font-monospace"
                              style={{ fontSize: "0.7rem" }}
                            >
                              ID: #{methodId}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* Descripción */}
                      <td>
                        <span className="text-secondary small">
                          {method.descripcion ? method.descripcion : "—"}
                        </span>
                      </td>

                      {/* Recargo (%) */}
                      <td className="text-center">
                        {fee > 0 ? (
                          <span className="badge-recargo-active font-monospace">
                            +{fee.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="badge-recargo-zero font-monospace">
                            0.00%
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(method)}
                          className={`badge border-0 px-2 py-1 fw-bold ${
                            isActivo
                              ? "bg-success-subtle text-success"
                              : "bg-secondary-subtle text-secondary"
                          }`}
                          style={{ cursor: "pointer", fontSize: "0.72rem" }}
                          title="Hacer clic para alternar estado"
                        >
                          {isActivo ? "● ACTIVO" : "○ INACTIVO"}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="text-end pe-4">
                        <div className="d-inline-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn-action-icon text-teal"
                            title="Editar forma de pago"
                            onClick={() => handleOpenModal(method)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
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
                            className="btn-action-icon text-danger"
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
                              width="16"
                              height="16"
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
        <div className="d-flex justify-content-between align-items-center px-4 py-3 bg-white border-top">
          <small className="text-muted fw-semibold">
            Mostrando {filtered.length === 0 ? 0 : startIndex + 1} a{" "}
            {Math.min(startIndex + itemsPerPage, filtered.length)} de{" "}
            {filtered.length} métodos
          </small>

          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Anterior
            </button>
            <span className="badge bg-teal-primary px-3 py-2">
              {currentPage} / {totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* 6. Modal Crear / Editar */}
      {isModalOpen && (
        <div className="payment-modal-backdrop d-flex justify-content-center align-items-center p-3">
          <div className="payment-modal-card bg-white rounded-4 shadow-xl overflow-hidden animate__animated animate__fadeIn">
            <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5
                className="m-0 fw-bold text-dark text-uppercase"
                style={{ fontSize: "0.95rem" }}
              >
                {editingMethod ? "Editar Forma de Pago" : "Nueva Forma de Pago"}
              </h5>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-3">
                <label className="form-label text-secondary small fw-bold mb-1">
                  NOMBRE DEL MÉTODO *
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ej: Yape / Plin, Tarjeta Débito..."
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-bold mb-1">
                  DESCRIPCIÓN
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Detalles de uso o indicaciones para caja..."
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-bold mb-1">
                    RECARGO ADICIONAL (%)
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className="form-control font-monospace fw-bold"
                      value={formData.recargo}
                      onChange={(e) =>
                        setFormData({ ...formData, recargo: e.target.value })
                      }
                    />
                    <span className="input-group-text bg-light text-muted fw-bold">
                      %
                    </span>
                  </div>
                </div>

                <div className="col-6 d-flex flex-column justify-content-end">
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="activoSwitch"
                      checked={formData.activo}
                      onChange={(e) =>
                        setFormData({ ...formData, activo: e.target.checked })
                      }
                    />
                    <label
                      className="form-check-label fw-bold text-dark small"
                      htmlFor="activoSwitch"
                    >
                      {formData.activo ? "Método Activo" : "Método Inactivo"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 border-top pt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-3 btn-sm"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-teal-primary px-4 btn-sm fw-semibold"
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

      {/* Estilos */}
      <style>{`
        .text-teal { color: #006d77 !important; }
        .bg-teal-subtle { background-color: #ccfbf1 !important; }
        .btn-teal-primary {
          background-color: #006d77;
          color: #fff;
          border: none;
          transition: 0.15s;
        }
        .btn-teal-primary:hover {
          background-color: #084c53;
          color: #fff;
        }
        .text-amber { color: #b45309 !important; }
        .bg-amber-subtle { background-color: #fef3c7 !important; }
        .icon-metric {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .search-container {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 14px;
          border-radius: 8px;
        }
        .custom-payment-table thead th {
          font-size: 0.73rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          padding: 14px 18px;
          border-bottom: 1px solid #e2e8f0;
        }
        .custom-payment-table tbody td {
          padding: 14px 18px;
          border-bottom: 1px solid #f1f5f9;
        }
        .payment-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background-color: #e6f4f1;
          color: #006d77;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .badge-recargo-active {
          background-color: #fef3c7;
          color: #b45309;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #fde68a;
        }
        .badge-recargo-zero {
          color: #94a3b8;
          font-size: 0.78rem;
        }
        .btn-action-icon {
          background: transparent;
          border: none;
          padding: 6px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.15s;
        }
        .btn-action-icon:hover {
          background-color: #f1f5f9;
          transform: scale(1.1);
        }
        .payment-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          z-index: 1060;
        }
        .payment-modal-card {
          width: 100%;
          max-width: 480px;
        }
        .btn-close-modal {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          color: #94a3b8;
          cursor: pointer;
        }
        .btn-close-modal:hover {
          color: #0f172a;
        }
      `}</style>
    </div>
  );
};

export default PaymentMethodsPage;
