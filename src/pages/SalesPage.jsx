import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { findAllSales, removeSale } from "../services/SaleService";
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
            title: "¿Anular venta?",
            text: `¿Seguro que deseas anular el comprobante "${receipt}"? Esta acción revertirá la transacción.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, anular venta",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await removeSale(sale.id);
                setSales((prev) => prev.filter((s) => s.id !== sale.id));
                Swal.fire({
                    title: "¡Venta Anulada!",
                    text: "La venta ha sido anulada correctamente.",
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
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6">
            {/* Header superior y controles de búsqueda */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        Historial de Ventas
                    </h1>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                        Gestiona y monitorea todas las transacciones comerciales
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                    {/* Buscador */}
                    <div className="relative min-w-[220px] sm:min-w-[260px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                            placeholder="Buscar por comprobante o cliente..."
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-slate-400 shadow-sm"
                        />
                    </div>

                    {/* Filtro Usuarios */}
                    <select
                        value={userFilter}
                        onChange={(e) => {
                            setUserFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-medium"
                    >
                        <option value="ALL">Todos los usuarios</option>
                        {uniqueUsers.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>

                    {/* Reportes del Día */}
                    <button
                        type="button"
                        onClick={() => setDateFilter(dateFilter === "TODAY" ? "ALL" : "TODAY")}
                        className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all shadow-sm ${
                            dateFilter === "TODAY"
                                ? "bg-teal-50 text-teal-700 border-teal-200"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                        title="Alternar entre transacciones de hoy y todas"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                            />
                        </svg>
                        <span>{dateFilter === "TODAY" ? "Ventas de Hoy" : "Todas las Ventas"}</span>
                    </button>

                    {/* Botón Nueva Venta */}
                    <Link
                        to="/sales/register"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#005f60] hover:bg-[#004e4f] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>+ Nueva Venta</span>
                    </Link>
                </div>
            </div>

            {/* 3 Tarjetas de Resumen (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* KPI 1: TOTAL VENTAS (CONTADO) */}
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold tracking-wider text-indigo-900/60 uppercase block mb-1">
                            TOTAL VENTAS (CONTADO)
                        </span>
                        <div className="text-2xl font-black text-indigo-600">
                            S/ {totalContado.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <ellipse cx="12" cy="6" rx="8" ry="3" strokeWidth="2" />
                            <path strokeLinecap="round" strokeWidth="2" d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                            <path strokeLinecap="round" strokeWidth="2" d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
                        </svg>
                    </div>
                </div>

                {/* KPI 2: TOTAL CRÉDITOS */}
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold tracking-wider text-purple-900/60 uppercase block mb-1">
                            TOTAL CRÉDITOS
                        </span>
                        <div className="text-2xl font-black text-purple-600">
                            S/ {totalCreditos.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect width="20" height="14" x="2" y="5" rx="2" strokeWidth="2" />
                            <line x1="2" x2="22" y1="10" y2="10" strokeWidth="2" />
                        </svg>
                    </div>
                </div>

                {/* KPI 3: TOTAL GENERAL */}
                <div className="bg-white rounded-2xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold tracking-wider text-emerald-900/60 uppercase block mb-1">
                            TOTAL GENERAL
                        </span>
                        <div className="text-2xl font-black text-emerald-600">
                            S/ {totalGeneral.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Tarjeta principal con tabla */}
            <div className="bg-white rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <svg className="animate-spin h-7 w-7 text-teal-600 mb-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            <span className="text-xs font-medium text-slate-500">Cargando transacciones...</span>
                        </div>
                    ) : paginatedSales.length === 0 ? (
                        /* Estado Vacío idéntico a la captura */
                        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                    <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                                    <line x1="8" y1="11" x2="14" y2="11" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h3 className="text-sm font-bold text-slate-700 mb-1">
                                No se encontraron registros
                            </h3>
                            <p className="text-xs text-slate-400 max-w-sm mb-5">
                                {searchTerm
                                    ? `No hay ventas que coincidan con "${searchTerm}".`
                                    : dateFilter === "TODAY"
                                    ? "No hay ventas registradas para el día de hoy."
                                    : "Aún no se han emitido ventas en el sistema."}
                            </p>
                            <Link
                                to="/sales/register"
                                className="px-4 py-2 bg-[#005f60] hover:bg-[#004e4f] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                            >
                                + Emitir Primera Venta
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/40">
                                    <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        COMPROBANTE
                                    </th>
                                    <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        CLIENTE / FECHA
                                    </th>
                                    <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        TIPO
                                    </th>
                                    <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        MEDIO DE PAGO
                                    </th>
                                    <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        TOTAL
                                    </th>
                                    <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                        ESTADO DE PAGO
                                    </th>
                                    <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        SALDO
                                    </th>
                                    <th className="py-3.5 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                                        ACCIONES
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {paginatedSales.map((s) => {
                                    const receiptType = s.receiptType || s.tipoComprobante || "TICKET";
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
                                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* COMPROBANTE */}
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                                        receiptType === "FACTURA"
                                                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                            : receiptType === "BOLETA"
                                                            ? "bg-teal-50 text-teal-700 border border-teal-200"
                                                            : "bg-slate-100 text-slate-700"
                                                    }`}>
                                                        {receiptType}
                                                    </span>
                                                    <span className="font-mono font-bold text-slate-800 text-xs">
                                                        {fullReceipt}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* CLIENTE / FECHA */}
                                            <td className="py-3.5 px-5">
                                                <div>
                                                    <span className="font-bold text-slate-800 block text-xs">
                                                        {client}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 block font-normal mt-0.5">
                                                        {formattedDate}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* TIPO */}
                                            <td className="py-3.5 px-5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                    saleType === "CREDITO"
                                                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                        : "bg-slate-100 text-slate-700"
                                                }`}>
                                                    {saleType}
                                                </span>
                                            </td>

                                            {/* MEDIO DE PAGO */}
                                            <td className="py-3.5 px-5">
                                                <span className="font-medium text-slate-700 text-xs">
                                                    {paymentMethod}
                                                </span>
                                            </td>

                                            {/* TOTAL */}
                                            <td className="py-3.5 px-5">
                                                <span className="font-bold text-slate-800 text-xs">
                                                    S/ {total.toFixed(2)}
                                                </span>
                                            </td>

                                            {/* ESTADO DE PAGO */}
                                            <td className="py-3.5 px-5 text-center">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        PAGADO
                                                    </span>
                                                ) : isPartial ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        PARCIAL
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                        PENDIENTE
                                                    </span>
                                                )}
                                            </td>

                                            {/* SALDO */}
                                            <td className="py-3.5 px-5">
                                                <span className={`text-xs font-semibold ${
                                                    !isPaid && balance > 0.001 ? "text-rose-600 font-bold" : "text-slate-400"
                                                }`}>
                                                    S/ {isPaid ? "0.00" : balance.toFixed(2)}
                                                </span>
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="py-3.5 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedSaleForTicket(s);
                                                            setIsTicketOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#005f60] hover:bg-teal-50 transition-colors"
                                                        title="Imprimir comprobante / ticket"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/sales/edit/${s.id}`)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                                                        title="Editar / Ver venta"
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
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Anular venta"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
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

                {/* Footer: Conteo, Leyenda y Paginación idénticos al diseño */}
                <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-[11px] text-slate-400">
                            Mostrando {paginatedSales.length} de {filteredSales.length} transacciones {dateFilter === "TODAY" ? "de hoy" : "totales"}
                        </span>
                        {/* Leyenda de Puntos */}
                        <div className="flex items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                <span>Pagadas</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                                <span>Pendientes</span>
                            </span>
                        </div>
                    </div>

                    {/* Controles de paginación */}
                    {filteredSales.length > 0 && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((page) => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                .map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                            currentPage === page
                                                ? "bg-teal-700 text-white shadow-sm"
                                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para Reimprimir Comprobante / Ticket Térmico */}
            <ReceiptTicketModal
                isOpen={isTicketOpen}
                onClose={() => setIsTicketOpen(false)}
                saleData={selectedSaleForTicket}
            />
        </div>
    );
};
