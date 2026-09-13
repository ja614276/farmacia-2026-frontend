import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import {
    getActiveCashSession,
    getCashSessionSummary,
    closeCashSession,
} from "../services/CashSessionService";

export const CashSessionClosePage = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth || {});

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [summary, setSummary] = useState(null);
    const [actualFinalAmount, setActualFinalAmount] = useState("");
    const [observations, setObservations] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadSessionData = async () => {
            try {
                setLoading(true);
                const activeRes = await getActiveCashSession();
                const active = activeRes?.data;

                if (!active || !active.id) {
                    Swal.fire({
                        title: "Sin Caja Abierta",
                        text: "No existe una sesión de caja activa para cerrar en este momento.",
                        icon: "info",
                        confirmButtonColor: "#005f60",
                    }).then(() => {
                        navigate("/cash-sessions");
                    });
                    return;
                }

                // Validar que el usuario actual sea el mismo que abrió la sesión de caja
                const currentUsername = (user?.username || "").trim().toLowerCase();
                const opener = (active.openingEmployeeName || "").trim().toLowerCase();
                const isOwner = opener === currentUsername || opener.includes(currentUsername) || currentUsername.includes(opener);

                if (!isOwner) {
                    Swal.fire({
                        title: "Acceso Denegado",
                        text: `Esta sesión de caja fue abierta por "${active.openingEmployeeName || "otro empleado"}". Cada empleado realiza su propia labor de caja y solo el responsable puede cerrarla.`,
                        icon: "error",
                        confirmButtonColor: "#005f60",
                    }).then(() => {
                        navigate("/cash-sessions");
                    });
                    return;
                }

                setSession(active);

                // Cargar el resumen financiero calculado en el backend
                try {
                    const summaryRes = await getCashSessionSummary(active.id);
                    if (summaryRes?.data) {
                        setSummary(summaryRes.data);
                        // Inicializar el monto real con el monto esperado para mayor comodidad
                        const expected = summaryRes.data.expectedFinalAmount || 0;
                        setActualFinalAmount(Number(expected).toFixed(2));
                    }
                } catch (summaryErr) {
                    console.warn("No se pudo cargar el resumen detallado, usando datos base:", summaryErr);
                    const initial = Number(active.initialAmount || 0);
                    setActualFinalAmount(initial.toFixed(2));
                }
            } catch (error) {
                console.error("Error al cargar la sesión de caja:", error);
                Swal.fire("Error", "No se pudo verificar la sesión activa de caja.", "error");
                navigate("/cash-sessions");
            } finally {
                setLoading(false);
            }
        };

        loadSessionData();
    }, [navigate, user?.username]);

    // Cálculos financieros
    const initialAmount = summary?.initialAmount != null
        ? Number(summary.initialAmount)
        : Number(session?.initialAmount || 0);

    const totalSales = summary?.totalSales != null
        ? Number(summary.totalSales)
        : 0.0;

    const expectedAmount = summary?.expectedFinalAmount != null
        ? Number(summary.expectedFinalAmount)
        : (initialAmount + totalSales);

    const actualCount = parseFloat(actualFinalAmount);
    const isValidAmount = !isNaN(actualCount) && actualCount >= 0;
    const diff = isValidAmount ? actualCount - expectedAmount : 0;
    const isBalanced = isValidAmount && Math.abs(diff) < 0.01;
    const isShortage = isValidAmount && diff < -0.01;
    const isSurplus = isValidAmount && diff > 0.01;

    // Desglose de ventas por medios de pago
    const salesByMethod = summary?.salesByPaymentMethod || {};
    const methodKeys = Object.keys(salesByMethod);

    // Paleta de estilos según método de pago (replicando la imagen del usuario)
    const getMethodCardStyle = (methodName) => {
        const norm = methodName.toUpperCase();
        if (norm.includes("EFECTIVO")) {
            return {
                border: "border-emerald-200",
                bg: "bg-emerald-50/50",
                iconBg: "text-emerald-600",
                icon: "💵",
                totalColor: "text-emerald-600",
            };
        }
        if (norm.includes("YAPE")) {
            return {
                border: "border-purple-200",
                bg: "bg-purple-50/50",
                iconBg: "text-purple-600",
                icon: "📱",
                totalColor: "text-purple-600",
            };
        }
        if (norm.includes("PLIN")) {
            return {
                border: "border-cyan-200",
                bg: "bg-cyan-50/50",
                iconBg: "text-cyan-600",
                icon: "⚡",
                totalColor: "text-cyan-600",
            };
        }
        if (norm.includes("TARJETA")) {
            return {
                border: "border-blue-200",
                bg: "bg-blue-50/50",
                iconBg: "text-blue-600",
                icon: "💳",
                totalColor: "text-blue-600",
            };
        }
        return {
            border: "border-slate-200",
            bg: "bg-slate-50/60",
            iconBg: "text-slate-600",
            icon: "🪙",
            totalColor: "text-slate-700",
        };
    };

    const handleConfirmClose = async (e) => {
        e.preventDefault();

        if (!isValidAmount) {
            Swal.fire({
                title: "Monto inválido",
                text: "Por favor ingrese un monto de arqueo físico válido (0 o mayor).",
                icon: "warning",
                confirmButtonColor: "#005f60",
            });
            return;
        }

        // Si hay faltante o sobrante, pedir confirmación explicativa
        let confirmText = "¿Está seguro de que desea cerrar el turno y guardar este arqueo?";
        if (isShortage) {
            confirmText = `Se ha detectado un FALTANTE de S/ ${Math.abs(diff).toFixed(2)}. ¿Desea confirmar el cierre de turno con esta diferencia?`;
        } else if (isSurplus) {
            confirmText = `Se ha detectado un SOBRANTE de S/ ${Math.abs(diff).toFixed(2)}. ¿Desea confirmar el cierre de turno con esta diferencia?`;
        }

        const result = await Swal.fire({
            title: "¿Confirmar Cierre de Turno?",
            text: confirmText,
            icon: isBalanced ? "question" : "warning",
            showCancelButton: true,
            confirmButtonColor: "#005f60",
            cancelButtonColor: "#94a3b8",
            confirmButtonText: "Sí, Cerrar Turno",
            cancelButtonText: "Revisar Arqueo",
        });

        if (!result.isConfirmed) return;

        try {
            setIsSubmitting(true);
            await closeCashSession(session.id, {
                actualFinalAmount: actualCount,
                observations: observations.trim(),
                employeeName: user?.username || session.openingEmployeeName || "Admin Sistema",
                employeeId: 1,
            });

            await Swal.fire({
                title: "¡Turno Cerrado!",
                text: "La sesión de caja ha sido cerrada y el arqueo registrado con éxito.",
                icon: "success",
                timer: 1800,
                showConfirmButton: false,
            });

            navigate("/cash-sessions");
        } catch (error) {
            console.error("Error al cerrar turno:", error);
            const msg = error.response?.data?.message || "Ocurrió un error al procesar el cierre de caja.";
            Swal.fire("Error al Cerrar", msg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[85vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <svg className="animate-spin h-8 w-8 text-[#005f60]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-semibold">Cargando datos del arqueo y turno...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6">
            <div className="w-full max-w-[540px] bg-white rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden animate__animated animate__fadeIn">
                {/* 1. Header con botón cerrar (X) */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
                    <div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                            Cierre de Turno y Arqueo
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Sesión #{session?.id} • Responsable: <span className="font-semibold text-slate-600">{session?.openingEmployeeName || "Admin Sistema"}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/cash-sessions")}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Volver"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleConfirmClose} className="p-6 space-y-5">
                    {/* 2. Tarjeta: Resumen Financiero */}
                    <div className="bg-[#eef8f8] border border-[#bfe5e5] rounded-2xl p-4 flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#cceeed] text-[#006d77] flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm">
                            $
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800">
                                Resumen Financiero
                            </h2>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Calculado automáticamente por el sistema
                            </p>
                        </div>
                    </div>

                    {/* 3. Fila: Monto Inicial */}
                    <div className="flex items-center justify-between px-2 text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                            MONTO INICIAL
                        </span>
                        <span className="text-base font-black font-mono text-slate-800">
                            S/ {initialAmount.toFixed(2)}
                        </span>
                    </div>

                    {/* 4. Sección: Desglose por Medios de Pago */}
                    <div>
                        <div className="text-center mb-3">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                DESGLOSE POR MEDIOS DE PAGO
                            </span>
                        </div>

                        {methodKeys.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {methodKeys.map((method) => {
                                    const amount = Number(salesByMethod[method] || 0);
                                    const style = getMethodCardStyle(method);
                                    return (
                                        <div
                                            key={method}
                                            className={`border rounded-2xl p-3.5 ${style.border} ${style.bg} transition-all`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm">{style.icon}</span>
                                                <span className="text-xs font-black text-slate-800 tracking-wider uppercase">
                                                    {method}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                                                <span>Ventas</span>
                                                <span className="font-mono">S/ {amount.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-slate-200/60 pt-1.5 flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-600 uppercase text-[10px]">
                                                    TOTAL
                                                </span>
                                                <span className={`font-black font-mono ${style.totalColor}`}>
                                                    S/ {amount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* En caso de que aún no haya ventas registradas en la sesión */
                            <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-3.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">💵</span>
                                    <span className="text-xs font-black text-slate-800 tracking-wider uppercase">
                                        EFECTIVO
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                                    <span>Ventas</span>
                                    <span className="font-mono">S/ 0.00</span>
                                </div>
                                <div className="border-t border-emerald-100 pt-1.5 flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">TOTAL</span>
                                    <span className="font-black font-mono text-emerald-600">S/ 0.00</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5. Tarjeta Oscura: TOTAL ESPERADO */}
                    <div className="bg-[#1e293b] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md">
                        <span className="text-white font-black text-xs sm:text-sm tracking-wider uppercase">
                            TOTAL ESPERADO
                        </span>
                        <span className="text-white font-black text-xl sm:text-2xl font-mono">
                            S/ {expectedAmount.toFixed(2)}
                        </span>
                    </div>

                    {/* 6. Sección: Arqueo de Caja y Conteo Físico */}
                    <div className="pt-1">
                        <div className="text-center mb-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                ARQUEO DE CAJA
                            </span>
                        </div>

                        <p className="text-xs font-bold text-slate-700 text-center mb-3">
                            ¿Cuánto dinero hay físicamente en la caja?
                        </p>

                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={actualFinalAmount}
                                onChange={(e) => setActualFinalAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                autoFocus
                                className="w-full text-center text-3xl font-black font-mono text-slate-800 py-3.5 px-4 bg-white border-2 border-slate-200 focus:border-[#005f60] rounded-2xl outline-none transition-all shadow-sm focus:shadow-md"
                            />
                        </div>
                    </div>

                    {/* 7. Estado del Arqueo en Tiempo Real (Replicando Imagen 2) */}
                    {isValidAmount && (
                        <div className="animate__animated animate__fadeIn">
                            {isBalanced && (
                                <div className="border-2 border-emerald-400 bg-emerald-50/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                            ✓
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-emerald-900 leading-tight">
                                                Caja Cuadrada
                                            </h3>
                                            <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider block mt-0.5">
                                                RESULTADO DEL ARQUEO
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-base sm:text-lg font-black font-mono text-emerald-600">
                                        S/ 0.00
                                    </div>
                                </div>
                            )}

                            {isShortage && (
                                <div className="border-2 border-rose-400 bg-rose-50/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                            ⚠️
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-rose-900 leading-tight">
                                                Faltante en Caja
                                            </h3>
                                            <span className="text-[9px] font-extrabold text-rose-700 uppercase tracking-wider block mt-0.5">
                                                RESULTADO DEL ARQUEO
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-base sm:text-lg font-black font-mono text-rose-600">
                                        -S/ {Math.abs(diff).toFixed(2)}
                                    </div>
                                </div>
                            )}

                            {isSurplus && (
                                <div className="border-2 border-sky-400 bg-sky-50/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                            ℹ️
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-sky-900 leading-tight">
                                                Sobrante en Caja
                                            </h3>
                                            <span className="text-[9px] font-extrabold text-sky-700 uppercase tracking-wider block mt-0.5">
                                                RESULTADO DEL ARQUEO
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-base sm:text-lg font-black font-mono text-sky-600">
                                        +S/ {Math.abs(diff).toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 8. Campo Opcional: Observaciones */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Observaciones / Justificación (Opcional)
                        </label>
                        <input
                            type="text"
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Ej. Cuadre verificado sin novedades..."
                            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#005f60] outline-none text-slate-800 transition-all"
                        />
                    </div>

                    {/* 9. Botones de Acción */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate("/cash-sessions")}
                            disabled={isSubmitting}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-2.5 px-3"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting || !isValidAmount}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#005f60] hover:bg-[#004e4f] active:bg-[#003e3f] text-white font-bold text-xs rounded-xl shadow-md shadow-teal-900/15 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{isSubmitting ? "Guardando Cierre..." : "Confirmar Cierre y Guardar"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashSessionClosePage;
