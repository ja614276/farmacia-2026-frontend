import axios from "axios";
import { 
    loadingLots, 
    addLot, 
    updateLot, 
    removeLot, 
    setLoading, 
    setError 
} from "../slices/lots/lotsSlice.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const API_URL = `${BASE_URL}/lots`;

const getAuthHeaders = () => {
    let token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return { "Content-Type": "application/json" };

    const authHeader = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return {
        "Content-Type": "application/json",
        "Authorization": authHeader,
    };
};

// 1. Obtener lotes por ID de Producto
export const fetchLotsByProduct = (productId) => async (dispatch) => {
    dispatch(setLoading());
    try {
        const response = await axios.get(`${API_URL}/product/${productId}`, { 
            headers: getAuthHeaders() 
        });
        dispatch(loadingLots(response.data));
    } catch (error) {
        console.error("❌ Error al obtener lotes:", error.response?.data || error.message);
        dispatch(setError(error.response?.data?.message || error.message));
    }
};

// 2. Crear un nuevo lote
export const createLot = (lotData) => async (dispatch) => {
    try {
        const response = await axios.post(API_URL, lotData, { 
            headers: getAuthHeaders() 
        });
        dispatch(addLot(response.data));
        return { success: true, data: response.data };
    } catch (error) {
        console.error("❌ Error al registrar lote:", error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

// 3. Actualizar lote existente
export const editLot = (lotData) => async (dispatch) => {
    const lotId = lotData.idLote || lotData.id;
    try {
        const response = await axios.put(`${API_URL}/${lotId}`, lotData, { 
            headers: getAuthHeaders() 
        });
        dispatch(updateLot(response.data));
        return { success: true, data: response.data };
    } catch (error) {
        console.error("❌ Error al actualizar lote:", error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

// 4. Eliminación lógica de lote
export const deleteLot = (idLote) => async (dispatch) => {
    try {
        await axios.delete(`${API_URL}/${idLote}`, { 
            headers: getAuthHeaders() 
        });
        dispatch(removeLot(idLote));
        return { success: true };
    } catch (error) {
        console.error("❌ Error al eliminar lote:", error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};