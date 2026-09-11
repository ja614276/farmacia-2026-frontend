import React from "react";
import styles from "./sidebar.module.css";

export const SidebarProfile = ({ isCollapsed, user, isAdmin }) => {
  const initial = (user?.username || "U").trim().charAt(0).toUpperCase();

  return (
    <div
      className={styles.profileBox}
      style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
    >
      <div className={styles.avatar}>{initial}</div>
      {!isCollapsed && (
        <div className={styles.profileInfo}>
          <span
            className={styles.profileName}
            title={user?.username || "Usuario"}
          >
            {user?.username || "Usuario"}
          </span>
          <span className={styles.profileRole}>
            Rol: {isAdmin ? "Administrador" : "Personal"}
          </span>
        </div>
      )}
    </div>
  );
};
