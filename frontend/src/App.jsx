import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "./store/authSlice";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

// A simple protected route wrapper
const ProtectedRoute = ({ children }) => {
    const { user, initialized } = useSelector((state) => state.auth);

    if (!initialized) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#08090f] text-white">
                <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-2xl shadow-xl shadow-purple-500/20">
                    ✦
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Loading CortexAI Workspace...
                </p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        // Attempt to fetch current user on mount to restore session after page refresh
        dispatch(getCurrentUser());
    }, [dispatch]);

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;