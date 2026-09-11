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
      const product =
        products.find((p) => String(p.idProducto || p.id) === String(id)) ||
        initialProductForm;
      setProductSelected(product);
    } else {
      setProductSelected(initialProductForm);
    }
  }, [id, products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ProductForm productSelected={productSelected} />
    </div>
  );
};

export default ProductsRegisterPage;
