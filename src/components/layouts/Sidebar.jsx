import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { onLogout } from "../../store/slices/auth/authSlice";

export const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useSelector((state) => state.auth);

  const [isCollapsed, setIsCollapsed] = useState(false);
  // Inicia en null para que ningún acordeón esté abierto por defecto en el home
  const [openMenu, setOpenMenu] = useState(null);

  // Sincroniza el menú abierto según la ruta activa
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/users")) {
      setOpenMenu("usuarios");
    } else if (path.startsWith("/products")) {
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
      // Si está en /dashboard, /help o raíz, todo permanece cerrado
      setOpenMenu(null);
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMenu = (menuName) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenMenu((prev) => (prev === menuName ? null : menuName));
  };

  const handleLogout = () => {
    dispatch(onLogout());
    navigate("/login");
  };

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: isCollapsed ? "72px" : "260px",
        minWidth: isCollapsed ? "72px" : "260px",
      }}
    >
      {/* Botón superior de colapso y Brand */}
      <div style={styles.topActionRow}>
        {!isCollapsed && (
          <div style={styles.brandTitle}>
            <span style={styles.brandText}>SISTEMA FARMACIA</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          style={styles.toggleBtn}
          title={isCollapsed ? "Expandir" : "Contraer"}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Perfil de Usuario */}
      <div
        style={{
          ...styles.profileBox,
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      >
        <div style={styles.avatar}>
          {(user?.username || "U").trim().charAt(0).toUpperCase()}
        </div>
        {!isCollapsed && (
          <div style={styles.profileInfo}>
            <span
              style={styles.profileName}
              title={user?.username || "Usuario"}
            >
              {user?.username || "Usuario"}
            </span>
            <span style={styles.profileRole}>
              Rol: {isAdmin ? "Administrador" : "Personal"}
            </span>
          </div>
        )}
      </div>
      {/* Navegación Principal */}
      <nav style={styles.nav} className="sidebar-scrollable">
        {/* Inicio */}
        <NavLink
          to="/dashboard"
          end
          title="Inicio"
          className="sidebar-nav-link"
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {}),
            justifyContent: isCollapsed ? "center" : "flex-start",
          })}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {!isCollapsed && <span style={styles.linkText}>Inicio</span>}
        </NavLink>

        {/* Acordeón: USUARIOS */}
        <div>
          <div
            onClick={() => toggleMenu("usuarios")}
            title="Usuarios"
            className="sidebar-accordion-header"
            style={{
              ...styles.accordionHeader,
              ...(openMenu === "usuarios" ? styles.accordionHeaderOpen : {}),
              justifyContent: isCollapsed ? "center" : "space-between",
            }}
          >
            <div style={styles.headerLeft}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {!isCollapsed && <span style={styles.linkText}>Usuarios</span>}
            </div>
            {!isCollapsed && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform:
                    openMenu === "usuarios" ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: 0.7,
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </div>

          {!isCollapsed && openMenu === "usuarios" && (
            <div style={styles.submenu}>
              <NavLink
                to="/users"
                end
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Lista de Usuarios
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/users/register"
                  className="sidebar-subitem"
                  style={({ isActive }) => ({
                    ...styles.subItem,
                    ...(isActive ? styles.subItemActive : {}),
                  })}
                >
                  Registrar Usuario
                </NavLink>
              )}
              <NavLink
                to="/employees"
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Empleados
              </NavLink>
            </div>
          )}
        </div>

        {/* Acordeón: PRODUCTOS */}
<div>
  <div
    onClick={() => toggleMenu("productos")}
    title="Productos"
    className="sidebar-accordion-header"
    style={{
      ...styles.accordionHeader,
      ...(openMenu === "productos" ? styles.accordionHeaderOpen : {}),
      justifyContent: isCollapsed ? "center" : "space-between",
    }}
  >
    <div style={styles.headerLeft}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
      {!isCollapsed && <span style={styles.linkText}>Productos</span>}
    </div>
    {!isCollapsed && (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform:
            openMenu === "productos" ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: 0.7,
        }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    )}
  </div>

  {!isCollapsed && openMenu === "productos" && (
    <div style={styles.submenu}>
      <NavLink
        to="/products"
        end
        className="sidebar-subitem"
        style={({ isActive }) => ({
          ...styles.subItem,
          ...(isActive ? styles.subItemActive : {}),
        })}
      >
        Lista de Productos
      </NavLink>

      <NavLink
        to="/products/register"
        className="sidebar-subitem"
        style={({ isActive }) => ({
          ...styles.subItem,
          ...(isActive ? styles.subItemActive : {}),
        })}
      >
        Registrar Producto
      </NavLink>

      <NavLink
        to="/categories"
        className="sidebar-subitem"
        style={({ isActive }) => ({
          ...styles.subItem,
          ...(isActive ? styles.subItemActive : {}),
        })}
      >
        Categorías
      </NavLink>

      <NavLink
        to="/laboratories"
        className="sidebar-subitem"
        style={({ isActive }) => ({
          ...styles.subItem,
          ...(isActive ? styles.subItemActive : {}),
        })}
      >
        Laboratorios
      </NavLink>

      <NavLink
        to="/suppliers"
        className="sidebar-subitem"
        style={({ isActive }) => ({
          ...styles.subItem,
          ...(isActive ? styles.subItemActive : {}),
        })}
      >
        Proveedores
      </NavLink>

      <NavLink
        to="/locations"
        className="sidebar-subitem"
        style={({ isActive }) => ({
          ...styles.subItem,
          ...(isActive ? styles.subItemActive : {}),
        })}
      >
        Ubicaciones
      </NavLink>
    </div>
  )}
</div>

        {/* Acordeón: VENTAS Y ATENCIÓN */}
        <div>
          <div
            onClick={() => toggleMenu("ventas")}
            title="Ventas y Atención"
            className="sidebar-accordion-header"
            style={{
              ...styles.accordionHeader,
              ...(openMenu === "ventas" ? styles.accordionHeaderOpen : {}),
              justifyContent: isCollapsed ? "center" : "space-between",
            }}
          >
            <div style={styles.headerLeft}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {!isCollapsed && (
                <span style={styles.linkText}>Ventas y Atención</span>
              )}
            </div>
            {!isCollapsed && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform:
                    openMenu === "ventas" ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: 0.7,
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </div>

          {!isCollapsed && openMenu === "ventas" && (
            <div style={styles.submenu}>
              <NavLink
                to="/inventory-adjustments"
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Ajustes Inventarios
              </NavLink>
              <NavLink
                to="/clients/register"
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Clientes
              </NavLink>

              <NavLink
                to="/sales"
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Ventas
              </NavLink>
            </div>
          )}
        </div>

        {/* Acordeón: CAJA Y FINANZAS */}
        <div>
          <div
            onClick={() => toggleMenu("caja")}
            title="Caja y Finanzas"
            className="sidebar-accordion-header"
            style={{
              ...styles.accordionHeader,
              ...(openMenu === "caja" ? styles.accordionHeaderOpen : {}),
              justifyContent: isCollapsed ? "center" : "space-between",
            }}
          >
            <div style={styles.headerLeft}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              {!isCollapsed && (
                <span style={styles.linkText}>Caja y Finanzas</span>
              )}
            </div>
            {!isCollapsed && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform:
                    openMenu === "caja" ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: 0.7,
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </div>

          {!isCollapsed && openMenu === "caja" && (
            <div style={styles.submenu}>
              <NavLink
                to="/payment-terms"
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Condiciones Pagos
              </NavLink>
              <NavLink
                to="/payment-methods"
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Formas Pagos
              </NavLink>
              <NavLink
                to="/cash-movements"
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Movimientos Cajas
              </NavLink>
              <NavLink
                to="/collections"
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Gestión de cobranzas
              </NavLink>
              <NavLink
                to="/cash-sessions"
                className="sidebar-subitem"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                Sesiones Cajas
              </NavLink>
            </div>
          )}
        </div>

        {/* Enlace Directo: COMPRAS */}
        <NavLink
          to="/purchases/register"
          title="Compras"
          className="sidebar-nav-link"
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {}),
            justifyContent: isCollapsed ? "center" : "flex-start",
          })}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {!isCollapsed && <span style={styles.linkText}>Compras</span>}
        </NavLink>

        {/* Enlace Directo: REPORTES */}
        <NavLink
          to="/reports"
          title="Reportes"
          className="sidebar-nav-link"
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {}),
            justifyContent: isCollapsed ? "center" : "flex-start",
          })}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          {!isCollapsed && <span style={styles.linkText}>Reportes</span>}
        </NavLink>

        {/* Acordeón: CONFIGURACIÓN */}
        <div>
          <div
            onClick={() => toggleMenu("configuracion")}
            title="Configuración"
            className="sidebar-accordion-header"
            style={{
              ...styles.accordionHeader,
              ...(openMenu === "configuracion"
                ? styles.accordionHeaderOpen
                : {}),
              justifyContent: isCollapsed ? "center" : "space-between",
            }}
          >
            <div style={styles.headerLeft}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              {!isCollapsed && (
                <span style={styles.linkText}>Configuración</span>
              )}
            </div>
            
          </div>
        </div>

        {/* Enlace Directo: AYUDA Y SOPORTE */}
        <NavLink
          to="/help"
          title="Ayuda y Soporte"
          className="sidebar-nav-link"
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {}),
            justifyContent: isCollapsed ? "center" : "flex-start",
          })}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {!isCollapsed && <span style={styles.linkText}>Ayuda y Soporte</span>}
        </NavLink>
      </nav>

      {/* Cerrar Sesión */}
      <div style={styles.footer}>
        <button
          onClick={handleLogout}
          title="Cerrar Sesión"
          className="sidebar-logout-btn"
          style={{
            ...styles.logoutBtn,
            justifyContent: isCollapsed ? "center" : "flex-start",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!isCollapsed && <span style={styles.linkText}>Cerrar Sesión</span>}
        </button>
      </div>

      {/* Micro-estilos de interacción para hover y scrollbar suave */}
      <style>{`
        .sidebar-scrollable::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-scrollable::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
        }
        .sidebar-scrollable::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.22);
        }
        .sidebar-nav-link:hover,
        .sidebar-accordion-header:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          color: #ffffff !important;
        }
        .sidebar-subitem:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #2dd4bf !important;
          padding-left: 14px !important;
        }
        .sidebar-logout-btn:hover {
          background-color: rgba(239, 68, 68, 0.12) !important;
          color: #f87171 !important;
        }
      `}</style>
    </aside>
  );
};

const styles = {
  sidebar: {
    height: "100vh",
    backgroundColor: "#0d1317", // Fondo grafito profundo profesional
    color: "#cbd5e1",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    boxShadow: "4px 0 20px rgba(0, 0, 0, 0.25)",
    transition:
      "width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    userSelect: "none",
    overflow: "hidden",
    zIndex: 1000,
  },
  topActionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 18px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    minHeight: "64px",
  },
  brandTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  brandDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#14b8a6", // Detalle turquesa sanitario
    boxShadow: "0 0 10px #14b8a6",
  },
  brandText: {
    fontSize: "12.5px",
    fontWeight: "800",
    letterSpacing: "1.2px",
    color: "#ffffff",
  },
  toggleBtn: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "7px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  profileBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 18px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
  avatar: {
    width: "36px",
    height: "36px",
    minWidth: "36px",
    borderRadius: "9px",
    backgroundColor: "#006d77", // Tono de marca
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0, 109, 119, 0.35)",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  profileName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
  profileRole: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "500",
  },
  nav: {
    flex: 1,
    padding: "14px 10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
    borderRadius: "8px",
    transition: "all 0.15s ease",
  },
  navLinkActive: {
    backgroundColor: "#006d77",
    color: "#ffffff",
    fontWeight: "700",
    boxShadow: "0 2px 8px rgba(0, 109, 119, 0.4)",
  },
  accordionHeader: {
    display: "flex",
    alignItems: "center",
    padding: "10px 14px",
    color: "#94a3b8",
    cursor: "pointer",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.15s ease",
  },
  accordionHeaderOpen: {
    color: "#ffffff",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  linkText: {
    whiteSpace: "nowrap",
    letterSpacing: "0.2px",
  },
  submenu: {
    display: "flex",
    flexDirection: "column",
    marginLeft: "18px",
    paddingLeft: "12px",
    borderLeft: "2px solid rgba(20, 184, 166, 0.35)", // Acento sutil turquesa
    gap: "2px",
    marginTop: "3px",
    marginBottom: "6px",
  },
  subItem: {
    padding: "7px 12px",
    color: "#8492a6",
    textDecoration: "none",
    fontSize: "12.5px",
    borderRadius: "6px",
    transition: "all 0.15s ease",
    display: "block",
  },
  subItemActive: {
    color: "#2dd4bf",
    backgroundColor: "rgba(45, 212, 191, 0.08)",
    fontWeight: "700",
  },
  footer: {
    padding: "12px 10px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  logoutBtn: {
    width: "100%",
    background: "transparent",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.15s ease",
  },
};
