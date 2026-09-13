import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/payment-conditions`;

export const findAllPaymentConditions = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener condiciones de pago / tipos de venta:", error);
        throw error;
    }
};

export const findActivePaymentConditions = async () => {
    try {
        const response = await productsApi.get(`${BASE_URL}/active`);
        return response;
    } catch (error) {
        console.error("Error al obtener condiciones de pago activas:", error);
        throw error;
    }
};

export const findPaymentConditionById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener condición de pago por ID:", error);
        throw error;
    }
};

export const savePaymentCondition = async (condition) => {
    try {
        const payload = {
            nombre: condition.nombre?.trim() || "",
            dias: Number(condition.dias) || 0,
            isActive: condition.isActive !== undefined ? condition.isActive : true,
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar condición de pago:", error);
        throw error;
    }
};

export const updatePaymentCondition = async (id, condition) => {
    try {
        const payload = {
            nombre: condition.nombre?.trim() || "",
            dias: Number(condition.dias) || 0,
            isActive: condition.isActive !== undefined ? condition.isActive : true,
        };
        return await productsApi.put(`${BASE_URL}/${id}`, payload);
    } catch (error) {
        console.error("Error al actualizar condición de pago:", error);
        throw error;
    }
};

export const deletePaymentCondition = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar condición de pago:", error);
        throw error;
    }
};
