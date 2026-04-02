import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    TextField, Button, Container, Typography, Box, Paper, Grid,
    InputAdornment, IconButton, useTheme, useMediaQuery, Fade
} from "@mui/material";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SchoolIcon from '@mui/icons-material/School';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import ThemeToggle from '../components/ThemeToggle';
import GlobalHeader from '../components/GlobalHeader';

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    useMediaQuery(theme.breakpoints.down('md'));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = await loginUser({ username, password });
            login(data.accessToken);

            if (data.firstLogin) {
                navigate("/change-password");
                return;
            }

            // Route based on role
            if (data.role === "STUDENT") navigate("/student");
            else if (data.role === "FACULTY") navigate("/faculty");
            else if (data.role === "HOD") navigate("/hod");
            else if (data.role === "PRINCIPAL") navigate("/principal");
            else if (data.role === "ADMIN") navigate("/admin");
            else navigate("/");
        } catch {
            setError("Invalid credentials. Please verify your ID or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden'
        }}>
            <GlobalHeader showToggle={false} />
            <Box sx={{ position: 'absolute', top: 12, right: 20, zIndex: 1201 }}>
                <ThemeToggle />
            </Box>

            <Container maxWidth="xs" sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                py: 4
            }}>
                <Fade in timeout={800}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: theme.palette.mode === 'dark'
                                ? '0 8px 32px rgba(0,0,0,0.4)'
                                : '0 8px 32px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '100%'
                        }}>
                            <Box sx={{
                                width: 56,
                                height: 56,
                                bgcolor: 'primary.soft',
                                color: 'primary.main',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3,
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)'
                            }}>
                                <PersonOutlineIcon fontSize="large" />
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, textAlign: 'center' }}>
                                Welcome Back
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}>
                                Sign in to your dashboard
                            </Typography>

                            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                                <TextField
                                    label="User ID / Roll Number"
                                    fullWidth
                                    margin="normal"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutlineIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <TextField
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    fullWidth
                                    margin="normal"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlinedIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 1 }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                                    <Typography variant="caption" sx={{
                                        color: 'primary.main',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        '&:hover': { textDecoration: 'underline' }
                                    }}>
                                        Forgot Password?
                                    </Typography>
                                </Box>

                                {error && (
                                    <Fade in>
                                        <Paper sx={{
                                            p: 2,
                                            mb: 3,
                                            bgcolor: 'error.lighter',
                                            border: '1px solid',
                                            borderColor: 'error.light',
                                            color: 'error.dark',
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }} elevation={0}>
                                            <Typography variant="body2" fontWeight="600">{error}</Typography>
                                        </Paper>
                                    </Fade>
                                )}

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{
                                        py: 1.8,
                                        fontSize: '1rem',
                                        boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.4)',
                                        mb: 3
                                    }}
                                >
                                    {loading ? "Signing in..." : "Sign In"}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Fade>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.disabled">
                        © {new Date().getFullYear()} JNTUA CE Ananthapuramu
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Login;
