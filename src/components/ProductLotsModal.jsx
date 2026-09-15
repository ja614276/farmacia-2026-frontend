import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { getAuthHeaders as getTokenHeaders } from "../auth/utils/tokenUtils";

export const ProductLotsModal = ({
  product,
  onClose,
  onSavePrices,
  onNavigateToEdit,
}) => {
  if (!product) return null;

  const productId = product.idProducto || product.id;

  const initialPresentations =
    product.presentaciones && product.presentaciones.length > 0
      ? product.presentaciones
      : [
          {
            id: 1,
            nombrePresentacion: "UNIDAD",
            cantidadUnidades: 1,
            precioVenta: product.precioVenta || product.price || 1.0,
          },
        ];

  const [lots, setLots] = useState([]);
  const [isLoadingLots, setIsLoadingLots] = useState(true);
  const [prices, setPrices] = useState(
    initialPresentations.reduce((acc, pres) => {
      acc[pres.id || pres.nombrePresentacion] = pres.precioVenta;
      return acc;
    }, {}),
  );

  const [editingLotId, setEditingLotId] = useState(null);
  const [tempLotData, setTempLotData] = useState({});
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const [isSavingLot, setIsSavingLot] = useState(false);

  // Estado para el formulario de nuevo lote
  const [isCreating, setIsCreating] = useState(false);
  const [newLot, setNewLot] = useState({
    nroLote: "",
    fechaVencimiento: "",
    cantidadInicial: 50,
    costoUnitario: 1.0,
  });

  const getAuthHeaders = () => getTokenHeaders();

  const fetchLots = async () => {
    setIsLoadingLots(true);
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const res = await axios.get(`${baseUrl}/lots/product/${productId}`, {
        headers: getAuthHeaders(),
      });
      setLots(res.data || []);
    } catch (error) {
      console.error(
        "Error al cargar lotes del producto:",
        error.response?.data || error,
      );
    } finally {
      setIsLoadingLots(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchLots();
    }
  }, [productId]);

  const handlePriceChange = (key, value) => {
    setPrices((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 1. GUARDAR PRECIOS
  const handleSavePrices = async () => {
    setIsSavingPrices(true);
    const updatedPresentaciones = initialPresentations.map((pres) => {
      const key = pres.id || pres.nombrePresentacion;
      return {
        ...pres,
        precioVenta:
          prices[key] !== "" ? Number(prices[key]) : Number(pres.precioVenta),
      };
    });

    const mainPrice =
      updatedPresentaciones[0]?.precioVenta || Number(product.precioVenta) || 0;

    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    const urlFinal = `${baseUrl}/products/${productId}`;

    try {
      const response = await axios.put(
        urlFinal,
        {
          ...product,
          precioVenta: mainPrice,
          presentaciones: updatedPresentaciones,
        },
        { headers: getAuthHeaders() },
      );

      if (onSavePrices) {
        await onSavePrices(response.data, updatedPresentaciones, mainPrice);
      }
      alert("Precios actualizados y guardados correctamente.");
    } catch (error) {
      console.error(
        "❌ Error al guardar precios:",
        error.response?.status,
        error.response?.data || error.message,
      );
      alert(
        `Error al guardar precios: Código HTTP ${error.response?.status || error.message}`,
      );
    } finally {
      setIsSavingPrices(false);
    }
  };

  // 2. CREAR NUEVO LOTE
  const handleCreateLot = async (e) => {
    e.preventDefault();

    if (!newLot.nroLote.trim() || !newLot.fechaVencimiento) {
      alert("Complete el número de lote y la fecha de vencimiento.");
      return;
    }

    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    const urlFinal = `${baseUrl}/lots`;

    // Formato con espacio para cumplir con LocalDateTime y datetime(3) de MySQL
    const formattedDate = newLot.fechaVencimiento.includes(" ")
      ? newLot.fechaVencimiento
      : `${newLot.fechaVencimiento} 00:00:00`;

    const payload = {
      idProducto: Number(productId),
      nroLote: newLot.nroLote.trim(), // Permite mayúsculas y minúsculas
      fechaVencimiento: formattedDate,
      cantidadInicial: Number(newLot.cantidadInicial),
      cantidadActual: Number(newLot.cantidadInicial),
      costoUnitario: Number(newLot.costoUnitario),
    };

    try {
      const res = await axios.post(urlFinal, payload, {
        headers: getAuthHeaders(),
      });
      console.log("✅ Lote creado con éxito en BD:", res.data);

      setIsCreating(false);
      setNewLot({
        nroLote: "",
        fechaVencimiento: "",
        cantidadInicial: 50,
        costoUnitario: 1.0,
      });
      await fetchLots();
      alert("Lote asignado al producto con éxito.");
    } catch (error) {
      console.error(
        "❌ Error al registrar lote:",
        error.response?.status,
        error.response?.data || error.message,
      );
      alert(
        `Error al crear lote: Código HTTP ${error.response?.status || error.message}`,
      );
    }
  };

  const handleStartEditLot = (lot) => {
    const id = lot.idLote || lot.id;
    setEditingLotId(id);
    const rawDate = lot.fechaVencimiento || lot.vencimiento || "";
    const cleanDate = rawDate
      ? rawDate.includes("T")
        ? rawDate.split("T")[0]
        : rawDate.split(" ")[0]
      : "";

    setTempLotData({
      idLote: id,
      nroLote: lot.nroLote || "",
      fechaVencimiento: cleanDate,
      cantidadInicial: lot.cantidadInicial || lot.cantInicial || 0,
      cantidadActual: lot.cantidadActual || lot.cantActual || 0,
      costoUnitario: lot.costoUnitario || lot.costoU || 0,
      idProducto: productId,
    });
  };

  const handleCancelEditLot = () => {
    setEditingLotId(null);
    setTempLotData({});
  };

  const handleSaveLotRow = async (lotId) => {
    setIsSavingLot(true);
    const cleanDate = tempLotData.fechaVencimiento
      ? tempLotData.fechaVencimiento.includes(" ")
        ? tempLotData.fechaVencimiento
        : `${tempLotData.fechaVencimiento} 00:00:00`
      : null;

    const payload = {
      idLote: lotId,
      idProducto: productId,
      nroLote: String(tempLotData.nroLote).trim(),
      fechaVencimiento: cleanDate,
      cantidadInicial: Number(tempLotData.cantidadInicial) || 0,
      cantidadActual: Number(tempLotData.cantidadActual) || 0,
      costoUnitario: Number(tempLotData.costoUnitario) || 0,
    };

    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      await axios.put(`${baseUrl}/lots/${lotId}`, payload, {
        headers: getAuthHeaders(),
      });

      await fetchLots();
      setEditingLotId(null);
      setTempLotData({});
      alert("Lote guardado en la base de datos.");
    } catch (errLots) {
      console.error(
        "Error al persistir el lote:",
        errLots.response?.data || errLots,
      );
      alert("No se pudo guardar el lote en el servidor.");
    } finally {
      setIsSavingLot(false);
    }
  };

  return (
    <div className="lots-modal-backdrop d-flex justify-content-center align-items-center p-2">
      <div className="lots-modal-container bg-white rounded-4 shadow-xl overflow-hidden position-relative animate__animated animate__fadeIn">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center px-4 pt-4 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div className="lot-header-icon bg-teal-subtle text-teal p-2 rounded-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <div>
              <h5 className="m-0 fw-bolder text-dark text-uppercase lots-title">
                LOTES Y PRECIOS: {product.nombre || product.name}
              </h5>
              <small className="text-muted font-monospace">
                PRODUCT_ID: #{productId}
              </small>
            </div>
          </div>
          <button
            type="button"
            className="btn-close-lots"
            onClick={onClose}
            title="Cerrar"
          >
            &times;
          </button>
        </div>

        <div className="px-4 py-3">
          {/* Ajuste rápido de precios */}
          <div className="p-3 border rounded-3 bg-light-subtle mb-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div
                className="d-flex align-items-center gap-2 text-teal fw-bold"
                style={{ fontSize: "0.8rem" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span>AJUSTE RÁPIDO DE PRECIOS DE VENTA</span>
              </div>

              <button
                type="button"
                className="btn btn-teal-primary btn-sm px-3 py-1 fw-bold shadow-sm d-flex align-items-center gap-2"
                onClick={handleSavePrices}
                disabled={isSavingPrices}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {isSavingPrices ? "Guardando..." : "Guardar Precios"}
              </button>
            </div>

            <div className="row g-3">
              {initialPresentations.map((pres) => {
                const key = pres.id || pres.nombrePresentacion;
                return (
                  <div className="col-12 col-sm-6 col-md-3" key={key}>
                    <label
                      className="text-muted fw-bold d-block mb-1"
                      style={{ fontSize: "0.7rem" }}
                    >
                      {pres.nombrePresentacion.toUpperCase()} (S/)
                    </label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white text-muted fw-semibold border-end-0">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-control border-start-0 ps-0 text-dark fw-bold"
                        value={prices[key] ?? ""}
                        onChange={(e) => handlePriceChange(key, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barra de título con botón para alternar el formulario */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold text-dark" style={{ fontSize: "0.82rem" }}>
              LOTES DISPONIBLES EN ALMACÉN ({lots.length})
            </span>
            <button
              type="button"
              className="btn btn-teal-primary btn-sm py-1 px-3 fw-semibold"
              style={{ fontSize: "0.76rem" }}
              onClick={() => setIsCreating(!isCreating)}
            >
              {isCreating ? "✕ Cancelar" : "+ Nuevo Lote"}
            </button>
          </div>

          {/* Formulario para agregar lote */}
          {isCreating && (
            <form
              onSubmit={handleCreateLot}
              className="p-3 border rounded-3 bg-light mb-3 animate__animated animate__fadeIn"
            >
              <h6
                className="fw-bold text-teal mb-3"
                style={{ fontSize: "0.8rem" }}
              >
                INGRESAR NUEVO LOTE
              </h6>
              <div className="row g-2">
                <div className="col-md-3">
                  <label
                    className="text-muted fw-bold d-block"
                    style={{ fontSize: "0.68rem" }}
                  >
                    NRO LOTE
                  </label>
                  <input
                    type="text"
                    required
                    className="form-control form-control-sm"
                    placeholder="Ej: lot-2026-a"
                    value={newLot.nroLote}
                    onChange={(e) =>
                      setNewLot({ ...newLot, nroLote: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label
                    className="text-muted fw-bold d-block"
                    style={{ fontSize: "0.68rem" }}
                  >
                    VENCIMIENTO
                  </label>
                  <input
                    type="date"
                    required
                    className="form-control form-control-sm"
                    value={newLot.fechaVencimiento}
                    onChange={(e) =>
                      setNewLot({ ...newLot, fechaVencimiento: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label
                    className="text-muted fw-bold d-block"
                    style={{ fontSize: "0.68rem" }}
                  >
                    CANTIDAD
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-control form-control-sm"
                    value={newLot.cantidadInicial}
                    onChange={(e) =>
                      setNewLot({ ...newLot, cantidadInicial: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label
                    className="text-muted fw-bold d-block"
                    style={{ fontSize: "0.68rem" }}
                  >
                    COSTO UNIT. (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="form-control form-control-sm"
                    value={newLot.costoUnitario}
                    onChange={(e) =>
                      setNewLot({ ...newLot, costoUnitario: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button
                    type="submit"
                    className="btn btn-success btn-sm w-100 fw-semibold"
                  >
                    Guardar Lote
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tabla de lotes */}
          <div className="table-responsive border rounded-3">
            <table className="table table-hover align-middle mb-0 lots-table">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: "22%" }}>NRO LOTE</th>
                  <th style={{ width: "20%" }}>VENCIMIENTO</th>
                  <th style={{ width: "14%" }}>CANT. INICIAL</th>
                  <th style={{ width: "14%" }}>CANT. ACTUAL</th>
                  <th style={{ width: "15%" }}>COSTO U.</th>
                  <th style={{ width: "15%" }} className="text-end pe-3">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingLots ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-4 text-muted small"
                    >
                      Consultando registros en base de datos...
                    </td>
                  </tr>
                ) : lots.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-4 text-muted small"
                    >
                      No hay lotes registrados para este medicamento. Presione{" "}
                      <b>+ Nuevo Lote</b> para ingresar uno.
                    </td>
                  </tr>
                ) : (
                  lots.map((lot) => {
                    const currentId = lot.idLote || lot.id;
                    const isEditing = editingLotId === currentId;

                    return (
                      <tr
                        key={currentId}
                        className={isEditing ? "table-warning-subtle" : ""}
                      >
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className="form-control form-control-sm font-monospace"
                              value={tempLotData.nroLote || ""}
                              onChange={(e) =>
                                setTempLotData({
                                  ...tempLotData,
                                  nroLote: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <span className="fw-bold text-dark font-monospace">
                              {lot.nroLote}
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={tempLotData.fechaVencimiento || ""}
                              onChange={(e) =>
                                setTempLotData({
                                  ...tempLotData,
                                  fechaVencimiento: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <span className="text-secondary">
                              {lot.fechaVencimiento
                                ? lot.fechaVencimiento.includes("T")
                                  ? lot.fechaVencimiento.split("T")[0]
                                  : lot.fechaVencimiento.split(" ")[0]
                                : "—"}
                            </span>
                          )}
                        </td>
                        <td className="text-secondary">
                          {lot.cantidadInicial || lot.cantInicial || 0} UND
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              className="form-control form-control-sm fw-bold"
                              value={tempLotData.cantidadActual ?? 0}
                              onChange={(e) =>
                                setTempLotData({
                                  ...tempLotData,
                                  cantidadActual: Number(e.target.value),
                                })
                              }
                            />
                          ) : (
                            <span className="fw-bold text-dark">
                              {lot.cantidadActual || lot.cantActual || 0} UND
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-control form-control-sm text-teal fw-bold"
                              value={tempLotData.costoUnitario ?? 0}
                              onChange={(e) =>
                                setTempLotData({
                                  ...tempLotData,
                                  costoUnitario: Number(e.target.value),
                                })
                              }
                            />
                          ) : (
                            <span className="text-teal fw-bold">
                              S/{" "}
                              {Number(
                                lot.costoUnitario || lot.costoU || 0,
                              ).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="text-end pe-3">
                          {isEditing ? (
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-success py-0 px-2 fw-semibold"
                                style={{ fontSize: "0.75rem" }}
                                disabled={isSavingLot}
                                onClick={() => handleSaveLotRow(currentId)}
                              >
                                {isSavingLot ? "..." : "Guardar"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-2"
                                style={{ fontSize: "0.75rem" }}
                                onClick={handleCancelEditLot}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-link text-teal text-decoration-none p-0 fw-bold d-inline-flex align-items-center gap-1"
                              style={{ fontSize: "0.82rem" }}
                              onClick={() => handleStartEditLot(lot)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="d-flex justify-content-end align-items-center px-4 py-3 bg-light border-top">
          <button
            type="button"
            className="btn btn-secondary px-4 py-1 btn-sm fw-semibold shadow-sm"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>

      <style>{`
        .lots-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          z-index: 1060;
        }
        .lots-modal-container {
          width: 100%;
          max-width: 860px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .lots-title {
          font-size: 0.95rem;
          letter-spacing: 0.3px;
        }
        .btn-close-lots {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          color: #94a3b8;
          cursor: pointer;
          transition: 0.15s;
        }
        .btn-close-lots:hover {
          color: #0f172a;
        }
        .text-teal {
          color: #006d77 !important;
        }
        .bg-teal-subtle {
          background-color: #ccfbf1 !important;
        }
        .btn-teal-primary {
          background-color: #006d77;
          color: #fff;
          border: none;
        }
        .btn-teal-primary:hover {
          background-color: #084c53;
          color: #fff;
        }
        .lots-table thead th {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .lots-table tbody td {
          font-size: 0.85rem;
          padding: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
      `}</style>
    </div>
  );
};

ProductLotsModal.propTypes = {
  product: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSavePrices: PropTypes.func,
  onNavigateToEdit: PropTypes.func,
};