import React, { useState, useEffect } from "react";
import { SalesReport } from "../components/reports/SalesReport.jsx";
import { SuppliersReport } from "../components/reports/SuppliersReport.jsx";
import { InventoryReport } from "../components/reports/InventoryReport.jsx";
import { FinanceReport } from "../components/reports/FinanceReport.jsx";
import { KardexReport } from "../components/reports/KardexReport.jsx";
import "../components/reports/reports.css";

import {
    getTopSellingProducts,
    getSalesSummary,
    getSalesByEmployee,
    getSalesByClient,
    getSalesProfit,
    getClientDebtors,
    getClientPayments,
    getCashSessions,
    getCashMovements,
    getAllSales,
    getAllPurchases,
    getAllSuppliers,
    getAllLots,
    getAllProducts,
    getAllInventoryAdjustments,
    getAllCategories
} from "../services/ReportService.js";

export const ReportsPage = () => {
    // Módulos principales (ATENCIÓN eliminado según requerimiento del usuario)
    const mainModules = [
        "VENTAS",
        "PROVEEDORES",
        "INVENTARIO",
        "FINANZAS",
        "KARDEX",
    ];

    const [mainTab, setMainTab] = useState("PROVEEDORES"); // Activo en PROVEEDORES para verificar inmediatamente
    const [loading, setLoading] = useState(true);

    // Datos de Ventas
    const [salesSummary, setSalesSummary] = useState(null);
    const [dailySales, setDailySales] = useState([]);
    const [employeeSales, setEmployeeSales] = useState([]);
    const [clientSales, setClientSales] = useState([]);
    const [profitSales, setProfitSales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    // Datos de Finanzas
    const [clientDebtors, setClientDebtors] = useState([]);
    const [clientPayments, setClientPayments] = useState([]);
    const [cashSessions, setCashSessions] = useState([]);
    const [cashMovements, setCashMovements] = useState([]);

    // Datos de Proveedores y Compras
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Datos de Kardex e Inventario
    const [lots, setLots] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [inventoryAdjustments, setInventoryAdjustments] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);

    // Cargar todos los datos gerenciales unificados
    const loadReportData = async () => {
        setLoading(true);
        try {
            const [
                summaryRes,
                topRes,
                empRes,
                cliRes,
                profitRes,
                salesRes,
                debtorsRes,
                paymentsRes,
                sessionsRes,
                movementsRes,
                purchasesRes,
                suppliersRes,
                lotsRes,
                productsRes,
                adjustmentsRes,
                categoriesRes
            ] = await Promise.allSettled([
                getSalesSummary({}),
                getTopSellingProducts({}),
                getSalesByEmployee({}),
                getSalesByClient({}),
                getSalesProfit({}),
                getAllSales(),
                getClientDebtors(),
                getClientPayments(),
                getCashSessions(),
                getCashMovements(),
                getAllPurchases(),
                getAllSuppliers(),
                getAllLots(),
                getAllProducts(),
                getAllInventoryAdjustments(),
                getAllCategories()
            ]);

            if (summaryRes.status === "fulfilled") setSalesSummary(summaryRes.value);
            if (topRes.status === "fulfilled") setTopProducts(Array.isArray(topRes.value) ? topRes.value : []);
            if (empRes.status === "fulfilled") setEmployeeSales(Array.isArray(empRes.value) ? empRes.value : []);
            if (cliRes.status === "fulfilled") setClientSales(Array.isArray(cliRes.value) ? cliRes.value : []);
            if (profitRes.status === "fulfilled") setProfitSales(Array.isArray(profitRes.value) ? profitRes.value : []);
            if (salesRes.status === "fulfilled") setDailySales(Array.isArray(salesRes.value) ? salesRes.value : []);
            if (debtorsRes.status === "fulfilled") setClientDebtors(Array.isArray(debtorsRes.value) ? debtorsRes.value : []);
            if (paymentsRes.status === "fulfilled") setClientPayments(Array.isArray(paymentsRes.value) ? paymentsRes.value : []);
            if (sessionsRes.status === "fulfilled") setCashSessions(Array.isArray(sessionsRes.value) ? sessionsRes.value : []);
            if (movementsRes.status === "fulfilled") setCashMovements(Array.isArray(movementsRes.value) ? movementsRes.value : []);
            if (purchasesRes.status === "fulfilled") setPurchases(Array.isArray(purchasesRes.value) ? purchasesRes.value : []);
            if (suppliersRes.status === "fulfilled") setSuppliers(Array.isArray(suppliersRes.value) ? suppliersRes.value : []);
            if (lotsRes.status === "fulfilled") setLots(Array.isArray(lotsRes.value) ? lotsRes.value : []);
            if (productsRes.status === "fulfilled") setProductsList(Array.isArray(productsRes.value) ? productsRes.value : []);
            if (adjustmentsRes.status === "fulfilled") setInventoryAdjustments(Array.isArray(adjustmentsRes.value) ? adjustmentsRes.value : []);
            if (categoriesRes.status === "fulfilled") setCategoriesList(Array.isArray(categoriesRes.value) ? categoriesRes.value : []);

        } catch (error) {
            console.error("Error al cargar reportes gerenciales unificados:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReportData();
    }, []);

    return (
        <div className="reports-page-container w-100 min-vh-100 py-3 px-3 px-md-4" style={{ backgroundColor: "#ffffff" }}>
            {/* 1. Header Gerencial Monocromático */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="rounded-2 d-flex align-items-center justify-content-center shadow-sm"
                        style={{ backgroundColor: "#09090b", width: "46px", height: "46px" }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-uppercase fw-bold text-secondary" style={{ fontSize: "0.68rem", letterSpacing: "1px" }}>
                            DASHBOARD / REPORTES GERENCIALES / ANÁLISIS ESTRATÉGICO
                        </div>
                        <h3 className="m-0 fw-bold text-dark" style={{ letterSpacing: "-0.5px" }}>
                            Reportes & Análisis Gerencial
                        </h3>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        onClick={loadReportData}
                        disabled={loading}
                        className="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-bold shadow-sm rounded-2 text-dark"
                        style={{ backgroundColor: "#ffffff", border: "1px solid #e4e4e7" }}
                        title="Actualizar datos de todos los módulos"
                    >
                        <svg
                            className={loading ? "spinner-border spinner-border-sm" : ""}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        <span>{loading ? "Sincronizando..." : "Actualizar Datos"}</span>
                    </button>
                </div>
            </div>

            {/* 2. Pestañas Principales Superiores (VENTAS, PROVEEDORES, INVENTARIO, FINANZAS, KARDEX) */}
            <div className="main-tabs-wrapper d-flex gap-2 mb-4 overflow-x-auto pb-1">
                {mainModules.map((mod) => (
                    <button
                        key={mod}
                        type="button"
                        className={`btn-main-tab ${mainTab === mod ? "active" : ""}`}
                        onClick={() => setMainTab(mod)}
                    >
                        {mod}
                    </button>
                ))}
            </div>

            {/* 3. Renderizado Modular Limpio del Componente Seleccionado */}
            <div className="report-content-container w-100">
                {mainTab === "VENTAS" && (
                    <SalesReport
                        salesSummary={salesSummary}
                        dailySales={dailySales}
                        employeeSales={employeeSales}
                        clientSales={clientSales}
                        profitSales={profitSales}
                        topProducts={topProducts}
                        loading={loading}
                    />
                )}

                {mainTab === "PROVEEDORES" && (
                    <SuppliersReport
                        suppliers={suppliers}
                        purchases={purchases}
                        loading={loading}
                    />
                )}

                {mainTab === "INVENTARIO" && (
                    <InventoryReport
                        lots={lots}
                        productsList={productsList}
                        dailySales={dailySales}
                        inventoryAdjustments={inventoryAdjustments}
                        categoriesList={categoriesList}
                        purchases={purchases}
                        loading={loading}
                    />
                )}

                {mainTab === "FINANZAS" && (
                    <FinanceReport
                        clientDebtors={clientDebtors}
                        clientPayments={clientPayments}
                        cashSessions={cashSessions}
                        cashMovements={cashMovements}
                        dailySales={dailySales}
                        loading={loading}
                    />
                )}

                {mainTab === "KARDEX" && (
                    <KardexReport
                        lots={lots}
                        productsList={productsList}
                        purchases={purchases}
                        dailySales={dailySales}
                        inventoryAdjustments={inventoryAdjustments}
                        loading={loading}
                    />
                )}
            </div>

            {/* 4. Pie de página de estado del sistema */}
            <div className="d-flex flex-wrap align-items-center justify-content-between p-3 bg-white rounded-2 border mt-4 gap-3">
                <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-1 fw-bold" style={{ backgroundColor: "#09090b", color: "#ffffff", fontSize: "0.68rem", padding: "4px 8px" }}>
                        EN LÍNEA
                    </span>
                    <span className="fw-bold text-dark text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                        BASE DE DATOS CONECTADA • MÓDULOS ACTIVOS: {mainModules.join(" | ")}
                    </span>
                </div>
                <div className="text-muted text-uppercase" style={{ fontSize: "0.68rem", letterSpacing: "0.05em", fontFamily: "monospace" }}>
                    SISFARMACIA ENTERPRISE V8.3.4 • MOTOR ANALÍTICO INTEGRADO
                </div>
            </div>
        </div>
    );
};
