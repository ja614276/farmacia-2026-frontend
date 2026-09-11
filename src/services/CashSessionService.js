import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/cash-sessions`;

export const findAllCashSessions = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener sesiones de caja:", error);
        throw error;
    }
};

export const getActiveCashSession = async () => {
    try {
        const response = await productsApi.get(`${BASE_URL}/active`);
        return response;
    } catch (error) {
        console.error("Error al obtener sesión de caja activa:", error);
        throw error;
    }
};

export const findCashSessionById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener sesión de caja por ID:", error);
        throw error;
    }
};

export const openCashSession = async ({ initialAmount, employeeName, employeeId }) => {
    try {
        const payload = {
            initialAmount: Number(initialAmount) || 0.0,
            employeeName: employeeName || "Admin Sistema",
            employeeId: employeeId || 1,
        };
        return await productsApi.post(`${BASE_URL}/open`, payload);
    } catch (error) {
        console.error("Error al abrir sesión de caja:", error);
        throw error;
    }
};

export const getCashSessionSummary = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}/summary`);
        return response;
    } catch (error) {
        console.error("Error al obtener resumen de sesión de caja:", error);
        throw error;
    }
};

export const closeCashSession = async (id, { actualFinalAmount, observations, employeeName, employeeId }) => {
    try {
        const payload = {
            actualFinalAmount: Number(actualFinalAmount) || 0.0,
            observations: observations || "",
            employeeName: employeeName || "Admin Sistema",
            employeeId: employeeId || 1,
        };
        return await productsApi.put(`${BASE_URL}/${id}/close`, payload);
    } catch (error) {
        console.error("Error al cerrar sesión de caja:", error);
        throw error;
    }
};


