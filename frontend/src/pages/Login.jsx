import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography, Box, Paper, Grid, InputAdornment } from "@mui/material";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SchoolIcon from '@mui/icons-material/School';

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await loginUser({ username, password });
            login(data.accessToken);
            // Route based on role
            if (data.role === "STUDENT") navigate("/student");
            else if (data.role === "FACULTY") navigate("/faculty");
            else if (data.role === "HOD") navigate("/hod");
            else if (data.role === "PRINCIPAL") navigate("/principal");
            else if (data.role === "ADMIN") navigate("/admin");
            else navigate("/");
        } catch (err) {
            setError("Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="md" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Grid container sx={{ boxShadow: 3, borderRadius: 4, overflow: 'hidden', bgcolor: 'background.paper' }}>
                {/* Left Side - Image/Branding */}
                <Grid item xs={12} md={6} sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4
                }}>
                    <SchoolIcon sx={{ fontSize: 80, mb: 2 }} />
                    <Typography variant="h4" fontWeight="bold">Smart Campus</Typography>
                    <Typography variant="subtitle1" textAlign="center" sx={{ mt: 2, opacity: 0.8 }}>
                        Seamless Attendance Management & Academic Tracking
                    </Typography>
                </Grid>

                {/* Right Side - Form */}
                <Grid item xs={12} md={6} sx={{ p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography component="h1" variant="h5" fontWeight="bold" color="textPrimary">
                        Welcome Back
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        Please sign in to continue
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Student ID / Employee ID"
                            name="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        {error && (
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                {error}
                            </Typography>
                        )}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Login;
