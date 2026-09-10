import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts.js";
import { ProductRow } from "./ProductRow.jsx";
import { ProductDetailModal } from "./ProductDetailModal.jsx";
import { ProductLotsModal } from "./ProductLotsModal.jsx";
import { useAuth } from "../auth/hooks/useAuth.js";

export const ProductList = () => {
  const {
    products = [],
    handlerProductSelectedForm,
    handlerRemoveProduct,
  } = useProducts();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Estados de búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para modales
  const [modalProduct, setModalProduct] = useState(null);
  const [lotsProduct, setLotsProduct] = useState(null);

  const handleOpenLotsModal = (product) => {
    setLotsProduct(product);
  };

  const handleCloseLotsModal = () => {
    setLotsProduct(null);
  };

  const handleOpenModal = (product) => {
    setModalProduct(product);
  };

  const handleCloseModal = () => {
    setModalProduct(null);
  };

  const handleEditFromModal = (product) => {
    handleCloseModal();
    if (handlerProductSelectedForm) {
      handlerProductSelectedForm(product);
    }
    const id = product.idProducto || product.id;
    navigate(`/products/edit/${id}`);
  };

  // Filtrado maestro en memoria
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter((p) => {
      const nombre = (p.nombre || p.name || "").toLowerCase();
      const principio = (p.principioActivo || "").toLowerCase();
      const laboratorio = (
        p.laboratorioNombre ||
        p.laboratorio?.nombre ||
        ""
      ).toLowerCase();
      const ubicacion = (p.ubicacion?.nombre || "").toLowerCase();
      return (
        nombre.includes(lower) ||
        principio.includes(lower) ||
        laboratorio.includes(lower) ||
        ubicacion.includes(lower)
      );
    });
  }, [products, searchTerm]);

  // Manejador de búsqueda que reinicia a la primera página
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const startRecord = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + itemsPerPage, filteredProducts.length);

  return (
    <div className="catalogo-wrapper bg-light min-vh-100 py-4 px-3 px-md-5 w-100">
      {/* 1. Header principal */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          
          <div>
            <h3 className="m-0 fw-bolder text-dark">Lista de Productos</h3>
            <p className="text-secondary m-0 small">
              Gestión de inventario farmacéutico y control de stock
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-cyan-soft d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
            </svg>
            Exportar Excel
          </button>

          <button
            type="button"
            className="btn btn-outline-teal-soft d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <path d="m9 15 3 3 3-3" />
            </svg>
            Importar Excel
          </button>

          <button
            type="button"
            className="btn btn-teal-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold btn-sm shadow-sm"
            onClick={() => {
              if (handlerProductSelectedForm) {
                handlerProductSelectedForm({});
              }
              navigate("/products/register");
            }}
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
            Registrar Producto
          </button>
        </div>
      </div>

      {/* 2. Barra de búsqueda y contador de Items */}
      <div className="bg-white rounded-3 p-3 mb-4 shadow-sm d-flex flex-wrap justify-content-between align-items-center gap-3 border">
        <div
          className="search-box-custom d-flex align-items-center flex-grow-1"
          style={{ maxWidth: "450px" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="me-2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="form-control border-0 p-0 shadow-none"
            placeholder="Realiza una búsqueda maestra..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Selector de items por página */}
          <div className="d-flex align-items-center gap-2 text-secondary small fw-medium">
            <span>Mostrar</span>
            <select
              className="form-select form-select-sm select-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="d-flex align-items-center gap-2 text-muted small fw-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>{filteredProducts.length} ITEMS</span>
          </div>
        </div>
      </div>

      {/* 3. Tabla principal adaptada al 100% */}
      <div className="bg-white rounded-3 shadow-sm border overflow-hidden w-100">
        <div className="table-responsive w-100" style={{ overflowX: "auto" }}>
          <table
            className="table table-hover align-middle mb-0 custom-catalog-table w-100"
            style={{ tableLayout: "auto" }}
          >
            <thead>
              <tr>
                <th style={{ width: "26%" }}>INFORMACIÓN DEL PRODUCTO</th>
                <th style={{ width: "16%" }}>PRINCIPIO ACTIVO</th>
                <th style={{ width: "12%" }}>CONS. / FORMA</th>
                <th style={{ width: "10%" }}>CATEGORÍA</th>
                <th style={{ width: "11%" }}>LABORATORIO</th>
                <th style={{ width: "13%" }}>UBICACIÓN</th>
                <th
                  style={{ width: "12%", minWidth: "120px" }}
                  className="text-end pe-4"
                >
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No se encontraron medicamentos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                currentProducts.map((product) => (
                  <ProductRow
                    key={product.idProducto || product.id}
                    product={product}
                    isAdmin={login?.isAdmin}
                    handlerProductSelectedForm={handlerProductSelectedForm}
                    handlerRemoveProduct={handlerRemoveProduct}
                    onViewDetail={() => handleOpenModal(product)}
                    onViewLots={() => handleOpenLotsModal(product)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Footer con Paginación Integrada */}
        <div className="d-flex flex-wrap justify-content-between align-items-center px-4 py-3 bg-white border-top gap-3">
          <small className="text-muted fw-semibold">
            Mostrando <span className="text-dark fw-bold">{startRecord}</span> a{" "}
            <span className="text-dark fw-bold">{endRecord}</span> de{" "}
            <span className="text-dark fw-bold">{filteredProducts.length}</span> productos
          </small>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="Primera página"
            >
              &laquo;
            </button>

            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                return (
                  <span key={page} className="d-inline-flex align-items-center">
                    {prevPage && page - prevPage > 1 && (
                      <span className="px-1 text-muted">...</span>
                    )}
                    <button
                      type="button"
                      className={`btn-page-number ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Siguiente
            </button>

            <button
              type="button"
              className="btn-page-nav"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Última página"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>

      {/* 5. Renderizado condicional del Modal de Ficha Técnica */}
      {modalProduct && (
        <ProductDetailModal
          product={modalProduct}
          onClose={handleCloseModal}
          onEdit={handleEditFromModal}
        />
      )}

      {/* 6. Renderizado condicional del Modal de Lotes y Precios */}
      {lotsProduct && (
        <ProductLotsModal
          product={lotsProduct}
          onClose={handleCloseLotsModal}
        />
      )}

      {/* Estilos específicos */}
      <style>{`
        .catalogo-wrapper {
          background-color: #f8fafc;
        }
        .pill-badge-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: #e6f4f1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-teal-primary {
          background-color: #006d77;
          color: #fff;
          border: none;
          transition: 0.2s;
        }
        .btn-teal-primary:hover {
          background-color: #0b525b;
          color: #fff;
        }
        .btn-outline-cyan-soft {
          background-color: #e0f2fe;
          color: #0284c7;
          border: 1px solid #bae6fd;
        }
        .btn-outline-cyan-soft:hover {
          background-color: #bae6fd;
          color: #0369a1;
        }
        .btn-outline-teal-soft {
          background-color: #d1fae5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }
        .btn-outline-teal-soft:hover {
          background-color: #a7f3d0;
          color: #047857;
        }
        .search-box-custom {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 14px;
          border-radius: 8px;
        }
        .search-box-custom input {
          background: transparent;
          font-size: 0.9rem;
          color: #334155;
        }
        .select-per-page {
          width: 65px;
          border-color: #e2e8f0;
          color: #334155;
          cursor: pointer;
        }
        .custom-catalog-table thead th {
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          padding: 16px 20px;
          border-bottom: 1px solid #edf2f7;
          background-color: #ffffff;
        }
        .custom-catalog-table tbody td {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.85rem;
          vertical-align: middle;
        }
        .custom-catalog-table {
          width: 100% !important;
        }
        .btn-page-nav {
          background-color: #fff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.15s;
        }
        .btn-page-nav:hover:not(:disabled) {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }
        .btn-page-nav:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .btn-page-number {
          background-color: #fff;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 600;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin: 0 2px;
          transition: 0.15s;
        }
        .btn-page-number:hover {
          background-color: #f1f5f9;
        }
        .btn-page-number.active {
          background-color: #006d77;
          border-color: #006d77;
          color: #fff;
        }
      `}</style>
    </div>
  );
};