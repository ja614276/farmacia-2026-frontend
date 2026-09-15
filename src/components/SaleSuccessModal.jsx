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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-md p-7 text-center flex flex-col items-center animate-fadeIn">
                
                {/* Ícono Monocromático */}
                <div className="w-14 h-14 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4 shadow-sm">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12l2.5 2.5L16 9" />
                    </svg>
                </div>

                <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-1">
                    Venta Procesada Exitosamente
                </h2>
                <p className="text-xs text-zinc-500 font-medium mb-6">
                    El comprobante ha sido registrado y el inventario actualizado
                </p>

                {/* Recuadro de Detalle de Comprobante */}
                <div className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-4 mb-6 text-left text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            COMPROBANTE
                        </span>
                        <span className="font-mono font-bold text-zinc-900 tracking-wide bg-zinc-200/80 px-2 py-0.5 rounded text-[11px]">
                            {receiptType}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            SERIE - NÚMERO
                        </span>
                        <span className="font-mono font-bold text-zinc-900">
                            {fullReceipt}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            CLIENTE
                        </span>
                        <span className="font-semibold text-zinc-800">
                            {client}
                        </span>
                    </div>

                    <div className="border-t border-zinc-200 my-2 pt-2.5 flex items-center justify-between">
                        <span className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                            TOTAL PAGADO
                        </span>
                        <span className="text-xl font-black text-zinc-950 font-mono">
                            S/ {total.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Botones de Acción */}
                <div className="w-full space-y-2.5">
                    <button
                        type="button"
                        onClick={onPrint}
                        className="w-full py-3 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 tracking-wide"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>IMPRIMIR COMPROBANTE</span>
                    </button>

                    <button
                        type="button"
                        onClick={onContinue}
                        className="w-full py-2.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors"
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
