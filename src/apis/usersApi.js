import axios from "axios";
import { getStoredToken, isTokenExpired, clearStorageSession } from "../auth/utils/tokenUtils";

const usersApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    timeout: 30000,
});

// 1. Interceptor de petición: inyecta el token JWT desde LocalStorage
usersApi.interceptors.request.use(
    (config) => {
        const token = getStoredToken();
        if (token) {
            config.headers = {
                ...config.headers,
                Authorization: token,
            };
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 2. Interceptor de respuesta: protección contra microcortes y 401s no expirados
usersApi.interceptors.response.use(
    (response) => response,
    (error) => {
        // A) Microcorte de red, desconexión o timeout
        if (!error.response) {
            console.warn("⚠️ [usersApi] Microcorte o fallo de conexión detectado. Conservando sesión:", error.message);
            return Promise.reject(error);
        }

        // B) Errores 5xx del servidor
        if (error.response.status >= 500) {
            console.warn("⚠️ [usersApi] Error 5xx del servidor. No se cerrará la sesión:", error.response.status);
            return Promise.reject(error);
        }

        // C) Error 401 Unauthorized: Validar si el token realmente expiró
        if (error.response.status === 401) {
            const token = getStoredToken();
            if (token && !isTokenExpired(token)) {
                console.warn("⚠️ [usersApi] 401 recibido pero el token en LocalStorage sigue vigente (7 días). Conservando sesión.");
                return Promise.reject(error);
            }

            console.warn("⚠️ [usersApi] Token JWT expirado en LocalStorage. Cerrando sesión...");
            clearStorageSession();
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default usersApi;