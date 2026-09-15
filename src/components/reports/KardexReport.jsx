import React, { useState, useMemo } from "react";
import { formatDateTime, isDateInFilter, downloadCSV } from "./reportUtils.js";

export const KardexReport = ({
    lots = [],
    productsList = [],
    purchases = [],
    dailySales = [],
    inventoryAdjustments = [],
    loading = false,
}) => {
    const kardexSubTabs = [
        { id: "kardex_valorizado", label: "Kardex Valorizado" },
        { id: "kardex_movimiento", label: "Movimientos de Kardex" },
        { id: "kardex_producto", label: "Kardex por Producto" },
    ];

    const [subTab, setSubTab] = useState("kardex_valorizado");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [daysFilter, setDaysFilter] = useState("all");
    const [movementTypeFilter, setMovementTypeFilter] = useState("TODOS");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal para ver movimientos de un producto
    const [selectedProductKardexModal, setSelectedProductKardexModal] = useState(null);

    // Mapa de productos
    const productsMap = useMemo(() => {
        const map = new Map();
        productsList.forEach(p => {
            if (p.idProducto) map.set(Number(p.idProducto), p);
            if (p.id) map.set(Number(p.id), p);
            if (p.codigoBarras) map.set(p.codigoBarras.trim(), p);
            if (p.nombre) map.set(p.nombre.toLowerCase().trim(), p);
        });
        return map;
    }, [productsList]);

    const getProductDisplayInfo = (name, id, code) => {
        const pObj = (id && productsMap.get(Number(id))) ||
            (code && productsMap.get(code.trim())) ||
            (name && productsMap.get(name.toLowerCase().trim()));

        const displayName = pObj ? (pObj.nombre || name) : (name || "Producto General");
        const categoryName = pObj?.categoria?.name || pObj?.categoriaNombre || "Sin Categoría";
        const finalCode = pObj?.codigoBarras || code || "—";
        const salePrice = pObj?.precioVenta ? Number(pObj.precioVenta) : null;
        const costPrice = pObj?.costo ? Number(pObj.costo) : null;

        return {
            displayName,
            categoryName,
            code: finalCode,
            salePrice,
            costPrice,
            productObj: pObj,
        };
    };

    // Helper de fecha
    const isKardexDateInFilter = (dateStr) => {
        return isDateInFilter(dateStr, daysFilter, startDate, endDate);
    };

    // 1. Kardex Valorizado
    const kardexValorizadoList = useMemo(() => {
        const list = [];

        // Lotes
        lots.forEach(l => {
            if (l.isActive === false) return;
            const dateStr = l.createdAt || l.fechaVencimiento;
            if (!isKardexDateInFilter(dateStr)) return;

            const prodInfo = getProductDisplayInfo(l.nombreProducto, l.idProducto, l.codigoBarras);
            const qty = Number(l.cantidadInicial !== undefined ? l.cantidadInicial : (l.cantidadActual || 0));
            if (qty <= 0) return;

            const unitCost = Number(l.costoUnitario || prodInfo.costPrice || 0);
            const totalCost = qty * unitCost;

            list.push({
                id: `lot-${l.idLote}`,
                timestamp: dateStr ? new Date(String(dateStr).replace(" ", "T")).getTime() : 0,
                dateFormatted: formatDateTime(dateStr),
                productName: prodInfo.displayName,
                barcode: prodInfo.code,
                category: prodInfo.categoryName,
                movementType: "ENTRADA",
                quantity: qty,
                unitCost,
                totalCost,
                unitSalePrice: null,
                totalSalePrice: null,
                reference: "Carga Inicial de Inventario",
                lotNumber: l.nroLote || "—",
                clientName: "—",
                userName: "Sistema",
                productId: l.idProducto || prodInfo.productObj?.idProducto,
            });
        });

        // Compras
        purchases.forEach(p => {
            if (p.isActive === false) return;
            const pDate = p.purchaseDate || p.fechaCompra;
            if (!isKardexDateInFilter(pDate)) return;

            const invoiceRef = p.invoiceNumber
                ? (p.invoiceNumber.toLowerCase().startsWith("compra") ? p.invoiceNumber : `Compra ${p.invoiceNumber}`)
                : `Compra #${p.id}`;

            if (p.details && Array.isArray(p.details)) {
                p.details.forEach((d, idx) => {
                    if (d.isActive === false) return;
                    const prodInfo = getProductDisplayInfo(d.productNombre || d.productName, d.productId, null);
                    const qty = Number(d.cantidad || 0);
                    if (qty <= 0) return;

                    const unitCost = Number(d.precioCosto || prodInfo.costPrice || 0);
                    const totalCost = qty * unitCost;

                    list.push({
                        id: `pur-${p.id}-${d.id || idx}`,
                        timestamp: pDate ? new Date(String(pDate).replace(" ", "T")).getTime() : 0,
                        dateFormatted: formatDateTime(pDate),
                        productName: prodInfo.displayName,
                        barcode: prodInfo.code,
                        category: prodInfo.categoryName,
                        movementType: "ENTRADA",
                        quantity: qty,
                        unitCost,
                        totalCost,
                        unitSalePrice: null,
                        totalSalePrice: null,
                        reference: invoiceRef,
                        lotNumber: d.nroLote || "—",
                        clientName: "—",
                        userName: "Admin",
                        productId: d.productId || prodInfo.productObj?.idProducto,
                    });
                });
            }
        });

        // Ventas
        dailySales.forEach(s => {
            if (s.isActive === false) return;
            const sDate = s.dateTime || s.fechaHora;
            if (!isKardexDateInFilter(sDate)) return;

            const receiptRef = s.series
                ? `Venta ${s.series}-${s.receiptNumber || s.id}`
                : `Venta #${s.id}`;

            if (s.details && Array.isArray(s.details)) {
                s.details.forEach((d, idx) => {
                    if (d.isActive === false) return;
                    const prodInfo = getProductDisplayInfo(d.productName || d.nombreProducto, null, null);
                    const qty = Number(d.presentationQuantity || d.cantidad || 1);
                    if (qty <= 0) return;

                    const unitCost = Number(d.baseUnitCost || prodInfo.costPrice || 0);
                    const totalCost = qty * unitCost;
                    const unitSale = Number(d.presentationUnitPrice || d.precioUnitario || prodInfo.salePrice || 0);
                    const totalSale = Number(d.subtotal || (qty * unitSale));

                    list.push({
                        id: `sale-${s.id}-${d.id || idx}`,
                        timestamp: sDate ? new Date(String(sDate).replace(" ", "T")).getTime() : 0,
                        dateFormatted: formatDateTime(sDate),
                        productName: prodInfo.displayName,
                        barcode: prodInfo.code,
                        category: prodInfo.categoryName,
                        movementType: "SALIDA",
                        quantity: qty,
                        unitCost,
                        totalCost,
                        unitSalePrice: unitSale,
                        totalSalePrice: totalSale,
                        reference: receiptRef,
                        lotNumber: d.lotNumber || "—",
                        clientName: s.clientName || s.clienteNombre || "Público General",
                        userName: s.employeeName || s.empleadoNombre || "Admin",
                        productId: prodInfo.productObj?.idProducto || prodInfo.productObj?.id,
                    });
                });
            }
        });

        // Ajustes
        inventoryAdjustments.forEach(adj => {
            if (adj.isActive === false) return;
            const adjDate = adj.fecha || adj.createdAt;
            if (!isKardexDateInFilter(adjDate)) return;

            const prodInfo = getProductDisplayInfo(adj.productoNombre, adj.idProducto, adj.productoCodigo);
            const qty = Number(adj.cantidad || 0);
            if (qty <= 0) return;

            const isEntrada = adj.tipoAjuste === "ENTRADA";
            const unitCost = Number(prodInfo.costPrice || 0);
            const totalCost = qty * unitCost;
            const unitSale = !isEntrada ? Number(prodInfo.salePrice || 0) : null;
            const totalSale = !isEntrada ? qty * (unitSale || 0) : null;
            const ref = adj.motivo
                ? `Ajuste ${adj.tipoAjuste} (${adj.motivo})`
                : `Ajuste ${adj.tipoAjuste} #${adj.idAjuste}`;

            list.push({
                id: `adj-${adj.idAjuste}`,
                timestamp: adjDate ? new Date(String(adjDate).replace(" ", "T")).getTime() : 0,
                dateFormatted: formatDateTime(adjDate),
                productName: prodInfo.displayName,
                barcode: prodInfo.code,
                category: prodInfo.categoryName,
                movementType: isEntrada ? "ENTRADA" : "SALIDA",
                quantity: qty,
                unitCost,
                totalCost,
                unitSalePrice: unitSale,
                totalSalePrice: totalSale,
                reference: ref,
                lotNumber: adj.nroLote || "—",
                clientName: "—",
                userName: adj.empleadoNombre || "Admin",
                productId: adj.idProducto || prodInfo.productObj?.idProducto,
            });
        });

        let filtered = list;
        if (movementTypeFilter !== "TODOS") {
            filtered = filtered.filter(m => m.movementType === movementTypeFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(m =>
                m.productName.toLowerCase().includes(q) ||
                m.reference.toLowerCase().includes(q) ||
                m.barcode.toLowerCase().includes(q) ||
                m.category.toLowerCase().includes(q) ||
                m.clientName.toLowerCase().includes(q) ||
                m.lotNumber.toLowerCase().includes(q)
            );
        }

        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }, [lots, purchases, dailySales, inventoryAdjustments, productsMap, movementTypeFilter, search, startDate, endDate, daysFilter]);

    // 2. Kardex Movimiento
    const kardexMovimientoList = useMemo(() => {
        const list = [];

        dailySales.forEach(s => {
            if (s.isActive === false) return;
            const sDate = s.dateTime || s.fechaHora;
            if (!isKardexDateInFilter(sDate)) return;

            const user = s.employeeName || s.empleadoNombre || "Admin";
            const receipt = `${s.series || "T001"}-${s.receiptNumber || s.id}`;
            const client = s.clientName || s.clienteNombre || "Público General";

            if (s.details && Array.isArray(s.details)) {
                s.details.forEach((d, idx) => {
                    if (d.isActive === false) return;
                    const prodInfo = getProductDisplayInfo(d.productName || d.nombreProducto, null, null);
                    const qty = Number(d.presentationQuantity || d.cantidad || 1);
                    const cost = Number(d.baseUnitCost || prodInfo.costPrice || 0);
                    const totalCost = qty * cost;
                    const salePrice = Number(d.presentationUnitPrice || d.precioUnitario || prodInfo.salePrice || 0);
                    const totalSale = Number(d.subtotal || (qty * salePrice));

                    list.push({
                        id: `mov-${s.id}-${d.id || idx}`,
                        timestamp: sDate ? new Date(String(sDate).replace(" ", "T")).getTime() : 0,
                        dateFormatted: formatDateTime(sDate),
                        userName: user,
                        receiptNumber: receipt,
                        clientName: client,
                        productName: prodInfo.displayName,
                        barcode: prodInfo.code,
                        quantitySold: qty,
                        precioCompra: cost,
                        totalCompra: totalCost,
                        precioVenta: salePrice,
                        totalVenta: totalSale,
                        lotNumber: d.lotNumber || "—",
                        productId: prodInfo.productObj?.idProducto || prodInfo.productObj?.id,
                    });
                });
            }
        });

        let filtered = list;
        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(m =>
                m.productName.toLowerCase().includes(q) ||
                m.receiptNumber.toLowerCase().includes(q) ||
                m.clientName.toLowerCase().includes(q) ||
                m.barcode.toLowerCase().includes(q) ||
                m.userName.toLowerCase().includes(q)
            );
        }

        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }, [dailySales, productsMap, search, startDate, endDate, daysFilter]);

    // 3. Kardex por Producto
    const kardexPorProductoList = useMemo(() => {
        let list = productsList.map(p => {
            const rawName = p.nombre || "Producto";
            const lab = p.laboratorioNombre || p.laboratorio?.nombre;
            const displayName = (lab && !rawName.includes("/")) ? `${rawName} / ${lab}` : rawName;
            const barcode = p.codigoBarras || "—";
            const category = p.categoria?.name || p.categoriaNombre || "N/A";
            const stockTotal = Number(p.stockReal !== undefined ? p.stockReal : (p.stockTotal || 0));

            return {
                id: p.idProducto || p.id,
                productName: displayName,
                rawName,
                barcode,
                category,
                stockTotal,
                productObj: p,
            };
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                p.barcode.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => a.productName.localeCompare(b.productName));
    }, [productsList, search]);

    // Totales Kardex Movimiento
    const totalComprasAcumuladas = useMemo(() => {
        return kardexMovimientoList.reduce((sum, item) => sum + item.totalCompra, 0);
    }, [kardexMovimientoList]);

    const totalVentasAcumuladas = useMemo(() => {
        return kardexMovimientoList.reduce((sum, item) => sum + item.totalVenta, 0);
    }, [kardexMovimientoList]);

    // Historial individual para el modal
    const productKardexMovements = useMemo(() => {
        if (!selectedProductKardexModal) return [];
        const targetId = Number(selectedProductKardexModal.id);
        const targetName = selectedProductKardexModal.rawName?.toLowerCase().trim() || selectedProductKardexModal.productName?.toLowerCase().trim();
        const targetBarcode = selectedProductKardexModal.barcode?.trim();

        const movements = [];

        lots.forEach(l => {
            if (l.isActive === false) return;
            const matches = (targetId && Number(l.idProducto) === targetId) ||
                (targetBarcode && targetBarcode !== "—" && l.codigoBarras?.trim() === targetBarcode) ||
                (targetName && l.nombreProducto?.toLowerCase().trim() === targetName);
            if (!matches) return;

            const dateStr = l.createdAt || l.fechaVencimiento;
            const qty = Number(l.cantidadInicial !== undefined ? l.cantidadInicial : (l.cantidadActual || 0));
            if (qty <= 0) return;

            movements.push({
                timestamp: dateStr ? new Date(String(dateStr).replace(" ", "T")).getTime() : 0,
                dateFormatted: formatDateTime(dateStr),
                type: "ENTRADA",
                quantity: qty,
                cost: Number(l.costoUnitario || 0),
                salePrice: null,
                reference: "Carga Inicial de Inventario",
                lotNumber: l.nroLote || "—",
            });
        });

        purchases.forEach(p => {
            if (p.isActive === false) return;
            const pDate = p.purchaseDate || p.fechaCompra;
            const ref = p.invoiceNumber ? (p.invoiceNumber.toLowerCase().startsWith("compra") ? p.invoiceNumber : `Compra ${p.invoiceNumber}`) : `Compra #${p.id}`;

            if (p.details && Array.isArray(p.details)) {
                p.details.forEach(d => {
                    if (d.isActive === false) return;
                    const matches = (targetId && Number(d.productId) === targetId) ||
                        (targetName && (d.productNombre || d.productName)?.toLowerCase().trim() === targetName);
                    if (!matches) return;

                    const qty = Number(d.cantidad || 0);
                    if (qty <= 0) return;

                    movements.push({
                        timestamp: pDate ? new Date(String(pDate).replace(" ", "T")).getTime() : 0,
                        dateFormatted: formatDateTime(pDate),
                        type: "ENTRADA",
                        quantity: qty,
                        cost: Number(d.precioCosto || 0),
                        salePrice: null,
                        reference: ref,
                        lotNumber: d.nroLote || "—",
                    });
                });
            }
        });

        dailySales.forEach(s => {
            if (s.isActive === false) return;
            const sDate = s.dateTime || s.fechaHora;
            const ref = s.series ? `Venta ${s.series}-${s.receiptNumber || s.id}` : `Venta #${s.id}`;

            if (s.details && Array.isArray(s.details)) {
                s.details.forEach(d => {
                    if (d.isActive === false) return;
                    const matches = (targetName && (d.productName || d.nombreProducto)?.toLowerCase().trim() === targetName);
                    if (!matches) return;

                    const qty = Number(d.presentationQuantity || d.cantidad || 1);
                    if (qty <= 0) return;

                    movements.push({
                        timestamp: sDate ? new Date(String(sDate).replace(" ", "T")).getTime() : 0,
                        dateFormatted: formatDateTime(sDate),
                        type: "SALIDA",
                        quantity: qty,
                        cost: Number(d.baseUnitCost || 0),
                        salePrice: Number(d.presentationUnitPrice || d.precioUnitario || 0),
                        reference: ref,
                        lotNumber: d.lotNumber || "—",
                    });
                });
            }
        });

        inventoryAdjustments.forEach(adj => {
            if (adj.isActive === false) return;
            const matches = (targetId && Number(adj.idProducto) === targetId) ||
                (targetBarcode && targetBarcode !== "—" && adj.productoCodigo?.trim() === targetBarcode) ||
                (targetName && adj.productoNombre?.toLowerCase().trim() === targetName);
            if (!matches) return;

            const adjDate = adj.fecha || adj.createdAt;
            const qty = Number(adj.cantidad || 0);
            if (qty <= 0) return;

            const isEntrada = adj.tipoAjuste === "ENTRADA";
            movements.push({
                timestamp: adjDate ? new Date(String(adjDate).replace(" ", "T")).getTime() : 0,
                dateFormatted: formatDateTime(adjDate),
                type: isEntrada ? "ENTRADA" : "SALIDA",
                quantity: qty,
                cost: 0,
                salePrice: null,
                reference: adj.motivo ? `Ajuste ${adj.tipoAjuste} (${adj.motivo})` : `Ajuste ${adj.tipoAjuste} #${adj.idAjuste}`,
                lotNumber: adj.nroLote || "—",
            });
        });

        movements.sort((a, b) => a.timestamp - b.timestamp);

        let runningStock = 0;
        const withBalance = movements.map(m => {
            if (m.type === "ENTRADA") {
                runningStock += m.quantity;
            } else {
                runningStock -= m.quantity;
            }
            return {
                ...m,
                balanceAfter: runningStock,
            };
        });

        return withBalance.reverse();
    }, [selectedProductKardexModal, lots, purchases, dailySales, inventoryAdjustments]);

    // Lista activa
    const currentList = useMemo(() => {
        switch (subTab) {
            case "kardex_valorizado": return kardexValorizadoList;
            case "kardex_movimiento": return kardexMovimientoList;
            case "kardex_producto": return kardexPorProductoList;
            default: return kardexValorizadoList;
        }
    }, [subTab, kardexValorizadoList, kardexMovimientoList, kardexPorProductoList]);

    // Paginación
    const totalRecords = currentList.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return currentList.slice(start, start + rowsPerPage);
    }, [currentList, currentPage, rowsPerPage]);

    // Exportación CSV
    const handleExportExcel = () => {
        if (!currentList || currentList.length === 0) {
            alert("No hay registros para exportar en este filtro.");
            return;
        }

        let headers = [];
        let rows = [];

        if (subTab === "kardex_valorizado") {
            headers = ["FECHA", "PRODUCTO", "CODIGO BARRAS", "CATEGORIA", "TIPO MOVIMIENTO", "CANTIDAD", "COSTO UNITARIO", "COSTO TOTAL", "PRECIO VENTA", "TOTAL VENTA", "REFERENCIA", "LOTE"];
            rows = currentList.map(r => [
                r.dateFormatted,
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.barcode}"`,
                `"${(r.category || '').replace(/"/g, '""')}"`,
                r.movementType,
                r.quantity,
                r.unitCost.toFixed(2),
                r.totalCost.toFixed(2),
                r.unitSalePrice !== null ? r.unitSalePrice.toFixed(2) : "—",
                r.totalSalePrice !== null ? r.totalSalePrice.toFixed(2) : "—",
                `"${(r.reference || '').replace(/"/g, '""')}"`,
                `"${r.lotNumber}"`,
            ]);
        } else if (subTab === "kardex_movimiento") {
            headers = ["FECHA", "USUARIO", "NUMERO COMPROBANTE", "CLIENTE", "PRODUCTO", "CODIGO BARRAS", "CANTIDAD VENDIDO", "PRECIO COMPRA", "TOTAL COMPRA", "PRECIO VENTA", "TOTAL VENTA"];
            rows = currentList.map(r => [
                r.dateFormatted,
                `"${(r.userName || '').replace(/"/g, '""')}"`,
                r.receiptNumber,
                `"${(r.clientName || '').replace(/"/g, '""')}"`,
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.barcode}"`,
                r.quantitySold,
                r.precioCompra.toFixed(2),
                r.totalCompra.toFixed(2),
                r.precioVenta.toFixed(2),
                r.totalVenta.toFixed(2),
            ]);
        } else if (subTab === "kardex_producto") {
            headers = ["PRODUCTO", "CODIGO BARRAS", "CATEGORIA", "STOCK TOTAL"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.barcode}"`,
                `"${(r.category || '').replace(/"/g, '""')}"`,
                r.stockTotal,
            ]);
        }

        downloadCSV(`reporte_kardex_${subTab}`, headers, rows);
    };

    const handleClearFilters = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setDaysFilter("all");
        setMovementTypeFilter("TODOS");
        setCurrentPage(1);
    };

    return (
        <div className="kardex-report-wrapper w-100">
            {/* Header con botones PDF y Excel */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-1 px-3 py-1.5 fw-bold" style={{ backgroundColor: "#09090b", color: "#ffffff", fontSize: "0.72rem" }}>
                        KARDEX FÍSICO Y VALORIZADO
                    </span>
                    <span className="text-secondary small">
                        Historial cronológico, auditoría de existencias y trazabilidad
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
                        title="Exportar registros filtrados a archivo Excel (CSV)"
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

            {/* Sub-pestañas de Kardex */}
            <div className="sub-tabs-wrapper d-flex gap-2 mb-3 overflow-x-auto pb-1">
                {kardexSubTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`btn-sub-tab ${subTab === tab.id ? "active" : ""}`}
                        onClick={() => {
                            setSubTab(tab.id);
                            setCurrentPage(1);
                        }}
                    >
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white rounded-3 border p-3 shadow-sm mb-3">
                <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-5">
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
                                placeholder="Buscar en kardex por producto, código, referencia, comprobante..."
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

                    <div className="col-12 col-md-auto d-flex flex-wrap align-items-center gap-2 ms-auto">
                        {subTab === "kardex_valorizado" && (
                            <div className="d-flex align-items-center gap-1.5">
                                <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>MOVIMIENTO:</span>
                                <select
                                    value={movementTypeFilter}
                                    onChange={(e) => {
                                        setMovementTypeFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="form-select form-select-sm border bg-light shadow-none fw-semibold"
                                    style={{ fontSize: "0.76rem", minWidth: "105px" }}
                                >
                                    <option value="TODOS">TODOS</option>
                                    <option value="ENTRADA">ENTRADAS</option>
                                    <option value="SALIDA">SALIDAS</option>
                                </select>
                            </div>
                        )}

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
                                <option value="7">7 días</option>
                                <option value="15">15 días</option>
                                <option value="30">30 días</option>
                                <option value="month">Este mes</option>
                                <option value="custom">Personalizado</option>
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

            {/* Tablas de Datos */}
            <div className="bg-white rounded-3 border shadow-sm overflow-hidden mb-3">
                {loading ? (
                    <div className="p-5 text-center">
                        <div className="spinner-border text-dark" role="status" style={{ width: "2rem", height: "2rem" }}>
                            <span className="visually-hidden">Cargando kardex...</span>
                        </div>
                        <p className="text-secondary small mt-2 mb-0">Calculando movimientos de kardex...</p>
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
                            No se encontraron movimientos con los parámetros seleccionados
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        {subTab === "kardex_valorizado" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>FECHA</th>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO</th>
                                        <th>CATEGORIA</th>
                                        <th className="text-center">TIPO</th>
                                        <th className="text-center">CANTIDAD</th>
                                        <th className="text-end">COSTO UNIT.</th>
                                        <th className="text-end">COSTO TOTAL</th>
                                        <th className="text-end">TOTAL VENTA</th>
                                        <th>REFERENCIA</th>
                                        <th>LOTE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="small text-secondary">• {item.dateFormatted}</td>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.barcode}</td>
                                            <td className="small text-secondary">{item.category}</td>
                                            <td className="text-center">
                                                <span className={`badge-badge fw-bold ${item.movementType === "ENTRADA" ? "bg-dark text-white" : "bg-light text-dark border"}`}>
                                                    {item.movementType}
                                                </span>
                                            </td>
                                            <td className="text-center fw-bold text-dark">
                                                {item.movementType === "ENTRADA" ? `+${item.quantity}` : `-${item.quantity}`}
                                            </td>
                                            <td className="text-end text-dark">S/ {item.unitCost.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-dark">S/ {item.totalCost.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-emerald">
                                                {item.totalSalePrice !== null ? `S/ ${item.totalSalePrice.toFixed(2)}` : "—"}
                                            </td>
                                            <td className="small fw-semibold text-secondary">{item.reference}</td>
                                            <td><span className="badge bg-light text-secondary border" style={{ fontSize: "0.7rem" }}>{item.lotNumber}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "kardex_movimiento" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>FECHA</th>
                                        <th>USUARIO</th>
                                        <th>N° COMPROBANTE</th>
                                        <th>CLIENTE</th>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO</th>
                                        <th className="text-center">CANT. VENDIDA</th>
                                        <th className="text-end">PRECIO COMPRA</th>
                                        <th className="text-end">TOTAL COMPRA</th>
                                        <th className="text-end">PRECIO VENTA</th>
                                        <th className="text-end">TOTAL VENTA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="small text-secondary">• {item.dateFormatted}</td>
                                            <td className="fw-semibold small text-dark">{item.userName}</td>
                                            <td className="fw-bold small text-secondary">{item.receiptNumber}</td>
                                            <td className="small text-dark">{item.clientName}</td>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.barcode}</td>
                                            <td className="text-center fw-bold">{item.quantitySold} uds</td>
                                            <td className="text-end text-muted small">S/ {item.precioCompra.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-dark">S/ {item.totalCompra.toFixed(2)}</td>
                                            <td className="text-end text-dark">S/ {item.precioVenta.toFixed(2)}</td>
                                            <td className="text-end fw-black text-emerald">S/ {item.totalVenta.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "kardex_producto" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>CATEGORIA</th>
                                        <th className="text-center">STOCK TOTAL ACTUAL</th>
                                        <th className="text-center">HISTORIAL KARDEX</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((prod, idx) => (
                                        <tr key={prod.id || idx}>
                                            <td className="fw-bold text-dark">{prod.productName}</td>
                                            <td className="small text-secondary">{prod.barcode}</td>
                                            <td className="small text-secondary">{prod.category}</td>
                                            <td className="text-center">
                                                <span className={`badge-badge fw-bold ${prod.stockTotal > 10 ? "bg-emerald-light text-emerald" : prod.stockTotal > 0 ? "bg-amber-light text-amber" : "bg-rose-light text-rose"}`}>
                                                    {prod.stockTotal} unidades
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-teal px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1.5"
                                                    style={{ fontSize: "0.75rem", borderRadius: "8px" }}
                                                    onClick={() => setSelectedProductKardexModal(prod)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                                    </svg>
                                                    <span>Ver Movimientos</span>
                                                </button>
                                            </td>
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

            {/* Modal de Movimientos Históricos de Kardex por Producto */}
            {selectedProductKardexModal && (
                <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 1060 }}
                    onClick={() => setSelectedProductKardexModal(null)}
                >
                    <div
                        className="modal-dialog modal-lg modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
                            <div className="modal-header border-bottom py-3 px-4 bg-light" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                                <div>
                                    <div className="text-uppercase text-muted small fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                                        HISTORIAL COMPLETO DE KARDEX
                                    </div>
                                    <h5 className="fw-bold text-dark m-0">
                                        {selectedProductKardexModal.productName}
                                    </h5>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedProductKardexModal(null)}
                                />
                            </div>

                            <div className="modal-body p-4">
                                <div className="row g-2 mb-3 p-3 bg-light rounded-3">
                                    <div className="col-6 col-md-3">
                                        <span className="text-muted small d-block" style={{ fontSize: "0.72rem" }}>CÓDIGO BARRAS:</span>
                                        <strong className="text-dark small">{selectedProductKardexModal.barcode}</strong>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <span className="text-muted small d-block" style={{ fontSize: "0.72rem" }}>CATEGORÍA:</span>
                                        <strong className="text-dark small">{selectedProductKardexModal.category}</strong>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <span className="text-muted small d-block" style={{ fontSize: "0.72rem" }}>STOCK ACTUAL:</span>
                                        <span className="badge bg-emerald-light text-emerald fw-bold px-2 py-1">
                                            {selectedProductKardexModal.stockTotal} unidades
                                        </span>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <span className="text-muted small d-block" style={{ fontSize: "0.72rem" }}>MOVIMIENTOS:</span>
                                        <strong className="text-dark small">{productKardexMovements.length} registros</strong>
                                    </div>
                                </div>

                                <div className="table-responsive mb-3 border rounded-2" style={{ maxHeight: "350px", overflowY: "auto" }}>
                                    {productKardexMovements.length === 0 ? (
                                        <div className="p-4 text-center text-muted small">
                                            No se encontraron movimientos registrados para este producto.
                                        </div>
                                    ) : (
                                        <table className="table table-sm table-hover mb-0 custom-report-table align-middle">
                                            <thead className="table-light small">
                                                <tr>
                                                    <th>FECHA</th>
                                                    <th>TIPO</th>
                                                    <th>REFERENCIA</th>
                                                    <th>LOTE</th>
                                                    <th className="text-center">CANTIDAD</th>
                                                    <th>COSTO / PRECIO</th>
                                                    <th className="text-center">SALDO STOCK</th>
                                                </tr>
                                            </thead>
                                            <tbody className="small">
                                                {productKardexMovements.map((m, i) => (
                                                    <tr key={i}>
                                                        <td className="small text-secondary" style={{ whiteSpace: "nowrap" }}>• {m.dateFormatted}</td>
                                                        <td>
                                                            <span className={`badge-badge fw-bold ${m.type === "ENTRADA" ? "bg-teal-subtle text-teal" : "bg-rose-light text-rose"}`}>
                                                                {m.type}
                                                            </span>
                                                        </td>
                                                        <td className="fw-semibold small text-secondary">{m.reference}</td>
                                                        <td className="small text-secondary">{m.lotNumber}</td>
                                                        <td className="text-center fw-bold">
                                                            <span className={m.type === "ENTRADA" ? "text-emerald" : "text-rose"}>
                                                                {m.type === "ENTRADA" ? `+${m.quantity}` : `-${m.quantity}`}
                                                            </span>
                                                        </td>
                                                        <td className="small fw-semibold text-secondary">
                                                            {m.type === "ENTRADA"
                                                                ? (m.cost > 0 ? `S/ ${m.cost.toFixed(2)}` : "—")
                                                                : (m.salePrice > 0 ? `S/ ${m.salePrice.toFixed(2)}` : "—")}
                                                        </td>
                                                        <td className="text-center fw-bold text-dark">
                                                            {m.balanceAfter}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer border-top py-2 px-4 bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary px-4 fw-semibold"
                                    onClick={() => setSelectedProductKardexModal(null)}
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
