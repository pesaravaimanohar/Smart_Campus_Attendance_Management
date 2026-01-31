import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import HODDashboard from "./pages/HODDashboard";
import PrincipalDashboard from "./pages/PrincipalDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Login />} />

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
                <ProtectedRoute allowedRoles={['FACULTY']}>
                  <FacultyDashboard />
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
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="/unauthorized" element={<h2 style={{ textAlign: 'center', marginTop: '50px' }}>Unauthorized Access</h2>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
