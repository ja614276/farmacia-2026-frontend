import PropTypes from "prop-types";

export const SaleSuccessModal = ({
    isOpen,
    saleData,
    onPrint,
    onContinue,
}) => {
    if (!isOpen || !saleData) return null;

    const receiptType = (saleData.receiptType || saleData.tipoComprobante || "TICKET").toUpperCase();
    const series = saleData.series || saleData.serie || (receiptType === "FACTURA" ? "F001" : receiptType === "BOLETA" ? "B001" : "T001");
    const receiptNum = saleData.receiptNumber || saleData.numComprobante || String(saleData.id || "00000001").padStart(8, "0");
    const fullReceipt = `${series} - ${receiptNum}`;

    const client = saleData.clientName || saleData.clienteNombre || "Público General";
    const total = Number(saleData.total || 0);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-8 text-center flex flex-col items-center animate-fadeIn">
                
                {/* Ícono de Check Verde */}
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12l2.5 2.5L16 9" />
                    </svg>
                </div>

                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">
                    ¡Venta Realizada!
                </h2>
                <p className="text-xs text-slate-400 font-medium mb-6">
                    La venta ha sido procesada exitosamente
                </p>

                {/* Recuadro de Detalle de Comprobante (Calco Imagen 4) */}
                <div className="w-full bg-slate-50/80 border border-slate-100 rounded-2xl p-5 mb-6 text-left text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            COMPROBANTE
                        </span>
                        <span className="font-black text-slate-800 tracking-wide">
                            {receiptType}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            SERIE - NÚMERO
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                            {fullReceipt}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            CLIENTE
                        </span>
                        <span className="font-semibold text-slate-700">
                            {client}
                        </span>
                    </div>

                    <div className="border-t border-slate-200/80 my-2 pt-2 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            TOTAL
                        </span>
                        <span className="text-xl font-black text-emerald-600">
                            S/ {total.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Botones de Acción (Calco Imagen 4) */}
                <div className="w-full space-y-3">
                    <button
                        type="button"
                        onClick={onPrint}
                        className="w-full py-3.5 bg-[#005f60] hover:bg-[#004e4f] text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Imprimir Comprobante</span>
                    </button>

                    <button
                        type="button"
                        onClick={onContinue}
                        className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        Continuar sin imprimir
                    </button>
                </div>
            </div>
        </div>
    );
};

SaleSuccessModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    saleData: PropTypes.object,
    onPrint: PropTypes.func.isRequired,
    onContinue: PropTypes.func.isRequired,
};
