import React, { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
    Container, Typography, Button, Box, Paper, CircularProgress, AppBar, Toolbar,
    IconButton, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Avatar, Divider, List, ListItem, ListItemText,
    useTheme, Fade, Dialog, LinearProgress, Badge, Drawer, Alert, Stack
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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
    TrendingUp as TrendingUpIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
    Description as DescriptionIcon,
    ReportProblem as ReportProblemIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

import { useAuth } from "../context/AuthContext";
import ChangePasswordDialog from '../components/ChangePasswordDialog';
import GlobalHeader from '../components/GlobalHeader';
import UserProfileMenu from '../components/UserProfileMenu';
import GreetingWidget from '../components/GreetingWidget';

const StudentDashboard = () => {
    const { logout, user } = useAuth();
    const theme = useTheme();

    // UI State
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

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
                getAttendanceHistory(10),
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
        let scanner = null;
        let timer = null;

        if (showScanner && !scanResult) {
            const initScanner = () => {
                if (document.getElementById("reader")) {
                    try {
                        scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
                        scanner.render(onScanSuccess, onScanFailure);
                    } catch (e) {
                        console.error("Scanner init error:", e);
                    }
                } else {
                    timer = setTimeout(initScanner, 300);
                }
            };

            timer = setTimeout(initScanner, 200);

            function onScanSuccess(decodedText) {
                let sessionId = decodedText;
                if (decodedText.startsWith("SESSION:")) {
                    sessionId = decodedText.split(":")[1];
                }
                setScanResult(sessionId);
                if (scanner) {
                    scanner.clear().catch(e => console.warn("Failed to clear scanner", e));
                }
            }

            function onScanFailure(error) {
                // Silent
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (scanner) {
                scanner.clear().catch(e => console.warn("Failed to clear scanner on cleanup", e));
            }
        };
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

    // Helper to get status badge
    const getStatusBadge = (percentage) => {
        if (percentage >= 75) return { label: "Safe", color: "success" };
        if (percentage >= 65) return { label: "At Risk", color: "warning" };
        return { label: "Critical", color: "error" };
    };

    const status = getStatusBadge(analytics?.percentage || 0);

    // Sidebar
    const SidebarContent = () => (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            {/* Header */}
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <SchoolIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                    <Box>
                        <Typography variant="subtitle1" fontWeight="700" lineHeight={1.2}>JNTUA CE</Typography>
                        <Typography variant="caption" color="text.secondary">Student Portal</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Navigation */}
            <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
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
                            borderRadius: 2,
                            mb: 0.5,
                            bgcolor: activeSection === item.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                            color: activeSection === item.id ? 'primary.main' : 'text.secondary',
                            '&:hover': { bgcolor: activeSection === item.id ? alpha(theme.palette.primary.main, 0.15) : 'action.hover' }
                        }}
                    >
                        <Box component="span" sx={{ mr: 1.5, display: 'flex' }}>
                            {item.icon}
                        </Box>
                        <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: activeSection === item.id ? 700 : 500 }} />
                    </ListItem>
                ))}
            </List>

            {/* Footer */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                    fullWidth
                    variant="text"
                    color="inherit"
                    size="small"
                    startIcon={<LogoutIcon />}
                    onClick={logout}
                    sx={{
                        justifyContent: 'flex-start',
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'action.hover' }
                    }}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#fafafa' }}>
            <GlobalHeader />
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Desktop Sidebar */}
                <Box sx={{ width: 240, display: { xs: 'none', md: 'block' }, bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider' }}>
                    <SidebarContent />
                </Box>

                {/* Mobile Sidebar */}
                <Drawer
                    anchor="left"
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    PaperProps={{ sx: { width: 240 } }}
                >
                    <SidebarContent />
                </Drawer>

                {/* Main Content */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                    {/* Top Header - Slim & Clean */}
                    <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Toolbar sx={{ minHeight: 64 }}>
                            <IconButton edge="start" sx={{ mr: 2, display: { md: 'none' } }} onClick={() => setSidebarOpen(true)}>
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 700 }}>
                                Dashboard
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton size="medium">
                                    <Badge badgeContent={alerts.length} color="error">
                                        <NotificationsIcon />
                                    </Badge>
                                </IconButton>
                                <UserProfileMenu size={36} />
                            </Box>
                        </Toolbar>
                    </AppBar>

                    {/* Main Content Area */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
                        <Container maxWidth="xl" disableGutters>
                            {activeSection === 'dashboard' && (
                                <Stack spacing={3}>
                                    {/* Greeting Widget */}
                                    <GreetingWidget />

                                    {/* 1. ATTENDANCE OVERVIEW - Hero Section */}
                                    <Paper elevation={0} sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: 'background.paper'
                                    }}>
                                        <Grid container spacing={3} alignItems="center">
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="overline" color="text.secondary" fontWeight={600}>
                                                    Attendance Overview
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 1, mb: 2 }}>
                                                    <Typography variant="h2" fontWeight={700} color="text.primary">
                                                        {Math.round(analytics?.percentage || 0)}%
                                                    </Typography>
                                                    <Chip
                                                        label={status.label}
                                                        color={status.color}
                                                        size="small"
                                                        sx={{ fontWeight: 600, height: 24 }}
                                                    />
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={analytics?.percentage || 0}
                                                    color={status.color}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 1,
                                                        bgcolor: alpha(theme.palette[status.color].main, 0.1),
                                                        mb: 1
                                                    }}
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    Minimum required: <strong>75%</strong>
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Present</Typography>
                                                            <Typography variant="h5" fontWeight={700}>{analytics?.totalPresent || 0}</Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Absent</Typography>
                                                            <Typography variant="h5" fontWeight={700}>{analytics?.totalAbsent || 0}</Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Total Conducted</Typography>
                                                            <Typography variant="h5" fontWeight={700}>{analytics?.totalSessions || 0}</Typography>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Classes Needed</Typography>
                                                            <Typography variant="h5" fontWeight={700} color={attendanceStatus?.classesNeededForEligibility > 0 ? 'warning.main' : 'success.main'}>
                                                                {attendanceStatus?.classesNeededForEligibility || 0}
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Paper>

                                    {/* 2. TODAY'S SCHEDULE */}
                                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarIcon color="primary" />
                                            <Typography variant="h6" fontWeight={700}>Today's Schedule</Typography>
                                        </Box>
                                        {todaySessions.length === 0 ? (
                                            <Box sx={{ p: 6, textAlign: 'center' }}>
                                                <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                                <Typography variant="h6" color="text.secondary">No classes today</Typography>
                                                <Typography variant="body2" color="text.disabled">You're free. Enjoy!</Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Faculty</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Status</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {todaySessions.map((session, idx) => (
                                                            <TableRow key={idx} hover>
                                                                <TableCell>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                                                <TableCell><strong>{session.subjectName}</strong></TableCell>
                                                                <TableCell>{session.facultyName}</TableCell>
                                                                <TableCell>{session.room || '101'}</TableCell>
                                                                <TableCell align="right">
                                                                    <Chip
                                                                        label={session.status}
                                                                        size="small"
                                                                        color={session.status === 'Open' ? 'success' : 'default'}
                                                                        variant={session.status === 'Open' ? 'filled' : 'outlined'}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Paper>

                                    {/* 3. SUBJECT-WISE PERFORMANCE */}
                                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SchoolIcon color="primary" />
                                            <Typography variant="h6" fontWeight={700}>Subject-wise Performance</Typography>
                                        </Box>
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Attended / Total</TableCell>
                                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Percentage</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {subjects.map((sub) => {
                                                        const pct = sub.attendancePercentage || 0;
                                                        const subStatus = getStatusBadge(pct);
                                                        return (
                                                            <TableRow key={sub.id} hover>
                                                                <TableCell>
                                                                    <Typography fontWeight={600}>{sub.name}</Typography>
                                                                    <Typography variant="caption" color="text.secondary">{sub.code}</Typography>
                                                                </TableCell>
                                                                <TableCell align="center">{sub.attended || 0} / {sub.total || 0}</TableCell>
                                                                <TableCell align="center">
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                                        <LinearProgress
                                                                            variant="determinate"
                                                                            value={pct}
                                                                            color={subStatus.color}
                                                                            sx={{ width: 80, height: 6, borderRadius: 1 }}
                                                                        />
                                                                        <Typography variant="body2" fontWeight={600}>{pct.toFixed(0)}%</Typography>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Chip
                                                                        label={subStatus.label}
                                                                        size="small"
                                                                        color={subStatus.color}
                                                                        variant="outlined"
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>

                                    {/* 4. SMART INSIGHTS - Refined */}
                                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <TrendingUpIcon color="primary" />
                                            <Typography variant="h6" fontWeight={700}>Attendance Insights</Typography>
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.2) }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Prediction</Typography>
                                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                        Missing the next <strong>2 classes</strong> will drop attendance to{' '}
                                                        <span style={{ color: theme.palette.error.main, fontWeight: 700 }}>
                                                            {((analytics?.totalPresent || 0) / ((analytics?.totalSessions || 0) + 2) * 100).toFixed(1)}%
                                                        </span>
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.2) }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Recommendation</Typography>
                                                    <Typography variant="body2" sx={{ mt: 0.5, color: 'success.main', fontWeight: 600 }}>
                                                        Attend the next 3 classes to maintain 75%+ attendance safely.
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Paper>

                                    {/* 5. QUICK ACTIONS - Compact */}
                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
                                            Quick Actions
                                        </Typography>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<DownloadIcon />}
                                                sx={{ borderRadius: 1.5 }}
                                            >
                                                Download Report
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<DescriptionIcon />}
                                                sx={{ borderRadius: 1.5 }}
                                            >
                                                Apply for Leave
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<ReportProblemIcon />}
                                                sx={{ borderRadius: 1.5 }}
                                            >
                                                Report Issue
                                            </Button>
                                        </Stack>
                                    </Paper>
                                </Stack>
                            )}

                            {/* CLASSES SECTION */}
                            {activeSection === 'classes' && (
                                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="h6" fontWeight={700}>My Classes</Typography>
                                    </Box>
                                    {todaySessions.length === 0 ? (
                                        <Box sx={{ p: 6, textAlign: 'center' }}>
                                            <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary">No classes scheduled for today</Typography>
                                        </Box>
                                    ) : (
                                        <List>
                                            {todaySessions.map((session, idx) => (
                                                <React.Fragment key={idx}>
                                                    <ListItem sx={{ py: 2 }}>
                                                        <Box sx={{ mr: 3, textAlign: 'center', minWidth: 60 }}>
                                                            <Typography variant="caption" color="text.secondary">START</Typography>
                                                            <Typography variant="body1" fontWeight={700}>
                                                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Typography>
                                                        </Box>
                                                        <ListItemText
                                                            primary={<Typography variant="subtitle1" fontWeight={700}>{session.subjectName}</Typography>}
                                                            secondary={`${session.facultyName} • Room ${session.room || '101'}`}
                                                        />
                                                        {session.status === 'Open' && (
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={<QrCodeScannerIcon />}
                                                                onClick={() => setShowScanner(true)}
                                                            >
                                                                Scan
                                                            </Button>
                                                        )}
                                                    </ListItem>
                                                    {idx < todaySessions.length - 1 && <Divider />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    )}
                                </Paper>
                            )}

                            {/* HISTORY SECTION */}
                            {activeSection === 'history' && (
                                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="h6" fontWeight={700}>Attendance History</Typography>
                                    </Box>
                                    <List>
                                        {history.map((record, idx) => (
                                            <React.Fragment key={idx}>
                                                <ListItem sx={{ py: 2 }}>
                                                    <Box sx={{ mr: 3, textAlign: 'center', minWidth: 50 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(record.date).toLocaleDateString([], { month: 'short' }).toUpperCase()}
                                                        </Typography>
                                                        <Typography variant="h6" fontWeight={700}>
                                                            {new Date(record.date).getDate()}
                                                        </Typography>
                                                    </Box>
                                                    <ListItemText
                                                        primary={<Typography fontWeight={600}>{record.subjectName}</Typography>}
                                                        secondary={new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    />
                                                    <Chip
                                                        label={record.status}
                                                        size="small"
                                                        color={record.status === 'Present' ? 'success' : 'error'}
                                                        variant="outlined"
                                                    />
                                                </ListItem>
                                                {idx < history.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Paper>
                            )}

                            {/* PROFILE SECTION */}
                            {activeSection === 'profile' && (
                                <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                                    <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 32 }}>
                                        {(user?.firstName || user?.username || 'S').charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="h5" fontWeight={700}>{user?.firstName || user?.username} {user?.lastName || ''}</Typography>
                                    <Typography color="text.secondary" sx={{ mb: 3 }}>{user?.username}</Typography>
                                    <Button variant="outlined" onClick={() => setOpenChangePassword(true)}>
                                        Change Password
                                    </Button>
                                </Paper>
                            )}
                        </Container>
                    </Box>
                </Box>
            </Box>

            {/* SCANNER DIALOG */}
            <Dialog
                open={showScanner}
                onClose={() => setShowScanner(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight={700}>Scan Attendance QR</Typography>
                    <IconButton onClick={() => setShowScanner(false)}><CloseIcon /></IconButton>
                </Box>

                <Box sx={{ p: 2 }}>
                    {!scanResult ? (
                        <>
                            <Box sx={{
                                border: '2px dashed',
                                borderColor: 'divider',
                                borderRadius: 2,
                                overflow: 'hidden',
                                bgcolor: '#000',
                                minHeight: 300
                            }}>
                                <div id="reader" style={{ width: '100%' }}></div>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
                                Point your camera at the session QR code
                            </Typography>
                        </>
                    ) : !image ? (
                        <Box>
                            <Alert severity="success" sx={{ mb: 2 }}>QR Code Scanned! Now capture your photo.</Alert>
                            <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '2px solid', borderColor: 'primary.main', mb: 2 }}>
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" />
                            </Box>
                            <Button fullWidth variant="contained" startIcon={<CameraAltIcon />} onClick={capture}>
                                Capture Photo
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            <img src={image} alt="Verify" style={{ width: '100%', borderRadius: 8, border: '1px solid #eee' }} />
                            {message && (
                                <Alert severity={message.includes("SUCCESS") ? "success" : "error"} sx={{ my: 2 }}>
                                    {message}
                                </Alert>
                            )}
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleConfirmAttendance}
                                disabled={loading}
                                sx={{ mt: 2 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Attendance'}
                            </Button>
                        </Box>
                    )}
                </Box>
            </Dialog>

            {/* CHANGE PASSWORD DIALOG */}
            <ChangePasswordDialog open={openChangePassword} onClose={() => setOpenChangePassword(false)} />

            {/* Floating Action Button for Quick Scan */}
            {activeSection === 'dashboard' && todaySessions.some(s => s.status === 'Open') && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 16, md: 24 },
                        right: { xs: 16, md: 24 },
                        zIndex: 1000
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<QrCodeScannerIcon />}
                        onClick={() => setShowScanner(true)}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            fontWeight: 700,
                            boxShadow: 4,
                            '&:hover': { boxShadow: 8 }
                        }}
                    >
                        Mark Attendance
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default StudentDashboard;
