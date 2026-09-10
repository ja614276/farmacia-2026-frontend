import { useState, useEffect } from "react";
import { useProducts } from "../hooks/useProducts.js";
import { initialProductForm } from "../store/slices/products/productsSlice.js";
import { ProductForm } from "../components/ProductForm";
import { useParams } from "react-router-dom";

export const ProductsRegisterPage = () => {
    const { products } = useProducts();
    const [productSelected, setProductSelected] = useState(initialProductForm);
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            const product = products.find(p => p.id == id) || initialProductForm;
            setProductSelected(product);
        } else {
            setProductSelected(initialProductForm); // ✅ Si no hay ID, es nuevo producto
        }
    }, [id, products]);

    // <h4>{productSelected.id > 0 ? "Editar" : "Registrar"}  Producto</h4>

    return (
        <div className="container my-4">
            <div className="row">
                <div className="col">
                    <ProductForm productSelected={productSelected} />
                </div>
            </div>
        </div>
    );
};
