import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import productsApi from "../apis/productsApi";

export const PresentationLotModal = ({
    isOpen,
    onClose,
    product,
    onSelectPresentation,
}) => {
    const [lots, setLots] = useState([]);
    const [isLoadingLots, setIsLoadingLots] = useState(false);
    const [selectedPresentation, setSelectedPresentation] = useState(null);
    const [selectedLot, setSelectedLot] = useState(null);

    // Cargar lotes del producto seleccionado y presentaciones
    useEffect(() => {
        if (isOpen && product) {
            const productId = product.idProducto || product.id;
            setIsLoadingLots(true);

            // Cargar lotes ordenados por vencimiento (FEFO)
            productsApi.get(`/lots/product/${productId}`)
                .then((res) => {
                    const loadedLots = res.data || [];
                    // Ordenar por fecha de vencimiento ascendente (FEFO)
                    loadedLots.sort((a, b) => {
                        const dateA = new Date(a.fechaVencimiento || "2099-12-31");
                        const dateB = new Date(b.fechaVencimiento || "2099-12-31");
                        return dateA - dateB;
                    });
                    setLots(loadedLots);
                    if (loadedLots.length > 0) {
                        setSelectedLot(loadedLots[0]);
                    } else {
                        setSelectedLot(null);
                    }
                })
                .catch(() => {
                    setLots([]);
                    setSelectedLot(null);
                })
                .finally(() => {
                    setIsLoadingLots(false);
                });

            // Seleccionar por defecto la primera presentación o unidad base
            const presList = getProductPresentations(product);
            if (presList.length > 0) {
                setSelectedPresentation(presList[0]);
            } else {
                setSelectedPresentation(null);
            }
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    // Obtener presentaciones válidas o generar Unidad por defecto
    function getProductPresentations(prod) {
        if (prod.presentaciones && prod.presentaciones.length > 0) {
            return prod.presentaciones;
        }
        // Fallback: presentación por defecto Unidad
        return [
            {
                idPresentacion: 0,
                nombrePresentacion: "UNIDAD",
                cantidadUnidades: 1,
                precioVenta: Number(prod.precioVenta || 0),
            },
        ];
    }

    const presentations = getProductPresentations(product);
    const totalStock = Number(product.stockReal !== undefined ? product.stockReal : (product.stock || 0));

    const handleConfirm = (pres = selectedPresentation) => {
        if (!pres) return;
        onSelectPresentation({
            product,
            presentation: pres,
            lot: selectedLot,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col animate-fadeIn">
                
                {/* Acento superior degradado */}
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-400" />

                {/* Cabecera del Producto */}
                <div className="p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0 shadow-sm">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-base leading-snug">
                                {product.nombre}
                            </h3>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                                {[product.formaFarmaceutica, product.concentracion].filter(Boolean).join(" - ") || "MEDICAMENTO"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Contenido Principal */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    
                    {/* Título Selección */}
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                            SELECCIONE PRESENTACIÓN
                        </span>

                        {/* Lista de Presentaciones */}
                        <div className="space-y-2.5">
                            {presentations.map((pres, idx) => {
                                const isSelected = selectedPresentation && (
                                    (selectedPresentation.idPresentacion && selectedPresentation.idPresentacion === pres.idPresentacion) ||
                                    (!selectedPresentation.idPresentacion && selectedPresentation.nombrePresentacion === pres.nombrePresentacion)
                                );

                                const baseUnits = Number(pres.cantidadUnidades || 1);
                                const availableStockForPres = baseUnits > 0 ? Math.floor(totalStock / baseUnits) : totalStock;
                                const price = Number(pres.precioVenta || product.precioVenta || 0);

                                return (
                                    <div
                                        key={pres.idPresentacion || idx}
                                        onClick={() => {
                                            setSelectedPresentation(pres);
                                        }}
                                        onDoubleClick={() => handleConfirm(pres)}
                                        className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                            isSelected
                                                ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20 shadow-sm"
                                                : "border-slate-200 hover:border-teal-300 hover:bg-slate-50/70"
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-black text-sm tracking-wide uppercase ${
                                                    isSelected ? "text-teal-800" : "text-slate-800"
                                                }`}>
                                                    {pres.nombrePresentacion || "UNIDAD"}
                                                </span>
                                                {isSelected && (
                                                    <span className="w-2 h-2 rounded-full bg-teal-600" />
                                                )}
                                            </div>
                                            <span className="text-[11px] text-slate-500 block mt-0.5">
                                                Equivale a {baseUnits} unidades base
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-extrabold text-base text-teal-700">
                                                S/ {price.toFixed(2)}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                                                STOCK: {availableStockForPres} DISP.
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CONTROL DE LOTES (SUGERENCIA FEFO) */}
                    <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect width="18" height="18" x="3" y="4" rx="2" strokeWidth="2" />
                                <line x1="16" x2="16" y1="2" y2="6" strokeWidth="2" />
                                <line x1="8" x2="8" y1="2" y2="6" strokeWidth="2" />
                                <line x1="3" x2="21" y1="10" strokeWidth="2" />
                            </svg>
                            <span>CONTROL DE LOTES (SUGERENCIA FEFO)</span>
                        </div>

                        {isLoadingLots ? (
                            <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                                Consultando lotes...
                            </div>
                        ) : lots.length > 0 ? (
                            <div className="space-y-2">
                                {lots.map((lote, lIdx) => {
                                    const isFirst = lIdx === 0;
                                    const isLoteSelected = selectedLot && (selectedLot.idLote === lote.idLote);
                                    const expDateStr = lote.fechaVencimiento
                                        ? lote.fechaVencimiento.slice(0, 10).split("-").reverse().join("/")
                                        : "31/12/2026";

                                    return (
                                        <div
                                            key={lote.idLote || lIdx}
                                            onClick={() => setSelectedLot(lote)}
                                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                                                isLoteSelected
                                                    ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/30"
                                                    : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/60"
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-xs text-slate-800">
                                                        LOTE: {lote.nroLote}
                                                    </span>
                                                    {isFirst && (
                                                        <span className="bg-[#f59e0b] text-slate-900 font-extrabold text-[9px] px-2 py-0.5 rounded tracking-wider shadow-sm uppercase">
                                                            SUGERENCIA DE SALIDA
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-slate-500 block mt-0.5">
                                                    Vence: {expDateStr}
                                                </span>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-xs font-bold text-slate-700 block">
                                                    Cant: {lote.cantidadActual}
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                                                    VIGENTE
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-bold text-slate-700 block">
                                        LOTE: PRINCIPAL / GENERAL
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        Stock disponible en almacén central
                                    </span>
                                </div>
                                <span className="font-bold text-emerald-600 text-[10px] uppercase">
                                    DISPONIBLE
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botones Inferiores */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleConfirm()}
                        className="px-6 py-2.5 text-xs font-bold text-white bg-[#005f60] hover:bg-[#004e4f] rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Agregar al Carrito</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

PresentationLotModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    product: PropTypes.object,
    onSelectPresentation: PropTypes.func.isRequired,
};
