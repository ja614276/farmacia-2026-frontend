import Swal from "sweetalert2";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { onLogin, onLogout } from "../../store/slices/auth/authSlice";
import { clearStorageSession } from "../utils/tokenUtils";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAdmin, isAuth } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handlerLogin = async ({ username, password }) => {
    try {
      const response = await loginUser({ username, password });
      const token = response.data.token;
      const claims = JSON.parse(window.atob(token.split(".")[1]));

      const user = { username: claims.sub };
      dispatch(onLogin({ user, isAdmin: claims.isAdmin }));

      // Guardar en localStorage para persistencia de 7 días
      localStorage.setItem(
        "login",
        JSON.stringify({
          isAuth: true,
          isAdmin: claims.isAdmin,
          user,
        })
      );
      localStorage.setItem("token", `Bearer ${token}`);

      // Limpiar cualquier residuo previo en sessionStorage
      sessionStorage.clear();

      navigate("/users");
    } catch (e) {
      if (e.response?.status === 401) {
        Swal.fire("Error Login", "Username o password inválidos", "error");
      } else if (e.response?.status === 403) {
        Swal.fire("Error Login", "No tiene acceso al recurso o permisos!", "error");
      } else {
        throw e;
      }
    }
  };

  const handlerLogout = () => {
    dispatch(onLogout());
    clearStorageSession();
  };

  return {
    login: { user, isAdmin, isAuth },
    handlerLogin,
    handlerLogout,
  };
};
