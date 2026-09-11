import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/suppliers`;

export const findAllSuppliers = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        throw error;
    }
};

export const findSupplierById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener proveedor por id:", error);
        throw error;
    }
};

export const saveSupplier = async (supplier) => {
    try {
        const payload = {
            nombre: supplier.nombre?.trim() || "",
            contacto: supplier.contacto?.trim() || "",
            telefono: supplier.telefono?.trim() || "",
            email: supplier.email?.trim() || "",
            direccion: supplier.direccion?.trim() || "",
            isActive: supplier.isActive !== undefined ? supplier.isActive : true,
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar el proveedor:", error);
        throw error;
    }
};

export const updateSupplier = async (id, supplier) => {
    try {
        const payload = {
            nombre: supplier.nombre?.trim() || "",
            contacto: supplier.contacto?.trim() || "",
            telefono: supplier.telefono?.trim() || "",
            email: supplier.email?.trim() || "",
            direccion: supplier.direccion?.trim() || "",
            isActive: supplier.isActive !== undefined ? supplier.isActive : true,
        };
        return await productsApi.put(`${BASE_URL}/${id}`, payload);
    } catch (error) {
        console.error("Error al actualizar el proveedor:", error);
        throw error;
    }
};

export const removeSupplier = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar el proveedor:", error);
        throw error;
    }
};
