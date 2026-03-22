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

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        } catch (err) {
            setError("Invalid credentials. Please verify your ID or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            bgcolor: 'background.default',
            overflow: 'hidden'
        }}>
            {/* Left Side - Visuals (Hidden on mobile) */}
            {!isMobile && (
                <Grid item md={7} lg={8} sx={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    p: 4
                }}>
                    {/* Animated Background Shapes */}
                    <Box sx={{
                        position: 'absolute',
                        top: '-20%',
                        left: '-20%',
                        width: '70%',
                        height: '70%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                        borderRadius: '50%',
                        animation: 'float 25s infinite ease-in-out alternate'
                    }} />
                    <Box sx={{
                        position: 'absolute',
                        bottom: '-20%',
                        right: '-10%',
                        width: '60%',
                        height: '60%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
                        borderRadius: '50%',
                        animation: 'float 20s infinite ease-in-out alternate-reverse'
                    }} />

                    {/* Content Overlay */}
                    <Fade in timeout={1000}>
                        <Box sx={{ textAlign: 'center', color: 'white', zIndex: 2, maxWidth: '600px' }}>
                            <Box sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(20px)',
                                p: 3,
                                borderRadius: 4,
                                display: 'inline-flex',
                                mb: 4,
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)'
                            }}>
                                <SchoolIcon sx={{ fontSize: 60, color: '#fff' }} />
                            </Box>
                            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-1px' }}>
                                Smart Attendance
                            </Typography>
                            <Typography variant="h5" sx={{ opacity: 0.9, fontWeight: 400, mb: 6 }}>
                                JNTUA College of Engineering Ananthapuramu
                            </Typography>

                            {/* Feature Pills */}
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Box sx={featurePillStyle}>
                                    <SecurityIcon sx={{ fontSize: 20 }} />
                                    <Typography variant="body2" fontWeight="600">Secure Access</Typography>
                                </Box>
                                <Box sx={featurePillStyle}>
                                    <TrendingUpIcon sx={{ fontSize: 20 }} />
                                    <Typography variant="body2" fontWeight="600">Real-time Analytics</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Fade>
                </Grid>
            )}

            {/* Right Side - Login Form */}
            <Grid item xs={12} md={5} lg={4} sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
                position: 'relative',
                zIndex: 1
            }}>
                <Container maxWidth="xs">
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMobile ? 'center' : 'flex-start',
                        width: '100%'
                    }}>
                        {isMobile && (
                            <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        )}

                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                            Welcome back
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5 }}>
                            Please enter your credentials to access the portal.
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
                                        bgcolor: '#FEF2F2',
                                        border: '1px solid #FCA5A5',
                                        color: '#B91C1C',
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

                            <Typography variant="body2" align="center" color="text.secondary">
                                New student? <Box component="span" sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer' }}>Contact Admin</Box>
                            </Typography>
                        </Box>
                    </Box>
                </Container>

                <Box sx={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.disabled">
                        © {new Date().getFullYear()} JNTUA CE Ananthapuramu
                    </Typography>
                </Box>
            </Grid>

            {/* Animation Styles */}
            <style>
                {`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                `}
            </style>
        </Box>
    );
};

const featurePillStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    bgcolor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    px: 2,
    py: 1,
    borderRadius: 50,
    border: '1px solid rgba(255,255,255,0.2)'
};

export default Login;
