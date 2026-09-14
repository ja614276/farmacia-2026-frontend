import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/report`;

export const getTopSellingProducts = async (params = {}) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/top-products`, { params });
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener los productos más vendidos:", error);
        return [];
    }
};

export const getSalesSummary = async (params = {}) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/sales`, { params });
        return response.data || null;
    } catch (error) {
        console.error("Error al obtener el resumen general de ventas:", error);
        return null;
    }
};

export const getSalesByEmployee = async (params = {}) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/sales/by-employee`, { params });
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener ventas por empleado:", error);
        return [];
    }
};

export const getSalesByClient = async (params = {}) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/sales/by-client`, { params });
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener ventas por cliente:", error);
        return [];
    }
};

export const getSalesProfit = async (params = {}) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/sales/profit`, { params });
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener reporte de utilidades por venta:", error);
        return [];
    }
};

// ==========================================
// SERVICIOS PARA EL MÓDULO DE FINANZAS
// ==========================================

export const getClientDebtors = async () => {
    try {
        const response = await productsApi.get("/client-payments/debtors");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener ranking de deudores:", error);
        return [];
    }
};

export const getClientPayments = async () => {
    try {
        const response = await productsApi.get("/client-payments");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener historial de pagos:", error);
        return [];
    }
};

export const getCashSessions = async () => {
    try {
        const response = await productsApi.get("/cash-sessions");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener sesiones de caja:", error);
        return [];
    }
};

export const getCashMovements = async () => {
    try {
        const response = await productsApi.get("/cash-movements");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener movimientos de caja:", error);
        return [];
    }
};

export const getAllSales = async () => {
    try {
        const response = await productsApi.get("/sales");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener ventas:", error);
        return [];
    }
};

// ==========================================
// SERVICIOS PARA EL MÓDULO DE PROVEEDORES
// ==========================================

export const getAllPurchases = async () => {
    try {
        const response = await productsApi.get("/purchases");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener compras de proveedores:", error);
        return [];
    }
};

export const getAllSuppliers = async () => {
    try {
        const response = await productsApi.get("/suppliers");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        return [];
    }
};

// ==========================================
// SERVICIOS PARA EL MÓDULO DE KARDEX
// ==========================================

export const getAllLots = async () => {
    try {
        const response = await productsApi.get("/lots");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener lotes:", error);
        return [];
    }
};

export const getAllProducts = async () => {
    try {
        const response = await productsApi.get("/products");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return [];
    }
};

export const getAllInventoryAdjustments = async () => {
    try {
        const response = await productsApi.get("/inventory-adjustments");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener ajustes de inventario:", error);
        return [];
    }
};

export const getAllCategories = async () => {
    try {
        const response = await productsApi.get("/categories");
        return response.data || [];
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        return [];
    }
};

