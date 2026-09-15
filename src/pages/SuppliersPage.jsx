import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { findAllSuppliers, removeSupplier } from "../services/SupplierService";

export const SuppliersPage = () => {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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
            confirmButtonColor: "#09090b",
            cancelButtonColor: "#71717a",
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

    const filteredSuppliers = useMemo(() => {
        const query = searchTerm.toLowerCase();
        return suppliers.filter((s) => {
            const name = (s.nombre || "").toLowerCase();
            const contact = (s.contacto || "").toLowerCase();
            const email = (s.email || "").toLowerCase();
            const phone = (s.telefono || "").toLowerCase();
            return name.includes(query) || contact.includes(query) || email.includes(query) || phone.includes(query);
        });
    }, [suppliers, searchTerm]);

    const totalPages = Math.ceil(filteredSuppliers.length / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedSuppliers = filteredSuppliers.slice(startIndex, startIndex + pageSize);

    const startRecord = filteredSuppliers.length === 0 ? 0 : startIndex + 1;
    const endRecord = Math.min(startIndex + pageSize, filteredSuppliers.length);

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-5 pb-10">
            {/* Header Corporativo Monocromático */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/dashboard")}>Dashboard</span>
                        <span>/</span>
                        <span className="hover:text-zinc-900 cursor-pointer" onClick={() => navigate("/purchases/register")}>Compras</span>
                        <span>/</span>
                        <span className="text-zinc-950 font-bold">Proveedores</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v5m4-5v5m4-5v5M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
                                Proveedores & Distribuidoras
                            </h1>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Red de droguerías, laboratorios distribuidores y proveedores de mercadería.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <Link
                        to="/suppliers/register"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Registrar Proveedor</span>
                    </Link>
                </div>
            </div>

            {/* Barra de Búsqueda y Contador */}
            <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" strokeWidth="2" />
                            <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Buscar por empresa, contacto, teléfono o correo..."
                        className="w-full h-10 pl-10 pr-4 bg-zinc-50/60 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-400 hover:text-zinc-900 font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg">
                        {filteredSuppliers.length} {filteredSuppliers.length === 1 ? "PROVEEDOR" : "PROVEEDORES"}
                    </span>
                </div>
            </div>

            {/* Tabla de Proveedores */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20 text-zinc-700 text-xs font-semibold gap-3">
                        <svg className="animate-spin h-5 w-5 text-zinc-900" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Cargando red de proveedores...</span>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="max-w-sm mx-auto flex flex-col items-center">
                            <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path strokeLinecap="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                            </svg>
                            <span className="font-bold text-zinc-900 text-sm">No se encontraron proveedores</span>
                            <p className="text-xs text-zinc-400 mt-0.5 mb-3">
                                {searchTerm ? "No hay resultados para los términos ingresados." : "Aún no tienes proveedores registrados."}
                            </p>
                            {!searchTerm && (
                                <Link
                                    to="/suppliers/register"
                                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    + Registrar primer proveedor
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-zinc-100/80 border-b border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                    <th className="py-3 px-4" style={{ width: "28%" }}>DISTRIBUIDORA</th>
                                    <th className="py-3 px-4" style={{ width: "20%" }}>PERSONA DE CONTACTO</th>
                                    <th className="py-3 px-4" style={{ width: "22%" }}>DATOS DE ENLACE</th>
                                    <th className="py-3 px-4" style={{ width: "15%" }}>DIRECCIÓN</th>
                                    <th className="py-3 px-4 text-center" style={{ width: "8%" }}>ESTADO</th>
                                    <th className="py-3 px-4 text-right" style={{ width: "7%" }}>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/70 bg-white">
                                {paginatedSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-zinc-50/70 transition-colors">
                                        {/* Distribuidora */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-900 font-mono font-black text-xs flex items-center justify-center flex-shrink-0">
                                                    {(supplier.nombre || "P").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-zinc-950 uppercase text-xs block">
                                                        {supplier.nombre}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-zinc-400">
                                                        ID: #{supplier.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contacto */}
                                        <td className="py-3.5 px-4 text-zinc-700 font-medium">
                                            {supplier.contacto || (
                                                <span className="text-zinc-400 italic">Sin asignar</span>
                                            )}
                                        </td>

                                        {/* Datos de enlace */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col gap-0.5 text-xs">
                                                {supplier.telefono && (
                                                    <span className="font-mono font-medium text-zinc-800">
                                                        Tel: {supplier.telefono}
                                                    </span>
                                                )}
                                                {supplier.email && (
                                                    <span className="font-mono text-[11px] text-zinc-500">
                                                        {supplier.email}
                                                    </span>
                                                )}
                                                {!supplier.telefono && !supplier.email && (
                                                    <span className="text-zinc-400 italic">Sin enlaces</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Dirección */}
                                        <td className="py-3.5 px-4 text-zinc-600 max-w-xs truncate">
                                            {supplier.direccion || <span className="text-zinc-400 italic">No especificada</span>}
                                        </td>

                                        {/* Estado */}
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                                                supplier.isActive !== false
                                                    ? "bg-zinc-100 text-zinc-900 border border-zinc-300"
                                                    : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                                            }`}>
                                                {supplier.isActive !== false ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>

                                        {/* Acciones */}
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
                                                    className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 border border-zinc-200 rounded transition-colors"
                                                    title="Editar proveedor"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(supplier)}
                                                    className="p-1.5 text-zinc-400 hover:text-red-700 hover:bg-zinc-100 rounded transition-colors"
                                                    title="Eliminar proveedor"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer de Paginación */}
                {!isLoading && filteredSuppliers.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-zinc-200 bg-zinc-50/50 text-xs text-zinc-600">
                        <div>
                            Mostrando <span className="font-bold text-zinc-900">{startRecord}</span> a{" "}
                            <span className="font-bold text-zinc-900">{endRecord}</span> de{" "}
                            <span className="font-bold text-zinc-900">{filteredSuppliers.length}</span> registros
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    className="px-2.5 py-1 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors"
                                >
                                    Anterior
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-7 h-7 rounded-md text-xs font-bold transition-all ${
                                            currentPage === page
                                                ? "bg-zinc-900 text-white"
                                                : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    className="px-2.5 py-1 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-zinc-700 transition-colors"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuppliersPage;
