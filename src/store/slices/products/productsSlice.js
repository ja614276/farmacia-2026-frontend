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
            state.products.push(action.payload);
            state.productSelected = initialProductForm;
            state.visibleForm = false;
        },
        removeProduct: (state, action) => {
            state.products = state.products.filter(product => product.id !== action.payload);
        },
        updateProduct: (state, action) => {
            state.products = state.products.map((p) =>
                p.id === action.payload.id ? { ...action.payload } : p
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
