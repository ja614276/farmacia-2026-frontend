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
    const [paperSize, setPaperSize] = useState("80mm"); // '58mm' | '80mm' | 'A4'
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
        // Cargar primero configuración desde localStorage si existe para sincronización instantánea
        try {
            const stored = localStorage.getItem("farmacia_settings_config");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.ticketPaperSize) setPaperSize(parsed.ticketPaperSize);
            }
        } catch (_) { }

        // Cargar datos de la empresa y configuración desde la base de datos
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

                    if (res.data.ticketPaperSize) {
                        setPaperSize(res.data.ticketPaperSize);
                    }
                }
            })
            .catch(() => {
                // Fallback a los datos por defecto
            });
    }, [isOpen]);

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
    const subtotalCalc = total / 1.18;
    const igvCalc = total - subtotalCalc;

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

        if (paperSize === "A4") {
            // ==========================================
            // FORMATO A4: Hoja Completa / Facturación Formal
            // ==========================================
            doc.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Comprobante_${fullReceipt.replace(/[^a-zA-Z0-9]/g, '')}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 15mm 12mm;
                    }
                    html, body {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                        color: #1a202c;
                        font-family: 'Segoe UI', Arial, sans-serif;
                        font-size: 11px;
                        line-height: 1.4;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    * { box-sizing: border-box; }
                    .header-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 16px;
                    }
                    .company-side {
                        width: 58%;
                    }
                    .company-logo {
                        max-height: 55px;
                        max-width: 170px;
                        object-fit: contain;
                        margin-bottom: 8px;
                    }
                    .company-name {
                        font-size: 16px;
                        font-weight: 800;
                        color: #005f60;
                        text-transform: uppercase;
                    }
                    .company-meta {
                        font-size: 10.5px;
                        color: #4a5568;
                        margin-top: 2px;
                    }
                    .invoice-box {
                        width: 38%;
                        border: 2px solid #005f60;
                        border-radius: 8px;
                        padding: 12px;
                        text-align: center;
                        background-color: #f7fafc;
                    }
                    .invoice-box .ruc {
                        font-size: 13px;
                        font-weight: 800;
                        letter-spacing: 0.5px;
                    }
                    .invoice-box .doc-type {
                        font-size: 14px;
                        font-weight: 800;
                        color: #005f60;
                        text-transform: uppercase;
                        margin: 6px 0;
                    }
                    .invoice-box .doc-num {
                        font-size: 14px;
                        font-weight: 800;
                        letter-spacing: 1px;
                    }
                    .client-box {
                        border: 1px solid #cbd5e1;
                        border-radius: 6px;
                        padding: 10px 14px;
                        margin-bottom: 14px;
                        background-color: #f8fafc;
                        display: flex;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 8px 20px;
                    }
                    .client-item {
                        font-size: 11px;
                    }
                    .client-item strong {
                        color: #1e293b;
                    }
                    table.details-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 16px;
                    }
                    table.details-table th {
                        background-color: #005f60;
                        color: #ffffff;
                        font-size: 10.5px;
                        font-weight: 700;
                        padding: 8px 10px;
                        text-align: left;
                        text-transform: uppercase;
                    }
                    table.details-table td {
                        padding: 8px 10px;
                        border-bottom: 1px solid #e2e8f0;
                        font-size: 11px;
                    }
                    table.details-table tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    .bottom-section {
                        display: flex;
                        justify-content: space-between;
                        gap: 20px;
                        margin-top: 10px;
                    }
                    .bottom-left {
                        width: 60%;
                    }
                    .bottom-right {
                        width: 38%;
                    }
                    .totals-box {
                        border: 1px solid #cbd5e1;
                        border-radius: 6px;
                        overflow: hidden;
                    }
                    .totals-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 6px 12px;
                        font-size: 11px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .totals-row.grand-total {
                        background-color: #005f60;
                        color: #ffffff;
                        font-size: 13px;
                        font-weight: 800;
                        border-bottom: none;
                    }
                    .amount-words {
                        padding: 8px 12px;
                        background-color: #f1f5f9;
                        border-radius: 6px;
                        font-weight: 600;
                        font-size: 10px;
                        text-transform: uppercase;
                        margin-bottom: 10px;
                    }
                    .footer-notes {
                        margin-top: 25px;
                        text-align: center;
                        font-size: 10px;
                        color: #64748b;
                        border-top: 1px dashed #cbd5e1;
                        padding-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <div class="company-side">
                        ${companyInfo.logoUrl ? `<img src="${companyInfo.logoUrl}" class="company-logo" />` : ''}
                        <div class="company-name">${companyInfo.commercialName || companyInfo.legalName || "VidSalud SAC"}</div>
                        <div class="company-meta"><strong>RUC:</strong> ${companyInfo.taxId}</div>
                        <div class="company-meta"><strong>Dirección:</strong> ${companyInfo.address}</div>
                        ${companyInfo.phone ? `<div class="company-meta"><strong>Teléfono:</strong> ${companyInfo.phone}</div>` : ''}
                    </div>
                    <div class="invoice-box">
                        <div class="ruc">R.U.C. N° ${companyInfo.taxId}</div>
                        <div class="doc-type">${receiptType === "FACTURA" ? "FACTURA ELECTRÓNICA" : receiptType === "BOLETA" ? "BOLETA DE VENTA ELECTRÓNICA" : "TICKET ELECTRÓNICO"}</div>
                        <div class="doc-num">${fullReceipt}</div>
                    </div>
                </div>

                <div class="client-box">
                    <div class="client-item" style="width: 48%;">
                        <strong>Cliente:</strong> <span style="text-transform: uppercase;">${client}</span>
                    </div>
                    <div class="client-item" style="width: 48%;">
                        <strong>Fecha de Emisión:</strong> <span>${dateStr}</span>
                    </div>
                    <div class="client-item" style="width: 48%;">
                        <strong>Atendido por:</strong> <span>${cashier}</span>
                    </div>
                    <div class="client-item" style="width: 48%;">
                        <strong>Medio de Pago:</strong> <span style="text-transform: uppercase;">${paymentMethod} (${paymentStatus})</span>
                    </div>
                </div>

                <table class="details-table">
                    <thead>
                        <tr>
                            <th style="width: 6%; text-align: center;">Item</th>
                            <th style="width: 52%;">Descripción del Producto</th>
                            <th style="width: 12%; text-align: center;">Cantidad</th>
                            <th style="width: 14%; text-align: right;">Precio Unit.</th>
                            <th style="width: 16%; text-align: right;">Importe Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${details.map((d, index) => {
                const prodName = d.productName || d.nombre || "Producto";
                const presName = d.presentationName || d.presentacion || "";
                const displayName = presName ? `${prodName} ${presName}` : prodName;
                const qty = d.presentationQuantity || d.cantidad || 1;
                const price = Number(d.presentationUnitPrice || d.precioUnitario || d.precio || 0).toFixed(2);
                const sub = Number(d.subtotal || (qty * price)).toFixed(2);
                return `
                            <tr>
                                <td style="text-align: center; color: #64748b;">${index + 1}</td>
                                <td style="text-transform: uppercase; font-weight: 600;">${displayName}</td>
                                <td style="text-align: center; font-weight: bold;">${qty}</td>
                                <td style="text-align: right;">S/ ${price}</td>
                                <td style="text-align: right; font-weight: bold;">S/ ${sub}</td>
                            </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>

                <div class="bottom-section">
                    <div class="bottom-left">
                        <div class="amount-words">
                            SON: ${numeroALetras(total)}
                        </div>
                        <div style="font-size: 10.5px; color: #475569; padding: 6px 0;">
                            <div><strong>Forma de Pago:</strong> ${paymentMethod}</div>
                            <div><strong>Importe Recibido:</strong> S/ ${amountPaid.toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Vuelto:</strong> S/ ${change.toFixed(2)}</div>
                        </div>
                    </div>

                    <div class="bottom-right">
                        <div class="totals-box">
                            <div class="totals-row">
                                <span>Subtotal Gravado:</span>
                                <span>S/ ${subtotalCalc.toFixed(2)}</span>
                            </div>
                            <div class="totals-row">
                                <span>I.G.V. (18%):</span>
                                <span>S/ ${igvCalc.toFixed(2)}</span>
                            </div>
                            <div class="totals-row grand-total">
                                <span>TOTAL A PAGAR:</span>
                                <span>S/ ${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="footer-notes">
                    <div>${companyInfo.ticketFooterText1 || "¡Gracias por su preferencia!"}</div>
                    ${companyInfo.ticketFooterText2 ? `<div>${companyInfo.ticketFooterText2}</div>` : ''}
                </div>
            </body>
            </html>
            `);
        } else {
            // ==========================================
            // FORMATOS TÉRMICOS: 58mm o 80mm
            // ==========================================
            const is58mm = paperSize === "58mm";
            const pageWidth = is58mm ? "54mm" : "76mm";
            const pageSizeCss = is58mm ? "58mm auto" : "80mm auto";
            const fontSize = is58mm ? "9.5px" : "11px";
            const titleSize = is58mm ? "12px" : "14px";
            const padding = is58mm ? "2mm 1mm" : "4mm 2mm";

            doc.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Ticket_${fullReceipt.replace(/[^a-zA-Z0-9]/g, '')}</title>
                <style>
                    @page {
                        size: ${pageSizeCss};
                        margin: 0;
                    }
                    html, body {
                        width: ${pageWidth};
                        margin: 0 auto;
                        padding: ${padding};
                        background: #ffffff;
                        color: #000000;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: ${fontSize};
                        line-height: 1.25;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    * { box-sizing: border-box; }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .left { text-align: left; }
                    .bold { font-weight: bold; }
                    .uppercase { text-transform: uppercase; }
                    .title { font-size: ${titleSize}; font-weight: bold; margin-bottom: 2px; }
                    .subtitle { font-size: ${is58mm ? "8.5px" : "10px"}; margin: 1px 0; color: #333; }
                    .receipt-title { font-size: ${is58mm ? "11px" : "13px"}; font-weight: bold; margin-top: 3px; }
                    .receipt-num { font-size: ${is58mm ? "10.5px" : "12px"}; font-weight: bold; margin-bottom: 3px; }
                    .dashed-line {
                        border-bottom: 1px dashed #444;
                        margin: 4px 0;
                    }
                    .row {
                        display: flex;
                        justify-content: space-between;
                        margin: 2px 0;
                        font-size: ${fontSize};
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: ${fontSize};
                        margin: 3px 0;
                    }
                    th {
                        text-align: left;
                        border-bottom: 1px solid #000;
                        padding-bottom: 2px;
                        font-weight: bold;
                        font-size: ${is58mm ? "8.5px" : "10px"};
                    }
                    td {
                        padding: 2px 0;
                        vertical-align: top;
                    }
                    .footer-text {
                        text-align: center;
                        font-style: italic;
                        margin-top: 6px;
                        font-size: ${is58mm ? "8.5px" : "10px"};
                    }
                </style>
            </head>
            <body>
                ${companyInfo.logoUrl ? `
                <div class="center" style="margin-bottom: 4px;">
                    <img src="${companyInfo.logoUrl}" style="max-height: ${is58mm ? "35px" : "45px"}; max-width: ${is58mm ? "110px" : "140px"}; object-fit: contain;" />
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
                    <span>Atendido:</span>
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
                            <th style="width: ${is58mm ? "46%" : "52%"};">Producto</th>
                            <th style="width: ${is58mm ? "16%" : "14%"}; text-align: center;">Cant</th>
                            <th style="width: ${is58mm ? "18%" : "16%"}; text-align: right;">P.U.</th>
                            <th style="width: ${is58mm ? "20%" : "18%"}; text-align: right;">Subt.</th>
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
                    <span>SUBTOTAL</span>
                    <span class="bold">S/ ${total.toFixed(2)}</span>
                </div>
                <div class="row bold" style="font-size: ${is58mm ? "11px" : "12px"}; margin-top: 2px;">
                    <span>TOTAL</span>
                    <span>S/ ${total.toFixed(2)}</span>
                </div>
                <div style="font-size: ${is58mm ? "8px" : "9px"}; margin-top: 2px; text-transform: uppercase; color: #222;">
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
                    <span>FORMA PAGO</span>
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
        }

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
            {/* Contenedor del Modal Principal - Ancho dinámico según el formato (58mm, 80mm, A4) */}
            <div
                className={`bg-slate-200/90 rounded-2xl shadow-2xl w-full ${paperSize === "A4" ? "max-w-[700px]" : paperSize === "58mm" ? "max-w-[390px]" : "max-w-[460px]"
                    } h-[88vh] max-h-[840px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:w-full print:h-auto print:border-none print:shadow-none print:rounded-none print:p-0 print:bg-white print:max-h-none print:overflow-visible ring-1 ring-black/10`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Fijo Superior con selector de tamaño */}
                <div className="bg-zinc-950 text-white px-4 sm:px-5 py-3 flex items-center justify-between shadow-md flex-shrink-0 print:hidden rounded-t-xl border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-xs sm:text-sm text-white leading-tight">Vista de Comprobante</h3>
                            <span className="text-[11px] text-zinc-400 font-mono">Formato: {paperSize}</span>
                        </div>
                    </div>

                    {/* Selector de Tamaño de Papel Rápido (58mm, 80mm, A4) */}
                    <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
                        {["58mm", "80mm", "A4"].map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => setPaperSize(size)}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all font-mono ${paperSize === size
                                        ? "bg-white text-zinc-950 shadow-sm"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    }`}
                                title={`Cambiar a formato ${size}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                            title="Imprimir comprobante"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 rounded-lg transition-colors"
                            title="Cerrar (Esc)"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Área Scrollable del Comprobante */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex justify-center bg-zinc-200 print:p-0 print:bg-white print:overflow-visible">

                    {paperSize === "A4" ? (
                        /* ========================================================
                           PREVIEW A4: Hoja Bond Formal Tamaño A4
                           ======================================================== */
                        <div className="bg-white w-full max-w-[620px] shadow-lg rounded-lg p-6 sm:p-8 font-sans text-[11px] leading-relaxed text-zinc-900 border border-zinc-300 h-fit print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none">
                            {/* Header A4 */}
                            <div className="flex justify-between items-start mb-5 pb-3 border-b border-zinc-200">
                                <div className="w-[60%]">
                                    {companyInfo.logoUrl && (
                                        <div className="mb-2">
                                            <img
                                                src={companyInfo.logoUrl}
                                                alt="Logo"
                                                className="max-h-12 max-w-[150px] object-contain"
                                            />
                                        </div>
                                    )}
                                    <h2 className="font-bold text-base text-zinc-950 uppercase tracking-wide">
                                        {companyInfo.commercialName || companyInfo.legalName || "VidSalud SAC"}
                                    </h2>
                                    <p className="text-[11px] text-zinc-600 mt-0.5">
                                        <strong>RUC:</strong> {companyInfo.taxId}
                                    </p>
                                    <p className="text-[10.5px] text-zinc-600 leading-snug">
                                        {companyInfo.address}
                                    </p>
                                    {companyInfo.phone && (
                                        <p className="text-[10.5px] text-zinc-600">
                                            Tel: {companyInfo.phone}
                                        </p>
                                    )}
                                </div>

                                <div className="w-[36%] border-2 border-zinc-900 rounded-lg p-3 text-center bg-zinc-50 shadow-sm">
                                    <div className="font-bold text-xs text-zinc-900">R.U.C. N° {companyInfo.taxId}</div>
                                    <div className="font-bold text-sm text-zinc-950 uppercase my-1 tracking-wider">
                                        {receiptType === "FACTURA" ? "FACTURA ELECTRÓNICA" : receiptType === "BOLETA" ? "BOLETA ELECTRÓNICA" : "TICKET ELECTRÓNICO"}
                                    </div>
                                    <div className="font-mono font-bold text-xs text-zinc-900 tracking-widest">{fullReceipt}</div>
                                </div>
                            </div>

                            {/* Client Box A4 */}
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                    <span className="text-slate-500 font-semibold">Cliente:</span>{" "}
                                    <span className="font-bold text-slate-900 uppercase">{client}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold">Fecha Emisión:</span>{" "}
                                    <span className="font-semibold text-slate-900">{dateStr}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold">Atendido por:</span>{" "}
                                    <span className="font-medium text-slate-900">{cashier}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold">Medio de Pago:</span>{" "}
                                    <span className="font-bold text-slate-900 uppercase">{paymentMethod} ({paymentStatus})</span>
                                </div>
                            </div>

                            {/* Tabla Detalles A4 */}
                            <table className="w-full border-collapse mb-4 text-[11px]">
                                <thead>
                                    <tr className="bg-[#005f60] text-white">
                                        <th className="py-1.5 px-2 text-center rounded-l-md" style={{ width: "8%" }}>Item</th>
                                        <th className="py-1.5 px-2 text-left" style={{ width: "52%" }}>Descripción</th>
                                        <th className="py-1.5 px-2 text-center" style={{ width: "12%" }}>Cant</th>
                                        <th className="py-1.5 px-2 text-right" style={{ width: "14%" }}>P. Unit</th>
                                        <th className="py-1.5 px-2 text-right rounded-r-md" style={{ width: "14%" }}>Importe</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {details.map((item, idx) => {
                                        const prodName = item.productName || item.nombre || "Producto";
                                        const presName = item.presentationName || item.presentacion || "";
                                        const displayName = presName ? `${prodName} ${presName}` : prodName;
                                        const qty = item.presentationQuantity || item.cantidad || 1;
                                        const price = Number(item.presentationUnitPrice || item.precioUnitario || item.precio || 0);
                                        const subt = Number(item.subtotal !== undefined && item.subtotal !== null ? item.subtotal : (qty * price));
                                        return (
                                            <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/60" : ""}>
                                                <td className="py-1.5 px-2 text-center text-slate-500">{idx + 1}</td>
                                                <td className="py-1.5 px-2 font-medium uppercase text-slate-900">{displayName}</td>
                                                <td className="py-1.5 px-2 text-center font-bold text-slate-900">{qty}</td>
                                                <td className="py-1.5 px-2 text-right text-slate-700">S/ {price.toFixed(2)}</td>
                                                <td className="py-1.5 px-2 text-right font-bold text-slate-900">S/ {subt.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Resumen Totales A4 */}
                            <div className="flex justify-between items-start gap-4 pt-2 border-t border-slate-200">
                                <div className="w-[58%]">
                                    <div className="bg-slate-100 rounded-lg p-2.5 text-[10px] font-semibold uppercase text-slate-700 mb-2">
                                        SON: {numeroALetras(total)}
                                    </div>
                                    <div className="text-[10.5px] text-slate-600 space-y-0.5">
                                        <div><strong>Monto Recibido:</strong> S/ {amountPaid.toFixed(2)} &nbsp;|&nbsp; <strong>Vuelto:</strong> S/ {change.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="w-[38%] border border-slate-300 rounded-lg overflow-hidden text-[11px]">
                                    <div className="flex justify-between p-2 border-b border-slate-200">
                                        <span className="text-slate-600">Subtotal Gravado:</span>
                                        <span className="font-semibold">S/ {subtotalCalc.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 border-b border-slate-200">
                                        <span className="text-slate-600">IGV (18%):</span>
                                        <span className="font-semibold">S/ {igvCalc.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-2.5 bg-[#005f60] text-white font-black text-sm">
                                        <span>TOTAL:</span>
                                        <span>S/ {total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pie de Ticket A4 */}
                            <div className="text-center text-[10px] text-slate-500 italic pt-5 mt-4 border-t border-dashed border-slate-300">
                                <p className="font-medium">{companyInfo.ticketFooterText1 || "¡Gracias por su compra!"}</p>
                                {companyInfo.ticketFooterText2 && (
                                    <p className="mt-0.5">{companyInfo.ticketFooterText2}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ========================================================
                           PREVIEW TÉRMICO: 58mm o 80mm
                           ======================================================== */
                        <div
                            id="thermal-receipt"
                            className={`bg-white w-full ${paperSize === "58mm" ? "max-w-[290px] text-[10.5px] p-4" : "max-w-[350px] text-[12px] p-6"
                                } shadow-lg rounded-xl font-mono leading-relaxed text-slate-800 border border-slate-200 h-fit print:max-w-none print:w-full print:p-2 print:border-none print:shadow-none print:rounded-none`}
                        >
                            {/* Logotipo Empresa (si existe) */}
                            {companyInfo.logoUrl && (
                                <div className="flex justify-center mb-3">
                                    <img
                                        src={companyInfo.logoUrl}
                                        alt="Logo Empresa"
                                        className={`${paperSize === "58mm" ? "max-h-9 max-w-[110px]" : "max-h-12 max-w-[130px]"} object-contain filter contrast-125`}
                                    />
                                </div>
                            )}

                            {/* Encabezado Empresa */}
                            <div className="text-center space-y-0.5">
                                <h2 className={`font-black ${paperSize === "58mm" ? "text-xs" : "text-sm"} tracking-wide text-slate-900 uppercase`}>
                                    {companyInfo.commercialName || companyInfo.legalName || "VidSalud SAC"}
                                </h2>
                                <p className="text-[10.5px] text-slate-600 font-bold">
                                    RUC: {companyInfo.taxId}
                                </p>
                                <p className="text-[10px] text-slate-600 leading-snug">
                                    {companyInfo.address}
                                </p>
                                {companyInfo.phone && (
                                    <p className="text-[10px] text-slate-600">
                                        Tel: {companyInfo.phone}
                                    </p>
                                )}
                            </div>

                            <div className="border-b border-dashed border-slate-400 my-2.5" />

                            {/* Datos Comprobante */}
                            <div className="text-center my-1">
                                <span className="font-black text-xs tracking-wider block uppercase text-slate-900">
                                    {receiptType}
                                </span>
                                <span className="font-bold text-[11px] tracking-widest block text-slate-800 mt-0.5">
                                    {fullReceipt}
                                </span>
                            </div>

                            <div className="space-y-0.5 text-[10.5px] text-slate-700">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Fecha:</span>
                                    <span className="font-semibold text-slate-900">{dateStr}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Atendido:</span>
                                    <span className="font-medium text-slate-900">{cashier}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cliente:</span>
                                    <span className="font-bold text-slate-900 uppercase">{client}</span>
                                </div>
                            </div>

                            <div className="border-b border-dashed border-slate-400 my-2.5" />

                            {/* Tabla de Productos */}
                            <div>
                                <div className="flex justify-between font-bold text-[10.5px] border-b border-slate-300 pb-1 mb-1.5 text-slate-900">
                                    <span className="w-[48%]">Producto</span>
                                    <span className="w-[14%] text-center">Cant</span>
                                    <span className="w-[18%] text-right">P.U.</span>
                                    <span className="w-[20%] text-right">Subt.</span>
                                </div>

                                <div className="space-y-1 text-[10.5px]">
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

                            <div className="border-b border-dashed border-slate-400 my-2.5" />

                            {/* Totales y Letras */}
                            <div className="space-y-1 text-[10.5px]">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">SUBTOTAL</span>
                                    <span className="font-bold">S/ {total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-black pt-1 border-t border-dotted border-slate-300 text-slate-900">
                                    <span>TOTAL</span>
                                    <span>S/ {total.toFixed(2)}</span>
                                </div>
                                <div className="text-[9px] text-slate-600 font-medium pt-0.5 uppercase leading-tight">
                                    SON: {numeroALetras(total)}
                                </div>
                            </div>

                            <div className="border-b border-dashed border-slate-400 my-2.5" />

                            {/* Datos de Pago */}
                            <div className="space-y-0.5 text-[10.5px] text-slate-700">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">RECIBIDO</span>
                                    <span>S/ {amountPaid.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">CAMBIO</span>
                                    <span className="font-bold">S/ {change.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">FORMA PAGO</span>
                                    <span className="font-bold uppercase">{paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">ESTADO</span>
                                    <span className={`font-bold uppercase ${paymentStatus === "PAGADO"
                                            ? "text-emerald-700"
                                            : paymentStatus === "PARCIAL"
                                                ? "text-amber-700"
                                                : "text-rose-700"
                                        }`}>
                                        {paymentStatus}
                                    </span>
                                </div>
                            </div>

                            <div className="border-b border-dashed border-slate-400 my-2.5" />

                            {/* Textos del Pie del Ticket */}
                            <div className="text-center text-[10px] text-slate-600 italic space-y-0.5 pt-1 leading-snug">
                                <p className="font-medium">{companyInfo.ticketFooterText1 || "¡Gracias por su compra!"}</p>
                                {companyInfo.ticketFooterText2 && (
                                    <p>{companyInfo.ticketFooterText2}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Fijo */}
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
                        <span>Imprimir ({paperSize})</span>
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
