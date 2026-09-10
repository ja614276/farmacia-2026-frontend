import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export const ProductRow = ({
    product,
    isAdmin = true,
    handlerProductSelectedForm,
    handlerRemoveProduct,
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
        if (window.confirm(`¿Desea eliminar ${product.nombre || product.name}?`)) {
            handlerRemoveProduct(id);
        }
    };

    return (
        <tr className="product-item-row align-middle">
            {/* 1. Información del producto (Nombre + Badge de venta) */}
            <td>
                <div className="fw-bold text-dark text-uppercase" style={{ fontSize: "0.85rem", letterSpacing: "0.2px" }}>
                    {product.nombre || product.name}
                </div>
                <div>
                    {product.requiereReceta ? (
                        <span className="badge-tag-receta">
                            • RECETA MÉDICA
                        </span>
                    ) : (
                        <span className="badge-tag-libre">
                            • VENTA LIBRE
                        </span>
                    )}
                </div>
            </td>

            {/* 2. Principio Activo */}
            <td>
                <div className="d-flex align-items-center gap-2 text-secondary">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M10 2v2" />
                        <path d="M14 2v2" />
                        <path d="M16 8a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v11a4 4 0 0 0 4 4 4 4 0 0 0 4-4V8z" />
                        <line x1="6" y1="12" x2="18" y2="12" />
                    </svg>
                    <span>{product.principioActivo || "No especificado"}</span>
                </div>
            </td>

            {/* 3. Cons. / Forma */}
            <td>
                <div className="text-dark fw-medium" style={{ fontSize: "0.82rem" }}>
                    {product.concentracion || "—"}
                </div>
                <div className="text-muted text-uppercase" style={{ fontSize: "0.72rem" }}>
                    {product.formaFarmaceutica || ""}
                </div>
            </td>

            {/* 4. Categoría */}
            <td>
                <span className="text-secondary small">
                    {product.categoria?.nombre || product.category?.nombre || "N/A"}
                </span>
            </td>

            {/* 5. Laboratorio */}
            <td>
                <span className="badge-laboratorio">
                    {product.laboratorioNombre || product.laboratorio?.nombre || "N/A"}
                </span>
            </td>

            {/* 6. Ubicación (Almacén) */}
            <td>
                <div className="d-flex align-items-center gap-1 text-muted text-uppercase" style={{ fontSize: "0.75rem" }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f87171"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{product.ubicacion?.nombre || "SIN ASIGNAR"}</span>
                </div>
            </td>

            {/* 7. Acciones */}
            <td className="text-end pe-4" style={{ whiteSpace: "nowrap" }}>
                <div className="d-inline-flex align-items-center gap-1">
                    {/* Botón Ver Ficha Técnica (Ruta a Pantalla Completa) */}
                    <button
                        type="button"
                        className="btn-action-icon text-info"
                        title="Ver ficha técnica"
                        onClick={() => navigate(`/products/${id}/detail`)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>

                    {/* Botón Lotes y Precios (Ruta a Pantalla Completa) */}
                    <button
                        type="button"
                        className="btn-action-icon text-dark"
                        title="Ver Lotes y Precios"
                        onClick={() => navigate(`/products/${id}/lots`)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="5" r="3"/>
                            <circle cx="6" cy="12" r="3"/>
                            <circle cx="18" cy="12" r="3"/>
                            <circle cx="12" cy="19" r="3"/>
                        </svg>
                    </button>

                    {/* Botón Editar Producto */}
                    {isAdmin && (
                        <button
                            type="button"
                            className="btn-action-icon text-secondary"
                            title="Editar producto"
                            onClick={handleEdit}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                    )}

                    {/* Botón Eliminar Producto */}
                    {isAdmin && (
                        <button
                            type="button"
                            className="btn-action-icon text-danger"
                            title="Eliminar producto"
                            onClick={handleDelete}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    )}
                </div>
            </td>

            <style>{`
                .product-item-row:hover {
                    background-color: #fbfcfd !important;
                }
                .badge-tag-libre {
                    color: #059669;
                    font-size: 0.68rem;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .badge-tag-receta {
                    color: #e11d48;
                    font-size: 0.68rem;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .badge-laboratorio {
                    color: #0284c7;
                    font-weight: 700;
                    font-size: 0.75rem;
                    letter-spacing: 0.3px;
                }
                .btn-action-icon {
                    background: transparent;
                    border: none;
                    padding: 4px;
                    border-radius: 4px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.15s;
                }
                .btn-action-icon:hover {
                    background-color: #f1f5f9;
                    transform: scale(1.1);
                }
            `}</style>
        </tr>
    );
};

ProductRow.propTypes = {
    product: PropTypes.object.isRequired,
    isAdmin: PropTypes.bool,
    handlerProductSelectedForm: PropTypes.func,
    handlerRemoveProduct: PropTypes.func,
};