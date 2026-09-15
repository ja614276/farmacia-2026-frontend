import { createSlice } from "@reduxjs/toolkit";
import {
  getStoredToken,
  isTokenExpired,
  clearStorageSession,
} from "../../../auth/utils/tokenUtils";

const getInitialAuthState = () => {
  try {
    const rawLogin = localStorage.getItem("login");
    const token = getStoredToken();

    if (!rawLogin || !token) {
      return { isAuth: false, isAdmin: false, user: undefined };
    }

    const loginData = JSON.parse(rawLogin);
    if (!loginData.isAuth) {
      return { isAuth: false, isAdmin: false, user: undefined };
    }

    // Validar si el token JWT ya caducó sus 7 días de validez
    if (isTokenExpired(token)) {
      console.warn("⚠️ Token JWT de 7 días ha expirado. Limpiando sesión de localStorage.");
      clearStorageSession();
      return { isAuth: false, isAdmin: false, user: undefined };
    }

    // Token sigue vigente dentro de su ventana de 7 días
    return {
      isAuth: true,
      isAdmin: Boolean(loginData.isAdmin),
      user: loginData.user,
    };
  } catch (error) {
    console.error("Error al obtener estado inicial de auth:", error);
    return { isAuth: false, isAdmin: false, user: undefined };
  }
};

export const authSlice = createSlice({
  name: "auth",
  initialState: getInitialAuthState(),
  reducers: {
    onLogin: (state, action) => {
      state.isAuth = true;
      state.isAdmin = action.payload.isAdmin;
      state.user = action.payload.user;

      // GUARDAR EN LOCAL STORAGE AL INICIAR SESIÓN (PERSISTE 7 DÍAS ENTRE PESTAÑAS)
      localStorage.setItem(
        "login",
        JSON.stringify({
          isAuth: true,
          isAdmin: action.payload.isAdmin,
          user: action.payload.user,
        })
      );
      // Evitar discrepancias limpiando residuos en sessionStorage
      sessionStorage.clear();
    },
    onLogout: (state) => {
      state.isAuth = false;
      state.isAdmin = false;
      state.user = undefined;

      // LIMPIAR LOCAL STORAGE Y SESSION STORAGE AL CERRAR SESIÓN
      clearStorageSession();
    },
  },
});

export const { onLogin, onLogout } = authSlice.actions;