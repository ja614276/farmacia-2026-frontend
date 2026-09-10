import axios from "axios";

const productsApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

// Interceptor para inyectar el token JWT formateado
productsApi.interceptors.request.use(
    (config) => {
        // Verifica en sessionStorage o localStorage
        const rawToken = sessionStorage.getItem("token") || localStorage.getItem("token");

        if (rawToken) {
            // Asegura que siempre viaje con el prefijo "Bearer "
            const token = rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`;
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

export default productsApi;