import React, { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
    Container, Typography, Button, Box, Paper, CircularProgress, AppBar, Toolbar,
    IconButton, Grid, Card, CardContent, Chip, Select, MenuItem, FormControl,
    InputLabel, Avatar, Divider, List, ListItem, ListItemText, Skeleton, Fab
} from "@mui/material";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
    markAttendance, getStudentAnalytics, getStudentSubjects, getSubjectAttendance,
    getAttendanceStatus, getTodaySessions, getAttendanceHistory, getStudentAlerts
} from "../services/api";
import MenuIcon from '@mui/icons-material/Menu';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HistoryIcon from '@mui/icons-material/History';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useAuth } from "../context/AuthContext";

const StudentDashboard = () => {
    const { logout, user } = useAuth();
    const [scanResult, setScanResult] = useState(null);
    const [location, setLocation] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const webcamRef = useRef(null);
    const [image, setImage] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    // Data states
    const [analytics, setAnalytics] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [todaySessions, setTodaySessions] = useState([]);
    const [history, setHistory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [subjectAttendance, setSubjectAttendance] = useState(null);
    const [subjects, setSubjects] = useState([]);

    // Loading states
    const [loadingData, setLoadingData] = useState(true);

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
        setLoadingData(true);
        try {
            const [analyticsData, statusData, sessionsData, historyData, alertsData, subjectsData] = await Promise.all([
                getStudentAnalytics(),
                getAttendanceStatus(),
                getTodaySessions(),
                getAttendanceHistory(5),
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
            setLoadingData(false);
        }
    };

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
                // Ignore errors
            }

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            };
        }
    }, [showScanner, scanResult]);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc);
    }, [webcamRef]);

    const handleConfirm = async () => {
        if (!scanResult || !location || !image) {
            setMessage("Please scan QR, allow location, and capture photo.");
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

            const result = await markAttendance(formData);
            setMessage(`✓ Attendance Marked Successfully!`);

            // Refresh all data
            fetchAllData();

            // Close scanner after success
            setTimeout(() => {
                setShowScanner(false);
                setScanResult(null);
                setImage(null);
            }, 2000);
        } catch (error) {
            setMessage("Failed to mark attendance. " + (error.response?.data?.message || ""));
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectChange = async (event) => {
        const subjectId = event.target.value;
        setSelectedSubject(subjectId);

        if (subjectId) {
            try {
                const data = await getSubjectAttendance(subjectId);
                setSubjectAttendance(data.percentage);
            } catch (error) {
                console.error("Failed to load subject attendance", error);
                setSubjectAttendance(null);
            }
        } else {
            setSubjectAttendance(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Open": return "success";
            case "Upcoming": return "warning";
            case "Closed": return "error";
            default: return "default";
        }
    };

    const getStatusIcon = (status) => {
        const colors = {
            "Open": "#4caf50",
            "Upcoming": "#ff9800",
            "Closed": "#f44336"
        };
        return <FiberManualRecordIcon sx={{ fontSize: 12, color: colors[status] || "#999" }} />;
    };

    const studentName = user?.username || "Student";

    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#fafafa', pb: 10 }}>
            {/* Clean AppBar */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
                <Toolbar>
                    <IconButton edge="start" sx={{ mr: 2, color: '#667eea' }}>
                        <MenuIcon />
                    </IconButton>
                    <SchoolIcon sx={{ mr: 1, fontSize: 26, color: '#667eea' }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: '#333' }}>
                        Student Portal
                    </Typography>
                    <Button
                        onClick={logout}
                        startIcon={<LogoutIcon />}
                        sx={{ color: '#666', fontWeight: 600 }}
                    >
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                {/* Welcome Banner - Reduced Height */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        mb: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: 2
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 50, height: 50, bgcolor: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                            {studentName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight="700">
                                Hello, {studentName}!
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Track your attendance and stay updated
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Top Row - 3 Column Grid */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    {/* Overall Attendance */}
                    <Grid item xs={12} md={4}>
                        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <TrendingUpIcon sx={{ fontSize: 22, color: '#667eea' }} />
                                    <Typography variant="subtitle1" fontWeight="600">
                                        Overall Attendance
                                    </Typography>
                                </Box>
                                {loadingData ? (
                                    <Skeleton variant="rectangular" height={60} />
                                ) : (
                                    <>
                                        <Typography variant="h2" fontWeight="800" color="primary">
                                            {analytics ? `${analytics.percentage.toFixed(1)}%` : "-"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {analytics ? `${analytics.presentCount}/${analytics.totalSessions} classes` : "Loading..."}
                                        </Typography>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Attendance Status - VERY IMPORTANT */}
                    <Grid item xs={12} md={4}>
                        <Card
                            elevation={0}
                            sx={{
                                border: attendanceStatus?.status === "Shortage" ? '2px solid #ff9800' : '1px solid #e0e0e0',
                                borderRadius: 2,
                                bgcolor: attendanceStatus?.status === "Shortage" ? '#fff3e0' : 'white',
                                height: '100%'
                            }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <EventAvailableIcon sx={{ fontSize: 22, color: attendanceStatus?.status === "Eligible" ? '#4caf50' : '#ff9800' }} />
                                    <Typography variant="subtitle1" fontWeight="600">
                                        Eligibility Status
                                    </Typography>
                                </Box>
                                {loadingData ? (
                                    <Skeleton variant="rectangular" height={60} />
                                ) : (
                                    <>
                                        <Chip
                                            label={attendanceStatus?.status || "Loading"}
                                            color={attendanceStatus?.status === "Eligible" ? "success" : "warning"}
                                            sx={{ fontWeight: 700, mb: 1 }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            Required: {attendanceStatus?.requiredPercentage}%
                                        </Typography>
                                        {attendanceStatus?.status === "Shortage" && (
                                            <Typography variant="body2" fontWeight="600" color="warning.main" sx={{ mt: 0.5 }}>
                                                Need {attendanceStatus?.classesNeededForEligibility} more classes
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Today's Classes */}
                    <Grid item xs={12} md={4}>
                        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <AccessTimeIcon sx={{ fontSize: 22, color: '#667eea' }} />
                                    <Typography variant="subtitle1" fontWeight="600">
                                        Today's Sessions
                                    </Typography>
                                </Box>
                                {loadingData ? (
                                    <Skeleton variant="rectangular" height={60} />
                                ) : todaySessions.length > 0 ? (
                                    <Box>
                                        {todaySessions.slice(0, 2).map((session, idx) => (
                                            <Box key={idx} sx={{ mb: 1 }}>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    {getStatusIcon(session.status)}
                                                    <Typography variant="body2" fontWeight="600">
                                                        {session.subjectName}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {session.facultyName} • {session.status}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No sessions today
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Subject-wise Attendance - Full Width */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12}>
                        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <SchoolIcon sx={{ fontSize: 22, color: '#667eea' }} />
                                    <Typography variant="subtitle1" fontWeight="600">
                                        Subject-wise Attendance
                                    </Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Select Subject</InputLabel>
                                            <Select
                                                value={selectedSubject}
                                                label="Select Subject"
                                                onChange={handleSubjectChange}
                                            >
                                                <MenuItem value=""><em>Choose a subject</em></MenuItem>
                                                {subjects.map((subject) => (
                                                    <MenuItem key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        {subjectAttendance !== null && (
                                            <Box>
                                                <Typography variant="h4" fontWeight="800" color="primary">
                                                    {subjectAttendance.toFixed(1)}%
                                                </Typography>
                                                <Box sx={{ width: '100%', height: 8, bgcolor: '#f0f0f0', borderRadius: 4, mt: 1 }}>
                                                    <Box
                                                        sx={{
                                                            width: `${Math.min(subjectAttendance, 100)}%`,
                                                            height: '100%',
                                                            bgcolor: subjectAttendance >= 75 ? '#4caf50' : '#f44336',
                                                            borderRadius: 4,
                                                            transition: 'width 0.5s ease'
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Alerts & History Row */}
                <Grid container spacing={2}>
                    {/* Alerts */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <WarningAmberIcon sx={{ fontSize: 22, color: '#ff9800' }} />
                                    <Typography variant="subtitle1" fontWeight="600">
                                        Alerts & Warnings
                                    </Typography>
                                </Box>
                                {loadingData ? (
                                    <>
                                        <Skeleton height={30} sx={{ mb: 1 }} />
                                        <Skeleton height={30} sx={{ mb: 1 }} />
                                    </>
                                ) : alerts.length > 0 ? (
                                    <Box>
                                        {alerts.map((alert, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    p: 1.5,
                                                    mb: 1,
                                                    bgcolor: '#fff3e0',
                                                    borderRadius: 1,
                                                    borderLeft: '3px solid #ff9800'
                                                }}
                                            >
                                                <Typography variant="body2" color="text.primary">
                                                    {alert}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No alerts. You're doing great! 🎉
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Attendance History */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <HistoryIcon sx={{ fontSize: 22, color: '#667eea' }} />
                                    <Typography variant="subtitle1" fontWeight="600">
                                        Recent Attendance
                                    </Typography>
                                </Box>
                                {loadingData ? (
                                    <>
                                        <Skeleton height={40} sx={{ mb: 1 }} />
                                        <Skeleton height={40} sx={{ mb: 1 }} />
                                        <Skeleton height={40} />
                                    </>
                                ) : (
                                    <List dense sx={{ p: 0 }}>
                                        {history.map((record, idx) => (
                                            <ListItem
                                                key={idx}
                                                sx={{
                                                    px: 0,
                                                    borderBottom: idx < history.length - 1 ? '1px solid #f0f0f0' : 'none'
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="body2" fontWeight="600">
                                                                {record.subjectName}
                                                            </Typography>
                                                            <Chip
                                                                label={record.status}
                                                                size="small"
                                                                color={record.status === "Present" ? "success" : record.status === "Absent" ? "error" : "default"}
                                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(record.date).toLocaleDateString()}
                                                            {record.remarks && ` • ${record.remarks}`}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* Sticky Floating Scan Button */}
            {!showScanner && (
                <Fab
                    variant="extended"
                    color="primary"
                    onClick={() => setShowScanner(true)}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        px: 3,
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: '1rem',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                            boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
                            transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s',
                        animation: todaySessions.some(s => s.status === "Open") ? 'pulse 2s infinite' : 'none',
                        '@keyframes pulse': {
                            '0%, 100%': { boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)' },
                            '50%': { boxShadow: '0 8px 32px rgba(102, 126, 234, 0.7)' }
                        }
                    }}
                >
                    <QrCodeScannerIcon sx={{ mr: 1 }} />
                    Scan QR Code
                </Fab>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.8)',
                        zIndex: 1300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2
                    }}
                >
                    <Paper sx={{ maxWidth: 500, width: '100%', p: 3, borderRadius: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" fontWeight="700">
                                Mark Attendance
                            </Typography>
                            <Button
                                onClick={() => {
                                    setShowScanner(false);
                                    setScanResult(null);
                                    setImage(null);
                                    setMessage("");
                                }}
                                color="error"
                            >
                                Close
                            </Button>
                        </Box>

                        {!scanResult ? (
                            <Box>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Step 1: Scan the QR code displayed by your faculty
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <div id="reader" style={{ width: '100%', maxWidth: '400px' }}></div>
                                </Box>
                            </Box>
                        ) : (
                            <Box>
                                <Chip icon={<CheckCircleIcon />} label={`Session: ${scanResult}`} color="success" sx={{ mb: 2 }} />
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Step 2: Capture your photo for verification
                                </Typography>
                                {!image ? (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            width="100%"
                                            style={{ borderRadius: '8px', maxWidth: '400px' }}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={capture}
                                            startIcon={<CameraAltIcon />}
                                            sx={{ mt: 2 }}
                                            fullWidth
                                        >
                                            Capture Photo
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <img src={image} alt="Captured" style={{ borderRadius: '8px', width: '100%', maxWidth: '400px' }} />
                                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                            <Button onClick={() => setImage(null)} variant="outlined" fullWidth>
                                                Retake
                                            </Button>
                                            <Button
                                                variant="contained"
                                                onClick={handleConfirm}
                                                disabled={loading}
                                                fullWidth
                                            >
                                                {loading ? <CircularProgress size={24} /> : "Confirm"}
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {message && (
                            <Box
                                sx={{
                                    mt: 2,
                                    p: 1.5,
                                    bgcolor: message.includes("Success") ? '#e8f5e9' : '#ffebee',
                                    borderRadius: 1,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    color={message.includes("Success") ? "success.main" : "error.main"}
                                    fontWeight={600}
                                >
                                    {message}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default StudentDashboard;
