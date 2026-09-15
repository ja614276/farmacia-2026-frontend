import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import productsApi from "../apis/productsApi";
import { findAllSuppliers } from "../services/SupplierService";
import { savePurchase } from "../services/PurchaseService";
import { PriceUtilityModal } from "../components/PriceUtilityModal";

export const PurchaseRegisterPage = () => {
    const navigate = useNavigate();

    // Estado general de la compra
    const [generalInfo, setGeneralInfo] = useState({
        proveedorId: "",
        fechaEmision: new Date().toISOString().split("T")[0],
        numeroDocumento: "",
    });

    // Listas maestras desde el backend
    const [suppliersList, setSuppliersList] = useState([]);
    const [productsList, setProductsList] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Buscador rápido superior de productos
    const [quickSearchQuery, setQuickSearchQuery] = useState("");
    const [isQuickSearching, setIsQuickSearching] = useState(false);
    const quickSearchRef = useRef(null);

    // Filas de productos a ingresar
    const [items, setItems] = useState([
        {
            id: Date.now(),
            productoId: null,
            producto: null,
            searchQuery: "",
            numeroLote: "",
            fechaVencimiento: "",
            cantidad: 1,
            costoUnitario: 0.0,
            isSearching: false,
        },
    ]);

    // Estado del modal de Precios y Utilidad
    const [selectedProductForUtility, setSelectedProductForUtility] = useState(null);
    const [selectedUnitCostForUtility, setSelectedUnitCostForUtility] = useState(0);
    const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar proveedores y productos registrados
    useEffect(() => {
        setIsLoadingData(true);
        Promise.all([
            findAllSuppliers().catch(() => ({ data: [] })),
            productsApi.get("/products").catch(() => ({ data: [] })),
        ])
            .then(([suppliersRes, productsRes]) => {
                setSuppliersList(suppliersRes.data || []);
                setProductsList(productsRes.data || []);
            })
            .finally(() => {
                setIsLoadingData(false);
            });
    }, []);

    // Cerrar buscador rápido al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (quickSearchRef.current && !quickSearchRef.current.contains(e.target)) {
                setIsQuickSearching(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Proveedor seleccionado actualmente
    const selectedSupplier = useMemo(() => {
        if (!generalInfo.proveedorId) return null;
        return suppliersList.find(
            (s) => String(s.id || s.idProveedor) === String(generalInfo.proveedorId)
        );
    }, [generalInfo.proveedorId, suppliersList]);

    // Manejo de cambios en datos generales
    const handleGeneralChange = (e) => {
        setGeneralInfo((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Manejo de cambios en los campos de una fila
    const handleItemChange = (index, field, value) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Selección de producto autocompletado en una fila específica
    const handleSelectProduct = (index, prod) => {
        setItems((prev) => {
            const updated = [...prev];
            const defaultCost = Number(prod.precioCompra || prod.costoUnitario || 0);
            updated[index] = {
                ...updated[index],
                productoId: prod.idProducto || prod.id,
                producto: prod,
                searchQuery: prod.nombre,
                costoUnitario: defaultCost > 0 ? defaultCost : updated[index].costoUnitario,
                isSearching: false,
            };
            return updated;
        });
    };

    // Limpiar producto seleccionado en una fila
    const handleClearSelectedProduct = (index) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                productoId: null,
                producto: null,
                searchQuery: "",
                isSearching: false,
            };
            return updated;
        });
    };

    // Agregar producto desde el buscador rápido superior
    const handleAddProductFromQuickSearch = (prod) => {
        const defaultCost = Number(prod.precioCompra || prod.costoUnitario || 0);
        setItems((prev) => {
            // Si la primera y única fila está vacía, llenarla
            if (
                prev.length === 1 &&
                !prev[0].productoId &&
                !prev[0].numeroLote &&
                !prev[0].searchQuery
            ) {
                return [
                    {
                        ...prev[0],
                        productoId: prod.idProducto || prod.id,
                        producto: prod,
                        searchQuery: prod.nombre,
                        costoUnitario: defaultCost > 0 ? defaultCost : 0,
                        isSearching: false,
                    },
                ];
            }
            // De lo contrario, agregar una nueva fila con este producto
            return [
                ...prev,
                {
                    id: Date.now() + Math.random(),
                    productoId: prod.idProducto || prod.id,
                    producto: prod,
                    searchQuery: prod.nombre,
                    numeroLote: "",
                    fechaVencimiento: "",
                    cantidad: 1,
                    costoUnitario: defaultCost > 0 ? defaultCost : 0,
                    isSearching: false,
                },
            ];
        });
        setQuickSearchQuery("");
        setIsQuickSearching(false);
    };

    // Resultados del buscador rápido superior
    const quickSearchResults = useMemo(() => {
        if (!quickSearchQuery.trim()) return [];
        const q = quickSearchQuery.toLowerCase();
        return productsList
            .filter((p) => {
                const n = (p.nombre || "").toLowerCase();
                const a = (p.principioActivo || "").toLowerCase();
                const b = (p.codigoBarras || "").toLowerCase();
                const l = (p.laboratorioNombre || p.laboratorio?.nombre || "").toLowerCase();
                return n.includes(q) || a.includes(q) || b.includes(q) || l.includes(q);
            })
            .slice(0, 10);
    }, [quickSearchQuery, productsList]);

    // Agregar nueva fila manual de producto
    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                productoId: null,
                producto: null,
                searchQuery: "",
                numeroLote: "",
                fechaVencimiento: "",
                cantidad: 1,
                costoUnitario: 0.0,
                isSearching: false,
            },
        ]);
    };

    // Eliminar fila
    const handleRemoveItem = (index) => {
        if (items.length === 1) {
            setItems([
                {
                    id: Date.now(),
                    productoId: null,
                    producto: null,
                    searchQuery: "",
                    numeroLote: "",
                    fechaVencimiento: "",
                    cantidad: 1,
                    costoUnitario: 0.0,
                    isSearching: false,
                },
            ]);
            return;
        }
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    // Abrir modal de Precios y Utilidad
    const handleOpenUtilityModal = (item) => {
        if (!item.producto) {
            Swal.fire({
                title: "Seleccione un producto",
                text: "Primero debe seleccionar un producto en la fila para revisar precios y utilidad.",
                icon: "info",
                confirmButtonColor: "#09090b",
            });
            return;
        }
        setSelectedProductForUtility(item.producto);
        setSelectedUnitCostForUtility(Number(item.costoUnitario || 0));
        setIsUtilityModalOpen(true);
    };

    // Callback tras guardar precios desde el modal de utilidad
    const handleSavePricesSuccess = (updatedProduct) => {
        setProductsList((prev) =>
            prev.map((p) =>
                (p.idProducto || p.id) === (updatedProduct.idProducto || updatedProduct.id)
                    ? updatedProduct
                    : p
            )
        );
        setItems((prev) =>
            prev.map((it) =>
                it.productoId === (updatedProduct.idProducto || updatedProduct.id)
                    ? { ...it, producto: updatedProduct }
                    : it
            )
        );
    };

    // Cálculo total de compra
    const totalGeneral = useMemo(() => {
        return items.reduce((acc, it) => {
            const sub = (Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0);
            return acc + sub;
        }, 0);
    }, [items]);

    // Enviar formulario: Crear lotes y registrar compra
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validaciones
        if (!generalInfo.proveedorId) {
            Swal.fire("Proveedor Requerido", "Por favor seleccione el proveedor de la compra.", "warning");
            return;
        }

        if (!generalInfo.numeroDocumento.trim()) {
            Swal.fire("Nº de Factura Requerido", "Ingrese el número de comprobante o guía de compra.", "warning");
            return;
        }

        const validItems = items.filter((it) => it.productoId && it.numeroLote.trim() && it.fechaVencimiento);

        if (validItems.length === 0) {
            Swal.fire(
                "Productos Incompletos",
                "Debe completar al menos un producto con su lote y fecha de vencimiento.",
                "warning"
            );
            return;
        }

        try {
            setIsSubmitting(true);

            // 2. Generar cada lote en backend mediante POST /lots (actualiza stockReal de producto automáticamente)
            const createdLots = [];
            for (const it of validItems) {
                const formattedDate = it.fechaVencimiento.includes(" ")
                    ? it.fechaVencimiento
                    : `${it.fechaVencimiento} 00:00:00`;

                const lotPayload = {
                    idProducto: Number(it.productoId),
                    nroLote: it.numeroLote.trim().toUpperCase(),
                    fechaVencimiento: formattedDate,
                    cantidadInicial: Number(it.cantidad),
                    cantidadActual: Number(it.cantidad),
                    costoUnitario: Number(it.costoUnitario),
                };

                try {
                    const lotRes = await productsApi.post("/lots", lotPayload);
                    createdLots.push({
                        ...it,
                        generatedLotId: lotRes.data?.idLote || null,
                    });
                } catch (lotErr) {
                    console.error("Error al registrar lote:", lotErr);
                    createdLots.push(it);
                }
            }

            // 3. Registrar la compra formal en el backend mediante POST /purchases
            const purchasePayload = {
                invoiceNumber: generalInfo.numeroDocumento.trim().toUpperCase(),
                supplierId: Number(generalInfo.proveedorId),
                purchaseDate: `${generalInfo.fechaEmision} 00:00:00`,
                total: Number(totalGeneral.toFixed(2)),
                isActive: true,
                details: createdLots.map((it) => ({
                    productId: it.productoId,
                    cantidad: Number(it.cantidad),
                    precioCosto: Number(it.costoUnitario),
                    lotId: it.generatedLotId || null,
                    nroLote: it.numeroLote.trim().toUpperCase(),
                })),
            };

            await savePurchase(purchasePayload);

            await Swal.fire({
                title: "Compra Registrada",
                text: `Se registraron los lotes y la compra ${generalInfo.numeroDocumento} con éxito. El inventario ha sido actualizado.`,
                icon: "success",
                confirmButtonColor: "#09090b",
            });

            navigate("/sales");
        } catch (error) {
            console.error("Error al procesar la compra:", error);
            const msg = error.response?.data?.message || "Ocurrió un error al procesar el registro de compra.";
            Swal.fire("Error al Registrar", msg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
            {/* CABECERA CORPORATIVA MONOCROMÁTICA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1.5">
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/dashboard")}>Dashboard</span>
                        <span>/</span>
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/sales")}>Compras</span>
                        <span>/</span>
                        <span className="text-zinc-950 font-bold">Nueva Compra</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                                Registro de Nueva Compra
                            </h1>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Adquisición de mercadería, generación directa de lotes y costeo unitario.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors shadow-2xs"
                    >
                        Volver
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* SECCIÓN 1: INFORMACIÓN GENERAL DE COMPRA (ESPACIOSA, NO APEGADA) */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6 sm:p-7 shadow-xs">
                    {/* Header de sección con insignia */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                                    Información General de Compra
                                </h2>
                                <p className="text-[11px] text-zinc-500">
                                    Datos fiscales del proveedor y comprobante de adquisición
                                </p>
                            </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md uppercase tracking-wider self-start sm:self-auto">
                            Paso 1 · Comprobante
                        </span>
                    </div>

                    {/* Grid espacioso y proporcional */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Selector de Proveedor (50% en pantallas grandes) */}
                        <div className="lg:col-span-6 space-y-1.5">
                            <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                Proveedor *
                            </label>
                            <select
                                name="proveedorId"
                                value={generalInfo.proveedorId}
                                onChange={handleGeneralChange}
                                required
                                className="w-full h-11 px-3.5 text-xs font-semibold text-zinc-900 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all cursor-pointer shadow-2xs"
                            >
                                <option value="">Seleccione proveedor comercial...</option>
                                {suppliersList.map((sup) => (
                                    <option key={sup.id || sup.idProveedor} value={sup.id || sup.idProveedor}>
                                        {sup.nombre} {sup.contacto ? `— Contacto: ${sup.contacto}` : ""}
                                    </option>
                                ))}
                            </select>

                            {/* Tarjeta informativa del proveedor seleccionado */}
                            {selectedSupplier && (
                                <div className="mt-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-600 animate-fadeIn">
                                    <span className="font-bold text-zinc-900">
                                        Proveedor: {selectedSupplier.nombre}
                                    </span>
                                    {selectedSupplier.contacto && (
                                        <span>
                                            <strong className="text-zinc-700 font-semibold">Contacto:</strong> {selectedSupplier.contacto}
                                        </span>
                                    )}
                                    {selectedSupplier.telefono && (
                                        <span>
                                            <strong className="text-zinc-700 font-semibold">Tel:</strong> {selectedSupplier.telefono}
                                        </span>
                                    )}
                                    {selectedSupplier.email && (
                                        <span>
                                            <strong className="text-zinc-700 font-semibold">Email:</strong> {selectedSupplier.email}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Fecha Emisión (25% en pantallas grandes) */}
                        <div className="lg:col-span-3 space-y-1.5">
                            <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                Fecha Emisión *
                            </label>
                            <input
                                type="date"
                                name="fechaEmision"
                                value={generalInfo.fechaEmision}
                                onChange={handleGeneralChange}
                                required
                                className="w-full h-11 px-3.5 text-xs font-mono font-semibold text-zinc-900 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs"
                            />
                            <span className="text-[10px] text-zinc-400 block">
                                Fecha de expedición del documento
                            </span>
                        </div>

                        {/* Nº de Factura / Guía (25% en pantallas grandes) */}
                        <div className="lg:col-span-3 space-y-1.5">
                            <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                Nº de Factura / Guía *
                            </label>
                            <input
                                type="text"
                                name="numeroDocumento"
                                placeholder="EJ. F001-00045454"
                                value={generalInfo.numeroDocumento}
                                onChange={handleGeneralChange}
                                required
                                className="w-full h-11 px-3.5 text-xs font-mono font-bold uppercase text-zinc-900 placeholder:text-zinc-400 placeholder:font-normal bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs"
                            />
                            <span className="text-[10px] text-zinc-400 block">
                                Correlativo fiscal de la compra
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: PRODUCTOS E INGRESO A LOTES (ESPACIOSO, SIN RESTRICCIÓN DE CUADRITO) */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6 sm:p-7 shadow-xs">
                    {/* Header de la sección */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                                    Productos e Ingreso a Lotes
                                </h2>
                                <p className="text-[11px] text-zinc-500">
                                    Detalle de medicamentos adquiridos, asignación de lotes, vencimientos y costeo
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-start sm:self-auto">
                            <span className="text-xs text-zinc-500 font-medium">Total Parcial:</span>
                            <span className="font-mono font-bold text-xs bg-zinc-100 text-zinc-950 border border-zinc-300 px-2.5 py-1 rounded-md">
                                S/ {totalGeneral.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* BARRA SUPERIOR DE BÚSQUEDA RÁPIDA DE PRODUCTOS (Elimina el cuadrito estrecho) */}
                    <div className="relative mb-6" ref={quickSearchRef}>
                        <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
                            Buscar y agregar producto a la compra
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                    <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={quickSearchQuery}
                                onChange={(e) => {
                                    setQuickSearchQuery(e.target.value);
                                    setIsQuickSearching(true);
                                }}
                                onFocus={() => setIsQuickSearching(true)}
                                placeholder="Escribe el nombre, código de barras o principio activo para agregar..."
                                className="w-full pl-10 pr-10 h-11 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs"
                            />
                            {quickSearchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setQuickSearchQuery("");
                                        setIsQuickSearching(false);
                                    }}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-zinc-400 hover:text-zinc-900 font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Dropdown flotante elevado para búsqueda rápida (No confinado a ninguna celda) */}
                        {isQuickSearching && quickSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-zinc-300 rounded-xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-zinc-100 animate-fadeIn">
                                {quickSearchResults.map((prod) => {
                                    const pStock = Number(prod.stockReal !== undefined ? prod.stockReal : (prod.stock || 0));
                                    const refCost = Number(prod.precioCompra || prod.costoUnitario || 0);

                                    return (
                                        <div
                                            key={prod.idProducto || prod.id}
                                            onClick={() => handleAddProductFromQuickSearch(prod)}
                                            className="p-3 hover:bg-zinc-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                        >
                                            <div className="pr-4">
                                                <span className="font-bold text-zinc-950 uppercase block text-xs">
                                                    {prod.nombre}
                                                </span>
                                                <span className="text-[11px] text-zinc-500">
                                                    {[prod.formaFarmaceutica, prod.concentracion, prod.principioActivo].filter(Boolean).join(" · ")} {prod.laboratorioNombre ? `— Lab: ${prod.laboratorioNombre}` : ""}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {refCost > 0 && (
                                                    <span className="text-[11px] font-mono text-zinc-600">
                                                        Costo ref: S/ {refCost.toFixed(2)}
                                                    </span>
                                                )}
                                                <span className="font-mono text-[11px] bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded font-bold">
                                                    Stock: {pStock}
                                                </span>
                                                <span className="text-[10px] font-bold text-white bg-zinc-900 px-2.5 py-1 rounded-md hover:bg-black">
                                                    + Seleccionar
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* TABLA PRINCIPAL DE INGRESO A LOTES (Sin overflow restrictivo vertical) */}
                    <div className="border border-zinc-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-zinc-100/80 border-b border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                    <th className="py-3 px-3.5" style={{ width: "32%" }}>
                                        Producto Registrado
                                    </th>
                                    <th className="py-3 px-3" style={{ width: "16%" }}>
                                        Lote Asignado *
                                    </th>
                                    <th className="py-3 px-3" style={{ width: "14%" }}>
                                        Vencimiento *
                                    </th>
                                    <th className="py-3 px-3 text-center" style={{ width: "10%" }}>
                                        Cantidad *
                                    </th>
                                    <th className="py-3 px-3 text-right" style={{ width: "11%" }}>
                                        Costo Unit. (S/) *
                                    </th>
                                    <th className="py-3 px-3.5 text-right" style={{ width: "11%" }}>
                                        Subtotal
                                    </th>
                                    <th className="py-3 px-3 text-center" style={{ width: "6%" }}>
                                        Acción
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/70 bg-white">
                                {items.map((it, idx) => {
                                    const subtotal = (Number(it.cantidad) || 0) * (Number(it.costoUnitario) || 0);

                                    // Filtrado para autocompletado en celda si aún no se seleccionó
                                    const matchingProducts = it.isSearching && it.searchQuery.trim().length > 0
                                        ? productsList.filter((p) => {
                                              const q = it.searchQuery.toLowerCase();
                                              const n = (p.nombre || "").toLowerCase();
                                              const a = (p.principioActivo || "").toLowerCase();
                                              const b = (p.codigoBarras || "").toLowerCase();
                                              return n.includes(q) || a.includes(q) || b.includes(q);
                                          }).slice(0, 6)
                                        : [];

                                    return (
                                        <tr key={it.id || idx} className="hover:bg-zinc-50/70 transition-colors">
                                            {/* PRODUCTO REGISTRADO */}
                                            <td className="py-2.5 px-3.5 relative">
                                                {it.producto ? (
                                                    <div className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                                                        <div className="truncate pr-2">
                                                            <span className="font-bold text-zinc-950 uppercase block truncate">
                                                                {it.producto.nombre}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500 block truncate">
                                                                {[it.producto.formaFarmaceutica, it.producto.concentracion].filter(Boolean).join(" ")} · {it.producto.laboratorioNombre || it.producto.laboratorio?.nombre || "LAB"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className="font-mono text-[10px] bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded font-bold">
                                                                Stock: {it.producto.stockReal !== undefined ? it.producto.stockReal : (it.producto.stock || 0)}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleClearSelectedProduct(idx)}
                                                                className="text-zinc-400 hover:text-zinc-900 p-1 font-bold text-xs"
                                                                title="Cambiar producto"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar producto registrado..."
                                                            value={it.searchQuery}
                                                            onChange={(e) => {
                                                                handleItemChange(idx, "searchQuery", e.target.value);
                                                                handleItemChange(idx, "isSearching", true);
                                                            }}
                                                            onFocus={() => handleItemChange(idx, "isSearching", true)}
                                                            onBlur={() => setTimeout(() => handleItemChange(idx, "isSearching", false), 250)}
                                                            className="w-full h-9 px-3 text-xs text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:border-zinc-900 focus:outline-none shadow-2xs"
                                                            required
                                                        />

                                                        {/* Lista desplegable de coincidencias flotante con z-index alto */}
                                                        {it.isSearching && matchingProducts.length > 0 && (
                                                            <div className="absolute top-full left-0 z-50 mt-1 w-80 sm:w-96 bg-white border border-zinc-300 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-zinc-100">
                                                                {matchingProducts.map((p) => {
                                                                    const pStock = Number(p.stockReal !== undefined ? p.stockReal : (p.stock || 0));
                                                                    return (
                                                                        <div
                                                                            key={p.idProducto || p.id}
                                                                            onMouseDown={() => handleSelectProduct(idx, p)}
                                                                            className="p-2.5 hover:bg-zinc-100 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                                                        >
                                                                            <div>
                                                                                <span className="font-bold text-zinc-950 uppercase block">
                                                                                    {p.nombre}
                                                                                </span>
                                                                                <span className="text-[10px] text-zinc-500">
                                                                                    {[p.formaFarmaceutica, p.concentracion, p.principioActivo].filter(Boolean).join(" · ")}
                                                                                </span>
                                                                            </div>
                                                                            <span className="font-mono text-[10px] bg-zinc-200 text-zinc-800 px-1.5 py-0.5 rounded font-bold">
                                                                                Stock: {pStock}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* LOTE ASIGNADO */}
                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="text"
                                                    placeholder="EJ. L09090"
                                                    value={it.numeroLote}
                                                    onChange={(e) => handleItemChange(idx, "numeroLote", e.target.value)}
                                                    required
                                                    className="w-full h-9 px-2.5 text-xs font-mono font-bold uppercase text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:border-zinc-900 focus:outline-none shadow-2xs"
                                                />
                                            </td>

                                            {/* FECHA VENCIMIENTO */}
                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="date"
                                                    value={it.fechaVencimiento}
                                                    onChange={(e) => handleItemChange(idx, "fechaVencimiento", e.target.value)}
                                                    required
                                                    className="w-full h-9 px-2.5 text-xs font-mono text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:border-zinc-900 focus:outline-none shadow-2xs"
                                                />
                                            </td>

                                            {/* CANTIDAD */}
                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={it.cantidad}
                                                    onChange={(e) => handleItemChange(idx, "cantidad", e.target.value)}
                                                    required
                                                    className="w-full h-9 px-2 text-xs font-mono font-bold text-center text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:border-zinc-900 focus:outline-none shadow-2xs"
                                                />
                                            </td>

                                            {/* COSTO UNITARIO */}
                                            <td className="py-2.5 px-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={it.costoUnitario}
                                                    onChange={(e) => handleItemChange(idx, "costoUnitario", e.target.value)}
                                                    required
                                                    className="w-full h-9 px-2.5 text-xs font-mono font-bold text-right text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:border-zinc-900 focus:outline-none shadow-2xs"
                                                />
                                            </td>

                                            {/* SUBTOTAL */}
                                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-zinc-950 text-xs">
                                                S/ {subtotal.toFixed(2)}
                                            </td>

                                            {/* ACCIONES (PRECIOS/UTILIDAD + ELIMINAR) */}
                                            <td className="py-2.5 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Botón Precios y Utilidad */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenUtilityModal(it)}
                                                        className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-300 rounded-md transition-colors"
                                                        title="Ajustar Precios de Venta y Margen de Utilidad"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>

                                                    {/* Botón Eliminar Fila */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="p-1.5 text-zinc-400 hover:text-red-700 hover:bg-zinc-100 rounded-md transition-colors"
                                                        title="Eliminar fila"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Botón para agregar nueva fila manual (Sin doble '+') */}
                    <div className="mt-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-dashed border-zinc-400 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Agregar Fila Manual</span>
                        </button>

                        <span className="text-[11px] text-zinc-500 font-medium">
                            {items.length} {items.length === 1 ? "ítem registrado" : "ítems registrados"}
                        </span>
                    </div>
                </div>

                {/* SECCIÓN 3: COSTO TOTAL Y CONFIRMACIÓN */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-xl border border-zinc-200 shadow-xs gap-4">
                    <div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                            Costo Total de Compra
                        </span>
                        <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-950 mt-1 tracking-tight">
                            S/ {totalGeneral.toFixed(2)}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-1/2 sm:w-auto px-5 py-2.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                            Cancelar y Volver
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-1/2 sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-zinc-900 hover:bg-black rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 tracking-wide"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>REGISTRANDO...</span>
                                </div>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Registrar Compra y Generar Lotes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* MODAL DE PRECIOS Y UTILIDAD */}
            <PriceUtilityModal
                isOpen={isUtilityModalOpen}
                onClose={() => {
                    setIsUtilityModalOpen(false);
                    setSelectedProductForUtility(null);
                }}
                product={selectedProductForUtility}
                currentUnitCost={selectedUnitCostForUtility}
                onSaveSuccess={handleSavePricesSuccess}
            />
        </div>
    );
};

export default PurchaseRegisterPage;