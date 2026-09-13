import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import {
    addProduct,
    removeProduct,
    updateProduct,
    onProductSelectedForm,
    onOpenForm,
    onCloseForm,
    loadingError,
    loadingProducts // ✅ Acción correcta para cargar productos en Redux
} from "../store/slices/products/productsSlice.js";
import { useAuth } from "../auth/hooks/useAuth.js";
import { findAll, save, update, remove } from "../services/ProductService.js"; // ✅ Servicio correcto para productos

export const useProducts = () => {
    const { products, productSelected, visibleForm, errors, isLoading } = useSelector(state => state.products);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { login, handlerLogout } = useAuth();

    // 🔥 Cargar productos al montar el hook
    useEffect(() => {
        getProducts();
    }, []);

    // ✅ Obtener productos correctamente
    const getProducts = async () => {
        try {
            const result = await findAll();
            console.log(result);
            dispatch(loadingProducts(result.data)); // ✅ Usamos la acción correcta
        } catch (error) {
            if (error.response?.status === 401) {
                handlerLogout();
            } else {
                console.error("Error al obtener productos:", error);
                Swal.fire("Error", "No se pudieron cargar los productos", "error");
            }
        }
    };

    // ✅ Agregar o actualizar un producto
    const handlerAddProduct = async (product) => {
        let response;
        try {
            if (product.id === 0) {
                response = await save(product);
                dispatch(addProduct(response.data));
            } else {
                response = await update(product);
                dispatch(updateProduct(response.data));
            }

            Swal.fire(
                product.id === 0 ? "Producto Creado" : "Producto Actualizado",
                product.id === 0 ? "El producto ha sido creado con éxito!" : "El producto ha sido actualizado con éxito!",
                "success"
            );

            handlerCloseForm();
            navigate('/products');  // Redirigir a la lista de productos
        } catch (error) {
            console.error("Error al guardar producto:", error);
            if (error.response?.status === 400) {
                dispatch(loadingError(error.response.data));
            } else if (error.response?.status === 401) {
                handlerLogout();
            } else {
                Swal.fire("Error", "Hubo un problema al guardar el producto", "error");
            }
        }
    };

    // ✅ Eliminar un producto
    const handlerRemoveProduct = (id) => {
        Swal.fire({
            title: "¿Está seguro de eliminar?",
            text: "¡El producto será eliminado!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, eliminar!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await remove(id);
                    dispatch(removeProduct(id));
                    getProducts();
                    Swal.fire("Producto Eliminado!", "El producto ha sido eliminado con éxito!", "success");
                } catch (error) {
                    const errorMsg = error.response?.data?.message || error.message || "Hubo un problema al eliminar el producto";
                    if (error.response?.status === 401) {
                        handlerLogout();
                    } else {
                        Swal.fire("Error al eliminar", errorMsg, "error");
                    }
                }
            }
        });
    };

    // ✅ Seleccionar un producto para editar
    const handlerProductSelectedForm = (product) => {
        dispatch(onProductSelectedForm(product));
    };

    // ✅ Abrir el formulario para agregar/editar un producto
    const handlerOpenForm = () => {
        dispatch(onOpenForm());
    };

    // ✅ Cerrar el formulario
    const handlerCloseForm = () => {
        dispatch(onCloseForm());
        dispatch(loadingError({})); // Limpiar errores del formulario
    };

    return {
        products,
        productSelected,
        visibleForm,
        errors,
        isLoading,
        handlerAddProduct,
        handlerRemoveProduct,
        handlerProductSelectedForm,
        handlerOpenForm,
        handlerCloseForm,
        getProducts,
    };
};
