import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { onLogout } from "../../../store/slices/auth/authSlice";

import styles from "./sidebar.module.css";
import { navItems } from "./sidebarNavConfig";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarProfile } from "./SidebarProfile";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarFooter } from "./SidebarFooter";

export const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useSelector((state) => state.auth);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  // Sincroniza el menú abierto según la ruta activa
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/users") || path.startsWith("/employees")) {
      setOpenMenu("usuarios");
    } else if (
      path.startsWith("/products") ||
      path.startsWith("/categories") ||
      path.startsWith("/laboratories") ||
      path.startsWith("/suppliers") ||
      path.startsWith("/locations")
    ) {
      setOpenMenu("productos");
    } else if (
      path.startsWith("/sales") ||
      path.startsWith("/clients") ||
      path.startsWith("/inventory-adjustments")
    ) {
      setOpenMenu("ventas");
    } else if (
      path.startsWith("/payment-terms") ||
      path.startsWith("/payment-methods") ||
      path.startsWith("/cash-movements") ||
      path.startsWith("/collections") ||
      path.startsWith("/cash-sessions")
    ) {
      setOpenMenu("caja");
    } else if (path.startsWith("/settings")) {
      setOpenMenu("configuracion");
    } else {
      // Si está en /dashboard, /help o compras, todo permanece cerrado
      setOpenMenu(null);
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMenu = (menuId) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenMenu((prev) => (prev === menuId ? null : menuId));
  };

  const handleLogout = () => {
    dispatch(onLogout());
    navigate("/login");
  };

  return (
    <aside
      className={styles.sidebar}
      style={{
        width: isCollapsed ? "72px" : "260px",
        minWidth: isCollapsed ? "72px" : "260px",
      }}
    >
      {/* 1. Encabezado y Brand */}
      <SidebarHeader isCollapsed={isCollapsed} onToggle={toggleSidebar} />

      {/* 2. Perfil de Usuario */}
      <SidebarProfile isCollapsed={isCollapsed} user={user} isAdmin={isAdmin} />

      {/* 3. Navegación Principal */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            isOpen={openMenu === item.id}
            onToggle={() => toggleMenu(item.id)}
            isAdmin={isAdmin}
          />
        ))}
      </nav>

      {/* 4. Footer y Cerrar Sesión */}
      <SidebarFooter isCollapsed={isCollapsed} onLogout={handleLogout} />
    </aside>
  );
};

export default Sidebar;
