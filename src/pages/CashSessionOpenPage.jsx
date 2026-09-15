import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { openCashSession } from "../services/CashSessionService";

export const CashSessionOpenPage = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth || {});

    const [initialAmount, setInitialAmount] = useState("0");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fecha formateada en español: "sábado, 18 de julio de 2026"
    const todayFormatted = new Date().toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const userName = user?.username ? user.username.toUpperCase() : "Admin Sistema";
    const userInitial = (user?.username || "A").charAt(0).toUpperCase();

    const onSubmit = async (e) => {
        e.preventDefault();

        const parsedAmount = parseFloat(initialAmount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            Swal.fire({
                title: "Monto inválido",
                text: "Por favor ingrese un monto inicial válido mayor o igual a 0.",
                icon: "warning",
                confirmButtonColor: "#09090b",
            });
            return;
        }

        try {
            setIsSubmitting(true);
            await openCashSession({
                initialAmount: parsedAmount,
                employeeName: user?.username || "Admin Sistema",
                employeeId: 1,
            });

            Swal.fire({
                title: "¡Caja Abierta!",
                text: "El turno ha sido iniciado exitosamente.",
                icon: "success",
                timer: 1600,
                showConfirmButton: false,
            });

            navigate("/cash-sessions");
        } catch (error) {
            console.error("Error al abrir sesión de caja:", error);
            const msg =
                error.response?.data?.message ||
                "Ocurrió un error al intentar registrar la apertura de caja.";
            Swal.fire("Error", msg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden animate__animated animate__fadeIn">
                {/* 1. Encabezado Monocromático */}
                <div className="bg-[#09090b] p-6 sm:p-7 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-white">
                                Apertura de Caja
                            </h1>
                            <p className="text-xs text-white/80 mt-0.5 capitalize flex items-center gap-1">
                                <span>{todayFormatted}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Cuerpo del Formulario */}
                <form onSubmit={onSubmit} className="p-6 sm:p-8 space-y-6">
                    {/* Ficha: Cajero Responsable */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-[#09090b] text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
                            {userInitial}
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                CAJERO RESPONSABLE
                            </span>
                            <h2 className="text-sm font-black text-slate-800 mt-0.5">
                                {userName}
                            </h2>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Autenticado correctamente
                            </span>
                        </div>
                    </div>

                    {/* Campo: Dinero Inicial en Caja */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <span>💵</span>
                                <span>DINERO INICIAL EN CAJA</span>
                            </label>
                            <span className="text-[11px] text-[#006d77] font-semibold">
                                ⓘ Ingrese el efectivo base
                            </span>
                        </div>

                        <div className="relative flex items-center border-2 border-[#006d77]/60 focus-within:border-[#006d77] rounded-2xl px-4 py-2.5 bg-white transition-all shadow-sm">
                            <span className="text-orange-500 font-black text-lg mr-2 font-mono select-none">
                                S/
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={initialAmount}
                                onChange={(e) => setInitialAmount(e.target.value)}
                                autoFocus
                                required
                                placeholder="0.00"
                                className="w-full text-xl font-bold font-mono text-slate-800 outline-none bg-transparent"
                            />
                        </div>
                    </div>

                    {/* Mensaje Informativo Neutro */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-start gap-3 text-zinc-700">
                        <div className="w-5 h-5 rounded-full bg-[#09090b] text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                            i
                        </div>
                        <p className="text-xs leading-relaxed text-zinc-600">
                            Al confirmar la apertura, se registrará el inicio de su turno. Todas las transacciones
                            realizadas desde ahora quedarán vinculadas a esta sesión hasta su cierre oficial.
                        </p>
                    </div>

                    {/* Botones de Acción Inferiores */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate("/cash-sessions")}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            Volver al listado
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#09090b] hover:bg-[#27272a] active:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            <span>{isSubmitting ? "Abriendo Turno..." : "Confirmar Apertura de Caja"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashSessionOpenPage;
