import PropTypes from "prop-types";

export const ProductDetailModal = ({ product, onClose, onEdit }) => {
  if (!product) return null;

  const idKey = product.idProducto || product.id || 0;
  const presentaciones = product.presentaciones || [
    {
      nombrePresentacion: "UNIDAD",
      cantidadUnidades: 1,
      precioVenta: product.precioVenta || product.price || 1.0,
      activo: true,
    },
  ];

  const imageSrc = product.imagen
    ? product.imagen.startsWith("http")
      ? product.imagen
      : `http://localhost:8080/uploads/${product.imagen}`
    : null;

  return (
    <div className="modal-backdrop-custom d-flex justify-content-center align-items-center p-2 p-md-4">
      <div className="modal-container-custom bg-white rounded-4 shadow-2xl d-flex flex-column overflow-hidden position-relative animate__animated animate__fadeIn">
        
        {/* 1. HEADER FIJO */}
        <div className="modal-header-custom px-4 py-3 border-bottom d-flex justify-content-between align-items-center bg-white flex-shrink-0">
          <div className="d-flex align-items-center gap-3">
            
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-teal-subtle text-teal fw-bold font-monospace px-2 py-1" style={{ fontSize: "0.72rem" }}>
                  ID #{idKey}
                </span>
                <h5 className="m-0 fw-bolder text-dark tracking-wide text-uppercase">
                  {product.nombre || product.name}
                </h5>
              </div>
              <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.74rem" }}>
                {product.formaFarmaceutica || "FORMA FARMACÉUTICA NO ASIGNADA"}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="btn-close-round"
            onClick={onClose}
            title="Cerrar ventana"
          >
            &times;
          </button>
        </div>

        {/* 2. CUERPO CON SCROLL INDEPENDIENTE */}
        <div className="modal-body-custom px-4 py-3 flex-grow-1 overflow-y-auto">
          <div className="row g-3 mb-3 align-items-stretch">
            
            {/* Columna Izquierda: Galería e Imagen de Producto */}
            <div className="col-lg-4 col-md-5 d-flex flex-column">
              <div className="product-image-stage bg-light rounded-4 border p-2 d-flex flex-column align-items-center justify-content-center h-100 position-relative shadow-2xs">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={product.nombre}
                    className="img-fluid rounded-3"
                    style={{
                      maxHeight: "230px",
                      width: "100%",
                      objectFit: "cover",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}

                <div
                  className="fallback-vector-wrap flex-column align-items-center justify-content-center my-4"
                  style={{ display: imageSrc ? "none" : "flex" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="70"
                    height="70"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m7.5 4.27 9 5.15" />
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                  <span className="text-muted small mt-2 fw-semibold">Sin imagen física</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Compuesto Clínico + Normativa en Panel */}
            <div className="col-lg-8 col-md-7 d-flex flex-column justify-content-between gap-2">
              
              {/* Card Compuesto & Terapéutica */}
              <div className="card-info-box border rounded-3 p-3 bg-white shadow-2xs">
                <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                  <span className="fw-bold text-teal text-uppercase" style={{ fontSize: "0.76rem" }}>
                    Compuesto & Terapia
                  </span>
                </div>
                <div className="row g-2">
                  <div className="col-sm-6">
                    <small className="text-muted fw-bold d-block" style={{ fontSize: "0.68rem" }}>PRINCIPIO ACTIVO</small>
                    <span className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                      {product.principioActivo || "No especificado"}
                    </span>
                  </div>
                  <div className="col-sm-6">
                    <small className="text-muted fw-bold d-block" style={{ fontSize: "0.68rem" }}>CONCENTRACIÓN</small>
                    <span className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
                      {product.concentracion || "N/A"}
                    </span>
                  </div>
                  <div className="col-12 mt-1">
                    <small className="text-muted fw-bold d-block" style={{ fontSize: "0.68rem" }}>INDICACIÓN PRINCIPAL</small>
                    <div className="p-2 rounded bg-light border-start border-3 border-teal text-secondary small fst-italic mt-1">
                      {product.patologia || "Sin indicación terapéutica registrada."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Normativa Sanitaria */}
              <div className="card-info-box border rounded-3 p-3 bg-white shadow-2xs">
                <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                  <span className="fw-bold text-danger text-uppercase" style={{ fontSize: "0.76rem" }}>
                    Normativa & Registro
                  </span>
                </div>
                <div className="row g-2 align-items-center">
                  <div className="col-sm-6">
                    <small className="text-muted fw-bold d-block" style={{ fontSize: "0.68rem" }}>CONDICIÓN DE VENTA</small>
                    {product.requiereReceta ? (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 mt-1 fw-bold" style={{ fontSize: "0.72rem" }}>
                        RECETA MÉDICA
                      </span>
                    ) : (
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 mt-1 fw-bold" style={{ fontSize: "0.72rem" }}>
                        VENTA LIBRE
                      </span>
                    )}
                  </div>
                  <div className="col-sm-6">
                    <small className="text-muted fw-bold d-block" style={{ fontSize: "0.68rem" }}>REGISTRO SANITARIO</small>
                    <span className="fw-semibold text-secondary font-monospace small">
                      {product.registroSanitario || "Sin registro sanitario"}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Trazabilidad & Almacenamiento (Grid 4 items) */}
          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="fw-bold text-teal text-uppercase" style={{ fontSize: "0.76rem" }}>
                Trazabilidad & Almacenamiento
              </span>
            </div>
            <div className="row g-2">
              <div className="col-6 col-md-3">
                <div className="p-2 border rounded-3 bg-white shadow-2xs h-100">
                  <small className="text-muted fw-bold d-block" style={{ fontSize: "0.64rem" }}>CATEGORÍA</small>
                  <span className="fw-bold text-dark text-truncate d-block small mt-1">
                    {product.categoria?.nombre || product.category?.nombre || "N/A"}
                  </span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 border rounded-3 bg-white shadow-2xs h-100">
                  <small className="text-muted fw-bold d-block" style={{ fontSize: "0.64rem" }}>FABRICANTE</small>
                  <span className="fw-bold text-dark text-truncate d-block small mt-1">
                    {product.laboratorioNombre || product.laboratorio?.nombre || "N/A"}
                  </span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 border rounded-3 bg-white shadow-2xs h-100">
                  <small className="text-muted fw-bold d-block" style={{ fontSize: "0.64rem" }}>DISTRIBUIDOR</small>
                  <span className="fw-bold text-dark text-truncate d-block small mt-1">
                    {product.proveedor?.nombre || product.laboratorioNombre || "N/A"}
                  </span>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 border rounded-3 bg-white shadow-2xs h-100">
                  <small className="text-muted fw-bold d-block" style={{ fontSize: "0.64rem" }}>ALMACÉN</small>
                  <span className="fw-bold text-dark text-truncate d-block small mt-1">
                    {product.ubicacion?.nombre || "Sin Asignar"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Presentaciones Comerciales */}
          <div className="mb-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark text-uppercase" style={{ fontSize: "0.78rem" }}>
                  Presentaciones
                </span>
              </div>
              <span className="badge bg-amber-subtle text-amber fw-bold px-2 py-1" style={{ fontSize: "0.7rem" }}>
                {presentaciones.length} PRESENTACIONES
              </span>
            </div>

            <div className="table-responsive border rounded-3 overflow-hidden shadow-2xs">
              <table className="table table-sm table-hover mb-0 align-middle" style={{ fontSize: "0.8rem" }}>
                <thead className="bg-light">
                  <tr>
                    <th className="py-2 px-3 fw-bold text-secondary">PRESENTACIÓN</th>
                    <th className="py-2 px-3 fw-bold text-secondary text-center">CONTENIDO</th>
                    <th className="py-2 px-3 fw-bold text-secondary">CÓDIGO UPC</th>
                    <th className="py-2 px-3 fw-bold text-secondary text-end">PRECIO VENTA</th>
                    <th className="py-2 px-3 fw-bold text-secondary text-center">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {presentaciones.map((pres, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 fw-bold text-dark text-uppercase">
                        {pres.nombrePresentacion}
                      </td>
                      <td className="py-2 px-3 text-secondary text-center">
                        <span className="badge bg-light text-dark border font-monospace">
                          {pres.cantidadUnidades} UND
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted font-monospace small">
                        {product.codigoBarras || "—"}
                      </td>
                      <td className="py-2 px-3 text-end fw-bolder text-teal font-monospace" style={{ fontSize: "0.92rem" }}>
                        S/ {Number(pres.precioVenta || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                          ● Disponible
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        .modal-backdrop-custom {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(5px);
          z-index: 1060;
        }
        .modal-container-custom {
          width: 100%;
          max-width: 920px;
          height: 88vh; /* Altura máxima controlada para no rebasar pantalla */
          max-height: 740px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .header-badge-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background-color: #e6f4f1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-close-round {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background-color: #f1f5f9;
          color: #64748b;
          font-size: 1.4rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.15s;
        }
        .btn-close-round:hover {
          background-color: #e2e8f0;
          color: #0f172a;
        }
        .product-image-stage {
          background-color: #f8fafc;
          border: 1px dashed #cbd5e1 !important;
          min-height: 220px;
        }
        .text-teal {
          color: #006d77 !important;
        }
        .bg-teal-subtle {
          background-color: #ccfbf1 !important;
        }
        .border-teal {
          border-color: #006d77 !important;
        }
        .bg-amber-subtle {
          background-color: #fef3c7;
        }
        .text-amber {
          color: #b45309;
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
        .shadow-2xs {
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
};

ProductDetailModal.propTypes = {
  product: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};