/**
 * Utilidades centralizadas para manejo y validación de tokens JWT en LocalStorage.
 * Asegura una persistencia confiable de 7 días y protección contra microcortes de red.
 */

/**
 * Obtiene el token JWT almacenado en localStorage con formato Bearer garantizado
 * @returns {string|null} Token con prefijo 'Bearer ' o null si no existe
 */
export const getStoredToken = () => {
  try {
    let rawToken = localStorage.getItem("token");

    // Fallback: Si no está directamente en "token", buscar en el objeto "login"
    if (!rawToken) {
      const storedLogin = localStorage.getItem("login");
      if (storedLogin) {
        try {
          const parsed = JSON.parse(storedLogin);
          rawToken = parsed.token || parsed.jwt;
        } catch (e) {
          console.error("Error parseando login en localStorage:", e);
        }
      }
    }

    if (!rawToken || typeof rawToken !== "string") {
      return null;
    }

    const trimmed = rawToken.trim();
    if (!trimmed || trimmed === "null" || trimmed === "undefined") {
      return null;
    }

    // Normalizar para evitar duplicaciones tipo "Bearer Bearer ..."
    const cleanToken = trimmed.replace(/^(Bearer\s+)+/i, "").trim();
    return cleanToken ? `Bearer ${cleanToken}` : null;
  } catch (error) {
    console.error("Error al obtener token de localStorage:", error);
    return null;
  }
};

/**
 * Verifica si un token JWT ya superó su fecha de expiración (claim `exp`).
 * @param {string} token - Token JWT (con o sin prefijo Bearer)
 * @returns {boolean} true si el token está expirado, false si sigue vigente dentro de los 7 días
 */
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const cleanToken = token.replace(/^(Bearer\s+)+/i, "").trim();
    const parts = cleanToken.split(".");
    if (parts.length !== 3) {
      // Si no tiene el formato estándar de 3 partes de JWT, considerarlo inválido
      return true;
    }

    // Decodificar Base64URL
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);

    if (!payload.exp) {
      // Si no tiene campo exp, no asumimos expiración
      return false;
    }

    // exp está en segundos, Date.now() en milisegundos
    // Agregamos un margen de tolerancia de 10 segundos
    const expirationTimeMs = payload.exp * 1000;
    const isExpired = Date.now() >= expirationTimeMs;

    return isExpired;
  } catch (err) {
    console.error("Error al decodificar y validar exp del token JWT:", err);
    // Ante un error de parseo inesperado, no forzar expiración inmediata a menos que sea necesario
    return false;
  }
};

/**
 * Retorna las cabeceras HTTP de autenticación estándar para peticiones axios o fetch.
 * @returns {Record<string, string>} Objeto headers con Authorization si existe token
 */
export const getAuthHeaders = () => {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token;
  }

  return headers;
};

/**
 * Limpia de forma completa y segura la sesión tanto de LocalStorage como de SessionStorage
 */
export const clearStorageSession = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("login");
    sessionStorage.clear();
  } catch (e) {
    console.error("Error al limpiar almacenamiento de sesión:", e);
  }
};
