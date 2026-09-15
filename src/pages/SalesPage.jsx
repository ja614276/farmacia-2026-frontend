import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { findAllSales, findSaleById, removeSale } from "../services/SaleService";
import { ReceiptTicketModal } from "../components/ReceiptTicketModal";

export const SalesPage = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [userFilter, setUserFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState("TODAY"); // TODAY, ALL
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal de impresión de ticket térmico
    const [selectedSaleForTicket, setSelectedSaleForTicket] = useState(null);
    const [isTicketOpen, setIsTicketOpen] = useState(false);

    const loadSales = async () => {
        try {
            setIsLoading(true);
            const response = await findAllSales();
            setSales(response.data || []);
        } catch (error) {
            console.error("Error al cargar ventas:", error);
            Swal.fire("Error", "No se pudo obtener el historial de ventas", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSales();
    }, []);

    const handleDelete = async (sale) => {
        const receipt = `${sale.receiptType || sale.tipoComprobante || "COMPROBANTE"} ${sale.series || sale.serie || ""}-${sale.receiptNumber || sale.numComprobante || sale.id}`;

        const result = await Swal.fire({
            title: "¿Anular comprobante?",
            text: `¿Seguro que deseas anular el comprobante "${receipt}"? Esta acción revertirá la transacción.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
            confirmButtonText: "Sí, anular venta",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await removeSale(sale.id);
                setSales((prev) => prev.filter((s) => s.id !== sale.id));
                Swal.fire({
                    title: "Comprobante Anulado",
                    text: "La venta ha sido anulada correctamente en el sistema.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error("Error al anular venta:", error);
                Swal.fire("Error", "No se pudo anular la venta.", "error");
            }
        }
    };

    // Filter calculations
    const filteredSales = sales.filter((s) => {
        const query = searchTerm.toLowerCase();
        const client = (s.clientName || s.clienteNombre || "").toLowerCase();
        const receiptType = (s.receiptType || s.tipoComprobante || "").toLowerCase();
        const series = (s.series || s.serie || "").toLowerCase();
        const number = (s.receiptNumber || s.numComprobante || "").toLowerCase();
        const fullReceipt = `${receiptType} ${series}-${number}`.toLowerCase();
        const matchesQuery = fullReceipt.includes(query) || client.includes(query);

        // User filter
        const seller = (s.employeeName || s.empleadoNombre || "Admin").toLowerCase();
        const matchesUser = userFilter === "ALL" || seller.includes(userFilter.toLowerCase());

        // Date filter
        let matchesDate = true;
        if (dateFilter === "TODAY" && s.dateTime) {
            const todayStr = new Date().toISOString().slice(0, 10);
            matchesDate = s.dateTime.startsWith(todayStr);
        }

        return matchesQuery && matchesUser && matchesDate;
    });

    // KPI Metrics calculation
    const totalContado = filteredSales
        .filter((s) => (s.saleType || s.tipoVenta || "").toUpperCase() === "CONTADO")
        .reduce((acc, curr) => acc + Number(curr.total || 0), 0);

    const totalCreditos = filteredSales
        .filter((s) => (s.saleType || s.tipoVenta || "").toUpperCase() === "CREDITO")
        .reduce((acc, curr) => acc + Number(curr.total || 0), 0);

    const totalGeneral = filteredSales.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
    const totalPendienteCobro = filteredSales.reduce((acc, curr) => acc + Number(curr.pendingBalance || curr.saldoPendiente || 0), 0);

    // Pagination
    const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
    const paginatedSales = filteredSales.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Unique users for filter
    const uniqueUsers = Array.from(
        new Set(
            sales
                .map((s) => s.employeeName || s.empleadoNombre)
                .filter(Boolean)
        )
    );

    return (
        <div className="sales-monochrome-page w-full min-h-screen py-4 px-3 sm:px-6">
            {/* Header superior y controles */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div>
                    <nav aria-label="breadcrumb" className="mb-1">
                        <ol className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <li>
                                <span
                                    className="cursor-pointer text-zinc-800 hover:text-black underline"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Dashboard
                                </span>
                            </li>
                            <li className="text-zinc-400">/</li>
                            <li className="text-zinc-900 font-semibold">Ventas</li>
                        </ol>
                    </nav>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight m-0">
                        Historial de Ventas y Facturación
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5 m-0">
                        Registro y fiscalización de comprobantes emitidos, medios de pago y saldos de crédito.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                    {/* Buscador */}
                    <div className="relative min-w-[220px] sm:min-w-[260px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Buscar comprobante o cliente..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-md focus:outline-none focus:border-zinc-900 transition-colors text-zinc-900 placeholder:text-zinc-400"
                        />
                    </div>

                    {/* Filtro Usuarios */}
                    <select
                        value={userFilter}
                        onChange={(e) => {
                            setUserFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-white border border-zinc-300 text-zinc-800 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-zinc-900 cursor-pointer font-medium"
                    >
                        <option value="ALL">Todos los cajeros/usuarios</option>
                        {uniqueUsers.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>

                    {/* Segmented Filter: Hoy / Todas */}
                    <div className="inline-flex rounded-md border border-zinc-300 p-0.5 bg-zinc-100">
                        <button
                            type="button"
                            onClick={() => setDateFilter("TODAY")}
                            className={`px-3 py-1 text-xs font-semibold rounded ${
                                dateFilter === "TODAY"
                                    ? "bg-zinc-900 text-white shadow-xs"
                                    : "text-zinc-600 hover:text-zinc-900"
                            }`}
                        >
                            Ventas de Hoy
                        </button>
                        <button
                            type="button"
                            onClick={() => setDateFilter("ALL")}
                            className={`px-3 py-1 text-xs font-semibold rounded ${
                                dateFilter === "ALL"
                                    ? "bg-zinc-900 text-white shadow-xs"
                                    : "text-zinc-600 hover:text-zinc-900"
                            }`}
                        >
                            Todas
                        </button>
                    </div>

                    {/* Botón Nueva Venta */}
                    <Link
                        to="/sales/register"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Nueva Venta</span>
                    </Link>
                </div>
            </div>

            {/* BARRA CONSOLIDADA DE MÉTRICAS (SIN CARDS - FRANJA ESTRUCTURADA MONOCROMÁTICA) */}
            <div className="sales-summary-strip mb-4">
                <div className="summary-strip-cell">
                    <span className="summary-label">Total Facturado</span>
                    <span className="summary-val">
                        S/ {totalGeneral.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="summary-hint">{filteredSales.length} transacciones registradas</span>
                </div>

                <div className="summary-strip-divider"></div>

                <div className="summary-strip-cell">
                    <span className="summary-label">Ventas al Contado</span>
                    <span className="summary-val">
                        S/ {totalContado.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="summary-hint">Efectivo, tarjetas y billeteras</span>
                </div>

                <div className="summary-strip-divider"></div>

                <div className="summary-strip-cell">
                    <span className="summary-label">Ventas a Crédito</span>
                    <span className="summary-val">
                        S/ {totalCreditos.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="summary-hint">Financiamiento otorgado</span>
                </div>

                <div className="summary-strip-divider"></div>

                <div className="summary-strip-cell highlight-cell">
                    <span className="summary-label">Saldo Pendiente</span>
                    <span className="summary-val">
                        S/ {totalPendienteCobro.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="summary-hint">Por recaudar en cartera</span>
                </div>
            </div>

            {/* TABLA CORPORATIVA DE VENTAS (NO CARDS) */}
            <div className="data-table-wrapper shadow-xs">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="text-center py-16">
                            <div className="spinner-border text-dark spinner-border-sm mb-2" role="status"></div>
                            <p className="text-zinc-500 text-xs m-0">Cargando registros de ventas...</p>
                        </div>
                    ) : paginatedSales.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" className="mb-2 mx-auto">
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                                <line x1="8" y1="11" x2="14" y2="11" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <h6 className="font-bold text-zinc-900 text-sm m-0">No se encontraron ventas</h6>
                            <p className="text-zinc-500 text-xs m-0 mt-1 max-w-sm mx-auto">
                                {searchTerm
                                    ? `No hay ventas que coincidan con "${searchTerm}".`
                                    : dateFilter === "TODAY"
                                    ? "No hay transacciones registradas para el día de hoy."
                                    : "Aún no se han emitido ventas en el sistema."}
                            </p>
                            <Link
                                to="/sales/register"
                                className="inline-block mt-3 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                            >
                                + Emitir Nueva Venta
                            </Link>
                        </div>
                    ) : (
                        <table className="table table-hover align-middle m-0 enterprise-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "170px" }}>COMPROBANTE</th>
                                    <th>CLIENTE / TITULAR</th>
                                    <th style={{ width: "120px" }}>CONDICIÓN</th>
                                    <th style={{ width: "140px" }}>MEDIO DE PAGO</th>
                                    <th style={{ width: "120px" }}>TOTAL</th>
                                    <th style={{ width: "130px" }} className="text-center">ESTADO PAGO</th>
                                    <th style={{ width: "110px" }}>SALDO</th>
                                    <th style={{ width: "120px" }} className="text-end pe-3">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedSales.map((s) => {
                                    const receiptType = (s.receiptType || s.tipoComprobante || "TICKET").toUpperCase();
                                    const series = s.series || s.serie || "B001";
                                    const receiptNum = s.receiptNumber || s.numComprobante || s.id;
                                    const fullReceipt = `${series}-${receiptNum}`;

                                    const client = s.clientName || s.clienteNombre || "PÚBLICO GENERAL";
                                    const dateTime = s.dateTime || "Hoy";
                                    const formattedDate = dateTime.length > 16 ? dateTime.slice(0, 16).replace("T", " ") : dateTime;

                                    const saleType = (s.saleType || s.tipoVenta || "CONTADO").toUpperCase();
                                    const paymentMethod = s.paymentMethodName || s.medioPago || "EFECTIVO";
                                    const total = Number(s.total || 0);

                                    const payStatus = (s.paymentStatus || s.estadoPago || "PAGADO").toUpperCase();
                                    const balance = Number(s.pendingBalance || s.saldoPendiente || 0);
                                    const isPaid = payStatus === "PAGADO" || payStatus === "PAGADA" || balance <= 0.001;
                                    const isPartial = !isPaid && (payStatus === "PARCIAL" || (balance > 0 && Number(s.amountPaid || s.montoPagado || 0) > 0));

                                    return (
                                        <tr key={s.id}>
                                            {/* COMPROBANTE */}
                                            <td>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="tag-mono-receipt">{receiptType}</span>
                                                    <span className="font-mono font-bold text-zinc-900 text-xs">
                                                        {fullReceipt}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* CLIENTE / FECHA */}
                                            <td>
                                                <div className="font-semibold text-zinc-900 text-xs">
                                                    {client}
                                                </div>
                                                <div className="text-[11px] text-zinc-500 font-normal">
                                                    {formattedDate} {s.employeeName ? `· Cajero: ${s.employeeName}` : ""}
                                                </div>
                                            </td>

                                            {/* CONDICIÓN */}
                                            <td>
                                                <span className={`badge-tag ${saleType === "CREDITO" ? "tag-credit" : "tag-cash"}`}>
                                                    {saleType}
                                                </span>
                                            </td>

                                            {/* MEDIO DE PAGO */}
                                            <td>
                                                <span className="text-zinc-800 text-xs font-medium uppercase">
                                                    {paymentMethod}
                                                </span>
                                            </td>

                                            {/* TOTAL */}
                                            <td>
                                                <span className="font-bold text-zinc-900 text-xs">
                                                    S/ {total.toFixed(2)}
                                                </span>
                                            </td>

                                            {/* ESTADO DE PAGO */}
                                            <td className="text-center">
                                                {isPaid ? (
                                                    <span className="badge-tag tag-paid">
                                                        PAGADO
                                                    </span>
                                                ) : isPartial ? (
                                                    <span className="badge-tag tag-partial">
                                                        PARCIAL
                                                    </span>
                                                ) : (
                                                    <span className="badge-tag tag-pending">
                                                        PENDIENTE
                                                    </span>
                                                )}
                                            </td>

                                            {/* SALDO */}
                                            <td>
                                                <span className={`text-xs ${
                                                    !isPaid && balance > 0.001 ? "font-bold text-zinc-900" : "text-zinc-400"
                                                }`}>
                                                    S/ {isPaid ? "0.00" : balance.toFixed(2)}
                                                </span>
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="text-end pe-3">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            let saleToPrint = s;
                                                            if (!s.details || s.details.length === 0) {
                                                                try {
                                                                    const res = await findSaleById(s.id);
                                                                    if (res?.data) {
                                                                        saleToPrint = res.data;
                                                                    }
                                                                } catch (err) {
                                                                    console.error("Error al obtener detalle de la venta:", err);
                                                                }
                                                            }
                                                            setSelectedSaleForTicket(saleToPrint);
                                                            setIsTicketOpen(true);
                                                        }}
                                                        className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                                        title="Imprimir ticket térmico"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/sales/edit/${s.id}`)}
                                                        className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                                        title="Ver / Editar venta"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(s)}
                                                        className="p-1 rounded text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                                                        title="Anular venta"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                </div>

                {/* Footer: Paginación formal */}
                {!isLoading && filteredSales.length > 0 && (
                    <div className="p-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 bg-white">
                        <span className="text-[11px] text-zinc-500">
                            Mostrando {paginatedSales.length} de {filteredSales.length} comprobantes {dateFilter === "TODAY" ? "(Hoy)" : ""}
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="w-7 h-7 rounded border border-zinc-200 flex items-center justify-center text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                &lt;
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((page) => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                .map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-7 h-7 rounded text-xs font-semibold ${
                                            currentPage === page
                                                ? "bg-zinc-900 text-white"
                                                : "border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="w-7 h-7 rounded border border-zinc-200 flex items-center justify-center text-xs text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para Reimprimir Comprobante / Ticket Térmico */}
            <ReceiptTicketModal
                isOpen={isTicketOpen}
                onClose={() => setIsTicketOpen(false)}
                saleData={selectedSaleForTicket}
            />

            {/* ESTILOS MONOCROMÁTICOS DE ALTA PRECISIÓN */}
            <style>{`
                .sales-monochrome-page {
                    background-color: #fafafa;
                    color: #09090b;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }

                /* Franja de Resumen Monocromática */
                .sales-summary-strip {
                    display: flex;
                    align-items: stretch;
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .summary-strip-cell {
                    flex: 1;
                    padding: 12px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .summary-strip-divider {
                    width: 1px;
                    background-color: #e4e4e7;
                }
                .summary-label {
                    font-size: 0.68rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: #71717a;
                }
                .summary-val {
                    font-size: 1.45rem;
                    font-weight: 700;
                    color: #09090b;
                    line-height: 1.1;
                    letter-spacing: -0.02em;
                }
                .summary-hint {
                    font-size: 0.7rem;
                    color: #a1a1aa;
                }
                .highlight-cell {
                    background-color: #fcfcfc;
                }

                /* Tabla Corporativa */
                .data-table-wrapper {
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .enterprise-table thead th {
                    background-color: #f4f4f5;
                    color: #52525b;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid #e4e4e7;
                    padding: 10px 14px;
                }
                .enterprise-table tbody td {
                    padding: 10px 14px;
                    border-bottom: 1px solid #f4f4f5;
                    font-size: 0.8rem;
                }
                .enterprise-table tbody tr:hover td {
                    background-color: #fafafa;
                }

                /* Monospace Receipt Tag */
                .tag-mono-receipt {
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    font-size: 0.68rem;
                    font-weight: 700;
                    background-color: #f4f4f5;
                    border: 1px solid #e4e4e7;
                    padding: 2px 6px;
                    border-radius: 4px;
                    color: #09090b;
                }

                /* Badges Monocromáticos */
                .badge-tag {
                    font-size: 0.66rem;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    padding: 2px 7px;
                    border-radius: 4px;
                    display: inline-block;
                    white-space: nowrap;
                }
                .tag-cash {
                    background-color: #f4f4f5;
                    border: 1px solid #d4d4d8;
                    color: #09090b;
                }
                .tag-credit {
                    background-color: #09090b;
                    border: 1px solid #09090b;
                    color: #ffffff;
                }
                .tag-paid {
                    background-color: #09090b;
                    border: 1px solid #09090b;
                    color: #ffffff;
                }
                .tag-partial {
                    background-color: #27272a;
                    border: 1px solid #27272a;
                    color: #ffffff;
                }
                .tag-pending {
                    background-color: #ffffff;
                    border: 1.5px solid #09090b;
                    color: #09090b;
                }
            `}</style>
        </div>
    );
};
