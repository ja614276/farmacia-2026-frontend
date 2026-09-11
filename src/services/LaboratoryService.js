import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/laboratories`;

export const findAllLaboratories = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener laboratorios:", error);
        throw error;
    }
};

export const findLaboratoryById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener laboratorio por id:", error);
        throw error;
    }
};

export const saveLaboratory = async (laboratory) => {
    try {
        const payload = {
            nombre: laboratory.nombre?.trim() || "",
            telefono: laboratory.telefono?.trim() || "",
            email: laboratory.email?.trim() || "",
            direccion: laboratory.direccion?.trim() || "",
            isActive: laboratory.isActive !== undefined ? laboratory.isActive : true,
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar el laboratorio:", error);
        throw error;
    }
};

export const updateLaboratory = async (id, laboratory) => {
    try {
        const payload = {
            nombre: laboratory.nombre?.trim() || "",
            telefono: laboratory.telefono?.trim() || "",
            email: laboratory.email?.trim() || "",
            direccion: laboratory.direccion?.trim() || "",
            isActive: laboratory.isActive !== undefined ? laboratory.isActive : true,
        };
        return await productsApi.put(`${BASE_URL}/${id}`, payload);
    } catch (error) {
        console.error("Error al actualizar el laboratorio:", error);
        throw error;
    }
};

export const removeLaboratory = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar el laboratorio:", error);
        throw error;
    }
};
