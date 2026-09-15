import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useProducts } from "../hooks/useProducts.js";
import { ProductRow } from "./ProductRow.jsx";
import { ProductDetailModal } from "./ProductDetailModal.jsx";
import { ProductLotsModal } from "./ProductLotsModal.jsx";
import { useAuth } from "../auth/hooks/useAuth.js";

export const ProductList = ({
  products: initialProducts = null,
  isAdmin: customIsAdmin = null,
  handlerProductSelectedForm: customHandlerSelect = null,
  handlerRemoveProduct: customHandlerRemove = null,
}) => {
  const productsHook = useProducts();
  const products = initialProducts || productsHook.products || [];
  const handlerProductSelectedForm = customHandlerSelect || productsHook.handlerProductSelectedForm;
  const handlerRemoveProduct = customHandlerRemove || productsHook.handlerRemoveProduct;
  const getProducts = productsHook.getProducts;

  const { login } = useAuth();
  const isAdmin = customIsAdmin !== null ? customIsAdmin : Boolean(login?.isAdmin);
  const navigate = useNavigate();

  // Estados de búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para modales
  const [detailProduct, setDetailProduct] = useState(null);
  const [lotsProduct, setLotsProduct] = useState(null);

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
      const codigo = (p.codigoBarras || p.codDigemid || "").toLowerCase();
      return (
        nombre.includes(lower) ||
        principio.includes(lower) ||
        laboratorio.includes(lower) ||
        ubicacion.includes(lower) ||
        codigo.includes(lower)
      );
    });
  }, [products, searchTerm]);

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const startRecord = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const endRecord = Math.min(startIndex + itemsPerPage, filteredProducts.length);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-5">
      {/* 1. Cabecera Corporativa Monocromática */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
            <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/dashboard")}>
              Dashboard
            </span>
            <span>/</span>
            <span className="text-zinc-950 font-bold">Catálogo de Productos</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                Catálogo de Productos y Medicamentos
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Control del inventario farmacéutico, especificaciones técnicas y trazabilidad de lotes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isAdmin && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              onClick={() => {
                if (handlerProductSelectedForm) {
                  handlerProductSelectedForm({});
                }
                navigate("/products/register");
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Registrar Producto</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Contador */}
      <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nombre, principio activo, código o laboratorio..."
            className="w-full h-10 pl-10 pr-4 bg-zinc-50/60 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-400 hover:text-zinc-900 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg">
            {filteredProducts.length} {filteredProducts.length === 1 ? "MEDICAMENTO" : "MEDICAMENTOS"}
          </span>
        </div>
      </div>

      {/* 3. Tabla Corporativa */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-100/80 border-b border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                <th className="py-3 px-4" style={{ width: "26%" }}>INFORMACIÓN DEL PRODUCTO</th>
                <th className="py-3 px-3.5" style={{ width: "16%" }}>PRINCIPIO ACTIVO</th>
                <th className="py-3 px-3.5" style={{ width: "12%" }}>CONS. / FORMA</th>
                <th className="py-3 px-3.5" style={{ width: "12%" }}>CATEGORÍA</th>
                <th className="py-3 px-3.5" style={{ width: "11%" }}>LABORATORIO</th>
                <th className="py-3 px-3.5" style={{ width: "11%" }}>UBICACIÓN</th>
                <th className="py-3 px-4 text-right" style={{ width: "12%" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 bg-white">
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-zinc-500">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" />
                        <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                      </svg>
                      <span className="font-bold text-zinc-900 text-sm">No se encontraron medicamentos</span>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {searchTerm ? `No hay resultados para "${searchTerm}".` : "No hay productos registrados en el sistema."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentProducts.map((product) => (
                  <ProductRow
                    key={product.idProducto || product.id}
                    product={product}
                    isAdmin={isAdmin}
                    handlerProductSelectedForm={handlerProductSelectedForm}
                    handlerRemoveProduct={handlerRemoveProduct}
                    onViewDetail={(prod) => setDetailProduct(prod)}
                    onViewLots={(prod) => setLotsProduct(prod)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Paginación Monocromática */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-zinc-200 bg-zinc-50/50 text-xs text-zinc-600">
            <div>
              Mostrando <span className="font-bold text-zinc-900">{startRecord}</span> a{" "}
              <span className="font-bold text-zinc-900">{endRecord}</span> de{" "}
              <span className="font-bold text-zinc-900">{filteredProducts.length}</span> registros
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-2.5 py-1 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors"
              >
                Anterior
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  return (
                    <span key={page} className="inline-flex items-center">
                      {prevPage && page - prevPage > 1 && (
                        <span className="px-1 text-zinc-400">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                          currentPage === page
                            ? "bg-zinc-900 text-white"
                            : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-2.5 py-1 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Modal de Ficha Técnica */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onEdit={(prod) => {
            setDetailProduct(null);
            const id = prod.idProducto || prod.id;
            if (handlerProductSelectedForm) handlerProductSelectedForm(prod);
            navigate(`/products/edit/${id}`);
          }}
        />
      )}

      {/* 6. Modal de Lotes y Precios */}
      {lotsProduct && (
        <ProductLotsModal
          product={lotsProduct}
          onClose={() => setLotsProduct(null)}
          onNavigateToEdit={(lot, prod) => {
            setLotsProduct(null);
            const id = prod.idProducto || prod.id;
            if (handlerProductSelectedForm) handlerProductSelectedForm(prod);
            navigate(`/products/edit/${id}`);
          }}
          onSavePrices={async () => {
            if (getProducts) await getProducts();
          }}
        />
      )}
    </div>
  );
};

ProductList.propTypes = {
  products: PropTypes.array,
  isAdmin: PropTypes.bool,
  handlerProductSelectedForm: PropTypes.func,
  handlerRemoveProduct: PropTypes.func,
};

export default ProductList;