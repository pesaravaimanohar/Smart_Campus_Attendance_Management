import React, { useState, useEffect, useMemo } from "react";
import {
    Typography, Button, Box, Grid, Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Avatar, Divider, List, ListItem,
    ListItemText, useTheme, Fade, LinearProgress, Stack, Alert, Paper,
    TextField, InputAdornment, IconButton, Tooltip
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    getStudentAnalytics, getStudentSubjects,
    getStudentClassCurriculum,
    getAttendanceStatus, getTodaySessions, getAttendanceHistory, getStudentAlerts,
    markAlertAsRead
} from "../services/api";
import {
    QrCodeScanner as QrCodeScannerIcon,
    Dashboard as DashboardIcon,
    School as SchoolIcon,
    CalendarMonth as CalendarIcon,
    History as HistoryIcon,
    Person as PersonIcon,
    TrendingUp as TrendingUpIcon,
    Download as DownloadIcon,
    Description as DescriptionIcon,
    ReportProblem as ReportProblemIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AccessTime as AccessTimeIcon,
    EventAvailable as EventAvailableIcon,
    Warning as WarningIcon,
    Lightbulb as LightbulbIcon,
    Search as SearchIcon,
    NotificationsActive as NotificationsIcon,
    Check as CheckIcon,
} from '@mui/icons-material';

import { useAuth } from "../context/AuthContext";
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import GreetingWidget from '../components/GreetingWidget';
import ScanAttendance from './ScanAttendance';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Lunch', 'Period 4', 'Period 5', 'Period 6'];
const PERIOD_TIMINGS = {
    'Period 1': '9:30-10:30',
    'Period 2': '10:30-11:30',
    'Period 3': '11:30-12:30',
    'Lunch': '12:30-1:30',
    'Period 4': '1:30-2:30',
    'Period 5': '2:30-3:30',
    'Period 6': '3:30-4:30'
};

// Color palette for subjects (rotating)
const SUBJECT_COLORS = [
    { bg: '#6C63FF', text: '#fff' },
    { bg: '#FF6B6B', text: '#fff' },
    { bg: '#4ECDC4', text: '#fff' },
    { bg: '#45B7D1', text: '#fff' },
    { bg: '#96CEB4', text: '#333' },
    { bg: '#FFEAA7', text: '#333' },
    { bg: '#DDA0DD', text: '#333' },
    { bg: '#FF8C42', text: '#fff' },
    { bg: '#98D8C8', text: '#333' },
    { bg: '#F7DC6F', text: '#333' },
];

const TimetableDisplay = ({ data, subjects }) => {
    let timetable = {};
    try {
        timetable = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
        return <Typography variant="body2" color="error">Invalid timetable data</Typography>;
    }

    if (!timetable || Object.keys(timetable).length === 0) {
        return <Typography variant="body2" color="text.secondary">No timetable entries found.</Typography>;
    }

    // Build a color map for consistent colors
    const subjectColorMap = {};
    subjects.forEach((s, i) => {
        subjectColorMap[s.id || s.subjectId] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
    });

    const getSubject = (id) => subjects.find(s => s.id === id || s.subjectId === id);

    // Group for merging logic (simplified for view)
    const getMergedRow = (day) => {
        const cells = [];
        let i = 0;
        while (i < PERIODS.length) {
            const period = PERIODS[i];
            if (period === 'Lunch') {
                cells.push({ periodIdx: i, span: 1, isLunch: true });
                i++;
                continue;
            }
            const subjectId = timetable[`${day}-${period}`];
            if (subjectId) {
                let span = 1;
                while (i + span < PERIODS.length) {
                    const nextP = PERIODS[i + span];
                    if (nextP === 'Lunch') break;
                    if (timetable[`${day}-${nextP}`] !== subjectId) break;
                    span++;
                }
                cells.push({ periodIdx: i, span, subjectId });
                i += span;
            } else {
                cells.push({ periodIdx: i, span: 1, subjectId: null });
                i++;
            }
        }
        return cells;
    };

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
            <Table size="small" sx={{ minWidth: 600, tableLayout: 'fixed' }}>
                <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.dark' }}>
                        <TableCell sx={{ fontWeight: 'bold', width: 80, fontSize: '0.75rem', color: 'primary.contrastText', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Day</TableCell>
                        {PERIODS.map(p => (
                            <TableCell key={p} align="center" sx={{ fontWeight: 'bold', fontSize: '0.7rem', p: 1, width: p === 'Lunch' ? 40 : 'auto', color: 'primary.contrastText', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                <Box sx={{ opacity: 0.9 }}>{p}</Box>
                                <Box sx={{ fontSize: '0.6rem', fontWeight: 'normal', opacity: 0.7, mt: 0.2 }}>{PERIOD_TIMINGS[p]}</Box>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {DAYS.map(day => {
                        const row = getMergedRow(day);
                        return (
                            <TableRow key={day} sx={{ height: 60 }}>
                                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'action.hover', fontSize: '0.7rem', borderRight: '1px solid', borderColor: 'divider' }}>{day}</TableCell>
                                {row.map((cell, idx) => {
                                    if (cell.isLunch) return <TableCell key={idx} sx={{ bgcolor: 'action.disabledBackground', p: 0, borderRight: '1px solid', borderColor: 'divider' }} />;
                                    if (cell.subjectId) {
                                        const sub = getSubject(cell.subjectId);
                                        const color = subjectColorMap[cell.subjectId] || SUBJECT_COLORS[0];
                                        return (
                                            <TableCell key={idx} colSpan={cell.span} align="center" sx={{ p: 0.5, borderRight: '1px solid', borderColor: 'divider' }}>
                                                <Box sx={{
                                                    bgcolor: color.bg,
                                                    color: color.text,
                                                    borderRadius: 1.5,
                                                    p: 1,
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    transition: 'transform 0.2s',
                                                    '&:hover': { transform: 'scale(1.02)' }
                                                }}>
                                                    <Typography variant="caption" fontWeight={800} sx={{ display: 'block', lineHeight: 1.1, fontSize: '0.7rem' }}>
                                                        {sub?.name || 'Subject'}
                                                    </Typography>
                                                    {cell.span > 1 && (
                                                        <Chip 
                                                            label={`${cell.span} hrs`} 
                                                            size="small" 
                                                            sx={{ 
                                                                height: 16, 
                                                                fontSize: '0.6rem', 
                                                                mt: 0.5, 
                                                                bgcolor: 'rgba(255,255,255,0.2)', 
                                                                color: 'inherit',
                                                                fontWeight: 700
                                                            }} 
                                                        />
                                                    )}
                                                </Box>
                                            </TableCell>
                                        );
                                    }
                                    return <TableCell key={idx} sx={{ p: 0.5, borderRight: '1px solid', borderColor: 'divider' }} />;
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

const StudentDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // UI State
    const [activeSection, setActiveSection] = useState('dashboard');
    const [showScanPage, setShowScanPage] = useState(false);

    // Data State
    const [analytics, setAnalytics] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [todaySessions, setTodaySessions] = useState([]);
    const [history, setHistory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classCurriculum, setClassCurriculum] = useState(null);
    const [subjectSearch, setSubjectSearch] = useState("");

    // Load dismissed alerts from localStorage on mount or when user changes
    const handleDismissAlert = async (alertId) => {
        try {
            await markAlertAsRead(alertId);
            setAlerts(prev => prev.filter(a => a.id !== alertId));
        } catch (e) {
            console.error("Failed to mark alert as read", e);
        }
    };

    const filteredSubjects = useMemo(() => {
        if (!subjectSearch.trim()) return subjects;
        return subjects.filter(s => 
            (s.name && s.name.toLowerCase().includes(subjectSearch.toLowerCase())) || 
            (s.code && s.code.toLowerCase().includes(subjectSearch.toLowerCase()))
        );
    }, [subjects, subjectSearch]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const results = await Promise.allSettled([
                getStudentAnalytics(),
                getAttendanceStatus(),
                getTodaySessions(),
                getAttendanceHistory(10),
                getStudentAlerts(),
                getStudentSubjects(),
                getStudentClassCurriculum()
            ]);

            if (results[0].status === 'fulfilled') setAnalytics(results[0].value);
            if (results[1].status === 'fulfilled') setAttendanceStatus(results[1].value);
            if (results[2].status === 'fulfilled') setTodaySessions(results[2].value);
            if (results[3].status === 'fulfilled') setHistory(results[3].value);
            if (results[4].status === 'fulfilled') setAlerts(results[4].value);
            if (results[5].status === 'fulfilled') setSubjects(results[5].value);
            if (results[6].status === 'fulfilled') setClassCurriculum(results[6].value);
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        }
    };

    // Helper to get status badge
    const getStatusBadge = (percentage) => {
        if (percentage >= 75) return { label: "Safe", color: "success" };
        if (percentage >= 65) return { label: "At Risk", color: "warning" };
        return { label: "Critical", color: "error" };
    };

    const status = getStatusBadge(analytics?.percentage || 0);

    // Sidebar menu — consistent with DashboardLayout
    const menuItems = [
        { id: 'dashboard', icon: <DashboardIcon fontSize="small" />, label: 'Dashboard' },
        { id: 'scanqr', icon: <QrCodeScannerIcon fontSize="small" />, label: 'Scan QR Code', highlight: true },
        { divider: true },
        { label: 'Academics', isLabel: true },
        { id: 'subjects', icon: <SchoolIcon fontSize="small" />, label: 'Subject Performance' },
        { id: 'resources', icon: <DescriptionIcon fontSize="small" />, label: 'Timetable & Syllabus' },
        { id: 'history', icon: <HistoryIcon fontSize="small" />, label: 'History' },
    ];

    const handleSectionChange = (id) => {
        if (id === 'scanqr') {
            setShowScanPage(true);
        } else {
            setActiveSection(id);
            setShowScanPage(false);
        }
    };

    const currentLabel = showScanPage
        ? 'Scan Attendance'
        : menuItems.find(m => m.id === activeSection)?.label || 'Dashboard';

    return (
        <DashboardLayout
            title={currentLabel}
            subtitle="Student Portal"
            portalIcon={<SchoolIcon fontSize="small" />}
            portalTitle="STUDENT"
            portalSubtitle="Attendance Portal"
            menuItems={menuItems}
            activeSection={showScanPage ? 'scanqr' : activeSection}
            onSectionChange={handleSectionChange}
            notifications={alerts.length}
            statusChip={status.label !== 'Safe'
                ? { label: `${Math.round(analytics?.percentage || 0)}% Attendance`, color: status.color }
                : { label: `${Math.round(analytics?.percentage || 0)}% Attendance`, color: 'success' }
            }
        >
            {showScanPage ? (
                <ScanAttendance onBack={() => { setShowScanPage(false); fetchAllData(); }} />
            ) : (
                <>
                    {/* ═══════════ DASHBOARD VIEW ═══════════ */}
                    {activeSection === 'dashboard' && (
                        <Fade in timeout={400}>
                            <Stack spacing={3}>
                                {/* Greeting */}
                                <GreetingWidget />

                                {/* Stats Row */}

                                {/* Stats Row */}
                                <Grid container spacing={2.5}>
                                    <Grid item xs={6} sm={3}>
                                        <StatsCard
                                            title="Attendance"
                                            value={`${Math.round(analytics?.percentage || 0)}%`}
                                            icon={<TrendingUpIcon />}
                                            color={theme.palette[status.color].main}
                                            subtitle={status.label}
                                            variant="gradient"
                                            animationDelay={0}
                                        />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <StatsCard
                                            title="Present"
                                            value={analytics?.presentCount || 0}
                                            icon={<CheckCircleIcon />}
                                            color={theme.palette.success.main}
                                            subtitle="classes attended"
                                            variant="outlined"
                                            animationDelay={100}
                                        />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <StatsCard
                                            title="Absent"
                                            value={(analytics?.totalSessions || 0) - (analytics?.presentCount || 0)}
                                            icon={<CancelIcon />}
                                            color={theme.palette.error.main}
                                            subtitle="classes missed"
                                            variant="outlined"
                                            animationDelay={200}
                                        />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <StatsCard
                                            title="Classes Needed"
                                            value={attendanceStatus?.classesNeededForEligibility || 0}
                                            icon={<EventAvailableIcon />}
                                            color={theme.palette.warning.main}
                                            subtitle="to reach 75%"
                                            variant="outlined"
                                            animationDelay={300}
                                        />
                                    </Grid>
                                </Grid>

                                {/* Academic Alerts - Persistent & Scrollable */}
                                {alerts.length > 0 && (
                                    <Card sx={{
                                        borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2),
                                        mb: 2.5, boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                                        overflow: 'hidden',
                                        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 1)}, ${alpha(theme.palette.error.main, 0.02)})`
                                    }}>
                                        <Box sx={{
                                            px: 2.5, py: 2,
                                            borderBottom: '1px solid', borderColor: alpha(theme.palette.error.main, 0.1),
                                            display: 'flex', alignItems: 'center', gap: 1,
                                            bgcolor: alpha(theme.palette.error.main, 0.03)
                                        }}>
                                            <NotificationsIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                                            <Typography variant="subtitle1" fontWeight={800} color="error.main">Important Notifications</Typography>
                                            <Chip label={alerts.length} size="small" color="error" sx={{ ml: 'auto', fontWeight: 900, height: 20 }} />
                                        </Box>
                                        <CardContent sx={{ 
                                            maxHeight: 250, 
                                            overflowY: 'auto',
                                            p: 0,
                                            '&::-webkit-scrollbar': { width: 6 },
                                            '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 3 }
                                        }}>
                                            <List sx={{ py: 0 }}>
                                                {alerts.map((alert, index) => (
                                                    <React.Fragment key={alert.id}>
                                                        {index > 0 && <Divider sx={{ opacity: 0.5, mx: 2 }} />}
                                                        <ListItem 
                                                            sx={{ 
                                                                py: 2, px: 2.5,
                                                                transition: 'all 0.2s',
                                                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.02) }
                                                            }}
                                                            secondaryAction={
                                                                <Tooltip title="Mark as Read">
                                                                    <IconButton 
                                                                        edge="end" size="small" color="success" 
                                                                        onClick={() => handleDismissAlert(alert.id)}
                                                                        sx={{ 
                                                                            bgcolor: alpha(theme.palette.success.main, 0.05),
                                                                            '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.15) }
                                                                        }}
                                                                    >
                                                                        <CheckIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <ListItemText 
                                                                primary={alert.message}
                                                                primaryTypographyProps={{ 
                                                                    variant: 'body2', 
                                                                    fontWeight: 600,
                                                                    color: 'text.primary'
                                                                }}
                                                                secondary={new Date(alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                secondaryTypographyProps={{ variant: 'caption', sx: { mt: 0.5, display: 'block', opacity: 0.7 } }}
                                                            />
                                                        </ListItem>
                                                    </React.Fragment>
                                                ))}
                                            </List>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Attendance Progress */}
                                <Card sx={{
                                    borderRadius: 3, border: '1px solid', borderColor: 'divider',
                                    borderLeft: `6px solid ${theme.palette[status.color].main}`,
                                    overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6" fontWeight={800}>Attendance Progress</Typography>
                                            <Chip
                                                label={status.label}
                                                color={status.color}
                                                size="small"
                                                sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                            />
                                        </Box>
                                        <Box display="flex" alignItems="baseline" gap={1} mb={1.5}>
                                            <Typography variant="h3" fontWeight={800} color={`${status.color}.main`}>
                                                {Math.round(analytics?.percentage || 0)}%
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                                of {analytics?.totalSessions || 0} total classes
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(analytics?.percentage || 0, 100)}
                                            color={status.color}
                                            sx={{
                                                height: 12,
                                                borderRadius: 6,
                                                bgcolor: alpha(theme.palette[status.color].main, 0.12),
                                            }}
                                        />
                                        <Box display="flex" justifyContent="space-between" mt={1.5}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>0%</Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                                Minimum: 75%
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>100%</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>

                                {/* Smart Attendance Insights - Static & Scrollable */}
                                <Card sx={{
                                    borderRadius: 3, border: '1px solid', borderColor: 'divider',
                                    mt: 2.5, mb: 2.5, boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                                    overflow: 'hidden'
                                }}>
                                    <Box sx={{
                                        px: 2.5, py: 2,
                                        borderBottom: '1px solid', borderColor: 'divider',
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                                    }}>
                                        <TrendingUpIcon color="primary" fontSize="small" />
                                        <Typography variant="subtitle1" fontWeight={700}>Smart Attendance Insights</Typography>
                                    </Box>
                                    <CardContent sx={{ 
                                        maxHeight: 320, 
                                        overflowY: 'auto',
                                        p: 2.5,
                                        '&::-webkit-scrollbar': { width: 6 },
                                        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 }
                                    }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{
                                                    p: 2, borderRadius: 2, height: '100%',
                                                    bgcolor: alpha(theme.palette.info.main, isDark ? 0.1 : 0.05),
                                                    border: '1px solid',
                                                    borderColor: alpha(theme.palette.info.main, 0.2)
                                                }}>
                                                    <Typography variant="caption" color="info.main" fontWeight={700}>
                                                        📊 ATTENDANCE PREDICTION
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                                                        Missing the next <strong>2 classes</strong> will drop your overall attendance to{' '}
                                                        <span style={{ color: theme.palette.error.main, fontWeight: 700 }}>
                                                            {((analytics?.presentCount || 0) / ((analytics?.totalSessions || 0) + 2) * 100).toFixed(1)}%
                                                        </span>. Try to maintain consistency.
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{
                                                    p: 2, borderRadius: 2, height: '100%',
                                                    bgcolor: alpha(theme.palette.success.main, isDark ? 0.1 : 0.05),
                                                    border: '1px solid',
                                                    borderColor: alpha(theme.palette.success.main, 0.2)
                                                }}>
                                                    <Typography variant="caption" color="success.main" fontWeight={700}>
                                                        💡 ACADEMIC RECOMMENDATION
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                                                        {(analytics?.percentage || 0) >= 75
                                                            ? "Excellent! You're currently meeting the 75% eligibility threshold. Keep attending regularly to stay safe."
                                                            : `You need to attend approximately the next ${attendanceStatus?.classesNeededForEligibility || 3} classes without missing to reach the 75% goal.`
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <Box sx={{
                                                    p: 2, borderRadius: 2, height: '100%',
                                                    bgcolor: alpha(theme.palette.warning.main, isDark ? 0.1 : 0.05),
                                                    border: '1px solid',
                                                    borderColor: alpha(theme.palette.warning.main, 0.2)
                                                }}>
                                                    <Typography variant="caption" color="warning.main" fontWeight={700}>
                                                        📅 SEMESTER PROGRESS
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                                                        You have attended <strong>{analytics?.presentCount || 0}</strong> out of <strong>{analytics?.totalSessions || 0}</strong> conducted sessions. 
                                                        The semester is moving fast, stay updated!
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                {/* Quick Actions */}
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
                                            Quick Actions
                                        </Typography>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                            <Button
                                                variant="contained"
                                                startIcon={<QrCodeScannerIcon />}
                                                onClick={() => setShowScanPage(true)}
                                                sx={{
                                                    borderRadius: 2, fontWeight: 700,
                                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                }}
                                            >
                                                Scan & Mark Attendance
                                            </Button>
                                            {classCurriculum?.timetableImageUrl && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<CalendarIcon />}
                                                    onClick={() => window.open(`http://localhost:8080${classCurriculum.timetableImageUrl}`, '_blank', 'noopener,noreferrer')}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    View Timetable
                                                </Button>
                                            )}
                                            {classCurriculum?.syllabusUrl && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<DescriptionIcon />}
                                                    onClick={() => window.open(`http://localhost:8080${classCurriculum.syllabusUrl}`, '_blank', 'noopener,noreferrer')}
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    View Syllabus
                                                </Button>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Stack>
                        </Fade>
                    )}

                    {/* ═══════════ SUBJECT PERFORMANCE VIEW ═══════════ */}
                    {activeSection === 'subjects' && (
                        <Fade in timeout={400}>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="caption" sx={{ letterSpacing: 1.5, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                                        SUBJECT-WISE ATTENDANCE
                                    </Typography>
                                    <Divider sx={{ flexGrow: 1, mx: 2 }} />
                                    <Chip label={`${subjects.length} subjects`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }} />
                                </Box>

                                <Card sx={{ 
                                    mb: 3, 
                                    borderRadius: 3, 
                                    bgcolor: alpha(theme.palette.success.main, 0.05),
                                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                                    boxShadow: 'none'
                                }}>
                                    <CardContent sx={{ display: 'flex', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ 
                                            bgcolor: 'success.main', 
                                            color: '#fff', 
                                            borderRadius: 2, 
                                            p: 1, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            height: 'fit-content'
                                        }}>
                                            <LightbulbIcon fontSize="small" />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700} color="success.main" gutterBottom>
                                                Quick Tip
                                            </Typography>
                                            <Typography variant="body2" color="success.dark">
                                                The 75% rule means for every 3 classes you miss, you need to attend 9 more to compensate. Green bars are above 77% (safe zone), amber at 75-77% (at risk), and red means immediate action needed.
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>

                                <TextField 
                                    placeholder="Search subject..." 
                                    size="small" 
                                    fullWidth 
                                    sx={{ 
                                        mb: 3, 
                                        '& .MuiOutlinedInput-root': { 
                                            borderRadius: 3,
                                            bgcolor: 'background.paper',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                            '& fieldset': { border: 'none' }
                                        } 
                                    }}
                                    InputProps={{ 
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ) 
                                    }} 
                                    value={subjectSearch}
                                    onChange={(e) => setSubjectSearch(e.target.value)}
                                />

                                <Stack spacing={2}>
                                    {filteredSubjects.length === 0 ? (
                                        <Box sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                            <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                            <Typography variant="h6" color="text.secondary">No subjects found</Typography>
                                        </Box>
                                    ) : (
                                        filteredSubjects.map(sub => {
                                            const pct = sub.attendancePercentage || 0;
                                            const subStatus = getStatusBadge(pct);
                                            const total = sub.total || 0;
                                            const attended = sub.attended || 0;
                                            const absent = total - attended;
                                            
                                            let skipOrNeedText = '';
                                            let skipOrNeedColor = '';
                                            const canSkip = Math.floor(attended / 0.75) - total;
                                            if (canSkip >= 0) {
                                                skipOrNeedText = `Can Skip ${canSkip}`;
                                                skipOrNeedColor = 'success';
                                            } else {
                                                const need = Math.ceil(3 * total - 4 * attended);
                                                skipOrNeedText = `Need ${Math.max(1, need)} more`;
                                                skipOrNeedColor = 'error';
                                            }

                                            return (
                                                <Card key={sub.id} sx={{ 
                                                    borderRadius: 3, 
                                                    border: '1px solid', 
                                                    borderColor: 'divider',
                                                    borderLeft: `6px solid ${theme.palette[subStatus.color].main}`,
                                                    boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
                                                }}>
                                                    <CardContent sx={{ p: '20px !important', display: 'flex', alignItems: 'center', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                                                        
                                                        {/* Left Stats */}
                                                        <Box sx={{ minWidth: 100 }}>
                                                            <Typography variant="h5" fontWeight={800} color={`${subStatus.color}.main`}>
                                                                {pct.toFixed(1)}%
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ letterSpacing: 1, fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                                                                ATTEND
                                                            </Typography>
                                                            <Typography variant="caption" color="text.disabled" display="block" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
                                                                <CalendarIcon sx={{ fontSize: 12 }} /> 
                                                                Jan 2026<br/>
                                                                <CalendarIcon sx={{ fontSize: 12 }} />
                                                                May 2026
                                                            </Typography>
                                                        </Box>

                                                        {/* Center Details */}
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography variant="subtitle1" fontWeight={800} sx={{ textTransform: 'uppercase', mb: 1 }}>
                                                                {sub.name}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                <Chip size="small" label={`${total} hrs total`} sx={{ borderRadius: 1.5, bgcolor: alpha(theme.palette.text.primary, 0.05), fontWeight: 600 }} />
                                                                <Chip size="small" label={`✓ ${attended} present`} sx={{ borderRadius: 1.5, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 600 }} />
                                                                <Chip size="small" label={`✗ ${absent} absent`} sx={{ borderRadius: 1.5, bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', fontWeight: 600 }} />
                                                                <Chip size="small" label={skipOrNeedText} sx={{ borderRadius: 1.5, bgcolor: alpha(theme.palette[skipOrNeedColor].main, 0.1), color: `${skipOrNeedColor}.main`, fontWeight: 600 }} />
                                                            </Box>
                                                        </Box>

                                                        {/* Right Status */}
                                                        <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                                                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                                {pct >= 75 ? 'On track' : 'Action needed'}
                                                            </Typography>
                                                        </Box>

                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    )}
                                </Stack>
                            </Box>
                        </Fade>
                    )}


                    {/* ═══════════ TIMETABLE & SYLLABUS VIEW ═══════════ */}
                    {activeSection === 'resources' && (
                        <Fade in timeout={400}>
                            <Stack spacing={2.5}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="h6" fontWeight={700}>Timetable & Syllabus</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Published for your class (department, program, semester, and section).
                                        </Typography>
                                    </Box>

                                    {!classCurriculum || classCurriculum.empty || (!classCurriculum.timetableImageUrl && !classCurriculum.timetableText && !classCurriculum.syllabusUrl && !classCurriculum.syllabusText) ? (
                                        <Box sx={{ p: 4, textAlign: 'center' }}>
                                            <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                            <Typography variant="h6" color="text.secondary">Not published yet</Typography>
                                            <Typography variant="body2" color="text.disabled">
                                                Your timetable and syllabus will appear here once your department uploads them.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box sx={{ p: 2.5 }}>
                                            <Grid container spacing={2.5}>
                                                <Grid item xs={12}>
                                                     <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                         <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ mb: 2 }}>
                                                             Timetable
                                                         </Typography>
                                                         
                                                         {classCurriculum.timetableText && classCurriculum.timetableText.trim().startsWith('{') ? (
                                                             <TimetableDisplay data={classCurriculum.timetableText} subjects={subjects} />
                                                         ) : classCurriculum.timetableImageUrl ? (
                                                             <Box sx={{ textAlign: 'center' }}>
                                                                 <Button
                                                                     variant="contained"
                                                                     size="large"
                                                                     startIcon={<CalendarIcon />}
                                                                     onClick={() => window.open(`http://localhost:8080${classCurriculum.timetableImageUrl}`, '_blank', 'noopener,noreferrer')}
                                                                     sx={{ borderRadius: 2, width: '100%', py: 1.5, fontWeight: 700, maxWidth: 300 }}
                                                                 >
                                                                     View Timetable Image
                                                                 </Button>
                                                             </Box>
                                                         ) : (
                                                             <Typography
                                                                 variant="body2"
                                                                 sx={{ whiteSpace: 'pre-wrap', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}
                                                                 color={classCurriculum.timetableText ? 'text.primary' : 'text.secondary'}
                                                             >
                                                                 {classCurriculum.timetableText || 'No timetable provided yet.'}
                                                             </Typography>
                                                         )}
                                                     </Paper>
                                                 </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                        <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                                                            Syllabus
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ whiteSpace: 'pre-wrap' }}
                                                            color={classCurriculum.syllabusText ? 'text.primary' : 'text.secondary'}
                                                        >
                                                            {classCurriculum.syllabusText || 'No syllabus text provided.'}
                                                        </Typography>
                                                        {classCurriculum.syllabusUrl && (
                                                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                                                <Button
                                                                    variant="contained"
                                                                    size="large"
                                                                    startIcon={<DescriptionIcon />}
                                                                    sx={{ borderRadius: 2, width: '100%', py: 1.5, fontWeight: 700 }}
                                                                    onClick={() => window.open(`http://localhost:8080${classCurriculum.syllabusUrl}`, '_blank', 'noopener,noreferrer')}
                                                                >
                                                                    View Syllabus
                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}

                                </Card>
                            </Stack>
                        </Fade>
                    )}

                    {/* ═══════════ HISTORY VIEW ═══════════ */}
                    {activeSection === 'history' && (
                        <Fade in timeout={400}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="h6" fontWeight={700}>Attendance History</Typography>
                                    <Typography variant="caption" color="text.secondary">Last 10 records</Typography>
                                </Box>
                                {history.length === 0 ? (
                                    <Box sx={{ p: 6, textAlign: 'center' }}>
                                        <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="h6" color="text.secondary">No attendance records yet</Typography>
                                    </Box>
                                ) : (
                                    <List disablePadding>
                                        {history.map((record, idx) => (
                                            <React.Fragment key={idx}>
                                                <ListItem sx={{ py: 1.5, px: 2.5 }}>
                                                    <Box sx={{
                                                        mr: 2, textAlign: 'center', minWidth: 50,
                                                        p: 1, borderRadius: 2,
                                                        bgcolor: alpha(
                                                            record.status === 'Present' ? theme.palette.success.main : theme.palette.error.main,
                                                            isDark ? 0.15 : 0.06
                                                        ),
                                                    }}>
                                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                            {new Date(record.date).toLocaleDateString([], { month: 'short' }).toUpperCase()}
                                                        </Typography>
                                                        <Typography variant="subtitle2" fontWeight={800}>
                                                            {new Date(record.date).getDate()}
                                                        </Typography>
                                                    </Box>
                                                    <ListItemText
                                                        primary={<Typography variant="body2" fontWeight={600}>{record.subjectName}</Typography>}
                                                        secondary={
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Typography>
                                                        }
                                                    />
                                                    <Chip
                                                        icon={record.status === 'Present' ? <CheckCircleIcon /> : <CancelIcon />}
                                                        label={record.status}
                                                        size="small"
                                                        color={record.status === 'Present' ? 'success' : 'error'}
                                                        variant="outlined"
                                                        sx={{ fontWeight: 600 }}
                                                    />
                                                </ListItem>
                                                {idx < history.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </Card>
                        </Fade>
                    )}
                </>
            )}

            {/* Floating Action Button for Quick Scan */}
            {!showScanPage && activeSection === 'dashboard' && (
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
                        onClick={() => setShowScanPage(true)}
                        sx={{
                            borderRadius: 3,
                            px: 3,
                            py: 1.5,
                            fontWeight: 700,
                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            '&:hover': {
                                boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
                                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                            }
                        }}
                    >
                        Scan QR
                    </Button>
                </Box>
            )}
        </DashboardLayout>
    );
};

export default StudentDashboard;
