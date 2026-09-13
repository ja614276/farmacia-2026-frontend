import usersApi from "../apis/usersApi.js";

/**
 * Obtener la información del perfil del empleado actual.
 * El backend extrae el usuario autenticado del token JWT en SecurityContextHolder.
 * Se puede enviar username de soporte para redundancia.
 */
export const getProfile = async (username) => {
  const params = username ? { username } : {};
  const response = await usersApi.get("/profile", { params });
  return response.data;
};

/**
 * Cambiar la contraseña del usuario actual.
 * Requiere:
 * - currentPassword: la contraseña anterior
 * - newPassword: la nueva contraseña
 * - confirmNewPassword: confirmación de la nueva contraseña
 * - username (opcional para fallback)
 */
export const changePassword = async ({ currentPassword, newPassword, confirmNewPassword, username }) => {
  const response = await usersApi.put("/profile/password", {
    currentPassword,
    newPassword,
    confirmNewPassword,
    username,
  });
  return response.data;
};
