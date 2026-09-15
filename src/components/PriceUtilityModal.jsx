import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import productsApi from "../apis/productsApi";
import Swal from "sweetalert2";

export const PriceUtilityModal = ({
    isOpen,
    onClose,
    product,
    currentUnitCost = 0,
    onSaveSuccess,
}) => {
    const [lots, setLots] = useState([]);
    const [isLoadingLots, setIsLoadingLots] = useState(false);
    const [presentaciones, setPresentaciones] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const productId = product?.idProducto || product?.id;

    useEffect(() => {
        if (isOpen && productId) {
            // 1. Cargar historial de lotes existentes del producto
            setIsLoadingLots(true);
            productsApi
                .get(`/lots/product/${productId}`)
                .then((res) => {
                    setLots(res.data || []);
                })
                .catch(() => {
                    setLots([]);
                })
                .finally(() => {
                    setIsLoadingLots(false);
                });

            // 2. Inicializar presentaciones del producto
            const presList =
                product.presentaciones && product.presentaciones.length > 0
                    ? product.presentaciones
                    : [
                          {
                              idPresentacion: 0,
                              nombrePresentacion: "UNIDAD",
                              cantidadUnidades: 1,
                              precioVenta: Number(product.precioVenta || 0),
                          },
                      ];

            setPresentaciones(
                presList.map((p) => {
                    const uBase = Number(p.cantidadUnidades || 1);
                    const unitCost = Number(currentUnitCost || 0);
                    const costoTotal = uBase * unitCost;
                    const precioVenta = Number(p.precioVenta || 0);
                    const margen =
                        costoTotal > 0
                            ? Math.round(((precioVenta - costoTotal) / costoTotal) * 100)
                            : 0;
                    const utilidad = precioVenta - costoTotal;

                    return {
                        ...p,
                        uBase,
                        costoTotal,
                        precioVenta: precioVenta || 0,
                        margen,
                        utilidad,
                    };
                })
            );
        }
    }, [isOpen, productId, product, currentUnitCost]);

    if (!isOpen || !product) return null;

    // Actualizar precio de venta y recalcular margen y utilidad
    const handlePriceChange = (index, newPriceStr) => {
        const val = parseFloat(newPriceStr);
        const newPrice = isNaN(val) ? 0 : val;

        setPresentaciones((prev) => {
            const copy = [...prev];
            const item = { ...copy[index] };
            item.precioVenta = newPrice;
            item.utilidad = Number((newPrice - item.costoTotal).toFixed(2));
            item.margen =
                item.costoTotal > 0
                    ? Math.round(((newPrice - item.costoTotal) / item.costoTotal) * 100)
                    : 0;
            copy[index] = item;
            return copy;
        });
    };

    // Actualizar margen y recalcular precio de venta y utilidad
    const handleMarginChange = (index, newMarginStr) => {
        const val = parseFloat(newMarginStr);
        const newMargin = isNaN(val) ? 0 : val;

        setPresentaciones((prev) => {
            const copy = [...prev];
            const item = { ...copy[index] };
            item.margen = newMargin;
            const newPrice = Number(
                (item.costoTotal * (1 + newMargin / 100)).toFixed(2)
            );
            item.precioVenta = newPrice;
            item.utilidad = Number((newPrice - item.costoTotal).toFixed(2));
            copy[index] = item;
            return copy;
        });
    };

    // Guardar presentación individual o todo el lote de precios
    const handleSavePresentation = async (index) => {
        try {
            setIsSaving(true);
            const target = presentaciones[index];

            // Preparar presentaciones actualizadas
            const updatedPresentaciones = presentaciones.map((p, idx) => ({
                idPresentacion: p.idPresentacion || (idx === 0 ? 0 : idx),
                nombrePresentacion: p.nombrePresentacion || "UNIDAD",
                cantidadUnidades: p.uBase || p.cantidadUnidades || 1,
                precioVenta: Number(p.precioVenta || 0),
                activo: true,
            }));

            const mainPrice = Number(updatedPresentaciones[0]?.precioVenta || product.precioVenta || 0);

            // Actualizar producto en backend
            const payload = {
                ...product,
                precioVenta: mainPrice,
                presentaciones: updatedPresentaciones,
            };

            await productsApi.put(`/products/${productId}`, payload);

            Swal.fire({
                title: "Precio Actualizado",
                text: `Se actualizó el precio de ${target.nombrePresentacion} a S/ ${target.precioVenta.toFixed(2)}`,
                icon: "success",
                confirmButtonColor: "#09090b",
                timer: 1500,
            });

            if (onSaveSuccess) {
                onSaveSuccess(payload);
            }
        } catch (error) {
            console.error("Error al guardar precios:", error);
            Swal.fire("Error", "No se pudo actualizar el precio en el servidor.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* CABECERA */}
                <div className="bg-zinc-950 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-white tracking-wide">
                                Precios y Utilidad
                            </h3>
                            <p className="text-[11px] text-zinc-400 font-medium">
                                {product.nombre} {[product.formaFarmaceutica, product.concentracion].filter(Boolean).join(" · ")}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                        title="Cerrar (Esc)"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* CUERPO */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-zinc-700 bg-white">
                    
                    {/* TABLA 1: HISTORIAL DE COSTOS Y LOTES */}
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                HISTORIAL DE COSTOS Y LOTES
                            </span>
                        </div>

                        <div className="border border-zinc-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs enterprise-table">
                                <thead>
                                    <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase">
                                        <th className="py-2 px-3">LOTE</th>
                                        <th className="py-2 px-3">VENCIMIENTO</th>
                                        <th className="py-2 px-3 text-right">COSTO C/U</th>
                                        <th className="py-2 px-3 text-center">STOCK ACTUAL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {isLoadingLots ? (
                                        <tr>
                                            <td colSpan="4" className="py-4 text-center text-zinc-400 text-xs">
                                                Cargando historial de lotes...
                                            </td>
                                        </tr>
                                    ) : lots.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-4 text-center text-zinc-400 text-xs">
                                                No registra lotes previos. Este será el primer lote registrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        lots.map((l, idx) => {
                                            const expStr = l.fechaVencimiento
                                                ? l.fechaVencimiento.slice(0, 10).split("-").reverse().join("/")
                                                : "—";
                                            const cost = Number(l.costoUnitario || 0);

                                            return (
                                                <tr key={l.idLote || idx} className="hover:bg-zinc-50">
                                                    <td className="py-2 px-3 font-mono font-bold text-zinc-900">
                                                        {l.nroLote}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-zinc-600">
                                                        {expStr}
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">
                                                        S/ {cost.toFixed(4)}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className="bg-zinc-200/80 text-zinc-900 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                                                            {l.cantidadActual}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* TABLA 2: PRECIOS DE VENTA (PRESENTACIONES) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                    PRECIOS DE VENTA (PRESENTACIONES)
                                </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 font-mono">
                                Costo Base Compra: S/ {Number(currentUnitCost || 0).toFixed(2)}
                            </span>
                        </div>

                        <div className="border border-zinc-200 rounded-lg overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs enterprise-table">
                                <thead>
                                    <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase">
                                        <th className="py-2 px-3">PRESENTACIÓN</th>
                                        <th className="py-2 px-3 text-center">U. BASE</th>
                                        <th className="py-2 px-3 text-right">COSTO TOTAL</th>
                                        <th className="py-2 px-3 text-right">PRECIO VENTA</th>
                                        <th className="py-2 px-3 text-center">MARGEN (%)</th>
                                        <th className="py-2 px-3 text-right">UTILIDAD</th>
                                        <th className="py-2 px-3 text-center">ACCIÓN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {presentaciones.map((p, idx) => {
                                        return (
                                            <tr key={idx} className="hover:bg-zinc-50">
                                                <td className="py-2.5 px-3 font-bold text-zinc-900 uppercase">
                                                    {p.nombrePresentacion}
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-mono text-zinc-600">
                                                    {p.uBase}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono text-zinc-700">
                                                    S/ {p.costoTotal.toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <span className="text-zinc-500 text-[11px]">S/</span>
                                                        <input
                                                            type="number"
                                                            step="0.10"
                                                            min="0"
                                                            value={p.precioVenta}
                                                            onChange={(e) => handlePriceChange(idx, e.target.value)}
                                                            className="w-20 px-1.5 py-1 text-right font-mono font-bold text-zinc-950 bg-white border border-zinc-300 rounded focus:border-zinc-900 focus:outline-none text-xs"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        <input
                                                            type="number"
                                                            step="1"
                                                            value={p.margen}
                                                            onChange={(e) => handleMarginChange(idx, e.target.value)}
                                                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-zinc-950 bg-white border border-zinc-300 rounded focus:border-zinc-900 focus:outline-none text-xs"
                                                        />
                                                        <span className="text-zinc-400 text-[10px]">%</span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                                                    S/ {p.utilidad.toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <button
                                                        type="button"
                                                        disabled={isSaving}
                                                        onClick={() => handleSavePresentation(idx)}
                                                        className="px-3 py-1 bg-zinc-900 hover:bg-black text-white text-[11px] font-bold rounded shadow-xs transition-colors"
                                                    >
                                                        Guardar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* PIE */}
                <div className="bg-zinc-50 px-5 py-3 border-t border-zinc-200 flex items-center justify-end flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

PriceUtilityModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    product: PropTypes.object,
    currentUnitCost: PropTypes.number,
    onSaveSuccess: PropTypes.func,
};
