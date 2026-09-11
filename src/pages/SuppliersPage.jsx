import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { findAllSuppliers, removeSupplier } from "../services/SupplierService";

export const SuppliersPage = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const loadSuppliers = async () => {
        try {
            setIsLoading(true);
            const response = await findAllSuppliers();
            setSuppliers(response.data || []);
        } catch (error) {
            console.error("Error al cargar proveedores:", error);
            Swal.fire("Error", "No se pudo obtener la lista de proveedores", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const handleDelete = async (supplier) => {
        const result = await Swal.fire({
            title: "¿Eliminar proveedor?",
            text: `¿Estás seguro de eliminar a "${supplier.nombre}"? Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await removeSupplier(supplier.id);
                setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
                Swal.fire({
                    title: "¡Eliminado!",
                    text: "Proveedor eliminado con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error("Error al eliminar proveedor:", error);
                Swal.fire("Error", "No se pudo eliminar el proveedor.", "error");
            }
        }
    };

    const filteredSuppliers = suppliers.filter((s) => {
        const query = searchTerm.toLowerCase();
        const name = (s.nombre || "").toLowerCase();
        const contact = (s.contacto || "").toLowerCase();
        const email = (s.email || "").toLowerCase();
        const phone = (s.telefono || "").toLowerCase();
        return name.includes(query) || contact.includes(query) || email.includes(query) || phone.includes(query);
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
            {/* Cabecera Superior */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                    {/* Badge con ícono de camión de distribución */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shadow-sm flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 3.75v10.5" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Proveedores & Distribución
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Gestión integral de tu cadena de suministros y laboratorios
                        </p>
                    </div>
                </div>

                {/* Botón Añadir Proveedor */}
                <Link
                    to="/suppliers/register"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-semibold text-sm shadow-sm transition-all self-start sm:self-auto hover:-translate-y-0.5"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Añadir Proveedor</span>
                </Link>
            </div>

            {/* Barra de Búsqueda y Contador */}
            <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por empresa o contacto..."
                        className="w-full h-11 pl-10 pr-4 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                    />
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-100/80 text-teal-800 text-xs font-bold uppercase tracking-wider self-start sm:self-auto">
                    <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    <span>{filteredSuppliers.length} SOCIOS LOGÍSTICOS</span>
                </div>
            </div>

            {/* Contenedor de la Tabla */}
            <div className="bg-white rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-teal-700 text-sm font-medium gap-3">
                        <svg className="animate-spin h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Cargando cadena de proveedores...</span>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    /* Estado Vacío elegante */
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3.5 border border-teal-100/60 shadow-sm">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 00-1.125-1.125H3.375A1.125 1.125 0 002.25 3.75v10.5" />
                            </svg>
                        </div>
                        <p className="italic text-slate-700 text-base font-semibold">
                            Sin proveedores vinculados
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            {searchTerm 
                                ? "No hay proveedores que coincidan con los criterios de búsqueda." 
                                : "Aún no tienes proveedores registrados en el sistema. Comienza creando el primero."}
                        </p>
                        {!searchTerm && (
                            <Link
                                to="/suppliers/register"
                                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-teal-700 hover:text-teal-800"
                            >
                                + Añadir primer proveedor
                            </Link>
                        )}
                    </div>
                ) : (
                    /* Tabla en tema claro */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                                <tr>
                                    <th className="py-4 px-6">DISTRIBUIDORA</th>
                                    <th className="py-4 px-6">PERSONA DE CONTACTO</th>
                                    <th className="py-4 px-6">DATOS DE ENLACE</th>
                                    <th className="py-4 px-6">UBICACIÓN PRINCIPAL</th>
                                    <th className="py-4 px-6">ESTADO</th>
                                    <th className="py-4 px-6 text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-slate-50/60 transition-colors">
                                        {/* Distribuidora */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-100/60 flex-shrink-0">
                                                    {(supplier.nombre || "P").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-slate-900 block">
                                                        {supplier.nombre}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono">
                                                        ID: #{supplier.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Persona de contacto */}
                                        <td className="py-4 px-6 text-slate-700 font-medium">
                                            {supplier.contacto || (
                                                <span className="italic text-slate-400 font-normal">Sin asignar</span>
                                            )}
                                        </td>

                                        {/* Datos de enlace */}
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1 text-xs">
                                                {supplier.telefono && (
                                                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                        <svg className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                                        </svg>
                                                        {supplier.telefono}
                                                    </span>
                                                )}
                                                {supplier.email && (
                                                    <span className="flex items-center gap-1.5 text-slate-500">
                                                        <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                        </svg>
                                                        {supplier.email}
                                                    </span>
                                                )}
                                                {!supplier.telefono && !supplier.email && (
                                                    <span className="italic text-slate-400">Sin enlaces</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Ubicación Principal */}
                                        <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                                            {supplier.direccion ? (
                                                <div className="flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                                    </svg>
                                                    <span className="truncate">{supplier.direccion}</span>
                                                </div>
                                            ) : (
                                                <span className="italic text-slate-400">No especificada</span>
                                            )}
                                        </td>

                                        {/* Estado */}
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                supplier.isActive !== false
                                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}>
                                                {supplier.isActive !== false ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>

                                        {/* Acciones */}
                                        <td className="py-4 px-6 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors mr-1.5"
                                                title="Editar Proveedor"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(supplier)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Eliminar Proveedor"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
