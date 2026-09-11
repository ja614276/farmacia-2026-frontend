import React from "react";
import styles from "./sidebar.module.css";

export const SidebarHeader = ({ isCollapsed, onToggle }) => {
  return (
    <div className={styles.topActionRow}>
      {!isCollapsed && (
        <div className={styles.brandTitle}>
          <span className={styles.brandText}>SISTEMA FARMACIA</span>
        </div>
      )}
      <button
        onClick={onToggle}
        className={styles.toggleBtn}
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
  );
};
