import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/inventory-adjustments`;
const LOTS_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/lots`;

export const findAllAdjustments = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener ajustes de inventario:", error);
        throw error;
    }
};

export const findAdjustmentById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener ajuste por ID:", error);
        throw error;
    }
};

export const createAdjustment = async (data) => {
    try {
        let formattedDate = data.fecha;
        if (formattedDate) {
            formattedDate = formattedDate.replace("T", " ");
            if (formattedDate.length === 16) {
                formattedDate += ":00";
            }
        } else {
            formattedDate = new Date().toISOString().slice(0, 19).replace("T", " ");
        }

        const payload = {
            tipoAjuste: data.tipoAjuste || "ENTRADA",
            cantidad: Number(data.cantidad),
            motivo: (data.motivo || "").trim(),
            fecha: formattedDate,
            idProducto: Number(data.idProducto),
            idLote: Number(data.idLote),
            idEmpleado: data.idEmpleado ? Number(data.idEmpleado) : null,
        };

        const response = await productsApi.post(BASE_URL, payload);
        return response;
    } catch (error) {
        console.error("Error al registrar ajuste de inventario:", error);
        throw error;
    }
};

export const deleteAdjustment = async (id) => {
    try {
        const response = await productsApi.delete(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al eliminar ajuste de inventario:", error);
        throw error;
    }
};

export const findLotsByProduct = async (productId) => {
    try {
        const response = await productsApi.get(`${LOTS_URL}/product/${productId}`);
        return response;
    } catch (error) {
        console.error("Error al obtener lotes del producto:", error);
        throw error;
    }
};

export const createLot = async (lotData) => {
    try {
        let venc = lotData.fechaVencimiento;
        if (venc && venc.length === 10) {
            venc += " 00:00:00";
        }
        const payload = {
            idProducto: Number(lotData.idProducto),
            nroLote: (lotData.nroLote || "").trim().toUpperCase(),
            fechaVencimiento: venc,
            cantidadInicial: Number(lotData.cantidadInicial || 0),
            cantidadActual: Number(lotData.cantidadActual || 0),
            costoUnitario: Number(lotData.costoUnitario || 0),
        };
        const response = await productsApi.post(LOTS_URL, payload);
        return response;
    } catch (error) {
        console.error("Error al crear lote:", error);
        throw error;
    }
};
