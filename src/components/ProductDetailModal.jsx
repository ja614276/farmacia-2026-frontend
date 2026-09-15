import PropTypes from "prop-types";

export const ProductDetailModal = ({ product, onClose, onEdit, onAddToCart }) => {
    if (!product) return null;

    const idKey = product.idProducto || product.id || 0;
    const presentaciones = product.presentaciones || [
        {
            idPresentacion: 0,
            nombrePresentacion: "UNIDAD",
            cantidadUnidades: 1,
            precioVenta: product.precioVenta || product.price || 1.0,
            activo: true,
        },
    ];

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    const imageSrc = product.imagen
        ? product.imagen.startsWith("http")
            ? product.imagen
            : `${baseUrl}/uploads/${product.imagen}`
        : null;

    const totalStock = Number(
        product.stockReal !== undefined ? product.stockReal : (product.stock || 0)
    );

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. CABECERA CORPORATIVA */}
                <div className="bg-zinc-50 px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-900 flex-shrink-0 font-mono text-xs font-bold shadow-xs">
                            #{idKey}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm sm:text-base text-zinc-950 uppercase tracking-tight leading-none">
                                    {product.nombre || product.name}
                                </h3>
                                {product.requiereReceta ? (
                                    <span className="border border-zinc-900 bg-zinc-900 text-white font-bold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        RECETA MÉDICA
                                    </span>
                                ) : (
                                    <span className="border border-zinc-300 bg-zinc-100 text-zinc-700 font-semibold text-[9px] px-1.5 py-0.5 rounded uppercase">
                                        VENTA LIBRE
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-zinc-500 font-medium uppercase mt-0.5">
                                {[product.formaFarmaceutica, product.concentracion].filter(Boolean).join(" · ") || "MEDICAMENTO"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. CUERPO CON SCROLL INDEPENDIENTE */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-zinc-700 bg-white">
                    {/* PANEL SUPERIOR: Imagen + Información Clínica */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">

                        {/* Escenario de Imagen / Fotografía */}
                        <div className="md:col-span-4 flex flex-col">
                            <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-3 flex flex-col items-center justify-center min-h-[170px] h-full shadow-xs">
                                {imageSrc ? (
                                    <img
                                        src={imageSrc}
                                        alt={product.nombre}
                                        className="max-h-[150px] w-full object-contain rounded"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                            if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                                        }}
                                    />
                                ) : null}

                                <div
                                    className="flex flex-col items-center justify-center my-3"
                                    style={{ display: imageSrc ? "none" : "flex" }}
                                >
                                    <svg
                                        className="w-12 h-12 text-zinc-400 stroke-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.3 7l8.7 5 8.7-5M12 22V12" />
                                    </svg>
                                    <span className="text-[10px] text-zinc-400 font-medium mt-1 uppercase">
                                        Sin imagen física
                                    </span>
                                </div>

                                <div className="w-full mt-2 pt-2 border-t border-zinc-200 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                                    <span>STOCK ACTUAL:</span>
                                    <span className="font-bold text-zinc-900 text-xs">
                                        {totalStock} UND
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Ficha Farmacológica y Normativa */}
                        <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                            <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-3.5 space-y-2.5">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block border-b border-zinc-200 pb-1">
                                    ESPECIFICACIÓN FARMACOLÓGICA
                                </span>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">PRINCIPIO ACTIVO</span>
                                        <span className="font-bold text-zinc-900">
                                            {product.principioActivo || "No especificado"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">CONCENTRACIÓN</span>
                                        <span className="font-bold text-zinc-900">
                                            {product.concentracion || "No especificada"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">REGISTRO SANITARIO</span>
                                        <span className="font-mono font-bold text-zinc-800">
                                            {product.registroSanitario || "Sin registro"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">CÓDIGO DE BARRAS</span>
                                        <span className="font-mono font-bold text-zinc-800">
                                            {product.codigoBarras || "No asignado"}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-1">
                                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                                        INDICACIÓN TERAPÉUTICA / PATOLOGÍA
                                    </span>
                                    <div className="p-2 rounded bg-white border-l-2 border-zinc-900 border border-zinc-200 text-zinc-700 text-[11px] leading-relaxed italic">
                                        {product.patologia || "Sin indicación terapéutica registrada en el catálogo."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FRANJA DE TRAZABILIDAD Y ALMACÉN (4 Celdas) */}
                    <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                            TRAZABILIDAD Y ALMACENAMIENTO
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase block">CATEGORÍA</span>
                                <span className="font-bold text-zinc-800 text-xs truncate block mt-0.5">
                                    {product.categoria?.nombre || product.category?.nombre || "GENERAL"}
                                </span>
                            </div>
                            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase block">LABORATORIO</span>
                                <span className="font-bold text-zinc-800 text-xs truncate block mt-0.5">
                                    {product.laboratorioNombre || product.laboratorio?.nombre || "GENFAR"}
                                </span>
                            </div>
                            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase block">PROVEEDOR</span>
                                <span className="font-bold text-zinc-800 text-xs truncate block mt-0.5">
                                    {product.proveedor?.nombre || product.proveedorNombre || "PRINCIPAL"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block">UBICACIÓN FÍSICA</span>
                        <span className="font-bold text-zinc-800 text-xs truncate block mt-0.5">
                            {product.ubicacion?.nombre
                                ? `Ubicación: ${product.ubicacion.nombre}${product.ubicacion.pasillo || product.ubicacion.estante
                                    ? ` / Pasillo: ${product.ubicacion.pasillo || "-"} / Estante: ${product.ubicacion.estante || "-"}`
                                    : ""
                                }`
                                : product.ubicacionNombre || "Almacén Central"}
                        </span>
                    </div>

                    {/* TABLA DE PRESENTACIONES COMERCIALES */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                PRESENTACIONES COMERCIALES ({presentaciones.length})
                            </span>
                        </div>
                        <div className="border border-zinc-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse enterprise-table text-xs">
                                <thead>
                                    <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase">
                                        <th className="py-2 px-3">PRESENTACIÓN</th>
                                        <th className="py-2 px-3 text-center">EQUIVALENCIA</th>
                                        <th className="py-2 px-3 text-right">PRECIO VENTA</th>
                                        <th className="py-2 px-3 text-center">STOCK ESTIMADO</th>
                                        {onAddToCart && (
                                            <th className="py-2 px-3 text-right">ACCIÓN</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {presentaciones.map((pres, idx) => {
                                        const bUnits = Number(pres.cantidadUnidades || 1);
                                        const pStock = bUnits > 0 ? Math.floor(totalStock / bUnits) : totalStock;
                                        const pPrice = Number(pres.precioVenta || product.precioVenta || 0);

                                        return (
                                            <tr key={idx} className="hover:bg-zinc-50">
                                                <td className="py-2 px-3 font-bold text-zinc-900 uppercase">
                                                    {pres.nombrePresentacion}
                                                </td>
                                                <td className="py-2 px-3 text-center font-mono text-zinc-600">
                                                    {bUnits} {bUnits === 1 ? "unidad" : "unidades"}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">
                                                    S/ {pPrice.toFixed(2)}
                                                </td>
                                                <td className="py-2 px-3 text-center font-mono">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pStock <= 0
                                                        ? "bg-zinc-100 text-zinc-400"
                                                        : "bg-zinc-200/80 text-zinc-800"
                                                        }`}>
                                                        {pStock} disp.
                                                    </span>
                                                </td>
                                                {onAddToCart && (
                                                    <td className="py-2 px-3 text-right">
                                                        <button
                                                            type="button"
                                                            disabled={pStock <= 0}
                                                            onClick={() => onAddToCart(product, pres)}
                                                            className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${pStock <= 0
                                                                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                                                : "bg-zinc-900 hover:bg-black text-white"
                                                                }`}
                                                        >
                                                            Agregar
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 3. BOTONES DE PIE */}
                <div className="bg-zinc-50 px-5 py-3 border-t border-zinc-200 flex items-center justify-between flex-shrink-0">
                    <div>
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(product)}
                                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                                Editar Producto
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 bg-white hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                            Cerrar
                        </button>
                        {onAddToCart && (
                            <button
                                type="button"
                                disabled={totalStock <= 0}
                                onClick={() => onAddToCart(product)}
                                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${totalStock <= 0
                                    ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                                    : "bg-zinc-900 hover:bg-black text-white"
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Agregar al Carrito</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

ProductDetailModal.propTypes = {
    product: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onEdit: PropTypes.func,
    onAddToCart: PropTypes.func,
};