import React, { useState, useEffect, useMemo } from "react";
import productsApi from "../apis/productsApi.js";
import { ReceiptTicketModal } from "../components/ReceiptTicketModal.jsx";
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
    // Pestaña principal y subpestaña
    const [mainTab, setMainTab] = useState("KARDEX"); // Default to KARDEX
    const [subTab, setSubTab] = useState("kardex_valorizado"); // 'kardex_valorizado' | 'kardex_movimiento' | 'kardex_producto' | ...

    // Datos de Ventas
    const [loading, setLoading] = useState(true);
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
    const [selectedSupplierPurchasesModal, setSelectedSupplierPurchasesModal] = useState(null);

    // Datos de Kardex e Inventario
    const [lots, setLots] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [inventoryAdjustments, setInventoryAdjustments] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);
    const [movementTypeFilter, setMovementTypeFilter] = useState("TODOS"); // 'TODOS' | 'ENTRADA' | 'SALIDA'
    const [selectedProductKardexModal, setSelectedProductKardexModal] = useState(null);

    // Filtros
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [daysFilter, setDaysFilter] = useState("7"); // '7' | '15' | '30' | 'today' | 'month' | 'all' | 'custom'
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("TODOS");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal de Ticket
    const [selectedSaleForTicket, setSelectedSaleForTicket] = useState(null);
    const [isTicketOpen, setIsTicketOpen] = useState(false);

    // Modal de Detalle de Venta
    const [viewSaleModal, setViewSaleModal] = useState(null);

    // Cargar todos los datos gerenciales
    const loadReportData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (search) params.search = search;

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
                getSalesSummary(params),
                getTopSellingProducts(params),
                getSalesByEmployee(params),
                getSalesByClient(params),
                getSalesProfit(params),
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
            console.error("Error al cargar reportes gerenciales:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReportData();
    }, [startDate, endDate]);

    // Limpiar filtros
    const handleClearFilters = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setDaysFilter("all");
        setPaymentStatusFilter("TODOS");
        setMovementTypeFilter("TODOS");
        setCurrentPage(1);
    };

    const handleOpenTicket = (sale) => {
        setSelectedSaleForTicket(sale);
        setIsTicketOpen(true);
    };

    // Al cambiar la pestaña principal, sincronizar la sub-pestaña por defecto
    const handleMainTabChange = (mod) => {
        setMainTab(mod);
        setCurrentPage(1);
        if (mod === "KARDEX") {
            if (!subTab.startsWith("kardex_")) {
                setSubTab("kardex_valorizado"); // Abre Kardex Valorizado por defecto
            }
        } else if (mod === "PROVEEDORES") {
            if (!subTab.startsWith("supp_")) {
                setSubTab("supp_purchases"); // Abre Compras Proveedor por defecto
            }
        } else if (mod === "FINANZAS") {
            if (!subTab.startsWith("fin_")) {
                setSubTab("fin_credits_due"); // Abre Créditos por Vencer por defecto
            }
        } else if (mod === "VENTAS") {
            if (subTab.startsWith("fin_") || subTab.startsWith("supp_") || subTab.startsWith("kardex_")) {
                setSubTab("daily");
            }
        }
    };

    // Sub-pestañas para KARDEX (Exactas a las capturas)
    const kardexSubTabs = [
        { id: "kardex_valorizado", label: "Kardex Valorizado", icon: "📑" },
        { id: "kardex_movimiento", label: "Kardex Movimiento", icon: "⏱️" },
        { id: "kardex_producto", label: "Kardex por Producto", icon: "🏷️" },
    ];

    // Sub-pestañas para VENTAS
    const salesSubTabs = [
        { id: "daily", label: "Ventas Diarias", icon: "📈" },
        { id: "employee", label: "Ventas por Empleado", icon: "👥" },
        { id: "client", label: "Ventas por Cliente", icon: "👤" },
        { id: "details", label: "Detalle de Ventas", icon: "📑" },
        { id: "top", label: "Top Más Vendidos", icon: "⭐" },
        { id: "profit", label: "Utilidad por Venta", icon: "📊" },
    ];

    // Sub-pestañas exactas para PROVEEDORES (Coincidentes con la captura)
    const supplierSubTabs = [
        { id: "supp_purchases", label: "Compras Proveedor", icon: "🚚" },
        { id: "supp_min_prices", label: "Precios Mínimos", icon: "$" },
        { id: "supp_price_comparison", label: "Comparativo Precios", icon: "📊" },
        { id: "supp_purchase_details", label: "Compra - Detalle Compra", icon: "📑" },
    ];

    // Formateador de fechas y horas idéntico a la captura (ej. "18/7/2026, 12:51 a. m.")
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "—";
        try {
            const cleanStr = String(dateStr).replace(" ", "T");
            const d = new Date(cleanStr);
            if (isNaN(d.getTime())) return String(dateStr);
            return d.toLocaleString("es-PE", {
                day: "numeric",
                month: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return String(dateStr);
        }
    };

    // Sub-pestañas exactas para FINANZAS (Coincidentes con la captura)
    const financeSubTabs = [
        { id: "fin_profit_product", label: "Ganancia por Producto", icon: "$" },
        { id: "fin_client_balances", label: "Saldos de Clientes", icon: "📁" },
        { id: "fin_credits_due", label: "Créditos por Vencer", icon: "⏱️" },
        { id: "fin_client_credits", label: "Créditos Clientes", icon: "⏱️" },
        { id: "fin_credit_payments", label: "Crédito y pagos", icon: "💵" },
        { id: "fin_payment_history", label: "Historial de Pagos", icon: "⏱️" },
        { id: "fin_cash_closures", label: "Cierres de Caja", icon: "🏢" },
        { id: "fin_cash_movements", label: "Movimientos de Caja", icon: "💳" },
    ];

    // Módulos principales superiores
    const mainModules = [
        "VENTAS",
        "PROVEEDORES",
        "INVENTARIO",
        "FINANZAS",
        "KARDEX",
    ];

    // Ayudante para verificar rango de fechas según días seleccionados
    const isDateInFilter = (dateStr, filterKey) => {
        if (!dateStr || filterKey === "all") return true;
        const cleanStr = String(dateStr).replace(" ", "T");
        const itemDate = new Date(cleanStr);
        if (isNaN(itemDate.getTime())) return true;

        const now = new Date();
        now.setHours(23, 59, 59, 999);

        if (filterKey === "today") {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            return itemDate >= todayStart && itemDate <= now;
        }
        if (filterKey === "7") {
            const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
            return diffDays >= 0 && diffDays <= 7;
        }
        if (filterKey === "15") {
            const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
            return diffDays >= 0 && diffDays <= 15;
        }
        if (filterKey === "30") {
            const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
            return diffDays >= 0 && diffDays <= 30;
        }
        if (filterKey === "month") {
            return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        if (filterKey === "custom") {
            if (startDate && itemDate < new Date(startDate)) return false;
            if (endDate && itemDate > new Date(endDate + "T23:59:59")) return false;
            return true;
        }
        return true;
    };

    // Configuración del buscador según subpestaña activa
    const searchConfig = useMemo(() => {
        switch (subTab) {
            case "top":
            case "fin_profit_product":
                return { placeholder: "Buscar producto...", label: "PRODUCTO" };
            case "employee":
                return { placeholder: "Buscar por empleado...", label: "EMPLEADO" };
            case "client":
            case "fin_client_balances":
            case "fin_credits_due":
            case "fin_client_credits":
            case "fin_credit_payments":
                return { placeholder: "Buscar por cliente...", label: "CLIENTE" };
            case "fin_payment_history":
                return { placeholder: "Buscar por cliente o recibo...", label: "CLIENTE, RECIBO" };
            case "fin_cash_closures":
                return { placeholder: "Buscar por cajero o sesión...", label: "CAJERO, SESIÓN" };
            case "fin_cash_movements":
                return { placeholder: "Buscar por concepto o responsable...", label: "CONCEPTO, CAJERO" };
            case "supp_purchases":
                return { placeholder: "Buscar por proveedor...", label: "PROVEEDOR" };
            case "supp_min_prices":
                return { placeholder: "Buscar producto o proveedor...", label: "PRODUCTO, PROVEEDOR" };
            case "supp_price_comparison":
                return { placeholder: "Buscar producto o proveedor...", label: "PRODUCTO, PROVEEDOR" };
            case "supp_purchase_details":
                return { placeholder: "Buscar por proveedor, factura o producto...", label: "PROVEEDOR, FACTURA, PRODUCTO" };
            case "kardex_valorizado":
            case "kardex_movimiento":
                return { placeholder: "Buscar por producto, comprobante...", label: "PRODUCTO, COMPROBANTE, CLIENTE" };
            case "kardex_producto":
                return { placeholder: "Buscar por producto, categoría...", label: "PRODUCTO, CATEGORÍA" };
            default:
                return { placeholder: "Buscar por cliente, comprobante...", label: "CLIENTE, COMPROBANTE" };
        }
    }, [subTab]);

    // ==========================================
    // PROCESAMIENTO Y FILTRADO DE DATOS (VENTAS)
    // ==========================================

    const filteredDailySales = useMemo(() => {
        return dailySales.filter((sale) => {
            if (!isDateInFilter(sale.dateTime || sale.fechaHora, daysFilter)) return false;
            if (paymentStatusFilter !== "TODOS") {
                const st = (sale.paymentStatus || sale.estadoPago || "PAGADO").toUpperCase();
                if (st !== paymentStatusFilter) return false;
            }
            if (search.trim()) {
                const q = search.toLowerCase();
                const client = (sale.clientName || sale.clienteNombre || "").toLowerCase();
                const receipt = (sale.receiptNumber || sale.numComprobante || "").toLowerCase();
                const series = (sale.series || sale.serie || "").toLowerCase();
                const user = (sale.employeeName || sale.empleadoNombre || "").toLowerCase();
                const method = (sale.paymentMethodName || sale.formaPagoNombre || "").toLowerCase();
                return client.includes(q) || receipt.includes(q) || series.includes(q) || user.includes(q) || method.includes(q);
            }
            return true;
        });
    }, [dailySales, paymentStatusFilter, search, daysFilter, startDate, endDate]);

    const saleDetailsList = useMemo(() => {
        const list = [];
        dailySales.forEach(s => {
            if (!isDateInFilter(s.dateTime || s.fechaHora, daysFilter)) return;
            const dateStr = s.dateTime || s.fechaHora || "";
            const receipt = (s.series || s.serie || "T001") + "-" + (s.receiptNumber || s.numComprobante || s.id);
            if (s.details && Array.isArray(s.details)) {
                s.details.forEach(d => {
                    const prod = d.productName || d.nombreProducto || "Producto";
                    if (search.trim()) {
                        const q = search.toLowerCase();
                        if (!prod.toLowerCase().includes(q) && !receipt.toLowerCase().includes(q)) return;
                    }
                    list.push({
                        dateStr,
                        receipt,
                        productName: prod,
                        presentationName: d.presentationName || "UNIDAD",
                        quantity: d.presentationQuantity || d.cantidad || 1,
                        unitPrice: Number(d.presentationUnitPrice || d.precioUnitario || 0),
                        subtotal: Number(d.subtotal || 0),
                    });
                });
            }
        });
        return list;
    }, [dailySales, search, daysFilter, startDate, endDate]);

    const filteredTopProducts = useMemo(() => {
        if (!search.trim()) return topProducts;
        const q = search.toLowerCase();
        return topProducts.filter(p => (p.productName || "").toLowerCase().includes(q));
    }, [topProducts, search]);

    const filteredEmployeeSales = useMemo(() => {
        if (!search.trim()) return employeeSales;
        const q = search.toLowerCase();
        return employeeSales.filter(e =>
            (e.employeeName || "").toLowerCase().includes(q) ||
            (e.receiptNumber || "").toLowerCase().includes(q)
        );
    }, [employeeSales, search]);

    const filteredClientSales = useMemo(() => {
        if (!search.trim()) return clientSales;
        const q = search.toLowerCase();
        return clientSales.filter(c => (c.clientName || "").toLowerCase().includes(q));
    }, [clientSales, search]);

    const filteredProfitSales = useMemo(() => {
        if (!search.trim()) return profitSales;
        const q = search.toLowerCase();
        return profitSales.filter(p =>
            (p.employeeName || "").toLowerCase().includes(q) ||
            (p.receiptNumber || "").toLowerCase().includes(q)
        );
    }, [profitSales, search]);

    // ==========================================
    // PROCESAMIENTO Y FILTRADO DE DATOS (FINANZAS)
    // ==========================================

    // 1. Ganancia por Producto
    const finProductProfitList = useMemo(() => {
        const map = new Map();
        dailySales.forEach(sale => {
            if (!isDateInFilter(sale.dateTime || sale.fechaHora, daysFilter)) return;
            if (sale.details && Array.isArray(sale.details)) {
                sale.details.forEach(d => {
                    const name = d.productName || d.nombreProducto || "Producto";
                    const qty = Number(d.presentationQuantity || d.cantidad || 1);
                    const sub = Number(d.subtotal || (qty * (d.presentationUnitPrice || 0)));
                    const costUnit = Number(d.baseUnitCost || 0);
                    const totalCost = costUnit > 0 ? (costUnit * qty) : (sub * 0.70); // Estimado 30% margen si no hay costo base
                    const current = map.get(name) || {
                        productName: name,
                        presentationName: d.presentationName || "UNIDAD",
                        lotNumber: d.lotNumber || "S/N",
                        totalQuantity: 0,
                        totalRevenue: 0,
                        totalCost: 0,
                        totalProfit: 0,
                    };
                    current.totalQuantity += qty;
                    current.totalRevenue += sub;
                    current.totalCost += totalCost;
                    current.totalProfit += (sub - totalCost);
                    map.set(name, current);
                });
            }
        });

        let list = Array.from(map.values()).map(p => ({
            ...p,
            marginPercent: p.totalRevenue > 0 ? Math.round((p.totalProfit / p.totalRevenue) * 100) : 0,
        }));

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p => p.productName.toLowerCase().includes(q));
        }

        return list.sort((a, b) => b.totalProfit - a.totalProfit);
    }, [dailySales, daysFilter, search, startDate, endDate]);

    // 2. Saldos de Clientes
    const finClientBalancesList = useMemo(() => {
        let list = clientDebtors.map(d => {
            const totalCred = Number(d.totalCredit || (Number(d.currentBalance || 0) + Number(d.totalPaid || 0)));
            const paid = Number(d.totalPaid || 0);
            const pending = Number(d.currentBalance !== undefined ? d.currentBalance : (d.pendingBalance || 0));
            return {
                id: d.id || d.clientId,
                clientName: d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.clientName || "Cliente",
                identification: d.identification || d.numDocumento || "—",
                phone: d.phone || d.telefono || "—",
                creditLimit: Number(d.creditLimit || 0),
                pendingSalesCount: d.pendingSalesCount || (d.pendingSales ? d.pendingSales.length : 0),
                totalCredit: totalCred,
                totalPaid: paid,
                pendingBalance: pending,
            };
        });

        // Complementar con ventas a crédito que tengan saldo pendiente
        dailySales.forEach(s => {
            const isCredit = (s.saleType || '').toLowerCase() === 'credito' || (s.paymentStatus || '').toLowerCase() === 'pendiente';
            const pending = Number(s.pendingBalance !== undefined ? s.pendingBalance : (Number(s.total || 0) - Number(s.amountPaid || 0)));
            if (isCredit && pending > 0 && s.clientName && s.clientName !== "Público General") {
                const existing = list.find(x => x.id === s.clientId || x.clientName.toLowerCase() === s.clientName.toLowerCase());
                if (!existing) {
                    list.push({
                        id: s.clientId || s.id,
                        clientName: s.clientName,
                        identification: "—",
                        phone: "—",
                        creditLimit: 0,
                        pendingSalesCount: 1,
                        totalCredit: Number(s.total || 0),
                        totalPaid: Number(s.amountPaid || 0),
                        pendingBalance: pending,
                    });
                }
            }
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d =>
                d.clientName.toLowerCase().includes(q) ||
                d.identification.includes(q) ||
                d.phone.includes(q)
            );
        }

        return list.sort((a, b) => b.pendingBalance - a.pendingBalance);
    }, [clientDebtors, dailySales, search]);

    // 3. Créditos por Vencer (Sección de la captura)
    const finCreditsDueSoonList = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let list = [];
        dailySales.forEach(s => {
            const isCredit = (s.saleType || '').toLowerCase() === 'credito' || (s.paymentStatus || '').toLowerCase() === 'pendiente';
            const pending = Number(s.pendingBalance !== undefined ? s.pendingBalance : (Number(s.total || 0) - Number(s.amountPaid || 0)));

            // Solo considerar si tiene saldo pendiente por cobrar
            if (!isCredit || pending <= 0) return;

            let daysLeft = null;
            let isOverdue = false;
            let dueDateFormatted = "Sin fecha";

            if (s.dueDate) {
                const cleanStr = String(s.dueDate).replace(" ", "T");
                const dDate = new Date(cleanStr);
                if (!isNaN(dDate.getTime())) {
                    const diffTime = dDate.getTime() - now.getTime();
                    daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
                    isOverdue = daysLeft < 0;
                    dueDateFormatted = cleanStr.slice(0, 10);
                }
            }

            // Aplicación del filtro 'DÍAS'
            if (daysFilter === "7" && daysLeft !== null && daysLeft > 7 && !isOverdue) return;
            if (daysFilter === "15" && daysLeft !== null && daysLeft > 15 && !isOverdue) return;
            if (daysFilter === "30" && daysLeft !== null && daysLeft > 30 && !isOverdue) return;
            if (daysFilter === "today" && daysLeft !== 0) return;

            const receipt = (s.series || s.serie || "T001") + "-" + (s.receiptNumber || s.numComprobante || s.id);
            const client = s.clientName || s.clienteNombre || "Cliente General";

            if (search.trim()) {
                const q = search.toLowerCase();
                if (!client.toLowerCase().includes(q) && !receipt.toLowerCase().includes(q)) return;
            }

            list.push({
                id: s.id,
                sale: s,
                receipt,
                client,
                dateTime: String(s.dateTime || s.fechaHora || "—").slice(0, 16),
                dueDate: dueDateFormatted,
                daysLeft,
                isOverdue,
                total: Number(s.total || 0),
                amountPaid: Number(s.amountPaid || 0),
                pendingBalance: pending,
            });
        });

        return list.sort((a, b) => (a.daysLeft || 999) - (b.daysLeft || 999));
    }, [dailySales, daysFilter, search]);

    // 4. Créditos Clientes
    const finClientCreditsList = useMemo(() => {
        let list = [];
        dailySales.forEach(s => {
            const isCredit = (s.saleType || '').toLowerCase() === 'credito' || (s.paymentStatus || '').toLowerCase() === 'pendiente';
            if (!isCredit) return;
            if (!isDateInFilter(s.dateTime || s.fechaHora, daysFilter)) return;

            const pending = Number(s.pendingBalance !== undefined ? s.pendingBalance : (Number(s.total || 0) - Number(s.amountPaid || 0)));
            const receipt = (s.series || s.serie || "T001") + "-" + (s.receiptNumber || s.numComprobante || s.id);
            const client = s.clientName || s.clienteNombre || "Cliente General";
            const seller = s.employeeName || s.empleadoNombre || "Admin";

            if (search.trim()) {
                const q = search.toLowerCase();
                if (!client.toLowerCase().includes(q) && !receipt.toLowerCase().includes(q) && !seller.toLowerCase().includes(q)) return;
            }

            list.push({
                id: s.id,
                sale: s,
                receipt,
                client,
                seller,
                dateTime: String(s.dateTime || s.fechaHora || "—").slice(0, 16),
                dueDate: s.dueDate ? String(s.dueDate).slice(0, 10) : "—",
                total: Number(s.total || 0),
                amountPaid: Number(s.amountPaid || 0),
                pendingBalance: pending,
                status: (s.paymentStatus || (pending <= 0 ? "PAGADO" : "PENDIENTE")).toUpperCase(),
            });
        });

        return list.sort((a, b) => b.id - a.id);
    }, [dailySales, daysFilter, search, startDate, endDate]);

    // 5. Crédito y Pagos (Amortizaciones)
    const finCreditPaymentsList = useMemo(() => {
        let list = [];
        dailySales.forEach(s => {
            const isCredit = (s.saleType || '').toLowerCase() === 'credito' || (s.paymentStatus || '').toLowerCase() === 'pendiente';
            if (!isCredit) return;
            if (!isDateInFilter(s.dateTime || s.fechaHora, daysFilter)) return;

            const total = Number(s.total || 0);
            const paid = Number(s.amountPaid || 0);
            const pending = Number(s.pendingBalance !== undefined ? s.pendingBalance : (total - paid));
            const receipt = (s.series || s.serie || "T001") + "-" + (s.receiptNumber || s.numComprobante || s.id);
            const client = s.clientName || s.clienteNombre || "Cliente";

            if (search.trim()) {
                const q = search.toLowerCase();
                if (!client.toLowerCase().includes(q) && !receipt.toLowerCase().includes(q)) return;
            }

            const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

            list.push({
                id: s.id,
                sale: s,
                receipt,
                client,
                dateTime: String(s.dateTime || s.fechaHora || "—").slice(0, 10),
                total,
                paid,
                pending,
                percentPaid,
                status: pending <= 0 ? "CANCELADO" : paid > 0 ? "AMORTIZANDO" : "SIN ABONOS",
            });
        });

        return list.sort((a, b) => b.pending - a.pending);
    }, [dailySales, daysFilter, search, startDate, endDate]);

    // 6. Historial de Pagos
    const finPaymentHistoryList = useMemo(() => {
        let list = clientPayments.filter(p => {
            if (!isDateInFilter(p.paymentDate || p.fechaPago, daysFilter)) return false;
            if (search.trim()) {
                const q = search.toLowerCase();
                const client = (p.clientName || p.clienteNombre || "").toLowerCase();
                const receipt = (p.receiptNumber || p.numComprobante || "").toLowerCase();
                const ref = (p.reference || p.referencia || "").toLowerCase();
                const method = (p.paymentMethodName || p.medioPago || "").toLowerCase();
                return client.includes(q) || receipt.includes(q) || ref.includes(q) || method.includes(q);
            }
            return true;
        }).map(p => ({
            id: p.id,
            receiptNumber: (p.series ? p.series + "-" : "RC-") + (p.receiptNumber || p.id),
            dateTime: String(p.paymentDate || p.fechaPago || "").slice(0, 16),
            clientName: p.clientName || p.clienteNombre || "Cliente",
            saleReceipt: p.saleReceiptNumber || (p.saleId ? `Venta #${p.saleId}` : "Amortización"),
            paymentMethod: p.paymentMethodName || p.medioPago || "EFECTIVO",
            reference: p.reference || p.referencia || "—",
            amount: Number(p.amount || p.monto || 0),
            employeeName: p.employeeName || p.empleadoNombre || "Cajero",
        }));

        return list.sort((a, b) => b.id - a.id);
    }, [clientPayments, daysFilter, search, startDate, endDate]);

    // 7. Cierres de Caja
    const finCashClosuresList = useMemo(() => {
        let list = cashSessions.filter(cs => {
            if (!isDateInFilter(cs.openingDate || cs.fechaApertura, daysFilter)) return false;
            if (search.trim()) {
                const q = search.toLowerCase();
                const cashier = (cs.openingEmployeeName || cs.closingEmployeeName || cs.employeeName || "").toLowerCase();
                const idStr = String(cs.id);
                const status = (cs.status || "").toLowerCase();
                return cashier.includes(q) || idStr.includes(q) || status.includes(q);
            }
            return true;
        }).map(cs => {
            const diff = cs.difference !== null && cs.difference !== undefined ? Number(cs.difference) : 0;
            return {
                id: cs.id,
                cashier: cs.openingEmployeeName || cs.employeeName || "Cajero",
                openDate: String(cs.openingDate || cs.fechaApertura || "—").slice(0, 16),
                closeDate: cs.closingDate ? String(cs.closingDate).slice(0, 16) : "EN CURSO",
                initialAmount: Number(cs.initialAmount || cs.montoInicial || 0),
                expectedAmount: cs.expectedFinalAmount !== null ? Number(cs.expectedFinalAmount) : null,
                actualAmount: cs.actualFinalAmount !== null ? Number(cs.actualFinalAmount) : null,
                difference: diff,
                status: (cs.status || "CERRADA").toUpperCase(),
            };
        });

        return list.sort((a, b) => b.id - a.id);
    }, [cashSessions, daysFilter, search, startDate, endDate]);

    // 8. Movimientos de Caja
    const finCashMovementsList = useMemo(() => {
        let list = cashMovements.filter(m => {
            if (!isDateInFilter(m.fechaHora, daysFilter)) return false;
            if (search.trim()) {
                const q = search.toLowerCase();
                const concept = (m.concepto || "").toLowerCase();
                const user = (m.usuario || m.responsable || "").toLowerCase();
                const tipo = (m.tipo || "").toLowerCase();
                return concept.includes(q) || user.includes(q) || tipo.includes(q);
            }
            return true;
        }).map(m => ({
            id: m.id,
            dateTime: String(m.fechaHora || "—").slice(0, 16),
            tipo: (m.tipo || "INGRESO").toUpperCase(),
            concepto: m.concepto || "Movimiento general",
            sessionId: m.sessionId ? `#${m.sessionId}` : "—",
            usuario: m.usuario || m.responsable || "Admin",
            monto: Number(m.monto || 0),
        }));

        return list.sort((a, b) => b.id - a.id);
    }, [cashMovements, daysFilter, search, startDate, endDate]);

    // ==========================================
    // PROCESAMIENTO Y FILTRADO DE DATOS (PROVEEDORES)
    // ==========================================

    // Mapeo rápido de proveedores por ID
    const suppliersMap = useMemo(() => {
        const map = new Map();
        suppliers.forEach(s => {
            if (s && s.id !== undefined) {
                map.set(Number(s.id), s);
            }
        });
        return map;
    }, [suppliers]);

    // Helper de filtrado por fechas específico para compras
    const isPurchaseDateInFilter = (dateStr) => {
        if (!dateStr) return true;
        const cleanStr = String(dateStr).replace(" ", "T");
        const itemDate = new Date(cleanStr);
        if (isNaN(itemDate.getTime())) return true;

        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate + "T23:59:59")) return false;

        if (daysFilter !== "all" && daysFilter !== "custom" && mainTab !== "PROVEEDORES") {
            return isDateInFilter(dateStr, daysFilter);
        }
        return true;
    };

    // 1. Compras Proveedor (Agrupado por Proveedor - Exacto a la captura)
    const supplierPurchasesSummaryList = useMemo(() => {
        const validPurchases = purchases.filter(p => {
            if (p.isActive === false) return false;
            return isPurchaseDateInFilter(p.purchaseDate || p.fechaCompra);
        });

        const groups = new Map();
        validPurchases.forEach(p => {
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
    }, [purchases, suppliersMap, daysFilter, startDate, endDate, search, mainTab]);

    // 2. Precios Mínimos (Mejor costo por producto)
    const supplierMinPricesList = useMemo(() => {
        const productItemsMap = new Map();

        purchases.forEach(p => {
            if (p.isActive === false) return;
            const pDate = p.purchaseDate || p.fechaCompra;
            if (!isPurchaseDateInFilter(pDate)) return;

            const supId = p.supplierId ? Number(p.supplierId) : null;
            const supObj = supId ? suppliersMap.get(supId) : null;
            const supName = (supObj?.nombre || p.supplierName || (supId ? `Proveedor #${supId}` : "Proveedor")).trim();

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

            const avgCost = sumCost / records.length;
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
                avgPrice: avgCost,
                savings,
                savingsPercent,
                purchaseCount: records.length,
            });
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(item =>
                item.productName.toLowerCase().includes(q) ||
                item.bestSupplierName.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => a.minPrice - b.minPrice);
    }, [purchases, suppliersMap, daysFilter, startDate, endDate, search, mainTab]);

    // 3. Comparativo de Precios
    const supplierPriceComparisonList = useMemo(() => {
        const minCostMap = new Map();
        purchases.forEach(p => {
            if (p.isActive === false) return;
            if (p.details && Array.isArray(p.details)) {
                p.details.forEach(d => {
                    if (d.isActive === false) return;
                    const prodName = (d.productNombre || d.productName || "Producto").trim().toLowerCase();
                    const cost = Number(d.precioCosto || 0);
                    if (cost > 0 && (!minCostMap.has(prodName) || cost < minCostMap.get(prodName))) {
                        minCostMap.set(prodName, cost);
                    }
                });
            }
        });

        const list = [];
        purchases.forEach(p => {
            if (p.isActive === false) return;
            const pDate = p.purchaseDate || p.fechaCompra;
            if (!isPurchaseDateInFilter(pDate)) return;

            const supId = p.supplierId ? Number(p.supplierId) : null;
            const supObj = supId ? suppliersMap.get(supId) : null;
            const supName = (supObj?.nombre || p.supplierName || (supId ? `Proveedor #${supId}` : "Proveedor")).trim();

            if (p.details && Array.isArray(p.details)) {
                p.details.forEach(d => {
                    if (d.isActive === false) return;
                    const prodName = (d.productNombre || d.productName || "Producto").trim();
                    const cost = Number(d.precioCosto || 0);
                    const minCost = minCostMap.get(prodName.toLowerCase()) || cost;
                    const diff = cost - minCost;
                    const diffPercent = minCost > 0 ? Math.round((diff / minCost) * 100) : 0;
                    const isBestPrice = diff <= 0.001;

                    if (search.trim()) {
                        const q = search.toLowerCase();
                        if (!prodName.toLowerCase().includes(q) && !supName.toLowerCase().includes(q) && !(p.invoiceNumber || "").toLowerCase().includes(q)) {
                            return;
                        }
                    }

                    list.push({
                        id: `${p.id}-${d.id}`,
                        productName: prodName,
                        supplierName: supName,
                        invoiceNumber: p.invoiceNumber || `FAC-${p.id}`,
                        purchaseDateFormatted: formatDateTime(pDate),
                        quantity: Number(d.cantidad || 0),
                        precioCosto: cost,
                        lotNumber: d.nroLote || "—",
                        minCost,
                        diff,
                        diffPercent,
                        isBestPrice,
                    });
                });
            }
        });

        return list.sort((a, b) => b.diffPercent - a.diffPercent);
    }, [purchases, suppliersMap, daysFilter, startDate, endDate, search, mainTab]);

    // 4. Compra - Detalle Compra
    const supplierPurchaseDetailsList = useMemo(() => {
        const list = [];
        purchases.forEach(p => {
            if (p.isActive === false) return;
            const pDate = p.purchaseDate || p.fechaCompra;
            if (!isPurchaseDateInFilter(pDate)) return;

            const supId = p.supplierId ? Number(p.supplierId) : null;
            const supObj = supId ? suppliersMap.get(supId) : null;
            const supName = (supObj?.nombre || p.supplierName || (supId ? `Proveedor #${supId}` : "Proveedor")).trim();
            const invoice = p.invoiceNumber || `FAC-${p.id}`;

            if (p.details && Array.isArray(p.details)) {
                p.details.forEach(d => {
                    if (d.isActive === false) return;
                    const prodName = (d.productNombre || d.productName || "Producto").trim();
                    const qty = Number(d.cantidad || 0);
                    const cost = Number(d.precioCosto || 0);
                    const subtotal = qty * cost;

                    if (search.trim()) {
                        const q = search.toLowerCase();
                        if (
                            !supName.toLowerCase().includes(q) &&
                            !prodName.toLowerCase().includes(q) &&
                            !invoice.toLowerCase().includes(q) &&
                            !(d.nroLote || "").toLowerCase().includes(q)
                        ) {
                            return;
                        }
                    }

                    list.push({
                        id: `${p.id}-${d.id}`,
                        purchaseDateFormatted: formatDateTime(pDate),
                        invoiceNumber: invoice,
                        supplierName: supName,
                        productName: prodName,
                        lotNumber: d.nroLote || "—",
                        quantity: qty,
                        precioCosto: cost,
                        subtotal: subtotal,
                    });
                });
            }
        });

        return list.sort((a, b) => b.subtotal - a.subtotal);
    }, [purchases, suppliersMap, daysFilter, startDate, endDate, search, mainTab]);

    // ==========================================
    // PROCESAMIENTO Y FILTRADO DE DATOS (KARDEX)
    // ==========================================

    const productsMap = useMemo(() => {
        const map = new Map();
        productsList.forEach(p => {
            const id = p.idProducto || p.id;
            if (id) map.set(Number(id), p);
            if (p.nombre) map.set(p.nombre.toLowerCase().trim(), p);
            if (p.codigoBarras) map.set(p.codigoBarras.trim(), p);
        });
        return map;
    }, [productsList]);

    const getProductDisplayInfo = (name, id, barcode) => {
        let p = null;
        if (id && productsMap.has(Number(id))) p = productsMap.get(Number(id));
        else if (barcode && barcode !== "—" && productsMap.has(barcode.trim())) p = productsMap.get(barcode.trim());
        else if (name && productsMap.has(name.toLowerCase().trim())) p = productsMap.get(name.toLowerCase().trim());

        const rawName = p?.nombre || name || "Producto";
        const lab = p?.laboratorioNombre || p?.laboratorio?.nombre;
        const displayName = (lab && !rawName.includes("/")) ? `${rawName} / ${lab}` : rawName;
        const categoryName = p?.categoria?.name || p?.categoriaNombre || "N/A";
        const code = p?.codigoBarras || barcode || "—";
        const stock = p?.stockReal !== undefined ? Number(p.stockReal) : (p?.stockTotal !== undefined ? Number(p.stockTotal) : 0);
        const salePrice = p?.precioVenta ? Number(p.precioVenta) : 0;
        const costPrice = p?.costoUnitario || p?.precioCompra ? Number(p.costoUnitario || p.precioCompra) : 0;

        return { displayName, rawName, categoryName, code, stock, salePrice, costPrice, productObj: p };
    };

    const isKardexDateInFilter = (dateStr) => {
        if (!dateStr) return true;
        const cleanStr = String(dateStr).replace(" ", "T");
        const itemDate = new Date(cleanStr);
        if (isNaN(itemDate.getTime())) return true;

        if (startDate && itemDate < new Date(startDate)) return false;
        if (endDate && itemDate > new Date(endDate + "T23:59:59")) return false;

        return true;
    };

    // 1. Kardex Valorizado (Consolida Entradas y Salidas de todo el inventario)
    const kardexValorizadoList = useMemo(() => {
        const list = [];

        // Lotes Iniciales (Carga inicial)
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
                unitCost: unitCost,
                totalCost: totalCost,
                unitSalePrice: null,
                totalSalePrice: null,
                reference: "Carga Inicial de Inventario",
                lotNumber: l.nroLote || "—",
                clientName: "—",
                userName: "Sistema",
                productId: l.idProducto || prodInfo.productObj?.idProducto,
            });
        });

        // Compras de Proveedores (Entradas)
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
                        unitCost: unitCost,
                        totalCost: totalCost,
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

        // Ventas (Salidas)
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
                        unitCost: unitCost,
                        totalCost: totalCost,
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

        // Ajustes de Inventario (Entradas y Salidas)
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
                unitCost: unitCost,
                totalCost: totalCost,
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
    }, [lots, purchases, dailySales, inventoryAdjustments, productsMap, movementTypeFilter, search, startDate, endDate]);

    // 2. Kardex Movimiento (Exacto a la Captura 2: Transacciones con Compras y Ventas Acumuladas)
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
    }, [dailySales, productsMap, search, startDate, endDate]);

    // 3. Kardex por Producto (Exacto a la Captura 3: Catálogo de productos con botón de Movimientos)
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

    // Totales específicos para Kardex Movimiento
    const totalComprasAcumuladas = useMemo(() => {
        return kardexMovimientoList.reduce((sum, item) => sum + item.totalCompra, 0);
    }, [kardexMovimientoList]);

    const totalVentasAcumuladas = useMemo(() => {
        return kardexMovimientoList.reduce((sum, item) => sum + item.totalVenta, 0);
    }, [kardexMovimientoList]);

    // Historial individual para el modal de Movimientos de un Producto
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

        // Orden cronológico para calcular saldo
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

    // Obtener la lista activa según mainTab y subTab
    const currentList = useMemo(() => {
        if (mainTab === "KARDEX") {
            switch (subTab) {
                case "kardex_valorizado": return kardexValorizadoList;
                case "kardex_movimiento": return kardexMovimientoList;
                case "kardex_producto": return kardexPorProductoList;
                default: return [];
            }
        }
        if (mainTab === "VENTAS") {
            switch (subTab) {
                case "daily": return filteredDailySales;
                case "employee": return filteredEmployeeSales;
                case "client": return filteredClientSales;
                case "details": return saleDetailsList;
                case "top": return filteredTopProducts;
                case "profit": return filteredProfitSales;
                default: return [];
            }
        }
        if (mainTab === "FINANZAS") {
            switch (subTab) {
                case "fin_profit_product": return finProductProfitList;
                case "fin_client_balances": return finClientBalancesList;
                case "fin_credits_due": return finCreditsDueSoonList;
                case "fin_client_credits": return finClientCreditsList;
                case "fin_credit_payments": return finCreditPaymentsList;
                case "fin_payment_history": return finPaymentHistoryList;
                case "fin_cash_closures": return finCashClosuresList;
                case "fin_cash_movements": return finCashMovementsList;
                default: return [];
            }
        }
        if (mainTab === "PROVEEDORES") {
            switch (subTab) {
                case "supp_purchases": return supplierPurchasesSummaryList;
                case "supp_min_prices": return supplierMinPricesList;
                case "supp_price_comparison": return supplierPriceComparisonList;
                case "supp_purchase_details": return supplierPurchaseDetailsList;
                default: return [];
            }
        }
        return [];
    }, [
        mainTab,
        subTab,
        kardexValorizadoList,
        kardexMovimientoList,
        kardexPorProductoList,
        filteredDailySales,
        filteredEmployeeSales,
        filteredClientSales,
        saleDetailsList,
        filteredTopProducts,
        filteredProfitSales,
        finProductProfitList,
        finClientBalancesList,
        finCreditsDueSoonList,
        finClientCreditsList,
        finCreditPaymentsList,
        finPaymentHistoryList,
        finCashClosuresList,
        finCashMovementsList,
        supplierPurchasesSummaryList,
        supplierMinPricesList,
        supplierPriceComparisonList,
        supplierPurchaseDetailsList
    ]);

    // Paginación
    const totalRecords = currentList.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return currentList.slice(start, start + rowsPerPage);
    }, [currentList, currentPage, rowsPerPage]);

    // Totales calculados en tiempo real
    const totalMontoAcumulado = useMemo(() => {
        if (mainTab === "KARDEX") {
            if (subTab === "kardex_valorizado") return kardexValorizadoList.reduce((sum, item) => sum + item.totalCost, 0);
            if (subTab === "kardex_movimiento") return kardexMovimientoList.reduce((sum, item) => sum + item.totalVenta, 0);
            if (subTab === "kardex_producto") return kardexPorProductoList.reduce((sum, item) => sum + item.stockTotal, 0);
        }
        if (mainTab === "VENTAS") {
            if (subTab === "daily") return filteredDailySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
            if (subTab === "employee") return filteredEmployeeSales.reduce((sum, s) => sum + Number(s.totalSold || 0), 0);
            if (subTab === "client") return filteredClientSales.reduce((sum, s) => sum + Number(s.totalSpent || 0), 0);
            if (subTab === "details") return saleDetailsList.reduce((sum, s) => sum + Number(s.subtotal || 0), 0);
            if (subTab === "top") return filteredTopProducts.reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
            if (subTab === "profit") return filteredProfitSales.reduce((sum, s) => sum + Number(s.totalSale || 0), 0);
        }
        if (mainTab === "FINANZAS") {
            if (subTab === "fin_profit_product") return finProductProfitList.reduce((sum, p) => sum + p.totalRevenue, 0);
            if (subTab === "fin_client_balances") return finClientBalancesList.reduce((sum, d) => sum + d.pendingBalance, 0);
            if (subTab === "fin_credits_due") return finCreditsDueSoonList.reduce((sum, c) => sum + c.pendingBalance, 0);
            if (subTab === "fin_client_credits") return finClientCreditsList.reduce((sum, c) => sum + c.pendingBalance, 0);
            if (subTab === "fin_credit_payments") return finCreditPaymentsList.reduce((sum, c) => sum + c.pending, 0);
            if (subTab === "fin_payment_history") return finPaymentHistoryList.reduce((sum, p) => sum + p.amount, 0);
            if (subTab === "fin_cash_movements") return finCashMovementsList.reduce((sum, m) => sum + (m.tipo === "INGRESO" ? m.monto : -m.monto), 0);
        }
        if (mainTab === "PROVEEDORES") {
            if (subTab === "supp_purchases") return supplierPurchasesSummaryList.reduce((sum, s) => sum + s.totalSpent, 0);
            if (subTab === "supp_min_prices") return supplierMinPricesList.reduce((sum, p) => sum + p.minPrice, 0);
            if (subTab === "supp_price_comparison") return supplierPriceComparisonList.reduce((sum, c) => sum + (c.quantity * c.precioCosto), 0);
            if (subTab === "supp_purchase_details") return supplierPurchaseDetailsList.reduce((sum, d) => sum + d.subtotal, 0);
        }
        return 0;
    }, [
        mainTab,
        subTab,
        kardexValorizadoList,
        kardexMovimientoList,
        kardexPorProductoList,
        filteredDailySales,
        filteredEmployeeSales,
        filteredClientSales,
        saleDetailsList,
        filteredTopProducts,
        filteredProfitSales,
        finProductProfitList,
        finClientBalancesList,
        finCreditsDueSoonList,
        finClientCreditsList,
        finCreditPaymentsList,
        finPaymentHistoryList,
        finCashMovementsList,
        supplierPurchasesSummaryList,
        supplierMinPricesList,
        supplierPriceComparisonList,
        supplierPurchaseDetailsList
    ]);

    // Resumen financiero general
    const financeTotalsSummary = useMemo(() => {
        const totalSalesRevenue = dailySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
        const totalPendingReceivable = dailySales
            .filter(s => (s.saleType || '').toLowerCase() === 'credito' || (s.paymentStatus || '').toLowerCase() === 'pendiente')
            .reduce((sum, s) => sum + Number(s.pendingBalance !== undefined ? s.pendingBalance : (Number(s.total || 0) - Number(s.amountPaid || 0))), 0);
        const totalPaymentsCollected = clientPayments.reduce((sum, p) => sum + Number(p.amount || p.monto || 0), 0);
        const totalProfitEstimated = finProductProfitList.reduce((sum, p) => sum + p.totalProfit, 0);

        return {
            totalSalesRevenue,
            totalPendingReceivable,
            totalPaymentsCollected,
            totalProfitEstimated,
        };
    }, [dailySales, clientPayments, finProductProfitList]);

    // Exportación a Excel / CSV
    const handleExportExcel = () => {
        if (!currentList || currentList.length === 0) {
            alert("No hay registros para exportar en este filtro.");
            return;
        }

        let csvContent = "\uFEFF"; // UTF-8 BOM
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
        } else if (subTab === "supp_purchases") {
            headers = ["PRIMERA COMPRA", "ULTIMA COMPRA", "PROVEEDOR", "CANTIDAD COMPRAS", "TOTAL GASTADO"];
            rows = currentList.map(r => [
                r.firstPurchaseFormatted,
                r.lastPurchaseFormatted,
                `"${(r.supplierName || '').replace(/"/g, '""')}"`,
                r.purchaseCount,
                r.totalSpent.toFixed(2),
            ]);
        } else if (subTab === "supp_min_prices") {
            headers = ["PRODUCTO", "PRECIO MINIMO", "PROVEEDOR MEJOR PRECIO", "COMPROBANTE", "LOTE", "FECHA REGISTRO", "PRECIO MAXIMO", "AHORRO ESTIMADO"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                r.minPrice.toFixed(2),
                `"${(r.bestSupplierName || '').replace(/"/g, '""')}"`,
                r.invoiceNumber,
                r.lotNumber,
                r.purchaseDateFormatted,
                r.maxPrice.toFixed(2),
                `S/ ${r.savings.toFixed(2)} (${r.savingsPercent}%)`
            ]);
        } else if (subTab === "supp_price_comparison") {
            headers = ["PRODUCTO", "PROVEEDOR", "COMPROBANTE", "FECHA", "CANTIDAD", "PRECIO COSTO", "LOTE", "COMPARACION VS MINIMO"];
            rows = currentList.map(r => [
                `"${(r.productName || '').replace(/"/g, '""')}"`,
                `"${(r.supplierName || '').replace(/"/g, '""')}"`,
                r.invoiceNumber,
                r.purchaseDateFormatted,
                r.quantity,
                r.precioCosto.toFixed(2),
                r.lotNumber,
                r.isBestPrice ? "Mejor Precio" : `+S/ ${r.diff.toFixed(2)} (+${r.diffPercent}%)`
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
                r.subtotal.toFixed(2)
            ]);
        } else if (subTab === "fin_credits_due") {
            headers = ["COMPROBANTE", "CLIENTE", "FECHA EMISION", "FECHA VENCIMIENTO", "DIAS RESTANTES", "TOTAL", "PAGADO", "SALDO PENDIENTE", "ESTADO"];
            rows = currentList.map(r => [
                r.receipt,
                `"${r.client.replace(/"/g, '""')}"`,
                r.dateTime,
                r.dueDate,
                r.isOverdue ? `Mora (${Math.abs(r.daysLeft)}d)` : `${r.daysLeft} días`,
                r.total.toFixed(2),
                r.amountPaid.toFixed(2),
                r.pendingBalance.toFixed(2),
                r.isOverdue ? "VENCIDO" : "POR VENCER"
            ]);
        } else if (subTab === "fin_profit_product") {
            headers = ["PRODUCTO", "PRESENTACION", "CANTIDAD VENDIDA", "VENTA TOTAL", "COSTO TOTAL", "UTILIDAD", "MARGEN %"];
            rows = currentList.map(r => [
                `"${r.productName.replace(/"/g, '""')}"`,
                r.presentationName,
                r.totalQuantity,
                r.totalRevenue.toFixed(2),
                r.totalCost.toFixed(2),
                r.totalProfit.toFixed(2),
                `${r.marginPercent}%`
            ]);
        } else if (subTab === "fin_client_balances") {
            headers = ["CLIENTE", "DOCUMENTO", "TELEFONO", "VENTAS CREDITO", "TOTAL CREDITO", "TOTAL COBRADO", "SALDO PENDIENTE"];
            rows = currentList.map(r => [
                `"${r.clientName.replace(/"/g, '""')}"`,
                r.identification,
                r.phone,
                r.pendingSalesCount,
                r.totalCredit.toFixed(2),
                r.totalPaid.toFixed(2),
                r.pendingBalance.toFixed(2)
            ]);
        } else if (subTab === "fin_payment_history") {
            headers = ["RECIBO", "FECHA HORA", "CLIENTE", "COMPROBANTE AFECTADO", "MEDIO PAGO", "MONTO", "CAJERO"];
            rows = currentList.map(r => [
                r.receiptNumber,
                r.dateTime,
                `"${r.clientName.replace(/"/g, '""')}"`,
                r.saleReceipt,
                r.paymentMethod,
                r.amount.toFixed(2),
                r.employeeName
            ]);
        } else if (subTab === "fin_cash_closures") {
            headers = ["SESION", "CAJERO", "APERTURA", "CIERRE", "INICIAL", "ESPERADO", "REAL", "DIFERENCIA", "ESTADO"];
            rows = currentList.map(r => [
                `#${r.id}`,
                `"${r.cashier.replace(/"/g, '""')}"`,
                r.openDate,
                r.closeDate,
                r.initialAmount.toFixed(2),
                r.expectedAmount !== null ? r.expectedAmount.toFixed(2) : "—",
                r.actualAmount !== null ? r.actualAmount.toFixed(2) : "—",
                r.difference.toFixed(2),
                r.status
            ]);
        } else {
            headers = ["ID", "REGISTRO", "TOTAL", "SALDO"];
            rows = currentList.map((r, i) => [i + 1, r.clientName || r.productName || r.receipt || r.supplierName || "Item", (r.total || r.monto || r.totalSpent || 0).toFixed(2), (r.pendingBalance || 0).toFixed(2)]);
        }

        csvContent += headers.join(";") + "\n";
        rows.forEach(row => {
            csvContent += row.join(";") + "\n";
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_${subTab}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintReport = () => {
        window.print();
    };

    return (
        <div className="reports-page-container w-100 min-vh-100 py-3 px-3 px-md-4">
            {/* 1. Header Gerencial Unificado */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                    <div className="report-header-icon rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-sm">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-uppercase fw-bold text-secondary" style={{ fontSize: "0.68rem", letterSpacing: "1px" }}>
                            BUSINESS INTELLIGENCE • MÓDULO GERENCIAL UNIFICADO
                        </div>
                        <h4 className="m-0 fw-black text-dark" style={{ letterSpacing: "-0.5px" }}>
                            Análisis Estratégico
                        </h4>
                    </div>
                </div>

                {/* Botones PDF y Excel */}
                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePrintReport}
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

            {/* 2. Pestañas Principales Superiores (VENTAS, PROVEEDORES, INVENTARIO, FINANZAS, etc.) */}
            <div className="main-tabs-wrapper d-flex gap-2 mb-3 overflow-x-auto pb-1">
                {mainModules.map((mod) => (
                    <button
                        key={mod}
                        type="button"
                        className={`btn-main-tab ${mainTab === mod ? "active" : ""}`}
                        onClick={() => handleMainTabChange(mod)}
                    >
                        {mod}
                    </button>
                ))}
            </div>

            {/* 3. Sub-pestañas: según si está en VENTAS o en FINANZAS */}
            {mainTab === "VENTAS" && (
                <div className="sub-tabs-wrapper d-flex gap-2 mb-4 overflow-x-auto pb-1">
                    {salesSubTabs.map((tab) => (
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
            )}

            {/* Sub-pestañas para PROVEEDORES (Coincidentes con la captura) */}
            {mainTab === "PROVEEDORES" && (
                <div className="sub-tabs-wrapper d-flex gap-2 mb-4 overflow-x-auto pb-1">
                    {supplierSubTabs.map((tab) => (
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
            )}

            {/* Sub-pestañas para KARDEX (Coincidentes con las 3 capturas) */}
            {mainTab === "KARDEX" && (
                <div className="sub-tabs-wrapper d-flex gap-2 mb-4 overflow-x-auto pb-1">
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
                            <span className="me-1">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {mainTab === "FINANZAS" && (
                <>
                    {/* Sub-pestañas exactas de FINANZAS */}
                    <div className="sub-tabs-wrapper d-flex gap-2 mb-4 overflow-x-auto pb-1">
                        {financeSubTabs.map((tab) => (
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

                    {/* Resumen Ejecutivo de Finanzas */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="payment-icon-wrap bg-purple-subtle text-purple">
                                        <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>$</span>
                                    </div>
                                    <div>
                                        <span className="payment-title text-secondary fw-bold">VENTAS TOTALES</span>
                                        <h5 className="m-0 fw-black text-dark">
                                            S/ {financeTotalsSummary.totalSalesRevenue.toFixed(2)}
                                        </h5>
                                    </div>
                                </div>
                                <span className="text-muted small">{dailySales.length} transac.</span>
                            </div>
                        </div>

                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="payment-icon-wrap bg-emerald-subtle text-emerald">
                                        <span style={{ fontSize: "1.1rem" }}>📈</span>
                                    </div>
                                    <div>
                                        <span className="payment-title text-secondary fw-bold">UTILIDAD BRUTA</span>
                                        <h5 className="m-0 fw-black text-emerald">
                                            S/ {financeTotalsSummary.totalProfitEstimated.toFixed(2)}
                                        </h5>
                                    </div>
                                </div>
                                <span className="online-dot"></span>
                            </div>
                        </div>

                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="payment-icon-wrap bg-rose-subtle text-rose">
                                        <span style={{ fontSize: "1.1rem" }}>⏱️</span>
                                    </div>
                                    <div>
                                        <span className="payment-title text-secondary fw-bold">POR COBRAR (CARTERA)</span>
                                        <h5 className="m-0 fw-black text-rose">
                                            S/ {financeTotalsSummary.totalPendingReceivable.toFixed(2)}
                                        </h5>
                                    </div>
                                </div>
                                <span className="badge bg-rose-light text-rose small">Créditos</span>
                            </div>
                        </div>

                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="payment-icon-wrap bg-blue-subtle text-blue">
                                        <span style={{ fontSize: "1.1rem" }}>💵</span>
                                    </div>
                                    <div>
                                        <span className="payment-title text-secondary fw-bold">COBRANZAS RECUPERADAS</span>
                                        <h5 className="m-0 fw-black text-dark">
                                            S/ {financeTotalsSummary.totalPaymentsCollected.toFixed(2)}
                                        </h5>
                                    </div>
                                </div>
                                <span className="text-muted small">{clientPayments.length} abonos</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 4. Métodos de pago (en Ventas Diarias) */}
            {mainTab === "VENTAS" && subTab === "daily" && (
                <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                <div className="payment-icon-wrap bg-purple-subtle text-purple">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                        <line x1="12" y1="18" x2="12.01" y2="18" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="payment-title text-secondary fw-bold">YAPE</span>
                                    <h5 className="m-0 fw-black text-dark">
                                        S/ {Number(salesSummary ? salesSummary.yapeAmount : 0).toFixed(2)}
                                    </h5>
                                </div>
                            </div>
                            <span className="text-muted small">{salesSummary ? salesSummary.yapeCount : 0} oper.</span>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                <div className="payment-icon-wrap bg-cyan-subtle text-cyan">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                        <line x1="12" y1="18" x2="12.01" y2="18" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="payment-title text-secondary fw-bold">PLIN</span>
                                    <h5 className="m-0 fw-black text-dark">
                                        S/ {Number(salesSummary ? salesSummary.plinAmount : 0).toFixed(2)}
                                    </h5>
                                </div>
                            </div>
                            <span className="text-muted small">{salesSummary ? salesSummary.plinCount : 0} oper.</span>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card-payment active-efectivo bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                <div className="payment-icon-wrap bg-emerald-subtle text-emerald">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="6" width="20" height="12" rx="2" />
                                        <circle cx="12" cy="12" r="2" />
                                        <path d="M6 12h.01M18 12h.01" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="payment-title text-secondary fw-bold">EFECTIVO</span>
                                    <h5 className="m-0 fw-black text-dark">
                                        S/ {Number(salesSummary ? salesSummary.efectivoAmount : 0).toFixed(2)}
                                    </h5>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <span className="text-muted small">{salesSummary ? salesSummary.efectivoCount : 0} oper.</span>
                                <span className="online-dot"></span>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-3">
                                <div className="payment-icon-wrap bg-blue-subtle text-blue">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="5" width="20" height="14" rx="2" />
                                        <line x1="2" y1="10" x2="22" y2="10" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="payment-title text-secondary fw-bold">TARJETA</span>
                                    <h5 className="m-0 fw-black text-dark">
                                        S/ {Number(salesSummary ? salesSummary.tarjetaAmount : 0).toFixed(2)}
                                    </h5>
                                </div>
                            </div>
                            <span className="text-muted small">{salesSummary ? salesSummary.tarjetaCount : 0} oper.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Barra de Filtros (Exacta a la captura) */}
            <div className="bg-white rounded-3 border p-3.5 shadow-sm mb-4">
                <div className="row g-3 align-items-center">
                    {/* Buscador dinámico */}
                    <div className="col-12 col-lg-5">
                        <div className="position-relative">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#64748b"
                                strokeWidth="2"
                                className="position-absolute top-50 start-0 translate-middle-y ms-3"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder={searchConfig.placeholder}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="form-control form-control-sm ps-5 bg-light border-0 shadow-none"
                                style={{ borderRadius: "8px", fontSize: "0.82rem" }}
                            />
                        </div>
                        <div className="text-secondary small mt-1 ms-1" style={{ fontSize: "0.68rem" }}>
                            • BÚSQUEDA: {searchConfig.label}
                        </div>
                    </div>

                    {/* Selector de Días / Fechas y Limpiar Filtros */}
                    <div className="col-12 col-lg-7 d-flex flex-wrap align-items-center justify-content-lg-end gap-2.5">
                        {mainTab === "KARDEX" ? (
                            <>
                                {subTab === "kardex_valorizado" && (
                                    <>
                                        <div className="d-flex align-items-center gap-1">
                                            <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>DESDE:</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="form-control form-control-sm border bg-light shadow-none"
                                                style={{ fontSize: "0.76rem", width: "135px" }}
                                            />
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>HASTA:</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => {
                                                    setEndDate(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="form-control form-control-sm border bg-light shadow-none"
                                                style={{ fontSize: "0.76rem", width: "135px" }}
                                            />
                                        </div>
                                        <div className="d-flex align-items-center gap-1.5">
                                            <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>TIPO:</span>
                                            <select
                                                value={movementTypeFilter}
                                                onChange={(e) => {
                                                    setMovementTypeFilter(e.target.value);
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
                                    </>
                                )}

                                {subTab === "kardex_movimiento" && (
                                    <>
                                        <div className="d-flex align-items-center gap-1">
                                            <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>DESDE:</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="form-control form-control-sm border bg-light shadow-none"
                                                style={{ fontSize: "0.76rem", width: "135px" }}
                                            />
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>HASTA:</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => {
                                                    setEndDate(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="form-control form-control-sm border bg-light shadow-none"
                                                style={{ fontSize: "0.76rem", width: "135px" }}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        ) : mainTab === "PROVEEDORES" ? (
                            <>
                                <div className="d-flex align-items-center gap-1">
                                    <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>DESDE:</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="form-control form-control-sm border bg-light shadow-none"
                                        style={{ fontSize: "0.76rem", width: "135px" }}
                                    />
                                </div>
                                <div className="d-flex align-items-center gap-1">
                                    <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>HASTA:</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="form-control form-control-sm border bg-light shadow-none"
                                        style={{ fontSize: "0.76rem", width: "135px" }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="d-flex align-items-center gap-1.5">
                                    <span className="small text-secondary fw-bold" style={{ fontSize: "0.72rem" }}>DÍAS:</span>
                                    <select
                                        value={daysFilter}
                                        onChange={(e) => {
                                            setDaysFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="form-select form-select-sm border bg-light shadow-none fw-semibold"
                                        style={{ fontSize: "0.78rem", minWidth: "115px", borderRadius: "8px" }}
                                    >
                                        <option value="today">Hoy</option>
                                        <option value="7">7 días</option>
                                        <option value="15">15 días</option>
                                        <option value="30">30 días</option>
                                        <option value="month">Este mes</option>
                                        <option value="all">Todos</option>
                                        <option value="custom">Personalizado</option>
                                    </select>
                                </div>

                                {daysFilter === "custom" && (
                                    <>
                                        <div className="d-flex align-items-center gap-1">
                                            <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>DESDE:</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="form-control form-control-sm border bg-light shadow-none"
                                                style={{ fontSize: "0.76rem", width: "130px" }}
                                            />
                                        </div>
                                        <div className="d-flex align-items-center gap-1">
                                            <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>HASTA:</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="form-control form-control-sm border bg-light shadow-none"
                                                style={{ fontSize: "0.76rem", width: "130px" }}
                                            />
                                        </div>
                                    </>
                                )}

                                {mainTab === "VENTAS" && subTab === "daily" && (
                                    <div className="d-flex align-items-center gap-1.5">
                                        <span className="small text-secondary fw-semibold" style={{ fontSize: "0.72rem" }}>ESTADO:</span>
                                        <select
                                            value={paymentStatusFilter}
                                            onChange={(e) => {
                                                setPaymentStatusFilter(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="form-select form-select-sm border bg-light shadow-none"
                                            style={{ fontSize: "0.76rem", width: "115px" }}
                                        >
                                            <option value="TODOS">TODOS</option>
                                            <option value="PAGADO">PAGADO</option>
                                            <option value="PENDIENTE">PENDIENTE</option>
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="btn btn-sm btn-link text-secondary text-decoration-none fw-semibold d-flex align-items-center gap-1 p-1"
                            style={{ fontSize: "0.74rem" }}
                            title="Restablecer filtros"
                        >
                            <span>⊗</span>
                            <span>LIMPIAR FILTROS</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 6. Contenedor de Datos: Tablas o Estado Vacío */}
            <div className="bg-white rounded-3 border shadow-sm overflow-hidden mb-4">
                {loading ? (
                    <div className="p-5 text-center">
                        <div className="spinner-border text-orange-custom" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
                            <span className="visually-hidden">Cargando reporte...</span>
                        </div>
                        <p className="text-secondary small mt-2 mb-0">Calculando indicadores y métricas del sistema...</p>
                    </div>
                ) : paginatedItems.length === 0 ? (
                    /* ESTADO VACÍO EXACTO DE LA CAPTURA */
                    <div className="p-5 text-center my-4">
                        <div className="empty-search-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
                            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                        <h5 className="fw-black text-secondary m-0" style={{ letterSpacing: "1.5px", fontSize: "1.1rem" }}>
                            SIN RESULTADOS
                        </h5>
                        <p className="text-muted small mt-1 mb-0" style={{ letterSpacing: "1px", fontSize: "0.72rem" }}>
                            PRUEBE A CAMBIAR LOS PARÁMETROS DE BÚSQUEDA
                        </p>
                        {(search || daysFilter !== "all" || startDate || endDate) && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="btn btn-sm btn-outline-secondary mt-3 rounded-pill px-3 fw-semibold"
                                style={{ fontSize: "0.75rem" }}
                            >
                                Ver todos los registros
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-responsive">
                        {/* ========================================================
                            TABLAS PARA EL MÓDULO DE KARDEX
                           ======================================================== */}

                        {/* KARDEX 1: KARDEX VALORIZADO (Screenshot 1) */}
                        {mainTab === "KARDEX" && subTab === "kardex_valorizado" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>FECHA</th>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>CATEGORIA</th>
                                        <th>TIPO MOVIMIENTO</th>
                                        <th className="text-center">CANTIDAD</th>
                                        <th>COSTO UNITARIO</th>
                                        <th>COSTO TOTAL</th>
                                        <th>PRECIO VENTA</th>
                                        <th>TOTAL VENTA</th>
                                        <th>REFERENCIA</th>
                                        <th>LOTE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="small text-secondary" style={{ whiteSpace: "nowrap" }}>
                                                • {item.dateFormatted}
                                            </td>
                                            <td className="fw-bold text-dark" style={{ minWidth: "220px" }}>
                                                {item.productName}
                                            </td>
                                            <td className="small text-secondary fw-semibold">
                                                {item.barcode}
                                            </td>
                                            <td className="small text-secondary" style={{ maxWidth: "200px" }}>
                                                {item.category}
                                            </td>
                                            <td>
                                                <span className={`badge-badge fw-bold ${item.movementType === "ENTRADA" ? "bg-teal-subtle text-teal" : "bg-rose-light text-rose"}`}>
                                                    {item.movementType}
                                                </span>
                                            </td>
                                            <td className="text-center fw-bold">
                                                <span
                                                    className="d-inline-block rounded-circle me-1.5"
                                                    style={{
                                                        width: "7px",
                                                        height: "7px",
                                                        backgroundColor: item.movementType === "ENTRADA" ? "#10b981" : "#f59e0b",
                                                    }}
                                                ></span>
                                                <span>{item.quantity}</span>
                                            </td>
                                            <td className="text-secondary fw-semibold">
                                                S/ {item.unitCost.toFixed(2)}
                                            </td>
                                            <td className="fw-bold text-orange-custom">
                                                S/ {item.totalCost.toFixed(2)}
                                            </td>
                                            <td className="text-secondary fw-semibold">
                                                {item.unitSalePrice !== null ? `S/ ${item.unitSalePrice.toFixed(2)}` : "—"}
                                            </td>
                                            <td className="fw-bold text-orange-custom">
                                                {item.totalSalePrice !== null ? `S/ ${item.totalSalePrice.toFixed(2)}` : "—"}
                                            </td>
                                            <td className="small text-secondary fw-semibold">
                                                {item.reference}
                                            </td>
                                            <td className="small text-secondary">
                                                {item.lotNumber}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* KARDEX 2: KARDEX MOVIMIENTO (Screenshot 2) */}
                        {mainTab === "KARDEX" && subTab === "kardex_movimiento" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>FECHA</th>
                                        <th>USUARIO</th>
                                        <th>NUMERO COMPROBANTE</th>
                                        <th>CLIENTE</th>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th className="text-center">CANTIDAD VENDIDO</th>
                                        <th>PRECIO COMPRA</th>
                                        <th>TOTAL COMPRA</th>
                                        <th>PRECIO VENTA</th>
                                        <th>TOTAL VENTA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="small text-secondary" style={{ whiteSpace: "nowrap" }}>
                                                • {item.dateFormatted}
                                            </td>
                                            <td className="small text-secondary fw-bold">
                                                {item.userName}
                                            </td>
                                            <td className="small fw-bold text-secondary">
                                                {item.receiptNumber}
                                            </td>
                                            <td className="small text-secondary">
                                                {item.clientName}
                                            </td>
                                            <td className="fw-bold text-dark" style={{ minWidth: "200px" }}>
                                                {item.productName}
                                            </td>
                                            <td className="small text-secondary fw-semibold">
                                                {item.barcode}
                                            </td>
                                            <td className="text-center fw-bold">
                                                <span
                                                    className="d-inline-block rounded-circle me-1.5"
                                                    style={{
                                                        width: "7px",
                                                        height: "7px",
                                                        backgroundColor: "#f59e0b",
                                                    }}
                                                ></span>
                                                <span>{item.quantitySold}</span>
                                            </td>
                                            <td className="text-secondary fw-semibold">
                                                S/ {item.precioCompra.toFixed(2)}
                                            </td>
                                            <td className="fw-bold text-orange-custom">
                                                S/ {item.totalCompra.toFixed(2)}
                                            </td>
                                            <td className="text-secondary fw-semibold">
                                                S/ {item.precioVenta.toFixed(2)}
                                            </td>
                                            <td className="fw-bold text-orange-custom">
                                                S/ {item.totalVenta.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* KARDEX 3: KARDEX POR PRODUCTO (Screenshot 3) */}
                        {mainTab === "KARDEX" && subTab === "kardex_producto" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRODUCTO</th>
                                        <th>CODIGO BARRAS</th>
                                        <th>CATEGORIA</th>
                                        <th className="text-center">STOCK TOTAL</th>
                                        <th className="text-center">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="fw-bold text-dark" style={{ minWidth: "260px" }}>
                                                {item.productName}
                                            </td>
                                            <td className="small text-secondary fw-semibold">
                                                {item.barcode}
                                            </td>
                                            <td className="small text-secondary" style={{ maxWidth: "350px" }}>
                                                {item.category}
                                            </td>
                                            <td className="text-center fw-bold">
                                                <span
                                                    className="d-inline-block rounded-circle me-1.5"
                                                    style={{
                                                        width: "8px",
                                                        height: "8px",
                                                        backgroundColor: item.stockTotal > 10 ? "#10b981" : "#f59e0b",
                                                    }}
                                                ></span>
                                                <span>{item.stockTotal}</span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedProductKardexModal(item)}
                                                    className="btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-semibold text-orange-custom"
                                                    style={{
                                                        fontSize: "0.74rem",
                                                        borderColor: "#fed7aa",
                                                        backgroundColor: "#fff7ed",
                                                        border: "1px solid #fed7aa",
                                                        transition: "all 0.15s ease"
                                                    }}
                                                    title="Ver movimientos históricos de kardex para este producto"
                                                >
                                                    <span style={{ fontSize: "0.8rem" }}>⏱️</span>
                                                    <span>Movimientos</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* ========================================================
                            TABLAS PARA EL MÓDULO DE FINANZAS
                           ======================================================== */}

                        {/* FIN 1: GANANCIA POR PRODUCTO */}
                        {mainTab === "FINANZAS" && subTab === "fin_profit_product" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>PRODUCTO</th>
                                        <th>PRESENTACIÓN</th>
                                        <th className="text-center">CANT. VENDIDA</th>
                                        <th className="text-end">VENTA TOTAL</th>
                                        <th className="text-end">COSTO TOTAL</th>
                                        <th className="text-end">UTILIDAD NETA</th>
                                        <th className="text-center">MARGEN %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((prod, idx) => (
                                        <tr key={idx}>
                                            <td className="text-muted small">{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                                            <td className="fw-bold text-dark">{prod.productName}</td>
                                            <td><span className="badge-badge bg-light text-secondary border">{prod.presentationName}</span></td>
                                            <td className="text-center fw-semibold">{prod.totalQuantity}</td>
                                            <td className="text-end fw-bold text-dark">S/ {prod.totalRevenue.toFixed(2)}</td>
                                            <td className="text-end text-muted">S/ {prod.totalCost.toFixed(2)}</td>
                                            <td className="text-end fw-black text-emerald">S/ {prod.totalProfit.toFixed(2)}</td>
                                            <td className="text-center">
                                                <span className={`badge-badge ${prod.marginPercent >= 30 ? "bg-emerald-light text-emerald" : "bg-amber-light text-amber"} fw-bold`}>
                                                    {prod.marginPercent}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* FIN 2: SALDOS DE CLIENTES */}
                        {mainTab === "FINANZAS" && subTab === "fin_client_balances" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>CLIENTE</th>
                                        <th>DOCUMENTO</th>
                                        <th>TELÉFONO</th>
                                        <th className="text-center">COMPROBANTES PEND.</th>
                                        <th className="text-end">TOTAL CRÉDITO</th>
                                        <th className="text-end">AMORTIZADO</th>
                                        <th className="text-end">SALDO PENDIENTE</th>
                                        <th className="text-center">ESTADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((cli, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-bold text-dark">{cli.clientName}</td>
                                            <td className="small text-secondary">{cli.identification}</td>
                                            <td className="small text-secondary">{cli.phone}</td>
                                            <td className="text-center">
                                                <span className="badge-badge bg-light border text-dark">{cli.pendingSalesCount}</span>
                                            </td>
                                            <td className="text-end text-dark">S/ {cli.totalCredit.toFixed(2)}</td>
                                            <td className="text-end text-emerald fw-semibold">S/ {cli.totalPaid.toFixed(2)}</td>
                                            <td className="text-end fw-black text-rose">S/ {cli.pendingBalance.toFixed(2)}</td>
                                            <td className="text-center">
                                                <span className={`badge-badge ${cli.pendingBalance > 0 ? "bg-rose-light text-rose" : "bg-emerald-light text-emerald"} fw-bold`}>
                                                    {cli.pendingBalance > 0 ? "CON SALDO" : "AL DÍA"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* FIN 3: CRÉDITOS POR VENCER (Captura principal) */}
                        {mainTab === "FINANZAS" && subTab === "fin_credits_due" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>COMPROBANTE</th>
                                        <th>CLIENTE</th>
                                        <th>FECHA EMISIÓN</th>
                                        <th>FECHA VENCIMIENTO</th>
                                        <th className="text-center">DÍAS RESTANTES</th>
                                        <th className="text-end">TOTAL VENTA</th>
                                        <th className="text-end">PAGADO</th>
                                        <th className="text-end">SALDO PENDIENTE</th>
                                        <th className="text-center">ESTADO</th>
                                        <th className="text-center">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((cred) => (
                                        <tr key={cred.id}>
                                            <td className="fw-bold small text-secondary">{cred.receipt}</td>
                                            <td className="fw-semibold text-dark">{cred.client}</td>
                                            <td className="small text-secondary">• {cred.dateTime}</td>
                                            <td className="small fw-bold text-dark">{cred.dueDate}</td>
                                            <td className="text-center">
                                                {cred.isOverdue ? (
                                                    <span className="badge-badge bg-rose-light text-rose fw-bold">
                                                        MORA ({Math.abs(cred.daysLeft)} d)
                                                    </span>
                                                ) : cred.daysLeft === 0 ? (
                                                    <span className="badge-badge bg-rose-light text-rose fw-bold">
                                                        ¡VENCE HOY!
                                                    </span>
                                                ) : (
                                                    <span className={`badge-badge ${cred.daysLeft <= 7 ? "bg-amber-light text-amber" : "bg-blue-subtle text-blue"} fw-bold`}>
                                                        {cred.daysLeft} días
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-end text-dark">S/ {cred.total.toFixed(2)}</td>
                                            <td className="text-end text-emerald fw-semibold">S/ {cred.amountPaid.toFixed(2)}</td>
                                            <td className="text-end fw-black text-rose">S/ {cred.pendingBalance.toFixed(2)}</td>
                                            <td className="text-center">
                                                <span className={`badge-badge ${cred.isOverdue ? "bg-rose-light text-rose" : "bg-amber-light text-amber"} fw-bold`}>
                                                    {cred.isOverdue ? "VENCIDO" : "POR VENCER"}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn-action-icon text-teal"
                                                    onClick={() => handleOpenTicket(cred.sale)}
                                                    title="Ver e Imprimir Comprobante"
                                                >
                                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="6 9 6 2 18 2 18 9" />
                                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                                        <rect x="6" y="14" width="12" height="8" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* FIN 4: CRÉDITOS CLIENTES */}
                        {mainTab === "FINANZAS" && subTab === "fin_client_credits" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>COMPROBANTE</th>
                                        <th>CLIENTE</th>
                                        <th>VENDEDOR</th>
                                        <th>EMISIÓN</th>
                                        <th>VENCIMIENTO</th>
                                        <th className="text-end">TOTAL</th>
                                        <th className="text-end">COBRADO</th>
                                        <th className="text-end">SALDO PENDIENTE</th>
                                        <th className="text-center">ESTADO</th>
                                        <th className="text-center">TICKET</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((cred) => (
                                        <tr key={cred.id}>
                                            <td className="fw-bold small text-secondary">{cred.receipt}</td>
                                            <td className="fw-semibold text-dark">{cred.client}</td>
                                            <td className="small text-secondary">{cred.seller}</td>
                                            <td className="small text-secondary">{cred.dateTime}</td>
                                            <td className="small fw-bold text-dark">{cred.dueDate}</td>
                                            <td className="text-end text-dark">S/ {cred.total.toFixed(2)}</td>
                                            <td className="text-end text-emerald fw-semibold">S/ {cred.amountPaid.toFixed(2)}</td>
                                            <td className="text-end fw-black text-rose">S/ {cred.pendingBalance.toFixed(2)}</td>
                                            <td className="text-center">
                                                <span className={`badge-badge ${cred.status === "PAGADO" ? "bg-emerald-light text-emerald" : "bg-rose-light text-rose"} fw-bold`}>
                                                    {cred.status}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn-action-icon text-teal"
                                                    onClick={() => handleOpenTicket(cred.sale)}
                                                    title="Ver ticket"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="6 9 6 2 18 2 18 9" />
                                                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                                        <rect x="6" y="14" width="12" height="8" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* FIN 5: CRÉDITO Y PAGOS (AMORTIZACIONES) */}
                        {mainTab === "FINANZAS" && subTab === "fin_credit_payments" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>COMPROBANTE</th>
                                        <th>CLIENTE</th>
                                        <th>FECHA VENTA</th>
                                        <th className="text-end">TOTAL CRÉDITO</th>
                                        <th className="text-end">TOTAL ABONADO</th>
                                        <th className="text-end">SALDO RESTANTE</th>
                                        <th className="text-center" style={{ width: "160px" }}>% AMORTIZACIÓN</th>
                                        <th className="text-center">ESTADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="fw-bold small text-secondary">{item.receipt}</td>
                                            <td className="fw-semibold text-dark">{item.client}</td>
                                            <td className="small text-secondary">{item.dateTime}</td>
                                            <td className="text-end text-dark">S/ {item.total.toFixed(2)}</td>
                                            <td className="text-end text-emerald fw-bold">S/ {item.paid.toFixed(2)}</td>
                                            <td className="text-end text-rose fw-black">S/ {item.pending.toFixed(2)}</td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="progress flex-grow-1" style={{ height: "6px" }}>
                                                        <div
                                                            className={`progress-bar ${item.percentPaid === 100 ? "bg-success" : "bg-orange-custom"}`}
                                                            style={{ width: `${item.percentPaid}%` }}
                                                        />
                                                    </div>
                                                    <span className="small fw-bold text-secondary" style={{ fontSize: "0.72rem" }}>
                                                        {item.percentPaid}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge-badge ${item.pending <= 0 ? "bg-emerald-light text-emerald" : "bg-amber-light text-amber"} fw-bold`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* FIN 6: HISTORIAL DE PAGOS */}
                        {mainTab === "FINANZAS" && subTab === "fin_payment_history" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>N° RECIBO</th>
                                        <th>FECHA HORA</th>
                                        <th>CLIENTE</th>
                                        <th>COMPROBANTE AFECTADO</th>
                                        <th>MEDIO DE PAGO</th>
                                        <th>REFERENCIA</th>
                                        <th className="text-end">MONTO COBRADO</th>
                                        <th>ATENDIDO POR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((pay) => (
                                        <tr key={pay.id}>
                                            <td className="fw-bold small text-secondary">{pay.receiptNumber}</td>
                                            <td className="small text-secondary">• {pay.dateTime}</td>
                                            <td className="fw-bold text-dark">{pay.clientName}</td>
                                            <td><span className="badge-badge bg-light border text-dark">{pay.saleReceipt}</span></td>
                                            <td><span className="badge-badge bg-emerald-light text-emerald fw-bold">{pay.paymentMethod}</span></td>
                                            <td className="small text-muted">{pay.reference}</td>
                                            <td className="text-end fw-black text-emerald">S/ {pay.amount.toFixed(2)}</td>
                                            <td className="small text-secondary">{pay.employeeName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* FIN 7: CIERRES DE CAJA */}
                        {mainTab === "FINANZAS" && subTab === "fin_cash_closures" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>SESIÓN</th>
                                        <th>CAJERO</th>
                                        <th>FECHA APERTURA</th>
                                        <th>FECHA CIERRE</th>
                                        <th className="text-end">MONTO INICIAL</th>
                                        <th className="text-end">ESPERADO</th>
                                        <th className="text-end">REAL DECLARADO</th>
                                        <th className="text-end">DIFERENCIA</th>
                                        <th className="text-center">ESTADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((cs) => (
                                        <tr key={cs.id}>
                                            <td className="fw-bold text-secondary">Sesión #{cs.id}</td>
                                            <td className="fw-bold text-dark">{cs.cashier}</td>
                                            <td className="small text-secondary">{cs.openDate}</td>
                                            <td className="small text-secondary">{cs.closeDate}</td>
                                            <td className="text-end text-dark">S/ {cs.initialAmount.toFixed(2)}</td>
                                            <td className="text-end text-dark">{cs.expectedAmount !== null ? `S/ ${cs.expectedAmount.toFixed(2)}` : "—"}</td>
                                            <td className="text-end fw-bold text-dark">{cs.actualAmount !== null ? `S/ ${cs.actualAmount.toFixed(2)}` : "—"}</td>
                                            <td className="text-end fw-black">
                                                {cs.difference === 0 ? (
                                                    <span className="text-emerald">S/ 0.00 (Cuadrada)</span>
                                                ) : cs.difference < 0 ? (
                                                    <span className="text-rose">S/ {cs.difference.toFixed(2)} (Faltante)</span>
                                                ) : (
                                                    <span className="text-blue">S/ +{cs.difference.toFixed(2)} (Sobrante)</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge-badge ${cs.status === "ABIERTA" ? "bg-emerald-light text-emerald" : "bg-light border text-secondary"} fw-bold`}>
                                                    {cs.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* FIN 8: MOVIMIENTOS DE CAJA */}
                        {mainTab === "FINANZAS" && subTab === "fin_cash_movements" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>FECHA HORA</th>
                                        <th>TIPO</th>
                                        <th>CONCEPTO</th>
                                        <th>SESIÓN</th>
                                        <th>RESPONSABLE</th>
                                        <th className="text-end">MONTO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((m) => (
                                        <tr key={m.id}>
                                            <td className="text-secondary small">#{m.id}</td>
                                            <td className="small text-secondary">• {m.dateTime}</td>
                                            <td>
                                                <span className={`badge-badge ${m.tipo === "INGRESO" ? "bg-emerald-light text-emerald" : "bg-rose-light text-rose"} fw-bold`}>
                                                    {m.tipo}
                                                </span>
                                            </td>
                                            <td className="fw-bold text-dark">{m.concepto}</td>
                                            <td className="small text-secondary">{m.sessionId}</td>
                                            <td className="small text-secondary">{m.usuario}</td>
                                            <td className={`text-end fw-black ${m.tipo === "INGRESO" ? "text-emerald" : "text-rose"}`}>
                                                {m.tipo === "INGRESO" ? "+ S/ " : "- S/ "} {m.monto.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* ========================================================
                            TABLAS PARA EL MÓDULO DE VENTAS
                           ======================================================== */}

                        {mainTab === "VENTAS" && subTab === "daily" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>FECHA HORA</th>
                                        <th>USUARIO</th>
                                        <th>COMPROBANTE</th>
                                        <th>CLIENTE</th>
                                        <th>METODO PAGO</th>
                                        <th>CONDICION PAGO</th>
                                        <th>ESTADO PAGO</th>
                                        <th className="text-end">MONTO</th>
                                        <th className="text-center">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((sale) => {
                                        const dateStr = sale.dateTime || sale.fechaHora || "";
                                        const cashier = sale.employeeName || sale.empleadoNombre || "Admin";
                                        const receipt = (sale.series || sale.serie || "T001") + "-" + (sale.receiptNumber || sale.numComprobante || sale.id);
                                        const client = sale.clientName || sale.clienteNombre || "Público General";
                                        const method = sale.paymentMethodName || sale.formaPagoNombre || "EFECTIVO";
                                        const condition = (sale.saleType || sale.tipoVenta || "contado").toLowerCase();
                                        const status = (sale.paymentStatus || sale.estadoPago || "PAGADO").toUpperCase();
                                        const total = Number(sale.total || 0).toFixed(2);

                                        return (
                                            <tr key={sale.id}>
                                                <td className="small text-secondary">• {dateStr}</td>
                                                <td className="fw-semibold small text-dark">{cashier}</td>
                                                <td className="fw-bold small text-secondary">{receipt}</td>
                                                <td className="small text-dark">{client}</td>
                                                <td><span className="badge-badge bg-emerald-light text-emerald fw-bold">{method}</span></td>
                                                <td><span className="badge-badge bg-light border text-dark text-capitalize">{condition}</span></td>
                                                <td><span className={`badge-badge ${status === "PAGADO" ? "bg-emerald-light text-emerald" : "bg-rose-light text-rose"} fw-bold`}>{status}</span></td>
                                                <td className="text-end fw-black text-dark">S/ {total}</td>
                                                <td className="text-center">
                                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                                        <button type="button" className="btn-action-icon text-teal" onClick={() => handleOpenTicket(sale)} title="Imprimir Ticket">
                                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="6 9 6 2 18 2 18 9" />
                                                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                                                <rect x="6" y="14" width="12" height="8" />
                                                            </svg>
                                                        </button>
                                                        <button type="button" className="btn-action-icon text-secondary" onClick={() => setViewSaleModal(sale)} title="Ver detalles">
                                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="12" y1="16" x2="12" y2="12" />
                                                                <line x1="12" y1="8" x2="12.01" y2="8" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}

                        {mainTab === "VENTAS" && subTab === "employee" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>EMPLEADO</th>
                                        <th>COMPROBANTE</th>
                                        <th>FECHA</th>
                                        <th className="text-end">TOTAL VENTA</th>
                                        <th className="text-end">COMISIÓN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((emp, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-bold text-dark">{emp.employeeName}</td>
                                            <td className="small text-secondary">{emp.receiptNumber || "—"}</td>
                                            <td className="small text-secondary">{emp.dateTime || "—"}</td>
                                            <td className="text-end fw-bold text-dark">S/ {Number(emp.totalSold || 0).toFixed(2)}</td>
                                            <td className="text-end fw-bold text-emerald">S/ {Number(emp.totalCommission || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {mainTab === "VENTAS" && subTab === "client" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>CLIENTE</th>
                                        <th>DOCUMENTO</th>
                                        <th className="text-center">TOTAL COMPRAS</th>
                                        <th className="text-end">TOTAL GASTADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((cli, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-bold text-dark">{cli.clientName}</td>
                                            <td className="small text-secondary">{cli.clientDocument || "—"}</td>
                                            <td className="text-center"><span className="badge-badge bg-light border text-dark">{cli.salesCount}</span></td>
                                            <td className="text-end fw-black text-dark">S/ {Number(cli.totalSpent || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {mainTab === "VENTAS" && subTab === "details" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>FECHA HORA</th>
                                        <th>COMPROBANTE</th>
                                        <th>PRODUCTO</th>
                                        <th>PRESENTACIÓN</th>
                                        <th className="text-center">CANTIDAD</th>
                                        <th className="text-end">PRECIO UNIT.</th>
                                        <th className="text-end">SUBTOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((det, idx) => (
                                        <tr key={idx}>
                                            <td className="small text-secondary">• {det.dateStr}</td>
                                            <td className="fw-bold small text-secondary">{det.receipt}</td>
                                            <td className="fw-bold text-dark">{det.productName}</td>
                                            <td><span className="badge-badge bg-light border text-secondary">{det.presentationName}</span></td>
                                            <td className="text-center fw-semibold">{det.quantity}</td>
                                            <td className="text-end text-dark">S/ {det.unitPrice.toFixed(2)}</td>
                                            <td className="text-end fw-black text-dark">S/ {det.subtotal.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {mainTab === "VENTAS" && subTab === "top" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th># RANK</th>
                                        <th>PRODUCTO</th>
                                        <th className="text-center">UNIDADES VENDIDAS</th>
                                        <th className="text-end">INGRESOS TOTALES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <span className={`badge-rank ${idx === 0 ? "rank-gold" : idx === 1 ? "rank-silver" : idx === 2 ? "rank-bronze" : "rank-default"}`}>
                                                    #{idx + 1}
                                                </span>
                                            </td>
                                            <td className="fw-bold text-dark">{item.productName}</td>
                                            <td className="text-center fw-bold">{item.totalQuantitySold} uds</td>
                                            <td className="text-end fw-black text-dark">S/ {Number(item.totalRevenue || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {mainTab === "VENTAS" && subTab === "profit" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>FECHA</th>
                                        <th>COMPROBANTE</th>
                                        <th>VENDEDOR</th>
                                        <th className="text-end">VENTA TOTAL</th>
                                        <th className="text-end">UTILIDAD NETA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedItems.map((prof, idx) => (
                                        <tr key={idx}>
                                            <td className="small text-secondary">• {prof.dateTime}</td>
                                            <td className="fw-bold small text-secondary">{prof.receiptNumber}</td>
                                            <td className="fw-semibold text-dark">{prof.employeeName}</td>
                                            <td className="text-end text-dark">S/ {Number(prof.totalSale || 0).toFixed(2)}</td>
                                            <td className="text-end fw-black text-emerald">S/ {Number(prof.totalProfit || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* ========================================================
                            TABLAS PARA EL MÓDULO DE PROVEEDORES
                           ======================================================== */}

                        {/* PROV 1: COMPRAS PROVEEDOR (Exacto a la captura) */}
                        {mainTab === "PROVEEDORES" && subTab === "supp_purchases" && (
                            <table className="table table-hover align-middle mb-0 custom-report-table">
                                <thead className="table-light">
                                    <tr>
                                        <th>PRIMERA COMPRA</th>
                                        <th>ULTIMA COMPRA</th>
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

                        {/* PROV 2: PRECIOS MÍNIMOS */}
                        {mainTab === "PROVEEDORES" && subTab === "supp_min_prices" && (
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

                        {/* PROV 3: COMPARATIVO PRECIOS */}
                        {mainTab === "PROVEEDORES" && subTab === "supp_price_comparison" && (
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

                        {/* PROV 4: COMPRA - DETALLE COMPRA */}
                        {mainTab === "PROVEEDORES" && subTab === "supp_purchase_details" && (
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

                {/* 7. Footer de Paginación y Resultados (Exacto a la captura) */}
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

            {/* 8. Barra de Resumen KPI Inferior (Exacta a la captura) */}
            <div className="bg-white rounded-3 border p-3.5 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-4 mb-3">
                <div className="d-flex flex-wrap align-items-center gap-4 gap-md-5">
                    <div>
                        <div className="text-uppercase text-muted fw-bold" style={{ fontSize: "0.68rem", letterSpacing: "0.08em" }}>
                            RESUMEN DE DATOS
                        </div>
                        <div className="d-flex align-items-baseline gap-1.5 mt-0.5">
                            <span className="fw-black text-dark fs-4">{totalRecords}</span>
                            <span className="text-secondary small" style={{ fontSize: "0.78rem" }}>registros encontrados</span>
                        </div>
                    </div>

                    <div className="border-start ps-4 ps-md-5">
                        <div className="text-uppercase text-muted fw-bold" style={{ fontSize: "0.68rem", letterSpacing: "0.08em" }}>
                            VISUALIZACIÓN
                        </div>
                        <div className="text-secondary small mt-0.5" style={{ fontSize: "0.82rem" }}>
                            Mostrando página <strong className="text-dark">{currentPage}</strong> de <strong className="text-dark">{totalPages}</strong>
                        </div>
                    </div>

                    {mainTab === "KARDEX" ? (
                        subTab === "kardex_movimiento" ? (
                            <>
                                <div className="border-start ps-4 ps-md-5">
                                    <div className="text-uppercase text-muted fw-bold" style={{ fontSize: "0.68rem", letterSpacing: "0.08em" }}>
                                        COMPRAS ACUMULADAS
                                    </div>
                                    <div className="fw-black text-orange-custom fs-3 mt-0.5" style={{ letterSpacing: "-0.5px" }}>
                                        S/ {totalComprasAcumuladas.toFixed(2)}
                                    </div>
                                </div>

                                <div className="border-start ps-4 ps-md-5">
                                    <div className="text-uppercase text-muted fw-bold" style={{ fontSize: "0.68rem", letterSpacing: "0.08em" }}>
                                        VENTAS ACUMULADAS
                                    </div>
                                    <div className="fw-black text-blue fs-3 mt-0.5" style={{ letterSpacing: "-0.5px" }}>
                                        S/ {totalVentasAcumuladas.toFixed(2)}
                                    </div>
                                </div>
                            </>
                        ) : null
                    ) : (
                        <div className="border-start ps-4 ps-md-5">
                            <div className="text-uppercase text-muted fw-bold" style={{ fontSize: "0.68rem", letterSpacing: "0.08em" }}>
                                MONTO ACUMULADO
                            </div>
                            <div className="fw-black text-orange-custom fs-3 mt-0.5" style={{ letterSpacing: "-0.5px" }}>
                                S/ {totalMontoAcumulado.toFixed(2)}
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-end ms-auto">
                    <div className="d-flex align-items-center justify-content-end gap-2 mb-0.5">
                        <span className="online-dot"></span>
                        <span className="fw-bold text-dark text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
                            BASE DE DATOS CONECTADA
                        </span>
                    </div>
                    <div className="text-muted text-uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}>
                        SISFARMACIA V8.3.4 INTELLIGENCE ENGINE
                    </div>
                </div>
            </div>

            {/* Modal de Movimientos Históricos de Kardex por Producto */}
            {selectedProductKardexModal && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3"
                    onClick={() => setSelectedProductKardexModal(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-[850px] overflow-hidden animate-in fade-in zoom-in-95 p-4 p-md-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
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

                        <div className="d-flex justify-content-end pt-2 border-top">
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
            )}

            {/* Modal de Compras Detalladas del Proveedor */}
            {selectedSupplierPurchasesModal && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3"
                    onClick={() => setSelectedSupplierPurchasesModal(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-[650px] overflow-hidden animate-in fade-in zoom-in-95 p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
                            <div>
                                <div className="text-uppercase text-muted small fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                                    HISTORIAL DE ÓRDENES DE COMPRA
                                </div>
                                <h5 className="fw-bold text-dark m-0">
                                    {selectedSupplierPurchasesModal.supplierName}
                                </h5>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setSelectedSupplierPurchasesModal(null)}
                            />
                        </div>

                        <div className="d-flex align-items-center justify-content-between mb-3 p-2.5 bg-light rounded-3">
                            <div className="small text-secondary">
                                <strong>Órdenes Registradas:</strong> {selectedSupplierPurchasesModal.purchaseCount}
                            </div>
                            <div className="fw-bold text-orange-custom">
                                Total Acumulado: S/ {selectedSupplierPurchasesModal.totalSpent.toFixed(2)}
                            </div>
                        </div>

                        <div className="table-responsive mb-3 border rounded-2" style={{ maxHeight: "300px", overflowY: "auto" }}>
                            <table className="table table-sm table-hover mb-0">
                                <thead className="table-light small">
                                    <tr>
                                        <th>Fecha Compra</th>
                                        <th>Factura / Comprobante</th>
                                        <th className="text-center">Ítems</th>
                                        <th className="text-end">Monto Total</th>
                                    </tr>
                                </thead>
                                <tbody className="small">
                                    {(selectedSupplierPurchasesModal.purchases || []).map((p, i) => (
                                        <tr key={i}>
                                            <td className="small text-secondary">• {formatDateTime(p.purchaseDate || p.fechaCompra)}</td>
                                            <td className="fw-bold small text-secondary">{p.invoiceNumber || `FAC-${p.id}`}</td>
                                            <td className="text-center">{p.details ? p.details.length : 1}</td>
                                            <td className="text-end fw-bold text-dark">S/ {Number(p.total || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-end pt-2 border-top">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary px-4 fw-semibold"
                                onClick={() => setSelectedSupplierPurchasesModal(null)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Ticket de Comprobante */}
            {selectedSaleForTicket && (
                <ReceiptTicketModal
                    isOpen={isTicketOpen}
                    onClose={() => {
                        setIsTicketOpen(false);
                        setSelectedSaleForTicket(null);
                    }}
                    saleData={selectedSaleForTicket}
                />
            )}

            {/* Modal de Detalle de Venta */}
            {viewSaleModal && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3"
                    onClick={() => setViewSaleModal(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-[550px] overflow-hidden animate-in fade-in zoom-in-95 p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="d-flex justify-content-between align-items-center pb-3 border-bottom mb-3">
                            <h5 className="fw-bold text-dark m-0">
                                Comprobante {viewSaleModal.series || viewSaleModal.serie || "T001"}-{viewSaleModal.receiptNumber || viewSaleModal.numComprobante || viewSaleModal.id}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setViewSaleModal(null)}
                            />
                        </div>

                        <div className="small mb-3 space-y-1">
                            <div><strong>Fecha:</strong> {viewSaleModal.dateTime || viewSaleModal.fechaHora}</div>
                            <div><strong>Cliente:</strong> {viewSaleModal.clientName || viewSaleModal.clienteNombre || "Público General"}</div>
                            <div><strong>Atendido por:</strong> {viewSaleModal.employeeName || viewSaleModal.empleadoNombre || "Admin"}</div>
                            <div><strong>Método de Pago:</strong> {viewSaleModal.paymentMethodName || viewSaleModal.formaPagoNombre}</div>
                        </div>

                        <div className="table-responsive mb-3 border rounded-2">
                            <table className="table table-sm mb-0">
                                <thead className="table-light small">
                                    <tr>
                                        <th>Producto</th>
                                        <th className="text-center">Cant</th>
                                        <th className="text-end">P.U.</th>
                                        <th className="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="small">
                                    {(viewSaleModal.details || []).map((d, i) => (
                                        <tr key={i}>
                                            <td className="text-uppercase">{d.productName || d.nombreProducto}</td>
                                            <td className="text-center">{d.presentationQuantity || d.cantidad || 1}</td>
                                            <td className="text-end">S/ {Number(d.presentationUnitPrice || d.precioUnitario || 0).toFixed(2)}</td>
                                            <td className="text-end fw-bold">S/ {Number(d.subtotal || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                            <h5 className="fw-black text-dark m-0">TOTAL: S/ {Number(viewSaleModal.total || 0).toFixed(2)}</h5>
                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setViewSaleModal(null)}
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-teal-action text-white fw-bold"
                                    onClick={() => {
                                        const sale = viewSaleModal;
                                        setViewSaleModal(null);
                                        handleOpenTicket(sale);
                                    }}
                                >
                                    Imprimir Comprobante
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Estilos UI Exactos para la pantalla de Análisis Estratégico */}
            <style>{`
                .reports-page-container {
                    background-color: #f8fafc;
                }
                .report-header-icon {
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                }
                .fw-black {
                    font-weight: 900;
                }
                .btn-main-tab {
                    background: transparent;
                    border: 1px solid #cbd5e1;
                    border-radius: 20px;
                    padding: 5px 16px;
                    font-size: 0.76rem;
                    font-weight: 700;
                    color: #475569;
                    letter-spacing: 0.04em;
                    transition: all 0.2s ease;
                }
                .btn-main-tab:hover {
                    background-color: #f1f5f9;
                    color: #0f172a;
                }
                .btn-main-tab.active {
                    background-color: #ffffff;
                    border-color: #ea580c;
                    color: #ea580c;
                    box-shadow: 0 2px 6px rgba(234, 88, 12, 0.15);
                }
                .btn-sub-tab {
                    background: transparent;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 6px 14px;
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: #64748b;
                    display: inline-flex;
                    align-items: center;
                    white-space: nowrap;
                    transition: all 0.15s ease;
                }
                .btn-sub-tab:hover {
                    background-color: #f1f5f9;
                    color: #1e293b;
                }
                .btn-sub-tab.active {
                    background-color: #f97316;
                    border-color: #f97316;
                    color: #ffffff;
                    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
                }
                .card-payment {
                    transition: all 0.2s ease;
                }
                .card-payment:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
                }
                .active-efectivo {
                    border: 2px solid #10b981 !important;
                    background-color: #ffffff !important;
                }
                .payment-icon-wrap {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .payment-title {
                    font-size: 0.72rem;
                    letter-spacing: 0.05em;
                }
                .bg-purple-subtle { background-color: #f3e8ff; }
                .text-purple { color: #9333ea; }
                .bg-cyan-subtle { background-color: #e0f2fe; }
                .text-cyan { color: #0284c7; }
                .bg-emerald-subtle { background-color: #d1fae5; }
                .text-emerald { color: #059669; }
                .bg-blue-subtle { background-color: #dbeafe; }
                .text-blue { color: #2563eb; }
                .bg-rose-subtle { background-color: #ffe4e6; }
                .text-rose { color: #e11d48; }
                .text-teal { color: #005f60; }
                .bg-teal-subtle { background-color: #ccfbf1; }
                .text-orange-custom { color: #ea580c; }
                .bg-orange-custom { background-color: #ea580c; }
                .online-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #10b981;
                    box-shadow: 0 0 6px #10b981;
                }
                .custom-report-table th {
                    font-size: 0.72rem;
                    font-weight: 700;
                    letter-spacing: 0.03em;
                    color: #64748b;
                    padding: 10px 12px;
                }
                .custom-report-table td {
                    padding: 10px 12px;
                    font-size: 0.8rem;
                }
                .badge-badge {
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                }
                .bg-emerald-light { background-color: #d1fae5; }
                .bg-rose-light { background-color: #ffe4e6; }
                .bg-amber-light { background-color: #fef3c7; }
                .text-amber { color: #d97706; }
                .btn-action-icon {
                    background: transparent;
                    border: none;
                    padding: 4px;
                    border-radius: 6px;
                    transition: 0.15s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-action-icon:hover {
                    background-color: #e6f4f1;
                }
                .badge-rank {
                    font-weight: 800;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }
                .rank-gold {
                    background: linear-gradient(135deg, #fef08a 0%, #facc15 100%);
                    color: #854d0e;
                    box-shadow: 0 2px 4px rgba(250, 204, 21, 0.4);
                }
                .rank-silver {
                    background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
                    color: #334155;
                }
                .rank-bronze {
                    background: linear-gradient(135deg, #fed7aa 0%, #fb923c 100%);
                    color: #7c2d12;
                }
                .rank-default {
                    background-color: #f1f5f9;
                    color: #64748b;
                }
                .btn-outline-teal {
                    color: #005f60;
                    border-color: #005f60;
                }
                .btn-outline-teal:hover {
                    background-color: #005f60;
                    color: #fff;
                }
                .btn-teal-action {
                    background-color: #005f60;
                }

                /* Círculo Estado Vacío (Captura) */
                .empty-search-circle {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background-color: #f1f5f9;
                }
            `}</style>
        </div>
    );
};
