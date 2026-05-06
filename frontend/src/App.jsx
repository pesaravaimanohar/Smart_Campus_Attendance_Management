import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ColorModeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import CRCDashboard from "./pages/CRCDashboard";
import HODDashboard from "./pages/HODDashboard";
import PrincipalDashboard from "./pages/PrincipalDashboard";
import AdminDashboardNew from "./pages/AdminDashboardNew";
import ChangePassword from "./pages/ChangePassword";
import ProtectedRoute from "./components/ProtectedRoute";

const AppRoutes = () => {
    const { loading } = useAuth();

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    bgcolor: 'background.default'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Login />} />
                <Route path="/change-password" element={<ChangePassword />} />

                <Route
                    path="/student"
                    element={
                        <ProtectedRoute allowedRoles={['STUDENT']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty"
                    element={
                        <ProtectedRoute allowedRoles={['FACULTY', 'HOD', 'PRINCIPAL']}>
                            <FacultyDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/crc"
                    element={
                        <ProtectedRoute allowedRoles={['FACULTY', 'HOD', 'PRINCIPAL']}>
                            <CRCDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/hod"
                    element={
                        <ProtectedRoute allowedRoles={['HOD']}>
                            <HODDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/principal"
                    element={
                        <ProtectedRoute allowedRoles={['PRINCIPAL']}>
                            <PrincipalDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminDashboardNew />
                        </ProtectedRoute>
                    }
                />

                <Route path="/unauthorized" element={<h2 style={{ textAlign: 'center', marginTop: '50px' }}>Unauthorized Access</h2>} />
            </Routes>
        </Router>
    );
};

const App = () => {
    return (
        <ColorModeProvider>
            <CssBaseline />
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </ColorModeProvider>
    );
};

export default App;
