import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { onLogout } from "../../../store/slices/auth/authSlice";

import styles from "./sidebar.module.css";
import { navSections } from "./sidebarNavConfig";
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

  // Sincroniza el menú según la ruta activa
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
    } else if (path.startsWith("/settings") || path.startsWith("/company")) {
      setOpenMenu("configuracion");
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
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
    >
      {/* 1. Header con logotipo y marca */}
      <SidebarHeader isCollapsed={isCollapsed} onToggle={toggleSidebar} />

      {/* 2. Navegación estructurada */}
      <nav className={styles.nav}>
        {navSections.map((section, index) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || isAdmin
          );

          if (visibleItems.length === 0) return null;

          return (
            <div
              key={section.sectionId}
              className={`${styles.sectionBlock} ${
                index > 0 && section.title ? styles.sectionBorderTop : ""
              }`}
            >
              {!isCollapsed && section.title && (
                <div className={styles.sectionTitle}>{section.title}</div>
              )}
              <div className={styles.sectionList}>
                {visibleItems.map((item) => (
                  <SidebarNavItem
                    key={item.id}
                    item={item}
                    isCollapsed={isCollapsed}
                    isOpen={openMenu === item.id}
                    onToggle={() => toggleMenu(item.id)}
                    isAdmin={isAdmin}
                  />
                ))}

                {/* Botón Logout en la sección de cuenta */}
                {section.sectionId === "cuenta" && (
                  <SidebarFooter
                    isCollapsed={isCollapsed}
                    onLogout={handleLogout}
                  />
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* 3. Perfil de Usuario Minimalista */}
      <SidebarProfile isCollapsed={isCollapsed} user={user} isAdmin={isAdmin} />
    </aside>
  );
};

export default Sidebar;
