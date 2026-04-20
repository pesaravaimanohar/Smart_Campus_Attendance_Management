import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    TextField, Button, Container, Typography, Box, Paper, Grid,
    InputAdornment, IconButton, useTheme, useMediaQuery, Fade, Stack
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SchoolIcon from '@mui/icons-material/School';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ThemeToggle from '../components/ThemeToggle';

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
    const isDark = theme.palette.mode === 'dark';

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

    const features = [
        { icon: <QrCodeScannerIcon />, title: "QR Attendance", desc: "Scan & mark in seconds" },
        { icon: <LocationOnIcon />, title: "Geo-Fenced", desc: "Location-verified marking" },
        { icon: <VerifiedUserIcon />, title: "Real-time Tracking", desc: "Live attendance analytics" },
    ];

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decorative elements */}
            <Box sx={{
                position: 'absolute',
                top: -100, right: -100,
                width: 400, height: 400,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: -150, left: -150,
                width: 500, height: 500,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {/* Theme Toggle */}
            <Box sx={{ position: 'absolute', top: 16, right: 20, zIndex: 1201 }}>
                <ThemeToggle />
            </Box>

            {/* Main Content */}
            <Container maxWidth="lg" sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4
            }}>
                <Grid container spacing={6} alignItems="center" justifyContent="center">
                    {/* Left Side - Branding (hidden on mobile) */}
                    {!isMobile && (
                        <Grid item md={6}>
                            <Fade in timeout={1000}>
                                <Box>
                                    <Box display="flex" alignItems="center" gap={2} mb={4}>
                                        <Box sx={{
                                            width: 56, height: 56,
                                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                            borderRadius: '16px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white',
                                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                                        }}>
                                            <SchoolIcon fontSize="large" />
                                        </Box>
                                        <Box>
                                            <Typography variant="h5" fontWeight={800} color="text.primary" lineHeight={1.2}>
                                                JNTUA College of Engineering
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                Ananthapuramu
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant="h3" fontWeight={900} sx={{
                                        mb: 2,
                                        background: isDark
                                            ? 'linear-gradient(135deg, #F1F5F9 0%, #818CF8 50%, #A78BFA 100%)'
                                            : 'linear-gradient(135deg, #111827 0%, #4F46E5 50%, #7C3AED 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        lineHeight: 1.2,
                                    }}>
                                        Smart Attendance System
                                    </Typography>

                                    <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ mb: 4, lineHeight: 1.6 }}>
                                        QR-based, geo-fenced attendance tracking for the modern campus.
                                        Fast, reliable, and accurate.
                                    </Typography>

                                    {/* Feature pills */}
                                    <Stack spacing={2}>
                                        {features.map((f, i) => (
                                            <Fade in timeout={1200 + i * 200} key={i}>
                                                <Box display="flex" alignItems="center" gap={2} sx={{
                                                    p: 2, borderRadius: 3,
                                                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
                                                    border: '1px solid',
                                                    borderColor: alpha(theme.palette.primary.main, 0.1),
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06),
                                                        transform: 'translateX(4px)',
                                                    }
                                                }}>
                                                    <Box sx={{
                                                        width: 44, height: 44, borderRadius: '12px',
                                                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.1),
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'primary.main', flexShrink: 0,
                                                    }}>
                                                        {f.icon}
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={700}>{f.title}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{f.desc}</Typography>
                                                    </Box>
                                                </Box>
                                            </Fade>
                                        ))}
                                    </Stack>
                                </Box>
                            </Fade>
                        </Grid>
                    )}

                    {/* Right Side - Login Form */}
                    <Grid item xs={12} md={5}>
                        <Fade in timeout={800}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 3, sm: 4 },
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    boxShadow: isDark
                                        ? '0 16px 64px rgba(0,0,0,0.4)'
                                        : '0 16px 64px rgba(0,0,0,0.06)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Gradient accent line at top */}
                                <Box sx={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                }} />

                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '100%',
                                    pt: 1,
                                }}>
                                    {/* Mobile logo */}
                                    {isMobile && (
                                        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                            <Box sx={{
                                                width: 44, height: 44,
                                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                borderRadius: '12px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white',
                                            }}>
                                                <SchoolIcon />
                                            </Box>
                                            <Typography variant="h6" fontWeight={800}>JNTUA CEA</Typography>
                                        </Box>
                                    )}

                                    <Box sx={{
                                        width: 56, height: 56,
                                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
                                        color: 'primary.main',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 3,
                                        boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                                    }}>
                                        <PersonOutlineIcon fontSize="large" />
                                    </Box>

                                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5, textAlign: 'center' }}>
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
                                            autoComplete="username"
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
                                                            size="small"
                                                        >
                                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ mb: 1 }}
                                            autoComplete="current-password"
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
                                                    p: 1.5,
                                                    mb: 3,
                                                    bgcolor: alpha(theme.palette.error.main, isDark ? 0.15 : 0.06),
                                                    border: '1px solid',
                                                    borderColor: alpha(theme.palette.error.main, 0.3),
                                                    color: 'error.main',
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
                                            disabled={loading || !username || !password}
                                            sx={{
                                                py: 1.8,
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                borderRadius: 3,
                                                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
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
                                © {new Date().getFullYear()} JNTUA CE Ananthapuramu — Smart Attendance System
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Login;
