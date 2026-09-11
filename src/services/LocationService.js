import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/locations`;

export const findAllLocations = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener ubicaciones:", error);
        throw error;
    }
};

export const findLocationById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener ubicación por id:", error);
        throw error;
    }
};

export const saveLocation = async (location) => {
    try {
        const payload = {
            nombre: location.nombre?.trim() || "",
            descripcion: location.descripcion?.trim() || "",
            pasillo: location.pasillo?.trim() || "",
            estante: location.estante?.trim() || "",
            nivel: location.nivel?.trim() || "",
            isActive: location.isActive !== undefined ? location.isActive : true,
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar la ubicación:", error);
        throw error;
    }
};

export const updateLocation = async (id, location) => {
    try {
        const payload = {
            nombre: location.nombre?.trim() || "",
            descripcion: location.descripcion?.trim() || "",
            pasillo: location.pasillo?.trim() || "",
            estante: location.estante?.trim() || "",
            nivel: location.nivel?.trim() || "",
            isActive: location.isActive !== undefined ? location.isActive : true,
        };
        return await productsApi.put(`${BASE_URL}/${id}`, payload);
    } catch (error) {
        console.error("Error al actualizar la ubicación:", error);
        throw error;
    }
};

export const removeLocation = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar la ubicación:", error);
        throw error;
    }
};
