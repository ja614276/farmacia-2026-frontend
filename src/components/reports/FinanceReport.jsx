import React, { useState, useMemo } from "react";
import { isDateInFilter, downloadCSV } from "./reportUtils.js";
import { ReceiptTicketModal } from "../ReceiptTicketModal.jsx";

export const FinanceReport = ({
    clientDebtors = [],
    clientPayments = [],
    cashSessions = [],
    cashMovements = [],
    dailySales = [],
    loading = false,
}) => {
    const financeSubTabs = [
        { id: "fin_profit_product", label: "Ganancia por Producto" },
        { id: "fin_client_balances", label: "Saldos de Clientes" },
        { id: "fin_credits_due", label: "Créditos por Vencer" },
        { id: "fin_client_credits", label: "Créditos Clientes" },
        { id: "fin_credit_payments", label: "Crédito y pagos" },
        { id: "fin_payment_history", label: "Historial de Pagos" },
        { id: "fin_cash_closures", label: "Cierres de Caja" },
        { id: "fin_cash_movements", label: "Movimientos de Caja" },
    ];

    const [subTab, setSubTab] = useState("fin_credits_due");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [daysFilter, setDaysFilter] = useState("all");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal de Ticket
    const [selectedSaleForTicket, setSelectedSaleForTicket] = useState(null);
    const [isTicketOpen, setIsTicketOpen] = useState(false);

    const handleOpenTicket = (sale) => {
        if (!sale) return;
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

    // 1. Ganancia por Producto
    const finProductProfitList = useMemo(() => {
        const map = new Map();
        dailySales.forEach(sale => {
            if (!isDateInFilter(sale.dateTime || sale.fechaHora, daysFilter, startDate, endDate)) return;
            if (sale.details && Array.isArray(sale.details)) {
                sale.details.forEach(d => {
                    const name = d.productName || d.nombreProducto || "Producto";
                    const qty = Number(d.presentationQuantity || d.cantidad || 1);
                    const sub = Number(d.subtotal || (qty * (d.presentationUnitPrice || 0)));
                    const costUnit = Number(d.baseUnitCost || 0);
                    const totalCost = costUnit > 0 ? (costUnit * qty) : (sub * 0.70);
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
                clientName: d.clientName || d.clienteNombre || "Cliente General",
                identification: d.identification || d.clientDocument || d.dni || "—",
                phone: d.phone || d.telefono || "—",
                totalCredit: totalCred,
                totalPaid: paid,
                pendingBalance: pending,
                pendingSalesCount: d.pendingSalesCount || d.creditSalesCount || 1,
            };
        });

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(c =>
                c.clientName.toLowerCase().includes(q) ||
                c.identification.toLowerCase().includes(q) ||
                c.phone.toLowerCase().includes(q)
            );
        }

        return list.sort((a, b) => b.pendingBalance - a.pendingBalance);
    }, [clientDebtors, search]);

    // 3. Créditos por Vencer
    const finCreditsDueList = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const list = [];
        dailySales.forEach(s => {
            const isCredit = (s.saleType || s.tipoVenta || "").toLowerCase() === "credito" ||
                (s.paymentStatus || s.estadoPago || "").toUpperCase() === "PENDIENTE" ||
                Number(s.pendingBalance || 0) > 0;

            if (!isCredit) return;
            if (!isDateInFilter(s.dateTime || s.fechaHora, daysFilter, startDate, endDate)) return;

            const total = Number(s.total || 0);
            const paid = Number(s.amountPaid || s.montoPagado || 0);
            const pending = Number(s.pendingBalance !== undefined ? s.pendingBalance : (total - paid));
            if (pending <= 0) return;

            const dateStr = s.dateTime || s.fechaHora || "";
            const dueDateStr = s.dueDate || s.fechaVencimiento || dateStr;

            let daysLeft = 0;
            let isOverdue = false;
            if (dueDateStr) {
                const dueObj = new Date(String(dueDateStr).replace(" ", "T"));
                if (!isNaN(dueObj.getTime())) {
                    const diff = dueObj.getTime() - now.getTime();
                    daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
                    isOverdue = daysLeft < 0;
                }
            }

            const receipt = (s.series || s.serie || "T001") + "-" + (s.receiptNumber || s.numComprobante || s.id);
            const client = s.clientName || s.clienteNombre || "Público General";

            if (search.trim()) {
                const q = search.toLowerCase();
                if (!client.toLowerCase().includes(q) && !receipt.toLowerCase().includes(q)) return;
            }

            list.push({
                id: s.id,
                receipt,
                client,
                dateTime: dateStr ? String(dateStr).slice(0, 16) : "—",
                dueDate: dueDateStr ? String(dueDateStr).slice(0, 10) : "—",
                daysLeft,
                isOverdue,
                total,
                amountPaid: paid,
                pendingBalance: pending,
                status: isOverdue ? "VENCIDO" : "POR VENCER",
                sale: s,
            });
        });

        return list.sort((a, b) => a.daysLeft - b.daysLeft);
    }, [dailySales, daysFilter, search, startDate, endDate]);

    // 4. Créditos Clientes
    const finClientCreditsList = useMemo(() => {
        const list = [];
        dailySales.forEach(s => {
            const isCredit = (s.saleType || s.tipoVenta || "").toLowerCase() === "credito";
            if (!isCredit) return;
            if (!isDateInFilter(s.dateTime || s.fechaHora, daysFilter, startDate, endDate)) return;

            const total = Number(s.total || 0);
            const paid = Number(s.amountPaid || s.montoPagado || 0);
            const pending = Number(s.pendingBalance !== undefined ? s.pendingBalance : (total - paid));
            const receipt = (s.series || s.serie || "T001") + "-" + (s.receiptNumber || s.numComprobante || s.id);
            const client = s.clientName || s.clienteNombre || "Público General";
            const seller = s.employeeName || s.empleadoNombre || "Admin";

            if (search.trim()) {
                const q = search.toLowerCase();
                if (!client.toLowerCase().includes(q) && !receipt.toLowerCase().includes(q) && !seller.toLowerCase().includes(q)) return;
            }

            list.push({
                id: s.id,
                receipt,
                client,
                seller,
                dateTime: s.dateTime || s.fechaHora || "—",
                dueDate: s.dueDate || s.fechaVencimiento || "—",
                total,
                amountPaid: paid,
                pendingBalance: pending,
                status: pending <= 0 ? "PAGADO" : "PENDIENTE",
                sale: s,
            });
        });

        return list.sort((a, b) => b.id - a.id);
    }, [dailySales, daysFilter, search, startDate, endDate]);

    // 5. Crédito y Pagos
    const finCreditPaymentsList = useMemo(() => {
        const list = [];
        dailySales.forEach(s => {
            const isCredit = (s.saleType || s.tipoVenta || "").toLowerCase() === "credito";
            if (!isCredit) return;
            if (!isDateInFilter(s.dateTime || s.fechaHora, daysFilter, startDate, endDate)) return;

            const total = Number(s.total || 0);
            const paid = Number(s.amountPaid || s.montoPagado || 0);
            const pending = Math.max(0, total - paid);
            const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;
            const receipt = (s.series || s.serie || "T001") + "-" + (s.receiptNumber || s.numComprobante || s.id);
            const client = s.clientName || s.clienteNombre || "Cliente";

            if (search.trim()) {
                const q = search.toLowerCase();
                if (!client.toLowerCase().includes(q) && !receipt.toLowerCase().includes(q)) return;
            }

            list.push({
                id: s.id,
                receipt,
                client,
                dateTime: s.dateTime || s.fechaHora || "—",
                total,
                paid,
                pending,
                percentPaid,
                status: pending <= 0 ? "LIQUIDADO" : "EN PAGO",
                sale: s,
            });
        });

        return list.sort((a, b) => b.pending - a.pending);
    }, [dailySales, daysFilter, search, startDate, endDate]);

    // 6. Historial de Pagos
    const finPaymentHistoryList = useMemo(() => {
        let list = clientPayments.filter(p => {
            if (!isDateInFilter(p.dateTime || p.fechaHora, daysFilter, startDate, endDate)) return false;
            if (search.trim()) {
                const q = search.toLowerCase();
                const cli = (p.clientName || p.clienteNombre || "").toLowerCase();
                const rec = (p.receiptNumber || p.numRecibo || "").toLowerCase();
                const method = (p.paymentMethodName || p.formaPago || "").toLowerCase();
                return cli.includes(q) || rec.includes(q) || method.includes(q);
            }
            return true;
        }).map(p => ({
            id: p.id,
            receiptNumber: p.receiptNumber || `REC-${p.id}`,
            dateTime: p.dateTime || p.fechaHora || "—",
            clientName: p.clientName || p.clienteNombre || "Cliente",
            saleReceipt: p.saleReceipt || (p.saleId ? `VENTA #${p.saleId}` : "Amortización"),
            paymentMethod: p.paymentMethodName || p.formaPago || "EFECTIVO",
            amount: Number(p.amount || p.monto || 0),
            employeeName: p.employeeName || p.cajero || "Cajero",
            reference: p.reference || p.referencia || "—",
        }));

        return list.sort((a, b) => b.id - a.id);
    }, [clientPayments, daysFilter, search, startDate, endDate]);

    // 7. Cierres de Caja
    const finCashClosuresList = useMemo(() => {
        let list = cashSessions.filter(cs => {
            if (!isDateInFilter(cs.openDate || cs.fechaApertura, daysFilter, startDate, endDate)) return false;
            if (search.trim()) {
                const q = search.toLowerCase();
                const cashier = (cs.cashierName || cs.usuario || "").toLowerCase();
                const idStr = String(cs.id);
                return cashier.includes(q) || idStr.includes(q);
            }
            return true;
        }).map(cs => {
            const init = Number(cs.initialAmount || cs.montoInicial || 0);
            const expected = cs.expectedAmount !== undefined ? Number(cs.expectedAmount) : null;
            const actual = cs.actualAmount !== undefined ? Number(cs.actualAmount) : null;
            const diff = actual !== null && expected !== null ? (actual - expected) : 0;
            return {
                id: cs.id,
                cashier: cs.cashierName || cs.usuario || "Admin",
                openDate: String(cs.openDate || cs.fechaApertura || "—").slice(0, 16),
                closeDate: cs.closeDate || cs.fechaCierre ? String(cs.closeDate || cs.fechaCierre).slice(0, 16) : "En Curso",
                initialAmount: init,
                expectedAmount: expected,
                actualAmount: actual,
                difference: diff,
                status: (cs.status || "CERRADA").toUpperCase(),
            };
        });

        return list.sort((a, b) => b.id - a.id);
    }, [cashSessions, daysFilter, search, startDate, endDate]);

    // 8. Movimientos de Caja
    const finCashMovementsList = useMemo(() => {
        let list = cashMovements.filter(m => {
            if (!isDateInFilter(m.fechaHora, daysFilter, startDate, endDate)) return false;
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

    // Totales ejecutivos de Finanzas
    const financeTotalsSummary = useMemo(() => {
        const totalSalesRevenue = dailySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
        const totalPendingReceivable = dailySales
            .filter(s => (s.saleType || "").toLowerCase() === "credito" || (s.paymentStatus || "").toUpperCase() === "PENDIENTE")
            .reduce((sum, s) => sum + Number(s.pendingBalance !== undefined ? s.pendingBalance : (Number(s.total || 0) - Number(s.amountPaid || 0))), 0);
        const totalPaymentsCollected = clientPayments.reduce((sum, p) => sum + Number(p.amount || p.monto || 0), 0);
        const totalProfitEstimated = finProductProfitList.reduce((sum, p) => sum + Number(p.totalProfit || 0), 0);

        return {
            totalSalesRevenue,
            totalPendingReceivable,
            totalPaymentsCollected,
            totalProfitEstimated,
        };
    }, [dailySales, clientPayments, finProductProfitList]);

    // Lista activa
    const currentList = useMemo(() => {
        switch (subTab) {
            case "fin_profit_product": return finProductProfitList;
            case "fin_client_balances": return finClientBalancesList;
            case "fin_credits_due": return finCreditsDueList;
            case "fin_client_credits": return finClientCreditsList;
            case "fin_credit_payments": return finCreditPaymentsList;
            case "fin_payment_history": return finPaymentHistoryList;
            case "fin_cash_closures": return finCashClosuresList;
            case "fin_cash_movements": return finCashMovementsList;
            default: return finCreditsDueList;
        }
    }, [subTab, finProductProfitList, finClientBalancesList, finCreditsDueList, finClientCreditsList, finCreditPaymentsList, finPaymentHistoryList, finCashClosuresList, finCashMovementsList]);

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

        if (subTab === "fin_credits_due") {
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
            rows = currentList.map((r, i) => [i + 1, r.clientName || r.productName || r.receipt || "Item", (r.total || r.monto || 0).toFixed(2), (r.pendingBalance || 0).toFixed(2)]);
        }

        downloadCSV(`reporte_finanzas_${subTab}`, headers, rows);
    };

    const handleClearFilters = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setDaysFilter("all");
        setCurrentPage(1);
    };

    return (
        <div className="finance-report-wrapper w-100">
            {/* Header con botones PDF y Excel */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                    <span className="badge rounded-1 px-3 py-1.5 fw-bold" style={{ backgroundColor: "#09090b", color: "#ffffff", fontSize: "0.72rem" }}>
                        BALANCE FINANCIERO & CRÉDITOS
                    </span>
                    <span className="text-secondary small">
                        Cuentas por cobrar, cobranzas, flujo de caja y rentabilidad
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

            {/* Sub-pestañas de Finanzas */}
            <div className="sub-tabs-wrapper d-flex gap-2 mb-3 overflow-x-auto pb-1">
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
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Resumen Ejecutivo de Finanzas */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="payment-icon-wrap" style={{ backgroundColor: "#f4f4f5", color: "#09090b" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div>
                                <span className="payment-title text-secondary fw-bold">VENTAS TOTALES</span>
                                <h5 className="m-0 fw-bold text-dark font-monospace">
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
                            <div className="payment-icon-wrap" style={{ backgroundColor: "#f4f4f5", color: "#09090b" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                    <polyline points="17 6 23 6 23 12" />
                                </svg>
                            </div>
                            <div>
                                <span className="payment-title text-secondary fw-bold">UTILIDAD BRUTA</span>
                                <h5 className="m-0 fw-bold text-dark font-monospace">
                                    S/ {financeTotalsSummary.totalProfitEstimated.toFixed(2)}
                                </h5>
                            </div>
                        </div>
                        <span className="badge rounded-1 bg-light text-dark border small fw-bold">Margen</span>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="payment-icon-wrap" style={{ backgroundColor: "#f4f4f5", color: "#09090b" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <div>
                                <span className="payment-title text-secondary fw-bold">POR COBRAR (CARTERA)</span>
                                <h5 className="m-0 fw-bold text-dark font-monospace">
                                    S/ {financeTotalsSummary.totalPendingReceivable.toFixed(2)}
                                </h5>
                            </div>
                        </div>
                        <span className="badge rounded-1 bg-light text-dark border small fw-bold">Créditos</span>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card-payment bg-white p-3 rounded-3 shadow-sm border d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <div className="payment-icon-wrap" style={{ backgroundColor: "#f4f4f5", color: "#09090b" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <div>
                                <span className="payment-title text-secondary fw-bold">COBRANZAS RECUPERADAS</span>
                                <h5 className="m-0 fw-bold text-dark font-monospace">
                                    S/ {financeTotalsSummary.totalPaymentsCollected.toFixed(2)}
                                </h5>
                            </div>
                        </div>
                        <span className="text-muted small">{clientPayments.length} abonos</span>
                    </div>
                </div>
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
                                placeholder="Buscar cliente, comprobante, recibo, cajero, concepto..."
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
                            <span className="visually-hidden">Cargando reporte...</span>
                        </div>
                        <p className="text-secondary small mt-2 mb-0">Cargando datos financieros...</p>
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
                            No se encontraron registros financieros con los parámetros seleccionados
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        {subTab === "fin_profit_product" && (
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

                        {subTab === "fin_client_balances" && (
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
                                            <td className="text-center"><span className="badge-badge bg-light border text-dark">{cli.pendingSalesCount}</span></td>
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

                        {subTab === "fin_credits_due" && (
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
                                                    <span className="badge-badge bg-rose-light text-rose fw-bold">MORA ({Math.abs(cred.daysLeft)} d)</span>
                                                ) : cred.daysLeft === 0 ? (
                                                    <span className="badge-badge bg-rose-light text-rose fw-bold">¡VENCE HOY!</span>
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

                        {subTab === "fin_client_credits" && (
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

                        {subTab === "fin_credit_payments" && (
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

                        {subTab === "fin_payment_history" && (
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

                        {subTab === "fin_cash_closures" && (
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

                        {subTab === "fin_cash_movements" && (
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

            {/* Modal de Ticket */}
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
        </div>
    );
};
