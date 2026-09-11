import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { StockAdjustmentModal } from "../components/StockAdjustmentModal";

export const InventoryAdjustmentRegisterPage = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Link to="/inventory-adjustments" className="hover:text-teal-400 transition-colors">
                    Ajustes de Inventarios
                </Link>
                <span>&gt;</span>
                <span className="text-slate-300">Nuevo Ajuste de Stock</span>
            </div>

            {/* Renderizar Modal abierto por defecto en la página de registro */}
            <StockAdjustmentModal
                isOpen={true}
                onClose={() => navigate("/inventory-adjustments")}
                onAdjustmentSaved={() => navigate("/inventory-adjustments")}
            />
        </div>
    );
};
