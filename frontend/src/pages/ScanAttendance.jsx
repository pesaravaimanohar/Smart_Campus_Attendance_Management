import React, { useState, useEffect, useRef } from "react";
import {
    Typography, Button, Box, Card, CardContent,
    Avatar, CircularProgress, Fade, Chip, IconButton,
    Alert, AlertTitle, Divider, useTheme, Stack, TextField, Grid
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
    Refresh as RefreshIcon,
    ErrorOutline as ErrorIcon,
    CheckCircleOutline as ApproveIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Timer as TimerIcon
} from "@mui/icons-material";
import { Html5Qrcode } from "html5-qrcode";
import { markQrAttendance, getSessionInfoByQr } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ScanAttendance = ({ onBack }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // UI state
    const [scanning, setScanning] = useState(false);
    const [scannedToken, setScannedToken] = useState(null);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [manualToken, setManualToken] = useState("");

    // Refs
    const html5QrCodeRef = useRef(null);

    // Get user location
    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                const err = "Geolocation is not supported by your browser";
                setError(err);
                reject(new Error(err));
                return;
            }

            console.log("Fetching user location...");
            setLocationLoading(true);
            
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    console.log("Location fetched:", loc);
                    setUserLocation(loc);
                    setLocationLoading(false);
                    resolve(loc);
                },
                (err) => {
                    console.error("Location error:", err);
                    setLocationLoading(false);
                    let msg = "Location access denied. Please enable location services.";
                    if (err.code === 3) msg = "Location request timed out. Using default (0,0) for testing.";
                    
                    // ON LOCALHOST: Allow fallback if location fails
                    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
                        console.log("On localhost, bypassing location error for testing.");
                        const fallbackLoc = { latitude: 0, longitude: 0 };
                        setUserLocation(fallbackLoc);
                        resolve(fallbackLoc);
                    } else {
                        setError(msg);
                        reject(new Error(msg));
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };

    // Start QR Scanner
    const startScanner = async () => {
        console.log("Starting scanner sequence...");
        setError(null);
        setResult(null);
        setScannedToken(null);
        setSessionInfo(null);
        setScanning(true);

        try {
            // Get location first (can take time)
            await getUserLocation();
        } catch (e) {
            console.error("Scanner sequence halted at location step:", e);
            setScanning(false);
            return;
        }

        // Delay to ensure DOM is ready for Html5Qrcode
        setTimeout(async () => {
            try {
                if (!document.getElementById("qr-reader")) {
                    console.error("qr-reader element not found in DOM");
                    setScanning(false);
                    return;
                }
                
                const html5QrCode = new Html5Qrcode("qr-reader");
                html5QrCodeRef.current = html5QrCode;

                const config = { fps: 15, qrbox: { width: 250, height: 250 } };
                
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    onScanFailure
                );
                console.log("Scanner running...");
            } catch (err) {
                console.error("Scanner start error:", err);
                setError("Camera access failed. Ensure you have granted permissions and are using localhost.");
                setScanning(false);
            }
        }, 500);
    };

    // Success Callback
    const onScanSuccess = async (decodedText) => {
        console.log("QR scanned! Value:", decodedText);
        await stopScanner();
        setScannedToken(decodedText);
        handleFetchSessionInfo(decodedText);
    };

    const handleFetchSessionInfo = async (token) => {
        setLoading(true);
        setError(null);
        try {
            // Simultaneously fetch session info and location if not already available
            const [info] = await Promise.all([
                getSessionInfoByQr(token),
                !userLocation ? getUserLocation().catch(e => console.warn("Background location fetch failed:", e)) : Promise.resolve(null)
            ]);
            
            setSessionInfo(info);
            console.log("Session info loaded:", info);
        } catch (e) {
            console.error("Session info fetch error:", e);
            setError(e.response?.data?.message || e.message || "Invalid QR Code or Session no longer active.");
            setScannedToken(null);
        } finally {
            setLoading(false);
        }
    };

    const onScanFailure = (error) => {
        // Just ignore failures unless it's a serious error
    };

    // Mark attendance
    const handleMarkAttendance = async () => {
        if (!scannedToken) {
            setError("Missing QR token. Please scan again.");
            return;
        }

        let currentLoc = userLocation;
        
        // If location is missing, try fetching it one last time
        if (!currentLoc) {
            setLoading(true);
            try {
                console.log("Location missing on submit, retrying...");
                currentLoc = await getUserLocation();
            } catch (e) {
                setError("Location verification is required to mark attendance. Please enable GPS and try again.");
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        setError(null);
        try {
            console.log("Marking attendance...");
            const response = await markQrAttendance({
                qrToken: scannedToken,
                latitude: currentLoc.latitude,
                longitude: currentLoc.longitude
            });
            console.log("Marking response:", response);
            setResult(response);
        } catch (e) {
            console.error("Attendance mark error:", e);
            setError(e.response?.data?.message || e.message || "Verification failed. Check your range.");
        } finally {
            setLoading(false);
        }
    };

    // Stop QR Scanner
    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                await html5QrCodeRef.current.clear();
            } catch (e) {
                console.warn("Scanner stop warning:", e);
            }
            html5QrCodeRef.current = null;
        }
        setScanning(false);
    };

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(() => { });
            }
        };
    }, []);

    // Reset to scan again
    const onCancel = () => {
        stopScanner();
        setError(null);
        setScannedToken(null);
        setSessionInfo(null);
        setManualToken("");
    };

    const handleManualSubmit = () => {
        if (!manualToken.trim()) return;
        const cleanToken = manualToken.trim();
        setScannedToken(cleanToken);
        handleFetchSessionInfo(cleanToken);
    };

    return (
        <Box sx={{ maxWidth: 600, mx: "auto", py: 2 }}>
            <Fade in timeout={500}>
                <Box>
                    {/* Header Details */}
                    <Box display="flex" alignItems="center" mb={3} gap={1}>
                        <IconButton onClick={onBack} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                            <BackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>Scan Attendance</Typography>
                            <Typography variant="caption" color="text.secondary">Place the QR code inside the frame</Typography>
                        </Box>
                    </Box>

                    {/* LANDING STATE (Ready to scan) */}
                    {!scanning && !scannedToken && !result && (
                        <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                            <Box sx={{
                                p: 4, textAlign: 'center',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`
                            }}>
                                <Box sx={{
                                    width: 120, height: 120, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
                                    position: 'relative'
                                }}>
                                    <ScanIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                                    <Box sx={{
                                        position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
                                        border: `2px dashed ${theme.palette.primary.main}`,
                                        animation: 'spin 10s linear infinite',
                                        '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                                    }} />
                                </Box>

                                <Typography variant="h6" fontWeight={800} gutterBottom>Ready to Scan</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, px: 2 }}>
                                    Please ensure you are near the classroom and your camera permissions are enabled.
                                </Typography>

                                <Stack spacing={2}>
                                    <Button
                                        variant="contained" size="large" onClick={startScanner} startIcon={<ScanIcon />}
                                        disabled={locationLoading}
                                        sx={{
                                            borderRadius: 3, py: 1.8, fontSize: '1.1rem', fontWeight: 700,
                                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        }}
                                    >
                                        {locationLoading ? "Fetching Location..." : "Open Scanner"}
                                    </Button>

                                    <Divider sx={{ my: 1 }}> <Typography variant="caption" color="text.disabled">OR ENTER CODE</Typography> </Divider>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            fullWidth size="small" placeholder="Enter session token..."
                                            value={manualToken} onChange={(e) => setManualToken(e.target.value)}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                        <Button
                                            variant="outlined" onClick={handleManualSubmit} disabled={!manualToken}
                                            sx={{ borderRadius: 2, fontWeight: 700 }}
                                        >
                                            Next
                                        </Button>
                                    </Box>
                                </Stack>
                            </Box>

                            {error && (
                                <Box sx={{ p: 2 }}>
                                    <Alert severity="error" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'error.light' }}>
                                        <AlertTitle>Problem Encountered</AlertTitle>
                                        {error}
                                    </Alert>
                                </Box>
                            )}

                            <Box sx={{ p: 3, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" fontWeight={800} gutterBottom>How it works</Typography>
                                <Stack spacing={1.5}>
                                    {[
                                        { icon: <LocationIcon sx={{ fontSize: 18 }} />, text: "Your location is verified to ensure you are in class" },
                                        { icon: <TimerIcon sx={{ fontSize: 18 }} />, text: "Scan the rolling QR code shown on faculty board" },
                                        { icon: <PersonIcon sx={{ fontSize: 18 }} />, text: "Attendance is instantly updated in your portal" }
                                    ].map((item, i) => (
                                        <Box key={i} display="flex" gap={1.5} alignItems="center">
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                                {item.icon}
                                            </Avatar>
                                            <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Card>
                    )}

                    {/* SCANNING STATE */}
                    {scanning && (
                        <Fade in timeout={400}>
                            <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', position: 'relative' }}>
                                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <CircularProgress size={16} thickness={6} />
                                        <Typography variant="subtitle2" fontWeight={800}>SCANNING...</Typography>
                                    </Box>
                                    <IconButton size="small" onClick={onCancel}><CloseIcon /></IconButton>
                                </Box>

                                <Box sx={{ position: 'relative', bgcolor: 'black', minHeight: 400 }}>
                                    <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>
                                    
                                    {/* Overlay for scan frame */}
                                    <Box sx={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        pointerEvents: 'none', zIndex: 1
                                    }}>
                                        <Box sx={{
                                            width: 260, height: 260, border: '2px solid rgba(255,255,255,0.3)',
                                            borderRadius: 2, position: 'relative',
                                            '&::before, &::after, .corner': {
                                                content: '""', position: 'absolute', width: 20, height: 20,
                                                borderColor: theme.palette.primary.main, borderStyle: 'solid'
                                            },
                                            '&::before': { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderBottomWidth: 0, borderRightWidth: 0 },
                                            '&::after': { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderBottomWidth: 0, borderLeftWidth: 0 },
                                        }}>
                                            <Box className="corner" sx={{ bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderTopWidth: 0, borderRightWidth: 0 }} />
                                            <Box className="corner" sx={{ bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderTopWidth: 0, borderLeftWidth: 0 }} />
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ p: 2.5, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Align the faculty QR code within the highlighted box.
                                    </Typography>
                                    <Button variant="text" color="primary" onClick={onCancel} sx={{ mt: 1, fontWeight: 700 }}>
                                        Cancel & Enter Manually
                                    </Button>
                                </Box>
                            </Card>
                        </Fade>
                    )}

                    {/* DATA ENRICHED - SESSION INFO FOUND */}
                    {scannedToken && sessionInfo && !result && !error && (
                        <Fade in timeout={400}>
                            <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'primary.light' }}>
                                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="caption" color="primary.main" fontWeight={800}>SESSION IDENTIFIED</Typography>
                                    <Typography variant="h5" fontWeight={800}>{sessionInfo.subjectName}</Typography>
                                    <Typography variant="body2" color="text.secondary">{sessionInfo.className} • {sessionInfo.facultyName}</Typography>
                                </Box>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack spacing={2.5}>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                                                <TimerIcon />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={800}>Access Time</Typography>
                                                <Typography variant="body2" color="text.secondary">Valid until {new Date(sessionInfo.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}>
                                                <LocationIcon />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={800}>Location Verification</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {locationLoading ? 'Updating GPS location...' : (userLocation ? `Detected: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'Waiting for GPS...')}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 2, pt: 1 }}>
                                            <Button variant="outlined" fullWidth onClick={onCancel} sx={{ borderRadius: 2, fontWeight: 700 }}>
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="contained" fullWidth onClick={handleMarkAttendance} 
                                                disabled={loading || locationLoading}
                                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ApproveIcon />}
                                                sx={{ borderRadius: 2, fontWeight: 700, px: 4 }}
                                            >
                                                {loading ? "Verifying..." : (locationLoading ? "Locating..." : "Mark Attendance")}
                                            </Button>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Fade>
                    )}

                    {/* LOADING STATE FOR INFO */}
                    {scannedToken && !sessionInfo && !error && !result && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <CircularProgress size={50} thickness={5} sx={{ mb: 2 }} />
                            <Typography variant="h6" fontWeight={700}>Fetching Session...</Typography>
                            <Typography variant="body2" color="text.secondary">Connecting to university servers</Typography>
                        </Box>
                    )}

                    {/* ERROR STATE WITH RETRY */}
                    {scannedToken && error && !result && !loading && (
                         <Box sx={{ textAlign: 'center', py: 6 }}>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 72, height: 72, mx: 'auto', mb: 3 }}>
                                <WarningIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h5" fontWeight={800} gutterBottom>Verification Failed</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>{error}</Typography>
                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button variant="outlined" onClick={onCancel} sx={{ borderRadius: 2, px: 4 }}>Cancel</Button>
                                <Button variant="contained" onClick={() => { setError(null); handleMarkAttendance(); }} sx={{ borderRadius: 2, px: 4 }}>Try Again</Button>
                            </Stack>
                         </Box>
                    )}

                    {/* RESULT STATE */}
                    {result && (
                        <Fade in timeout={500}>
                            <Card sx={{
                                borderRadius: 4, textAlign: 'center', overflow: 'hidden',
                                border: '2px solid', borderColor: result.status === 'PRESENT' ? 'success.main' : 'error.main'
                            }}>
                                <Box sx={{
                                    p: 5,
                                    background: result.status === 'PRESENT'
                                        ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.02)})`
                                        : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.main, 0.02)})`
                                }}>
                                    <Box sx={{
                                        width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 3,
                                        bgcolor: result.status === 'PRESENT' ? 'success.main' : 'error.main',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {result.status === 'PRESENT' ? <CheckIcon sx={{ fontSize: 50 }} /> : <CloseIcon sx={{ fontSize: 50 }} />}
                                    </Box>

                                    <Typography variant="h4" fontWeight={900} color={result.status === 'PRESENT' ? 'success.main' : 'error.main'} gutterBottom>
                                        {result.status === 'PRESENT' ? 'SUCCESS!' : 'REJECTED'}
                                    </Typography>

                                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 3, opacity: 0.8 }}>
                                        {result.message}
                                    </Typography>

                                    <Card sx={{ borderRadius: 3, p: 2, bgcolor: 'background.paper', mb: 4, border: '1px solid', borderColor: 'divider' }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">TIME</Typography>
                                                <Typography variant="subtitle2" fontWeight={800}>{new Date().toLocaleTimeString()}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="text.secondary">STATUS</Typography>
                                                <Typography variant="subtitle2" fontWeight={800}>{result.status}</Typography>
                                            </Grid>
                                        </Grid>
                                    </Card>

                                    <Button
                                        fullWidth variant="contained" onClick={onBack}
                                        color={result.status === 'PRESENT' ? 'success' : 'error'}
                                        sx={{ borderRadius: 3, py: 1.5, fontWeight: 700 }}
                                    >
                                        Return to Dashboard
                                    </Button>
                                </Box>
                            </Card>
                        </Fade>
                    )}
                </Box>
            </Fade>
        </Box>
    );
};

export default ScanAttendance;
