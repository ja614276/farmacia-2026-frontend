import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/client-payments`;

export const findAllPayments = async () => {
    try {
        return await productsApi.get(BASE_URL);
    } catch (error) {
        console.error("Error al obtener cobranzas:", error);
        throw error;
    }
};

export const findPaymentById = async (id) => {
    try {
        return await productsApi.get(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al obtener cobranza por id:", error);
        throw error;
    }
};

export const getCollectionsStats = async () => {
    try {
        return await productsApi.get(`${BASE_URL}/stats`);
    } catch (error) {
        console.error("Error al obtener estadísticas de cobranzas:", error);
        throw error;
    }
};

export const getDebtorsRanking = async () => {
    try {
        return await productsApi.get(`${BASE_URL}/debtors`);
    } catch (error) {
        console.error("Error al obtener ranking de deudores:", error);
        throw error;
    }
};

export const getClientPendingSales = async (clientId) => {
    try {
        return await productsApi.get(`${BASE_URL}/client/${clientId}/pending-sales`);
    } catch (error) {
        console.error("Error al obtener ventas pendientes del cliente:", error);
        throw error;
    }
};

export const registerPayment = async (paymentData) => {
    try {
        let paymentDateStr = paymentData.paymentDate || paymentData.fechaPago;
        if (paymentDateStr) {
            paymentDateStr = paymentDateStr.replace("T", " ").trim();
            if (paymentDateStr.length === 16) {
                paymentDateStr += ":00";
            }
        } else {
            paymentDateStr = new Date().toISOString().slice(0, 19).replace("T", " ");
        }

        const payload = {
            saleId: paymentData.saleId || paymentData.idVenta || null,
            clientId: paymentData.clientId || paymentData.idCliente || null,
            amount: Number(paymentData.amount || paymentData.monto || 0),
            paymentMethodId: paymentData.paymentMethodId || paymentData.idFormaPago || null,
            paymentMethodName: paymentData.paymentMethodName || paymentData.medioPago || "EFECTIVO",
            paymentDate: paymentDateStr,
            reference: paymentData.reference || paymentData.referencia || "",
            employeeId: paymentData.employeeId || paymentData.idEmpleado || null,
            employeeName: paymentData.employeeName || paymentData.empleadoNombre || "",
            clientName: paymentData.clientName || paymentData.clienteNombre || "",
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al registrar cobranza:", error);
        throw error;
    }
};

export const voidPayment = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al anular cobro:", error);
        throw error;
    }
};
