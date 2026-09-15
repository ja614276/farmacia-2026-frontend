import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import productsApi from "../apis/productsApi";

export const PresentationLotModal = ({
    isOpen,
    onClose,
    product,
    availableStock,
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

            // Seleccionar por defecto la primera presentación o unidad base disponible
            const presList = getProductPresentations(product);
            const stockRemaining = availableStock !== undefined
                ? availableStock
                : Number(product.stockReal !== undefined ? product.stockReal : (product.stock || 0));

            const firstAvailable = presList.find((p) => {
                const bUnits = Number(p.cantidadUnidades || 1);
                return bUnits > 0 && Math.floor(stockRemaining / bUnits) > 0;
            });

            if (firstAvailable) {
                setSelectedPresentation(firstAvailable);
            } else if (presList.length > 0) {
                setSelectedPresentation(presList[0]);
            } else {
                setSelectedPresentation(null);
            }
        }
    }, [isOpen, product, availableStock]);

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
    const totalStock = availableStock !== undefined
        ? availableStock
        : Number(product.stockReal !== undefined ? product.stockReal : (product.stock || 0));

    const handleConfirm = (pres = selectedPresentation) => {
        if (!pres) return;
        const baseUnits = Number(pres.cantidadUnidades || 1);
        if (totalStock < baseUnits) return;

        onSelectPresentation({
            product,
            presentation: pres,
            lot: selectedLot,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-lg overflow-hidden flex flex-col animate-fadeIn">

                {/* Cabecera del Producto */}
                <div className="p-5 pb-4 flex items-start justify-between gap-4 border-b border-zinc-200 bg-zinc-50">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-900 flex-shrink-0 shadow-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-zinc-900 text-sm leading-snug">
                                {product.nombre}
                            </h3>
                            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mt-0.5">
                                {[product.formaFarmaceutica, product.concentracion].filter(Boolean).join(" - ") || "MEDICAMENTO"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contenido Principal */}
                <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* Título Selección */}
                    <div>
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2.5">
                            SELECCIONE PRESENTACIÓN
                        </span>

                        {/* Lista de Presentaciones */}
                        <div className="space-y-2">
                            {presentations.map((pres, idx) => {
                                const isSelected = selectedPresentation && (
                                    (selectedPresentation.idPresentacion && selectedPresentation.idPresentacion === pres.idPresentacion) ||
                                    (!selectedPresentation.idPresentacion && selectedPresentation.nombrePresentacion === pres.nombrePresentacion)
                                );

                                const baseUnits = Number(pres.cantidadUnidades || 1);
                                const availableStockForPres = baseUnits > 0 ? Math.floor(totalStock / baseUnits) : totalStock;
                                const price = Number(pres.precioVenta || product.precioVenta || 0);
                                const isOutOfStock = availableStockForPres <= 0;

                                return (
                                    <div
                                        key={pres.idPresentacion || idx}
                                        onClick={() => {
                                            if (!isOutOfStock) {
                                                setSelectedPresentation(pres);
                                            }
                                        }}
                                        onDoubleClick={() => {
                                            if (!isOutOfStock) {
                                                handleConfirm(pres);
                                            }
                                        }}
                                        className={`p-3.5 rounded-lg border transition-all flex items-center justify-between group ${isOutOfStock
                                                ? "opacity-40 border-zinc-200 bg-zinc-50 cursor-not-allowed"
                                                : isSelected
                                                    ? "cursor-pointer border-zinc-900 bg-zinc-100 ring-1 ring-zinc-900 shadow-sm"
                                                    : "cursor-pointer border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                                            }`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-xs tracking-wide uppercase ${isOutOfStock
                                                        ? "text-zinc-400"
                                                        : isSelected ? "text-zinc-950 font-extrabold" : "text-zinc-800"
                                                    }`}>
                                                    {pres.nombrePresentacion || "UNIDAD"}
                                                </span>
                                                {isSelected && !isOutOfStock && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                                                )}
                                                {isOutOfStock && (
                                                    <span className="text-[10px] bg-zinc-200 text-zinc-600 font-bold px-1.5 py-0.5 rounded border border-zinc-300">
                                                        AGOTADO
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-zinc-500 block mt-0.5">
                                                Equivale a {baseUnits} unidades base
                                            </span>
                                        </div>

                                        <div className="text-right">
                                            <div className={`font-mono font-bold text-sm ${isOutOfStock ? "text-zinc-400" : "text-zinc-950"}`}>
                                                S/ {price.toFixed(2)}
                                            </div>
                                            <span className={`text-[10px] font-semibold uppercase tracking-tight block ${isOutOfStock ? "text-zinc-400" : "text-zinc-500"
                                                }`}>
                                                {isOutOfStock ? "SIN STOCK DISP." : `STOCK: ${availableStockForPres} DISP.`}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CONTROL DE LOTES (SUGERENCIA FEFO) */}
                    <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect width="18" height="18" x="3" y="4" rx="2" strokeWidth="2" />
                                <line x1="16" x2="16" y1="2" y2="6" strokeWidth="2" />
                                <line x1="8" x2="8" y1="2" y2="6" strokeWidth="2" />
                                <line x1="3" x2="21" y1="10" strokeWidth="2" />
                            </svg>
                            <span>CONTROL DE LOTES (SUGERENCIA FEFO)</span>
                        </div>

                        {isLoadingLots ? (
                            <div className="p-4 bg-zinc-50 rounded-lg text-center text-xs text-zinc-400 border border-zinc-200">
                                Consultando lotes...
                            </div>
                        ) : lots.length > 0 ? (
                            <div className="space-y-1.5">
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
                                            className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${isLoteSelected
                                                    ? "bg-zinc-100 border-zinc-900 ring-1 ring-zinc-900 shadow-sm"
                                                    : "bg-zinc-50/70 border-zinc-200 hover:bg-zinc-100/70"
                                                }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs text-zinc-900">
                                                        LOTE: {lote.nroLote}
                                                    </span>
                                                    {isFirst && (
                                                        <span className="bg-zinc-900 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase">
                                                            SUGERENCIA FEFO
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-zinc-500 block mt-0.5">
                                                    Vence: {expDateStr}
                                                </span>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-xs font-bold text-zinc-800 block">
                                                    Cant: {lote.cantidadActual}
                                                </span>
                                                <span className="text-[10px] font-semibold text-zinc-500 uppercase">
                                                    VIGENTE
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-mono font-bold text-zinc-800 block">
                                        LOTE: PRINCIPAL / GENERAL
                                    </span>
                                    <span className="text-[11px] text-zinc-500">
                                        Stock disponible en almacén central
                                    </span>
                                </div>
                                <span className="font-bold text-zinc-700 text-[10px] uppercase bg-zinc-200 px-2 py-0.5 rounded">
                                    DISPONIBLE
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botones Inferiores */}
                <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-200 bg-white"
                    >
                        Cerrar
                    </button>
                    {(() => {
                        const selUnits = Number(selectedPresentation?.cantidadUnidades || 1);
                        const isPresDisabled = !selectedPresentation || (selUnits > 0 && Math.floor(totalStock / selUnits) <= 0);
                        return (
                            <button
                                type="button"
                                disabled={isPresDisabled}
                                onClick={() => handleConfirm()}
                                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${isPresDisabled
                                        ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                                        : "text-white bg-zinc-900 hover:bg-black hover:shadow"
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>{isPresDisabled ? "Sin Stock" : "Agregar al Carrito"}</span>
                            </button>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

PresentationLotModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    product: PropTypes.object,
    availableStock: PropTypes.number,
    onSelectPresentation: PropTypes.func.isRequired,
};
