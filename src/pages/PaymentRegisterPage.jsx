import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { getDebtorsRanking, getClientPendingSales, registerPayment } from "../services/ClientPaymentService";
import { findAllClients } from "../services/ClientService";
import { getActiveCashSession } from "../services/CashSessionService";

export const PaymentRegisterPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClientId = searchParams.get("clientId");

    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [pendingSales, setPendingSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);

    const [activeSession, setActiveSession] = useState(null);
    const [isCashOpen, setIsCashOpen] = useState(true);

    const [mode, setMode] = useState("invoice"); // "invoice" | "global"
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        amount: "",
        paymentMethodName: "EFECTIVO",
        paymentDate: new Date().toISOString().slice(0, 16),
        reference: "",
    });

    // Cargar clientes, deudores y estado de sesión de caja
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                const [debtorsRes, allClientsRes, cashRes] = await Promise.all([
                    getDebtorsRanking(),
                    findAllClients(),
                    getActiveCashSession().catch(() => ({ data: null })),
                ]);

                const session = cashRes?.data;
                setActiveSession(session || null);
                const open = session && session.status === "ABIERTA";
                setIsCashOpen(Boolean(open));

                const debtorsList = debtorsRes.data || [];
                const allList = allClientsRes.data || [];
                setClients(debtorsList.length > 0 ? debtorsList : allList);

                // Seleccionar cliente según query param o primer deudor
                let target = null;
                if (queryClientId) {
                    target = debtorsList.find((c) => String(c.id) === String(queryClientId))
                        || allList.find((c) => String(c.id) === String(queryClientId));
                }
                if (!target && debtorsList.length > 0) {
                    target = debtorsList[0];
                } else if (!target && allList.length > 0) {
                    target = allList[0];
                }

                if (target) {
                    handleSelectClient(target);
                }
            } catch (error) {
                console.error("Error al cargar datos del cliente:", error);
                Swal.fire("Error", "No se pudo cargar la información de cobro", "error");
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [queryClientId]);

    // Al seleccionar un cliente, cargar sus facturas pendientes
    const handleSelectClient = async (client) => {
        setSelectedClient(client);
        try {
            const res = await getClientPendingSales(client.id);
            const sales = res.data || [];
            setPendingSales(sales);

            if (sales.length > 0) {
                setSelectedSale(sales[0]);
                setFormData((prev) => ({
                    ...prev,
                    amount: sales[0].pendingBalance || sales[0].saldoPendiente || "",
                }));
            } else {
                setSelectedSale(null);
                setFormData((prev) => ({
                    ...prev,
                    amount: client.currentBalance || client.saldo || "",
                }));
            }
        } catch (err) {
            console.error("Error al obtener ventas pendientes:", err);
            setPendingSales([]);
            setSelectedSale(null);
        }
    };

    // Al cambiar la factura seleccionada
    const handleSelectSale = (sale) => {
        setSelectedSale(sale);
        setFormData((prev) => ({
            ...prev,
            amount: sale.pendingBalance || sale.saldoPendiente || "",
        }));
    };

    // Al cambiar de modo (Pagar Factura vs Abono Global)
    const handleModeChange = (newMode) => {
        setMode(newMode);
        if (newMode === "global") {
            setSelectedSale(null);
            setFormData((prev) => ({
                ...prev,
                amount: selectedClient ? (selectedClient.currentBalance || selectedClient.saldo || "") : "",
            }));
        } else {
            if (pendingSales.length > 0) {
                setSelectedSale(pendingSales[0]);
                setFormData((prev) => ({
                    ...prev,
                    amount: pendingSales[0].pendingBalance || pendingSales[0].saldoPendiente || "",
                }));
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Helper para iniciales del cliente
    const getInitials = (name) => {
        if (!name) return "LS";
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    // Enviar formulario de cobro
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isCashOpen || !activeSession) {
            Swal.fire({
                title: "Caja Cerrada",
                text: "No se puede registrar el cobro porque no hay una sesión de caja abierta. Se necesita un empleado activo para registrar ventas y cobros.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Ir a Abrir Caja",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#4f46e5",
            }).then((res) => {
                if (res.isConfirmed) {
                    navigate("/cash-sessions/open");
                }
            });
            return;
        }

        if (!selectedClient) {
            Swal.fire("Atención", "Debe seleccionar un cliente deudor.", "warning");
            return;
        }

        const amountNum = Number(formData.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            Swal.fire("Monto Inválido", "Ingrese un monto mayor a 0 para registrar el cobro.", "warning");
            return;
        }

        const confirmMsg = mode === "invoice" && selectedSale
            ? `¿Desea registrar el cobro de S/ ${amountNum.toFixed(2)} para la Venta #${selectedSale.id}?`
            : `¿Desea registrar el abono global de S/ ${amountNum.toFixed(2)} para el cliente ${selectedClient.fullName || selectedClient.firstName}?`;

        const result = await Swal.fire({
            title: "¿Confirmar Cobro?",
            text: confirmMsg,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#4f46e5",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, Registrar Cobro",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            setIsSubmitting(true);

            let formattedDate = formData.paymentDate || new Date().toISOString().slice(0, 19).replace("T", " ");
            formattedDate = formattedDate.replace("T", " ");
            if (formattedDate.length === 16) {
                formattedDate += ":00";
            }

            const payload = {
                saleId: mode === "invoice" && selectedSale ? selectedSale.id : null,
                clientId: selectedClient.id,
                amount: amountNum,
                paymentMethodName: formData.paymentMethodName,
                paymentDate: formattedDate,
                reference: formData.reference,
                clientName: selectedClient.fullName || `${selectedClient.firstName || ""} ${selectedClient.lastName || ""}`.trim(),
                employeeId: activeSession?.openingEmployeeId || null,
                employeeName: activeSession?.openingEmployeeName || null,
            };

            await registerPayment(payload);

            await Swal.fire({
                title: "¡Cobro Exitoso!",
                text: `Se ha registrado el pago de S/ ${amountNum.toFixed(2)} correctamente.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
            });

            navigate("/collections");
        } catch (error) {
            console.error("Error al registrar cobro:", error);
            const msg = error.response?.data?.message || error.response?.data || "No se pudo registrar el cobro en el sistema.";
            Swal.fire("Error al Registrar", typeof msg === "string" ? msg : "Error interno al procesar el pago", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[450px]">
                <div className="flex items-center gap-3 text-indigo-700 font-medium text-sm">
                    <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Verificando estado de caja y cargando registro de cobros...</span>
                </div>
            </div>
        );
    }

    if (!isCashOpen) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center shadow-lg shadow-rose-100/50 flex flex-col items-center animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-[#ffe4e6] flex items-center justify-center mb-5 text-[#f43f5e] shadow-inner">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-[#e11d48] mb-3">
                        Caja Cerrada para Cobranzas
                    </h2>

                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        Solo si la <strong className="text-slate-800">caja está abierta</strong> se puede acceder a cobrar, ya que se necesita un empleado activo para registrar ventas y cobros en el sistema.
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/collections")}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all"
                        >
                            Volver a Cobranzas
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/cash-sessions/open")}
                            className="bg-[#f43f5e] hover:bg-[#e11d48] text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 text-xs"
                        >
                            Abrir Caja Ahora
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentBal = Number(selectedClient?.currentBalance || selectedClient?.saldo || 0);
    const limit = Number(selectedClient?.creditLimit || selectedClient?.limiteCredito || 200);
    const usedPct = limit > 0 ? Math.min(100, Math.round((currentBal / limit) * 100)) : 0;
    const clientName = selectedClient ? (selectedClient.fullName || `${selectedClient.firstName || ""} ${selectedClient.lastName || ""}`.trim()) : "Cliente";

    return (
        <div className="space-y-6 max-w-[1300px] mx-auto pb-10">
            {/* Header: Breadcrumb y Estado de Caja */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Link to="/collections" className="hover:text-indigo-600 transition-colors">
                        Cobranzas
                    </Link>
                    <span>&gt;</span>
                    <span className="text-slate-600">Registro de Pago</span>
                </div>
                {activeSession && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-emerald-900">Caja #{activeSession.id} Abierta</span>
                        <span className="text-emerald-700 font-medium">
                            • Responsable: <strong className="font-semibold text-emerald-950">{activeSession.openingEmployeeName || `ID ${activeSession.openingEmployeeId}`}</strong>
                        </span>
                    </div>
                )}
            </div>

            {/* Grid Principal: Formulario de Cobro (8 cols) + Estado del Cliente (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLUMNA IZQUIERDA (8 COLS): Formulario de Cobro (Imagen 2) */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
                    {/* Título de la tarjeta */}
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            Nuevo Movimiento de Cobro
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Ingrese los detalles para amortizar o liquidar saldos.
                        </p>
                    </div>

                    {/* SECCIÓN: CLIENTE DEUDOR */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                CLIENTE DEUDOR
                            </label>
                            {clients.length > 1 && (
                                <select
                                    value={selectedClient?.id || ""}
                                    onChange={(e) => {
                                        const c = clients.find((item) => String(item.id) === String(e.target.value));
                                        if (c) handleSelectClient(c);
                                    }}
                                    className="text-xs font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-200 rounded-lg px-2 py-0.5 focus:outline-none"
                                >
                                    {clients.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            Cambiar: {c.fullName || c.firstName} (S/ {(c.currentBalance || c.saldo || 0).toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {selectedClient ? (
                            <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-100/80 text-[#4f46e5] font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                                        {getInitials(clientName)}
                                    </div>
                                    <div>
                                        <span className="font-black text-slate-800 text-sm uppercase block">
                                            {clientName}
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                                            ID: #{selectedClient.id}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span className="px-2.5 py-1 bg-slate-200/60 text-slate-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                        SELECCIONADO
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                                Cargando cliente...
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN: ESTADO DE CUENTA (Banner Rojo / Coral) */}
                    <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                                    <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                                    ESTADO DE CUENTA
                                </span>
                                <span className="text-xs font-black text-rose-900 uppercase tracking-wide block mt-0.5">
                                    SALDO TOTAL PENDIENTE
                                </span>
                            </div>
                        </div>
                        <div className="text-xl font-black text-rose-600">
                            S/ {currentBal.toFixed(2)}
                        </div>
                    </div>

                    {/* TABS: [Pagar Factura] | [Abono Global] */}
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => handleModeChange("invoice")}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                mode === "invoice"
                                    ? "bg-white text-indigo-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Pagar Factura</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange("global")}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                mode === "global"
                                    ? "bg-white text-indigo-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span>Abono Global</span>
                        </button>
                    </div>

                    {/* SELECCIONAR FACTURA PENDIENTE (Solo si mode === 'invoice') */}
                    {mode === "invoice" && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                SELECCIONAR FACTURA PENDIENTE
                            </label>

                            {pendingSales.length === 0 ? (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                                    Este cliente no tiene facturas con saldo pendiente. Puede realizar un Abono Global.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto">
                                    {pendingSales.map((s) => {
                                        const isSelected = selectedSale?.id === s.id;
                                        const dueDateStr = s.dueDate ? s.dueDate.slice(0, 10).split("-").reverse().join("/") : "15/09/2026";
                                        const pendingAmount = Number(s.pendingBalance || s.saldoPendiente || 0);

                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => handleSelectSale(s)}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                                    isSelected
                                                        ? "bg-indigo-50/50 border-[#4f46e5] ring-2 ring-indigo-500/20"
                                                        : "bg-white border-slate-200 hover:border-indigo-200"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                        isSelected ? "bg-[#4f46e5] text-white" : "bg-slate-100 text-slate-400"
                                                    }`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-slate-800 text-xs block">
                                                            Venta #{s.id}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">
                                                            VENCE: {dueDateStr}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                                                        PENDIENTE
                                                    </span>
                                                    <span className="font-black text-slate-800 text-xs block mt-0.5">
                                                        S/ {pendingAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* CAMPOS DEL FORMULARIO DE COBRO */}
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* MONTO A PAGAR */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    MONTO A PAGAR (S/)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    required
                                />
                            </div>

                            {/* MEDIO DE PAGO */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    MEDIO DE PAGO
                                </label>
                                <select
                                    name="paymentMethodName"
                                    value={formData.paymentMethodName}
                                    onChange={handleInputChange}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="EFECTIVO">EFECTIVO</option>
                                    <option value="YAPE">YAPE</option>
                                    <option value="PLIN">PLIN</option>
                                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                    <option value="TARJETA">TARJETA</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* FECHA DE COBRO */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    FECHA DE COBRO
                                </label>
                                <input
                                    type="datetime-local"
                                    name="paymentDate"
                                    value={formData.paymentDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            {/* REFERENCIA / OBSERVACIÓN */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    REFERENCIA / OBSERVACIÓN
                                </label>
                                <input
                                    type="text"
                                    name="reference"
                                    value={formData.reference}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Recibo #450, Transferencia..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>

                        {/* BOTONES DE ACCIÓN (Cancelar / Registrar Cobro) */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate("/collections")}
                                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || isLoading || !isCashOpen}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Registrar Cobro</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* COLUMNA DERECHA (4 COLS): Estado del Cliente + Ayuda Rápida (Imagen 2) */}
                <div className="lg:col-span-4 space-y-5">
                    
                    {/* ESTADO DEL CLIENTE */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
                            </svg>
                            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                ESTADO DEL CLIENTE
                            </h3>
                        </div>

                        {/* Deuda Actual */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                DEUDA ACTUAL
                            </span>
                            <span className="text-base font-black text-rose-600">
                                S/{currentBal.toFixed(0)}
                            </span>
                        </div>

                        {/* Barra de Uso de Línea */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                                    USO DE LÍNEA
                                </span>
                                <span className="text-slate-800 font-extrabold">
                                    {usedPct}%
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#4f46e5] rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, usedPct)}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                                <span>USADO: S/{currentBal.toFixed(0)}</span>
                                <span>LÍMITE: S/{limit.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* Alerta Contextual */}
                        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5">
                            <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                Este cliente tiene un historial de pagos promedio de {selectedClient?.creditDays || 90} días. Asegúrese de que la fecha de cobro sea la correcta.
                            </p>
                        </div>
                    </div>

                    {/* Ayuda Rápida (Card Oscura) */}
                    <div className="bg-[#1e293b] text-white p-6 rounded-2xl shadow-sm space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Ayuda Rápida
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Los <span className="text-white font-bold">Abonos Globales</span> son útiles cuando el cliente desea amortizar una suma grande que cubre varias facturas. El sistema las liquidará por orden de antigüedad.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
};
