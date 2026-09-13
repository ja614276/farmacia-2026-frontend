import productsApi from "../apis/productsApi.js";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/company`;

export const getCompanyInfo = async () => {
    try {
        const response = await productsApi.get(BASE_URL);
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
            logoUrl: companyData.logoUrl || null,
            isActive: true,
        };

        // El endpoint del backend soporta PUT /company
        return await productsApi.put(BASE_URL, payload);
    } catch (error) {
        console.error("Error al guardar datos de la empresa:", error);
        throw error;
    }
};
