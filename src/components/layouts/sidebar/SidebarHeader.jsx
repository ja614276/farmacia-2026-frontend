import React, { useState, useEffect } from "react";
import styles from "./sidebar.module.css";
import { getCompanyInfo } from "../../../services/CompanyService";

export const SidebarHeader = ({ isCollapsed, onToggle }) => {
  const [company, setCompany] = useState(null);
  const [logoLoadError, setLogoLoadError] = useState(false);

  useEffect(() => {
    // 1. Carga inicial de los datos de la empresa (incluyendo el logo)
    const loadCompany = () => {
      getCompanyInfo()
        .then((res) => {
          if (res.data) {
            setCompany(res.data);
            setLogoLoadError(false);
          }
        })
        .catch((err) => {
          console.error("No se pudo cargar la información de empresa para el sidebar:", err);
        });
    };

    loadCompany();

    // 2. Escuchar evento en tiempo real cuando se actualice la empresa desde CompanyPage
    const handleUpdate = (e) => {
      if (e.detail) {
        setCompany(e.detail);
        setLogoLoadError(false);
      } else {
        loadCompany();
      }
    };

    window.addEventListener("companyInfoUpdated", handleUpdate);
    return () => {
      window.removeEventListener("companyInfoUpdated", handleUpdate);
    };
  }, []);

  const hasLogo = Boolean(company?.logoUrl && company.logoUrl.trim() !== "" && !logoLoadError);
  const companyTitle = company?.commercialName || company?.legalName || "SISTEMA FARMACIA";

  return (
    <div className={styles.headerContainer}>
      <div className={styles.brandRow}>
        {/* Logotipo de la Empresa o Isotipo Supabase por defecto */}
        <div
          className={styles.brandLogoWrap}
          title={companyTitle}
        >
          {hasLogo ? (
            <img
              src={company.logoUrl}
              alt={companyTitle}
              className={styles.companyLogoImg}
              onError={() => setLogoLoadError(true)}
            />
          ) : (
            <svg
              width="22"
              height="23"
              viewBox="0 0 109 113"
              fill="none"
              className={styles.supabaseLogo}
            >
              <path
                d="M63.7076 110.284C60.848 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0667L99.1936 40.0667C104.917 40.0667 108.134 46.6609 104.603 51.1578L63.7076 110.284Z"
                fill="#3ECF8E"
              />
              <path
                d="M45.317 2.71607C48.1766 -0.884507 53.9744 1.08819 54.0433 5.68593L55.0508 72.9333H9.83103C4.10773 72.9333 0.890664 66.3391 4.42183 61.8422L45.317 2.71607Z"
                fill="#3ECF8E"
              />
            </svg>
          )}
        </div>

        {!isCollapsed && (
          <div className={styles.brandTextWrap}>
            <span className={styles.brandName} title={companyTitle}>
              {companyTitle}
            </span>
          </div>
        )}

        <button
          onClick={onToggle}
          className={styles.toggleBtn}
          title={isCollapsed ? "Expandir menú" : "Contraer menú"}
          aria-label="Toggle Sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
};
