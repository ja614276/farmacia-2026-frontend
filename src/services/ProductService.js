import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/products`;

export const findAll = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener productos:", error);
        throw error;
    }
};

export const save = async (product) => {
    try {
        const payload = {
            nombre: product.nombre || product.name,
            principioActivo: product.principioActivo || "",
            concentracion: product.concentracion || "",
            formaFarmaceutica: product.formaFarmaceutica || "",
            requiereReceta: Boolean(product.requiereReceta),
            codigoBarras: product.codigoBarras || product.codigo || "",
            registroSanitario: product.registroSanitario || "",
            codDigemid: product.codDigemid || "",
            patologia: product.patologia || "",
            precioVenta: Number(product.precioVenta ?? product.price ?? 0),
            stockReal: Number(product.stockReal ?? product.stock ?? 0),
            idCategoria: product.idCategoria || product.categoria?.id || product.category?.id || null,
        };

        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar el producto:", error);
        throw error;
    }
};

export const update = async (product) => {
    try {
        // Resuelve si el identificador viene como idProducto o id
        const targetId = product.idProducto || product.id;

        const payload = {
            nombre: product.nombre || product.name,
            principioActivo: product.principioActivo || "",
            concentracion: product.concentracion || "",
            formaFarmaceutica: product.formaFarmaceutica || "",
            requiereReceta: Boolean(product.requiereReceta),
            codigoBarras: product.codigoBarras || product.codigo || "",
            registroSanitario: product.registroSanitario || "",
            codDigemid: product.codDigemid || "",
            patologia: product.patologia || "",
            precioVenta: Number(product.precioVenta ?? product.price ?? 0),
            stockReal: Number(product.stockReal ?? product.stock ?? 0),
            idCategoria: product.idCategoria || product.categoria?.id || product.category?.id || null,
        };

        return await productsApi.put(`${BASE_URL}/${targetId}`, payload);
    } catch (error) {
        console.error("Error al actualizar el producto:", error);
        throw error;
    }
};

export const remove = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al eliminar el producto:", error);
        throw error;
    }
};