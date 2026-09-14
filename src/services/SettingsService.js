import productsApi from "../apis/productsApi.js";

const COMPANY_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/company`;
const LOTS_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/lots`;

const SETTINGS_STORAGE_KEY = "farmacia_settings_config";

export const defaultSettings = {
    ticketPaperSize: "80mm", // '58mm' | '80mm' | 'A4'
    alertExpirationDays: 30,
    alertMinStockPercent: 20,
    alertEnableExpiration: true,
    alertEnableMinStock: true,
};

export const getLocalSettings = () => {
    try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Error reading settings from localStorage", e);
    }
    return defaultSettings;
};

export const saveLocalSettings = (settings) => {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Error saving settings to localStorage", e);
    }
};

export const getSettings = async () => {
    try {
        const response = await productsApi.get(COMPANY_URL);
        if (response.data) {
            const serverSettings = {
                ticketPaperSize: response.data.ticketPaperSize || defaultSettings.ticketPaperSize,
                alertExpirationDays: response.data.alertExpirationDays !== undefined && response.data.alertExpirationDays !== null
                    ? response.data.alertExpirationDays
                    : defaultSettings.alertExpirationDays,
                alertMinStockPercent: response.data.alertMinStockPercent !== undefined && response.data.alertMinStockPercent !== null
                    ? response.data.alertMinStockPercent
                    : defaultSettings.alertMinStockPercent,
                alertEnableExpiration: response.data.alertEnableExpiration !== undefined && response.data.alertEnableExpiration !== null
                    ? response.data.alertEnableExpiration
                    : defaultSettings.alertEnableExpiration,
                alertEnableMinStock: response.data.alertEnableMinStock !== undefined && response.data.alertEnableMinStock !== null
                    ? response.data.alertEnableMinStock
                    : defaultSettings.alertEnableMinStock,
                // Mantener también los datos de empresa si se necesitan
                legalName: response.data.legalName,
                commercialName: response.data.commercialName,
                taxId: response.data.taxId,
                address: response.data.address,
                phone: response.data.phone,
                email: response.data.email,
                logoUrl: response.data.logoUrl,
                ticketFooterText1: response.data.ticketFooterText1,
                ticketFooterText2: response.data.ticketFooterText2,
            };
            saveLocalSettings(serverSettings);
            return serverSettings;
        }
    } catch (error) {
        console.warn("Could not fetch settings from backend, using local fallback", error);
    }
    return getLocalSettings();
};

export const saveSettings = async (settingsData) => {
    // Guardar inmediatamente en localStorage
    saveLocalSettings(settingsData);

    try {
        // Obtener datos actuales de la empresa para no sobreescribir otros campos
        let currentCompany = {};
        try {
            const res = await productsApi.get(COMPANY_URL);
            if (res.data) currentCompany = res.data;
        } catch (_) {}

        const payload = {
            ...currentCompany,
            ticketPaperSize: settingsData.ticketPaperSize || "80mm",
            alertExpirationDays: Number(settingsData.alertExpirationDays ?? 30),
            alertMinStockPercent: Number(settingsData.alertMinStockPercent ?? 20),
            alertEnableExpiration: Boolean(settingsData.alertEnableExpiration),
            alertEnableMinStock: Boolean(settingsData.alertEnableMinStock),
            ticketFooterText1: settingsData.ticketFooterText1 !== undefined ? settingsData.ticketFooterText1 : currentCompany.ticketFooterText1,
            ticketFooterText2: settingsData.ticketFooterText2 !== undefined ? settingsData.ticketFooterText2 : currentCompany.ticketFooterText2,
            isActive: true,
        };

        const response = await productsApi.put(COMPANY_URL, payload);
        if (response.data) {
            saveLocalSettings({
                ...payload,
                ...response.data
            });
        }
        return response;
    } catch (error) {
        console.error("Error saving settings to backend:", error);
        throw error;
    }
};

export const getAllLots = async () => {
    try {
        const response = await productsApi.get(LOTS_URL);
        return response.data || [];
    } catch (error) {
        console.error("Error fetching all lots:", error);
        return [];
    }
};
