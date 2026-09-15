import { useProducts } from "../hooks/useProducts.js";
import { ProductList } from "../components/ProductList";
import { useAuth } from "../auth/hooks/useAuth.js";

export const ProductsPage = () => {
    const { 
        products, 
        isLoading, 
        error, 
        handlerRemoveProduct, 
        handlerProductSelectedForm,
    } = useProducts();
    const { login } = useAuth();

    if (isLoading) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center">
                <div className="flex items-center gap-3 text-zinc-700 font-semibold text-xs">
                    <svg className="animate-spin h-5 w-5 text-zinc-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Cargando catálogo de medicamentos...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                Hubo un error al cargar los productos: {error.message || "Error del servidor"}
            </div>
        );
    }

    return (
        <ProductList
            products={products}
            isAdmin={Boolean(login?.isAdmin)}
            handlerProductSelectedForm={handlerProductSelectedForm}
            handlerRemoveProduct={handlerRemoveProduct}
        />
    );
};

export default ProductsPage;