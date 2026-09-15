import productsApi from "../apis/productsApi.js";

export const getCompanyInfo = async () => {
    try {
        const response = await productsApi.get("/company");
        return response;
    } catch (error) {
        console.error("Error al obtener datos de la empresa:", error);
        throw error;
    }
};

export const saveOrUpdateCompany = async (companyData) => {
    try {
        const payload = {
            id: companyData.id || null,
            legalName: (companyData.legalName || "").trim(),
            commercialName: (companyData.commercialName || "").trim(),
            taxId: (companyData.taxId || "").trim(),
            phone: (companyData.phone || "").trim(),
            address: (companyData.address || "").trim(),
            email: (companyData.email || "").trim(),
            ticketFooterText1: (companyData.ticketFooterText1 || "").trim(),
            ticketFooterText2: (companyData.ticketFooterText2 || "").trim(),
            ticketPaperSize: companyData.ticketPaperSize || "80mm",
            alertExpirationDays: companyData.alertExpirationDays ?? 30,
            alertMinStockPercent: companyData.alertMinStockPercent ?? 20,
            alertEnableExpiration: companyData.alertEnableExpiration ?? true,
            alertEnableMinStock: companyData.alertEnableMinStock ?? true,
            logoUrl: companyData.logoUrl || null,
            isActive: true,
        };

        // El endpoint del backend soporta PUT /company
        return await productsApi.put("/company", payload);
    } catch (error) {
        console.error("Error al guardar datos de la empresa:", error);
        throw error;
    }
};

export const uploadCompanyLogo = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        return await productsApi.post("/company/upload-logo", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    } catch (error) {
        console.error("Error al subir logotipo de la empresa:", error);
        throw error;
    }
};
