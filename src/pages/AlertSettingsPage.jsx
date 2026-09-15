import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getSettings, saveSettings, getAllLots } from "../services/SettingsService.js";

export const AlertSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lots, setLots] = useState([]);

  const [form, setForm] = useState({
    alertExpirationDays: 30,
    alertMinStockPercent: 20,
    alertEnableExpiration: true,
    alertEnableMinStock: true,
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [settingsData, lotsData] = await Promise.all([
          getSettings(),
          getAllLots(),
        ]);

        if (settingsData) {
          setForm({
            alertExpirationDays: settingsData.alertExpirationDays ?? 30,
            alertMinStockPercent: settingsData.alertMinStockPercent ?? 20,
            alertEnableExpiration: settingsData.alertEnableExpiration ?? true,
            alertEnableMinStock: settingsData.alertEnableMinStock ?? true,
          });
        }
        setLots(Array.isArray(lotsData) ? lotsData : []);
      } catch (error) {
        console.error("Error al cargar configuración de alertas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Cálculos en vivo según los valores configurados
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiringCount = lots.filter((lot) => {
    if (!form.alertEnableExpiration || !lot.fechaVencimiento) return false;
    const cleanDateStr = String(lot.fechaVencimiento).replace(" ", "T");
    const expDate = new Date(cleanDateStr);
    if (isNaN(expDate.getTime())) return false;
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= Number(form.alertExpirationDays);
  }).length;

  const lowStockCount = lots.filter((lot) => {
    if (!form.alertEnableMinStock) return false;
    const inicial = Number(lot.cantidadInicial) || 1;
    const actual = Number(lot.cantidadActual) || 0;
    const pct = (actual / inicial) * 100;
    return pct <= Number(form.alertMinStockPercent);
  }).length;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await saveSettings({
        alertExpirationDays: Number(form.alertExpirationDays),
        alertMinStockPercent: Number(form.alertMinStockPercent),
        alertEnableExpiration: Boolean(form.alertEnableExpiration),
        alertEnableMinStock: Boolean(form.alertEnableMinStock),
      });

      await Swal.fire({
        icon: "success",
        title: "Configuración Guardada",
        text: "Los parámetros de alertas de vencimiento y stock crítico se han guardado exitosamente.",
        confirmButtonColor: "#09090b",
        timer: 2000,
      });
    } catch (error) {
      console.error("Error al guardar configuración de alertas:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron guardar las opciones de alertas.",
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
          Cargando configuración de alertas preventivas...
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
        <span className="text-zinc-950 font-bold">Alertas Preventivas</span>
      </div>

      {/* 2. Header de la Página */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-zinc-900 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded uppercase tracking-wider">
                GESTIÓN PREVENTIVA
              </span>
              <span className="bg-zinc-100 text-zinc-800 border border-zinc-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                ALERTAS AUTOMÁTICAS
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Configuración de Alertas del Sistema
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Defina las ventanas temporales para medicamentos por vencer y los umbrales de stock mínimo de lotes.
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

      {/* 3. Tarjetas de Configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarjeta 1: Alerta de Vencimiento */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                  Alerta de Caducidad de Medicamentos
                </h2>
              </div>

              {/* Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="alertEnableExpiration"
                  checked={form.alertEnableExpiration}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <p className="text-xs text-zinc-500 font-mono leading-relaxed">
              Monitorea los lotes que caducarán en los próximos días seleccionados. Permite coordinar venta preferente (primeras entradas, primeras salidas) o coordinar la devolución al laboratorio.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Días de Anticipación para el Aviso
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="180"
                  name="alertExpirationDays"
                  value={form.alertExpirationDays}
                  onChange={handleChange}
                  disabled={!form.alertEnableExpiration}
                  className="w-32 h-10 px-3.5 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all disabled:opacity-50"
                />
                <span className="text-xs font-mono text-zinc-500">
                  días (1 mes = 30 días)
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400">
                Valor sugerido: 30 a 60 días de ventana preventiva.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-700 uppercase">
              Lotes por vencer detectados:
            </span>
            <span
              className={`font-mono text-xs font-bold px-3 py-1 rounded-lg ${
                expiringCount > 0
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {expiringCount} {expiringCount === 1 ? "LOTE EN RIESGO" : "LOTES EN RIESGO"}
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Alerta de Stock Mínimo Crítico */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full"></div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
                  Alerta de Stock Crítico de Lote
                </h2>
              </div>

              {/* Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="alertEnableMinStock"
                  checked={form.alertEnableMinStock}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
              </label>
            </div>

            <p className="text-xs text-zinc-500 font-mono leading-relaxed">
              Advierte cuando la cantidad actual en almacén de un lote específico cae por debajo del porcentaje configurado con respecto a su ingreso original.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Porcentaje de Stock Mínimo
              </label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    name="alertMinStockPercent"
                    value={form.alertMinStockPercent}
                    onChange={handleChange}
                    disabled={!form.alertEnableMinStock}
                    className="w-32 h-10 pl-3.5 pr-8 bg-zinc-50/60 border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all disabled:opacity-50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-400">
                    %
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  de la cantidad inicial del lote
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400">
                Fórmula de disparo: [ Stock Actual ≤ Stock Inicial × {form.alertMinStockPercent}% ]
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-700 uppercase">
              Lotes con stock bajo detectados:
            </span>
            <span
              className={`font-mono text-xs font-bold px-3 py-1 rounded-lg ${
                lowStockCount > 0
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {lowStockCount} {lowStockCount === 1 ? "LOTE CRÍTICO" : "LOTES CRÍTICOS"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertSettingsPage;
