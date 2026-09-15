import React, { useState, useMemo } from "react";
import { formatDateTime, isDateInFilter, downloadCSV } from "./reportUtils.js";
import { ReceiptTicketModal } from "../ReceiptTicketModal.jsx";

export const SalesReport = ({
    salesSummary = null,
    dailySales = [],
    employeeSales = [],
    clientSales = [],
    profitSales = [],
    topProducts = [],
    loading = false,
}) => {
    const salesSubTabs = [
        { id: "daily", label: "Ventas Diarias" },
        { id: "employee", label: "Ventas por Empleado" },
        { id: "client", label: "Ventas por Cliente" },
        { id: "details", label: "Detalle de Ventas" },
        { id: "top", label: "Top Más Vendidos" },
        { id: "profit", label: "Utilidad por Venta" },
    ];

    const [subTab, setSubTab] = useState("daily");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [daysFilter, setDaysFilter] = useState("7");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("TODOS");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modales
    const [selectedSaleForTicket, setSelectedSaleForTicket] = useState(null);
    const [isTicketOpen, setIsTicketOpen] = useState(false);
    const [viewSaleModal, setViewSaleModal] = useState(null);

    // 1. Ventas Diarias
    const filteredDailySales = useMemo(() => {
        return dailySales.filter((sale) => {
            if (!isDateInFilter(sale.dateTime || sale.fechaHora, daysFilter, startDate, endDate)) return false;
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

    // 2. Detalle de Ventas (línea por línea)
    const saleDetailsList = useMemo(() => {
        const list = [];
        dailySales.forEach(s => {
            if (!isDateInFilter(s.dateTime || s.fechaHora, daysFilter, startDate, endDate)) return;
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

    // 3. Top Productos Más Vendidos
    const filteredTopProducts = useMemo(() => {
        if (!search.trim()) return topProducts;
        const q = search.toLowerCase();
        return topProducts.filter(p => (p.productName || "").toLowerCase().includes(q));
    }, [topProducts, search]);

    // 4. Ventas por Empleado
    const filteredEmployeeSales = useMemo(() => {
        if (!search.trim()) return employeeSales;
        const q = search.toLowerCase();
        return employeeSales.filter(e =>
            (e.employeeName || "").toLowerCase().includes(q) ||
            (e.receiptNumber || "").toLowerCase().includes(q)
        );
    }, [employeeSales, search]);

    // 5. Ventas por Cliente
    const filteredClientSales = useMemo(() => {
        if (!search.trim()) return clientSales;
        const q = search.toLowerCase();
        return clientSales.filter(c => (c.clientName || "").toLowerCase().includes(q));
    }, [clientSales, search]);

    // 6. Utilidad por Venta
    const filteredProfitSales = useMemo(() => {
        if (!search.trim()) return profitSales;
        const q = search.toLowerCase();
        return profitSales.filter(p =>
            (p.employeeName || "").toLowerCase().includes(q) ||
            (p.receiptNumber || "").toLowerCase().includes(q)
        );
    }, [profitSales, search]);

    // Lista activa
    const currentList = useMemo(() => {
        switch (subTab) {
            case "daily": return filteredDailySales;
            case "employee": return filteredEmployeeSales;
            case "client": return filteredClientSales;
            case "details": return saleDetailsList;
            case "top": return filteredTopProducts;
            case "profit": return filteredProfitSales;
            default: return filteredDailySales;
        }
    }, [subTab, filteredDailySales, filteredEmployeeSales, filteredClientSales, saleDetailsList, filteredTopProducts, filteredProfitSales]);

    // Paginación
    const totalRecords = currentList.length;
    const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return currentList.slice(start, start + rowsPerPage);
    }, [currentList, currentPage, rowsPerPage]);

    // Abrir modal de ticket
    const handleOpenTicket = (sale) => {
        const ticketData = {
            id: sale.id,
            correlativo: sale.receiptNumber || sale.numComprobante || sale.id,
            fecha: sale.dateTime || sale.fechaHora || new Date().toISOString(),
            tipoComprobante: (sale.receiptTypeName || sale.tipoComprobante || "BOLETA DE VENTA").toUpperCase(),
            serie: sale.series || sale.serie || "B001",
            cajero: sale.employeeName || sale.empleadoNombre || "Cajero Principal",
            clienteNombre: sale.clientName || sale.clienteNombre || "CLIENTE VARIOS",
            clienteDocumento: sale.clientDocument || sale.clienteDocumento || "-",
            tipoVenta: sale.saleType || sale.tipoVenta || "contado",
            formaPagoNombre: sale.paymentMethodName || sale.formaPagoNombre || "EFECTIVO",
            estadoPago: sale.paymentStatus || sale.estadoPago || "PAGADO",
            total: Number(sale.total || 0),
            montoPagado: Number(sale.amountPaid || sale.montoPagado || sale.total || 0),
            cambio: Number(sale.changeAmount || sale.cambio || 0),
            items: (sale.details || []).map(d => ({
                id: d.id,
                productoNombre: d.productName || d.nombreProducto || "Producto",
                cantidad: d.presentationQuantity || d.cantidad || 1,
                precioUnitario: Number(d.presentationUnitPrice || d.precioUnitario || 0),
                subtotal: Number(d.subtotal || 0)
            }))
        };
        setSelectedSaleForTicket(ticketData);
        setIsTicketOpen(true);
    };

    // Exportación CSV
    const handleExportExcel = () => {
        if (!currentList || currentList.length === 0) {
            alert("No hay registros para exportar en este filtro.");
            return;
        }

        let headers = [];
        let rows = [];

        if (subTab === "daily") {
            headers = ["FECHA HORA", "USUARIO", "COMPROBANTE", "CLIENTE", "METODO PAGO", "CONDICION PAGO", "ESTADO PAGO", "MONTO"];
            rows = currentList.map(s => [
                s.dateTime || s.fechaHora,
                `"${(s.employeeName || s.empleadoNombre || '').replace(/"/g, '""')}"`,
                `"${(s.series || s.serie || 'T001')}-${s.receiptNumber || s.numComprobante || s.id}"`,
                `"${(s.clientName || s.clienteNombre || '').replace(/"/g, '""')}"`,
                `"${s.paymentMethodName || s.formaPagoNombre || ''}"`,
                `"${s.saleType || s.tipoVenta || ''}"`,
                s.paymentStatus || s.estadoPago,
                Number(s.total || 0).toFixed(2)
            ]);
        } else if (subTab === "employee") {
            headers = ["EMPLEADO", "COMPROBANTE", "FECHA", "TOTAL VENTA", "COMISION"];
            rows = currentList.map(e => [
                `"${(e.employeeName || '').replace(/"/g, '""')}"`,
                `"${e.receiptNumber || ''}"`,
                e.dateTime || '',
                Number(e.totalSold || 0).toFixed(2),
                Number(e.totalCommission || 0).toFixed(2)
            ]);
        } else if (subTab === "client") {
            headers = ["CLIENTE", "DOCUMENTO", "TOTAL COMPRAS", "TOTAL GASTADO"];
            rows = currentList.map(c => [
                `"${(c.clientName || '').replace(/"/g, '""')}"`,
                `"${c.clientDocument || ''}"`,
                c.salesCount,
                Number(c.totalSpent || 0).toFixed(2)
            ]);
        } else if (subTab === "details") {
            headers = ["FECHA HORA", "COMPROBANTE", "PRODUCTO", "PRESENTACION", "CANTIDAD", "PRECIO UNITARIO", "SUBTOTAL"];
            rows = currentList.map(d => [
                d.dateStr,
                `"${d.receipt}"`,
                `"${(d.productName || '').replace(/"/g, '""')}"`,
                `"${d.presentationName}"`,
                d.quantity,
                d.unitPrice.toFixed(2),
                d.subtotal.toFixed(2)
            ]);
        } else if (subTab === "top") {
            headers = ["RANKING", "PRODUCTO", "UNIDADES VENDIDAS", "INGRESOS TOTALES"];
            rows = currentList.map((t, idx) => [
                idx + 1,
                `"${(t.productName || '').replace(/"/g, '""')}"`,
                t.totalQuantitySold,
                Number(t.totalRevenue || 0).toFixed(2)
            ]);
        } else if (subTab === "profit") {
            headers = ["FECHA", "COMPROBANTE", "VENDEDOR", "VENTA TOTAL", "UTILIDAD NETA"];
            rows = currentList.map(p => [
                p.dateTime || '',
                `"${p.receiptNumber || ''}"`,
                `"${(p.employeeName || '').replace(/"/g, '""')}"`,
                Number(p.totalSale || 0).toFixed(2),
                Number(p.totalProfit || 0).toFixed(2)
            ]);
        }

        downloadCSV(`reporte_ventas_${subTab}`, headers, rows);
    };

    const handleClearFilters = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setDaysFilter("all");
        setPaymentStatusFilter("TODOS");
        setCurrentPage(1);
    };

    return (
        <div className="sales-report-wrapper w-100">
            {/* Header con botones PDF y Excel */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-1 px-3 py-1.5 fw-bold" style={{ backgroundColor: "#09090b", color: "#ffffff", fontSize: "0.72rem" }}>
                        MÓDULO DE VENTAS & FACTURACIÓN
                    </span>
                    <span className="text-secondary small">
                        Control de ingresos, rendimiento por empleado y clientes
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

            {/* Sub-pestañas de Ventas */}
            <div className="sub-tabs-wrapper d-flex gap-2 mb-3 overflow-x-auto pb-1">
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
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Métodos de Pago (en Ventas Diarias) */}
            {subTab === "daily" && (
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
                                placeholder="Buscar cliente, comprobante, empleado, método..."
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

                    {subTab === "daily" && (
                        <div className="col-6 col-md-2">
                            <div className="d-flex align-items-center gap-1.5">
                                <span className="small text-secondary fw-bold" style={{ fontSize: "0.72rem" }}>ESTADO:</span>
                                <select
                                    value={paymentStatusFilter}
                                    onChange={(e) => {
                                        setPaymentStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="form-select form-select-sm border bg-light shadow-none fw-semibold"
                                    style={{ fontSize: "0.78rem", borderRadius: "8px" }}
                                >
                                    <option value="TODOS">TODOS</option>
                                    <option value="PAGADO">PAGADO</option>
                                    <option value="PENDIENTE">PENDIENTE</option>
                                </select>
                            </div>
                        </div>
                    )}

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
                            <span className="visually-hidden">Cargando reporte...</span>
                        </div>
                        <p className="text-secondary small mt-2 mb-0">Cargando datos de ventas...</p>
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
                            No se encontraron registros de ventas con los parámetros seleccionados
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        {subTab === "daily" && (
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
                                                        <button type="button" className="btn-action-icon text-red" onClick={() => handleOpenTicket(sale)} title="Imprimir Ticket">
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

                        {subTab === "employee" && (
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

                        {subTab === "client" && (
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

                        {subTab === "details" && (
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

                        {subTab === "top" && (
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

                        {subTab === "profit" && (
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
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", zIndex: 1060 }}
                    onClick={() => setViewSaleModal(null)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
                            <div className="modal-header border-bottom py-3 px-4 bg-light" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                                <h5 className="modal-title fw-bold text-dark m-0">
                                    Comprobante {viewSaleModal.series || viewSaleModal.serie || "T001"}-{viewSaleModal.receiptNumber || viewSaleModal.numComprobante || viewSaleModal.id}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setViewSaleModal(null)}
                                />
                            </div>

                            <div className="modal-body p-4">
                                <div className="small mb-3">
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
                                </div>
                            </div>

                            <div className="modal-footer border-top py-2 px-4 bg-light" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setViewSaleModal(null)}
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-teal-action text-white fw-bold px-3"
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
        </div>
    );
};
