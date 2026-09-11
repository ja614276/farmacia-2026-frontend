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
        {item.icon}
        {!isCollapsed && <span className={styles.linkText}>{item.title}</span>}
      </NavLink>
    );
  }

  // Acordeón
  const hasSubItems = item.subItems && item.subItems.length > 0;

  return (
    <div>
      <div
        onClick={onToggle}
        title={item.title}
        className={`${styles.accordionHeader} ${
          isOpen ? styles.accordionHeaderOpen : ""
        }`}
        style={{
          justifyContent: isCollapsed ? "center" : "space-between",
        }}
      >
        <div className={styles.headerLeft}>
          {item.icon}
          {!isCollapsed && <span className={styles.linkText}>{item.title}</span>}
        </div>

        {!isCollapsed && hasSubItems && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
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
          {item.subItems
            .filter((sub) => !sub.adminOnly || isAdmin)
            .map((sub) => (
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
