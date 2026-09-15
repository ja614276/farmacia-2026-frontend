import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./sidebar.module.css";

export const SidebarNavItem = ({
  item,
  isCollapsed,
  isOpen,
  onToggle,
  isAdmin,
}) => {
  // Ocultar si requiere permisos de administrador y el usuario no lo es
  if (item.adminOnly && !isAdmin) {
    return null;
  }

  // Enlace directo
  if (item.type === "link") {
    return (
      <NavLink
        to={item.path}
        end={item.path === "/dashboard"}
        title={item.title}
        className={({ isActive }) =>
          `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
        }
        style={{
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      >
        <span className={styles.itemIcon}>{item.icon}</span>
        {!isCollapsed && <span className={styles.linkText}>{item.title}</span>}
      </NavLink>
    );
  }

  // Acordeón con subítems
  const visibleSubItems = (item.subItems || []).filter(
    (sub) => !sub.adminOnly || isAdmin
  );
  const hasSubItems = visibleSubItems.length > 0;

  return (
    <div className={styles.navGroup}>
      <div
        onClick={onToggle}
        title={item.title}
        className={`${styles.accordionHeader} ${
          isOpen ? styles.accordionHeaderOpen : ""
        }`}
        style={{
          justifyContent: isCollapsed ? "center" : "space-between",
        }}
        role="button"
        tabIndex={0}
      >
        <div className={styles.headerLeft}>
          <span className={styles.itemIcon}>{item.icon}</span>
          {!isCollapsed && <span className={styles.linkText}>{item.title}</span>}
        </div>

        {!isCollapsed && hasSubItems && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${styles.arrowIcon} ${
              isOpen ? styles.arrowIconOpen : ""
            }`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>

      {!isCollapsed && isOpen && hasSubItems && (
        <div className={styles.submenu}>
          {visibleSubItems.map((sub) => (
            <NavLink
              key={sub.path}
              to={sub.path}
              end={sub.end}
              className={({ isActive }) =>
                `${styles.subItem} ${isActive ? styles.subItemActive : ""}`
              }
            >
              {sub.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};
