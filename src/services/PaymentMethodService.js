import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/payment-methods`;

export const findAllPaymentMethods = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener métodos de pago:", error);
        throw error;
    }
};

export const findActivePaymentMethods = async () => {
    try {
        const response = await productsApi.get(`${BASE_URL}/active`);
        return response;
    } catch (error) {
        console.error("Error al obtener métodos de pago activos:", error);
        throw error;
    }
};

export const findPaymentMethodById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener método de pago por ID:", error);
        throw error;
    }
};

export const savePaymentMethod = async (paymentMethod) => {
    try {
        const payload = {
            nombre: paymentMethod.nombre?.trim() || "",
            descripcion: paymentMethod.descripcion?.trim() || "",
            recargoPorcentaje: Number(paymentMethod.recargoPorcentaje || paymentMethod.recargo || 0),
            activo: paymentMethod.activo !== undefined ? paymentMethod.activo : true,
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar método de pago:", error);
        throw error;
    }
};

export const updatePaymentMethod = async (id, paymentMethod) => {
    try {
        const payload = {
            nombre: paymentMethod.nombre?.trim() || "",
            descripcion: paymentMethod.descripcion?.trim() || "",
            recargoPorcentaje: Number(paymentMethod.recargoPorcentaje || paymentMethod.recargo || 0),
            activo: paymentMethod.activo !== undefined ? paymentMethod.activo : true,
        };
        return await productsApi.put(`${BASE_URL}/${id}`, payload);
    } catch (error) {
        console.error("Error al actualizar método de pago:", error);
        throw error;
    }
};

export const deletePaymentMethod = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar método de pago:", error);
        throw error;
    }
};
