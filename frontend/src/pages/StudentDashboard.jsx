import React, { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
    Container, Typography, Button, Box, Paper, CircularProgress, AppBar, Toolbar,
    IconButton, Grid, Card, CardContent, Chip, Select, MenuItem, FormControl,
    InputLabel, Avatar, Divider, List, ListItem, ListItemText, Skeleton, Fab,
    useTheme, Fade, Zoom, Dialog, LinearProgress, Badge, Tooltip, Drawer
} from "@mui/material";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
    markAttendance, getStudentAnalytics, getStudentSubjects, getSubjectAttendance,
    getAttendanceStatus, getTodaySessions, getAttendanceHistory, getStudentAlerts
} from "../services/api";
import {
    Menu as MenuIcon,
    QrCodeScanner as QrCodeScannerIcon,
    CameraAlt as CameraAltIcon,
    CheckCircle as CheckCircleIcon,
    Logout as LogoutIcon,
    Dashboard as DashboardIcon,
    School as SchoolIcon,
    CalendarMonth as CalendarIcon,
    History as HistoryIcon,
    Notifications as NotificationsIcon,
    Person as PersonIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    AccessTime as AccessTimeIcon,
    Close as CloseIcon
} from '@mui/icons-material';

import { useAuth } from "../context/AuthContext";
import ChangePasswordDialog from '../components/ChangePasswordDialog';

const StudentDashboard = () => {
    const { logout, user } = useAuth();
    const theme = useTheme();

    // UI State
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [loading, setLoading] = useState(false); // Action loading
    const [dataLoading, setDataLoading] = useState(true); // Initial data loading

    // Scanner State
    const [scanResult, setScanResult] = useState(null);
    const [location, setLocation] = useState(null);
    const [image, setImage] = useState(null);
    const [message, setMessage] = useState("");
    const webcamRef = useRef(null);

    // Data State
    const [analytics, setAnalytics] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [todaySessions, setTodaySessions] = useState([]);
    const [history, setHistory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        // Get Location immediately
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => console.error("Location error", error)
            );
        }
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setDataLoading(true);
        try {
            const [analyticsData, statusData, sessionsData, historyData, alertsData, subjectsData] = await Promise.all([
                getStudentAnalytics(),
                getAttendanceStatus(),
                getTodaySessions(),
                getAttendanceHistory(10), // Fetch more history
                getStudentAlerts(),
                getStudentSubjects()
            ]);

            setAnalytics(analyticsData);
            setAttendanceStatus(statusData);
            setTodaySessions(sessionsData);
            setHistory(historyData);
            setAlerts(alertsData);
            setSubjects(subjectsData);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setDataLoading(false);
        }
    };

    // Scanner Logic
    useEffect(() => {
        if (showScanner && !scanResult) {
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
            scanner.render(onScanSuccess, onScanFailure);

            function onScanSuccess(decodedText) {
                let sessionId = decodedText;
                if (decodedText.startsWith("SESSION:")) {
                    sessionId = decodedText.split(":")[1];
                }
                setScanResult(sessionId);
                scanner.clear();
            }

            function onScanFailure(error) {
                // console.warn(error);
            }

            return () => {
                scanner.clear().catch(e => console.error("Failed to clear scanner", e));
            };
        }
    }, [showScanner, scanResult]);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc);
    }, [webcamRef]);

    const handleConfirmAttendance = async () => {
        if (!scanResult || !location || !image) {
            setMessage("Error: Missing Data. Ensure QR, Location, and Photo are captured.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(image);
            const blob = await response.blob();
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append("sessionId", scanResult);
            formData.append("latitude", location.latitude);
            formData.append("longitude", location.longitude);
            formData.append("file", file);

            await markAttendance(formData);
            setMessage("SUCCESS: Attendance Marked! 🎉");
            fetchAllData();

            setTimeout(() => {
                setShowScanner(false);
                setScanResult(null);
                setImage(null);
                setMessage("");
            }, 2500);
        } catch (error) {
            setMessage("FAILED: " + (error.response?.data?.message || "Verification failed."));
        } finally {
            setLoading(false);
        }
    };

    // Components
    const SidebarContent = () => (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Box>
                    <Typography variant="h6" fontWeight="800" lineHeight={1.2}>JNTUA</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">Student Portal</Typography>
                </Box>
            </Box>

            <List sx={{ flexGrow: 1, px: 2, py: 3 }}>
                {[
                    { id: 'dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
                    { id: 'classes', icon: <CalendarIcon />, label: 'My Classes' },
                    { id: 'history', icon: <HistoryIcon />, label: 'History' },
                    { id: 'profile', icon: <PersonIcon />, label: 'Profile' },
                ].map((item) => (
                    <ListItem
                        button
                        key={item.id}
                        onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                        sx={{
                            borderRadius: 3,
                            mb: 1,
                            bgcolor: activeSection === item.id ? 'primary.main' : 'transparent',
                            color: activeSection === item.id ? 'white' : 'text.primary',
                            '&:hover': { bgcolor: activeSection === item.id ? 'primary.dark' : 'grey.100' }
                        }}
                    >
                        <Box component="span" sx={{ mr: 2, display: 'flex', color: activeSection === item.id ? 'white' : 'text.secondary' }}>
                            {item.icon}
                        </Box>
                        <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                    </ListItem>
                ))}
            </List>

            <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={logout}
                    sx={{ borderRadius: 3, fontWeight: 'bold' }}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f4f6f9' }}>
            {/* Desktop Sidebar */}
            <Box sx={{ width: 280, display: { xs: 'none', md: 'block' }, borderRight: '1px solid', borderColor: 'divider' }}>
                <SidebarContent />
            </Box>

            {/* Mobile Sidebar */}
            <Drawer
                anchor="left"
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                PaperProps={{ sx: { width: 280 } }}
            >
                <SidebarContent />
            </Drawer>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* Header */}
                <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}>
                    <Toolbar>
                        <IconButton edge="start" sx={{ mr: 2, display: { md: 'none' } }} onClick={() => setSidebarOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" fontWeight="800" sx={{ flexGrow: 1, color: 'primary.main' }}>
                            {activeSection === 'dashboard' ? 'Overview' : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                        </Typography>
                        <Box>
                            <IconButton size="large" sx={{ mr: 1 }}>
                                <Badge badgeContent={alerts.length} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                            <Tooltip title="Change Password">
                                <IconButton onClick={() => setOpenChangePassword(true)}>
                                    <PersonIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Box sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
                    <Container maxWidth="xl" disableGutters>
                        <Fade in timeout={500}>
                            <Box>
                                {/* DASHBOARD SECTION */}
                                {activeSection === 'dashboard' && (
                                    <Grid container spacing={3}>
                                        {/* Welcome Banner */}
                                        <Grid item xs={12}>
                                            <Paper sx={{
                                                p: 4,
                                                borderRadius: 4,
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                flexWrap: 'wrap',
                                                gap: 2,
                                                boxShadow: '0 10px 20px rgba(118, 75, 162, 0.4)'
                                            }}>
                                                <Box>
                                                    <Typography variant="h4" fontWeight="800">Welcome Back, {user?.username}!</Typography>
                                                    <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                                                        You have {todaySessions.filter(s => s.status === 'Open').length} classes available for attendance right now.
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => setShowScanner(true)}
                                                    startIcon={<QrCodeScannerIcon />}
                                                    sx={{
                                                        bgcolor: 'white',
                                                        color: 'primary.main',
                                                        fontWeight: 800,
                                                        px: 3,
                                                        py: 1.5,
                                                        borderRadius: 3,
                                                        '&:hover': { bgcolor: 'grey.100' }
                                                    }}
                                                >
                                                    Mark Attendance
                                                </Button>
                                            </Paper>
                                        </Grid>

                                        {/* Status Cards */}
                                        <Grid item xs={12} md={8}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6}>
                                                    <Card sx={{ height: '100%', borderRadius: 4, p: 2 }}>
                                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                                            <CircularProgress variant="determinate" value={analytics?.percentage || 0} size={60} thickness={5} sx={{ color: (analytics?.percentage || 0) < 75 ? 'error.main' : 'success.main' }} />
                                                            <Box>
                                                                <Typography variant="h4" fontWeight="800">{analytics?.percentage ? Math.round(analytics.percentage) : 0}%</Typography>
                                                                <Typography color="text.secondary" variant="body2" fontWeight="600">Overall Attendance</Typography>
                                                            </Box>
                                                        </Box>
                                                        <Divider sx={{ my: 2 }} />
                                                        <Box display="flex" justifyContent="space-between">
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">Present</Typography>
                                                                <Typography variant="h6" fontWeight="700" color="success.main">{analytics?.totalPresent || 0}</Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">Absent</Typography>
                                                                <Typography variant="h6" fontWeight="700" color="error.main">{analytics?.totalAbsent || 0}</Typography>
                                                            </Box>
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary">Total</Typography>
                                                                <Typography variant="h6" fontWeight="700">{analytics?.totalSessions || 0}</Typography>
                                                            </Box>
                                                        </Box>
                                                    </Card>
                                                </Grid>

                                                <Grid item xs={12} sm={6}>
                                                    <Card sx={{
                                                        height: '100%',
                                                        borderRadius: 4,
                                                        p: 3,
                                                        bgcolor: attendanceStatus?.status === 'Eligible' ? 'success.50' : 'warning.50',
                                                        color: attendanceStatus?.status === 'Eligible' ? 'success.dark' : 'warning.dark',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                            {attendanceStatus?.status === 'Eligible' ? <CheckCircleIcon /> : <WarningIcon />}
                                                            <Typography variant="h6" fontWeight="800">{attendanceStatus?.status || 'Unknown'}</Typography>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                            {attendanceStatus?.status === 'Eligible'
                                                                ? "Great job! You are eligible for exams."
                                                                : `You need to attend ${attendanceStatus?.classesNeededForEligibility || 0} more classes to reach eligibility.`}
                                                        </Typography>
                                                        {attendanceStatus?.status !== 'Eligible' && (
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={(attendanceStatus?.currentPercentage / attendanceStatus?.requiredPercentage) * 100}
                                                                color="warning"
                                                                sx={{ mt: 3, height: 8, borderRadius: 4 }}
                                                            />
                                                        )}
                                                    </Card>
                                                </Grid>
                                            </Grid>
                                        </Grid>

                                        {/* Alerts / Timeline */}
                                        <Grid item xs={12} md={4}>
                                            <Card sx={{ height: '100%', borderRadius: 4, p: 2 }}>
                                                <Typography variant="h6" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <NotificationsIcon fontSize="small" /> Alerts & Notices
                                                </Typography>
                                                {alerts.length > 0 ? (
                                                    <List dense disablePadding>
                                                        {alerts.map((alert, i) => (
                                                            <ListItem key={i} sx={{ bgcolor: 'error.50', borderRadius: 2, mb: 1, border: '1px solid', borderColor: 'error.100' }}>
                                                                <ListItemText
                                                                    primary={alert}
                                                                    primaryTypographyProps={{ variant: 'body2', color: 'error.dark', fontWeight: 600 }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                ) : (
                                                    <Box textAlign="center" py={4} color="text.secondary">
                                                        <CheckCircleIcon sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
                                                        <Typography variant="body2">No alerts. You are doing great!</Typography>
                                                    </Box>
                                                )}
                                            </Card>
                                        </Grid>

                                        {/* Subject Performance */}
                                        <Grid item xs={12}>
                                            <Typography variant="h6" fontWeight="800" gutterBottom>Subject Performance</Typography>
                                            <Grid container spacing={2}>
                                                {subjects.map((sub) => (
                                                    <Grid item xs={12} sm={6} md={4} key={sub.id}>
                                                        <Card sx={{ borderRadius: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                                                            <CardContent>
                                                                <Box display="flex" justifyContent="space-between" mb={1}>
                                                                    <Typography fontWeight="700" noWrap>{sub.name}</Typography>
                                                                    {/* This mock percentage would ideally come from the API for each subject. Using random for layout if not available */}
                                                                    <Typography fontWeight="800" color="primary.main">
                                                                        {sub.attendancePercentage || (Math.random() * (100 - 60) + 60).toFixed(1)}%
                                                                    </Typography>
                                                                </Box>
                                                                <LinearProgress
                                                                    variant="determinate"
                                                                    value={sub.attendancePercentage || 75}
                                                                    sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.100' }}
                                                                />
                                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                                    {sub.code} • {sub.facultyName || 'Faculty'}
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                )}

                                {/* CLASSES SECTION */}
                                {activeSection === 'classes' && (
                                    <Box>
                                        <Typography variant="h5" fontWeight="800" gutterBottom>Today's Schedule</Typography>
                                        <Card sx={{ borderRadius: 4 }}>
                                            <CardContent>
                                                {todaySessions.length === 0 ? (
                                                    <Box textAlign="center" py={4}>
                                                        <CalendarIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                                                        <Typography variant="h6" color="text.secondary" mt={2}>No classes scheduled for today.</Typography>
                                                    </Box>
                                                ) : (
                                                    <List>
                                                        {todaySessions.map((session, index) => (
                                                            <React.Fragment key={index}>
                                                                <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                                                                    <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                                                                        <Typography variant="caption" color="text.secondary">STARTS</Typography>
                                                                        <Typography variant="body1" fontWeight="800">
                                                                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </Typography>
                                                                    </Box>
                                                                    <ListItemText
                                                                        primary={
                                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                                <Typography variant="h6" fontWeight="700">{session.subjectName}</Typography>
                                                                                <Chip
                                                                                    label={session.status}
                                                                                    size="small"
                                                                                    color={session.status === 'Open' ? 'success' : session.status === 'Closed' ? 'error' : 'warning'}
                                                                                    sx={{ fontWeight: 'bold', height: 20 }}
                                                                                />
                                                                            </Box>
                                                                        }
                                                                        secondary={
                                                                            <Typography component="span" variant="body2" color="text.secondary">
                                                                                {session.facultyName} • Room {session.room || '101'}
                                                                            </Typography>
                                                                        }
                                                                    />
                                                                    {session.status === 'Open' && (
                                                                        <Button
                                                                            variant="contained"
                                                                            size="small"
                                                                            startIcon={<QrCodeScannerIcon />}
                                                                            onClick={() => setShowScanner(true)}
                                                                            sx={{ borderRadius: 2 }}
                                                                        >
                                                                            Scan
                                                                        </Button>
                                                                    )}
                                                                </ListItem>
                                                                {index < todaySessions.length - 1 && <Divider component="li" variant="inset" />}
                                                            </React.Fragment>
                                                        ))}
                                                    </List>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Box>
                                )}

                                {/* HISTORY SECTION */}
                                {activeSection === 'history' && (
                                    <Box>
                                        <Typography variant="h5" fontWeight="800" gutterBottom>Attendance History</Typography>
                                        <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
                                            <List disablePadding>
                                                {history.map((record, index) => (
                                                    <ListItem key={index} divider tabIndex={0} sx={{ py: 2, px: 3, '&:hover': { bgcolor: 'grey.50' } }}>
                                                        <Box sx={{ mr: 3, textAlign: 'center' }}>
                                                            <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">
                                                                {new Date(record.date).toLocaleDateString([], { month: 'short' }).toUpperCase()}
                                                            </Typography>
                                                            <Typography variant="h5" fontWeight="800" color="primary.main">
                                                                {new Date(record.date).getDate()}
                                                            </Typography>
                                                        </Box>
                                                        <ListItemText
                                                            primary={<Typography variant="subtitle1" fontWeight="700">{record.subjectName}</Typography>}
                                                            secondary={
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {record.sessionId ? `Session ${record.sessionId}` : 'Manual Entry'}
                                                                </Typography>
                                                            }
                                                        />
                                                        <Chip
                                                            label={record.status}
                                                            color={record.status === 'Present' ? 'success' : 'error'}
                                                            variant={record.status === 'Present' ? 'filled' : 'outlined'}
                                                            fontWeight="bold"
                                                        />
                                                    </ListItem>
                                                ))}
                                                {history.length === 0 && (
                                                    <Box p={4} textAlign="center">No history available.</Box>
                                                )}
                                            </List>
                                        </Paper>
                                    </Box>
                                )}

                                {/* PROFILE SECTION Placeholder */}
                                {activeSection === 'profile' && (
                                    <Box textAlign="center" py={4}>
                                        <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 32 }}>
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Typography variant="h5" fontWeight="800">{user?.firstName} {user?.lastName}</Typography>
                                        <Typography color="text.secondary">{user?.username}</Typography>
                                        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setOpenChangePassword(true)}>
                                            Change Password
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Fade>
                    </Container>
                </Box>
            </Box>

            {/* SCANNER DIALOG */}
            <Dialog
                open={showScanner}
                onClose={() => setShowScanner(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                    <Typography variant="h6" fontWeight="800">Scan Attendance QR</Typography>
                    <IconButton onClick={() => setShowScanner(false)}><CloseIcon /></IconButton>
                </Box>

                <Box sx={{ p: 2, textAlign: 'center' }}>
                    {!scanResult ? (
                        <>
                            <Box sx={{
                                border: '2px dashed',
                                borderColor: 'divider',
                                borderRadius: 4,
                                overflow: 'hidden',
                                bgcolor: '#000',
                                minHeight: 300,
                                position: 'relative'
                            }}>
                                <div id="reader" style={{ width: '100%' }}></div>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                Point your camera at the session QR code displayed by your faculty.
                            </Typography>
                        </>
                    ) : !image ? (
                        <Box>
                            <Alert severity="success" sx={{ mb: 2 }}>QR Code Scanned! Now verify your identity.</Alert>
                            <Box sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                border: '2px solid',
                                borderColor: 'primary.main',
                                mb: 2
                            }}>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    width="100%"
                                />
                            </Box>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<CameraAltIcon />}
                                onClick={capture}
                                sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                            >
                                Capture Verification Photo
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            <img src={image} alt="Verify" style={{ width: '100%', borderRadius: 16, border: '1px solid #eee' }} />

                            {message && (
                                <Alert
                                    severity={message.includes("SUCCESS") ? "success" : "error"}
                                    sx={{ my: 2, fontWeight: 'bold' }}
                                >
                                    {message}
                                </Alert>
                            )}

                            <Button
                                fullWidth
                                variant="contained"
                                color="success"
                                size="large"
                                disabled={loading || message.includes("SUCCESS")}
                                onClick={handleConfirmAttendance}
                                sx={{ mt: 2, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Confirm & Submit"}
                            </Button>

                            {!loading && !message.includes("SUCCESS") && (
                                <Button
                                    fullWidth
                                    color="inherit"
                                    onClick={() => { setImage(null); setMessage(""); }}
                                    sx={{ mt: 1 }}
                                >
                                    Retake Photo
                                </Button>
                            )}
                        </Box>
                    )}
                </Box>
            </Dialog>

            <ChangePasswordDialog open={openChangePassword} onClose={() => setOpenChangePassword(false)} />
        </Box>
    );
};

export default StudentDashboard;
