import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/categories`;

export const findAllCategories = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        throw error;
    }
};

export const findCategoryById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener categoría por id:", error);
        throw error;
    }
};

export const saveCategory = async (category) => {
    try {
        const payload = {
            nombre: category.nombre?.trim() || "",
            descripcion: category.descripcion?.trim() || "",
            isActive: category.isActive !== undefined ? category.isActive : true,
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar la categoría:", error);
        throw error;
    }
};

export const updateCategory = async (id, category) => {
    try {
        const payload = {
            nombre: category.nombre?.trim() || "",
            descripcion: category.descripcion?.trim() || "",
            isActive: category.isActive !== undefined ? category.isActive : true,
        };
        return await productsApi.put(`${BASE_URL}/${id}`, payload);
    } catch (error) {
        console.error("Error al actualizar la categoría:", error);
        throw error;
    }
};

export const removeCategory = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar la categoría:", error);
        throw error;
    }
};
