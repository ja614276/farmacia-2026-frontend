import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import productsApi from "../apis/productsApi";
import { save, update, findById } from "../services/ProductService";
import { findAllCategories } from "../services/CategoryService";
import { findAllLaboratories } from "../services/LaboratoryService";
import { findAllSuppliers } from "../services/SupplierService";
import { findAllLocations } from "../services/LocationService";

const initialFormState = {
  idProducto: null,
  nombre: "",
  principioActivo: "",
  concentracion: "",
  formaFarmaceutica: "",
  patologia: "",
  requiereReceta: false,
  codigoBarras: "",
  registroSanitario: "",
  codDigemid: "",
  stockReal: 0,
  precioVenta: "",
  laboratorioNombre: "",
  idCategoria: "",
  idLaboratorio: "",
  idProveedor: "",
  idUbicacion: "",
  imagen: "",
};

const defaultPresentation = {
  idPresentacion: null,
  nombrePresentacion: "Unidad",
  cantidadUnidades: 1,
  precioVenta: "",
  activo: true,
  isActive: true,
};

const COMMON_FORMS = [
  "Tableta",
  "Cápsula",
  "Jarabe",
  "Inyectable",
  "Suspensión",
  "Crema / Pomada",
  "Gotas",
  "Solución",
  "Gel",
  "Óvulo",
];

export const ProductForm = ({ productSelected = null }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  // Estados del formulario y catálogos
  const [productForm, setProductForm] = useState(initialFormState);
  const [presentaciones, setPresentaciones] = useState([
    { ...defaultPresentation },
  ]);

  // Listas desplegables
  const [categoryList, setCategoryList] = useState([]);
  const [laboratoryList, setLaboratoryList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [locationList, setLocationList] = useState([]);

  // Estados de control y carga
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejo de imagen
  const [fileObject, setFileObject] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const isEditMode = Boolean(id || productForm.idProducto);

  // 1. Cargar catálogos (Categorías, Laboratorios, Proveedores, Ubicaciones)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCatalogs(true);

    Promise.allSettled([
      findAllCategories(),
      findAllLaboratories(),
      findAllSuppliers(),
      findAllLocations(),
    ])
      .then(([catRes, labRes, supRes, locRes]) => {
        if (!isMounted) return;

        if (catRes.status === "fulfilled" && catRes.value?.data) {
          setCategoryList(catRes.value.data);
        }
        if (labRes.status === "fulfilled" && labRes.value?.data) {
          setLaboratoryList(labRes.value.data);
        }
        if (supRes.status === "fulfilled" && supRes.value?.data) {
          setSupplierList(supRes.value.data);
        }
        if (locRes.status === "fulfilled" && locRes.value?.data) {
          setLocationList(locRes.value.data);
        }
      })
      .catch((err) => {
        console.error("Error al cargar catálogos:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCatalogs(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Función para poblar el estado del formulario
  const populateFormData = (data) => {
    const basePrice =
      data.precioVenta !== undefined && data.precioVenta !== null
        ? String(data.precioVenta)
        : data.presentaciones && data.presentaciones.length > 0
          ? String(data.presentaciones[0].precioVenta || "")
          : "";

    setProductForm({
      idProducto: data.idProducto || data.id || null,
      nombre: data.nombre || data.name || "",
      principioActivo: data.principioActivo || "",
      concentracion: data.concentracion || "",
      formaFarmaceutica: data.formaFarmaceutica || "",
      patologia: data.patologia || "",
      requiereReceta: Boolean(data.requiereReceta),
      codigoBarras: data.codigoBarras || data.codigo || "",
      registroSanitario: data.registroSanitario || "",
      codDigemid: data.codDigemid || "",
      stockReal: data.stockReal ?? data.stock ?? 0,
      precioVenta: basePrice,
      laboratorioNombre:
        data.laboratorioNombre || data.laboratorio?.nombre || "",
      idCategoria:
        data.idCategoria || data.categoria?.id || data.categoria?.idCategoria || "",
      idLaboratorio:
        data.idLaboratorio || data.laboratorio?.id || data.laboratorio?.idLaboratorio || "",
      idProveedor:
        data.idProveedor || data.proveedor?.id || data.proveedor?.idProveedor || "",
      idUbicacion:
        data.idUbicacion || data.ubicacion?.id || data.ubicacion?.idUbicacion || "",
      imagen: data.imagen || "",
    });

    // Cargar presentaciones
    if (
      data.presentaciones &&
      Array.isArray(data.presentaciones) &&
      data.presentaciones.length > 0
    ) {
      setPresentaciones(
        data.presentaciones.map((p) => ({
          idPresentacion: p.idPresentacion || null,
          nombrePresentacion: p.nombrePresentacion || "",
          cantidadUnidades: p.cantidadUnidades || 1,
          precioVenta:
            p.precioVenta !== undefined && p.precioVenta !== null
              ? p.precioVenta
              : "",
          activo: p.activo !== undefined ? p.activo : true,
          isActive: p.isActive !== undefined ? p.isActive : true,
        }))
      );
    } else if (basePrice) {
      setPresentaciones([
        {
          idPresentacion: null,
          nombrePresentacion: "Unidad",
          cantidadUnidades: 1,
          precioVenta: basePrice,
          activo: true,
          isActive: true,
        },
      ]);
    } else {
      setPresentaciones([{ ...defaultPresentation }]);
    }

    // Imagen previa si existe
    if (data.imagen) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      setImagePreview(`${baseUrl}/uploads/${data.imagen}`);
    }
  };

  // 2. Cargar datos del producto si estamos en modo edición
  useEffect(() => {
    let isMounted = true;
    const targetId = id || productSelected?.id || productSelected?.idProducto;

    if (targetId) {
      setIsLoadingProduct(true);
      findById(targetId)
        .then((res) => {
          if (isMounted && res?.data) {
            populateFormData(res.data);
          }
        })
        .catch((err) => {
          console.error("Error al obtener producto por ID:", err);
          if (productSelected && (productSelected.id || productSelected.idProducto)) {
            populateFormData(productSelected);
          } else {
            Swal.fire({
              title: "Error",
              text: "No se pudo cargar la información del producto.",
              icon: "error",
            });
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingProduct(false);
        });
    } else {
      setProductForm(initialFormState);
      setPresentaciones([{ ...defaultPresentation }]);
      setImagePreview(null);
      setFileObject(null);
    }

    return () => {
      isMounted = false;
    };
  }, [id, productSelected]);

  // Manejador de campos simples
  const onInputChange = ({ target }) => {
    const { name, value, type, checked } = target;

    if (type === "checkbox") {
      setProductForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setProductForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Si seleccionó laboratorio por ID, sincronizar laboratorioNombre
      if (name === "idLaboratorio" && value) {
        const foundLab = laboratoryList.find((lab) => String(lab.id) === String(value));
        if (foundLab) {
          updated.laboratorioNombre = foundLab.nombre || foundLab.name || "";
        }
      }

      return updated;
    });
  };

  // Preset rápido de formas farmacéuticas
  const selectFormaPreset = (forma) => {
    setProductForm((prev) => ({ ...prev, formaFarmaceutica: forma }));
  };

  // --- GESTIÓN DE PRESENTACIONES ---
  const handleAddPresentation = (customPreset = null) => {
    if (customPreset) {
      setPresentaciones((prev) => [...prev, { ...customPreset }]);
    } else {
      setPresentaciones((prev) => [
        ...prev,
        {
          idPresentacion: null,
          nombrePresentacion: "",
          cantidadUnidades: 1,
          precioVenta: "",
          activo: true,
          isActive: true,
        },
      ]);
    }
  };

  const handleRemovePresentation = (index) => {
    if (presentaciones.length <= 1) {
      Swal.fire({
        title: "Presentación requerida",
        text: "El medicamento debe tener al menos una presentación de venta activa.",
        icon: "warning",
        confirmButtonColor: "#0f766e",
      });
      return;
    }
    setPresentaciones((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePresentationChange = (index, field, value) => {
    setPresentaciones((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]:
          field === "cantidadUnidades"
            ? value === "" ? "" : Math.max(1, parseInt(value, 10) || 1)
            : field === "precioVenta"
              ? value
              : value,
      };

      // Si se modifica el precio de la primera presentación, sincronizar precio base
      if (index === 0 && field === "precioVenta") {
        setProductForm((current) => ({ ...current, precioVenta: value }));
      }

      return updated;
    });
  };

  // Manejador de archivo de imagen
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: "Archivo demasiado pesado",
          text: "El tamaño máximo permitido para la imagen es de 5MB.",
          icon: "warning",
          confirmButtonColor: "#0f766e",
        });
        return;
      }
      setFileObject(file);
      setProductForm((prev) => ({ ...prev, imagen: file.name }));
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleRemoveImage = () => {
    setFileObject(null);
    setImagePreview(null);
    setProductForm((prev) => ({ ...prev, imagen: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- ENVÍO DEL FORMULARIO ---
  const onSubmit = async (event) => {
    if (event) event.preventDefault();

    // 1. Validaciones requeridas
    if (!productForm.nombre.trim()) {
      Swal.fire({
        title: "Nombre Requerido",
        text: "Debe ingresar el nombre comercial del medicamento.",
        icon: "warning",
        confirmButtonColor: "#0f766e",
      });
      return;
    }

    // Validar presentaciones
    const validPresentaciones = presentaciones.filter(
      (p) => p.nombrePresentacion && p.nombrePresentacion.trim() !== ""
    );

    if (validPresentaciones.length === 0) {
      Swal.fire({
        title: "Presentación Requerida",
        text: "Debe registrar al menos una presentación de venta con nombre y precio.",
        icon: "warning",
        confirmButtonColor: "#0f766e",
      });
      return;
    }

    // Validar que cada presentación tenga un precio válido mayor a 0
    for (const p of validPresentaciones) {
      const priceNum = parseFloat(p.precioVenta);
      if (isNaN(priceNum) || priceNum <= 0) {
        Swal.fire({
          title: "Precio Inválido",
          text: `La presentación "${p.nombrePresentacion}" debe tener un precio de venta mayor a 0.`,
          icon: "warning",
          confirmButtonColor: "#0f766e",
        });
        return;
      }
    }

    // Calcular precio principal de venta para la entidad
    const resolvedPrice =
      parseFloat(validPresentaciones[0]?.precioVenta) ||
      parseFloat(productForm.precioVenta) ||
      0;

    const payload = {
      ...productForm,
      nombre: productForm.nombre.trim(),
      principioActivo: productForm.principioActivo.trim(),
      concentracion: productForm.concentracion.trim(),
      formaFarmaceutica: productForm.formaFarmaceutica.trim(),
      patologia: productForm.patologia.trim(),
      codigoBarras: productForm.codigoBarras.trim(),
      registroSanitario: productForm.registroSanitario.trim(),
      codDigemid: productForm.codDigemid.trim(),
      stockReal: Number(productForm.stockReal) || 0,
      precioVenta: resolvedPrice,
      idCategoria: productForm.idCategoria ? Number(productForm.idCategoria) : null,
      idLaboratorio: productForm.idLaboratorio ? Number(productForm.idLaboratorio) : null,
      idProveedor: productForm.idProveedor ? Number(productForm.idProveedor) : null,
      idUbicacion: productForm.idUbicacion ? Number(productForm.idUbicacion) : null,
      presentaciones: validPresentaciones.map((p) => ({
        idPresentacion: p.idPresentacion || null,
        nombrePresentacion: p.nombrePresentacion.trim(),
        cantidadUnidades: Number(p.cantidadUnidades) || 1,
        precioVenta: Number(p.precioVenta) || 0,
        activo: p.activo !== undefined ? p.activo : true,
        isActive: p.isActive !== undefined ? p.isActive : true,
      })),
    };

    const targetId = id || productForm.idProducto;
    let savedProductId = targetId;

    try {
      setIsSubmitting(true);

      if (targetId && String(targetId) !== "0") {
        const response = await update(payload);
        savedProductId =
          response.data?.idProducto || response.data?.id || targetId;

        // Subir archivo de imagen si el usuario seleccionó uno nuevo
        if (fileObject && savedProductId) {
          const imageFormData = new FormData();
          imageFormData.append("file", fileObject);
          await productsApi.post(
            `/products/${savedProductId}/upload-image`,
            imageFormData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        }

        Swal.fire({
          title: "¡Producto Actualizado!",
          text: "El medicamento y sus presentaciones se actualizaron correctamente.",
          icon: "success",
          timer: 1600,
          showConfirmButton: false,
        });
      } else {
        const response = await save(payload);
        savedProductId = response.data?.idProducto || response.data?.id;

        // Subir archivo de imagen si el usuario seleccionó uno
        if (fileObject && savedProductId) {
          const imageFormData = new FormData();
          imageFormData.append("file", fileObject);
          await productsApi.post(
            `/products/${savedProductId}/upload-image`,
            imageFormData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        }

        Swal.fire({
          title: "¡Producto Registrado!",
          text: "El medicamento ha sido registrado exitosamente en el catálogo.",
          icon: "success",
          timer: 1600,
          showConfirmButton: false,
        });
      }

      navigate("/products");
    } catch (error) {
      console.error("Error al persistir producto:", error);
      const serverMsg =
        error.response?.data?.nombre ||
        error.response?.data?.precioVenta ||
        error.response?.data?.message ||
        "Ocurrió un error inesperado al guardar el producto.";
      Swal.fire({
        title: "Error al guardar",
        text: serverMsg,
        icon: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500">
        <svg
          className="animate-spin h-9 w-9 text-teal-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm font-medium">
          Cargando datos del medicamento...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      {/* 1. Header Bar Moderno */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-teal-700/20 flex-shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {isEditMode ? "Editar Producto" : "Registrar Producto"}
              </h1>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isEditMode
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-teal-50 text-teal-700 border border-teal-200"
                  }`}
              >
                {isEditMode ? "Edición" : "Nuevo Registro"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Defina especificaciones farmacológicas, proveedores, ubicación física y presentaciones de venta
            </p>
          </div>
        </div>

        {/* Acciones Superiores */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-teal-800 hover:bg-teal-900 active:bg-teal-950 rounded-xl shadow-md shadow-teal-900/15 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                <span>{isEditMode ? "Actualizar Producto" : "Guardar Producto"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formulario Principal Dividido en Secciones Claras */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* SECCIÓN 1: DATOS FARMACOLÓGICOS Y BASE */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              1
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Información Farmacológica General
              </h2>
              <p className="text-xs text-slate-500">
                Datos descriptivos del producto medicinal o farmacéutico
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Nombre del Producto */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nombre Comercial del Producto <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="nombre"
                  value={productForm.nombre}
                  onChange={onInputChange}
                  placeholder="Ej. AMOXICILINA 500 MG CAPSULAS"
                  className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                  required
                />
              </div>
            </div>

            {/* Principio Activo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Principio Activo (DCI)
              </label>
              <input
                type="text"
                name="principioActivo"
                value={productForm.principioActivo}
                onChange={onInputChange}
                placeholder="Ej. Amoxicilina Trihidrato"
                className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
              />
            </div>

            {/* Concentración */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Concentración
              </label>
              <input
                type="text"
                name="concentracion"
                value={productForm.concentracion}
                onChange={onInputChange}
                placeholder="Ej. 500 mg, 125 mg/5ml"
                className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
              />
            </div>

            {/* Forma Farmacéutica */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Forma Farmacéutica
              </label>
              <input
                type="text"
                name="formaFarmaceutica"
                value={productForm.formaFarmaceutica}
                onChange={onInputChange}
                placeholder="Ej. Cápsula, Tableta"
                className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
              />
              {/* Presets rápidos */}
              <div className="flex flex-wrap gap-1 mt-2">
                {COMMON_FORMS.slice(0, 4).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => selectFormaPreset(f)}
                    className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-md transition-colors"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Patología / Indicación Médica */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Patología
              </label>
              <input
                type="text"
                name="patologia"
                value={productForm.patologia}
                onChange={onInputChange}
                placeholder="Ej. Antibiótico bactericida de amplio espectro"
                className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
              />
            </div>

            {/* Stock Real Inicial */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Stock Físico Inicial (Unidades)
              </label>
              <input
                type="number"
                min="0"
                name="stockReal"
                value={productForm.stockReal}
                onChange={onInputChange}
                placeholder="0"
                className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
              />
            </div>

            {/* Precio Base de Venta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Precio Base Principal (S/.) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                  S/.
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="precioVenta"
                  value={productForm.precioVenta}
                  onChange={onInputChange}
                  placeholder="0.00"
                  className="w-full h-11 pl-10 pr-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: CLASIFICACIÓN Y UBICACIÓN (CATEGORÍA, LABORATORIO, PROVEEDOR, UBICACIÓN) */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Clasificación y Ubicación en Almacén
                </h2>
                <p className="text-xs text-slate-500">
                  Asocie el medicamento a su categoría, laboratorio productor, proveedor y ubicación física
                </p>
              </div>
            </div>

            {isLoadingCatalogs && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                <svg
                  className="animate-spin h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Cargando catálogos...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Categoría */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Categoría</span>
                <span className="text-[11px] text-teal-600 font-semibold lowercase">
                  ({categoryList.length} disp.)
                </span>
              </label>
              <div className="relative">
                <select
                  name="idCategoria"
                  value={productForm.idCategoria}
                  onChange={onInputChange}
                  className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all cursor-pointer"
                >
                  <option value="">-- Seleccionar Categoría --</option>
                  {categoryList.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre || cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Laboratorio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Laboratorio</span>
                <span className="text-[11px] text-teal-600 font-semibold lowercase">
                  ({laboratoryList.length} disp.)
                </span>
              </label>
              <div className="relative">
                <select
                  name="idLaboratorio"
                  value={productForm.idLaboratorio}
                  onChange={onInputChange}
                  className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all cursor-pointer"
                >
                  <option value="">-- Seleccionar Laboratorio --</option>
                  {laboratoryList.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.nombre || lab.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Proveedor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Proveedor / Distribuidor</span>
                <span className="text-[11px] text-teal-600 font-semibold lowercase">
                  ({supplierList.length} disp.)
                </span>
              </label>
              <div className="relative">
                <select
                  name="idProveedor"
                  value={productForm.idProveedor}
                  onChange={onInputChange}
                  className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all cursor-pointer"
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  {supplierList.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.nombre || sup.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Ubicación Almacén */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Ubicación Física</span>
                <span className="text-[11px] text-teal-600 font-semibold lowercase">
                  ({locationList.length} disp.)
                </span>
              </label>
              <div className="relative">
                <select
                  name="idUbicacion"
                  value={productForm.idUbicacion}
                  onChange={onInputChange}
                  className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all cursor-pointer"
                >
                  <option value="">-- Seleccionar Ubicación --</option>
                  {locationList.map((loc) => {
                    const extra = [loc.pasillo ? `Pasillo: ${loc.pasillo}` : "", loc.estante ? `Estante: ${loc.estante}` : ""].filter(Boolean).join(" | ");
                    return (
                      <option key={loc.id} value={loc.id}>
                        {loc.nombre || loc.name} {extra ? `(${extra})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: PRESENTACIONES DE VENTA DINÁMICAS */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                3
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Presentaciones de Venta y Precios
                </h2>
                <p className="text-xs text-slate-500">
                  Configure los distintos formatos comerciales de venta (Unidad, Blister, Caja, Frasco)
                </p>
              </div>
            </div>

            {/* Acciones de Presets Rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddPresentation({ idPresentacion: null, nombrePresentacion: "Unidad", cantidadUnidades: 1, precioVenta: "", activo: true })}
                className="text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                + Unidad
              </button>
              <button
                type="button"
                onClick={() => handleAddPresentation({ idPresentacion: null, nombrePresentacion: "Blister x 10", cantidadUnidades: 10, precioVenta: "", activo: true })}
                className="text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                + Blister x 10
              </button>
              <button
                type="button"
                onClick={() => handleAddPresentation({ idPresentacion: null, nombrePresentacion: "Caja x 100", cantidadUnidades: 100, precioVenta: "", activo: true })}
                className="text-xs font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                + Caja x 100
              </button>
              <button
                type="button"
                onClick={() => handleAddPresentation()}
                className="text-xs font-semibold px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg transition-colors flex items-center gap-1 border border-teal-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Nueva Fila</span>
              </button>
            </div>
          </div>

          {/* Lista de Presentaciones */}
          <div className="space-y-3">
            {presentaciones.map((pres, index) => {
              const unitPrice =
                pres.cantidadUnidades && pres.precioVenta
                  ? (Number(pres.precioVenta) / Number(pres.cantidadUnidades)).toFixed(2)
                  : null;

              return (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-teal-200 hover:shadow-sm transition-all"
                >
                  {/* Badge de orden */}
                  <div className="flex items-center justify-between md:justify-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase md:hidden">
                      Presentación #{index + 1}
                    </span>
                  </div>

                  {/* Nombre de la Presentación */}
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Nombre Comercial de la Presentación <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={pres.nombrePresentacion}
                      onChange={(e) =>
                        handlePresentationChange(
                          index,
                          "nombrePresentacion",
                          e.target.value
                        )
                      }
                      placeholder="Ej. Caja x 100 cápsulas, Blister, Unidad"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                      required
                    />
                  </div>

                  {/* Cantidad de Unidades contenidas */}
                  <div className="w-full md:w-36">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Unidades <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pres.cantidadUnidades}
                      onChange={(e) =>
                        handlePresentationChange(
                          index,
                          "cantidadUnidades",
                          e.target.value
                        )
                      }
                      placeholder="1"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                      required
                    />
                  </div>

                  {/* Precio de Venta */}
                  <div className="w-full md:w-44">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Precio Venta (S/.) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        S/.
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={pres.precioVenta}
                        onChange={(e) =>
                          handlePresentationChange(
                            index,
                            "precioVenta",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                        className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-700 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Indicador de Precio Unitario Calculado */}
                  <div className="w-full md:w-32 flex md:flex-col justify-between md:justify-center items-center md:items-start text-xs pt-1">
                    <span className="text-slate-400 font-medium">Costo unitario:</span>
                    <span className="font-bold text-slate-700">
                      {unitPrice ? `S/. ${unitPrice}` : "---"}
                    </span>
                  </div>

                  {/* Botón Eliminar Fila */}
                  <div className="flex items-center justify-end md:justify-center pt-2 md:pt-4">
                    <button
                      type="button"
                      onClick={() => handleRemovePresentation(index)}
                      title="Eliminar presentación"
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            Las presentaciones permiten vender este producto en la caja rápida en forma individual, por blister o por empaque cerrado sin descuadrar el inventario base.
          </p>
        </div>

        {/* SECCIÓN 4: CONTROL REGULATORIO Y MULTIMEDIA */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
              4
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Control Normativo y Archivos Multimedia
              </h2>
              <p className="text-xs text-slate-500">
                Registros de DIGEMID, código de barras para escáner y fotografía referencial
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {/* Códigos y Receta */}
            <div className="space-y-4">
              {/* Requiere Receta Médica */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${productForm.requiereReceta ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"}`}>
                    Rx
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      ¿Requiere Prescripción Médica?
                    </h3>
                    <p className="text-xs text-slate-500">
                      {productForm.requiereReceta
                        ? "Venta bajo receta médica retenida o con receta médica"
                        : "Venta libre en mostrador (OTC)"}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="requiereReceta"
                    checked={productForm.requiereReceta}
                    onChange={onInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Código de Barras */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Código de Barras (EAN-13 / UPC)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="codigoBarras"
                    value={productForm.codigoBarras}
                    onChange={onInputChange}
                    placeholder="Ej. 7751234567890"
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                  />
                </div>
              </div>

              {/* Registro Sanitario y Código DIGEMID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Registro Sanitario
                  </label>
                  <input
                    type="text"
                    name="registroSanitario"
                    value={productForm.registroSanitario}
                    onChange={onInputChange}
                    placeholder="Ej. EN-01234"
                    className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Código DIGEMID
                  </label>
                  <input
                    type="text"
                    name="codDigemid"
                    value={productForm.codDigemid}
                    onChange={onInputChange}
                    placeholder="Ej. DIG-98765"
                    className="w-full h-11 px-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Zona de Subida de Imagen */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Fotografía o Imagen del Empaque
              </label>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
              />

              {imagePreview ? (
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center justify-center">
                  <div className="w-full h-48 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview producto"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Cambiar Imagen
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/20 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[218px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2.5">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-800 mb-0.5">
                    Haga clic para subir fotografía
                  </span>
                  <span className="text-xs text-slate-400">
                    Formatos JPG, PNG, WEBP (Hasta 5MB)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BARRA INFERIOR DE ACCIONES */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => navigate("/products")}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-bold text-sm shadow-md shadow-teal-900/15 transition-all flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Guardando Producto...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                <span>{isEditMode ? "Guardar Cambios" : "Completar Registro"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

ProductForm.propTypes = {
  productSelected: PropTypes.object,
};
export default ProductForm;