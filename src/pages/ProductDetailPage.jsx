import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${baseUrl}/products/${id}`, {
          headers: getAuthHeaders(),
        });
        setProduct(res.data);
      } catch (error) {
        console.error("Error al cargar la ficha técnica:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id, baseUrl, getAuthHeaders]);

  if (isLoading) {
    return (
      <div className="container-fluid py-5 text-center text-muted min-vh-100 d-flex flex-column justify-content-center align-items-center">
        <div className="spinner-border text-teal mb-3" role="status"></div>
        <p className="fw-semibold">Cargando ficha técnica del medicamento...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-fluid py-5 text-center">
        <h4 className="fw-bold text-dark">Medicamento no encontrado</h4>
        <p className="text-muted">El código solicitado no existe en el sistema.</p>
        <button
          className="btn btn-teal-primary btn-sm px-4 fw-semibold mt-2"
          onClick={() => navigate("/products")}
        >
          Volver al Catálogo
        </button>
      </div>
    );
  }

  const idKey = product.idProducto || product.id || id;
  const presentaciones =
    product.presentaciones && product.presentaciones.length > 0
      ? product.presentaciones
      : [
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
      : `${baseUrl}/uploads/${product.imagen}`
    : null;

  return (
    <div className="container-fluid py-3 px-3 px-md-4 bg-light min-vh-100">
      {/* 1. BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES */}
      <div className="card shadow-sm border-0 rounded-3 mb-3 bg-white">
        <div className="card-body py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-2"
              onClick={() => navigate("/products")}
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
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Regresar
            </button>

            <div>
              <div className="d-flex align-items-center gap-2">
                <span
                  className="badge bg-teal-subtle text-teal fw-bold font-monospace px-2 py-1"
                  style={{ fontSize: "0.75rem" }}
                >
                  ID #{idKey}
                </span>
                <h4 className="m-0 fw-bolder text-dark tracking-wide text-uppercase">
                  {product.nombre || product.name}
                </h4>
              </div>
              <small
                className="text-muted text-uppercase fw-semibold"
                style={{ fontSize: "0.75rem" }}
              >
                {product.formaFarmaceutica || "FORMA FARMACÉUTICA NO ASIGNADA"}
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-teal d-flex align-items-center gap-2 px-3 py-2 btn-sm fw-semibold rounded-2"
              onClick={() => navigate(`/products/${idKey}/lots`)}
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
                <circle cx="12" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="12" r="3" />
                <circle cx="12" cy="19" r="3" />
              </svg>
              Lotes y Precios
            </button>

            <button
              type="button"
              className="btn btn-teal-primary d-flex align-items-center gap-2 px-3 py-2 btn-sm fw-semibold rounded-2 shadow-sm"
              onClick={() => navigate(`/products/edit/${idKey}`)}
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
              Editar Producto
            </button>
          </div>
        </div>
      </div>

      {/* 2. PANEL PRINCIPAL */}
      <div className="card shadow-sm border-0 rounded-3 p-3 p-md-4 bg-white mb-4">
        {/* Fila Superior: Imagen + Compuesto & Normativa */}
        <div className="row g-3 mb-3 align-items-stretch">
          {/* Columna Izquierda: Imagen del Producto */}
          <div className="col-lg-4 col-md-5 d-flex flex-column">
            <div className="product-image-stage bg-light rounded-4 border p-2 d-flex flex-column align-items-center justify-content-center h-100 position-relative shadow-2xs">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={product.nombre}
                  className="img-fluid rounded-3"
                  style={{
                    maxHeight: "260px",
                    width: "100%",
                    objectFit: "cover",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling)
                      e.target.nextSibling.style.display = "flex";
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
                <span className="text-muted small mt-2 fw-semibold">
                  Sin imagen física
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Compuesto Clínico + Normativa */}
          <div className="col-lg-8 col-md-7 d-flex flex-column justify-content-between gap-3">
            {/* Card Compuesto & Terapéutica */}
            <div className="card-info-box border rounded-3 p-3 bg-white shadow-2xs">
              <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                <span
                  className="fw-bold text-teal text-uppercase"
                  style={{ fontSize: "0.76rem" }}
                >
                  Compuesto & Terapia
                </span>
              </div>
              <div className="row g-2">
                <div className="col-sm-6">
                  <small
                    className="text-muted fw-bold d-block"
                    style={{ fontSize: "0.68rem" }}
                  >
                    PRINCIPIO ACTIVO
                  </small>
                  <span
                    className="fw-bold text-dark"
                    style={{ fontSize: "0.95rem" }}
                  >
                    {product.principioActivo || "No especificado"}
                  </span>
                </div>
                <div className="col-sm-6">
                  <small
                    className="text-muted fw-bold d-block"
                    style={{ fontSize: "0.68rem" }}
                  >
                    CONCENTRACIÓN
                  </small>
                  <span
                    className="fw-bold text-dark"
                    style={{ fontSize: "0.95rem" }}
                  >
                    {product.concentracion || "N/A"}
                  </span>
                </div>
                <div className="col-12 mt-1">
                  <small
                    className="text-muted fw-bold d-block"
                    style={{ fontSize: "0.68rem" }}
                  >
                    INDICACIÓN PRINCIPAL
                  </small>
                  <div className="p-2 rounded bg-light border-start border-3 border-teal text-secondary small fst-italic mt-1">
                    {product.patologia ||
                      product.descripcion ||
                      "Sin indicación terapéutica registrada."}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Normativa Sanitaria */}
            <div className="card-info-box border rounded-3 p-3 bg-white shadow-2xs">
              <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom">
                <span
                  className="fw-bold text-danger text-uppercase"
                  style={{ fontSize: "0.76rem" }}
                >
                  Normativa & Registro
                </span>
              </div>
              <div className="row g-2 align-items-center">
                <div className="col-sm-6">
                  <small
                    className="text-muted fw-bold d-block"
                    style={{ fontSize: "0.68rem" }}
                  >
                    CONDICIÓN DE VENTA
                  </small>
                  {product.requiereReceta ? (
                    <span
                      className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 mt-1 fw-bold"
                      style={{ fontSize: "0.72rem" }}
                    >
                      RECETA MÉDICA
                    </span>
                  ) : (
                    <span
                      className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 mt-1 fw-bold"
                      style={{ fontSize: "0.72rem" }}
                    >
                      VENTA LIBRE
                    </span>
                  )}
                </div>
                <div className="col-sm-6">
                  <small
                    className="text-muted fw-bold d-block"
                    style={{ fontSize: "0.68rem" }}
                  >
                    REGISTRO SANITARIO
                  </small>
                  <span className="fw-semibold text-secondary font-monospace small">
                    {product.registroSanitario || "Sin registro sanitario"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trazabilidad & Almacenamiento (Grid 4 columnas) */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span
              className="fw-bold text-teal text-uppercase"
              style={{ fontSize: "0.76rem" }}
            >
              Trazabilidad & Almacenamiento
            </span>
          </div>
          <div className="row g-2">
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded-3 bg-white shadow-2xs h-100">
                <small
                  className="text-muted fw-bold d-block"
                  style={{ fontSize: "0.64rem" }}
                >
                  CATEGORÍA
                </small>
                <span className="fw-bold text-dark text-truncate d-block small mt-1">
                  {product.categoria?.nombre ||
                    product.category?.nombre ||
                    product.categoriaNombre ||
                    "N/A"}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded-3 bg-white shadow-2xs h-100">
                <small
                  className="text-muted fw-bold d-block"
                  style={{ fontSize: "0.64rem" }}
                >
                  FABRICANTE
                </small>
                <span className="fw-bold text-dark text-truncate d-block small mt-1">
                  {product.laboratorioNombre ||
                    product.laboratorio?.nombre ||
                    "N/A"}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded-3 bg-white shadow-2xs h-100">
                <small
                  className="text-muted fw-bold d-block"
                  style={{ fontSize: "0.64rem" }}
                >
                  DISTRIBUIDOR
                </small>
                <span className="fw-bold text-dark text-truncate d-block small mt-1">
                  {product.proveedor?.nombre ||
                    product.laboratorioNombre ||
                    "N/A"}
                </span>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-2 border rounded-3 bg-white shadow-2xs h-100">
                <small
                  className="text-muted fw-bold d-block"
                  style={{ fontSize: "0.64rem" }}
                >
                  ALMACÉN
                </small>
                <span className="fw-bold text-dark text-truncate d-block small mt-1">
                  {product.ubicacion?.nombre ||
                    product.ubicacionNombre ||
                    "Sin Asignar"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Presentaciones Comerciales */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <span
                className="fw-bold text-dark text-uppercase"
                style={{ fontSize: "0.78rem" }}
              >
                Presentaciones
              </span>
            </div>
            <span
              className="badge bg-amber-subtle text-amber fw-bold px-2 py-1"
              style={{ fontSize: "0.7rem" }}
            >
              {presentaciones.length} PRESENTACIONES
            </span>
          </div>

          <div className="table-responsive border rounded-3 overflow-hidden shadow-2xs">
            <table
              className="table table-sm table-hover mb-0 align-middle"
              style={{ fontSize: "0.85rem" }}
            >
              <thead className="bg-light">
                <tr>
                  <th className="py-2 px-3 fw-bold text-secondary">
                    PRESENTACIÓN
                  </th>
                  <th className="py-2 px-3 fw-bold text-secondary text-center">
                    CONTENIDO
                  </th>
                  <th className="py-2 px-3 fw-bold text-secondary">
                    CÓDIGO UPC
                  </th>
                  <th className="py-2 px-3 fw-bold text-secondary text-end">
                    PRECIO VENTA
                  </th>
                  <th className="py-2 px-3 fw-bold text-secondary text-center">
                    ESTADO
                  </th>
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
                    <td
                      className="py-2 px-3 text-end fw-bolder text-teal font-monospace"
                      style={{ fontSize: "0.95rem" }}
                    >
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

      <style>{`
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
        .btn-outline-teal {
          border: 1px solid #006d77;
          color: #006d77;
          background: transparent;
        }
        .btn-outline-teal:hover {
          background-color: #006d77;
          color: #fff;
        }
        .shadow-2xs {
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
};

export default ProductDetailPage;