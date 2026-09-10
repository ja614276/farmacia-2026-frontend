import { createSlice } from "@reduxjs/toolkit";

const initialLogin = JSON.parse(localStorage.getItem("login")) || {
  isAuth: false,
  isAdmin: false,
  user: undefined,
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialLogin,
  reducers: {
    onLogin: (state, action) => {
      state.isAuth = true;
      state.isAdmin = action.payload.isAdmin;
      state.user = action.payload.user;

      // GUARDAR EN LOCAL STORAGE AL INICIAR SESIÓN (PERSISTE ENTRE PESTAÑAS)
      localStorage.setItem(
        "login",
        JSON.stringify({
          isAuth: true,
          isAdmin: action.payload.isAdmin,
          user: action.payload.user,
        })
      );
    },
    onLogout: (state) => {
      state.isAuth = false;
      state.isAdmin = false;
      state.user = undefined;

      // LIMPIAR LOCAL STORAGE AL CERRAR SESIÓN
      localStorage.removeItem("login");
      localStorage.removeItem("token");
    },
  },
});

export const { onLogin, onLogout } = authSlice.actions;