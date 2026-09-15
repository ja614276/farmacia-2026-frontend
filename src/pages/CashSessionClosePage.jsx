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
                        confirmButtonColor: "#09090b",
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
                        confirmButtonColor: "#09090b",
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

    // Paleta de estilos corporativos monocromáticos por método de pago
    const getMethodCardStyle = () => {
        return {
            border: "border-zinc-200",
            bg: "bg-zinc-50/70",
            iconBg: "text-zinc-700",
            totalColor: "text-zinc-900 font-mono",
        };
    };

    const handleConfirmClose = async (e) => {
        e.preventDefault();

        if (!isValidAmount) {
            Swal.fire({
                title: "Monto inválido",
                text: "Por favor ingrese un monto de arqueo físico válido (0 o mayor).",
                icon: "warning",
                confirmButtonColor: "#09090b",
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
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
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
                <div className="flex flex-col items-center gap-3 text-zinc-500">
                    <svg className="animate-spin h-8 w-8 text-zinc-900" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs uppercase tracking-widest font-mono font-bold text-zinc-600">Cargando datos del arqueo y turno...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6 bg-zinc-50/50">
            <div className="w-full max-w-[540px] bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden animate__animated animate__fadeIn">
                {/* 1. Header con botón cerrar (X) */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-zinc-100 bg-white">
                    <div>
                        <div className="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900 text-white rounded">
                            ARQUEO & CIERRE
                        </div>
                        <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                            Cierre de Turno de Caja
                        </h1>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                            SESIÓN #{session?.id} • RESPONSABLE: <span className="font-semibold text-zinc-900">{session?.openingEmployeeName || "Admin Sistema"}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/cash-sessions")}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                        title="Volver"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleConfirmClose} className="p-6 space-y-5">
                    {/* 2. Tarjeta: Resumen Financiero */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-base flex-shrink-0 shadow-sm">
                            S/
                        </div>
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                                Balance Contable de Sesión
                            </h2>
                            <p className="text-[11px] text-zinc-500 font-mono">
                                Cálculo algorítmico automatizado
                            </p>
                        </div>
                    </div>

                    {/* 3. Fila: Monto Inicial */}
                    <div className="flex items-center justify-between px-2 text-xs border-b border-zinc-100 pb-2">
                        <span className="font-mono font-bold text-zinc-500 uppercase tracking-wider text-[11px]">
                            Monto Inicial de Apertura
                        </span>
                        <span className="text-base font-bold font-mono text-zinc-900">
                            S/ {initialAmount.toFixed(2)}
                        </span>
                    </div>

                    {/* 4. Sección: Desglose por Medios de Pago */}
                    <div>
                        <div className="mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                                [DESGLOSE POR MEDIOS DE PAGO]
                            </span>
                        </div>

                        {methodKeys.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {methodKeys.map((method) => {
                                    const amount = Number(salesByMethod[method] || 0);
                                    const style = getMethodCardStyle();
                                    return (
                                        <div
                                            key={method}
                                            className={`border rounded-xl p-3 bg-white border-zinc-200 hover:border-zinc-300 transition-all`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[11px] font-bold text-zinc-900 tracking-wider uppercase">
                                                    {method}
                                                </span>
                                                <span className="text-[10px] font-mono text-zinc-400">PAGO</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                                                <span className="text-[10px] font-mono text-zinc-500 uppercase">Total</span>
                                                <span className="font-mono font-bold text-zinc-900">
                                                    S/ {amount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="border border-zinc-200 bg-zinc-50/50 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-bold text-zinc-900 uppercase">EFECTIVO</span>
                                    <span className="text-[10px] font-mono text-zinc-400">BASE</span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                                    <span className="text-[10px] font-mono text-zinc-500">Total</span>
                                    <span className="font-mono font-bold text-zinc-900">S/ 0.00</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5. Tarjeta Oscura: TOTAL ESPERADO */}
                    <div className="bg-[#09090b] rounded-xl p-4 sm:p-5 flex items-center justify-between border border-zinc-800 text-white">
                        <div>
                            <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block">
                                CÁLCULO SISTEMA
                            </span>
                            <span className="text-white font-bold text-xs sm:text-sm tracking-wider uppercase">
                                TOTAL TEÓRICO ESPERADO
                            </span>
                        </div>
                        <span className="text-white font-bold text-xl sm:text-2xl font-mono">
                            S/ {expectedAmount.toFixed(2)}
                        </span>
                    </div>

                    {/* 6. Sección: Arqueo de Caja y Conteo Físico */}
                    <div className="pt-1">
                        <div className="mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                                [ARQUEO FÍSICO EN CAJA]
                            </span>
                        </div>

                        <p className="text-xs font-semibold text-zinc-700 mb-2">
                            Monto contado físicamente en gaveta:
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
                                className="w-full text-center text-3xl font-bold font-mono text-zinc-900 py-3 px-4 bg-zinc-50 border border-zinc-300 focus:border-zinc-900 focus:bg-white rounded-xl outline-none transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* 7. Estado del Arqueo en Tiempo Real */}
                    {isValidAmount && (
                        <div className="animate__animated animate__fadeIn">
                            {isBalanced && (
                                <div className="border border-zinc-300 bg-zinc-100 rounded-xl p-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                                            ✓
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-zinc-900 uppercase">
                                                Caja Cuadrada Exacta
                                            </h3>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                                                Sin diferencias monetarias
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold font-mono text-zinc-900">
                                        S/ 0.00
                                    </div>
                                </div>
                            )}

                            {isShortage && (
                                <div className="border border-zinc-300 bg-zinc-50 rounded-xl p-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                                            -
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-zinc-900 uppercase">
                                                Faltante en Caja
                                            </h3>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                                                Diferencia negativa detectada
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold font-mono text-zinc-900">
                                        -S/ {Math.abs(diff).toFixed(2)}
                                    </div>
                                </div>
                            )}

                            {isSurplus && (
                                <div className="border border-zinc-300 bg-zinc-50 rounded-xl p-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                                            +
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-zinc-900 uppercase">
                                                Sobrante en Caja
                                            </h3>
                                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                                                Diferencia positiva detectada
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold font-mono text-zinc-900">
                                        +S/ {Math.abs(diff).toFixed(2)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 8. Campo Opcional: Observaciones */}
                    <div>
                        <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-1">
                            Observaciones / Justificación de Cierre
                        </label>
                        <input
                            type="text"
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Ej. Cuadre verificado sin novedades..."
                            className="w-full text-xs px-3.5 py-2 bg-white border border-zinc-300 rounded-xl focus:border-zinc-900 outline-none text-zinc-900 transition-all font-sans"
                        />
                    </div>

                    {/* 9. Botones de Acción */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={() => navigate("/cash-sessions")}
                            disabled={isSubmitting}
                            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer py-2 px-3"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting || !isValidAmount}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#09090b] hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
