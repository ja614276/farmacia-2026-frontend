import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/clients`;

export const findAllClients = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        throw error;
    }
};

export const findClientById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener cliente por id:", error);
        throw error;
    }
};

export const saveClient = async (client) => {
    try {
        const payload = {
            firstName: client.firstName || client.nombres?.trim() || "",
            lastName: client.lastName || client.apellidos?.trim() || "",
            identification: client.identification || client.identificacion?.trim() || "",
            phone: client.phone || client.telefono?.trim() || "",
            email: client.email?.trim() || "",
            address: client.address || client.direccion?.trim() || "",
            healthInsurance: client.healthInsurance || client.obraSocial?.trim() || "",
            affiliateNumber: client.affiliateNumber || client.nroAfiliado?.trim() || "",
            creditLimit: Number(client.creditLimit ?? client.limiteCredito ?? 0),
            currentBalance: Number(client.currentBalance ?? client.saldo ?? 0),
            creditDays: Number(client.creditDays ?? client.diasCredito ?? 0),
            isActive: client.isActive !== undefined ? client.isActive : true,
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar el cliente:", error);
        throw error;
    }
};

export const updateClient = async (id, client) => {
    try {
        const payload = {
            firstName: client.firstName || client.nombres?.trim() || "",
            lastName: client.lastName || client.apellidos?.trim() || "",
            identification: client.identification || client.identificacion?.trim() || "",
            phone: client.phone || client.telefono?.trim() || "",
            email: client.email?.trim() || "",
            address: client.address || client.direccion?.trim() || "",
            healthInsurance: client.healthInsurance || client.obraSocial?.trim() || "",
            affiliateNumber: client.affiliateNumber || client.nroAfiliado?.trim() || "",
            creditLimit: Number(client.creditLimit ?? client.limiteCredito ?? 0),
            currentBalance: Number(client.currentBalance ?? client.saldo ?? 0),
            creditDays: Number(client.creditDays ?? client.diasCredito ?? 0),
            isActive: client.isActive !== undefined ? client.isActive : true,
        };
        return await productsApi.put(`${BASE_URL}/${id}`, payload);
    } catch (error) {
        console.error("Error al actualizar el cliente:", error);
        throw error;
    }
};

export const removeClient = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar el cliente:", error);
        throw error;
    }
};
