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
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decorative elements */}
            <Box sx={{
                position: 'absolute',
                top: -100, right: -100,
                width: 600, height: 600,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />
            
            {/* Theme Toggle */}
            <Box sx={{ position: 'absolute', top: 24, right: 32, zIndex: 1201 }}>
                <ThemeToggle />
            </Box>

            <Grid container sx={{ flexGrow: 1 }}>
                {/* Left Panel - Branding & Info (Hidden on Mobile) */}
                {!isMobile && (
                    <Grid item md={5} lg={4} sx={{
                        bgcolor: alpha(theme.palette.background.paper, 0.4),
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        p: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        backdropFilter: 'blur(20px)',
                        zIndex: 2
                    }}>
                        <Fade in timeout={1000}>
                            <Box>
                                <Box display="flex" alignItems="center" gap={2} mb={6}>
                                    <Box sx={{
                                        width: 48, height: 48,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        borderRadius: '14px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white',
                                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                                    }}>
                                        <SchoolIcon fontSize="medium" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                            JNTUA
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                            University Campus
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="h3" fontWeight={900} sx={{
                                    mb: 2,
                                    background: isDark
                                        ? 'linear-gradient(135deg, #FFF 0%, #cbd5e1 100%)'
                                        : 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    lineHeight: 1.1,
                                    fontSize: '2.5rem'
                                }}>
                                    The Future of Attendance Tracking
                                </Typography>

                                <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 380, opacity: 0.8, lineHeight: 1.6 }}>
                                    Streamline your academic workflow with location-verified QR scanning and real-time analytics.
                                </Typography>

                                <Stack spacing={3}>
                                    {features.map((f, i) => (
                                        <Fade in timeout={1200 + i * 200} key={i}>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Box sx={{
                                                    width: 40, height: 40, borderRadius: '10px',
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'primary.main', flexShrink: 0,
                                                }}>
                                                    {f.icon}
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700}>{f.title}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.5 }}>{f.desc}</Typography>
                                                </Box>
                                            </Box>
                                        </Fade>
                                    ))}
                                </Stack>
                            </Box>
                        </Fade>
                    </Grid>
                )}

                {/* Main Content Area - Form in Center */}
                <Grid item xs={12} md={7} lg={8} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 2, md: 4 }
                }}>
                    <Fade in timeout={800}>
                        <Box sx={{ width: '100%', maxWidth: 460 }}>
                            {/* Mobile Header (Hidden on Desktop) */}
                            {isMobile && (
                                <Box sx={{ textAlign: 'center', mb: 4 }}>
                                     <Box sx={{
                                        width: 56, height: 56,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        borderRadius: '16px',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', mb: 2
                                    }}>
                                        <SchoolIcon fontSize="large" />
                                    </Box>
                                    <Typography variant="h5" fontWeight={900}>JNTUA Smart Attendance</Typography>
                                </Box>
                            )}

                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 4, md: 6 },
                                    borderRadius: 5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    boxShadow: isDark
                                        ? '0 24px 64px rgba(0,0,0,0.4)'
                                        : '0 24px 64px rgba(0,0,0,0.06)',
                                    position: 'relative',
                                }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '100%',
                                }}>
                                    <Box sx={{
                                        width: 56, height: 56,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: 'primary.main',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 3,
                                    }}>
                                        <PersonOutlineIcon fontSize="large" />
                                    </Box>

                                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, textAlign: 'center' }}>
                                        Sign In
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 5, textAlign: 'center' }}>
                                        Enter your credentials to access your dashboard
                                    </Typography>

                                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                                        <Stack spacing={2.5}>
                                            <TextField
                                                label="User ID / Roll Number"
                                                fullWidth
                                                variant="outlined"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PersonOutlineIcon color="primary" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                            />

                                            <TextField
                                                label="Password"
                                                type={showPassword ? "text" : "password"}
                                                fullWidth
                                                variant="outlined"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <LockOutlinedIcon color="primary" />
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                edge="end"
                                                                size="small"
                                                            >
                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                            />
                                        </Stack>

                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5, mb: 4 }}>
                                            <Typography variant="caption" sx={{
                                                color: 'primary.main',
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                                '&:hover': { textDecoration: 'underline' }
                                            }}>
                                                Forgot Password?
                                            </Typography>
                                        </Box>

                                        {error && (
                                            <Fade in>
                                                <Box sx={{
                                                    p: 1.5, mb: 3,
                                                    bgcolor: alpha(theme.palette.error.main, 0.08),
                                                    border: '1px solid',
                                                    borderColor: alpha(theme.palette.error.main, 0.2),
                                                    color: 'error.main',
                                                    borderRadius: 2.5,
                                                    textAlign: 'center'
                                                }}>
                                                    <Typography variant="caption" fontWeight="700">{error}</Typography>
                                                </Box>
                                            </Fade>
                                        )}

                                        <Button
                                            type="submit"
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            disabled={loading || !username || !password}
                                            sx={{
                                                py: 2,
                                                fontSize: '1rem',
                                                fontWeight: 800,
                                                borderRadius: 3,
                                                textTransform: 'none',
                                                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                                                '&:hover': {
                                                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
                                                }
                                            }}
                                        >
                                            {loading ? "Verifying..." : "Sign In to Dashboard"}
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                            
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 4, textAlign: 'center', opacity: 0.7 }}>
                                 JNTUA College of Engineering Ananthapuramu — System v2.0
                            </Typography>
                        </Box>
                    </Fade>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Login;
