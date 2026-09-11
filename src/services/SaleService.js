import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/sales`;

export const findAllSales = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
        return response;
    } catch (error) {
        console.error("Error al obtener ventas:", error);
        throw error;
    }
};

export const findSaleById = async (id) => {
    try {
        const response = await productsApi.get(`${BASE_URL}/${id}`);
        return response;
    } catch (error) {
        console.error("Error al obtener venta por id:", error);
        throw error;
    }
};

export const saveSale = async (sale) => {
    try {
        const payload = {
            dateTime: sale.dateTime || new Date().toISOString().slice(0, 19).replace("T", " "),
            saleType: sale.saleType || sale.tipoVenta || "CONTADO",
            receiptType: sale.receiptType || sale.tipoComprobante || "BOLETA",
            series: sale.series || sale.serie || "B001",
            receiptNumber: sale.receiptNumber || sale.numComprobante || "",
            clientId: sale.clientId || sale.idCliente || null,
            clientName: sale.clientName || sale.clienteNombre || "PÚBLICO GENERAL",
            employeeId: sale.employeeId || sale.idEmpleado || null,
            employeeName: sale.employeeName || sale.empleadoNombre || "",
            paymentMethodId: sale.paymentMethodId || sale.idFormaPago || null,
            paymentMethodName: sale.paymentMethodName || sale.medioPago || "EFECTIVO",
            paymentStatus: sale.paymentStatus || sale.estadoPago || "PAGADO",
            subtotal: Number(sale.subtotal || 0),
            taxAmount: Number(sale.taxAmount || 0),
            surchargeAmount: Number(sale.surchargeAmount || 0),
            total: Number(sale.total || 0),
            amountPaid: Number(sale.amountPaid || sale.montoPagado || sale.total || 0),
            pendingBalance: Number(sale.pendingBalance || sale.saldoPendiente || 0),
            isActive: sale.isActive !== undefined ? sale.isActive : true,
            details: (sale.details || sale.detalles || []).map((d) => ({
                presentationId: d.presentationId || null,
                productName: d.productName || d.nombre || "",
                presentationName: d.presentationName || d.presentacion || "Unidad",
                presentationQuantity: Number(d.presentationQuantity || d.cantidad || 1),
                presentationUnitPrice: Number(d.presentationUnitPrice || d.precioUnitario || d.precio || 0),
                baseUnitsQuantity: Number(d.baseUnitsQuantity || d.cantidad || 1),
                baseUnitCost: Number(d.baseUnitCost || 0),
                subtotal: Number(d.subtotal || (Number(d.presentationQuantity || d.cantidad || 1) * Number(d.presentationUnitPrice || d.precioUnitario || d.precio || 0))),
                lotId: d.lotId || null,
                lotNumber: d.lotNumber || "",
                isActive: true,
            })),
        };
        return await productsApi.post(BASE_URL, payload);
    } catch (error) {
        console.error("Error al registrar venta:", error);
        throw error;
    }
};

export const updateSale = async (id, sale) => {
    try {
        const payload = {
            dateTime: sale.dateTime,
            saleType: sale.saleType || sale.tipoVenta,
            receiptType: sale.receiptType || sale.tipoComprobante,
            series: sale.series || sale.serie,
            receiptNumber: sale.receiptNumber || sale.numComprobante,
            clientId: sale.clientId || sale.idCliente,
            clientName: sale.clientName || sale.clienteNombre,
            employeeId: sale.employeeId || sale.idEmpleado,
            employeeName: sale.employeeName || sale.empleadoNombre,
            paymentMethodId: sale.paymentMethodId || sale.idFormaPago,
            paymentMethodName: sale.paymentMethodName || sale.medioPago,
            paymentStatus: sale.paymentStatus || sale.estadoPago,
            subtotal: Number(sale.subtotal || 0),
            taxAmount: Number(sale.taxAmount || 0),
            surchargeAmount: Number(sale.surchargeAmount || 0),
            total: Number(sale.total || 0),
            amountPaid: Number(sale.amountPaid || sale.montoPagado || 0),
            pendingBalance: Number(sale.pendingBalance || sale.saldoPendiente || 0),
            isActive: sale.isActive !== undefined ? sale.isActive : true,
            details: (sale.details || sale.detalles || []).map((d) => ({
                id: d.id || null,
                presentationId: d.presentationId || null,
                productName: d.productName || d.nombre || "",
                presentationName: d.presentationName || d.presentacion || "Unidad",
                presentationQuantity: Number(d.presentationQuantity || d.cantidad || 1),
                presentationUnitPrice: Number(d.presentationUnitPrice || d.precioUnitario || d.precio || 0),
                baseUnitsQuantity: Number(d.baseUnitsQuantity || d.cantidad || 1),
                baseUnitCost: Number(d.baseUnitCost || 0),
                subtotal: Number(d.subtotal || 0),
                lotId: d.lotId || null,
                lotNumber: d.lotNumber || "",
                isActive: true,
            })),
        };
        return await productsApi.put(`${BASE_URL}/${id}`, payload);
    } catch (error) {
        console.error("Error al actualizar venta:", error);
        throw error;
    }
};

export const removeSale = async (id) => {
    try {
        return await productsApi.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        console.error("Error al anular venta:", error);
        throw error;
    }
};
