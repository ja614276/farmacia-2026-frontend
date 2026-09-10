import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export const ProductLotsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [lots, setLots] = useState([]);
  const [isLoadingLots, setIsLoadingLots] = useState(true);

  const [prices, setPrices] = useState({});
  const [editingLotId, setEditingLotId] = useState(null);
  const [tempLotData, setTempLotData] = useState({});
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const [isSavingLot, setIsSavingLot] = useState(false);

  // Formulario nuevo lote
  const [isCreating, setIsCreating] = useState(false);
  const [newLot, setNewLot] = useState({
    nroLote: "",
    fechaVencimiento: "",
    cantidadInicial: 50,
    costoUnitario: 1.0,
  });

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

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // Cargar datos del producto
  const fetchProduct = useCallback(async () => {
    setIsLoadingProduct(true);
    try {
      const res = await axios.get(`${baseUrl}/products/${id}`, {
        headers: getAuthHeaders(),
      });
      const data = res.data;
      setProduct(data);

      const presentaciones =
        data.presentaciones && data.presentaciones.length > 0
          ? data.presentaciones
          : [
              {
                id: 1,
                nombrePresentacion: "UNIDAD",
                cantidadUnidades: 1,
                precioVenta: data.precioVenta || data.price || 1.0,
              },
            ];

      setPrices(
        presentaciones.reduce((acc, pres) => {
          acc[pres.id || pres.nombrePresentacion] = pres.precioVenta;
          return acc;
        }, {})
      );
    } catch (error) {
      console.error("Error al cargar producto:", error);
    } finally {
      setIsLoadingProduct(false);
    }
  }, [baseUrl, id, getAuthHeaders]);

  // Cargar lotes
  const fetchLots = useCallback(async () => {
    setIsLoadingLots(true);
    try {
      const res = await axios.get(`${baseUrl}/lots/product/${id}`, {
        headers: getAuthHeaders(),
      });
      setLots(res.data || []);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    } finally {
      setIsLoadingLots(false);
    }
  }, [baseUrl, id, getAuthHeaders]);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchLots();
    }
  }, [id, fetchProduct, fetchLots]);

  const handlePriceChange = (key, value) => {
    setPrices((prev) => ({ ...prev, [key]: value }));
  };

  // Guardar Precios
  const handleSavePrices = async () => {
    setIsSavingPrices(true);
    const initialPresentations =
      product?.presentaciones && product.presentaciones.length > 0
        ? product.presentaciones
        : [
            {
              id: 1,
              nombrePresentacion: "UNIDAD",
              cantidadUnidades: 1,
              precioVenta: product?.precioVenta || 1.0,
            },
          ];

    const updatedPresentaciones = initialPresentations.map((pres) => {
      const key = pres.id || pres.nombrePresentacion;
      return {
        ...pres,
        precioVenta:
          prices[key] !== "" ? Number(prices[key]) : Number(pres.precioVenta),
      };
    });

    const mainPrice =
      updatedPresentaciones[0]?.precioVenta || Number(product?.precioVenta) || 0;

    try {
      await axios.put(
        `${baseUrl}/products/${id}`,
        {
          ...product,
          precioVenta: mainPrice,
          presentaciones: updatedPresentaciones,
        },
        { headers: getAuthHeaders() }
      );
      await fetchProduct();
      alert("Precios actualizados con éxito.");
    } catch (error) {
      console.error("Error al guardar precios:", error);
      alert(`Error al guardar precios: ${error.response?.status || error.message}`);
    } finally {
      setIsSavingPrices(false);
    }
  };

  // Crear Lote
  const handleCreateLot = async (e) => {
    e.preventDefault();
    if (!newLot.nroLote.trim() || !newLot.fechaVencimiento) {
      alert("Complete número de lote y fecha de vencimiento.");
      return;
    }

    const formattedDate = newLot.fechaVencimiento.includes(" ")
      ? newLot.fechaVencimiento
      : `${newLot.fechaVencimiento} 00:00:00`;

    const payload = {
      idProducto: Number(id),
      nroLote: newLot.nroLote.trim(),
      fechaVencimiento: formattedDate,
      cantidadInicial: Number(newLot.cantidadInicial),
      cantidadActual: Number(newLot.cantidadInicial),
      costoUnitario: Number(newLot.costoUnitario),
    };

    try {
      await axios.post(`${baseUrl}/lots`, payload, { headers: getAuthHeaders() });
      setIsCreating(false);
      setNewLot({
        nroLote: "",
        fechaVencimiento: "",
        cantidadInicial: 50,
        costoUnitario: 1.0,
      });
      await fetchLots();
      alert("Lote asignado con éxito.");
    } catch (error) {
      console.error("Error al registrar lote:", error);
      alert(`Error al crear lote: ${error.response?.status || error.message}`);
    }
  };

  // Iniciar edición de lote
  const handleStartEditLot = (lot) => {
    const lotId = lot.idLote || lot.id;
    setEditingLotId(lotId);

    const rawDate = lot.fechaVencimiento || lot.vencimiento || "";
    let cleanDate = "";

    if (Array.isArray(rawDate) && rawDate.length >= 3) {
      const year = rawDate[0];
      const month = String(rawDate[1]).padStart(2, "0");
      const day = String(rawDate[2]).padStart(2, "0");
      cleanDate = `${year}-${month}-${day}`;
    } else if (typeof rawDate === "string" && rawDate.trim() !== "") {
      cleanDate = rawDate.split("T")[0].split(" ")[0];
    } else if (rawDate instanceof Date) {
      cleanDate = rawDate.toISOString().split("T")[0];
    }

    setTempLotData({
      idLote: lotId,
      nroLote: lot.nroLote || "",
      fechaVencimiento: cleanDate,
      cantidadInicial: lot.cantidadInicial || lot.cantInicial || 0,
      cantidadActual: lot.cantidadActual || lot.cantActual || 0,
      costoUnitario: lot.costoUnitario || lot.costoU || 0,
      idProducto: id,
    });
  };

  // Guardar edición de fila
  const handleSaveLotRow = async (lotId) => {
    setIsSavingLot(true);
    const cleanDate = tempLotData.fechaVencimiento
      ? tempLotData.fechaVencimiento.includes(" ")
        ? tempLotData.fechaVencimiento
        : `${tempLotData.fechaVencimiento} 00:00:00`
      : null;

    const payload = {
      idLote: lotId,
      idProducto: Number(id),
      nroLote: String(tempLotData.nroLote).trim(),
      fechaVencimiento: cleanDate,
      cantidadInicial: Number(tempLotData.cantidadInicial) || 0,
      cantidadActual: Number(tempLotData.cantidadActual) || 0,
      costoUnitario: Number(tempLotData.costoUnitario) || 0,
    };

    try {
      await axios.put(`${baseUrl}/lots/${lotId}`, payload, {
        headers: getAuthHeaders(),
      });
      await fetchLots();
      setEditingLotId(null);
      setTempLotData({});
      alert("Lote actualizado.");
    } catch (err) {
      console.error("Error al actualizar lote:", err);
      alert("No se pudo actualizar el lote.");
    } finally {
      setIsSavingLot(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="container-fluid py-5 text-center text-muted">
        <div className="spinner-border text-teal mb-2" role="status"></div>
        <p>Cargando información del producto y lotes...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-fluid py-5 text-center">
        <h4>Producto no encontrado</h4>
        <button
          className="btn btn-outline-secondary mt-3"
          onClick={() => navigate("/products")}
        >
          Volver a Productos
        </button>
      </div>
    );
  }

  const presentationsList =
    product.presentaciones && product.presentaciones.length > 0
      ? product.presentaciones
      : [
          {
            id: 1,
            nombrePresentacion: "UNIDAD",
            cantidadUnidades: 1,
            precioVenta: product.precioVenta || 1.0,
          },
        ];

  return (
    <div className="container-fluid py-2">
      {/* Cabecera / Navegación */}
      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={() => navigate("/products")}
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
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Regresar
            </button>
            <div>
              <h4 className="m-0 fw-bold text-dark text-uppercase">
                Lotes y Precios: {product.nombre || product.name}
              </h4>
              <span className="badge bg-secondary font-monospace">ID: #{id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ajuste de Precios */}
      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-teal fw-bold">
              AJUSTE RÁPIDO DE PRECIOS DE VENTA
            </span>
            <button
              type="button"
              className="btn btn-teal-primary btn-sm px-3 fw-bold"
              onClick={handleSavePrices}
              disabled={isSavingPrices}
            >
              {isSavingPrices ? "Guardando..." : "Guardar Precios"}
            </button>
          </div>

          <div className="row g-3">
            {presentationsList.map((pres) => {
              const key = pres.id || pres.nombrePresentacion;
              return (
                <div className="col-12 col-sm-6 col-md-3" key={key}>
                  <label className="text-muted fw-bold small d-block mb-1">
                    {pres.nombrePresentacion.toUpperCase()} (S/)
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white text-muted fw-semibold">
                      S/
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control text-dark fw-bold"
                      value={prices[key] ?? ""}
                      onChange={(e) => handlePriceChange(key, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Listado de Lotes */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <span className="fw-bold text-dark">
            LOTES DISPONIBLES EN ALMACÉN ({lots.length})
          </span>
          <button
            type="button"
            className="btn btn-teal-primary btn-sm px-3 fw-semibold"
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? "✕ Cancelar" : "+ Nuevo Lote"}
          </button>
        </div>

        <div className="card-body">
          {isCreating && (
            <form
              onSubmit={handleCreateLot}
              className="p-3 border rounded-3 bg-light mb-4"
            >
              <h6 className="fw-bold text-teal mb-3">INGRESAR NUEVO LOTE</h6>
              <div className="row g-2">
                <div className="col-md-3">
                  <label className="text-muted fw-bold small">NRO LOTE</label>
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
                  <label className="text-muted fw-bold small">VENCIMIENTO</label>
                  <input
                    type="date"
                    required
                    className="form-control form-control-sm"
                    value={newLot.fechaVencimiento}
                    onChange={(e) =>
                      setNewLot({
                        ...newLot,
                        fechaVencimiento: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label className="text-muted fw-bold small">CANTIDAD</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-control form-control-sm"
                    value={newLot.cantidadInicial}
                    onChange={(e) =>
                      setNewLot({
                        ...newLot,
                        cantidadInicial: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label className="text-muted fw-bold small">
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

          <div className="table-responsive border rounded-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
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
                      <b>+ Nuevo Lote</b>.
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
                                lot.costoUnitario || lot.costoU || 0
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
                                disabled={isSavingLot}
                                onClick={() => handleSaveLotRow(currentId)}
                              >
                                {isSavingLot ? "..." : "Guardar"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-2"
                                onClick={() => {
                                  setEditingLotId(null);
                                  setTempLotData({});
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-link text-teal text-decoration-none p-0 fw-bold"
                              onClick={() => handleStartEditLot(lot)}
                            >
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
      </div>

      <style>{`
        .text-teal { color: #006d77 !important; }
        .btn-teal-primary { background-color: #006d77; color: #fff; border: none; }
        .btn-teal-primary:hover { background-color: #084c53; color: #fff; }
      `}</style>
    </div>
  );
};

export default ProductLotsPage;