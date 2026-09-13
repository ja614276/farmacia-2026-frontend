import { createSlice } from "@reduxjs/toolkit";

export const initialProductForm = {
    id: 0,
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    codigo: '',
    fechaRegistro: new Date().toISOString(), // ✅ Fecha por defecto al crear un producto
};

const initialErrors = {
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    codigo: '',
    fechaRegistro: '',
};

export const productsSlice = createSlice({
    name: "products",
    initialState: {
        products: [],
        productSelected: initialProductForm,
        visibleForm: false,
        errors: initialErrors,
        isLoading: true,
    },
    reducers: {
        addProduct: (state, action) => {
            state.products.unshift(action.payload);
            state.productSelected = initialProductForm;
            state.visibleForm = false;
        },
        removeProduct: (state, action) => {
            const targetId = Number(action.payload);
            state.products = state.products.filter(
                product => Number(product.idProducto || product.id) !== targetId
            );
        },
        updateProduct: (state, action) => {
            const updatedId = Number(action.payload.idProducto || action.payload.id);
            state.products = state.products.map((p) =>
                Number(p.idProducto || p.id) === updatedId ? { ...action.payload } : p
            );
            state.productSelected = initialProductForm;
            state.visibleForm = false;
        },
        loadingProducts: (state, { payload }) => {
            state.products = payload;
            state.isLoading = false;
        },
        onProductSelectedForm: (state, { payload }) => {
            state.productSelected = payload;
            state.visibleForm = true;
        },
        onOpenForm: (state) => {
            state.visibleForm = true;
        },
        onCloseForm: (state) => {
            state.visibleForm = false;
            state.productSelected = initialProductForm;
        },
        loadingError: (state, { payload }) => {
            state.errors = payload;
        }
    }
});

export const {
    addProduct,
    removeProduct,
    updateProduct,
    loadingProducts,
    onProductSelectedForm,
    onOpenForm,
    onCloseForm,
    loadingError,
} = productsSlice.actions;

export default productsSlice.reducer;
