import React, { useState, useEffect, useMemo } from "react";
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
        // Buscar si ya existe un lote "S/N"
        const existingSN = lots.find((l) => (l.nroLote || "").toUpperCase() === "S/N");
        if (existingSN) {
            setSelectedLot(existingSN);
            return;
        }
        // Si no existe, crearlo al vuelo
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
            confirmButtonColor: movementType === "ENTRADA" ? "#0d9488" : "#e11d48",
            cancelButtonColor: "#475569",
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-4xl bg-[#0e1626] border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden my-6">
                
                {/* CABECERA (Imagen 2) */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-[#121c30]/90">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shadow-inner">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                                Nuevo Ajuste de Stock
                            </h2>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Control manual de inventario y corrección de lotes
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* CUERPO DEL MODAL (Grid de 2 Columnas como en la Imagen 2) */}
                <form onSubmit={handleSubmitAdjustment} className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* COLUMNA IZQUIERDA (8 COLS): Formulario de Ajuste */}
                        <div className="lg:col-span-8 space-y-5">
                            
                            {/* 1. SECCIÓN PRODUCTO */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                                    Producto
                                </label>
                                
                                {!selectedProduct ? (
                                    <div className="relative">
                                        <div className="relative flex items-center">
                                            <svg className="w-4 h-4 text-slate-400 absolute left-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setIsSearching(true);
                                                }}
                                                onFocus={() => setIsSearching(true)}
                                                placeholder="Buscar por nombre o código..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-[#142036] border border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-inner"
                                            />
                                        </div>

                                        {/* Dropdown de Resultados de Búsqueda */}
                                        {isSearching && filteredProducts.length > 0 && (
                                            <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-[#16233b] border border-slate-700 rounded-2xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800">
                                                {filteredProducts.map((prod) => (
                                                    <div
                                                        key={prod.id || prod.idProducto}
                                                        onClick={() => handleSelectProduct(prod)}
                                                        className="p-3 hover:bg-teal-500/10 cursor-pointer flex items-center justify-between transition-colors"
                                                    >
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-100 block">
                                                                {prod.nombre || prod.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                Cód: {prod.codigoBarras || "S/C"} • Lab: {prod.laboratorioNombre || "Genérico"}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs font-black text-teal-400 block">
                                                                Stock: {prod.stockReal ?? 0}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500">Unidades</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3.5 bg-[#142036] border border-teal-500/30 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 font-black text-xs flex items-center justify-center flex-shrink-0">
                                                Rx
                                            </div>
                                            <div>
                                                <span className="text-xs font-black text-white block uppercase">
                                                    {selectedProduct.nombre || selectedProduct.name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                                    Stock Real Total: <strong className="text-teal-400">{selectedProduct.stockReal ?? 0} uds</strong> • Lab: {selectedProduct.laboratorioNombre || "Genérico"}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedProduct(null);
                                                setSelectedLot(null);
                                                setLots([]);
                                            }}
                                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-xl transition-colors"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 2. SECCIÓN LOTE ASOCIADO (Imagen 2) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                                        Lote Asociado
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAssignGenericLot}
                                            className="px-2.5 py-1 bg-[#1a2842] hover:bg-[#203152] text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700/60 transition-colors"
                                        >
                                            Lote S/N
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewLotForm(!showNewLotForm)}
                                            className="px-2.5 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-[10px] font-bold rounded-lg border border-teal-500/30 transition-colors"
                                        >
                                            {showNewLotForm ? "Cancelar Lote" : "Registrar Lote Físico"}
                                        </button>
                                    </div>
                                </div>

                                {/* Formulario rápido inline para crear lote físico si ingresa uno nuevo */}
                                {showNewLotForm && (
                                    <div className="p-3.5 bg-[#142036] border border-teal-500/40 rounded-2xl space-y-3 animate-fadeIn">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-teal-300">
                                                Nuevo Lote para {selectedProduct?.nombre || "Producto"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 block mb-1">Nro Lote *</label>
                                                <input
                                                    type="text"
                                                    value={newLotData.nroLote}
                                                    onChange={(e) => setNewLotData((prev) => ({ ...prev, nroLote: e.target.value }))}
                                                    placeholder="Ej: L-2026-001"
                                                    className="w-full px-2.5 py-1.5 bg-[#0e1626] border border-slate-700 rounded-xl text-xs text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 block mb-1">Fecha Vencimiento *</label>
                                                <input
                                                    type="date"
                                                    value={newLotData.fechaVencimiento}
                                                    onChange={(e) => setNewLotData((prev) => ({ ...prev, fechaVencimiento: e.target.value }))}
                                                    className="w-full px-2.5 py-1.5 bg-[#0e1626] border border-slate-700 rounded-xl text-xs text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 block mb-1">Costo Unit. (Opcional)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={newLotData.costoUnitario}
                                                    onChange={(e) => setNewLotData((prev) => ({ ...prev, costoUnitario: e.target.value }))}
                                                    className="w-full px-2.5 py-1.5 bg-[#0e1626] border border-slate-700 rounded-xl text-xs text-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={handleSaveNewLot}
                                                disabled={isSavingLot}
                                                className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                            >
                                                {isSavingLot ? "Guardando..." : "Guardar y Seleccionar"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Selector de Lotes */}
                                <select
                                    disabled={!selectedProduct || isLoadingLots}
                                    value={selectedLot?.idLote || ""}
                                    onChange={(e) => {
                                        const l = lots.find((item) => String(item.idLote) === String(e.target.value));
                                        setSelectedLot(l || null);
                                    }}
                                    className="w-full px-3.5 py-2.5 bg-[#142036] border border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50 transition-all shadow-inner"
                                >
                                    {isLoadingLots ? (
                                        <option>Cargando lotes disponibles...</option>
                                    ) : lots.length === 0 ? (
                                        <option value="">No hay lotes registrados para este producto</option>
                                    ) : (
                                        lots.map((lot) => {
                                            const venc = lot.fechaVencimiento ? lot.fechaVencimiento.slice(0, 10) : "S/F";
                                            return (
                                                <option key={lot.idLote} value={lot.idLote}>
                                                    #{lot.nroLote} | Vence: {venc} | Stock: {lot.cantidadActual ?? 0} uds
                                                </option>
                                            );
                                        })
                                    )}
                                </select>
                            </div>

                            {/* 3. SECCIÓN TIPO DE MOVIMIENTO (Imagen 2 - Solo ENTRADA y SALIDA) */}
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                                    Tipo de Movimiento
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Botón Entrada */}
                                    <button
                                        type="button"
                                        onClick={() => setMovementType("ENTRADA")}
                                        className={`flex items-center justify-center gap-2.5 py-3 rounded-2xl text-xs font-extrabold transition-all border ${
                                            movementType === "ENTRADA"
                                                ? "bg-teal-500 text-white border-teal-400 shadow-lg shadow-teal-500/20 ring-2 ring-teal-500/30"
                                                : "bg-[#142036] text-slate-400 border-slate-700/80 hover:bg-[#182640] hover:text-slate-200"
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                        <span>Entrada</span>
                                    </button>

                                    {/* Botón Salida */}
                                    <button
                                        type="button"
                                        onClick={() => setMovementType("SALIDA")}
                                        className={`flex items-center justify-center gap-2.5 py-3 rounded-2xl text-xs font-extrabold transition-all border ${
                                            movementType === "SALIDA"
                                                ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/30"
                                                : "bg-[#142036] text-slate-400 border-slate-700/80 hover:bg-[#182640] hover:text-slate-200"
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                                        </svg>
                                        <span>Salida</span>
                                    </button>
                                </div>
                            </div>

                            {/* 4. SECCIÓN CANTIDAD Y FECHA */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Cantidad */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                                        Cantidad
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full pl-3.5 pr-20 py-2.5 bg-[#142036] border border-slate-700/80 rounded-2xl text-xs font-bold text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                                        />
                                        <span className="absolute right-3 px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                            UNIDADES
                                        </span>
                                    </div>
                                </div>

                                {/* Fecha */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                                        Fecha
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={adjustmentDate}
                                        onChange={(e) => setAdjustmentDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-[#142036] border border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* 5. SECCIÓN MOTIVO DEL AJUSTE */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                                    Motivo del Ajuste
                                </label>
                                <textarea
                                    rows="3"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ej: Merma por daño en empaque, corrección de inventario físico, traslado de sucursal..."
                                    className="w-full p-3.5 bg-[#142036] border border-slate-700/80 rounded-2xl text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all resize-none shadow-inner"
                                />

                                {/* Chips de Sugerencia Rápida de Motivos */}
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {reasonsSuggestions.map((sug, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setReason(sug)}
                                            className="px-2.5 py-1 rounded-lg bg-[#142036] hover:bg-slate-700/60 border border-slate-700/50 text-[10px] font-semibold text-slate-300 transition-colors"
                                        >
                                            {sug}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* COLUMNA DERECHA (4 COLS): Resumen de Cambio + Empleado + Botón Guardar */}
                        <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
                            
                            <div className="space-y-4">
                                {/* RESUMEN DE CAMBIO (Imagen 2) */}
                                <div className="bg-[#121c30] border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
                                    <h3 className="text-[11px] font-black text-slate-300 tracking-wider uppercase pb-2 border-b border-slate-800">
                                        RESUMEN DE CAMBIO
                                    </h3>

                                    {/* Stock Actual Lote */}
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                            STOCK ACTUAL LOTE
                                        </span>
                                        <span className="text-2xl font-black text-white block">
                                            {currentLotStock}
                                        </span>
                                    </div>

                                    {/* Variación */}
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                            VARIACIÓN
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-sm font-black ${movementType === "ENTRADA" ? "text-teal-400" : "text-rose-400"}`}>
                                                {movementType === "ENTRADA" ? "+" : "-"}
                                            </span>
                                            <span className={`text-base font-black ${movementType === "ENTRADA" ? "text-teal-400" : "text-rose-400"}`}>
                                                {qtyNum}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stock Proyectado */}
                                    <div className="space-y-0.5 pt-2 border-t border-slate-800/60">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                            STOCK PROYECTADO
                                        </span>
                                        <span className={`text-3xl font-black block ${
                                            isNegativeStock
                                                ? "text-rose-500 animate-pulse"
                                                : "text-[#00d26a]"
                                        }`}>
                                            {projectedStock}
                                        </span>
                                        {isNegativeStock && (
                                            <p className="text-[10px] text-rose-400 font-bold mt-1">
                                                ⚠️ El stock del lote no puede ser negativo.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* REGISTRADO POR (Imagen 2) */}
                                <div className="bg-[#121c30] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                                            REGISTRADO POR
                                        </span>
                                        <span className="text-xs font-black text-slate-200 block uppercase">
                                            {activeEmployee.name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* BOTÓN GUARDAR AJUSTE (Imagen 2) */}
                            <button
                                type="submit"
                                disabled={isSubmitting || (movementType === "SALIDA" && isNegativeStock)}
                                className="w-full py-3.5 px-4 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Guardando Ajuste...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Guardar Ajuste</span>
                                    </>
                                )}
                            </button>

                        </div>

                    </div>
                </form>

            </div>
        </div>
    );
};
