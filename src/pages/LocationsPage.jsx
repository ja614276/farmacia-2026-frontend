import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { findAllLocations, removeLocation } from "../services/LocationService";

export const LocationsPage = () => {
    const navigate = useNavigate();
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const loadLocations = async () => {
        try {
            setIsLoading(true);
            const response = await findAllLocations();
            setLocations(response.data || []);
        } catch (error) {
            console.error("Error al cargar ubicaciones:", error);
            Swal.fire("Error", "No se pudo obtener la lista de ubicaciones", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLocations();
    }, []);

    const handleDelete = async (location) => {
        const result = await Swal.fire({
            title: "¿Eliminar ubicación?",
            text: `¿Seguro que deseas eliminar el área "${location.nombre}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await removeLocation(location.id);
                setLocations((prev) => prev.filter((item) => item.id !== location.id));
                Swal.fire({
                    title: "¡Eliminada!",
                    text: "Ubicación de almacenamiento eliminada con éxito.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error("Error al eliminar ubicación:", error);
                Swal.fire("Error", "No se pudo eliminar la ubicación.", "error");
            }
        }
    };

    const filteredLocations = locations.filter((loc) => {
        const query = searchTerm.toLowerCase();
        const name = (loc.nombre || "").toLowerCase();
        const desc = (loc.descripcion || "").toLowerCase();
        const aisle = (loc.pasillo || "").toLowerCase();
        const shelf = (loc.estante || "").toLowerCase();
        const level = (loc.nivel || "").toLowerCase();
        return name.includes(query) || desc.includes(query) || aisle.includes(query) || shelf.includes(query) || level.includes(query);
    });

    const totalPages = Math.ceil(filteredLocations.length / pageSize) || 1;
    const paginatedLocations = filteredLocations.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Formateador de organización interna (pasillo, estante, nivel)
    const renderOrganization = (loc) => {
        const parts = [];
        if (loc.pasillo) parts.push(`Pasillo: ${loc.pasillo}`);
        if (loc.estante) parts.push(`Estante: ${loc.estante}`);
        if (loc.nivel) parts.push(`Nivel: ${loc.nivel}`);

        if (parts.length === 0) {
            return (
                <span className="italic text-slate-400 font-normal">
                    Sin organización específica
                </span>
            );
        }

        return (
            <span className="text-slate-600 font-medium">
                {parts.join(" • ")}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
            {/* Cabecera Superior */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                    {/* Badge con ícono de mapa / ubicación */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-sm flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Ubicaciones & Depósitos
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Gestión de áreas, pasillos y estanterías de inventario
                        </p>
                    </div>
                </div>

                {/* Botón Nueva Ubicación */}
                <Link
                    to="/locations/register"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-semibold text-sm shadow-sm transition-all self-start sm:self-auto hover:-translate-y-0.5"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Nueva Ubicación</span>
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
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Buscar por área o descripción..."
                        className="w-full h-11 pl-10 pr-4 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                    />
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-600 text-xs font-bold uppercase tracking-wider self-start sm:self-auto">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <span>{filteredLocations.length} ÁREAS DE ALMACENAJE</span>
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
                        <span>Cargando áreas de inventario...</span>
                    </div>
                ) : filteredLocations.length === 0 ? (
                    /* Estado Vacío */
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3.5 border border-teal-100 shadow-sm">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                        </div>
                        <p className="italic text-slate-700 text-base font-semibold">
                            Sin ubicaciones registradas
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            {searchTerm 
                                ? "No se encontraron áreas que coincidan con los criterios de búsqueda." 
                                : "Comienza registrando estantes, vitrinas o depósitos para organizar tus productos."}
                        </p>
                        {!searchTerm && (
                            <Link
                                to="/locations/register"
                                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-teal-700 hover:text-teal-800"
                            >
                                + Registrar primera ubicación
                            </Link>
                        )}
                    </div>
                ) : (
                    /* Tabla de Ubicaciones */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                                <tr>
                                    <th className="py-4 px-6">UBICACIÓN / ÁREA PRINCIPAL</th>
                                    <th className="py-4 px-6">ORGANIZACIÓN INTERNA</th>
                                    <th className="py-4 px-6">NOTAS DE ALMACENAMIENTO</th>
                                    <th className="py-4 px-6 text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedLocations.map((loc) => (
                                    <tr key={loc.id} className="hover:bg-slate-50/60 transition-colors">
                                        {/* Ubicación / Área Principal */}
                                        <td className="py-4 px-6">
                                            <div>
                                                <span className="font-bold text-slate-900 text-base block">
                                                    {loc.nombre}
                                                </span>
                                                <span className={`text-[11px] font-semibold uppercase tracking-wider block mt-0.5 ${
                                                    loc.isActive !== false ? "text-teal-600" : "text-slate-400"
                                                }`}>
                                                    • {loc.isActive !== false ? "ZONA ACTIVA" : "ZONA INACTIVA"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Organización Interna */}
                                        <td className="py-4 px-6">
                                            {renderOrganization(loc)}
                                        </td>

                                        {/* Notas de Almacenamiento */}
                                        <td className="py-4 px-6 text-slate-500 max-w-sm">
                                            <div className="flex items-start gap-1.5 text-xs">
                                                <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                </svg>
                                                {loc.descripcion ? (
                                                    <span>{loc.descripcion}</span>
                                                ) : (
                                                    <span className="italic text-slate-400">
                                                        Sin detalles adicionales para esta área de almacenamiento.
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="py-4 px-6 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/locations/edit/${loc.id}`)}
                                                className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors mr-1.5"
                                                title="Editar Ubicación"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(loc)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Eliminar Ubicación"
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

                {/* Footer de Paginación */}
                {!isLoading && filteredLocations.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <span>Mostrar:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-teal-600"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span>por página</span>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                                            currentPage === page
                                                ? "bg-teal-800 text-white shadow-sm"
                                                : "text-slate-600 hover:bg-slate-100"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
