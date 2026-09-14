import React, { useState, useMemo } from "react";
import { formatDateTime, isDateInFilter, downloadCSV } from "./reportUtils.js";

export const SuppliersReport = ({ suppliers = [], purchases = [], loading = false }) => {
    // Subpestañas del módulo Proveedores
    const subTabs = [
        { id: "supp_directory", label: "Directorio de Proveedores", icon: "🏢" },
        { id: "supp_purchases", label: "Compras Proveedor", icon: "🚚" },
        { id: "supp_min_prices", label: "Precios Mínimos", icon: "$" },
        { id: "supp_price_comparison", label: "Comparativo Precios", icon: "📊" },
        { id: "supp_purchase_details", label: "Compra - Detalle Compra", icon: "📑" },
    ];

    const [subTab, setSubTab] = useState("supp_directory");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("TODOS"); // 'TODOS' | 'ACTIVO' | 'INACTIVO'
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [daysFilter, setDaysFilter] = useState("all");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal para ver compras detalladas de un proveedor
    const [selectedSupplierPurchasesModal, setSelectedSupplierPurchasesModal] = useState(null);

    // Mapa de proveedores por ID para búsquedas O(1)
    const suppliersMap = useMemo(() => {
        const map = new Map();
        suppliers.forEach(s => {
            if (s && s.id) map.set(Number(s.id), s);
        });
        return map;
    }, [suppliers]);

    // Compras filtradas por rango de fecha
    const filteredPurchases = useMemo(() => {
        return purchases.filter(p => {
            if (p.isActive === false) return false;
            const pDate = p.purchaseDate || p.fechaCompra;
            return isDateInFilter(pDate, daysFilter, startDate, endDate);
        });
    }, [purchases, daysFilter, startDate, endDate]);

    // Métricas KPI de resumen global para Proveedores
    const kpiSummary = useMemo(() => {
        const totalSuppliers = suppliers.length;
        const activeSuppliers = suppliers.filter(s => s.isActive !== false).length;
        const inactiveSuppliers = totalSuppliers - activeSuppliers;

        let totalPurchasesCount = filteredPurchases.length;
        let totalSpentAmount = 0;
        const supplierSpendMap = new Map();

        filteredPurchases.forEach(p => {
            const tot = Number(p.total || 0);
            totalSpentAmount += tot;

            const supId = p.supplierId ? Number(p.supplierId) : null;
            const supObj = supId ? suppliersMap.get(supId) : null;
            const supName = (supObj?.nombre || p.supplierName || (supId ? `Proveedor #${supId}` : "Proveedor")).trim();

            const curr = supplierSpendMap.get(supName) || { count: 0, spent: 0 };
            supplierSpendMap.set(supName, {
                count: curr.count + 1,
                spent: curr.spent + tot
            });
        });

        let topSupplierName = "—";
        let topSupplierSpent = 0;
        supplierSpendMap.forEach((val, name) => {
            if (val.spent > topSupplierSpent) {
                topSupplierSpent = val.spent;
                topSupplierName = name;
            }
        });

        return {
            totalSuppliers,
            activeSuppliers,
            inactiveSuppliers,
            totalPurchasesCount,
            totalSpentAmount,
            topSupplierName,
            topSupplierSpent,
        };
    }, [suppliers, filteredPurchases, suppliersMap]);

    // 1. Directorio de Proveedores (Catálogo General con Compras Acumuladas)
    const directoryList = useMemo(() => {
        // Mapear gastos y compras por proveedor
        const spendBySupId = new Map();
        const spendBySupName = new Map();

        filteredPurchases.forEach(p => {
            const supId = p.supplierId ? Number(p.supplierId) : null;
            const total = Number(p.total || 0);
            const supName = (p.supplierName || "").trim().toLowerCase();

            if (supId) {
                const cur = spendBySupId.get(supId) || { count: 0, total: 0, purchases: [] };
                cur.count += 1;
                cur.total += total;
                cur.purchases.push(p);
                spendBySupId.set(supId, cur);
            }
            if (supName) {
                const cur = spendBySupName.get(supName) || { count: 0, total: 0, purchases: [] };
                cur.count += 1;
                cur.total += total;
                cur.purchases.push(p);
                spendBySupName.set(supName, cur);
            }
        });

        let list = suppliers.map((s, idx) => {
            const idNum = Number(s.id);
            const statsById = spendBySupId.get(idNum);
            const statsByName = s.nombre ? spendBySupName.get(s.nombre.trim().toLowerCase()) : null;
            const stats = statsById || statsByName || { count: 0, total: 0, purchases: [] };

            return {
                id: s.id || idx + 1,
                nombre: s.nombre || "Sin Razón Social",
                contacto: s.contacto || "—",
                telefono: s.telefono || "—",
                email: s.email || "—",
                direccion: s.direccion || "—",
                isActive: s.isActive !== false,
                purchaseCount: stats.count,
                totalSpent: stats.total,
                purchases: stats.purchases,
            };
        });

        // Filtrar por Estado
        if (statusFilter === "ACTIVO") {
            list = list.filter(s => s.isActive);
        } else if (statusFilter === "INACTIVO") {
            list = list.filter(s => !s.isActive);
        }

        // Filtrar por Búsqueda
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s =>
                (s.nombre && s.nombre.toLowerCase().includes(q)) ||
                (s.contacto && s.contacto.toLowerCase().includes(q)) ||
                (s.telefono && s.telefono.toLowerCase().includes(q)) ||
                (s.email && s.email.toLowerCase().includes(q)) ||
                (s.direccion && s.direccion.toLowerCase().includes(q)) ||
                String(s.id).includes(q)
            );
        }

        // Ordenar: proveedores con mayor volumen de compra primero, luego alfabéticamente
        return list.sort((a, b) => {
            if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
            return a.nombre.localeCompare(b.nombre);
        });
    }, [suppliers, filteredPurchases, search, statusFilter]);

    // 2. Compras por Proveedor (Resumen Agrupado)
    const supplierPurchasesSummaryList = useMemo(() => {
        const groups = new Map();

        filteredPurchases.forEach(p => {
            const supId = p.supplierId ? Number(p.supplierId) : null;
            const supObj = supId ? suppliersMap.get(supId) : null;
            const supName = (supObj?.nombre || p.supplierName || (supId ? `Proveedor #${supId}` : "Proveedor General")).trim();
            const key = supId || supName;

            const pDate = p.purchaseDate || p.fechaCompra;
            const cleanDateStr = pDate ? String(pDate).replace(" ", "T") : null;
            const dateObj = cleanDateStr ? new Date(cleanDateStr) : null;
            const timestamp = dateObj && !isNaN(dateObj.getTime()) ? dateObj.getTime() : 0;
            const total = Number(p.total || 0);

            if (!groups.has(key)) {
                groups.set(key, {
                    supplierId: supId,
                    supplierName: supName,
                    earliestDateStr: pDate,
                    earliestTime: timestamp,
                    latestDateStr: pDate,
                    latestTime: timestamp,
                    purchaseCount: 1,
                    totalSpent: total,
                    purchases: [p],
                });
            } else {
                const g = groups.get(key);
                g.purchaseCount += 1;
                g.totalSpent += total;
                g.purchases.push(p);
                if (timestamp > 0) {
                    if (g.earliestTime === 0 || timestamp < g.earliestTime) {
                        g.earliestTime = timestamp;
                        g.earliestDateStr = pDate;
                    }
                    if (timestamp > g.latestTime) {
                        g.latestTime = timestamp;
                        g.latestDateStr = pDate;
                    }
                }
            }
        });

        let list = Array.from(groups.values()).map(g => ({
            id: g.supplierId || g.supplierName,
            supplierName: g.supplierName,
            firstPurchaseFormatted: formatDateTime(g.earliestDateStr),
            lastPurchaseFormatted: formatDateTime(g.latestDateStr),
            purchaseCount: g.purchaseCount,
            totalSpent: g.totalSpent,
            purchases: g.purchases,
        }));

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s => s.supplierName.toLowerCase().includes(q));
        }

        return list.sort((a, b) => b.totalSpent - a.totalSpent);
    }, [filteredPurchases, suppliersMap, search]);

    // 3. Precios Mínimos (Mejor costo por producto)
    const supplierMinPricesList = useMemo(() => {
        const productItemsMap = new Map();

        filteredPurchases.forEach(p => {
            const supId = p.supplierId ? Number(p.supplierId) : null;
            const supObj = supId ? suppliersMap.get(supId) : null;
            const supName = (supObj?.nombre || p.supplierName || (supId ? `Proveedor #${supId}` : "Proveedor")).trim();
            const pDate = p.purchaseDate || p.fechaCompra;

            if (p.details && Array.isArray(p.details)) {
                p.details.forEach(d => {
                    if (d.isActive === false) return;
                    const prodId = d.productId || d.id;
                    const prodName = (d.productNombre || d.productName || "Producto").trim();
                    const cost = Number(d.precioCosto || 0);
                    if (cost <= 0) return;

                    const key = prodName.toLowerCase();
                    const record = {
                        purchaseId: p.id,
                        invoiceNumber: p.invoiceNumber || `FAC-${p.id}`,
                        purchaseDate: pDate,
                        supplierName: supName,
                        cost,
                        lotNumber: d.nroLote || "—",
                        quantity: Number(d.cantidad || 0),
                    };

                    if (!productItemsMap.has(key)) {
                        productItemsMap.set(key, {
                            productId: prodId,
                            productName: prodName,
                            records: [record],
                        });
                    } else {
                        productItemsMap.get(key).records.push(record);
                    }
                });
            }
        });

        let list = [];
        productItemsMap.forEach((val) => {
            const { productId, productName, records } = val;
            if (records.length === 0) return;

            let minRecord = records[0];
            let maxRecord = records[0];
            let sumCost = 0;

            records.forEach(r => {
                sumCost += r.cost;
                if (r.cost < minRecord.cost) minRecord = r;
                if (r.cost > maxRecord.cost) maxRecord = r;
            });

            const savings = maxRecord.cost - minRecord.cost;
            const savingsPercent = maxRecord.cost > 0 ? Math.round((savings / maxRecord.cost) * 100) : 0;

            list.push({
                id: productId || productName,
                productName,
                minPrice: minRecord.cost,
                bestSupplierName: minRecord.supplierName,
                invoiceNumber: minRecord.invoiceNumber,
                lotNumber: minRecord.lotNumber,
                purchaseDateFormatted: formatDateTime(minRecord.purchaseDate),
                maxPrice: maxRecord.cost,
                savings,
                savingsPercent,
            });
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                p.bestSupplierName.toLowerCase().includes(q) ||
                p.invoiceNumber.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => b.savings - a.savings);
    }, [filteredPurchases, suppliersMap, search]);

    // 4. Comparativo de Precios
    const supplierPriceComparisonList = useMemo(() => {
        const minCostByProduct = new Map();

        filteredPurchases.forEach(p => {
            if (p.details && Array.isArray(p.details)) {
                p.details.forEach(d => {
                    if (d.isActive === false) return;
                    const prodName = (d.productNombre || d.productName || "Producto").trim().toLowerCase();
                    const cost = Number(d.precioCosto || 0);
                    if (cost <= 0) return;

                    if (!minCostByProduct.has(prodName) || cost < minCostByProduct.get(prodName)) {
                        minCostByProduct.set(prodName, cost);
                    }
                });
            }
        });

        let list = [];
        filteredPurchases.forEach(p => {
            const supId = p.supplierId ? Number(p.supplierId) : null;
            const supObj = supId ? suppliersMap.get(supId) : null;
            const supName = (supObj?.nombre || p.supplierName || (supId ? `Proveedor #${supId}` : "Proveedor")).trim();
            const pDate = p.purchaseDate || p.fechaCompra;

            if (p.details && Array.isArray(p.details)) {
                p.details.forEach(d => {
                    if (d.isActive === false) return;
                    const prodName = (d.productNombre || d.productName || "Producto").trim();
                    const cost = Number(d.precioCosto || 0);
                    if (cost <= 0) return;

                    const minCost = minCostByProduct.get(prodName.toLowerCase()) || cost;
                    const diff = cost - minCost;
                    const diffPercent = minCost > 0 ? Math.round((diff / minCost) * 100) : 0;

                    list.push({
                        id: `${p.id}-${d.id}`,
                        productName: prodName,
                        supplierName: supName,
                        invoiceNumber: p.invoiceNumber || `FAC-${p.id}`,
                        purchaseDateFormatted: formatDateTime(pDate),
                        quantity: Number(d.cantidad || 0),
                        precioCosto: cost,
                        lotNumber: d.nroLote || "—",
                        isBestPrice: diff === 0,
                        diff,
                        diffPercent,
                    });
                });
            }
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(i =>
                i.productName.toLowerCase().includes(q) ||
                i.supplierName.toLowerCase().includes(q) ||
                i.invoiceNumber.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => b.diff - a.diff);
    }, [filteredPurchases, suppliersMap, search]);

    // 5. Compra - Detalle Compra
    const supplierPurchaseDetailsList = useMemo(() => {
        let list = [];
        filteredPurchases.forEach(p => {
            const supId = p.supplierId ? Number(p.supplierId) : null;
            const supObj = supId ? suppliersMap.get(supId) : null;
            const supName = (supObj?.nombre || p.supplierName || (supId ? `Proveedor #${supId}` : "Proveedor")).trim();
            const pDate = p.purchaseDate || p.fechaCompra;

            if (p.details && Array.isArray(p.details)) {
                p.details.forEach(d => {
                    if (d.isActive === false) return;
                    const prodName = (d.productNombre || d.productName || "Producto").trim();
                    const cost = Number(d.precioCosto || 0);
                    const qty = Number(d.cantidad || 0);
                    const subtotal = Number(d.subtotal || cost * qty);

                    list.push({
                        id: `${p.id}-${d.id}`,
                        purchaseDateFormatted: formatDateTime(pDate),
                        invoiceNumber: p.invoiceNumber || `FAC-${p.id}`,
                        supplierName: supName,
                        productName: prodName,
                        lotNumber: d.nroLote || "—",
                        quantity: qty,
                        precioCosto: cost,
                        subtotal,
                    });
                });
            }
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d =>
                d.productName.toLowerCase().includes(q) ||
                d.supplierName.toLowerCase().includes(q) ||
                d.invoiceNumber.toLowerCase().includes(q) ||
                d.lotNumber.toLowerCase().includes(q)
            );
        }

        return list;
    }, [filteredPurchases, suppliersMap, search]);

    // Lista activa según subpestaña seleccionada
    const currentList = useMemo(() => {
        switch (subTab) {
            case "supp_directory": return directoryList;
            case "supp_purchases": return supplierPurchasesSummaryList;
            case "supp_min_prices": return supplierMinPricesList;
            case "supp_price_comparison": return supplierPriceComparisonList;
            case "supp_purchase_details": return supplierPurchaseDetailsList;
            default: return directoryList;
        }
    }, [subTab, directoryList, supplierPurchasesSummaryList, supplierMinPricesList, supplierPriceComparisonList, supplierPurchaseDetailsList]);

    // Paginación
    const totalRecords = currentList.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return currentList.slice(start, start + rowsPerPage);
    }, [currentList, currentPage, rowsPerPage]);

    // Manejo de exportación a Excel (CSV)
    const handleExportExcel = () => {
        if (!currentList || currentList.length === 0) {
            alert("No hay registros para exportar con los filtros seleccionados.");
            return;
        }

        let headers = [];
        let rows = [];

        if (subTab === "supp_directory") {
            headers = ["ID", "RAZÓN SOCIAL / NOMBRE", "CONTACTO", "TELÉFONO", "EMAIL", "DIRECCIÓN", "ESTADO", "COMPRAS REALIZADAS", "TOTAL GASTADO (S/)"];
            rows = currentList.map(s => [
                s.id,
                `"${(s.nombre || '').replace(/"/g, '""')}"`,
                `"${(s.contacto || '').replace(/"/g, '""')}"`,
                `"${s.telefono}"`,
                `"${s.email}"`,
                `"${(s.direccion || '').replace(/"/g, '""')}"`,
                s.isActive ? "ACTIVO" : "INACTIVO",
                s.purchaseCount,
                s.totalSpent.toFixed(2),
            ]);
        } else if (subTab === "supp_purchases") {
            headers = ["PROVEEDOR", "PRIMERA COMPRA", "ÚLTIMA COMPRA", "CANTIDAD COMPRAS", "TOTAL GASTADO"];
            rows = currentList.map(s => [
                `"${(s.supplierName || '').replace(/"/g, '""')}"`,
                s.firstPurchaseFormatted,
                s.lastPurchaseFormatted,
                s.purchaseCount,
                s.totalSpent.toFixed(2),
            ]);
        } else if (subTab === "supp_min_prices") {
            headers = ["PRODUCTO", "PRECIO MÍNIMO", "PROVEEDOR MEJOR PRECIO", "COMPROBANTE", "LOTE", "FECHA REGISTRO", "PRECIO MÁXIMO", "AHORRO ESTIMADO", "% AHORRO"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                r.minPrice.toFixed(2),
                `"${(r.bestSupplierName || '').replace(/"/g, '""')}"`,
                r.invoiceNumber,
                r.lotNumber,
                r.purchaseDateFormatted,
                r.maxPrice.toFixed(2),
                r.savings.toFixed(2),
                `${r.savingsPercent}%`,
            ]);
        } else if (subTab === "supp_price_comparison") {
            headers = ["PRODUCTO", "PROVEEDOR", "COMPROBANTE", "FECHA", "CANTIDAD", "PRECIO COSTO", "LOTE", "COMPARACIÓN VS MÍNIMO"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${(r.supplierName || '').replace(/"/g, '""')}"`,
                r.invoiceNumber,
                r.purchaseDateFormatted,
                r.quantity,
                r.precioCosto.toFixed(2),
                r.lotNumber,
                r.isBestPrice ? "Mejor Precio" : `+S/ ${r.diff.toFixed(2)} (+${r.diffPercent}%)`,
            ]);
        } else if (subTab === "supp_purchase_details") {
            headers = ["FECHA COMPRA", "COMPROBANTE", "PROVEEDOR", "PRODUCTO", "LOTE", "CANTIDAD", "COSTO UNITARIO", "SUBTOTAL"];
            rows = currentList.map(r => [
                r.purchaseDateFormatted,
                r.invoiceNumber,
                `"${(r.supplierName || '').replace(/"/g, '""')}"`,
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                r.lotNumber,
                r.quantity,
                r.precioCosto.toFixed(2),
                r.subtotal.toFixed(2),
            ]);
        }

        downloadCSV(`reporte_proveedores_${subTab}`, headers, rows);
    };

    const handleClearFilters = () => {
        setSearch("");
        setStatusFilter("TODOS");
        setStartDate("");
        setEndDate("");
        setDaysFilter("all");
        setCurrentPage(1);
    };

    return (
        <div className="suppliers-report-wrapper w-100">
            {/* 1. Header con botones de acción PDF / Excel */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-teal-subtle text-teal fw-bold px-3 py-1.5 rounded-pill" style={{ fontSize: "0.78rem" }}>
                        🚚 GESTIÓN & ANÁLISIS DE PROVEEDORES
                    </span>
                    <span className="text-secondary small">
                        Seguimiento comercial, catálogo y comparativa de compras
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-bold shadow-sm rounded-2"
                        title="Imprimir reporte en formato PDF"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        <span>PDF</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5 fw-bold shadow-sm rounded-2"
                        title="Exportar a archivo Excel (CSV)"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>EXCEL</span>
                    </button>
                </div>
            </div>

            {/* 2. Tarjetas KPI Gerenciales de Proveedores */}
            <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="bg-white rounded-3 border p-3 shadow-sm h-100 d-flex align-items-center justify-content-between">
                        <div>
                            <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                                PROVEEDORES REGISTRADOS
                            </span>
                            <div className="d-flex align-items-baseline gap-2 mt-1">
                                <span className="fs-3 fw-black text-dark">{kpiSummary.totalSuppliers}</span>
                                <span className="badge bg-emerald-subtle text-emerald rounded-pill" style={{ fontSize: "0.7rem" }}>
                                    {kpiSummary.activeSuppliers} Activos
                                </span>
                            </div>
                            <div className="text-secondary small mt-0.5" style={{ fontSize: "0.75rem" }}>
                                {kpiSummary.inactiveSuppliers > 0 ? `${kpiSummary.inactiveSuppliers} Inactivos` : "Todos operativos"}
                            </div>
                        </div>
                        <div className="rounded-3 bg-teal-subtle text-teal p-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                            <span style={{ fontSize: "1.4rem" }}>🏢</span>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="bg-white rounded-3 border p-3 shadow-sm h-100 d-flex align-items-center justify-content-between">
                        <div>
                            <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                                COMPRAS REGISTRADAS
                            </span>
                            <div className="d-flex align-items-baseline gap-2 mt-1">
                                <span className="fs-3 fw-black text-dark">{kpiSummary.totalPurchasesCount}</span>
                                <span className="text-secondary small" style={{ fontSize: "0.75rem" }}>facturas</span>
                            </div>
                            <div className="text-muted small mt-0.5" style={{ fontSize: "0.75rem" }}>
                                Órdenes filtradas en rango
                            </div>
                        </div>
                        <div className="rounded-3 bg-blue-subtle text-blue p-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                            <span style={{ fontSize: "1.4rem" }}>🚚</span>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="bg-white rounded-3 border p-3 shadow-sm h-100 d-flex align-items-center justify-content-between">
                        <div>
                            <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                                TOTAL GASTADO EN COMPRAS
                            </span>
                            <div className="d-flex align-items-baseline gap-2 mt-1">
                                <span className="fs-3 fw-black text-orange-custom">
                                    S/ {kpiSummary.totalSpentAmount.toFixed(2)}
                                </span>
                            </div>
                            <div className="text-muted small mt-0.5" style={{ fontSize: "0.75rem" }}>
                                Inversión acumulada
                            </div>
                        </div>
                        <div className="rounded-3 bg-amber-light text-amber p-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                            <span style={{ fontSize: "1.4rem" }}>💰</span>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="bg-white rounded-3 border p-3 shadow-sm h-100 d-flex align-items-center justify-content-between">
                        <div style={{ maxWidth: "75%" }}>
                            <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                                PROVEEDOR PRINCIPAL
                            </span>
                            <div className="fw-black text-dark text-truncate mt-1" style={{ fontSize: "1.05rem" }} title={kpiSummary.topSupplierName}>
                                {kpiSummary.topSupplierName}
                            </div>
                            <div className="text-emerald fw-semibold small mt-0.5" style={{ fontSize: "0.75rem" }}>
                                {kpiSummary.topSupplierSpent > 0 ? `S/ ${kpiSummary.topSupplierSpent.toFixed(2)} acumulados` : "Sin compras"}
                            </div>
                        </div>
                        <div className="rounded-3 bg-purple-subtle text-purple p-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px" }}>
                            <span style={{ fontSize: "1.4rem" }}>🏆</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Sub-pestañas de Proveedores */}
            <div className="sub-tabs-wrapper d-flex gap-2 mb-3 overflow-x-auto pb-1">
                {subTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`btn-sub-tab ${subTab === tab.id ? "active" : ""}`}
                        onClick={() => {
                            setSubTab(tab.id);
                            setCurrentPage(1);
                        }}
                    >
                        <span className="me-1">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* 4. Barra de Filtros y Búsqueda */}
            <div className="bg-white rounded-3 border p-3 shadow-sm mb-3">
                <div className="row g-2 align-items-center">
                    {/* Buscador inteligente */}
                    <div className="col-12 col-md-4 col-lg-4">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-end-0 text-secondary">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder={
                                    subTab === "supp_directory" ? "Buscar por razón social, contacto, teléfono, RUC..." :
                                    subTab === "supp_purchases" ? "Buscar por nombre del proveedor..." :
                                    subTab === "supp_min_prices" ? "Buscar por producto, proveedor, comprobante..." :
                                    "Buscar producto, proveedor, factura..."
                                }
                                className="form-control border-start-0 bg-light shadow-none"
                                style={{ fontSize: "0.78rem" }}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="btn btn-outline-secondary border-start-0 border"
                                    title="Limpiar búsqueda"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtro de Estado (específico para Directorio) */}
                    {subTab === "supp_directory" && (
                        <div className="col-6 col-md-2 col-lg-2">
                            <div className="d-flex align-items-center gap-1.5">
                                <span className="small text-secondary fw-bold" style={{ fontSize: "0.72rem" }}>ESTADO:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="form-select form-select-sm border bg-light shadow-none fw-semibold"
                                    style={{ fontSize: "0.78rem", borderRadius: "8px" }}
                                >
                                    <option value="TODOS">TODOS</option>
                                    <option value="ACTIVO">ACTIVOS</option>
                                    <option value="INACTIVO">INACTIVOS</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Filtros de Rango de Fechas (para compras y análisis) */}
                    <div className="col-12 col-md-auto d-flex flex-wrap align-items-center gap-2 ms-auto">
                        <div className="d-flex align-items-center gap-1.5">
                            <span className="small text-secondary fw-bold" style={{ fontSize: "0.72rem" }}>PERÍODO:</span>
                            <select
                                value={daysFilter}
                                onChange={(e) => {
                                    setDaysFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="form-select form-select-sm border bg-light shadow-none fw-semibold"
                                style={{ fontSize: "0.78rem", minWidth: "115px", borderRadius: "8px" }}
                            >
                                <option value="all">Todas las fechas</option>
                                <option value="today">Hoy</option>
                                <option value="7">Últimos 7 días</option>
                                <option value="15">Últimos 15 días</option>
                                <option value="30">Últimos 30 días</option>
                                <option value="month">Este mes</option>
                                <option value="custom">Rango personalizado</option>
                            </select>
                        </div>

                        {daysFilter === "custom" && (
                            <div className="d-flex align-items-center gap-1">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="form-control form-control-sm border bg-light shadow-none"
                                    style={{ fontSize: "0.76rem", width: "130px" }}
                                />
                                <span className="small text-muted">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="form-control form-control-sm border bg-light shadow-none"
                                    style={{ fontSize: "0.76rem", width: "130px" }}
                                />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="btn btn-sm btn-link text-secondary text-decoration-none fw-semibold d-flex align-items-center gap-1 p-1"
                            style={{ fontSize: "0.74rem" }}
                            title="Restablecer filtros"
                        >
                            <span>⊗</span>
                            <span>LIMPIAR</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 5. Tabla de Datos según Subpestaña */}
            <div className="bg-white rounded-3 border shadow-sm overflow-hidden mb-3">
                {loading ? (
                    <div className="p-5 text-center">
                        <div className="spinner-border text-orange-custom" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
                            <span className="visually-hidden">Cargando reporte...</span>
                        </div>
                        <p className="text-secondary small mt-2 mb-0">Cargando y consolidando reporte de proveedores...</p>
                    </div>
                ) : paginatedItems.length === 0 ? (
                    <div className="p-5 text-center my-4">
                        <div className="empty-search-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
                            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <h5 className="fw-black text-secondary m-0" style={{ letterSpacing: "1px", fontSize: "1.05rem" }}>
                            SIN RESULTADOS
                        </h5>
                        <p className="text-muted small mt-1 mb-0" style={{ fontSize: "0.75rem" }}>
                            No se encontraron registros de proveedores con los parámetros seleccionados
                        </p>
                        {(search || statusFilter !== "TODOS" || daysFilter !== "all") && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="btn btn-sm btn-outline-secondary mt-3 rounded-pill px-3 fw-semibold"
                                style={{ fontSize: "0.75rem" }}
                            >
                                Ver todos los proveedores
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-responsive">
                        {/* TABLA 1: DIRECTORIO DE PROVEEDORES (Catálogo General con Compras) */}
                        {subTab === "supp_directory" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>RAZÓN SOCIAL / NOMBRE</th>
                                        <th>CONTACTO</th>
                                        <th>TELÉFONO</th>
                                        <th>EMAIL</th>
                                        <th>DIRECCIÓN</th>
                                        <th className="text-center">ESTADO</th>
                                        <th className="text-center">COMPRAS</th>
                                        <th className="text-end">TOTAL GASTADO</th>
                                        <th className="text-center">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((sup, idx) => (
                                        <tr key={sup.id || idx}>
                                            <td className="text-muted small fw-bold">#{sup.id}</td>
                                            <td>
                                                <div className="fw-bold text-dark">{sup.nombre}</div>
                                                <span className="small text-muted" style={{ fontSize: "0.7rem" }}>
                                                    {sup.purchaseCount > 0 ? `${sup.purchaseCount} órdenes registradas` : "Sin compras previas"}
                                                </span>
                                            </td>
                                            <td className="text-secondary small">{sup.contacto}</td>
                                            <td>
                                                {sup.telefono !== "—" ? (
                                                    <span className="d-inline-flex align-items-center gap-1 small text-dark fw-semibold">
                                                        <span>📞</span>
                                                        <span>{sup.telefono}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-muted small">—</span>
                                                )}
                                            </td>
                                            <td className="text-secondary small">{sup.email}</td>
                                            <td className="text-secondary small" style={{ maxWidth: "200px" }}>
                                                <div className="text-truncate" title={sup.direccion}>{sup.direccion}</div>
                                            </td>
                                            <td className="text-center">
                                                {sup.isActive ? (
                                                    <span className="badge-badge bg-emerald-light text-emerald fw-bold">
                                                        ● Activo
                                                    </span>
                                                ) : (
                                                    <span className="badge-badge bg-light text-muted border">
                                                        ○ Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-light text-dark border px-2 py-1 fw-bold">
                                                    {sup.purchaseCount}
                                                </span>
                                            </td>
                                            <td className="text-end fw-bold text-orange-custom">
                                                S/ {sup.totalSpent.toFixed(2)}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn-action-icon text-secondary"
                                                    onClick={() => setSelectedSupplierPurchasesModal({
                                                        supplierName: sup.nombre,
                                                        purchaseCount: sup.purchaseCount,
                                                        totalSpent: sup.totalSpent,
                                                        purchases: sup.purchases,
                                                        contacto: sup.contacto,
                                                        telefono: sup.telefono,
                                                        direccion: sup.direccion,
                                                    })}
                                                    title="Ver historial detallado de compras del proveedor"
                                                >
                                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* TABLA 2: COMPRAS POR PROVEEDOR */}
                        {subTab === "supp_purchases" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRIMERA COMPRA</th>
                                        <th>ÚLTIMA COMPRA</th>
                                        <th>PROVEEDOR</th>
                                        <th className="text-center">CANTIDAD COMPRAS</th>
                                        <th className="text-end">TOTAL GASTADO</th>
                                        <th className="text-center">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((supp, idx) => (
                                        <tr key={idx}>
                                            <td className="small text-secondary">• {supp.firstPurchaseFormatted}</td>
                                            <td className="small text-secondary">• {supp.lastPurchaseFormatted}</td>
                                            <td className="fw-bold text-dark">{supp.supplierName}</td>
                                            <td className="text-center">
                                                <span className="d-inline-flex align-items-center gap-1.5 fw-bold text-dark">
                                                    <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>🟡</span>
                                                    <span>{supp.purchaseCount}</span>
                                                </span>
                                            </td>
                                            <td className="text-end fw-bold text-orange-custom">
                                                S/ {supp.totalSpent.toFixed(2)}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn-action-icon text-secondary"
                                                    onClick={() => setSelectedSupplierPurchasesModal(supp)}
                                                    title="Ver compras detalladas del proveedor"
                                                >
                                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* TABLA 3: PRECIOS MÍNIMOS */}
                        {subTab === "supp_min_prices" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>PRODUCTO</th>
                                        <th className="text-end">PRECIO MÍNIMO</th>
                                        <th>PROVEEDOR MEJOR PRECIO</th>
                                        <th>COMPROBANTE / LOTE</th>
                                        <th>FECHA REGISTRO</th>
                                        <th className="text-end">PRECIO MÁXIMO</th>
                                        <th className="text-center">AHORRO ESTIMADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((prod, idx) => (
                                        <tr key={idx}>
                                            <td className="text-muted small">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                                            <td className="fw-bold text-dark">{prod.productName}</td>
                                            <td className="text-end">
                                                <span className="badge-badge bg-emerald-light text-emerald fw-bold">
                                                    S/ {prod.minPrice.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="fw-semibold text-dark">{prod.bestSupplierName}</td>
                                            <td className="small text-secondary">
                                                <span className="fw-semibold">{prod.invoiceNumber}</span>
                                                {prod.lotNumber && prod.lotNumber !== "—" && (
                                                    <span className="badge bg-light text-secondary border ms-1.5" style={{ fontSize: "0.68rem" }}>
                                                        Lote: {prod.lotNumber}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="small text-secondary">• {prod.purchaseDateFormatted}</td>
                                            <td className="text-end text-muted small">S/ {prod.maxPrice.toFixed(2)}</td>
                                            <td className="text-center">
                                                {prod.savings > 0 ? (
                                                    <span className="badge-badge bg-emerald-light text-emerald fw-bold">
                                                        S/ {prod.savings.toFixed(2)} (-{prod.savingsPercent}%)
                                                    </span>
                                                ) : (
                                                    <span className="badge-badge bg-light text-muted border">
                                                        Precio Único
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* TABLA 4: COMPARATIVO PRECIOS */}
                        {subTab === "supp_price_comparison" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRODUCTO</th>
                                        <th>PROVEEDOR</th>
                                        <th>COMPROBANTE</th>
                                        <th>FECHA</th>
                                        <th className="text-center">CANTIDAD</th>
                                        <th className="text-end">PRECIO COSTO</th>
                                        <th>LOTE</th>
                                        <th className="text-center">COMPARACIÓN VS MÍNIMO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="fw-semibold text-dark">{item.supplierName}</td>
                                            <td className="small text-secondary">{item.invoiceNumber}</td>
                                            <td className="small text-secondary">• {item.purchaseDateFormatted}</td>
                                            <td className="text-center fw-semibold text-dark">{item.quantity}</td>
                                            <td className="text-end fw-bold text-dark">S/ {item.precioCosto.toFixed(2)}</td>
                                            <td>
                                                <span className="badge bg-light text-secondary border" style={{ fontSize: "0.7rem" }}>
                                                    {item.lotNumber}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                {item.isBestPrice ? (
                                                    <span className="badge-badge bg-emerald-light text-emerald fw-bold">
                                                        ⭐ Mejor Precio
                                                    </span>
                                                ) : (
                                                    <span className="badge-badge bg-amber-light text-amber fw-bold">
                                                        +S/ {item.diff.toFixed(2)} (+{item.diffPercent}%)
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* TABLA 5: COMPRA - DETALLE COMPRA */}
                        {subTab === "supp_purchase_details" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>FECHA COMPRA</th>
                                        <th>FACTURA / COMPROBANTE</th>
                                        <th>PROVEEDOR</th>
                                        <th>PRODUCTO</th>
                                        <th>LOTE</th>
                                        <th className="text-center">CANTIDAD</th>
                                        <th className="text-end">COSTO UNIT.</th>
                                        <th className="text-end">SUBTOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="small text-secondary">• {item.purchaseDateFormatted}</td>
                                            <td className="fw-bold small text-secondary">{item.invoiceNumber}</td>
                                            <td className="fw-semibold text-dark">{item.supplierName}</td>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td>
                                                <span className="badge bg-light text-secondary border" style={{ fontSize: "0.7rem" }}>
                                                    {item.lotNumber}
                                                </span>
                                            </td>
                                            <td className="text-center fw-semibold text-dark">{item.quantity}</td>
                                            <td className="text-end text-dark">S/ {item.precioCosto.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-orange-custom">S/ {item.subtotal.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Footer de Paginación */}
                <div className="d-flex flex-wrap align-items-center justify-content-between p-3 border-top gap-3 bg-light">
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-uppercase fw-bold text-secondary" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                            FILAS POR PÁGINA:
                        </span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="form-select form-select-sm border bg-white shadow-none fw-semibold"
                            style={{ width: "95px", fontSize: "0.75rem", borderRadius: "8px" }}
                        >
                            <option value={10}>10 filas</option>
                            <option value={25}>25 filas</option>
                            <option value={50}>50 filas</option>
                            <option value={100}>100 filas</option>
                        </select>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <span className="text-uppercase fw-bold text-secondary" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                            RESULTADOS: {totalRecords === 0 ? "0 - 0 DE 0" : `${(currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, totalRecords)} DE ${totalRecords}`}
                        </span>

                        {totalPages > 1 && (
                            <div className="btn-group btn-group-sm ms-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Compras del Proveedor */}
            {selectedSupplierPurchasesModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
                            <div className="modal-header border-bottom py-3 px-4 bg-light" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                                <div>
                                    <span className="text-uppercase fw-bold text-muted" style={{ fontSize: "0.68rem", letterSpacing: "0.05em" }}>
                                        HISTORIAL DE COMPRAS
                                    </span>
                                    <h5 className="modal-title fw-black text-dark m-0">
                                        {selectedSupplierPurchasesModal.supplierName}
                                    </h5>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedSupplierPurchasesModal(null)}
                                />
                            </div>
                            <div className="modal-body p-4">
                                <div className="d-flex flex-wrap justify-content-between align-items-center bg-light p-3 rounded-3 mb-3 border">
                                    <div className="small text-secondary">
                                        <strong>Órdenes Registradas:</strong> {selectedSupplierPurchasesModal.purchaseCount}
                                    </div>
                                    <div className="fw-bold text-orange-custom fs-5">
                                        Total Acumulado: S/ {selectedSupplierPurchasesModal.totalSpent.toFixed(2)}
                                    </div>
                                </div>

                                <div className="table-responsive" style={{ maxHeight: "360px" }}>
                                    <table className="table table-hover align-middle mb-0 custom-report-table">
                                        <thead className="table-light">
                                            <tr>
                                                <th>COMPROBANTE</th>
                                                <th>FECHA</th>
                                                <th className="text-center">PRODUCTOS</th>
                                                <th className="text-end">MONTO TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedSupplierPurchasesModal.purchases || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center text-muted p-4">
                                                        No hay facturas o compras registradas para este proveedor.
                                                    </td>
                                                </tr>
                                            ) : (
                                                (selectedSupplierPurchasesModal.purchases || []).map((p, i) => (
                                                    <tr key={p.id || i}>
                                                        <td className="fw-bold text-dark">{p.invoiceNumber || `FAC-${p.id}`}</td>
                                                        <td className="small text-secondary">• {formatDateTime(p.purchaseDate || p.fechaCompra)}</td>
                                                        <td className="text-center">
                                                            <span className="badge bg-light text-secondary border">
                                                                {(p.details || []).length} ítems
                                                            </span>
                                                        </td>
                                                        <td className="text-end fw-bold text-dark">
                                                            S/ {Number(p.total || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer border-top py-2 px-4 bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm px-3 fw-semibold"
                                    onClick={() => setSelectedSupplierPurchasesModal(null)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
