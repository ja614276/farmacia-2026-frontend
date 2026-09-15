import React from "react";
import styles from "./sidebar.module.css";

export const SidebarProfile = ({ isCollapsed, user, isAdmin }) => {
  const initial = (user?.username || "U").trim().charAt(0).toUpperCase();

  return (
    <div
      className={styles.profileBox}
      style={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
      title={`${user?.username || "Usuario"} (${isAdmin ? "Administrador" : "Personal"})`}
    >
      <div className={styles.avatarWrap}>
        <div className={styles.avatar}>{initial}</div>
        <span className={styles.onlineDot} />
      </div>

      {!isCollapsed && (
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>
            {user?.username || "Usuario"}
          </span>
          <span className={styles.profileRole}>
            {isAdmin ? "Administrador" : "Personal"}
          </span>
        </div>
      )}
    </div>
  );
};
