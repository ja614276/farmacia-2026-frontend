import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { saveSale, updateSale, findSaleById } from "../services/SaleService";
import { findAllClients } from "../services/ClientService";
import { getActiveCashSession } from "../services/CashSessionService";
import { findActivePaymentMethods } from "../services/PaymentMethodService";
import { findActivePaymentConditions } from "../services/PaymentConditionService";
import productsApi from "../apis/productsApi";
import { PresentationLotModal } from "./PresentationLotModal";
import { SaleSuccessModal } from "./SaleSuccessModal";
import { ReceiptTicketModal } from "./ReceiptTicketModal";

const initialFormState = {
    id: null,
    receiptType: "TICKET",
    series: "T001",
    receiptNumber: "00000001",
    saleType: "CONTADO",
    paymentConditionId: null,
    paymentMethodName: "EFECTIVO",
    paymentMethodId: null,
    paymentStatus: "PAGADO",
    clientId: "",
    clientName: "Público General",
    amountPaid: "",
    details: [],
};

export const SaleForm = ({ saleSelected = null, initialData = null, onSuccess = null, onCancel = null }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const searchInputRef = useRef(null);

    const [formState, setFormState] = useState(initialFormState);
    const [clientsList, setClientsList] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentConditions, setPaymentConditions] = useState([]);
    const [productCatalogSearch, setProductCatalogSearch] = useState("");
    const [catalogPage, setCatalogPage] = useState(1);
    const catalogPageSize = 10;

    // Estado de sesión de caja activa
    const [activeSession, setActiveSession] = useState(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    // Modales
    const [selectedProductForModal, setSelectedProductForModal] = useState(null);
    const [isPresModalOpen, setIsPresModalOpen] = useState(false);

    const [createdSaleData, setCreatedSaleData] = useState(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const targetSaleId = id || saleSelected?.id || initialData?.id;
    const isEditMode = Boolean(targetSaleId);

    // Verificar sesión de caja activa
    useEffect(() => {
        getActiveCashSession()
            .then((res) => {
                setActiveSession(res.data || null);
            })
            .catch((err) => {
                console.error("Error al consultar sesión de caja activa:", err);
                setActiveSession(null);
            })
            .finally(() => {
                setIsCheckingSession(false);
            });
    }, []);

    // Recargar catálogo de productos desde el backend para tener el stock real actualizado
    const refreshProductsCatalog = async () => {
        try {
            const res = await productsApi.get("/products");
            if (res.data) {
                setAvailableProducts(res.data);
            }
        } catch (err) {
            console.error("Error al cargar catálogo de productos:", err);
        }
    };

    // Cargar clientes y productos para el punto de venta
    useEffect(() => {
        findAllClients()
            .then((res) => setClientsList(res.data || []))
            .catch((err) => console.error("Error al cargar clientes:", err));

        refreshProductsCatalog();

        findActivePaymentMethods()
            .then((res) => {
                const list = res.data || [];
                const defaultMethods = [
                    { id: null, nombre: "EFECTIVO", recargoPorcentaje: 0 },
                    { id: null, nombre: "YAPE", recargoPorcentaje: 0 },
                    { id: null, nombre: "PLIN", recargoPorcentaje: 0 },
                    { id: null, nombre: "TARJETA", recargoPorcentaje: 0 },
                    { id: null, nombre: "TRANSFERENCIA", recargoPorcentaje: 0 },
                ];
                const merged = [...list];
                defaultMethods.forEach((dm) => {
                    if (!merged.some((m) => m.nombre?.toUpperCase() === dm.nombre.toUpperCase())) {
                        merged.push(dm);
                    }
                });

                setPaymentMethods(merged);
                if (merged.length > 0 && !isEditMode) {
                    const match = merged.find((m) => m.nombre?.toUpperCase() === formState.paymentMethodName.toUpperCase());
                    if (match) {
                        setFormState((prev) => ({ ...prev, paymentMethodId: match.id || null }));
                    } else {
                        setFormState((prev) => ({
                            ...prev,
                            paymentMethodName: merged[0].nombre?.toUpperCase() || "EFECTIVO",
                            paymentMethodId: merged[0].id || null,
                        }));
                    }
                }
            })
            .catch((err) => {
                console.error("Error al cargar métodos de pago:", err);
                const defaultMethods = [
                    { id: null, nombre: "EFECTIVO", recargoPorcentaje: 0 },
                    { id: null, nombre: "YAPE", recargoPorcentaje: 0 },
                    { id: null, nombre: "PLIN", recargoPorcentaje: 0 },
                    { id: null, nombre: "TARJETA", recargoPorcentaje: 0 },
                    { id: null, nombre: "TRANSFERENCIA", recargoPorcentaje: 0 },
                ];
                setPaymentMethods(defaultMethods);
            });

        findActivePaymentConditions()
            .then((res) => {
                const list = res.data || [];
                const defaultConditions = [
                    { idCondicion: null, nombre: "CONTADO", dias: 0 },
                    { idCondicion: null, nombre: "Crédito 30 dias", dias: 30 },
                    { idCondicion: null, nombre: "Crédito 60 dias", dias: 60 },
                ];
                const merged = [...list];
                defaultConditions.forEach((dc) => {
                    if (!merged.some((c) => c.nombre?.toUpperCase() === dc.nombre.toUpperCase())) {
                        merged.push(dc);
                    }
                });

                setPaymentConditions(merged);
                if (merged.length > 0 && !isEditMode) {
                    const match = merged.find((c) => c.nombre?.toUpperCase() === formState.saleType.toUpperCase());
                    if (match) {
                        setFormState((prev) => ({ ...prev, paymentConditionId: match.idCondicion || match.id || null }));
                    } else {
                        setFormState((prev) => ({
                            ...prev,
                            saleType: merged[0].nombre?.toUpperCase() || "CONTADO",
                            paymentConditionId: merged[0].idCondicion || merged[0].id || null,
                        }));
                    }
                }
            })
            .catch((err) => {
                console.error("Error al cargar condiciones de pago:", err);
                const defaultConditions = [
                    { idCondicion: null, nombre: "CONTADO", dias: 0 },
                    { idCondicion: null, nombre: "Crédito 30 dias", dias: 30 },
                    { idCondicion: null, nombre: "Crédito 60 dias", dias: 60 },
                ];
                setPaymentConditions(defaultConditions);
            });
    }, [isEditMode]);

    // Cargar siguiente número correlativo al cambiar tipo de comprobante
    useEffect(() => {
        if (!isEditMode) {
            const rType = formState.receiptType;
            const sSeries = rType === "FACTURA" ? "F001" : rType === "BOLETA" ? "B001" : "T001";

            productsApi.get(`/sales/next-number?receiptType=${rType}&series=${sSeries}`)
                .then((res) => {
                    setFormState((prev) => ({
                        ...prev,
                        series: sSeries,
                        receiptNumber: res.data || "00000001",
                    }));
                })
                .catch(() => {
                    setFormState((prev) => ({
                        ...prev,
                        series: sSeries,
                        receiptNumber: "00000001",
                    }));
                });
        }
    }, [formState.receiptType, isEditMode]);

    // Cargar datos en modo edición
    useEffect(() => {
        if (targetSaleId) {
            setIsLoadingData(true);
            findSaleById(targetSaleId)
                .then((response) => {
                    if (response.data) {
                        const s = response.data;
                        setFormState({
                            id: s.id,
                            receiptType: s.receiptType || s.tipoComprobante || "TICKET",
                            series: s.series || s.serie || "T001",
                            receiptNumber: s.receiptNumber || s.numComprobante || "",
                            saleType: s.saleType || s.tipoVenta || "CONTADO",
                            paymentMethodName: s.paymentMethodName || s.medioPago || "EFECTIVO",
                            paymentStatus: s.paymentStatus || s.estadoPago || "PAGADO",
                            clientId: s.clientId || s.idCliente || "",
                            clientName: s.clientName || s.clienteNombre || "Público General",
                            amountPaid: s.amountPaid !== undefined ? s.amountPaid : s.total || "",
                            details: s.details || s.detalles || [],
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error al cargar venta:", error);
                    Swal.fire("Error", "No se pudo cargar la venta", "error");
                })
                .finally(() => {
                    setIsLoadingData(false);
                });
        }
    }, [targetSaleId]);

    // Atajo de teclado F1 para enfocar el buscador
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "F1") {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Manejador de cambios generales
    const onInputChange = ({ target }) => {
        const { name, value } = target;
        setFormState((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Manejador de cambio de medio de pago
    const handlePaymentMethodChange = (e) => {
        const val = e.target.value;
        const selected = paymentMethods.find((pm) => pm.nombre?.toUpperCase() === val.toUpperCase());
        const isNonCash = !val.toUpperCase().includes("EFECTIVO");
        setFormState((prev) => ({
            ...prev,
            paymentMethodName: val,
            paymentMethodId: selected ? (selected.id || null) : null,
            amountPaid: isNonCash ? "" : prev.amountPaid,
        }));
    };

    // Manejador de cambio de tipo de venta
    const handleSaleTypeChange = (e) => {
        const val = e.target.value;
        const selected = paymentConditions.find((pc) => pc.nombre?.toUpperCase() === val.toUpperCase());
        setFormState((prev) => ({
            ...prev,
            saleType: val,
            paymentConditionId: selected ? (selected.idCondicion || selected.id || null) : null,
        }));
    };

    // Manejador de cambio de cliente
    const handleClientChange = (e) => {
        const val = e.target.value;
        if (!val) {
            setFormState((prev) => ({
                ...prev,
                clientId: "",
                clientName: "Público General",
            }));
            return;
        }

        const selected = clientsList.find((c) => String(c.id) === String(val));
        if (selected) {
            const fullName = [selected.firstName || selected.nombres, selected.lastName || selected.apellidos].filter(Boolean).join(" ");
            setFormState((prev) => ({
                ...prev,
                clientId: selected.id,
                clientName: fullName || selected.documentNumber || "Cliente",
            }));
        }
    };

    // Cantidad de unidades base de un producto que ya están en el carrito
    const getCartUnitsForProduct = (productId) => {
        if (!productId) return 0;
        return formState.details
            .filter((d) => d.productId === productId || d.idProducto === productId)
            .reduce((sum, d) => sum + Number(d.baseUnitsQuantity != null ? d.baseUnitsQuantity : d.presentationQuantity || 0), 0);
    };

    // Stock disponible restante para un producto considerando lo que hay en el carrito
    const getAvailableStockForProduct = (product) => {
        if (!product) return 0;
        const origStock = Number(product.stockReal !== undefined ? product.stockReal : (product.stock || 0));
        const inCart = getCartUnitsForProduct(product.idProducto || product.id);
        return Math.max(0, origStock - inCart);
    };

    // Apertura del modal de presentaciones al hacer clic en "Agregar"
    const handleOpenPresentationModal = (product) => {
        setSelectedProductForModal(product);
        setIsPresModalOpen(true);
    };

    // Selección de presentación y agregado al carrito
    const handleAddPresentationToCart = ({ product, presentation, lot }) => {
        const prodId = product.idProducto || product.id;
        const presId = presentation.idPresentacion || 0;
        const presName = presentation.nombrePresentacion || "UNIDAD";
        const unitPrice = Number(presentation.precioVenta || product.precioVenta || 0);
        const baseEquiv = Number(presentation.cantidadUnidades || 1);

        const origStock = Number(product.stockReal !== undefined ? product.stockReal : (product.stock || 0));
        const currentInCart = getCartUnitsForProduct(prodId);

        if (currentInCart + baseEquiv > origStock) {
            Swal.fire({
                title: "Stock insuficiente",
                text: `No hay suficiente stock para agregar esta presentación. Stock disponible: ${Math.max(0, origStock - currentInCart)} unidad(es) base.`,
                icon: "warning",
                confirmButtonColor: "#005f60",
            });
            return;
        }

        setFormState((prev) => {
            // Verificar si el ítem con la misma presentación y lote ya está en el carrito
            const existingIndex = prev.details.findIndex(
                (d) => d.productId === prodId && d.presentationName === presName && (lot ? d.lotId === lot.idLote : true)
            );

            if (existingIndex >= 0) {
                // Incrementar cantidad
                const updatedDetails = [...prev.details];
                const item = updatedDetails[existingIndex];
                const newQty = item.presentationQuantity + 1;
                const newSubtotal = Number((newQty * item.presentationUnitPrice).toFixed(2));
                const newBaseUnits = newQty * baseEquiv;

                updatedDetails[existingIndex] = {
                    ...item,
                    presentationQuantity: newQty,
                    baseUnitsQuantity: newBaseUnits,
                    subtotal: newSubtotal,
                };
                return { ...prev, details: updatedDetails };
            }

            // Nuevo ítem en carrito
            const newDetail = {
                productId: prodId,
                presentationId: presId > 0 ? presId : null,
                productName: product.nombre,
                presentationName: presName,
                presentationQuantity: 1,
                presentationUnitPrice: unitPrice,
                baseUnitsQuantity: baseEquiv,
                baseUnitCost: lot ? Number(lot.costoUnitario || 0) : 0,
                subtotal: unitPrice,
                lotId: lot ? lot.idLote : null,
                lotNumber: lot ? lot.nroLote : "",
            };

            return {
                ...prev,
                details: [newDetail, ...prev.details],
            };
        });
    };

    // Modificar cantidad en carrito con validación estricta de stock
    const handleUpdateQuantity = (index, delta) => {
        const item = formState.details[index];
        if (!item) return;

        if (delta > 0) {
            const prod = availableProducts.find((p) => (p.idProducto || p.id) === item.productId);
            const origStock = prod ? Number(prod.stockReal !== undefined ? prod.stockReal : (prod.stock || 0)) : 999999;
            const otherUnitsInCart = formState.details
                .filter((d, i) => i !== index && (d.productId === item.productId))
                .reduce((sum, d) => sum + Number(d.baseUnitsQuantity != null ? d.baseUnitsQuantity : d.presentationQuantity || 0), 0);
            const baseRatio = item.baseUnitsQuantity > 0 && item.presentationQuantity > 0
                ? Math.round(item.baseUnitsQuantity / item.presentationQuantity)
                : 1;

            const maxPresQty = Math.floor((origStock - otherUnitsInCart) / baseRatio);

            if (item.presentationQuantity + delta > maxPresQty) {
                Swal.fire({
                    title: "Límite de stock alcanzado",
                    text: `No hay más stock disponible. El límite para este producto es de ${Math.max(0, maxPresQty)} ${item.presentationName}.`,
                    icon: "warning",
                    confirmButtonColor: "#005f60",
                    timer: 2000,
                });
                return;
            }
        }

        setFormState((prev) => {
            const updatedDetails = [...prev.details];
            const cur = updatedDetails[index];
            const newQty = Math.max(1, cur.presentationQuantity + delta);
            const baseRatio = cur.baseUnitsQuantity > 0 && cur.presentationQuantity > 0
                ? Math.round(cur.baseUnitsQuantity / cur.presentationQuantity)
                : 1;

            updatedDetails[index] = {
                ...cur,
                presentationQuantity: newQty,
                baseUnitsQuantity: newQty * baseRatio,
                subtotal: Number((newQty * cur.presentationUnitPrice).toFixed(2)),
            };
            return { ...prev, details: updatedDetails };
        });
    };

    // Asignar cantidad directa en carrito con tope de stock
    const handleSetQuantityDirect = (index, val) => {
        const item = formState.details[index];
        if (!item) return;

        let qty = parseInt(val, 10);
        if (isNaN(qty) || qty < 1) qty = 1;

        const prod = availableProducts.find((p) => (p.idProducto || p.id) === item.productId);
        const origStock = prod ? Number(prod.stockReal !== undefined ? prod.stockReal : (prod.stock || 0)) : 999999;
        const otherUnitsInCart = formState.details
            .filter((d, i) => i !== index && (d.productId === item.productId))
            .reduce((sum, d) => sum + Number(d.baseUnitsQuantity != null ? d.baseUnitsQuantity : d.presentationQuantity || 0), 0);
        const baseRatio = item.baseUnitsQuantity > 0 && item.presentationQuantity > 0
            ? Math.round(item.baseUnitsQuantity / item.presentationQuantity)
            : 1;

        const maxPresQty = Math.max(1, Math.floor((origStock - otherUnitsInCart) / baseRatio));

        if (qty > maxPresQty) {
            qty = maxPresQty;
            Swal.fire({
                title: "Stock máximo alcanzado",
                text: `Se ajustó la cantidad al máximo disponible (${maxPresQty} ${item.presentationName}).`,
                icon: "info",
                confirmButtonColor: "#005f60",
                timer: 2000,
            });
        }

        setFormState((prev) => {
            const updatedDetails = [...prev.details];
            const cur = updatedDetails[index];
            updatedDetails[index] = {
                ...cur,
                presentationQuantity: qty,
                baseUnitsQuantity: qty * baseRatio,
                subtotal: Number((qty * cur.presentationUnitPrice).toFixed(2)),
            };
            return { ...prev, details: updatedDetails };
        });
    };

    // Remover producto del carrito
    const handleRemoveProduct = (index) => {
        setFormState((prev) => ({
            ...prev,
            details: prev.details.filter((_, i) => i !== index),
        }));
    };

    // Cálculos financieros
    const totalVenta = formState.details.reduce((acc, curr) => acc + Number(curr.subtotal || 0), 0);
    const subtotalCalculado = totalVenta > 0 ? totalVenta / 1.18 : 0;
    const igvCalculado = totalVenta - subtotalCalculado;

    const isCredito = (formState.saleType || "").toUpperCase().includes("CREDIT") || (formState.saleType || "").toUpperCase().includes("CRÉDIT");
    const isEfectivo = (formState.paymentMethodName || "").toUpperCase().includes("EFECTIVO");

    // Para medios de pago digitales (YAPE, PLIN, TARJETA, TRANSFERENCIA), el cliente paga el monto total exacto (salvo venta a crédito)
    const montoPagadoFinal = isCredito
        ? 0
        : (!isEfectivo
            ? totalVenta
            : (formState.amountPaid !== "" ? Number(formState.amountPaid) : totalVenta));

    const saldoPendiente = Math.max(0, totalVenta - montoPagadoFinal);
    const paymentStatusCalculado = saldoPendiente <= 0.001 ? "PAGADO" : (montoPagadoFinal > 0 ? "PARCIAL" : "PENDIENTE");
    const vuelto = isEfectivo ? Math.max(0, montoPagadoFinal - totalVenta) : 0;

    // Enviar formulario de venta
    const onSubmit = async (e) => {
        if (e) e.preventDefault();

        if (formState.details.length === 0) {
            Swal.fire({
                title: "Carrito vacío",
                text: "Debes agregar al menos un producto a la venta.",
                icon: "warning",
                confirmButtonColor: "#005f60",
            });
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                ...formState,
                sessionId: activeSession ? activeSession.id : null,
                employeeId: activeSession ? activeSession.openingEmployeeId : null,
                employeeName: activeSession ? activeSession.openingEmployeeName : "Admin Sistema",
                total: totalVenta,
                subtotal: Number(subtotalCalculado.toFixed(2)),
                taxAmount: Number(igvCalculado.toFixed(2)),
                amountPaid: montoPagadoFinal,
                pendingBalance: saldoPendiente,
                paymentStatus: paymentStatusCalculado,
            };

            let response;
            if (isEditMode) {
                response = await updateSale(targetSaleId, payload);
                Swal.fire({
                    title: "¡Actualizada!",
                    text: "Venta actualizada con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
                if (onSuccess) onSuccess();
                else navigate("/sales");
            } else {
                response = await saveSale(payload);
                const saved = response.data || payload;

                // 🚀 Inmediatamente refrescar catálogo de productos con los nuevos stocks descontados
                await refreshProductsCatalog();

                // Guardar venta creada para el modal y ticket
                setCreatedSaleData({
                    ...saved,
                    details: formState.details,
                    total: totalVenta,
                    subtotal: Number(subtotalCalculado.toFixed(2)),
                    taxAmount: Number(igvCalculado.toFixed(2)),
                    amountPaid: montoPagadoFinal,
                    employeeName: activeSession ? activeSession.openingEmployeeName : "Admin Sistema",
                    clientName: formState.clientName,
                    receiptType: formState.receiptType,
                    series: formState.series,
                    receiptNumber: saved.receiptNumber || formState.receiptNumber,
                });

                // Abrir modal de éxito (Imagen 4)
                setIsSuccessModalOpen(true);
            }
        } catch (error) {
            console.error("Error al procesar venta:", error);
            const msg = error.response?.data?.message || "Ocurrió un error al registrar la venta.";
            Swal.fire("Error", msg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Manejador del botón "Imprimir Comprobante" desde el modal de éxito
    const handleSuccessPrint = () => {
        setIsSuccessModalOpen(false);
        setIsTicketModalOpen(true);
        // Resetear carrito de venta para la siguiente
        setFormState((prev) => ({
            ...initialFormState,
            receiptType: prev.receiptType,
            series: prev.series,
        }));
        refreshProductsCatalog();
    };

    // Manejador del botón "Continuar sin imprimir"
    const handleSuccessContinue = async () => {
        setIsSuccessModalOpen(false);
        // Resetear carrito y preparar nueva venta
        setFormState((prev) => ({
            ...initialFormState,
            receiptType: prev.receiptType,
            series: prev.series,
        }));
        await refreshProductsCatalog();
    };

    // Filtrar catálogo de productos
    const filteredCatalog = availableProducts.filter((p) => {
        if (!productCatalogSearch) return true;
        const q = productCatalogSearch.toLowerCase();
        const name = (p.nombre || "").toLowerCase();
        const active = (p.principioActivo || "").toLowerCase();
        const code = (p.codigoBarras || p.codDigemid || "").toLowerCase();
        const lab = (p.laboratorioNombre || "").toLowerCase();
        return name.includes(q) || active.includes(q) || code.includes(q) || lab.includes(q);
    });

    const totalCatalogPages = Math.ceil(filteredCatalog.length / catalogPageSize) || 1;
    const paginatedCatalog = filteredCatalog.slice(
        (catalogPage - 1) * catalogPageSize,
        catalogPage * catalogPageSize
    );

    if (isLoadingData || isCheckingSession) {
        return (
            <div className="flex items-center justify-center min-h-[450px]">
                <div className="flex items-center gap-3 text-teal-700 font-medium text-sm">
                    <svg className="animate-spin h-6 w-6 text-[#005f60]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span>Verificando estado de caja y cargando punto de venta...</span>
                </div>
            </div>
        );
    }

    // Si NO está en modo edición y NO hay sesión de caja activa -> Mostrar "Punto de Venta Cerrado" (Imagen 4)
    if (!isEditMode && !activeSession) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center shadow-lg shadow-rose-100/50 flex flex-col items-center animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-[#ffe4e6] flex items-center justify-center mb-5 text-[#f43f5e] shadow-inner">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-[#e11d48] mb-3">
                        Punto de Venta Cerrado
                    </h2>

                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        No puedes registrar ventas porque no hay una sesión de caja abierta. Por favor, realiza la <span className="font-semibold text-slate-800">Apertura de Caja</span> para continuar.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/cash-sessions")}
                        className="bg-[#f43f5e] hover:bg-[#e11d48] text-white font-medium px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Ir a Gestión de Caja
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto px-3 py-4 space-y-4">

            {/* BARRA SUPERIOR POS (Calco fiel de la Imagen 2) */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Caja Central */}
                <div className="flex items-center gap-3 self-start md:self-auto">
                    <div className="w-11 h-11 rounded-2xl bg-[#005f60] flex items-center justify-center text-white shadow-sm flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="font-black text-slate-800 text-lg tracking-tight">
                            Caja Central
                        </h1>
                        <span className="text-[10px] font-bold text-teal-700 tracking-wider uppercase block">
                            POS - VENTA DIRECTA
                        </span>
                    </div>
                </div>

                {/* Buscador Central con atajo F1 */}
                <div className="w-full md:max-w-2xl relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" strokeWidth="2" />
                            <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                        </svg>
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={productCatalogSearch}
                        onChange={(e) => {
                            setProductCatalogSearch(e.target.value);
                            setCatalogPage(1);
                        }}
                        placeholder="Buscar por código, nombre, p. activo, patología o lote..."
                        className="w-full pl-10 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-inner"
                    />
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[10px] font-bold text-slate-400">
                        F1
                    </span>
                </div>

                {/* Indicador de Caja */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>CAJA #{activeSession ? activeSession.id : "1"}</span>
                    </div>
                </div>
            </div>

            {/* CUERPO PRINCIPAL DEL POS (Imagen 2: Grid 8 cols catálogo/carrito, 4 cols panel de pago) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* COLUMNA IZQUIERDA (8 COLS): Catálogo superior y Carrito inferior */}
                <div className="lg:col-span-8 space-y-4">

                    {/* SECCIÓN 1: CATÁLOGO DE PRODUCTOS DISPONIBLES */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="py-3 px-4">PRODUCTO</th>
                                        <th className="py-3 px-4">LABORATORIO</th>
                                        <th className="py-3 px-4 text-center">STOCK</th>
                                        <th className="py-3 px-4 text-right">PRECIO</th>
                                        <th className="py-3 px-4 text-center">RX</th>
                                        <th className="py-3 px-4 text-right">ACCIÓN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {paginatedCatalog.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                                                No se encontraron productos en el catálogo
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCatalog.map((prod) => {
                                            const origStock = Number(prod.stockReal !== undefined ? prod.stockReal : (prod.stock || 0));
                                            const inCartUnits = getCartUnitsForProduct(prod.idProducto || prod.id);
                                            const stockVal = Math.max(0, origStock - inCartUnits);
                                            const priceVal = Number(prod.precioVenta || 0);
                                            const presList = prod.presentaciones || [];
                                            const priceDisplay = presList.length > 1
                                                ? `S/ ${Math.min(...presList.map(p => Number(p.precioVenta || 0))).toFixed(2)} - ${Math.max(...presList.map(p => Number(p.precioVenta || 0))).toFixed(2)}`
                                                : `S/ ${priceVal.toFixed(2)}`;

                                            return (
                                                <tr key={prod.idProducto || prod.id} className="hover:bg-slate-50/60 transition-colors">
                                                    {/* PRODUCTO */}
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">

                                                            <div>
                                                                <span className="font-extrabold text-slate-800 text-xs block uppercase">
                                                                    {prod.nombre}
                                                                </span>
                                                                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                                                    <span className="text-slate-400">
                                                                        {[prod.formaFarmaceutica, prod.concentracion].filter(Boolean).join(" ")}
                                                                    </span>
                                                                </div>
                                                                <div>{prod.principioActivo && (
                                                                    <span className="text-teal-700 font-medium">
                                                                        {prod.principioActivo}
                                                                    </span>
                                                                )}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* LABORATORIO */}
                                                    <td className="py-3 px-4">
                                                        <span className="font-semibold text-slate-600 uppercase text-[11px]">
                                                            {prod.laboratorioNombre || prod.laboratorio?.nombre || "TERBOL"}
                                                        </span>
                                                    </td>

                                                    {/* STOCK DISPONIBLE (DESCONTANDO LO QUE ESTÁ EN EL CARRITO) */}
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`font-black text-xs ${
                                                            stockVal <= 0
                                                                ? "text-slate-400"
                                                                : stockVal <= 5
                                                                    ? "text-rose-600"
                                                                    : stockVal <= 15
                                                                        ? "text-amber-600"
                                                                        : "text-emerald-700"
                                                        }`}>
                                                            {stockVal}
                                                        </span>
                                                    </td>

                                                    {/* PRECIO */}
                                                    <td className="py-3 px-4 text-right">
                                                        <span className="font-extrabold text-slate-800 text-xs">
                                                            {priceDisplay}
                                                        </span>
                                                    </td>

                                                    {/* RX */}
                                                    <td className="py-3 px-4 text-center">
                                                        {prod.requiereReceta ? (
                                                            <span className="bg-rose-50 text-rose-700 font-black text-[9px] px-1.5 py-0.5 rounded border border-rose-200 uppercase">
                                                                Rx
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs font-bold">-</span>
                                                        )}
                                                    </td>

                                                    {/* ACCIÓN AGREGAR */}
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            disabled={stockVal <= 0}
                                                            onClick={() => handleOpenPresentationModal(prod)}
                                                            className={`px-4 py-1.5 text-xs font-bold rounded-xl shadow-sm transition-all ${
                                                                stockVal <= 0
                                                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                                    : "bg-[#005f60] hover:bg-[#004e4f] text-white hover:shadow"
                                                            }`}
                                                        >
                                                            {stockVal <= 0 ? "Agotado" : "Agregar"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación Catálogo */}
                        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="text-[11px] text-slate-400 font-medium">
                                MOSTRANDO {paginatedCatalog.length} DE {filteredCatalog.length}
                            </span>
                            {totalCatalogPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={catalogPage === 1}
                                        onClick={() => setCatalogPage((p) => Math.max(p - 1, 1))}
                                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        &lt;
                                    </button>
                                    <span className="text-xs font-bold px-2 text-teal-800">
                                        {catalogPage} / {totalCatalogPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={catalogPage === totalCatalogPages}
                                        onClick={() => setCatalogPage((p) => Math.min(p + 1, totalCatalogPages))}
                                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        &gt;
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN 2: CARRITO DE VENTA (Calco fiel de la Imagen 2) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase">
                                    CARRITO DE VENTA
                                </h3>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                                {formState.details.length} ÍTEM(S)
                            </span>
                        </div>

                        {formState.details.length === 0 ? (
                            <div className="py-14 text-center text-slate-400 flex flex-col items-center justify-center">
                                <svg className="w-10 h-10 text-slate-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    CARRITO VACÍO
                                </span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="py-2.5 px-4">PRODUCTO</th>
                                            <th className="py-2.5 px-4 text-center">CANTIDAD</th>
                                            <th className="py-2.5 px-4 text-right">P. UNIT.</th>
                                            <th className="py-2.5 px-4 text-right">SUBTOTAL</th>
                                            <th className="py-2.5 px-4 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {formState.details.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/60">
                                                {/* PRODUCTO + PRESENTACIÓN */}
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <span className="font-extrabold text-slate-800 text-xs block uppercase">
                                                            {item.productName}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                                            <span className="bg-teal-50 text-teal-800 font-bold px-1.5 py-0.2 rounded border border-teal-200 uppercase">
                                                                {item.presentationName}
                                                            </span>
                                                            {item.lotNumber && (
                                                                <span className="text-slate-500 font-medium">
                                                                    Lote: {item.lotNumber}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* CANTIDAD CON BOTONES +/- Y LÍMITE DE STOCK */}
                                                <td className="py-3 px-4 text-center">
                                                    {(() => {
                                                        const prod = availableProducts.find((p) => (p.idProducto || p.id) === item.productId);
                                                        const origStock = prod ? Number(prod.stockReal !== undefined ? prod.stockReal : (prod.stock || 0)) : 999999;
                                                        const otherUnitsInCart = formState.details
                                                            .filter((d, i) => i !== idx && d.productId === item.productId)
                                                            .reduce((sum, d) => sum + Number(d.baseUnitsQuantity != null ? d.baseUnitsQuantity : d.presentationQuantity || 0), 0);
                                                        const baseRatio = item.baseUnitsQuantity > 0 && item.presentationQuantity > 0
                                                            ? Math.round(item.baseUnitsQuantity / item.presentationQuantity)
                                                            : 1;
                                                        const maxPresQty = Math.max(1, Math.floor((origStock - otherUnitsInCart) / baseRatio));
                                                        const isAtMaxStock = item.presentationQuantity >= maxPresQty;

                                                        return (
                                                            <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-inner">
                                                                <button
                                                                    type="button"
                                                                    disabled={item.presentationQuantity <= 1}
                                                                    onClick={() => handleUpdateQuantity(idx, -1)}
                                                                    className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max={maxPresQty}
                                                                    value={item.presentationQuantity}
                                                                    onChange={(e) => handleSetQuantityDirect(idx, e.target.value)}
                                                                    className="w-10 text-center bg-transparent font-black text-xs text-slate-800 focus:outline-none"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={isAtMaxStock}
                                                                    onClick={() => handleUpdateQuantity(idx, 1)}
                                                                    className={`w-7 h-7 flex items-center justify-center font-bold transition-colors ${
                                                                        isAtMaxStock
                                                                            ? "text-slate-300 bg-slate-100 cursor-not-allowed"
                                                                            : "text-slate-600 hover:bg-slate-200"
                                                                    }`}
                                                                    title={isAtMaxStock ? "Stock máximo alcanzado" : "Aumentar cantidad"}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>

                                                {/* PRECIO UNITARIO */}
                                                <td className="py-3 px-4 text-right font-medium text-slate-600">
                                                    S/ {Number(item.presentationUnitPrice).toFixed(2)}
                                                </td>

                                                {/* SUBTOTAL */}
                                                <td className="py-3 px-4 text-right font-black text-slate-800 text-xs">
                                                    S/ {Number(item.subtotal).toFixed(2)}
                                                </td>

                                                {/* REMOVER */}
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveProduct(idx)}
                                                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                                        title="Eliminar producto"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                </table>
                            </div>
                        )}

                        {/* RESUMEN Y TOTAL AL PIE DEL CARRITO DE VENTA */}
                        {formState.details.length > 0 && (
                            <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                    <span>
                                        Ítems: <strong className="text-slate-800 font-bold">{formState.details.length}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        Unidades: <strong className="text-slate-800 font-bold">
                                            {formState.details.reduce((acc, curr) => acc + Number(curr.presentationQuantity || 0), 0)}
                                        </strong>
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            SUBTOTAL
                                        </span>
                                        <span className="text-xs font-bold text-slate-700">
                                            S/ {subtotalCalculado.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            IGV (18%)
                                        </span>
                                        <span className="text-xs font-bold text-slate-700">
                                            S/ {igvCalculado.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="bg-[#005f60] text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-200">
                                            TOTAL:
                                        </span>
                                        <span className="text-lg font-black tracking-tight">
                                            S/ {totalVenta.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA (4 COLS): Panel de Totales y Datos de Transacción */}
                <div className="lg:col-span-4 space-y-4">

                    {/* TARJETA TOTALES (BANNER OSCURO VERDE AZULADO CALCO IMAGEN 2) */}
                    <div className="bg-[#005f60] text-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
                        <div className="space-y-1.5 text-xs text-teal-100 border-b border-teal-500/40 pb-3 mb-3">
                            <div className="flex justify-between">
                                <span>SUBTOTAL</span>
                                <span className="font-bold">S/ {subtotalCalculado.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Base Imponible</span>
                                <span>S/ {subtotalCalculado.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>IGV (18%)</span>
                                <span>S/ {igvCalculado.toFixed(2)}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-[11px] font-bold tracking-wider uppercase text-teal-200 block">
                                TOTAL A PAGAR
                            </span>
                            <div className="text-3xl font-black text-white tracking-tight mt-0.5">
                                S/ {totalVenta.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* DETALLES DE TRANSACCIÓN (Calco Imagen 2) */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>DETALLES DE TRANSACCIÓN</span>
                        </div>

                        {/* Comprobante y Serie */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                    COMPROBANTE
                                </label>
                                <select
                                    name="receiptType"
                                    value={formState.receiptType}
                                    onChange={onInputChange}
                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                >
                                    <option value="TICKET">TICKET</option>
                                    <option value="BOLETA">BOLETA DE VENTA</option>
                                    <option value="FACTURA">FACTURA</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                    SERIE - Nº <span className="font-normal text-[10px] text-slate-400">(Vista previa)</span>
                                </label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-700 truncate">
                                    {formState.series} - {formState.receiptNumber}
                                </div>
                            </div>
                        </div>

                        {/* Tipo Venta y Medio Pago */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                    TIPO VENTA
                                </label>
                                <select
                                    name="saleType"
                                    value={formState.saleType}
                                    onChange={handleSaleTypeChange}
                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 uppercase"
                                >
                                    {paymentConditions.length > 0 ? (
                                        paymentConditions.map((cond) => (
                                            <option key={cond.idCondicion || cond.nombre} value={cond.nombre.toUpperCase()}>
                                                {cond.nombre} {Number(cond.dias || 0) > 0 ? `(${cond.dias} DÍAS)` : ""}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="CONTADO">Contado</option>
                                            <option value="CREDITO">Crédito</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                    MEDIO PAGO
                                </label>
                                <select
                                    name="paymentMethodName"
                                    value={formState.paymentMethodName}
                                    onChange={handlePaymentMethodChange}
                                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 uppercase"
                                >
                                    {paymentMethods.length > 0 ? (
                                        paymentMethods.map((pm) => (
                                            <option key={pm.id || pm.nombre} value={pm.nombre.toUpperCase()}>
                                                {pm.nombre.toUpperCase()} {Number(pm.recargoPorcentaje || 0) > 0 ? `(+${pm.recargoPorcentaje}%)` : ""}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="EFECTIVO">EFECTIVO</option>
                                            <option value="YAPE">YAPE</option>
                                            <option value="PLIN">PLIN</option>
                                            <option value="TARJETA">TARJETA</option>
                                            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Cliente Asignado */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase">
                                    CLIENTE ASIGNADO
                                </label>
                                <button
                                    type="button"
                                    onClick={() => navigate("/clients/register")}
                                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 border border-teal-200 hover:bg-teal-50 px-2 py-0.5 rounded-lg transition-colors"
                                >
                                    + Nuevo Cliente
                                </button>
                            </div>
                            <select
                                value={formState.clientId || ""}
                                onChange={handleClientChange}
                                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            >
                                <option value="">Público General</option>
                                {clientsList.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {[c.firstName || c.nombres, c.lastName || c.apellidos].filter(Boolean).join(" ") || c.documentNumber} ({c.documentNumber || "S/D"})
                                    </option>
                                ))}
                            </select>
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                                <span>Límite: S/ 0.00</span>
                                <span>Saldo Actual: S/ 0.00 (+S/ 0.00)</span>
                            </div>
                        </div>

                        {/* Efectivo Recibido y Vuelto */}
                        {(formState.paymentMethodName || "").toUpperCase().includes("EFECTIVO") && (
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                        PAGA CON (S/)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.10"
                                        placeholder={totalVenta.toFixed(2)}
                                        value={formState.amountPaid}
                                        onChange={onInputChange}
                                        name="amountPaid"
                                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                        VUELTO / CAMBIO
                                    </label>
                                    <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-black text-xs text-emerald-700">
                                        S/ {vuelto.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BOTÓN REALIZAR VENTA (Calco Imagen 2) */}
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={isSubmitting || formState.details.length === 0}
                            className="w-full py-4 bg-[#005f60] hover:bg-[#004e4f] text-white rounded-2xl font-black text-sm tracking-wide shadow-sm hover:shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 mt-4"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>PROCESANDO...</span>
                                </>
                            ) : (
                                <span>{isEditMode ? "ACTUALIZAR VENTA" : "Realizar Venta"}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL SELECCIÓN DE PRESENTACIÓN Y LOTES FEFO (Imagen 3) */}
            <PresentationLotModal
                isOpen={isPresModalOpen}
                onClose={() => {
                    setIsPresModalOpen(false);
                    setSelectedProductForModal(null);
                }}
                product={selectedProductForModal}
                availableStock={getAvailableStockForProduct(selectedProductForModal)}
                onSelectPresentation={handleAddPresentationToCart}
            />

            {/* MODAL CONFIRMACIÓN POST-VENTA (Imagen 4) */}
            <SaleSuccessModal
                isOpen={isSuccessModalOpen}
                saleData={createdSaleData}
                onPrint={handleSuccessPrint}
                onContinue={handleSuccessContinue}
            />

            {/* MODAL PLANTILLA COMPROBANTE TÉRMICO (Imagen 5) */}
            <ReceiptTicketModal
                isOpen={isTicketModalOpen}
                onClose={() => {
                    setIsTicketModalOpen(false);
                    setFormState((prev) => ({
                        ...initialFormState,
                        receiptType: prev.receiptType,
                        series: prev.series,
                    }));
                    refreshProductsCatalog();
                }}
                saleData={createdSaleData}
            />
        </div>
    );
};

SaleForm.propTypes = {
    saleSelected: PropTypes.object,
    initialData: PropTypes.object,
    onSuccess: PropTypes.func,
    onCancel: PropTypes.func,
};
