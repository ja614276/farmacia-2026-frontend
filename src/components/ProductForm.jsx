import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

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
  idCategoria: "",
  idLaboratorio: "",
  idProveedor: "",
  idUbicacion: "",
  imagen: "",
  precioVenta: "",
};

const initialPresentation = {
  nombrePresentacion: "",
  cantidadUnidades: 1,
  precioVenta: "",
};

export const ProductForm = ({
  productSelected,
  categories = [],
  laboratories = [],
  suppliers = [],
  locations = [],
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  const [productForm, setProductForm] = useState(initialFormState);
  const [presentaciones, setPresentaciones] = useState([
    { nombrePresentacion: "Unidad", cantidadUnidades: 1, precioVenta: "" },
  ]);
  const [selectedFileName, setSelectedFileName] = useState(
    "Ninguna imagen seleccionada",
  );
  // Estado para el archivo binario físico de la imagen
  const [fileObject, setFileObject] = useState(null);

  const getAuthHeaders = () => {
    const rawToken =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return rawToken
      ? {
          Authorization: rawToken.startsWith("Bearer ")
            ? rawToken
            : `Bearer ${rawToken}`,
          "Content-Type": "application/json",
        }
      : { "Content-Type": "application/json" };
  };

  const populateForm = (data) => {
    const basePrice =
      data.precioVenta ||
      (Array.isArray(data.presentaciones) && data.presentaciones.length > 0
        ? data.presentaciones[0].precioVenta
        : "");

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
      idCategoria: data.idCategoria || data.categoria?.id || "",
      idLaboratorio: data.idLaboratorio || data.laboratorio?.id || "",
      idProveedor: data.idProveedor || data.proveedor?.id || "",
      idUbicacion: data.idUbicacion || data.ubicacion?.id || "",
      imagen: data.imagen || "",
      precioVenta: basePrice,
    });

    if (
      data.presentaciones &&
      Array.isArray(data.presentaciones) &&
      data.presentaciones.length > 0
    ) {
      setPresentaciones(data.presentaciones);
    } else if (basePrice) {
      setPresentaciones([
        {
          nombrePresentacion: "Unidad",
          cantidadUnidades: 1,
          precioVenta: basePrice,
        },
      ]);
    }

    if (data.imagen) {
      setSelectedFileName(data.imagen);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (id) {
      axios
        .get(`${import.meta.env.VITE_API_BASE_URL}/products/${id}`, {
          headers: getAuthHeaders(),
        })
        .then((res) => {
          if (isMounted && res.data) {
            populateForm(res.data);
          }
        })
        .catch((err) => {
          console.error("Error al cargar medicamento:", err);
        });
    } else if (
      productSelected &&
      (productSelected.idProducto || productSelected.id)
    ) {
      populateForm(productSelected);
    } else {
      setProductForm(initialFormState);
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const onInputChange = ({ target }) => {
    const { name, value, type, checked } = target;

    if (type === "checkbox") {
      setProductForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setProductForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejo de la lista dinámica de presentaciones
  const handleAddPresentation = () => {
    setPresentaciones((prev) => [...prev, { ...initialPresentation }]);
  };

  const handleRemovePresentation = (index) => {
    if (presentaciones.length === 1) {
      alert("El medicamento debe tener al menos una presentación de venta.");
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
          field === "cantidadUnidades" || field === "precioVenta"
            ? value === ""
              ? ""
              : Number(value)
            : value,
      };
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      setFileObject(file); // Almacena el archivo físico binario
      setProductForm((prev) => ({ ...prev, imagen: file.name }));
    }
  };

  const onSubmit = async (event) => {
    if (event) event.preventDefault();

    if (!productForm.nombre.trim()) {
      alert("El nombre comercial del medicamento es obligatorio.");
      return;
    }

    const filteredPresentaciones = presentaciones
      .filter((p) => p.nombrePresentacion && p.nombrePresentacion.trim() !== "")
      .map((p) => ({
        ...p,
        nombrePresentacion: p.nombrePresentacion.trim(),
        cantidadUnidades: Number(p.cantidadUnidades) || 1,
        precioVenta: Number(p.precioVenta) || 0,
      }));

    if (filteredPresentaciones.length === 0) {
      alert("Debe ingresar al menos una presentación de venta.");
      return;
    }

    // Calcula el precio de venta para cumplir con la validación del backend
    const resolvedPrice =
      parseFloat(filteredPresentaciones[0]?.precioVenta) ||
      parseFloat(productForm.precioVenta) ||
      0;

    if (resolvedPrice <= 0) {
      alert("El precio de venta de la presentación principal debe ser mayor a 0.");
      return;
    }

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
      precioVenta: resolvedPrice,
      idCategoria: productForm.idCategoria
        ? Number(productForm.idCategoria)
        : null,
      idLaboratorio: productForm.idLaboratorio
        ? Number(productForm.idLaboratorio)
        : null,
      idProveedor: productForm.idProveedor
        ? Number(productForm.idProveedor)
        : null,
      idUbicacion: productForm.idUbicacion
        ? Number(productForm.idUbicacion)
        : null,
      presentaciones: filteredPresentaciones,
    };

    const targetId = id || productForm.idProducto;
    let savedProductId = targetId;

    try {
      if (targetId && targetId !== "0" && targetId !== 0) {
        const res = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/products/${targetId}`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );
        savedProductId = res.data?.idProducto || res.data?.id || targetId;
      } else {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/products`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );
        savedProductId = res.data?.idProducto || res.data?.id;
      }

      // Si el usuario seleccionó una imagen, se envía al endpoint Multipart
      if (fileObject && savedProductId) {
        const imageFormData = new FormData();
        imageFormData.append("file", fileObject);

        const rawToken =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/products/${savedProductId}/upload-image`,
          imageFormData,
          {
            headers: {
              Authorization: rawToken?.startsWith("Bearer ")
                ? rawToken
                : `Bearer ${rawToken}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      alert("Medicamento e información guardados correctamente.");
      navigate("/products");
    } catch (error) {
      console.error(
        "Error al persistir medicamento:",
        error.response?.data || error,
      );
      const serverMsg =
        error.response?.data?.precioVenta ||
        error.response?.data?.message ||
        "Ocurrió un error en el servidor.";
      alert(`Error: ${serverMsg}`);
    }
  };

  const isEditMode = Boolean(id) || Boolean(productForm.idProducto);

  return (
    <div className="product-form-wrapper bg-light min-vh-100 pb-5">
      {/* Cabecera Superior Verde Esmeralda */}
      <div className="header-navbar d-flex justify-content-between align-items-center px-4 py-3 shadow-sm">
        <div className="d-flex align-items-center gap-3 text-white">
          <div className="icon-badge">
            <i className="bi bi-box-seam fs-3"></i>
          </div>
          <div>
            <h4 className="m-0 fw-bold tracking-wide">
              {isEditMode ? "EDITAR PRODUCTO" : "REGISTRAR PRODUCTO"}
            </h4>
            <small className="opacity-75">
              Complete la información detallada del producto farmacéutico
            </small>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-light px-3 py-2 btn-sm fw-semibold"
            onClick={() => navigate("/products")}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-light px-3 py-2 btn-sm fw-bold text-teal shadow-sm d-flex align-items-center gap-2"
            onClick={onSubmit}
          >
            <i className="bi bi-floppy"></i>
            Guardar Producto
          </button>
        </div>
      </div>

      {/* Contenedor del Formulario */}
      <form
        onSubmit={onSubmit}
        className="container bg-white p-4 p-md-5 my-4 rounded-4 shadow-sm"
      >
        {/* 1. INFORMACIÓN GENERAL */}
        <div className="section-title mb-4">
          <span className="section-badge">
            <i className="bi bi-info-circle me-2"></i>INFORMACIÓN GENERAL
          </span>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <label className="form-label-custom">Nombre del Producto *</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <i className="bi bi-box"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Ej: AMOXICILINA 500 MG CAPS."
                name="nombre"
                value={productForm.nombre}
                onChange={onInputChange}
                required
              />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label-custom">Principio Activo</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <i className="bi bi-info-circle"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Ej: Amoxicilina 500 mg"
                name="principioActivo"
                value={productForm.principioActivo}
                onChange={onInputChange}
              />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label-custom">Concentración</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <i className="bi bi-tag"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Ej: Caja x 100 caps"
                name="concentracion"
                value={productForm.concentracion}
                onChange={onInputChange}
              />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label-custom">Forma Farmacéutica</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <i className="bi bi-capsule"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Ej: Cápsula, Tableta"
                name="formaFarmaceutica"
                value={productForm.formaFarmaceutica}
                onChange={onInputChange}
              />
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12">
            <label className="form-label-custom">
              Patología / Indicación Médica
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <i className="bi bi-file-earmark-medical"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Ej: Analgésico y Antipirético"
                name="patologia"
                value={productForm.patologia}
                onChange={onInputChange}
              />
            </div>
          </div>
        </div>

        {/* 2. CONTROL Y REGISTRO */}
        <div className="section-title mb-4">
          <span className="section-badge">
            <i className="bi bi-gear me-2"></i>CONTROL Y REGISTRO
          </span>
        </div>

        <div className="row g-3 mb-4 align-items-end">
          <div className="col-md-3">
            <label className="form-label-custom">Requiere Receta Médica</label>
            <div className="p-2 border rounded d-flex align-items-center gap-2 bg-light-subtle switch-box">
              <input
                className="form-check-input mt-0"
                type="checkbox"
                id="recetaCheck"
                name="requiereReceta"
                checked={productForm.requiereReceta}
                onChange={onInputChange}
              />
              <label
                className="form-check-label text-muted small cursor-pointer"
                htmlFor="recetaCheck"
              >
                {productForm.requiereReceta
                  ? "Requiere receta médica"
                  : "NO requiere receta"}
              </label>
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label-custom">Código de Barras</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <i className="bi bi-upc-scan"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Ej: COD-BA0108"
                name="codigoBarras"
                value={productForm.codigoBarras}
                onChange={onInputChange}
              />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label-custom">Registro Sanitario</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <i className="bi bi-card-checklist"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Ej: REG-SAN-108"
                name="registroSanitario"
                value={productForm.registroSanitario}
                onChange={onInputChange}
              />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label-custom">Código DIGEMID</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">
                <i className="bi bi-tag-fill"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Ej: DIG-000"
                name="codDigemid"
                value={productForm.codDigemid}
                onChange={onInputChange}
              />
            </div>
          </div>
        </div>

        {/* 3. CLASIFICACIÓN Y UBICACIÓN */}
        <div className="section-title mb-4">
          <span className="section-badge">
            <i className="bi bi-geo-alt me-2"></i>CLASIFICACIÓN Y UBICACIÓN
          </span>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <label className="form-label-custom">Categoría *</label>
            <select
              className="form-select form-select-custom"
              name="idCategoria"
              value={productForm.idCategoria}
              onChange={onInputChange}
            >
              <option value="">Seleccione Categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre || cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label-custom">Laboratorio *</label>
            <select
              className="form-select form-select-custom"
              name="idLaboratorio"
              value={productForm.idLaboratorio}
              onChange={onInputChange}
            >
              <option value="">Seleccione Laboratorio</option>
              {laboratories.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.nombre || lab.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label-custom">Proveedor *</label>
            <select
              className="form-select form-select-custom"
              name="idProveedor"
              value={productForm.idProveedor}
              onChange={onInputChange}
            >
              <option value="">Seleccione Proveedor</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.nombre || sup.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label-custom">Ubicación (Almacén) *</label>
            <select
              className="form-select form-select-custom"
              name="idUbicacion"
              value={productForm.idUbicacion}
              onChange={onInputChange}
            >
              <option value="">Seleccione Ubicación</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.nombre || loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. PRESENTACIONES */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="section-title m-0">
            <span className="section-badge">
              <i className="bi bi-tags me-2"></i>PRESENTACIONES
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline-coral btn-sm fw-semibold d-flex align-items-center gap-1"
            onClick={handleAddPresentation}
          >
            <i className="bi bi-plus"></i> Agregar Presentación
          </button>
        </div>

        {presentaciones.map((pres, index) => (
          <div
            className="row g-3 align-items-end mb-3 p-2 bg-light-row rounded"
            key={index}
          >
            <div className="col-md-4">
              <label className="form-label-custom">
                Nombre (ej. Caja x 100) *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Blister, Caja, Frasco"
                value={pres.nombrePresentacion}
                onChange={(e) =>
                  handlePresentationChange(
                    index,
                    "nombrePresentacion",
                    e.target.value,
                  )
                }
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label-custom">Unidades *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={pres.cantidadUnidades}
                onChange={(e) =>
                  handlePresentationChange(
                    index,
                    "cantidadUnidades",
                    e.target.value,
                  )
                }
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label-custom">Precio Venta (S/.) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="0.00"
                value={pres.precioVenta}
                onChange={(e) =>
                  handlePresentationChange(index, "precioVenta", e.target.value)
                }
                required
              />
            </div>

            <div className="col-md-1 text-center">
              <button
                type="button"
                onClick={() => handleRemovePresentation(index)}
                title="Eliminar fila"
                style={{
                  width: "38px",
                  height: "38px",
                  backgroundColor: "#fff",
                  border: "1.5px solid #fca5a5",
                  borderRadius: "6px",
                  color: "#dc2626",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fee2e2";
                  e.currentTarget.style.borderColor = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#fca5a5";
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* 5. MULTIMEDIA */}
        <div className="section-title my-4">
          <span className="section-badge">
            <i className="bi bi-images me-2"></i>MULTIMEDIA
          </span>
        </div>

        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <div
              className="upload-dropzone p-4 text-center border rounded-3 bg-light-subtle cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            >
              <i className="bi bi-image fs-1 text-muted"></i>
              <div className="fw-bold mt-2 text-dark">SELECCIONAR IMAGEN</div>
              <small className="text-muted d-block">
                JPG, PNG, WEBP (Máx. 5MB)
              </small>
            </div>
          </div>

          <div className="col-md-8">
            <div className="p-3 bg-light rounded-3 mb-3 border">
              <small className="text-success fw-bold d-block mb-1">
                RUTA ACTUAL:
              </small>
              <span className="text-secondary font-monospace small">
                {selectedFileName}
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="d-none"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />

            <button
              type="button"
              className="btn btn-outline-coral w-100 py-2 fw-semibold d-flex justify-content-center align-items-center gap-2"
              onClick={() => fileInputRef.current.click()}
            >
              <i className="bi bi-folder2-open"></i> Explorar Archivos
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .header-navbar {
          background-color: #006d77;
        }
        .text-teal {
          color: #006d77 !important;
        }
        .section-badge {
          color: #e2725b;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.8px;
          display: inline-flex;
          align-items: center;
        }
        .form-label-custom {
          font-size: 0.78rem;
          font-weight: 600;
          color: #555;
          margin-bottom: 0.35rem;
        }
        .input-group-text {
          border-color: #e2e8f0;
        }
        .form-control, .form-select-custom {
          border-color: #e2e8f0;
          font-size: 0.9rem;
          color: #2d3748;
        }
        .form-control:focus, .form-select-custom:focus {
          border-color: #006d77;
          box-shadow: 0 0 0 0.2rem rgba(0, 109, 119, 0.15);
        }
        .switch-box {
          height: 38px;
          border-color: #e2e8f0;
        }
        .btn-outline-coral {
          color: #e2725b;
          border-color: #e2725b;
        }
        .btn-outline-coral:hover {
          background-color: #e2725b;
          color: #fff;
        }
        .bg-light-row {
          background-color: #fafafa;
          border: 1px solid #f0f0f0;
        }
        .upload-dropzone {
          border: 2px dashed #cbd5e1 !important;
          transition: all 0.2s ease;
        }
        .upload-dropzone:hover {
          background-color: #f1f5f9;
          border-color: #006d77 !important;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

ProductForm.propTypes = {
  productSelected: PropTypes.object,
  categories: PropTypes.array,
  laboratories: PropTypes.array,
  suppliers: PropTypes.array,
  locations: PropTypes.array,
};