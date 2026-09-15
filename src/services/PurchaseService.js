import productsApi from "../apis/productsApi";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/purchases`;

export const findAllPurchases = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener compras:", error);
        throw error;
    }
};

export const findPurchaseById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener compra por id:", error);
        throw error;
    }
};

export const savePurchase = async (purchase) => {
    try {
        return await productsApi.post(BASE_URL, purchase);
    } catch (error) {
        console.error("Error al guardar la compra:", error);
        throw error;
    }
};

export const updatePurchase = async (id, purchase) => {
    try {
        return await productsApi.put(`${BASE_URL}/${id}`, purchase);
    } catch (error) {
        console.error("Error al actualizar la compra:", error);
        throw error;
    }
};

export const removePurchase = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar la compra:", error);
        throw error;
    }
};
