import { useState } from "react";
import { useProducts } from "../hooks/useProducts.js";
import { ProductList } from "../components/ProductList";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/hooks/useAuth.js";
import { ProductDetailModal } from "../components/ProductDetailModal";
import { ProductLotsModal } from "../components/ProductLotsModal";

export const ProductsPage = () => {
    const { 
        products, 
        isLoading, 
        error, 
        handlerRemoveProduct, 
        handlerProductSelectedForm,
        getProducts 
    } = useProducts();
    const navigate = useNavigate();
    const { login } = useAuth();

    // Estados para los dos modales
    const [detailProduct, setDetailProduct] = useState(null);
    const [lotsProduct, setLotsProduct] = useState(null);

    if (isLoading) {
        return (
            <div className="container my-4 text-center">
                <div className="spinner-border text-teal" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container my-4">
                <div className="alert alert-danger">
                    Hubo un error al cargar los productos: {error.message}
                </div>
            </div>
        );
    }

    return (
        <div className="container my-4">
            
            {/*
            
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="m-0 fw-bold text-dark">Lista de Productos</h3>
                {!login.isAdmin || (
                    <button
                        className="btn btn-teal-primary fw-semibold"
                        onClick={() => navigate("/products/register")}
                    >
                        + Nuevo Producto
                    </button>
                )}
            </div>
            
            */}

            {products.length === 0 ? (
                <div className="alert alert-warning">No hay productos registrados en el sistema.</div>
            ) : (
                <ProductList
                    products={products}
                    isAdmin={login.isAdmin}
                    handlerProductSelectedForm={handlerProductSelectedForm}
                    handlerRemoveProduct={handlerRemoveProduct}
                    // 👈 Pasamos los manejadores para abrir los modales:
                    onViewDetail={(prod) => setDetailProduct(prod)}
                    onViewLots={(prod) => setLotsProduct(prod)}
                />
            )}

            {/* Modal de Ficha Técnica */}
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

            {/* Modal de Lotes y Ajuste de Precios */}
            {lotsProduct && (
                <ProductLotsModal
                    product={lotsProduct}
                    onClose={() => setLotsProduct(null)}
                    // 1. Redirigir a editar el producto completo
                    onNavigateToEdit={(lot, prod) => {
                        setLotsProduct(null);
                        const id = prod.idProducto || prod.id;
                        if (handlerProductSelectedForm) handlerProductSelectedForm(prod);
                        navigate(`/products/edit/${id}`);
                    }}
                    // 2. Refrescar lista tras guardar precios
                    onSavePrices={async () => {
                        if (getProducts) await getProducts();
                    }}
                />
            )}
        </div>
    );
};