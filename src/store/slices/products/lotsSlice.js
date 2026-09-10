import { createSlice } from "@reduxjs/toolkit";

export const lotsSlice = createSlice({
    name: "lots",
    initialState: {
        lots: [],
        isLoading: false,
        error: null,
    },
    reducers: {
        loadingLots: (state, action) => {
            state.lots = action.payload;
            state.isLoading = false;
        },
        addLot: (state, action) => {
            state.lots.push(action.payload);
        },
        updateLot: (state, action) => {
            state.lots = state.lots.map((lot) => {
                const currentId = lot.idLote || lot.id;
                const updatedId = action.payload.idLote || action.payload.id;
                return currentId === updatedId ? action.payload : lot;
            });
        },
        removeLot: (state, action) => {
            state.lots = state.lots.filter((lot) => {
                const currentId = lot.idLote || lot.id;
                return currentId !== action.payload;
            });
        },
        setLoading: (state) => {
            state.isLoading = true;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.isLoading = false;
        },
    },
});

export const { loadingLots, addLot, updateLot, removeLot, setLoading, setError } = lotsSlice.actions;