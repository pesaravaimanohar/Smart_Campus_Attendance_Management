import React, { useState, useEffect, useRef } from "react";
import {
    Typography, Button, Paper, Box, Card, CardContent,
    Avatar, CircularProgress, Fade, Chip, IconButton,
    Alert, AlertTitle, Divider, useTheme
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    QrCodeScanner as ScanIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    ArrowBack as BackIcon,
    MyLocation as LocationIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    AccessTime as TimeIcon,
    Warning as WarningIcon,
    CameraAlt as CameraIcon,
    Refresh as RefreshIcon
} from "@mui/icons-material";
import { Html5Qrcode } from "html5-qrcode";
import { markQrAttendance, getSessionInfoByQr } from "../services/api";
import { useAuth } from "../context/AuthContext";
import GlobalHeader from "../components/GlobalHeader";

const ScanAttendance = ({ onBack }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [scanning, setScanning] = useState(false);
    const [scannedToken, setScannedToken] = useState(null);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const html5QrCodeRef = useRef(null);
    const scannerContainerRef = useRef(null);

    // Get user location
    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
                return;
            }
            setLocationLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    setUserLocation(loc);
                    setLocationLoading(false);
                    resolve(loc);
                },
                (err) => {
                    setLocationLoading(false);
                    reject(new Error("Location access denied. Please enable location services."));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };

    // Start QR Scanner
    const startScanner = async () => {
        setError(null);
        setResult(null);
        setScannedToken(null);
        setSessionInfo(null);
        setScanning(true);

        try {
            // Get location first
            await getUserLocation();
        } catch (e) {
            setError(e.message);
            setScanning(false);
            return;
        }

        // Wait for DOM to render the scanner container
        setTimeout(() => {
            try {
                const html5QrCode = new Html5Qrcode("qr-reader");
                html5QrCodeRef.current = html5QrCode;

                html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                    },
                    async (decodedText) => {
                        // QR scanned successfully
                        await html5QrCode.stop();
                        html5QrCodeRef.current = null;
                        setScanning(false);
                        handleQrScanned(decodedText);
                    },
                    (errorMessage) => {
                        // parse error - ignore
                    }
                ).catch((err) => {
                    setError("Failed to start camera. Please ensure camera permissions are granted.");
                    setScanning(false);
                });
            } catch (e) {
                setError("Failed to initialize scanner: " + e.message);
                setScanning(false);
            }
        }, 500);
    };

    // Stop QR Scanner
    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
            } catch (e) {
                // ignore
            }
            html5QrCodeRef.current = null;
        }
        setScanning(false);
    };

    // Handle scanned QR code
    const handleQrScanned = async (qrText) => {
        setLoading(true);
        setError(null);

        try {
            // The QR code contains the qrToken directly
            const qrToken = qrText.trim();
            setScannedToken(qrToken);

            // Fetch session info
            const info = await getSessionInfoByQr(qrToken);
            setSessionInfo(info);
        } catch (e) {
            const msg = e.response?.data?.message || e.message || "Invalid QR code";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Mark attendance
    const handleMarkAttendance = async () => {
        if (!scannedToken || !userLocation) return;

        setLoading(true);
        setError(null);

        try {
            const response = await markQrAttendance({
                qrToken: scannedToken,
                latitude: userLocation.latitude,
                longitude: userLocation.longitude
            });

            setResult(response);
        } catch (e) {
            const msg = e.response?.data?.message || e.message || "Failed to mark attendance";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(() => { });
            }
        };
    }, []);

    // Reset to scan again
    const resetScan = () => {
        setScannedToken(null);
        setSessionInfo(null);
        setResult(null);
        setError(null);
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <Box sx={{
                p: 2,
                px: 3,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <IconButton onClick={onBack} color="primary" size="large">
                    <BackIcon />
                </IconButton>
                <ScanIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h6" fontWeight="800">Scan QR Code</Typography>
                    <Typography variant="caption" color="text.secondary">Mark your attendance by scanning the class QR</Typography>
                </Box>
            </Box>

            <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, maxWidth: 600, mx: 'auto', width: '100%' }}>
                {/* INITIAL STATE - Show scan button */}
                {!scanning && !scannedToken && !result && (
                    <Fade in timeout={400}>
                        <Box>
                            <Card sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Box sx={{
                                    p: 6,
                                    textAlign: 'center',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                    color: 'white'
                                }}>
                                    <Avatar sx={{
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        width: 80,
                                        height: 80,
                                        mx: 'auto',
                                        mb: 3,
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <CameraIcon sx={{ fontSize: 40 }} />
                                    </Avatar>
                                    <Typography variant="h4" fontWeight="800" gutterBottom>
                                        Ready to Scan
                                    </Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>
                                        Point your camera at the QR code displayed by your faculty to mark attendance.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={startScanner}
                                        startIcon={<ScanIcon />}
                                        sx={{
                                            py: 2,
                                            px: 6,
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            borderRadius: 3,
                                            bgcolor: 'white',
                                            color: theme.palette.primary.main,
                                            '&:hover': {
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                            },
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        Open Scanner
                                    </Button>
                                </Box>

                                <Box sx={{ p: 3 }}>
                                    <Typography variant="subtitle2" fontWeight="700" color="text.secondary" gutterBottom>
                                        HOW IT WORKS
                                    </Typography>
                                    <Box display="flex" gap={2} alignItems="center" mb={2}>
                                        <Chip label="1" size="small" color="primary" />
                                        <Typography variant="body2">Faculty starts an attendance session and displays a QR code</Typography>
                                    </Box>
                                    <Box display="flex" gap={2} alignItems="center" mb={2}>
                                        <Chip label="2" size="small" color="primary" />
                                        <Typography variant="body2">You scan the QR code using your phone camera</Typography>
                                    </Box>
                                    <Box display="flex" gap={2} alignItems="center">
                                        <Chip label="3" size="small" color="primary" />
                                        <Typography variant="body2">Your location is verified and attendance is marked</Typography>
                                    </Box>
                                </Box>
                            </Card>

                            {error && (
                                <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
                                    <AlertTitle>Error</AlertTitle>
                                    {error}
                                </Alert>
                            )}
                        </Box>
                    </Fade>
                )}

                {/* SCANNING STATE - Camera active */}
                {scanning && (
                    <Fade in timeout={400}>
                        <Card sx={{
                            borderRadius: 4,
                            overflow: 'hidden',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Box sx={{
                                p: 2,
                                bgcolor: isDark ? alpha(theme.palette.common.black, 0.8) : '#1a1a2e',
                                color: 'white',
                                textAlign: 'center'
                            }}>
                                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                                    <Box sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: theme.palette.error.main,
                                        animation: 'pulse 1.5s infinite',
                                        '@keyframes pulse': {
                                            '0%': { opacity: 1 },
                                            '50%': { opacity: 0.3 },
                                            '100%': { opacity: 1 }
                                        }
                                    }} />
                                    <Typography variant="subtitle2" fontWeight="700" letterSpacing={1}>
                                        SCANNING...
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                    Position the QR code within the frame
                                </Typography>
                            </Box>

                            {/* Scanner container */}
                            <Box sx={{
                                position: 'relative',
                                bgcolor: theme.palette.common.black,
                                '& #qr-reader': {
                                    border: 'none !important',
                                    '& video': {
                                        borderRadius: 0,
                                    }
                                },
                                '& #qr-reader__scan_region': {
                                    minHeight: 300,
                                },
                                '& #qr-reader__dashboard': {
                                    display: 'none !important'
                                }
                            }}>
                                <div id="qr-reader" ref={scannerContainerRef}></div>
                            </Box>

                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={stopScanner}
                                    size="large"
                                    fullWidth
                                    sx={{ fontWeight: 700, borderRadius: 3 }}
                                >
                                    Cancel Scan
                                </Button>
                            </Box>
                        </Card>
                    </Fade>
                )}

                {/* LOADING STATE */}
                {loading && !result && (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                        <CircularProgress size={48} sx={{ mb: 2 }} />
                        <Typography variant="body1" fontWeight="600" color="text.secondary">
                            {sessionInfo ? "Marking attendance..." : "Loading session info..."}
                        </Typography>
                    </Box>
                )}

                {/* SESSION INFO - Confirm before marking */}
                {sessionInfo && !result && !loading && (
                    <Fade in timeout={400}>
                        <Box>
                            <Card sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Box sx={{
                                    p: 3,
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                                    color: 'white',
                                    textAlign: 'center'
                                }}>
                                    <CheckCircleIcon sx={{ fontSize: 48, mb: 1 }} />
                                    <Typography variant="h5" fontWeight="800">QR Code Verified</Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Confirm the session details below
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                                        <Avatar sx={{ bgcolor: 'primary.light', width: 44, height: 44 }}>
                                            <SchoolIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight="600">SUBJECT</Typography>
                                            <Typography variant="subtitle1" fontWeight="700">
                                                {sessionInfo.subjectName}
                                                <Chip label={sessionInfo.subjectCode} size="small" sx={{ ml: 1 }} />
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                                        <Avatar sx={{ bgcolor: 'secondary.light', width: 44, height: 44 }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight="600">FACULTY</Typography>
                                            <Typography variant="subtitle1" fontWeight="700">{sessionInfo.facultyName}</Typography>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                                        <Avatar sx={{ bgcolor: 'info.light', width: 44, height: 44 }}>
                                            <TimeIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight="600">CLASS</Typography>
                                            <Typography variant="subtitle1" fontWeight="700">{sessionInfo.className}</Typography>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    {userLocation && (
                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                            <Avatar sx={{ bgcolor: 'success.light', width: 44, height: 44 }}>
                                                <LocationIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="600">YOUR LOCATION</Typography>
                                                <Typography variant="body2" fontWeight="600">
                                                    {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>

                                <Box sx={{ p: 3, pt: 0 }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        onClick={handleMarkAttendance}
                                        startIcon={<CheckCircleIcon />}
                                        sx={{
                                            py: 2,
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            borderRadius: 3,
                                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                            boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                                            mb: 1.5
                                        }}
                                    >
                                        Confirm & Mark Attendance
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        fullWidth
                                        onClick={resetScan}
                                        sx={{ fontWeight: 600, borderRadius: 3 }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Card>

                            {error && (
                                <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
                                    <AlertTitle>Error</AlertTitle>
                                    {error}
                                </Alert>
                            )}
                        </Box>
                    </Fade>
                )}

                {/* RESULT STATE */}
                {result && (
                    <Fade in timeout={400}>
                        <Box>
                            <Card sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Box sx={{
                                    p: 5,
                                    textAlign: 'center',
                                    background: result.status === 'PRESENT'
                                        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                        : result.status === 'REJECTED'
                                            ? 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'
                                            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white'
                                }}>
                                    {result.status === 'PRESENT' ? (
                                        <CheckCircleIcon sx={{ fontSize: 72, mb: 2 }} />
                                    ) : (
                                        <CancelIcon sx={{ fontSize: 72, mb: 2 }} />
                                    )}

                                    <Typography variant="h4" fontWeight="800" gutterBottom>
                                        {result.status === 'PRESENT' ? 'Attendance Marked!' : 'Attendance Rejected'}
                                    </Typography>

                                    <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                                        {result.message}
                                    </Typography>

                                    {result.subjectName && (
                                        <Chip
                                            label={result.subjectName}
                                            sx={{
                                                mt: 2,
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '0.95rem'
                                            }}
                                        />
                                    )}
                                </Box>

                                <Box sx={{ p: 3 }}>
                                    <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mb={2}>
                                        {result.timestamp && `Recorded at: ${new Date(result.timestamp).toLocaleString()}`}
                                    </Typography>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        onClick={onBack}
                                        sx={{
                                            py: 1.5,
                                            fontWeight: 700,
                                            borderRadius: 3,
                                            mb: 1
                                        }}
                                    >
                                        Back to Dashboard
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        size="large"
                                        fullWidth
                                        onClick={resetScan}
                                        startIcon={<RefreshIcon />}
                                        sx={{ fontWeight: 600, borderRadius: 3 }}
                                    >
                                        Scan Another QR
                                    </Button>
                                </Box>
                            </Card>
                        </Box>
                    </Fade>
                )}

                {/* Error only state (no session info) */}
                {error && !sessionInfo && !scanning && !result && !loading && scannedToken && (
                    <Alert
                        severity="error"
                        sx={{ mt: 2, borderRadius: 3 }}
                        action={
                            <Button color="inherit" size="small" onClick={resetScan}>
                                Try Again
                            </Button>
                        }
                    >
                        <AlertTitle>Scan Failed</AlertTitle>
                        {error}
                    </Alert>
                )}
            </Box>
        </Box>
    );
};

export default ScanAttendance;
