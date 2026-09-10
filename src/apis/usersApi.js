import axios from "axios";

// 1. La baseURL debe ser la raíz del backend (sin /users al final)
const usersApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

usersApi.interceptors.request.use(
    (config) => {
        // 2. Busca el token en sessionStorage o localStorage
        const rawToken = sessionStorage.getItem("token") || localStorage.getItem("token");

        if (rawToken) {
            // 3. Garantiza que lleve siempre el prefijo Bearer
            config.headers = {
                ...config.headers,
                Authorization: rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`,
            };
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default usersApi;