import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getSettings, saveSettings } from "../services/SettingsService.js";

export const TicketSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    ticketPaperSize: "80mm",
    ticketFooterText1: "¡Gracias por su compra!",
    ticketFooterText2: "",
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const settingsData = await getSettings();
        if (settingsData) {
          setForm({
            ticketPaperSize: settingsData.ticketPaperSize || "80mm",
            ticketFooterText1: settingsData.ticketFooterText1 || "¡Gracias por su compra!",
            ticketFooterText2: settingsData.ticketFooterText2 || "",
          });
        }
      } catch (error) {
        console.error("Error al cargar configuración de ticket:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectPaperSize = (size) => {
    setForm((prev) => ({
      ...prev,
      ticketPaperSize: size,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await saveSettings({
        ticketPaperSize: form.ticketPaperSize,
        ticketFooterText1: form.ticketFooterText1,
        ticketFooterText2: form.ticketFooterText2,
      });

      await Swal.fire({
        icon: "success",
        title: "Configuración Guardada",
        text: `El formato de impresión predeterminado se ha establecido en ${form.ticketPaperSize}.`,
        confirmButtonColor: "#09090b",
        timer: 2000,
      });
    } catch (error) {
      console.error("Error al guardar configuración de ticket:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar la configuración del ticket.",
        confirmButtonColor: "#09090b",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-7 w-7 text-zinc-900" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
          Cargando configuración de impresión...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
        <span
          className="hover:text-zinc-900 cursor-pointer transition-colors"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </span>
        <span>/</span>
        <span className="hover:text-zinc-900 cursor-pointer transition-colors">
          Configuración
        </span>
        <span>/</span>
        <span className="text-zinc-950 font-bold">Impresión & Tickets</span>
      </div>

      {/* 2. Header de la Página */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-zinc-900 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                COMPROBANTES
              </span>
              <span className="bg-zinc-100 text-zinc-800 border border-zinc-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                FORMATO ACTIVO: {form.ticketPaperSize}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Configuración de Ticket e Impresión
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Defina el formato físico de impresión (58mm, 80mm o A4) y los mensajes finales de sus comprobantes de venta.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-mono font-bold text-xs shadow transition-all cursor-pointer tracking-wider uppercase disabled:opacity-50 self-start sm:self-auto"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Guardar Configuración</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Selección de Formato de Papel */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100">
            <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
              Tamaño de Papel y Tipo de Impresora
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-2">
            Seleccione el formato compatible con su impresora física. La opción elegida regirá para la emisión en el Punto de Venta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Opción 1: 58mm */}
          <div
            onClick={() => handleSelectPaperSize("58mm")}
            className={`relative p-6 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center justify-between ${
              form.ticketPaperSize === "58mm"
                ? "border-zinc-950 bg-zinc-50/80 ring-2 ring-zinc-950 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50/50"
            }`}
          >
            {form.ticketPaperSize === "58mm" && (
              <span className="absolute top-3 right-3 bg-zinc-950 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                SELECCIONADO
              </span>
            )}

            <div className="h-24 flex items-center justify-center my-2">
              <div className="w-12 h-18 bg-white border-2 border-zinc-700 rounded p-1.5 flex flex-col gap-1 shadow-xs">
                <div className="h-1 bg-zinc-800 rounded-full w-full"></div>
                <div className="h-1 bg-zinc-400 rounded-full w-3/4"></div>
                <div className="h-1 bg-zinc-400 rounded-full w-full"></div>
                <div className="h-1 bg-zinc-300 rounded-full w-1/2"></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900 font-mono">58 mm</h3>
              <span className="text-[11px] font-mono font-bold text-zinc-600 block uppercase mt-0.5">
                Mini Ticket Térmico
              </span>
              <p className="text-xs text-zinc-500 mt-2 font-mono leading-relaxed">
                Rollos de 2 pulgadas, impresoras térmicas portátiles o terminales inalámbricos de mano.
              </p>
            </div>
          </div>

          {/* Opción 2: 80mm */}
          <div
            onClick={() => handleSelectPaperSize("80mm")}
            className={`relative p-6 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center justify-between ${
              form.ticketPaperSize === "80mm"
                ? "border-zinc-950 bg-zinc-50/80 ring-2 ring-zinc-950 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50/50"
            }`}
          >
            {form.ticketPaperSize === "80mm" && (
              <span className="absolute top-3 right-3 bg-zinc-950 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                SELECCIONADO
              </span>
            )}

            <div className="h-24 flex items-center justify-center my-2">
              <div className="w-16 h-20 bg-white border-2 border-zinc-700 rounded p-1.5 flex flex-col gap-1.5 shadow-xs">
                <div className="h-1 bg-zinc-800 rounded-full w-full"></div>
                <div className="h-1 bg-zinc-400 rounded-full w-4/5"></div>
                <div className="h-1 bg-zinc-400 rounded-full w-full"></div>
                <div className="h-1 bg-zinc-300 rounded-full w-2/3"></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900 font-mono">80 mm</h3>
              <span className="text-[11px] font-mono font-bold text-zinc-900 block uppercase mt-0.5">
                Ticket Estándar POS
              </span>
              <p className="text-xs text-zinc-500 mt-2 font-mono leading-relaxed">
                Estándar global en farmacias. Compatible con impresoras térmicas de caja Epson, Bixolon, etc.
              </p>
            </div>
          </div>

          {/* Opción 3: A4 */}
          <div
            onClick={() => handleSelectPaperSize("A4")}
            className={`relative p-6 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center justify-between ${
              form.ticketPaperSize === "A4"
                ? "border-zinc-950 bg-zinc-50/80 ring-2 ring-zinc-950 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50/50"
            }`}
          >
            {form.ticketPaperSize === "A4" && (
              <span className="absolute top-3 right-3 bg-zinc-950 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                SELECCIONADO
              </span>
            )}

            <div className="h-24 flex items-center justify-center my-2">
              <div className="w-18 h-22 bg-white border-2 border-zinc-700 rounded p-2 flex flex-col gap-1.5 shadow-xs">
                <div className="h-1 bg-zinc-800 rounded-full w-full"></div>
                <div className="h-1 bg-zinc-400 rounded-full w-full"></div>
                <div className="h-1 bg-zinc-400 rounded-full w-5/6"></div>
                <div className="h-1 bg-zinc-300 rounded-full w-1/2"></div>
                <div className="h-1 bg-zinc-300 rounded-full w-full"></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900 font-mono">A4</h3>
              <span className="text-[11px] font-mono font-bold text-zinc-600 block uppercase mt-0.5">
                Hoja Completa Formal
              </span>
              <p className="text-xs text-zinc-500 mt-2 font-mono leading-relaxed">
                Formato corporativo formal para facturas institucionales o impresoras convencionales láser.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Mensajes del Pie de Ticket */}
        <div className="pt-6 border-t border-zinc-100 space-y-4">
          <div className="flex items-center gap-2.5 pb-2">
            <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
              Mensajes al Pie del Comprobante
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Línea 1 (Saludo o Agradecimiento)
              </label>
              <input
                type="text"
                name="ticketFooterText1"
                value={form.ticketFooterText1}
                onChange={handleChange}
                placeholder="Ej. ¡Gracias por su compra y preferencia!"
                className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Línea 2 (Políticas de Devolución o Aviso Legal)
              </label>
              <input
                type="text"
                name="ticketFooterText2"
                value={form.ticketFooterText2}
                onChange={handleChange}
                placeholder="Ej. No se aceptan cambios ni devoluciones de medicamentos."
                className="w-full h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSettingsPage;
