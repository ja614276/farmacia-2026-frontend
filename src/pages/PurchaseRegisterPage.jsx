import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const PurchaseRegisterPage = () => {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  // Estado general
  const [generalInfo, setGeneralInfo] = useState({
    proveedorId: "",
    fechaEmision: new Date().toISOString().split("T")[0],
    numeroDocumento: "",
  });

  // Lista de items / productos a ingresar
  const [items, setItems] = useState([
    {
      productoId: "",
      productoNombre: "",
      numeroLote: "",
      fechaVencimiento: "",
      cantidad: 1,
      costoUnitario: 0,
    },
  ]);

  // Manejo de cambios en datos generales
  const handleGeneralChange = (e) => {
    setGeneralInfo({ ...generalInfo, [e.target.name]: e.target.value });
  };

  // Manejo de cambios por fila de producto
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Agregar nueva fila de lote
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productoId: "",
        productoNombre: "",
        numeroLote: "",
        fechaVencimiento: "",
        cantidad: 1,
        costoUnitario: 0,
      },
    ]);
  };

  // Eliminar fila
  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Cálculo de totales
  const totalGeneral = useMemo(() => {
    return items.reduce((acc, it) => {
      const sub = (Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0);
      return acc + sub;
    }, 0);
  }, [items]);

  // Guardar compra
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...generalInfo,
      totalCompra: totalGeneral,
      detalles: items.map((it) => ({
        ...it,
        subtotal: (Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0),
      })),
    };

    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      await axios.post(`${baseUrl}/purchases`, payload, {
        headers: {
          Authorization: token?.startsWith("Bearer ") ? token : `Bearer ${token}`,
        },
      });
      alert("Compra registrada y lotes generados exitosamente.");
      navigate("/lots"); // O a /purchases
    } catch (error) {
      console.error("Error al registrar la compra:", error);
      alert("Error al procesar la compra.");
    }
  };

  return (
    <div className="w-100 pb-5">
      {/* Título */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <h4 className="fw-bold text-dark m-0" style={{ color: "#006d77" }}>
          Registro de Nueva Compra
        </h4>
      </div>

      <form onSubmit={handleSubmit}>
        {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
        <div className="bg-white rounded-3 border p-4 mb-4 shadow-xs">
          <h6 className="text-uppercase fw-bold mb-3" style={{ color: "#e29578", fontSize: "0.8rem", letterSpacing: "0.5px" }}>
            Información General
          </h6>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Proveedor</label>
              <select
                name="proveedorId"
                className="form-select form-select-sm"
                value={generalInfo.proveedorId}
                onChange={handleGeneralChange}
                required
              >
                <option value="">Seleccionar proveedor...</option>
                <option value="1">TELCHI LITEL -</option>
                <option value="2">DISTRIBUIDORA FARMA S.A.</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">Fecha Emisión *</label>
              <input
                type="date"
                name="fechaEmision"
                className="form-control form-control-sm"
                value={generalInfo.fechaEmision}
                onChange={handleGeneralChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-secondary">N° de Factura / Guía</label>
              <input
                type="text"
                name="numeroDocumento"
                className="form-control form-control-sm"
                placeholder="Ej. F004-00123"
                value={generalInfo.numeroDocumento}
                onChange={handleGeneralChange}
                required
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: PRODUCTOS E INGRESO A LOTES */}
        <div className="bg-white rounded-3 border overflow-hidden mb-4 shadow-xs">
          <div className="d-flex justify-content-between align-items-center px-4 py-3 bg-light border-bottom">
            <span className="fw-bold text-teal d-flex align-items-center gap-2 small">
              PRODUCTOS E INGRESO A LOTES
            </span>
            <span className="badge bg-teal-soft text-teal font-monospace px-2.5 py-1.5" style={{ fontSize: "0.8rem" }}>
              Total Parcial: S/ {totalGeneral.toFixed(2)}
            </span>
          </div>

          <div className="table-responsive p-3">
            <table className="table align-middle mb-0" style={{ fontSize: "0.85rem" }}>
              <thead className="text-secondary small text-uppercase">
                <tr>
                  <th style={{ width: "35%" }}>Producto (Autocompletado)</th>
                  <th style={{ width: "15%" }}>Lote Asignado</th>
                  <th style={{ width: "15%" }}>Vencimiento</th>
                  <th style={{ width: "10%" }}>Cantidad</th>
                  <th style={{ width: "10%" }}>Costo Unit. (S/)</th>
                  <th style={{ width: "10%" }}>Subtotal</th>
                  <th style={{ width: "5%" }} className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const subtotal = (Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0);
                  return (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Buscar producto..."
                          value={it.productoNombre}
                          onChange={(e) => handleItemChange(idx, "productoNombre", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace text-uppercase"
                          placeholder="Ej. L1212"
                          value={it.numeroLote}
                          onChange={(e) => handleItemChange(idx, "numeroLote", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={it.fechaVencimiento}
                          onChange={(e) => handleItemChange(idx, "fechaVencimiento", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm text-center"
                          value={it.cantidad}
                          onChange={(e) => handleItemChange(idx, "cantidad", e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control form-control-sm text-end"
                          value={it.costoUnitario}
                          onChange={(e) => handleItemChange(idx, "costoUnitario", e.target.value)}
                          required
                        />
                      </td>
                      <td className="fw-bold text-teal font-monospace text-nowrap">
                        S/ {subtotal.toFixed(2)}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border text-danger"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-3">
              <button
                type="button"
                className="btn btn-sm btn-outline-teal border-dashed"
                onClick={handleAddItem}
              >
                + Agregar otro producto
              </button>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: PIE CON TOTAL Y BOTONES */}
        <div className="d-flex flex-wrap justify-content-between align-items-center bg-white p-4 rounded-3 border shadow-xs">
          <div>
            <span className="text-uppercase text-secondary fw-semibold small d-block">
              Costo Total de Compra
            </span>
            <h3 className="fw-bold m-0 font-monospace" style={{ color: "#006d77" }}>
              S/ {totalGeneral.toFixed(2)}
            </h3>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-light border px-4 py-2 text-secondary fw-semibold btn-sm rounded-2"
              onClick={() => navigate(-1)}
            >
              Cancelar y Volver
            </button>
            <button
              type="submit"
              className="btn btn-teal px-4 py-2 text-white fw-semibold btn-sm rounded-2 shadow-xs"
              style={{ backgroundColor: "#006d77" }}
            >
              Registrar Compra y Generar Lotes
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .text-teal { color: #006d77 !important; }
        .bg-teal-soft { background-color: #e6f4f1 !important; }
        .border-dashed { border-style: dashed !important; border-color: #006d77; color: #006d77; }
        .border-dashed:hover { background-color: #e6f4f1; color: #006d77; }
      `}</style>
    </div>
  );
};

export default PurchaseRegisterPage;