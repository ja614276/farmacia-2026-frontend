import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/cash-movements`;

export const findAllCashMovements = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener movimientos de caja:", error);
        throw error;
    }
};

export const findCashMovementsBySession = async (sessionId) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/session/${sessionId}`);
        return response;
    } catch (error) {
        console.error("Error al obtener movimientos de la sesión:", error);
        throw error;
    }
};

export const findCashMovementById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener movimiento por ID:", error);
        throw error;
    }
};

export const saveCashMovement = async (movement) => {
    try {
        const payload = {
            tipo: movement.tipo?.trim().toUpperCase() || "INGRESO",
            concepto: movement.concepto?.trim() || "",
            monto: Number(movement.monto) || 0,
            fechaHora: movement.fechaHora || new Date().toISOString().slice(0, 19).replace("T", " "),
            sessionId: movement.sessionId || null,
            employeeId: movement.employeeId || null,
            usuario: movement.usuario || movement.responsable || "Admin Sistema",
            isActive: true,
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al registrar movimiento de caja:", error);
        throw error;
    }
};

export const updateCashMovement = async (id, movement) => {
    try {
        const payload = {
            tipo: movement.tipo?.trim().toUpperCase() || "INGRESO",
            concepto: movement.concepto?.trim() || "",
            monto: Number(movement.monto) || 0,
            fechaHora: movement.fechaHora || null,
            sessionId: movement.sessionId || null,
            employeeId: movement.employeeId || null,
            usuario: movement.usuario || movement.responsable || null,
            isActive: movement.isActive !== undefined ? movement.isActive : true,
        };
        return await productsApi.put(`${BASE_URL}/${id}`, payload);
    } catch (error) {
        console.error("Error al actualizar movimiento de caja:", error);
        throw error;
    }
};

export const deleteCashMovement = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar movimiento de caja:", error);
        throw error;
    }
};
