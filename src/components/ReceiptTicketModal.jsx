import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import productsApi from "../apis/productsApi";

// Función utilitaria para convertir números a palabras en español (Soles)
function numeroALetras(num) {
    if (num === null || num === undefined || isNaN(num)) return "CERO CON 00/100 SOLES";

    const unidades = [
        "", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
        "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"
    ];
    const decenas = [
        "", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"
    ];
    const centenas = [
        "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"
    ];

    function convertirGrupo(n) {
        let output = "";
        if (n === 100) return "CIEN";
        if (n >= 100) {
            output += centenas[Math.floor(n / 100)] + " ";
            n %= 100;
        }
        if (n >= 20) {
            if (n === 20) {
                output += "VEINTE";
            } else if (n > 20 && n < 30) {
                output += "VEINTI" + unidades[n - 20];
            } else {
                output += decenas[Math.floor(n / 10)];
                if (n % 10 !== 0) output += " Y " + unidades[n % 10];
            }
        } else if (n > 0) {
            output += unidades[n];
        }
        return output.trim();
    }

    const entero = Math.floor(num);
    const decimales = Math.round((num - entero) * 100);
    const decimalesStr = String(decimales).padStart(2, "0") + "/100 SOLES";

    if (entero === 0) return `CERO CON ${decimalesStr}`;

    let resultado = "";
    if (entero >= 1000) {
        const miles = Math.floor(entero / 1000);
        const resto = entero % 1000;
        if (miles === 1) {
            resultado += "MIL ";
        } else {
            resultado += convertirGrupo(miles) + " MIL ";
        }
        if (resto > 0) {
            resultado += convertirGrupo(resto);
        }
    } else {
        resultado = convertirGrupo(entero);
    }

    return `${resultado.trim()} CON ${decimalesStr}`;
}

export const ReceiptTicketModal = ({ isOpen, onClose, saleData }) => {
    const [companyInfo, setCompanyInfo] = useState({
        legalName: "VidSalud SAC",
        commercialName: "VidSalud SAC",
        taxId: "20258585874",
        address: "Cusco Perú",
        phone: "",
        ticketFooterText1: "¡Gracias por su compra!",
        ticketFooterText2: "",
        logoUrl: "",
    });

    useEffect(() => {
        // Cargar datos de la empresa desde la base de datos si existen
        productsApi.get("/company")
            .then((res) => {
                if (res.data) {
                    setCompanyInfo((prev) => ({
                        ...prev,
                        legalName: res.data.legalName || prev.legalName,
                        commercialName: res.data.commercialName || prev.commercialName,
                        taxId: res.data.taxId || prev.taxId,
                        address: res.data.address || prev.address,
                        phone: res.data.phone || prev.phone,
                        ticketFooterText1: res.data.ticketFooterText1 || prev.ticketFooterText1,
                        ticketFooterText2: res.data.ticketFooterText2 || "",
                        logoUrl: res.data.logoUrl || "",
                    }));
                }
            })
            .catch(() => {
                // Fallback a los datos por defecto de la imagen de referencia
            });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !saleData) return null;

    const receiptType = (saleData.receiptType || saleData.tipoComprobante || "TICKET").toUpperCase();
    const series = saleData.series || saleData.serie || (receiptType === "FACTURA" ? "F001" : receiptType === "BOLETA" ? "B001" : "T001");
    const receiptNum = saleData.receiptNumber || saleData.numComprobante || String(saleData.id || "00000001").padStart(8, "0");
    const fullReceipt = `${series} - ${receiptNum}`;

    const dateStr = saleData.dateTime
        ? (saleData.dateTime.length > 19 ? saleData.dateTime.slice(0, 19).replace("T", " ") : saleData.dateTime.replace("T", " "))
        : new Date().toISOString().slice(0, 19).replace("T", " ");

    const cashier = saleData.employeeName || saleData.empleadoNombre || "Admin Sistema";
    const client = saleData.clientName || saleData.clienteNombre || "Público General";

    const details = saleData.details || saleData.detalles || [];
    const total = Number(saleData.total || 0);
    const amountPaid = Number(
        saleData.amountPaid !== undefined && saleData.amountPaid !== null
            ? saleData.amountPaid
            : (saleData.montoPagado !== undefined && saleData.montoPagado !== null ? saleData.montoPagado : total)
    );
    const change = Math.max(0, amountPaid - total);
    const paymentMethod = saleData.paymentMethodName || saleData.medioPago || "EFECTIVO";
    const paymentStatus = (
        saleData.paymentStatus ||
        saleData.estadoPago ||
        (Number(saleData.pendingBalance || saleData.saldoPendiente || 0) <= 0.001 ? "PAGADO" : "PENDIENTE")
    ).toUpperCase();
    const handlePrint = () => {
        // Crear o reutilizar iframe oculto para impresión 100% aislada
        let printFrame = document.getElementById("thermal-print-iframe");
        if (!printFrame) {
            printFrame = document.createElement("iframe");
            printFrame.id = "thermal-print-iframe";
            printFrame.style.position = "fixed";
            printFrame.style.right = "0";
            printFrame.style.bottom = "0";
            printFrame.style.width = "0";
            printFrame.style.height = "0";
            printFrame.style.border = "none";
            printFrame.style.visibility = "hidden";
            document.body.appendChild(printFrame);
        }

        const doc = printFrame.contentWindow.document;
        doc.open();
        doc.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Comprobante_${fullReceipt.replace(/[^a-zA-Z0-9]/g, '')}</title>
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                html, body {
                    width: 76mm;
                    margin: 0 auto;
                    padding: 4mm 2mm;
                    background: #ffffff;
                    color: #000000;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 11px;
                    line-height: 1.25;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                * {
                    box-sizing: border-box;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .left { text-align: left; }
                .bold { font-weight: bold; }
                .uppercase { text-transform: uppercase; }
                .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
                .subtitle { font-size: 10px; margin: 1px 0; color: #333; }
                .receipt-title { font-size: 13px; font-weight: bold; margin-top: 4px; }
                .receipt-num { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
                .dashed-line {
                    border-bottom: 1px dashed #444;
                    margin: 5px 0;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                    margin: 2px 0;
                    font-size: 11px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    margin: 3px 0;
                }
                th {
                    text-align: left;
                    border-bottom: 1px solid #000;
                    padding-bottom: 3px;
                    font-weight: bold;
                    font-size: 10px;
                }
                td {
                    padding: 2px 0;
                    vertical-align: top;
                }
                .footer-text {
                    text-align: center;
                    font-style: italic;
                    margin-top: 8px;
                    font-size: 10px;
                }
            </style>
        </head>
        <body>
            ${companyInfo.logoUrl ? `
            <div class="center" style="margin-bottom: 6px;">
                <img src="${companyInfo.logoUrl}" style="max-height: 45px; max-width: 140px; object-fit: contain;" />
            </div>
            ` : ''}
            <div class="center">
                <div class="title">${companyInfo.commercialName || companyInfo.legalName || "VidSalud SAC"}</div>
                <div class="subtitle">RUC: ${companyInfo.taxId}</div>
                <div class="subtitle">${companyInfo.address}</div>
                ${companyInfo.phone ? `<div class="subtitle">Tel: ${companyInfo.phone}</div>` : ''}
            </div>

            <div class="dashed-line"></div>

            <div class="center">
                <div class="receipt-title">${receiptType}</div>
                <div class="receipt-num">${fullReceipt}</div>
            </div>

            <div class="row">
                <span>Fecha:</span>
                <span class="bold">${dateStr}</span>
            </div>
            <div class="row">
                <span>Atendido por:</span>
                <span>${cashier}</span>
            </div>
            <div class="row">
                <span>Cliente:</span>
                <span class="bold">${client}</span>
            </div>

            <div class="dashed-line"></div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 52%;">Producto</th>
                        <th style="width: 14%; text-align: center;">Cant</th>
                        <th style="width: 16%; text-align: right;">P.U.</th>
                        <th style="width: 18%; text-align: right;">Subt.</th>
                    </tr>
                </thead>
                <tbody>
                    ${details.map(d => {
                        const prodName = d.productName || d.nombre || "Producto";
                        const presName = d.presentationName || d.presentacion || "";
                        const displayName = presName ? `${prodName} ${presName}` : prodName;
                        const qty = d.presentationQuantity || d.cantidad || 1;
                        const price = Number(d.presentationUnitPrice || d.precioUnitario || d.precio || 0).toFixed(2);
                        const sub = Number(d.subtotal || (qty * price)).toFixed(2);
                        return `
                        <tr>
                            <td style="text-transform: uppercase;">${displayName}</td>
                            <td style="text-align: center; font-weight: bold;">${qty}</td>
                            <td style="text-align: right;">${price}</td>
                            <td style="text-align: right; font-weight: bold;">${sub}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div class="dashed-line"></div>

            <div class="row">
                <span>SUBTOTAL VENTAS</span>
                <span class="bold">S/ ${total.toFixed(2)}</span>
            </div>
            <div class="row bold" style="font-size: 12px; margin-top: 2px;">
                <span>TOTAL</span>
                <span>S/ ${total.toFixed(2)}</span>
            </div>
            <div style="font-size: 9px; margin-top: 3px; text-transform: uppercase; color: #222;">
                SON: ${numeroALetras(total)}
            </div>

            <div class="dashed-line"></div>

            <div class="row">
                <span>RECIBIDO</span>
                <span>S/ ${amountPaid.toFixed(2)}</span>
            </div>
            <div class="row">
                <span>CAMBIO</span>
                <span class="bold">S/ ${change.toFixed(2)}</span>
            </div>
            <div class="row">
                <span>FORMA DE PAGO</span>
                <span class="bold uppercase">${paymentMethod}</span>
            </div>
            <div class="row">
                <span>ESTADO</span>
                <span class="bold uppercase">${paymentStatus}</span>
            </div>

            <div class="dashed-line"></div>

            <div class="footer-text">
                <div>${companyInfo.ticketFooterText1 || "¡Gracias por su compra!"}</div>
                ${companyInfo.ticketFooterText2 ? `<div style="margin-top: 2px;">${companyInfo.ticketFooterText2}</div>` : ''}
            </div>
        </body>
        </html>
        `);
        doc.close();

        setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
        }, 250);
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden print:p-0 print:bg-white print:static print:overflow-visible"
            onClick={onClose}
        >
            {/* Contenedor del Modal Principal - Más amplio, alto y sin línea superior antiestética */}
            <div 
                className="bg-slate-200/90 rounded-2xl shadow-2xl w-full max-w-[460px] h-[88vh] max-h-[820px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:w-[80mm] print:h-auto print:border-none print:shadow-none print:rounded-none print:p-0 print:bg-white print:max-h-none print:overflow-visible ring-1 ring-black/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Fijo Superior (Sin borde que genere línea) */}
                <div className="bg-[#005f60] text-white px-5 py-3.5 flex items-center justify-between shadow-md flex-shrink-0 print:hidden rounded-t-2xl">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-400/20 flex items-center justify-center text-teal-200">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-white leading-tight">Vista de Comprobante</h3>
                            <span className="text-[11px] text-teal-200/80 font-medium">Ticket Térmico 80mm</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="bg-white text-[#005f60] hover:bg-teal-50 active:scale-95 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                            title="Imprimir comprobante"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Imprimir</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-teal-100 hover:text-white hover:bg-teal-700/60 p-1.5 rounded-lg transition-colors"
                            title="Cerrar (Esc)"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Área Scrollable del Ticket (Scroll suave y natural de todo el comprobante) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-200/75 print:p-0 print:bg-white print:overflow-visible">
                    
                    {/* Rollo de Papel Térmico con Sombra y Proporción Real */}
                    <div 
                        id="thermal-receipt" 
                        className="bg-white w-full max-w-[350px] shadow-lg rounded-xl p-6 font-mono text-[12px] leading-relaxed text-slate-800 border border-slate-200 h-fit print:max-w-none print:w-full print:p-2 print:border-none print:shadow-none print:rounded-none"
                    >
                        {/* Logotipo Empresa (si existe) */}
                        {companyInfo.logoUrl && (
                            <div className="flex justify-center mb-3">
                                <img
                                    src={companyInfo.logoUrl}
                                    alt="Logo Empresa"
                                    className="max-h-12 max-w-[130px] object-contain filter contrast-125"
                                />
                            </div>
                        )}

                        {/* Encabezado Empresa */}
                        <div className="text-center space-y-0.5">
                            <h2 className="font-black text-sm tracking-wide text-slate-900 uppercase">
                                {companyInfo.commercialName || companyInfo.legalName || "VidSalud SAC"}
                            </h2>
                            <p className="text-[11px] text-slate-600 font-bold">
                                RUC: {companyInfo.taxId}
                            </p>
                            <p className="text-[11px] text-slate-600 leading-snug">
                                {companyInfo.address}
                            </p>
                            {companyInfo.phone && (
                                <p className="text-[11px] text-slate-600">
                                    Tel: {companyInfo.phone}
                                </p>
                            )}
                        </div>

                        <div className="border-b border-dashed border-slate-400 my-3" />

                        {/* Datos Comprobante */}
                        <div className="text-center my-1.5">
                            <span className="font-black text-xs tracking-wider block uppercase text-slate-900">
                                {receiptType}
                            </span>
                            <span className="font-bold text-[12px] tracking-widest block text-slate-800 mt-0.5">
                                {fullReceipt}
                            </span>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-700">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Fecha:</span>
                                <span className="font-semibold text-slate-900">{dateStr}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Atendido por:</span>
                                <span className="font-medium text-slate-900">{cashier}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Cliente:</span>
                                <span className="font-bold text-slate-900 uppercase">{client}</span>
                            </div>
                        </div>

                        <div className="border-b border-dashed border-slate-400 my-3" />

                        {/* Tabla de Productos */}
                        <div>
                            <div className="flex justify-between font-bold text-[11px] border-b border-slate-300 pb-1.5 mb-2 text-slate-900">
                                <span className="w-[48%]">Producto</span>
                                <span className="w-[14%] text-center">Cant</span>
                                <span className="w-[18%] text-right">P.U.</span>
                                <span className="w-[20%] text-right">Subt.</span>
                            </div>

                            <div className="space-y-1.5 text-[11.5px]">
                                {details.map((item, idx) => {
                                    const prodName = item.productName || item.nombre || "Producto";
                                    const presName = item.presentationName || item.presentacion || "";
                                    const displayName = presName ? `${prodName} ${presName}` : prodName;
                                    const qty = item.presentationQuantity || item.cantidad || 1;
                                    const price = Number(item.presentationUnitPrice || item.precioUnitario || item.precio || 0);
                                    const subt = Number(item.subtotal !== undefined && item.subtotal !== null ? item.subtotal : (qty * price));

                                    return (
                                        <div key={idx} className="flex items-start">
                                            <span className="w-[48%] pr-1 leading-snug font-medium uppercase text-slate-900">
                                                {displayName}
                                            </span>
                                            <span className="w-[14%] text-center font-bold text-slate-900">
                                                {qty}
                                            </span>
                                            <span className="w-[18%] text-right text-slate-700">
                                                {price.toFixed(2)}
                                            </span>
                                            <span className="w-[20%] text-right font-bold text-slate-900">
                                                {subt.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border-b border-dashed border-slate-400 my-3" />

                        {/* Totales y Letras */}
                        <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-slate-600">SUBTOTAL VENTAS</span>
                                <span className="font-bold">S/ {total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black pt-1 border-t border-dotted border-slate-300 text-slate-900">
                                <span>TOTAL</span>
                                <span>S/ {total.toFixed(2)}</span>
                            </div>
                            <div className="text-[10px] text-slate-600 font-medium pt-0.5 uppercase leading-tight">
                                SON: {numeroALetras(total)}
                            </div>
                        </div>

                        <div className="border-b border-dashed border-slate-400 my-3" />

                        {/* Datos de Pago */}
                        <div className="space-y-1 text-[11px] text-slate-700">
                            <div className="flex justify-between">
                                <span className="text-slate-500">RECIBIDO</span>
                                <span>S/ {amountPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">CAMBIO</span>
                                <span className="font-bold">S/ {change.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">FORMA DE PAGO</span>
                                <span className="font-bold uppercase">{paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">ESTADO</span>
                                <span className={`font-bold uppercase ${
                                    paymentStatus === "PAGADO"
                                        ? "text-emerald-700"
                                        : paymentStatus === "PARCIAL"
                                        ? "text-amber-700"
                                        : "text-rose-700"
                                }`}>
                                    {paymentStatus}
                                </span>
                            </div>
                        </div>

                        <div className="border-b border-dashed border-slate-400 my-3" />

                        {/* Textos del Pie del Ticket */}
                        <div className="text-center text-[10.5px] text-slate-600 italic space-y-1 pt-1 leading-snug">
                            <p className="font-medium">{companyInfo.ticketFooterText1 || "¡Gracias por su compra!"}</p>
                            {companyInfo.ticketFooterText2 && (
                                <p>{companyInfo.ticketFooterText2}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Fijo Siempre Visible (Sin cortes, botones destacados) */}
                <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0 print:hidden rounded-b-2xl shadow-sm">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-5 py-2 text-xs font-bold text-white bg-[#005f60] hover:bg-[#004e4f] active:scale-95 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Imprimir Ticket</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

ReceiptTicketModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    saleData: PropTypes.object,
};
