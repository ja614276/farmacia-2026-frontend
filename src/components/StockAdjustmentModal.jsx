import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import { findAll as findAllProducts } from "../services/ProductService";
import { findLotsByProduct, createAdjustment, createLot } from "../services/InventoryAdjustmentService";
import { getActiveCashSession } from "../services/CashSessionService";
import { useAuth } from "../auth/hooks/useAuth";

export const StockAdjustmentModal = ({ isOpen, onClose, onAdjustmentSaved }) => {
    const { login } = useAuth();
    const currentUser = login?.user?.username || "Admin";

    // Listados base
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [lots, setLots] = useState([]);
    const [selectedLot, setSelectedLot] = useState(null);
    const [isLoadingLots, setIsLoadingLots] = useState(false);

    // Estado de sesión activa / empleado
    const [activeEmployee, setActiveEmployee] = useState({ id: null, name: currentUser });

    // Mini-formulario para Registrar Lote Físico
    const [showNewLotForm, setShowNewLotForm] = useState(false);
    const [newLotData, setNewLotData] = useState({
        nroLote: "",
        fechaVencimiento: "",
        costoUnitario: 0,
    });
    const [isSavingLot, setIsSavingLot] = useState(false);

    // Estado principal del ajuste (SOLO "ENTRADA" o "SALIDA")
    const [movementType, setMovementType] = useState("ENTRADA"); // "ENTRADA" | "SALIDA"
    const [quantity, setQuantity] = useState(1);
    const [adjustmentDate, setAdjustmentDate] = useState(
        new Date().toISOString().slice(0, 16)
    );
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar productos y empleado activo al abrir
    useEffect(() => {
        if (!isOpen) return;

        const initData = async () => {
            try {
                const [prodRes, cashRes] = await Promise.all([
                    findAllProducts(),
                    getActiveCashSession().catch(() => ({ data: null })),
                ]);
                const prodList = prodRes.data || [];
                setProducts(prodList);

                const session = cashRes?.data;
                if (session && session.openingEmployeeName) {
                    setActiveEmployee({
                        id: session.openingEmployeeId || null,
                        name: session.openingEmployeeName,
                    });
                } else {
                    setActiveEmployee({ id: null, name: currentUser });
                }
            } catch (err) {
                console.error("Error al inicializar datos para ajuste:", err);
            }
        };

        initData();
    }, [isOpen, currentUser]);

    // Filtrar productos según el término de búsqueda
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return products.filter((p) => {
            const name = (p.nombre || p.name || "").toLowerCase();
            const bar = (p.codigoBarras || p.codigo || "").toLowerCase();
            const lab = (p.laboratorioNombre || "").toLowerCase();
            return name.includes(term) || bar.includes(term) || lab.includes(term);
        }).slice(0, 8);
    }, [products, searchTerm]);

    // Al seleccionar producto, cargar sus lotes
    const handleSelectProduct = async (product) => {
        setSelectedProduct(product);
        setSearchTerm("");
        setIsSearching(false);
        setSelectedLot(null);
        setShowNewLotForm(false);

        try {
            setIsLoadingLots(true);
            const res = await findLotsByProduct(product.id || product.idProducto);
            const lotList = res.data || [];
            setLots(lotList);
            if (lotList.length > 0) {
                setSelectedLot(lotList[0]);
            }
        } catch (error) {
            console.error("Error al cargar lotes:", error);
            setLots([]);
        } finally {
            setIsLoadingLots(false);
        }
    };

    // Botón "Lote S/N" (asigna o crea lote genérico sin serie)
    const handleAssignGenericLot = async () => {
        if (!selectedProduct) {
            Swal.fire("Atención", "Seleccione primero un producto para asociar el lote.", "warning");
            return;
        }
        const existingSN = lots.find((l) => (l.nroLote || "").toUpperCase() === "S/N");
        if (existingSN) {
            setSelectedLot(existingSN);
            return;
        }
        try {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 2);
            const res = await createLot({
                idProducto: selectedProduct.id || selectedProduct.idProducto,
                nroLote: "S/N",
                fechaVencimiento: nextYear.toISOString().slice(0, 10),
                cantidadInicial: 0,
                cantidadActual: 0,
                costoUnitario: 0,
            });
            const created = res.data;
            setLots((prev) => [...prev, created]);
            setSelectedLot(created);
            Swal.fire({
                title: "Lote S/N Asignado",
                text: "Se ha vinculado el lote genérico S/N al producto.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error("Error al crear lote S/N:", err);
            Swal.fire("Error", "No se pudo crear el lote S/N.", "error");
        }
    };

    // Guardar nuevo lote físico desde el formulario rápido
    const handleSaveNewLot = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;
        if (!newLotData.nroLote.trim()) {
            Swal.fire("Campo requerido", "Ingrese el número de lote físico.", "warning");
            return;
        }
        if (!newLotData.fechaVencimiento) {
            Swal.fire("Campo requerido", "Ingrese la fecha de vencimiento del lote.", "warning");
            return;
        }

        try {
            setIsSavingLot(true);
            const res = await createLot({
                idProducto: selectedProduct.id || selectedProduct.idProducto,
                nroLote: newLotData.nroLote.trim().toUpperCase(),
                fechaVencimiento: newLotData.fechaVencimiento,
                cantidadInicial: 0,
                cantidadActual: 0,
                costoUnitario: Number(newLotData.costoUnitario) || 0,
            });
            const created = res.data;
            setLots((prev) => [created, ...prev]);
            setSelectedLot(created);
            setShowNewLotForm(false);
            setNewLotData({ nroLote: "", fechaVencimiento: "", costoUnitario: 0 });
            Swal.fire({
                title: "¡Lote Registrado!",
                text: `Lote ${created.nroLote} listo para el ajuste.`,
                icon: "success",
                timer: 1600,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Error al registrar lote:", error);
            Swal.fire("Error", "No se pudo registrar el nuevo lote.", "error");
        } finally {
            setIsSavingLot(false);
        }
    };

    // Cálculos de stock en tiempo real
    const currentLotStock = selectedLot ? Number(selectedLot.cantidadActual ?? selectedLot.stock ?? 0) : 0;
    const qtyNum = Math.max(1, Number(quantity) || 1);
    const variation = movementType === "ENTRADA" ? qtyNum : -qtyNum;
    const projectedStock = currentLotStock + variation;
    const isNegativeStock = projectedStock < 0;

    // Sugerencias de motivos según tipo
    const reasonsSuggestions = movementType === "ENTRADA"
        ? [
            "Traslado desde otro local",
            "Ingreso extraordinario",
            "Sobrante de inventario físico",
            "Devolución de cliente / canje",
            "Corrección positiva",
        ]
        : [
            "Merma por daño en empaque",
            "Producto vencido / caducado",
            "Robo hormiga / extravío",
            "Muestra médica / rotura",
            "Corrección negativa",
        ];

    // Enviar Ajuste de Stock
    const handleSubmitAdjustment = async (e) => {
        e.preventDefault();

        if (!selectedProduct) {
            Swal.fire("Atención", "Debe buscar y seleccionar un producto.", "warning");
            return;
        }

        if (!selectedLot) {
            Swal.fire("Atención", "Debe seleccionar un lote asociado para realizar el ajuste.", "warning");
            return;
        }

        if (movementType === "SALIDA" && isNegativeStock) {
            Swal.fire({
                title: "Stock Insuficiente",
                text: `El lote ${selectedLot.nroLote} solo cuenta con ${currentLotStock} unidades. No es posible retirar ${qtyNum} unidades.`,
                icon: "error",
            });
            return;
        }

        if (!reason.trim()) {
            Swal.fire("Atención", "Por favor indique el motivo del ajuste.", "warning");
            return;
        }

        const confirmMsg = movementType === "ENTRADA"
            ? `¿Confirmar ENTRADA de +${qtyNum} unidades para el lote ${selectedLot.nroLote} de ${selectedProduct.nombre}?`
            : `¿Confirmar SALIDA de -${qtyNum} unidades para el lote ${selectedLot.nroLote} de ${selectedProduct.nombre}?`;

        const confirmResult = await Swal.fire({
            title: "¿Confirmar Ajuste de Stock?",
            text: confirmMsg,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
            confirmButtonText: "Sí, Guardar Ajuste",
            cancelButtonText: "Cancelar",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            setIsSubmitting(true);
            const payload = {
                tipoAjuste: movementType,
                cantidad: qtyNum,
                motivo: reason.trim(),
                fecha: adjustmentDate,
                idProducto: selectedProduct.id || selectedProduct.idProducto,
                idLote: selectedLot.idLote,
                idEmpleado: activeEmployee.id,
            };

            await createAdjustment(payload);

            await Swal.fire({
                title: "¡Ajuste Guardado!",
                text: `Se ha registrado la ${movementType} de ${qtyNum} unidad(es) satisfactoriamente.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
            });

            if (onAdjustmentSaved) onAdjustmentSaved();
            onClose();
        } catch (error) {
            console.error("Error al registrar ajuste:", error);
            const msg = error.response?.data?.message || "Ocurrió un error al procesar el ajuste de stock.";
            Swal.fire("Error al Registrar", typeof msg === "string" ? msg : "Error interno", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden my-6">
                {/* Cabecera */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-black text-zinc-950 tracking-tight">
                                Nuevo Ajuste de Stock
                            </h2>
                            <p className="text-xs text-zinc-500">
                                Movimiento manual de existencias y corrección física por lote
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmitAdjustment} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Columna Izquierda (8 cols) */}
                        <div className="lg:col-span-8 space-y-5">
                            {/* Selector de Tipo de Movimiento */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
                                    Tipo de Movimiento *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMovementType("ENTRADA")}
                                        className={`h-11 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                                            movementType === "ENTRADA"
                                                ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                                                : "bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                                        }`}
                                    >
                                        <span>+ ENTRADA DE STOCK</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMovementType("SALIDA")}
                                        className={`h-11 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                                            movementType === "SALIDA"
                                                ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                                                : "bg-zinc-50 text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                                        }`}
                                    >
                                        <span>- SALIDA / MERMA</span>
                                    </button>
                                </div>
                            </div>

                            {/* Selector de Producto */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                    Medicamento / Producto *
                                </label>
                                {!selectedProduct ? (
                                    <div className="relative">
                                        <div className="relative flex items-center">
                                            <svg className="w-4 h-4 text-zinc-400 absolute left-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                                <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setIsSearching(true);
                                                }}
                                                onFocus={() => setIsSearching(true)}
                                                placeholder="Buscar producto por nombre o código..."
                                                className="w-full h-11 pl-10 pr-4 text-xs font-medium text-zinc-900 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs"
                                            />
                                        </div>

                                        {/* Dropdown de coincidencias */}
                                        {isSearching && filteredProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-zinc-300 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-zinc-100">
                                                {filteredProducts.map((p) => (
                                                    <div
                                                        key={p.id || p.idProducto}
                                                        onClick={() => handleSelectProduct(p)}
                                                        className="p-3 hover:bg-zinc-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-zinc-950 uppercase block">
                                                                {p.nombre || p.name}
                                                            </span>
                                                            <span className="text-[11px] text-zinc-500">
                                                                {[p.formaFarmaceutica, p.concentracion].filter(Boolean).join(" · ")} {p.laboratorioNombre ? `— ${p.laboratorioNombre}` : ""}
                                                            </span>
                                                        </div>
                                                        <span className="font-mono text-[10px] font-bold bg-zinc-100 border border-zinc-200 text-zinc-800 px-2 py-0.5 rounded">
                                                            Stock: {p.stockReal !== undefined ? p.stockReal : (p.stock || 0)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-zinc-950 uppercase text-xs block">
                                                {selectedProduct.nombre || selectedProduct.name}
                                            </span>
                                            <span className="text-[11px] text-zinc-500">
                                                {[selectedProduct.formaFarmaceutica, selectedProduct.concentracion].filter(Boolean).join(" · ")} {selectedProduct.laboratorioNombre ? `— ${selectedProduct.laboratorioNombre}` : ""}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedProduct(null);
                                                setSelectedLot(null);
                                                setLots([]);
                                            }}
                                            className="px-2.5 py-1 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-md transition-colors"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Selector de Lote */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                        Lote Asociado *
                                    </label>
                                    {selectedProduct && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleAssignGenericLot}
                                                className="text-[11px] font-bold text-zinc-700 hover:text-black underline"
                                            >
                                                Lote S/N
                                            </button>
                                            <span className="text-zinc-300">•</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowNewLotForm(!showNewLotForm)}
                                                className="text-[11px] font-bold text-zinc-700 hover:text-black underline"
                                            >
                                                {showNewLotForm ? "Ocultar formulario" : "+ Crear Lote"}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Formulario rápido de nuevo lote */}
                                {showNewLotForm && (
                                    <div className="p-3 bg-zinc-50 border border-zinc-300 rounded-lg space-y-3 mb-2">
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-700 uppercase">Nº de Lote</label>
                                                <input
                                                    type="text"
                                                    value={newLotData.nroLote}
                                                    onChange={(e) => setNewLotData({ ...newLotData, nroLote: e.target.value })}
                                                    placeholder="EJ. L2026-05"
                                                    className="w-full h-8 px-2 text-xs font-mono font-bold uppercase bg-white border border-zinc-300 rounded"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-700 uppercase">Vencimiento</label>
                                                <input
                                                    type="date"
                                                    value={newLotData.fechaVencimiento}
                                                    onChange={(e) => setNewLotData({ ...newLotData, fechaVencimiento: e.target.value })}
                                                    className="w-full h-8 px-2 text-xs font-mono bg-white border border-zinc-300 rounded"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isSavingLot}
                                            onClick={handleSaveNewLot}
                                            className="w-full py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded"
                                        >
                                            {isSavingLot ? "Guardando..." : "Guardar y Seleccionar Lote"}
                                        </button>
                                    </div>
                                )}

                                {isLoadingLots ? (
                                    <div className="p-3 bg-zinc-50 text-xs text-zinc-500 text-center rounded-lg border border-zinc-200">
                                        Consultando lotes registrados...
                                    </div>
                                ) : lots.length > 0 ? (
                                    <select
                                        value={selectedLot?.idLote || ""}
                                        onChange={(e) => {
                                            const match = lots.find((l) => String(l.idLote) === String(e.target.value));
                                            setSelectedLot(match || null);
                                        }}
                                        className="w-full h-11 px-3.5 text-xs font-mono font-semibold text-zinc-900 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all cursor-pointer shadow-2xs"
                                    >
                                        {lots.map((l) => (
                                            <option key={l.idLote} value={l.idLote}>
                                                Lote: {l.nroLote} — Stock Actual: {l.cantidadActual ?? l.stock ?? 0} UND — Vence: {l.fechaVencimiento ? l.fechaVencimiento.slice(0, 10) : "S/F"}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 bg-zinc-50 text-xs text-zinc-500 rounded-lg border border-zinc-200">
                                        {selectedProduct ? "Este producto no tiene lotes. Utilice '+ Crear Lote' o 'Lote S/N'." : "Seleccione primero un producto."}
                                    </div>
                                )}
                            </div>

                            {/* Cantidad y Fecha */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                        Cantidad (Unidades) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        required
                                        className="w-full h-11 px-3.5 text-xs font-mono font-bold text-center text-zinc-900 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                        Fecha del Movimiento
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={adjustmentDate}
                                        onChange={(e) => setAdjustmentDate(e.target.value)}
                                        required
                                        className="w-full h-11 px-3.5 text-xs font-mono text-zinc-900 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* Motivo */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                    Motivo / Justificación *
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Indique la justificación del ajuste..."
                                    required
                                    className="w-full h-11 px-3.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50 border border-zinc-300 rounded-lg hover:bg-white focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all shadow-2xs"
                                />

                                {/* Sugerencias de motivo */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {reasonsSuggestions.map((sug) => (
                                        <button
                                            key={sug}
                                            type="button"
                                            onClick={() => setReason(sug)}
                                            className="px-2 py-0.5 text-[10px] font-semibold text-zinc-600 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded transition-colors"
                                        >
                                            {sug}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha (4 cols): Ficha de Balance de Stock */}
                        <div className="lg:col-span-4 bg-zinc-50 p-5 rounded-xl border border-zinc-200 flex flex-col justify-between space-y-4">
                            <div>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-3">
                                    Balance de Stock Proyectado
                                </span>

                                <div className="space-y-3 text-xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                                        <span className="text-zinc-600">Stock Actual del Lote:</span>
                                        <span className="font-mono font-bold text-zinc-950">
                                            {currentLotStock} UND
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                                        <span className="text-zinc-600">Variación por Ajuste:</span>
                                        <span className={`font-mono font-bold ${movementType === "ENTRADA" ? "text-zinc-950" : "text-zinc-700"}`}>
                                            {movementType === "ENTRADA" ? `+${qtyNum}` : `-${qtyNum}`} UND
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="font-bold text-zinc-900">Stock Final:</span>
                                        <span className={`font-mono font-black text-sm ${isNegativeStock ? "text-red-600" : "text-zinc-950"}`}>
                                            {projectedStock} UND
                                        </span>
                                    </div>

                                    {isNegativeStock && (
                                        <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 font-semibold mt-2">
                                            Stock insuficiente para esta salida.
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-zinc-200 text-[11px] text-zinc-500 space-y-1">
                                    <div><strong className="text-zinc-700 font-semibold">Responsable:</strong> {activeEmployee.name}</div>
                                    <div><strong className="text-zinc-700 font-semibold">Lote:</strong> {selectedLot ? selectedLot.nroLote : "Sin seleccionar"}</div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-zinc-200">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (movementType === "SALIDA" && isNegativeStock)}
                                    className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "REGISTRANDO..." : "Confirmar y Aplicar Ajuste"}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-2 px-4 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 text-xs font-semibold rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

StockAdjustmentModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onAdjustmentSaved: PropTypes.func,
};

export default StockAdjustmentModal;
