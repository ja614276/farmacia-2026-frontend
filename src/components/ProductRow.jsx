import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export const ProductRow = ({
    product,
    isAdmin = true,
    handlerProductSelectedForm,
    handlerRemoveProduct,
    onViewDetail,
    onViewLots,
}) => {
    const navigate = useNavigate();
    const id = product.idProducto || product.id;

    const handleEdit = () => {
        if (handlerProductSelectedForm) {
            handlerProductSelectedForm(product);
        }
        navigate(`/products/edit/${id}`);
    };

    const handleDelete = () => {
        if (handlerRemoveProduct) {
            handlerRemoveProduct(id);
        }
    };

    const handleViewDetail = () => {
        if (onViewDetail) {
            onViewDetail(product);
        } else {
            navigate(`/products/${id}/detail`);
        }
    };

    const handleViewLots = () => {
        if (onViewLots) {
            onViewLots(product);
        } else {
            navigate(`/products/${id}/lots`);
        }
    };

    return (
        <tr className="hover:bg-zinc-50/70 transition-colors border-b border-zinc-100 text-xs text-zinc-700">
            {/* 1. Información del producto */}
            <td className="py-3 px-4">
                <div className="font-bold text-zinc-950 uppercase tracking-tight text-xs">
                    {product.nombre || product.name}
                </div>
                {(product.codigoBarras || product.codDigemid) && (
                    <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
                        CÓD: {product.codigoBarras || product.codDigemid}
                    </div>
                )}
            </td>

            {/* 2. Principio Activo */}
            <td className="py-3 px-3.5">
                <span className="font-medium text-zinc-800">
                    {product.principioActivo || "—"}
                </span>
            </td>

            {/* 3. Concentración y Forma */}
            <td className="py-3 px-3.5">
                <div className="font-semibold text-zinc-900">
                    {product.concentracion || "—"}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {product.formaFarmaceutica || ""}
                </div>
            </td>

            {/* 4. Categoría */}
            <td className="py-3 px-3.5">
                <span className="text-zinc-600 font-medium">
                    {product.categoria?.nombre || product.category?.nombre || "General"}
                </span>
            </td>

            {/* 5. Laboratorio */}
            <td className="py-3 px-3.5">
                <span className="font-mono text-[11px] font-bold text-zinc-900 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                    {product.laboratorioNombre || product.laboratorio?.nombre || "S/L"}
                </span>
            </td>

            {/* 6. Ubicación (Almacén) */}
            <td className="py-3 px-3.5">
                <span className="font-mono text-[11px] text-zinc-500 uppercase">
                    {product.ubicacion?.nombre || "SIN ASIGNAR"}
                </span>
            </td>

            {/* 7. Acciones */}
            <td className="py-3 px-4 text-right whitespace-nowrap">
                <div className="inline-flex items-center justify-end gap-1.5">
                    {/* Botón Ver (Modal de Ficha Técnica) */}
                    <button
                        type="button"
                        onClick={handleViewDetail}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-zinc-800 hover:text-black bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded transition-colors"
                        title="Ver ficha técnica"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Ver</span>
                    </button>

                    {/* Botón Lotes */}
                    <button
                        type="button"
                        onClick={handleViewLots}
                        className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 border border-zinc-200 rounded transition-colors"
                        title="Lotes y Precios"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                    </button>

                    {/* Botón Editar */}
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 border border-zinc-200 rounded transition-colors"
                            title="Editar producto"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                        </button>
                    )}

                    {/* Botón Eliminar */}
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="p-1.5 text-zinc-400 hover:text-red-700 hover:bg-zinc-100 rounded transition-colors"
                            title="Eliminar producto"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

ProductRow.propTypes = {
    product: PropTypes.object.isRequired,
    isAdmin: PropTypes.bool,
    handlerProductSelectedForm: PropTypes.func,
    handlerRemoveProduct: PropTypes.func,
    onViewDetail: PropTypes.func,
    onViewLots: PropTypes.func,
};

export default ProductRow;