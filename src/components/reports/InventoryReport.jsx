import React, { useState, useMemo } from "react";
import { formatDateTime, downloadCSV } from "./reportUtils.js";

export const InventoryReport = ({
    lots = [],
    productsList = [],
    dailySales = [],
    inventoryAdjustments = [],
    categoriesList = [],
    purchases = [],
    loading = false,
}) => {
    const inventorySubTabs = [
        { id: "inv_general", label: "Inventario" },
        { id: "inv_stock_actual", label: "Stock Actual" },
        { id: "inv_low_stock", label: "Alertas Stock Bajo" },
        { id: "inv_expirations", label: "Caducados y por caducar" },
        { id: "inv_top_investment", label: "Mayor Inversión" },
        { id: "inv_categorization", label: "Categorización" },
        { id: "inv_lots_detailed", label: "Lotes Detallado" },
        { id: "inv_valuation", label: "Valorización" },
        { id: "inv_products_lots", label: "Productos y Lotes" },
        { id: "inv_adjustments", label: "Ajustes de Inventario" },
        { id: "inv_no_rotation", label: "Sin Rotación" },
    ];

    const [subTab, setSubTab] = useState("inv_general");
    const [search, setSearch] = useState("");
    const [inventoryStockFilter, setInventoryStockFilter] = useState("TODOS");
    const [inventoryExpirationFilter, setInventoryExpirationFilter] = useState("TODOS");
    const [inventoryAdjustmentTypeFilter, setInventoryAdjustmentTypeFilter] = useState("TODOS");
    const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("TODOS");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Mapa de costos unitarios por producto
    const productsCostMap = useMemo(() => {
        const map = new Map();
        lots.forEach(l => {
            const cost = Number(l.costoUnitario || 0);
            if (cost > 0) {
                if (l.idProducto) map.set(Number(l.idProducto), cost);
                if (l.codigoBarras) map.set(l.codigoBarras.trim(), cost);
                if (l.nombreProducto) map.set(l.nombreProducto.toLowerCase().trim(), cost);
            }
        });
        purchases.forEach(p => {
            if (p.details && Array.isArray(p.details)) {
                p.details.forEach(d => {
                    const cost = Number(d.precioCosto || 0);
                    if (cost > 0) {
                        if (d.productId) map.set(Number(d.productId), cost);
                        const n = (d.productNombre || d.productName)?.toLowerCase()?.trim();
                        if (n) map.set(n, cost);
                    }
                });
            }
        });
        return map;
    }, [lots, purchases]);

    const getProductCost = (p) => {
        const id = p.idProducto || p.id;
        if (id && productsCostMap.has(Number(id))) return productsCostMap.get(Number(id));
        if (p.codigoBarras && productsCostMap.has(p.codigoBarras.trim())) return productsCostMap.get(p.codigoBarras.trim());
        if (p.nombre && productsCostMap.has(p.nombre.toLowerCase().trim())) return productsCostMap.get(p.nombre.toLowerCase().trim());
        const pv = Number(p.precioVenta || 0);
        return pv > 0 ? Number((pv * 0.70).toFixed(2)) : 0;
    };

    // 1. INVENTARIO (Catálogo Maestro General)
    const invGeneralList = useMemo(() => {
        let list = productsList.map(p => {
            const rawName = p.nombre || "Producto";
            const lab = p.laboratorioNombre || p.laboratorio?.nombre;
            const displayName = (lab && !rawName.toUpperCase().includes(lab.toUpperCase())) ? `${rawName} / ${lab}` : rawName;
            const catName = p.categoria?.name || p.categoriaNombre || "Sin categoría";

            return {
                id: p.idProducto || p.id,
                productName: displayName.toUpperCase(),
                rawName,
                principioActivo: p.principioActivo || "—",
                concentracion: p.concentracion || "—",
                formaFarmaceutica: p.formaFarmaceutica || "—",
                patologia: p.patologia || "—",
                requiereReceta: p.requiereReceta ? "SI" : "NO",
                codigoBarras: p.codigoBarras || "—",
                registroSanitario: p.registroSanitario || "—",
                codDigemid: p.codDigemid || "—",
                categoria: catName,
                stock: Number(p.stockReal !== undefined ? p.stockReal : (p.stockTotal || 0)),
                precioVenta: Number(p.precioVenta || 0),
                laboratorio: lab || "—",
            };
        });

        if (inventoryCategoryFilter !== "TODOS") {
            list = list.filter(item => item.categoria.toLowerCase() === inventoryCategoryFilter.toLowerCase());
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(item =>
                item.productName.toLowerCase().includes(q) ||
                item.principioActivo.toLowerCase().includes(q) ||
                item.concentracion.toLowerCase().includes(q) ||
                item.formaFarmaceutica.toLowerCase().includes(q) ||
                item.codigoBarras.toLowerCase().includes(q) ||
                item.registroSanitario.toLowerCase().includes(q) ||
                item.categoria.toLowerCase().includes(q) ||
                item.laboratorio.toLowerCase().includes(q) ||
                item.patologia.toLowerCase().includes(q) ||
                item.codDigemid.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => a.productName.localeCompare(b.productName));
    }, [productsList, inventoryCategoryFilter, search]);

    // 2. STOCK ACTUAL
    const invStockActualList = useMemo(() => {
        let list = productsList.map(p => {
            const rawName = p.nombre || "Producto";
            const lab = p.laboratorioNombre || p.laboratorio?.nombre;
            const displayName = (lab && !rawName.toUpperCase().includes(lab.toUpperCase())) ? `${rawName} / ${lab}` : rawName;
            const catName = p.categoria?.name || p.categoriaNombre || "Sin categoría";
            const stock = Number(p.stockReal !== undefined ? p.stockReal : (p.stockTotal || 0));
            const precioVenta = Number(p.precioVenta || 0);
            const totalValorVenta = stock * precioVenta;
            const ubicacion = p.ubicacionNombre || p.ubicacion?.nombre || "Almacén Principal";

            let status = "DISPONIBLE";
            if (stock <= 0) status = "AGOTADO";
            else if (stock <= 10) status = "POR AGOTARSE";

            return {
                id: p.idProducto || p.id,
                productName: displayName,
                codigoBarras: p.codigoBarras || "—",
                categoria: catName,
                ubicacion,
                stock,
                status,
                precioVenta,
                totalValorVenta,
            };
        });

        if (inventoryStockFilter !== "TODOS") {
            if (inventoryStockFilter === "DISPONIBLE") list = list.filter(p => p.stock > 10);
            else if (inventoryStockFilter === "BAJO") list = list.filter(p => p.stock > 0 && p.stock <= 10);
            else if (inventoryStockFilter === "AGOTADO") list = list.filter(p => p.stock <= 0);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                p.codigoBarras.toLowerCase().includes(q) ||
                p.categoria.toLowerCase().includes(q) ||
                p.ubicacion.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => b.stock - a.stock);
    }, [productsList, inventoryStockFilter, search]);

    // 3. ALERTA STOCK BAJO
    const invLowStockList = useMemo(() => {
        let list = [];
        productsList.forEach(p => {
            const stock = Number(p.stockReal !== undefined ? p.stockReal : (p.stockTotal || 0));
            const minSuggested = 10;
            if (stock <= minSuggested) {
                const rawName = p.nombre || "Producto";
                const lab = p.laboratorioNombre || p.laboratorio?.nombre;
                const displayName = (lab && !rawName.toUpperCase().includes(lab.toUpperCase())) ? `${rawName} / ${lab}` : rawName;
                const catName = p.categoria?.name || p.categoriaNombre || "Sin categoría";
                const proveedor = p.proveedorNombre || p.proveedor?.nombre || "Distribuidora Principal";

                let alertLevel = "BAJO";
                let alertColor = "amber";
                if (stock <= 0) {
                    alertLevel = "AGOTADO";
                    alertColor = "dark";
                } else if (stock <= 3) {
                    alertLevel = "CRÍTICO";
                    alertColor = "rose";
                }

                list.push({
                    id: p.idProducto || p.id,
                    productName: displayName,
                    codigoBarras: p.codigoBarras || "—",
                    categoria: catName,
                    stock,
                    minSuggested,
                    deficit: Math.max(0, minSuggested - stock),
                    alertLevel,
                    alertColor,
                    proveedor,
                    precioVenta: Number(p.precioVenta || 0),
                });
            }
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                p.codigoBarras.toLowerCase().includes(q) ||
                p.categoria.toLowerCase().includes(q) ||
                p.proveedor.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => a.stock - b.stock);
    }, [productsList, search]);

    // 4. CADUCADOS Y POR CADUCAR
    const invExpirationsList = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let list = [];
        lots.forEach(lot => {
            if (lot.isActive === false) return;
            const dateStr = lot.fechaVencimiento;
            if (!dateStr) return;

            const cleanStr = String(dateStr).replace(" ", "T");
            const expDate = new Date(cleanStr);
            if (isNaN(expDate.getTime())) return;

            const diffTime = expDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const qty = Number(lot.cantidadActual !== undefined ? lot.cantidadActual : 0);
            const unitCost = Number(lot.costoUnitario || 0);
            const valorEnRiesgo = qty * unitCost;

            let status = "VIGENTE";
            let statusColor = "emerald";
            if (daysLeft < 0) {
                status = "VENCIDO";
                statusColor = "dark";
            } else if (daysLeft <= 30) {
                status = "CRÍTICO";
                statusColor = "rose";
            } else if (daysLeft <= 90) {
                status = "POR VENCER";
                statusColor = "amber";
            }

            list.push({
                id: lot.idLote,
                nroLote: lot.nroLote || "S/N",
                productName: lot.nombreProducto || "Producto",
                codigoBarras: lot.codigoBarras || "—",
                fechaVencimiento: formatDateTime(dateStr),
                daysLeft,
                cantidadActual: qty,
                costoUnitario: unitCost,
                valorEnRiesgo,
                status,
                statusColor,
            });
        });

        if (inventoryExpirationFilter !== "TODOS") {
            if (inventoryExpirationFilter === "VENCIDOS") list = list.filter(l => l.daysLeft < 0);
            else if (inventoryExpirationFilter === "CRITICOS") list = list.filter(l => l.daysLeft >= 0 && l.daysLeft <= 30);
            else if (inventoryExpirationFilter === "PROXIMOS") list = list.filter(l => l.daysLeft > 30 && l.daysLeft <= 90);
            else if (inventoryExpirationFilter === "VIGENTES") list = list.filter(l => l.daysLeft > 90);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(l =>
                l.nroLote.toLowerCase().includes(q) ||
                l.productName.toLowerCase().includes(q) ||
                l.codigoBarras.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => a.daysLeft - b.daysLeft);
    }, [lots, inventoryExpirationFilter, search]);

    // 5. MAYOR INVERSIÓN
    const invTopInvestmentList = useMemo(() => {
        let totalOverallInvested = 0;
        const mapped = productsList.map(p => {
            const rawName = p.nombre || "Producto";
            const lab = p.laboratorioNombre || p.laboratorio?.nombre;
            const displayName = (lab && !rawName.toUpperCase().includes(lab.toUpperCase())) ? `${rawName} / ${lab}` : rawName;
            const catName = p.categoria?.name || p.categoriaNombre || "Sin categoría";
            const stock = Number(p.stockReal !== undefined ? p.stockReal : (p.stockTotal || 0));
            const cost = getProductCost(p);
            const capitalInvertido = stock * cost;
            const precioVenta = Number(p.precioVenta || 0);
            const valorVenta = stock * precioVenta;
            const gananciaEstimada = valorVenta - capitalInvertido;
            const roi = capitalInvertido > 0 ? ((gananciaEstimada / capitalInvertido) * 100) : 0;

            if (stock > 0 && capitalInvertido > 0) {
                totalOverallInvested += capitalInvertido;
            }

            return {
                id: p.idProducto || p.id,
                productName: displayName,
                codigoBarras: p.codigoBarras || "—",
                categoria: catName,
                stock,
                costoUnitario: cost,
                capitalInvertido,
                precioVenta,
                valorVenta,
                gananciaEstimada,
                roi,
            };
        });

        let list = mapped.filter(item => item.capitalInvertido > 0);

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(item =>
                item.productName.toLowerCase().includes(q) ||
                item.categoria.toLowerCase().includes(q) ||
                item.codigoBarras.toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => b.capitalInvertido - a.capitalInvertido);

        return list.map((item, idx) => ({
            ...item,
            rank: idx + 1,
            percentOfTotal: totalOverallInvested > 0 ? ((item.capitalInvertido / totalOverallInvested) * 100) : 0,
        }));
    }, [productsList, productsCostMap, search]);

    // 6. CATEGORIZACIÓN
    const invCategorizationList = useMemo(() => {
        const map = new Map();
        let globalStock = 0;
        let globalCost = 0;

        productsList.forEach(p => {
            const catName = p.categoria?.name || p.categoriaNombre || "Sin Categoría";
            const stock = Number(p.stockReal !== undefined ? p.stockReal : (p.stockTotal || 0));
            const cost = getProductCost(p);
            const pv = Number(p.precioVenta || 0);
            const totalCost = stock * cost;
            const totalSale = stock * pv;

            globalStock += stock;
            globalCost += totalCost;

            if (!map.has(catName)) {
                map.set(catName, {
                    categoryName: catName,
                    productCount: 0,
                    totalStock: 0,
                    totalCost: 0,
                    totalSale: 0,
                });
            }
            const curr = map.get(catName);
            curr.productCount += 1;
            curr.totalStock += stock;
            curr.totalCost += totalCost;
            curr.totalSale += totalSale;
        });

        let list = Array.from(map.values()).map(c => {
            const profit = c.totalSale - c.totalCost;
            const margin = c.totalSale > 0 ? Math.round((profit / c.totalSale) * 100) : 0;
            const share = globalStock > 0 ? ((c.totalStock / globalStock) * 100) : 0;
            return {
                id: c.categoryName,
                categoryName: c.categoryName,
                productCount: c.productCount,
                totalStock: c.totalStock,
                totalCost: c.totalCost,
                totalSale: c.totalSale,
                expectedProfit: profit,
                marginPercent: margin,
                sharePercent: share,
            };
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(c => c.categoryName.toLowerCase().includes(q));
        }

        return list.sort((a, b) => b.totalStock - a.totalStock);
    }, [productsList, productsCostMap, search]);

    // 7. LOTES DETALLADO
    const invLotsDetailedList = useMemo(() => {
        let list = lots.map(l => {
            const cleanExp = l.fechaVencimiento ? String(l.fechaVencimiento).replace(" ", "T") : null;
            const expDate = cleanExp ? new Date(cleanExp) : null;
            const now = new Date();
            const isExp = expDate && !isNaN(expDate.getTime()) && expDate < now;
            const currentQty = Number(l.cantidadActual || 0);
            const initQty = Number(l.cantidadInicial !== undefined ? l.cantidadInicial : currentQty);
            const unitCost = Number(l.costoUnitario || 0);
            const valorizado = currentQty * unitCost;

            let estado = "ACTIVO";
            let estadoColor = "emerald";
            if (isExp) {
                estado = "VENCIDO";
                estadoColor = "rose";
            } else if (currentQty <= 0) {
                estado = "AGOTADO";
                estadoColor = "secondary";
            }

            return {
                id: l.idLote,
                nroLote: l.nroLote || "S/N",
                productName: l.nombreProducto || "Producto",
                codigoBarras: l.codigoBarras || "—",
                fechaRegistro: formatDateTime(l.createdAt),
                fechaVencimiento: formatDateTime(l.fechaVencimiento),
                cantidadInicial: initQty,
                cantidadActual: currentQty,
                costoUnitario: unitCost,
                valorizado,
                estado,
                estadoColor,
            };
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(l =>
                l.nroLote.toLowerCase().includes(q) ||
                l.productName.toLowerCase().includes(q) ||
                l.codigoBarras.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => b.cantidadActual - a.cantidadActual);
    }, [lots, search]);

    // 8. VALORIZACIÓN
    const invValuationList = useMemo(() => {
        let list = productsList.map(p => {
            const rawName = p.nombre || "Producto";
            const lab = p.laboratorioNombre || p.laboratorio?.nombre;
            const displayName = (lab && !rawName.toUpperCase().includes(lab.toUpperCase())) ? `${rawName} / ${lab}` : rawName;
            const catName = p.categoria?.name || p.categoriaNombre || "Sin categoría";
            const stock = Number(p.stockReal !== undefined ? p.stockReal : (p.stockTotal || 0));
            const cost = getProductCost(p);
            const salePrice = Number(p.precioVenta || 0);
            const totalCosto = stock * cost;
            const totalVenta = stock * salePrice;
            const utilidadEsperada = totalVenta - totalCosto;
            const marginPercent = totalVenta > 0 ? Math.round((utilidadEsperada / totalVenta) * 100) : 0;

            return {
                id: p.idProducto || p.id,
                productName: displayName,
                codigoBarras: p.codigoBarras || "—",
                categoria: catName,
                stock,
                costoUnitario: cost,
                totalCosto,
                precioVenta: salePrice,
                totalVenta,
                utilidadEsperada,
                marginPercent,
            };
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                p.codigoBarras.toLowerCase().includes(q) ||
                p.categoria.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => b.totalCosto - a.totalCosto);
    }, [productsList, productsCostMap, search]);

    const invValuationTotals = useMemo(() => {
        return invValuationList.reduce((acc, curr) => {
            acc.totalCosto += curr.totalCosto;
            acc.totalVenta += curr.totalVenta;
            acc.totalUtilidad += curr.utilidadEsperada;
            return acc;
        }, { totalCosto: 0, totalVenta: 0, totalUtilidad: 0 });
    }, [invValuationList]);

    // 9. PRODUCTOS Y LOTES
    const invProductsLotsList = useMemo(() => {
        const productLotsMap = new Map();
        lots.forEach(lot => {
            if (lot.isActive === false) return;
            const key = Number(lot.idProducto) || lot.codigoBarras?.trim() || lot.nombreProducto?.toLowerCase()?.trim();
            if (!key) return;
            if (!productLotsMap.has(key)) {
                productLotsMap.set(key, []);
            }
            productLotsMap.get(key).push(lot);
        });

        let list = productsList.map(p => {
            const rawName = p.nombre || "Producto";
            const lab = p.laboratorioNombre || p.laboratorio?.nombre;
            const displayName = (lab && !rawName.toUpperCase().includes(lab.toUpperCase())) ? `${rawName} / ${lab}` : rawName;
            const catName = p.categoria?.name || p.categoriaNombre || "Sin categoría";
            const stock = Number(p.stockReal !== undefined ? p.stockReal : (p.stockTotal || 0));

            const id = Number(p.idProducto || p.id);
            const barcode = p.codigoBarras?.trim();
            const nameKey = p.nombre?.toLowerCase()?.trim();

            const pLots = (id && productLotsMap.get(id)) ||
                (barcode && productLotsMap.get(barcode)) ||
                (nameKey && productLotsMap.get(nameKey)) || [];

            let totalLotValued = 0;
            pLots.forEach(l => {
                totalLotValued += Number(l.cantidadActual || 0) * Number(l.costoUnitario || 0);
            });

            return {
                id: p.idProducto || p.id,
                productName: displayName,
                codigoBarras: p.codigoBarras || "—",
                categoria: catName,
                lotesCount: pLots.length,
                stockTotal: stock,
                associatedLots: pLots,
                totalValued: totalLotValued > 0 ? totalLotValued : (stock * getProductCost(p)),
            };
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                p.codigoBarras.toLowerCase().includes(q) ||
                p.categoria.toLowerCase().includes(q) ||
                p.associatedLots.some(l => (l.nroLote || "").toLowerCase().includes(q))
            );
        }

        return list.sort((a, b) => b.lotesCount - a.lotesCount);
    }, [productsList, lots, productsCostMap, search]);

    // 10. AJUSTES DE INVENTARIO
    const invAdjustmentsList = useMemo(() => {
        let list = inventoryAdjustments.map(adj => {
            const dateStr = adj.fecha || adj.createdAt;
            return {
                id: adj.idAjuste,
                rawDate: dateStr,
                dateFormatted: formatDateTime(dateStr),
                tipoAjuste: adj.tipoAjuste || "ENTRADA",
                productoNombre: adj.productoNombre || "Producto",
                productoCodigo: adj.productoCodigo || "—",
                nroLote: adj.nroLote || "—",
                cantidad: Number(adj.cantidad || 0),
                motivo: adj.motivo || "Ajuste de inventario",
                empleadoNombre: adj.empleadoNombre || "Administrador",
            };
        });

        if (inventoryAdjustmentTypeFilter !== "TODOS") {
            list = list.filter(a => a.tipoAjuste === inventoryAdjustmentTypeFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(a =>
                a.productoNombre.toLowerCase().includes(q) ||
                a.productoCodigo.toLowerCase().includes(q) ||
                a.nroLote.toLowerCase().includes(q) ||
                a.motivo.toLowerCase().includes(q) ||
                a.empleadoNombre.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => {
            const timeA = a.rawDate ? new Date(String(a.rawDate).replace(" ", "T")).getTime() : 0;
            const timeB = b.rawDate ? new Date(String(b.rawDate).replace(" ", "T")).getTime() : 0;
            return timeB - timeA;
        });
    }, [inventoryAdjustments, inventoryAdjustmentTypeFilter, search]);

    // 11. SIN ROTACIÓN
    const invNoRotationList = useMemo(() => {
        const salesCountMap = new Map();
        dailySales.forEach(s => {
            if (s.details && Array.isArray(s.details)) {
                s.details.forEach(d => {
                    const name = (d.productName || d.nombreProducto)?.toLowerCase()?.trim();
                    const qty = Number(d.presentationQuantity || d.cantidad || 1);
                    if (name) {
                        salesCountMap.set(name, (salesCountMap.get(name) || 0) + qty);
                    }
                });
            }
        });

        let list = [];
        productsList.forEach(p => {
            const stock = Number(p.stockReal !== undefined ? p.stockReal : (p.stockTotal || 0));
            if (stock <= 0) return;

            const nameKey = p.nombre?.toLowerCase()?.trim();
            const soldCount = salesCountMap.get(nameKey) || 0;

            if (soldCount === 0) {
                const rawName = p.nombre || "Producto";
                const lab = p.laboratorioNombre || p.laboratorio?.nombre;
                const displayName = (lab && !rawName.toUpperCase().includes(lab.toUpperCase())) ? `${rawName} / ${lab}` : rawName;
                const catName = p.categoria?.name || p.categoriaNombre || "Sin categoría";
                const cost = getProductCost(p);
                const capitalEstancado = stock * cost;
                const precioVenta = Number(p.precioVenta || 0);

                list.push({
                    id: p.idProducto || p.id,
                    productName: displayName,
                    codigoBarras: p.codigoBarras || "—",
                    categoria: catName,
                    stockInmovilizado: stock,
                    costoUnitario: cost,
                    capitalEstancado,
                    precioVenta,
                    diasSinRotacion: "60+ días",
                });
            }
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.productName.toLowerCase().includes(q) ||
                p.codigoBarras.toLowerCase().includes(q) ||
                p.categoria.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => b.capitalEstancado - a.capitalEstancado);
    }, [productsList, dailySales, productsCostMap, search]);

    // Resumen KPI global
    const invTotalCapitalInvested = useMemo(() => {
        return invTopInvestmentList.reduce((sum, item) => sum + item.capitalInvertido, 0);
    }, [invTopInvestmentList]);

    const invTotalRiskValue = useMemo(() => {
        return invExpirationsList.reduce((sum, item) => sum + item.valorEnRiesgo, 0);
    }, [invExpirationsList]);

    const invTotalStagnantValue = useMemo(() => {
        return invNoRotationList.reduce((sum, item) => sum + item.capitalEstancado, 0);
    }, [invNoRotationList]);

    // Lista activa
    const currentList = useMemo(() => {
        switch (subTab) {
            case "inv_general": return invGeneralList;
            case "inv_stock_actual": return invStockActualList;
            case "inv_low_stock": return invLowStockList;
            case "inv_expirations": return invExpirationsList;
            case "inv_top_investment": return invTopInvestmentList;
            case "inv_categorization": return invCategorizationList;
            case "inv_lots_detailed": return invLotsDetailedList;
            case "inv_valuation": return invValuationList;
            case "inv_products_lots": return invProductsLotsList;
            case "inv_adjustments": return invAdjustmentsList;
            case "inv_no_rotation": return invNoRotationList;
            default: return invGeneralList;
        }
    }, [subTab, invGeneralList, invStockActualList, invLowStockList, invExpirationsList, invTopInvestmentList, invCategorizationList, invLotsDetailedList, invValuationList, invProductsLotsList, invAdjustmentsList, invNoRotationList]);

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

        if (subTab === "inv_general") {
            headers = ["NOMBRE PRODUCTO", "PRINCIPIO ACTIVO", "CONCENTRACION", "FORMA FARMACEUTICA", "PATOLOGIA", "REQUIERE RECETA", "CODIGO BARRAS", "REGISTRO SANITARIO", "CODIGO DIGEMID", "CATEGORIA"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${(r.principioActivo || '').replace(/"/g, '""')}"`,
                `"${(r.concentracion || '').replace(/"/g, '""')}"`,
                `"${(r.formaFarmaceutica || '').replace(/"/g, '""')}"`,
                `"${(r.patologia || '').replace(/"/g, '""')}"`,
                r.requiereReceta,
                `"${r.codigoBarras}"`,
                `"${r.registroSanitario}"`,
                `"${r.codDigemid}"`,
                `"${(r.categoria || '').replace(/"/g, '""')}"`
            ]);
        } else if (subTab === "inv_stock_actual") {
            headers = ["PRODUCTO", "CODIGO BARRAS", "CATEGORIA", "UBICACION", "STOCK ACTUAL", "ESTADO", "PRECIO VENTA", "VALOR TOTAL VENTA"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.codigoBarras}"`,
                `"${(r.categoria || '').replace(/"/g, '""')}"`,
                `"${(r.ubicacion || '').replace(/"/g, '""')}"`,
                r.stock,
                r.status,
                r.precioVenta.toFixed(2),
                r.totalValorVenta.toFixed(2)
            ]);
        } else if (subTab === "inv_low_stock") {
            headers = ["PRODUCTO", "CODIGO BARRAS", "CATEGORIA", "STOCK ACTUAL", "STOCK MINIMO SUGERIDO", "DEFICIT", "NIVEL ALERTA", "PROVEEDOR HABITUAL"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.codigoBarras}"`,
                `"${(r.categoria || '').replace(/"/g, '""')}"`,
                r.stock,
                r.minSuggested,
                r.deficit,
                r.alertLevel,
                `"${(r.proveedor || '').replace(/"/g, '""')}"`
            ]);
        } else if (subTab === "inv_expirations") {
            headers = ["LOTE", "PRODUCTO", "CODIGO BARRAS", "FECHA VENCIMIENTO", "DIAS RESTANTES", "CANTIDAD ACTUAL", "COSTO UNITARIO", "VALOR EN RIESGO", "ESTADO"];
            rows = currentList.map(r => [
                `"${r.nroLote}"`,
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.codigoBarras}"`,
                r.fechaVencimiento,
                r.daysLeft,
                r.cantidadActual,
                r.costoUnitario.toFixed(2),
                r.valorEnRiesgo.toFixed(2),
                r.status
            ]);
        } else if (subTab === "inv_top_investment") {
            headers = ["RANKING", "PRODUCTO", "CATEGORIA", "STOCK", "COSTO UNITARIO", "CAPITAL INVERTIDO", "PORCENTAJE TOTAL", "PRECIO VENTA", "VALOR VENTA ESTIMADO", "GANANCIA ESTIMADA", "ROI %"];
            rows = currentList.map(r => [
                r.rank,
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${(r.categoria || '').replace(/"/g, '""')}"`,
                r.stock,
                r.costoUnitario.toFixed(2),
                r.capitalInvertido.toFixed(2),
                `${r.percentOfTotal.toFixed(1)}%`,
                r.precioVenta.toFixed(2),
                r.valorVenta.toFixed(2),
                r.gananciaEstimada.toFixed(2),
                `${r.roi.toFixed(1)}%`
            ]);
        } else if (subTab === "inv_categorization") {
            headers = ["CATEGORIA", "PRODUCTOS", "STOCK TOTAL", "COSTO TOTAL INVERSION", "VALOR VENTA ESTIMADO", "UTILIDAD ESPERADA", "MARGEN %", "PARTICIPACION STOCK %"];
            rows = currentList.map(r => [
                `"${(r.categoryName || '').replace(/"/g, '""')}"`,
                r.productCount,
                r.totalStock,
                r.totalCost.toFixed(2),
                r.totalSale.toFixed(2),
                r.expectedProfit.toFixed(2),
                `${r.marginPercent}%`,
                `${r.sharePercent.toFixed(1)}%`
            ]);
        } else if (subTab === "inv_lots_detailed") {
            headers = ["LOTE", "PRODUCTO", "CODIGO BARRAS", "REGISTRO", "VENCIMIENTO", "CANTIDAD INICIAL", "CANTIDAD ACTUAL", "COSTO UNITARIO", "VALORIZADO", "ESTADO"];
            rows = currentList.map(r => [
                `"${r.nroLote}"`,
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.codigoBarras}"`,
                r.fechaRegistro,
                r.fechaVencimiento,
                r.cantidadInicial,
                r.cantidadActual,
                r.costoUnitario.toFixed(2),
                r.valorizado.toFixed(2),
                r.estado
            ]);
        } else if (subTab === "inv_valuation") {
            headers = ["PRODUCTO", "CODIGO BARRAS", "CATEGORIA", "STOCK ACTUAL", "COSTO UNITARIO", "TOTAL COSTO", "PRECIO VENTA", "TOTAL VALOR VENTA", "UTILIDAD ESTIMADA", "MARGEN %"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.codigoBarras}"`,
                `"${(r.categoria || '').replace(/"/g, '""')}"`,
                r.stock,
                r.costoUnitario.toFixed(2),
                r.totalCosto.toFixed(2),
                r.precioVenta.toFixed(2),
                r.totalVenta.toFixed(2),
                r.utilidadEsperada.toFixed(2),
                `${r.marginPercent}%`
            ]);
        } else if (subTab === "inv_products_lots") {
            headers = ["PRODUCTO", "CODIGO BARRAS", "CATEGORIA", "TOTAL LOTES ASOCIADOS", "STOCK TOTAL", "VALORIZACION ESTIMADA"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.codigoBarras}"`,
                `"${(r.categoria || '').replace(/"/g, '""')}"`,
                r.lotesCount,
                r.stockTotal,
                r.totalValued.toFixed(2)
            ]);
        } else if (subTab === "inv_adjustments") {
            headers = ["FECHA HORA", "TIPO AJUSTE", "PRODUCTO", "CODIGO", "LOTE", "CANTIDAD", "MOTIVO", "RESPONSABLE"];
            rows = currentList.map(r => [
                r.dateFormatted,
                r.tipoAjuste,
                `"${(r.productoNombre || '').replace(/"/g, '""')}"`,
                `"${r.productoCodigo}"`,
                `"${r.nroLote}"`,
                r.cantidad,
                `"${(r.motivo || '').replace(/"/g, '""')}"`,
                `"${(r.empleadoNombre || '').replace(/"/g, '""')}"`
            ]);
        } else if (subTab === "inv_no_rotation") {
            headers = ["PRODUCTO", "CODIGO BARRAS", "CATEGORIA", "STOCK INMOVILIZADO", "COSTO UNITARIO", "CAPITAL ESTANCADO", "PRECIO VENTA", "DIAS SIN ROTACION"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${r.codigoBarras}"`,
                `"${(r.categoria || '').replace(/"/g, '""')}"`,
                r.stockInmovilizado,
                r.costoUnitario.toFixed(2),
                r.capitalEstancado.toFixed(2),
                r.precioVenta.toFixed(2),
                r.diasSinRotacion
            ]);
        }

        downloadCSV(`reporte_inventario_${subTab}`, headers, rows);
    };

    const handleClearFilters = () => {
        setSearch("");
        setInventoryCategoryFilter("TODOS");
        setInventoryStockFilter("TODOS");
        setInventoryExpirationFilter("TODOS");
        setInventoryAdjustmentTypeFilter("TODOS");
        setCurrentPage(1);
    };

    return (
        <div className="inventory-report-wrapper w-100">
            {/* Header con botones PDF y Excel */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-1 px-3 py-1.5 fw-bold" style={{ backgroundColor: "#09090b", color: "#ffffff", fontSize: "0.72rem" }}>
                        CONTROL ESTRATÉGICO DE INVENTARIO
                    </span>
                    <span className="text-secondary small">
                        Existencias, lotes, vencimientos, valorización y ajustes de stock
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

            {/* Sub-pestañas de Inventario */}
            <div className="sub-tabs-wrapper d-flex gap-2 mb-3 overflow-x-auto pb-1">
                {inventorySubTabs.map((tab) => (
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
                                placeholder="Buscar por producto, principio activo, código de barras, lote, categoría..."
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
                        {subTab === "inv_general" && (
                            <div className="d-flex align-items-center gap-1.5">
                                <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>CATEGORÍA:</span>
                                <select
                                    value={inventoryCategoryFilter}
                                    onChange={(e) => {
                                        setInventoryCategoryFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="form-select form-select-sm border bg-light shadow-none fw-semibold"
                                    style={{ fontSize: "0.76rem", maxWidth: "170px" }}
                                >
                                    <option value="TODOS">Todas las Categorías</option>
                                    {categoriesList.map(c => (
                                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {subTab === "inv_stock_actual" && (
                            <div className="d-flex align-items-center gap-1.5">
                                <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>ESTADO:</span>
                                <select
                                    value={inventoryStockFilter}
                                    onChange={(e) => {
                                        setInventoryStockFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="form-select form-select-sm border bg-light shadow-none fw-semibold"
                                    style={{ fontSize: "0.76rem", minWidth: "125px" }}
                                >
                                    <option value="TODOS">Todos los Stocks</option>
                                    <option value="DISPONIBLE">Disponibles (&gt; 10)</option>
                                    <option value="BAJO">Stock Bajo (1 - 10)</option>
                                    <option value="AGOTADO">Agotados (0)</option>
                                </select>
                            </div>
                        )}

                        {subTab === "inv_expirations" && (
                            <div className="d-flex align-items-center gap-1.5">
                                <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>VENCIMIENTO:</span>
                                <select
                                    value={inventoryExpirationFilter}
                                    onChange={(e) => {
                                        setInventoryExpirationFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="form-select form-select-sm border bg-light shadow-none fw-semibold"
                                    style={{ fontSize: "0.76rem", minWidth: "140px" }}
                                >
                                    <option value="TODOS">Todos los Lotes</option>
                                    <option value="VENCIDOS">Ya Vencidos (&lt; 0d)</option>
                                    <option value="CRITICOS">Críticos (&le; 30 días)</option>
                                    <option value="PROXIMOS">Por Vencer (&le; 90 días)</option>
                                    <option value="VIGENTES">Vigentes (&gt; 90 días)</option>
                                </select>
                            </div>
                        )}

                        {subTab === "inv_adjustments" && (
                            <div className="d-flex align-items-center gap-1.5">
                                <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>TIPO:</span>
                                <select
                                    value={inventoryAdjustmentTypeFilter}
                                    onChange={(e) => {
                                        setInventoryAdjustmentTypeFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="form-select form-select-sm border bg-light shadow-none fw-semibold"
                                    style={{ fontSize: "0.76rem", minWidth: "95px" }}
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="ENTRADA">ENTRADA</option>
                                    <option value="SALIDA">SALIDA</option>
                                </select>
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
                            <span className="visually-hidden">Cargando reporte...</span>
                        </div>
                        <p className="text-secondary small mt-2 mb-0">Cargando datos de inventario...</p>
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
                            No se encontraron registros de inventario con los parámetros seleccionados
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        {subTab === "inv_general" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>NOMBRE PRODUCTO</th>
                                        <th>PRINCIPIO ACTIVO</th>
                                        <th>CONCENTRACION</th>
                                        <th>FORMA FARMACEUTICA</th>
                                        <th>PATOLOGIA</th>
                                        <th className="text-center">REQUIERE RECETA</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>REGISTRO SANITARIO</th>
                                        <th>CODIGO DIGEMID</th>
                                        <th>CATEGORIA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="fw-bold text-dark" style={{ minWidth: "220px", fontSize: "0.78rem" }}>{item.productName}</td>
                                            <td className="small text-secondary" style={{ minWidth: "180px" }}>{item.principioActivo}</td>
                                            <td className="small text-secondary">{item.concentracion}</td>
                                            <td className="small text-secondary">{item.formaFarmaceutica}</td>
                                            <td className="small text-secondary">{item.patologia}</td>
                                            <td className="text-center">
                                                <span className={`fw-bold small ${item.requiereReceta === "SI" ? "text-rose" : "text-secondary"}`}>{item.requiereReceta}</span>
                                            </td>
                                            <td className="small text-secondary fw-semibold">{item.codigoBarras}</td>
                                            <td className="small text-secondary">{item.registroSanitario}</td>
                                            <td className="small text-secondary">{item.codDigemid}</td>
                                            <td className="small text-secondary" style={{ maxWidth: "220px" }}>{item.categoria}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_stock_actual" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>CATEGORIA</th>
                                        <th>UBICACION</th>
                                        <th className="text-center">STOCK ACTUAL</th>
                                        <th className="text-center">ESTADO</th>
                                        <th className="text-end">PRECIO VENTA</th>
                                        <th className="text-end">VALOR TOTAL VENTA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.codigoBarras}</td>
                                            <td className="small text-secondary">{item.categoria}</td>
                                            <td className="small text-secondary">{item.ubicacion}</td>
                                            <td className="text-center fw-bold">{item.stock} uds</td>
                                            <td className="text-center">
                                                <span className={`badge-badge fw-bold ${item.status === "DISPONIBLE" ? "bg-emerald-light text-emerald" : item.status === "POR AGOTARSE" ? "bg-amber-light text-amber" : "bg-rose-light text-rose"}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="text-end text-dark">S/ {item.precioVenta.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-dark">S/ {item.totalValorVenta.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_low_stock" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>CATEGORIA</th>
                                        <th className="text-center">STOCK ACTUAL</th>
                                        <th className="text-center">SUGERIDO</th>
                                        <th className="text-center">DEFICIT</th>
                                        <th className="text-center">NIVEL ALERTA</th>
                                        <th>PROVEEDOR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.codigoBarras}</td>
                                            <td className="small text-secondary">{item.categoria}</td>
                                            <td className="text-center fw-bold text-rose">{item.stock} uds</td>
                                            <td className="text-center small text-secondary">{item.minSuggested} uds</td>
                                            <td className="text-center fw-bold text-amber">-{item.deficit} uds</td>
                                            <td className="text-center">
                                                <span className={`badge-badge fw-bold ${item.alertLevel === "AGOTADO" ? "bg-dark text-white" : item.alertLevel === "CRÍTICO" ? "bg-rose-light text-rose" : "bg-amber-light text-amber"}`}>
                                                    {item.alertLevel}
                                                </span>
                                            </td>
                                            <td className="small text-secondary">{item.proveedor}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_expirations" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>LOTE</th>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>FECHA VENCIMIENTO</th>
                                        <th className="text-center">DIAS RESTANTES</th>
                                        <th className="text-center">STOCK LOTE</th>
                                        <th className="text-end">COSTO UNIT.</th>
                                        <th className="text-end">VALOR RIESGO</th>
                                        <th className="text-center">ESTADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="fw-bold small text-secondary">{item.nroLote}</td>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.codigoBarras}</td>
                                            <td className="small text-secondary">• {item.fechaVencimiento}</td>
                                            <td className="text-center fw-bold">
                                                <span className={item.daysLeft < 0 ? "text-rose" : item.daysLeft <= 30 ? "text-amber" : "text-dark"}>
                                                    {item.daysLeft < 0 ? `Vencido (${Math.abs(item.daysLeft)}d)` : `${item.daysLeft} días`}
                                                </span>
                                            </td>
                                            <td className="text-center fw-semibold">{item.cantidadActual} uds</td>
                                            <td className="text-end text-dark">S/ {item.costoUnitario.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-rose">S/ {item.valorEnRiesgo.toFixed(2)}</td>
                                            <td className="text-center">
                                                <span className={`badge-badge fw-bold ${item.status === "VENCIDO" ? "bg-dark text-white" : item.status === "CRÍTICO" ? "bg-rose-light text-rose" : item.status === "POR VENCER" ? "bg-amber-light text-amber" : "bg-emerald-light text-emerald"}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_top_investment" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th># RANK</th>
                                        <th>PRODUCTO</th>
                                        <th>CATEGORIA</th>
                                        <th className="text-center">STOCK</th>
                                        <th className="text-end">COSTO UNIT.</th>
                                        <th className="text-end">CAPITAL INVERTIDO</th>
                                        <th className="text-center">% INVERSIÓN</th>
                                        <th className="text-end">PRECIO VENTA</th>
                                        <th className="text-end">ROI %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td>
                                                <span className={`badge-rank ${item.rank === 1 ? "rank-gold" : item.rank === 2 ? "rank-silver" : item.rank === 3 ? "rank-bronze" : "rank-default"}`}>
                                                    #{item.rank}
                                                </span>
                                            </td>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.categoria}</td>
                                            <td className="text-center fw-semibold">{item.stock} uds</td>
                                            <td className="text-end text-dark">S/ {item.costoUnitario.toFixed(2)}</td>
                                            <td className="text-end fw-black text-dark">S/ {item.capitalInvertido.toFixed(2)}</td>
                                            <td className="text-center small text-secondary">{item.percentOfTotal.toFixed(1)}%</td>
                                            <td className="text-end text-dark">S/ {item.precioVenta.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-emerald">+{item.roi.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_categorization" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>CATEGORIA</th>
                                        <th className="text-center">PRODUCTOS</th>
                                        <th className="text-center">STOCK TOTAL</th>
                                        <th className="text-end">INVERSIÓN COSTO</th>
                                        <th className="text-end">VALOR VENTA</th>
                                        <th className="text-end">UTILIDAD ESPERADA</th>
                                        <th className="text-center">MARGEN %</th>
                                        <th className="text-center">PARTICIPACIÓN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="fw-bold text-dark">{item.categoryName}</td>
                                            <td className="text-center"><span className="badge bg-light border text-dark">{item.productCount}</span></td>
                                            <td className="text-center fw-semibold">{item.totalStock} uds</td>
                                            <td className="text-end text-dark">S/ {item.totalCost.toFixed(2)}</td>
                                            <td className="text-end text-dark">S/ {item.totalSale.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-emerald">S/ {item.expectedProfit.toFixed(2)}</td>
                                            <td className="text-center fw-bold">{item.marginPercent}%</td>
                                            <td className="text-center small text-secondary">{item.sharePercent.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_lots_detailed" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>LOTE</th>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>REGISTRO</th>
                                        <th>VENCIMIENTO</th>
                                        <th className="text-center">STOCK ACTUAL</th>
                                        <th className="text-end">COSTO UNIT.</th>
                                        <th className="text-end">VALORIZADO</th>
                                        <th className="text-center">ESTADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="fw-bold small text-secondary">{item.nroLote}</td>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.codigoBarras}</td>
                                            <td className="small text-secondary">• {item.fechaRegistro}</td>
                                            <td className="small text-secondary">• {item.fechaVencimiento}</td>
                                            <td className="text-center fw-bold">{item.cantidadActual} uds</td>
                                            <td className="text-end text-dark">S/ {item.costoUnitario.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-dark">S/ {item.valorizado.toFixed(2)}</td>
                                            <td className="text-center">
                                                <span className={`badge-badge fw-bold ${item.estado === "ACTIVO" ? "bg-emerald-light text-emerald" : item.estado === "VENCIDO" ? "bg-rose-light text-rose" : "bg-light border text-muted"}`}>
                                                    {item.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_valuation" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>CATEGORIA</th>
                                        <th className="text-center">STOCK</th>
                                        <th className="text-end">COSTO UNIT.</th>
                                        <th className="text-end">TOTAL COSTO</th>
                                        <th className="text-end">PRECIO VENTA</th>
                                        <th className="text-end">TOTAL VALOR VENTA</th>
                                        <th className="text-end">UTILIDAD ESPERADA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.codigoBarras}</td>
                                            <td className="small text-secondary">{item.categoria}</td>
                                            <td className="text-center fw-semibold">{item.stock} uds</td>
                                            <td className="text-end text-dark">S/ {item.costoUnitario.toFixed(2)}</td>
                                            <td className="text-end text-dark">S/ {item.totalCosto.toFixed(2)}</td>
                                            <td className="text-end text-dark">S/ {item.precioVenta.toFixed(2)}</td>
                                            <td className="text-end fw-bold text-dark">S/ {item.totalVenta.toFixed(2)}</td>
                                            <td className="text-end fw-black text-emerald">S/ {item.utilidadEsperada.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_products_lots" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>CATEGORIA</th>
                                        <th className="text-center">LOTES ASOCIADOS</th>
                                        <th className="text-center">STOCK TOTAL</th>
                                        <th className="text-end">VALORIZACION ESTIMADA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.codigoBarras}</td>
                                            <td className="small text-secondary">{item.categoria}</td>
                                            <td className="text-center">
                                                <span className="badge bg-light border text-dark px-2 py-1 fw-bold">
                                                    {item.lotesCount} lotes
                                                </span>
                                            </td>
                                            <td className="text-center fw-bold">{item.stockTotal} uds</td>
                                            <td className="text-end fw-bold text-dark">S/ {item.totalValued.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_adjustments" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>FECHA HORA</th>
                                        <th>TIPO AJUSTE</th>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO</th>
                                        <th>LOTE</th>
                                        <th className="text-center">CANTIDAD</th>
                                        <th>MOTIVO</th>
                                        <th>RESPONSABLE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="small text-secondary">• {item.dateFormatted}</td>
                                            <td>
                                                <span className={`badge-badge fw-bold ${item.tipoAjuste === "ENTRADA" ? "bg-teal-subtle text-teal" : "bg-rose-light text-rose"}`}>
                                                    {item.tipoAjuste}
                                                </span>
                                            </td>
                                            <td className="fw-bold text-dark">{item.productoNombre}</td>
                                            <td className="small text-secondary">{item.productoCodigo}</td>
                                            <td className="small text-secondary">{item.nroLote}</td>
                                            <td className="text-center fw-bold">{item.cantidad} uds</td>
                                            <td className="small text-secondary">{item.motivo}</td>
                                            <td className="small text-secondary">{item.empleadoNombre}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {subTab === "inv_no_rotation" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>CATEGORIA</th>
                                        <th className="text-center">STOCK INMOVILIZADO</th>
                                        <th className="text-end">COSTO UNIT.</th>
                                        <th className="text-end">CAPITAL ESTANCADO</th>
                                        <th className="text-end">PRECIO VENTA</th>
                                        <th className="text-center">TIEMPO SIN VENDER</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="small text-secondary">{item.codigoBarras}</td>
                                            <td className="small text-secondary">{item.categoria}</td>
                                            <td className="text-center fw-bold text-amber">{item.stockInmovilizado} uds</td>
                                            <td className="text-end text-dark">S/ {item.costoUnitario.toFixed(2)}</td>
                                            <td className="text-end fw-black text-rose">S/ {item.capitalEstancado.toFixed(2)}</td>
                                            <td className="text-end text-dark">S/ {item.precioVenta.toFixed(2)}</td>
                                            <td className="text-center"><span className="badge bg-light border text-secondary">{item.diasSinRotacion}</span></td>
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
        </div>
    );
};
