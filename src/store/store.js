import {configureStore} from "@reduxjs/toolkit";
import { usersSlice } from "./slices/users/usersSlice";
import { authSlice } from "./slices/auth/authSlice";
import { productsSlice } from "./slices/products/productsSlice";
import { lotsSlice } from "./slices/products/lotsSlice";

export const store = configureStore({
    reducer: {
        users: usersSlice.reducer,
        auth: authSlice.reducer,
        products: productsSlice.reducer,
        lots: lotsSlice.reducer,

    }
})