import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../services/api";

// GET CURRENT USER

export const getCurrentUser = createAsyncThunk(
    "auth/getCurrentUser",
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get("/auth/me");

            return response.data.user;

        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                "Unable to get current user"
            );
        }
    }
);

// LOGIN
export const loginUser = createAsyncThunk(
    "auth/login",
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await api.post(
                "/auth/login",
                credentials
            );

            return response.data.user;

        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                "Login failed"
            );
        }
    }
);


// REGISTER
export const registerUser = createAsyncThunk(
    "auth/register",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post(
                "/auth/register",
                userData
            );

            return response.data.user;

        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                "Registration failed"
            );
        }
    }
);


// LOGOUT

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            await api.post("/auth/logout");

            return true;

        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                "Logout failed"
            );
        }
    }
);


// INITIAL STATE

const initialState = {
    user: null,
    loading: false,
    initialized: false,
    error: null,
};


// SLICE


const authSlice = createSlice({
    name: "auth",

    initialState,

    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {

        // GET CURRENT USER

        builder
            .addCase(getCurrentUser.pending, (state) => {
                state.loading = true;
            })

            .addCase(getCurrentUser.fulfilled, (state, action) => {
                state.loading = false;
                state.initialized = true;
                state.user = action.payload;
                state.error = null;
            })

            .addCase(getCurrentUser.rejected, (state) => {
                state.loading = false;
                state.initialized = true;
                state.user = null;
            });


        // LOGIN
  
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.error = null;
            })

            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });


        // REGISTER
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.error = null;
            })

            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // LOGOUT

        builder
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.loading = false;
                state.error = null;
            })

            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;