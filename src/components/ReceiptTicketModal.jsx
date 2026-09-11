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
    });

    useEffect(() => {
        // Cargar datos de la empresa desde la base de datos si existen
        productsApi.get("/company")
            .then((res) => {
                if (res.data && res.data.taxId) {
                    setCompanyInfo((prev) => ({
                        ...prev,
                        legalName: res.data.legalName || prev.legalName,
                        commercialName: res.data.commercialName || prev.commercialName,
                        taxId: res.data.taxId || prev.taxId,
                        address: res.data.address || prev.address,
                        phone: res.data.phone || prev.phone,
                    }));
                }
            })
            .catch(() => {
                // Fallback a los datos por defecto de la imagen de referencia
            });
    }, []);

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
    const amountPaid = Number(saleData.amountPaid || saleData.montoPagado || total);
    const change = Math.max(0, amountPaid - total);
    const paymentMethod = saleData.paymentMethodName || saleData.medioPago || "EFECTIVO";
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
            <div class="center">
                <div class="title">${companyInfo.commercialName || companyInfo.legalName || "VidSalud SAC"}</div>
                <div class="subtitle">RUC: ${companyInfo.taxId}</div>
                <div class="subtitle">${companyInfo.address}</div>
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
                ¡Gracias por su compra!
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:overflow-visible">
            {/* Contenedor del Comprobante */}
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col my-8 print:my-0 print:border-none print:shadow-none print:max-w-none print:w-[80mm] print:mx-auto">
                
                {/* Barra de Acciones Superior (oculta al imprimir) */}
                <div className="bg-[#005f60] text-white px-5 py-3.5 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span className="font-bold text-sm tracking-wide">Vista de Comprobante</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="bg-white text-[#005f60] hover:bg-teal-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Imprimir</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-white hover:text-rose-200 p-1 rounded-lg transition-colors"
                            title="Cerrar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* CUERPO DEL TICKET TÉRMICO (Calco fiel de la Imagen 5) */}
                <div id="thermal-receipt" className="p-6 font-mono text-[12px] text-slate-800 bg-white print:p-2 print:text-[11px] leading-tight">
                    
                    {/* Encabezado Empresa */}
                    <div className="text-center mb-3">
                        <h2 className="font-bold text-base tracking-wide text-slate-900 mb-0.5">
                            {companyInfo.commercialName || companyInfo.legalName || "VidSalud SAC"}
                        </h2>
                        <p className="text-[11px] text-slate-600">
                            RUC: {companyInfo.taxId}
                        </p>
                        <p className="text-[11px] text-slate-600">
                            {companyInfo.address}
                        </p>
                    </div>

                    <div className="border-b border-dashed border-slate-400 my-2.5" />

                    {/* Datos Comprobante y Transacción */}
                    <div className="text-center mb-2">
                        <span className="font-black text-sm tracking-wider block">
                            {receiptType}
                        </span>
                        <span className="font-bold text-xs tracking-wider block mt-0.5">
                            {fullReceipt}
                        </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-700">
                        <div className="flex justify-between">
                            <span>Fecha:</span>
                            <span className="font-medium">{dateStr}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Atendido por:</span>
                            <span className="font-medium">{cashier}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Cliente:</span>
                            <span className="font-medium">{client}</span>
                        </div>
                    </div>

                    <div className="border-b border-dashed border-slate-400 my-2.5" />

                    {/* Tabla de Productos */}
                    <div className="mb-2">
                        <div className="flex justify-between font-bold text-[11px] border-b border-slate-300 pb-1 mb-1.5">
                            <span className="w-[50%]">Producto</span>
                            <span className="w-[15%] text-center">Cant</span>
                            <span className="w-[17%] text-right">P.U.</span>
                            <span className="w-[18%] text-right">Subt.</span>
                        </div>

                        <div className="space-y-1.5">
                            {details.map((item, idx) => {
                                const prodName = item.productName || item.nombre || "Producto";
                                const presName = item.presentationName || item.presentacion || "";
                                const displayName = presName ? `${prodName} ${presName}` : prodName;
                                const qty = item.presentationQuantity || item.cantidad || 1;
                                const price = Number(item.presentationUnitPrice || item.precioUnitario || item.precio || 0);
                                const subt = Number(item.subtotal || (qty * price));

                                return (
                                    <div key={idx} className="flex items-start text-[11px]">
                                        <span className="w-[50%] pr-1 leading-snug font-medium uppercase">
                                            {displayName}
                                        </span>
                                        <span className="w-[15%] text-center font-bold">
                                            {qty}
                                        </span>
                                        <span className="w-[17%] text-right">
                                            {price.toFixed(2)}
                                        </span>
                                        <span className="w-[18%] text-right font-bold">
                                            {subt.toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="border-b border-dashed border-slate-400 my-2.5" />

                    {/* Totales y Letras */}
                    <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                            <span>SUBTOTAL VENTAS</span>
                            <span className="font-bold">S/ {total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-black pt-0.5">
                            <span>TOTAL</span>
                            <span>S/ {total.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium pt-1 uppercase">
                            SON: {numeroALetras(total)}
                        </div>
                    </div>

                    <div className="border-b border-dashed border-slate-400 my-2.5" />

                    {/* Datos de Pago */}
                    <div className="space-y-1 text-[11px] text-slate-700">
                        <div className="flex justify-between">
                            <span>RECIBIDO</span>
                            <span>S/ {amountPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>CAMBIO</span>
                            <span>S/ {change.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>FORMA DE PAGO</span>
                            <span className="font-bold uppercase">{paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>ESTADO</span>
                            <span className="font-bold uppercase text-emerald-700">{paymentStatus}</span>
                        </div>
                    </div>

                    <div className="border-b border-dashed border-slate-400 my-3" />

                    {/* Despedida */}
                    <div className="text-center text-[11px] text-slate-600 italic">
                        ¡Gracias por su compra!
                    </div>
                </div>

                {/* Footer Modal (oculto al imprimir) */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 print:hidden">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-5 py-2 text-xs font-bold text-white bg-[#005f60] hover:bg-[#004e4f] rounded-xl shadow-sm transition-all flex items-center gap-1.5"
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
