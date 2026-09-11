import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/products`;

export const findAll = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener productos:", error);
        throw error;
    }
};

export const findById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener producto por ID:", error);
        throw error;
    }
};

export const save = async (product) => {
    try {
        const payload = {
            nombre: (product.nombre || product.name || "").trim(),
            principioActivo: (product.principioActivo || "").trim(),
            concentracion: (product.concentracion || "").trim(),
            formaFarmaceutica: (product.formaFarmaceutica || "").trim(),
            requiereReceta: Boolean(product.requiereReceta),
            codigoBarras: (product.codigoBarras || product.codigo || "").trim(),
            registroSanitario: (product.registroSanitario || "").trim(),
            codDigemid: (product.codDigemid || "").trim(),
            patologia: (product.patologia || "").trim(),
            imagen: product.imagen || "",
            precioVenta: Number(product.precioVenta ?? product.price ?? 0),
            stockReal: Number(product.stockReal ?? product.stock ?? 0),
            laboratorioNombre: (product.laboratorioNombre || "").trim(),
            categoria: product.idCategoria ? { id: Number(product.idCategoria) } : null,
            laboratorio: product.idLaboratorio ? { id: Number(product.idLaboratorio) } : null,
            proveedor: product.idProveedor ? { id: Number(product.idProveedor) } : null,
            ubicacion: product.idUbicacion ? { id: Number(product.idUbicacion) } : null,
            presentaciones: (product.presentaciones || []).map((p) => ({
                idPresentacion: p.idPresentacion || null,
                nombrePresentacion: (p.nombrePresentacion || "").trim(),
                cantidadUnidades: Number(p.cantidadUnidades) || 1,
                precioVenta: Number(p.precioVenta) || 0,
                activo: p.activo !== undefined ? p.activo : true,
                isActive: p.isActive !== undefined ? p.isActive : true,
            })),
        };

        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar el producto:", error);
        throw error;
    }
};

export const update = async (product) => {
    try {
        const targetId = product.idProducto || product.id;

        const payload = {
            nombre: (product.nombre || product.name || "").trim(),
            principioActivo: (product.principioActivo || "").trim(),
            concentracion: (product.concentracion || "").trim(),
            formaFarmaceutica: (product.formaFarmaceutica || "").trim(),
            requiereReceta: Boolean(product.requiereReceta),
            codigoBarras: (product.codigoBarras || product.codigo || "").trim(),
            registroSanitario: (product.registroSanitario || "").trim(),
            codDigemid: (product.codDigemid || "").trim(),
            patologia: (product.patologia || "").trim(),
            imagen: product.imagen || "",
            precioVenta: Number(product.precioVenta ?? product.price ?? 0),
            stockReal: Number(product.stockReal ?? product.stock ?? 0),
            laboratorioNombre: (product.laboratorioNombre || "").trim(),
            idCategoria: product.idCategoria ? Number(product.idCategoria) : null,
            idLaboratorio: product.idLaboratorio ? Number(product.idLaboratorio) : null,
            idProveedor: product.idProveedor ? Number(product.idProveedor) : null,
            idUbicacion: product.idUbicacion ? Number(product.idUbicacion) : null,
            presentaciones: (product.presentaciones || []).map((p) => ({
                idPresentacion: p.idPresentacion || null,
                nombrePresentacion: (p.nombrePresentacion || "").trim(),
                cantidadUnidades: Number(p.cantidadUnidades) || 1,
                precioVenta: Number(p.precioVenta) || 0,
                activo: p.activo !== undefined ? p.activo : true,
                isActive: p.isActive !== undefined ? p.isActive : true,
            })),
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