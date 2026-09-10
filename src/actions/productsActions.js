// productsActions.js
import axios from "axios";
import { addProduct, updateProduct, removeProduct, loadingProducts } from "../store/slices/products/productsSlice.js";

const API_URL = "http://localhost:8080/api/products";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        : { "Content-Type": "application/json" };
};

export const fetchProducts = () => async (dispatch) => {
    try {
        const response = await axios.get(API_URL, { headers: getAuthHeaders() });
        dispatch(loadingProducts(response.data));
    } catch (error) {
        console.error("❌ Error al obtener productos:", error.response?.data || error.message);
    }
};

export const createProduct = (product) => async (dispatch) => {
    try {
        const response = await axios.post(API_URL, product, { headers: getAuthHeaders() });
        dispatch(addProduct(response.data));
    } catch (error) {
        console.error("❌ Error al agregar producto:", error.response?.data || error.message);
    }
};

export const editProduct = (product) => async (dispatch) => {
    try {
        const response = await axios.put(`${API_URL}/${product.id}`, product, { headers: getAuthHeaders() });
        dispatch(updateProduct(response.data));
    } catch (error) {
        console.error("❌ Error al actualizar producto:", error.response?.data || error.message);
    }
};

export const deleteProduct = (id) => async (dispatch) => {
    try {
        await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
        dispatch(removeProduct(id));
    } catch (error) {
        console.error("❌ Error al eliminar producto:", error.response?.data || error.message);
    }
};