import React, { useState, useEffect } from "react";
import {
    Typography, Button, Box, Grid, Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Avatar, Divider, List, ListItem,
    ListItemText, useTheme, Fade, LinearProgress, Stack, Alert, Paper
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    getStudentAnalytics, getStudentSubjects,
    getStudentClassCurriculum,
    getAttendanceStatus, getTodaySessions, getAttendanceHistory, getStudentAlerts
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
} from '@mui/icons-material';

import { useAuth } from "../context/AuthContext";
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import GreetingWidget from '../components/GreetingWidget';
import ScanAttendance from './ScanAttendance';

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
        { id: 'classes', icon: <CalendarIcon fontSize="small" />, label: 'My Classes' },
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

                                {/* Alerts */}
                                {alerts.length > 0 && (
                                    <Stack spacing={1}>
                                        {alerts.map((alert, idx) => (
                                            <Alert
                                                key={idx}
                                                severity="warning"
                                                variant="outlined"
                                                sx={{ borderRadius: 2 }}
                                                icon={<WarningIcon />}
                                            >
                                                {alert}
                                            </Alert>
                                        ))}
                                    </Stack>
                                )}

                                {/* Stats Row */}
                                <Grid container spacing={2.5}>
                                    <Grid item xs={6} sm={3}>
                                        <StatsCard
                                            title="Attendance"
                                            value={`${Math.round(analytics?.percentage || 0)}%`}
                                            icon={<TrendingUpIcon />}
                                            color={theme.palette[status.color].main}
                                            subtitle={status.label}
                                            animationDelay={0}
                                        />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <StatsCard
                                            title="Present"
                                            value={analytics?.totalPresent || 0}
                                            icon={<CheckCircleIcon />}
                                            color={theme.palette.success.main}
                                            subtitle="classes attended"
                                            animationDelay={100}
                                        />
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <StatsCard
                                            title="Absent"
                                            value={analytics?.totalAbsent || 0}
                                            icon={<CancelIcon />}
                                            color={theme.palette.error.main}
                                            subtitle="classes missed"
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
                                            animationDelay={300}
                                        />
                                    </Grid>
                                </Grid>

                                {/* Attendance Progress */}
                                <Card sx={{
                                    borderRadius: 3, border: '1px solid', borderColor: 'divider',
                                    overflow: 'hidden'
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6" fontWeight={700}>Attendance Progress</Typography>
                                            <Chip
                                                label={status.label}
                                                color={status.color}
                                                size="small"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        </Box>
                                        <Box display="flex" alignItems="baseline" gap={1} mb={1.5}>
                                            <Typography variant="h3" fontWeight={800} color="text.primary">
                                                {Math.round(analytics?.percentage || 0)}%
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                of {analytics?.totalSessions || 0} total classes
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.min(analytics?.percentage || 0, 100)}
                                            color={status.color}
                                            sx={{
                                                height: 10,
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette[status.color].main, 0.12),
                                            }}
                                        />
                                        <Box display="flex" justifyContent="space-between" mt={1}>
                                            <Typography variant="caption" color="text.secondary">0%</Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                Minimum: 75%
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">100%</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>

                                <Grid container spacing={2.5}>
                                    {/* Today's Schedule */}
                                    <Grid item xs={12} md={7}>
                                        <Card sx={{
                                            borderRadius: 3, border: '1px solid', borderColor: 'divider',
                                            height: '100%', overflow: 'hidden'
                                        }}>
                                            <Box sx={{
                                                px: 2.5, py: 2,
                                                borderBottom: '1px solid', borderColor: 'divider',
                                                display: 'flex', alignItems: 'center', gap: 1
                                            }}>
                                                <CalendarIcon color="primary" fontSize="small" />
                                                <Typography variant="subtitle1" fontWeight={700}>Today's Schedule</Typography>
                                                <Chip label={todaySessions.length} size="small" color="primary" variant="outlined" sx={{ ml: 'auto' }} />
                                            </Box>
                                            {todaySessions.length === 0 ? (
                                                <Box sx={{ p: 5, textAlign: 'center' }}>
                                                    <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                                                    <Typography variant="subtitle1" color="text.secondary" fontWeight={600}>
                                                        No classes today
                                                    </Typography>
                                                    <Typography variant="body2" color="text.disabled">
                                                        Enjoy your free day!
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <List disablePadding>
                                                    {todaySessions.map((session, idx) => (
                                                        <React.Fragment key={idx}>
                                                            <ListItem sx={{ px: 2.5, py: 1.5 }}>
                                                                <Box sx={{
                                                                    mr: 2, textAlign: 'center', minWidth: 52,
                                                                    p: 1, borderRadius: 2,
                                                                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.06)
                                                                }}>
                                                                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                                                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </Typography>
                                                                </Box>
                                                                <ListItemText
                                                                    primary={<Typography variant="body2" fontWeight={700}>{session.subjectName}</Typography>}
                                                                    secondary={session.facultyName}
                                                                />
                                                                <Chip
                                                                    label={session.status}
                                                                    size="small"
                                                                    color={session.status === 'Open' ? 'success' : 'default'}
                                                                    variant={session.status === 'Open' ? 'filled' : 'outlined'}
                                                                    sx={{ fontWeight: 600 }}
                                                                />
                                                            </ListItem>
                                                            {idx < todaySessions.length - 1 && <Divider />}
                                                        </React.Fragment>
                                                    ))}
                                                </List>
                                            )}
                                        </Card>
                                    </Grid>

                                    {/* Smart Insights */}
                                    <Grid item xs={12} md={5}>
                                        <Card sx={{
                                            borderRadius: 3, border: '1px solid', borderColor: 'divider',
                                            height: '100%',
                                        }}>
                                            <Box sx={{
                                                px: 2.5, py: 2,
                                                borderBottom: '1px solid', borderColor: 'divider',
                                                display: 'flex', alignItems: 'center', gap: 1
                                            }}>
                                                <TrendingUpIcon color="primary" fontSize="small" />
                                                <Typography variant="subtitle1" fontWeight={700}>Smart Insights</Typography>
                                            </Box>
                                            <CardContent>
                                                <Stack spacing={2}>
                                                    <Box sx={{
                                                        p: 2, borderRadius: 2,
                                                        bgcolor: alpha(theme.palette.info.main, isDark ? 0.1 : 0.05),
                                                        border: '1px solid',
                                                        borderColor: alpha(theme.palette.info.main, 0.2)
                                                    }}>
                                                        <Typography variant="caption" color="info.main" fontWeight={700}>
                                                            📊 PREDICTION
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                            Missing <strong>2 classes</strong> will drop to{' '}
                                                            <span style={{ color: theme.palette.error.main, fontWeight: 700 }}>
                                                                {((analytics?.totalPresent || 0) / ((analytics?.totalSessions || 0) + 2) * 100).toFixed(1)}%
                                                            </span>
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{
                                                        p: 2, borderRadius: 2,
                                                        bgcolor: alpha(theme.palette.success.main, isDark ? 0.1 : 0.05),
                                                        border: '1px solid',
                                                        borderColor: alpha(theme.palette.success.main, 0.2)
                                                    }}>
                                                        <Typography variant="caption" color="success.main" fontWeight={700}>
                                                            💡 RECOMMENDATION
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                                                            {(analytics?.percentage || 0) >= 75
                                                                ? "You're on track! Keep attending regularly."
                                                                : "Attend the next 3 classes to improve your attendance safely."
                                                            }
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{
                                                        p: 2, borderRadius: 2,
                                                        bgcolor: alpha(theme.palette.warning.main, isDark ? 0.1 : 0.05),
                                                        border: '1px solid',
                                                        borderColor: alpha(theme.palette.warning.main, 0.2)
                                                    }}>
                                                        <Typography variant="caption" color="warning.main" fontWeight={700}>
                                                            📅 SEMESTER PROGRESS
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                                                            {analytics?.totalPresent || 0} of {analytics?.totalSessions || 0} classes attended so far
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>

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
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<DownloadIcon />}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                Download Report
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<DescriptionIcon />}
                                                sx={{ borderRadius: 2 }}
                                            >
                                                Apply for Leave
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Stack>
                        </Fade>
                    )}

                    {/* ═══════════ SUBJECT PERFORMANCE VIEW ═══════════ */}
                    {activeSection === 'subjects' && (
                        <Fade in timeout={400}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="h6" fontWeight={700}>Subject-wise Performance</Typography>
                                </Box>
                                {subjects.length === 0 ? (
                                    <Box sx={{ p: 6, textAlign: 'center' }}>
                                        <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="h6" color="text.secondary">No subjects found</Typography>
                                    </Box>
                                ) : (
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Subject</TableCell>
                                                    <TableCell align="center">Attended / Total</TableCell>
                                                    <TableCell align="center">Percentage</TableCell>
                                                    <TableCell align="right">Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {subjects.map((sub) => {
                                                    const pct = sub.attendancePercentage || 0;
                                                    const subStatus = getStatusBadge(pct);
                                                    return (
                                                        <TableRow key={sub.id} hover>
                                                            <TableCell>
                                                                <Typography fontWeight={600} variant="body2">{sub.name}</Typography>
                                                                <Typography variant="caption" color="text.secondary">{sub.code}</Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    {sub.attended || 0} / {sub.total || 0}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                                    <LinearProgress
                                                                        variant="determinate"
                                                                        value={Math.min(pct, 100)}
                                                                        color={subStatus.color}
                                                                        sx={{ width: 80, height: 6, borderRadius: 1 }}
                                                                    />
                                                                    <Typography variant="body2" fontWeight={700}>{pct.toFixed(0)}%</Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Chip
                                                                    label={subStatus.label}
                                                                    size="small"
                                                                    color={subStatus.color}
                                                                    variant="outlined"
                                                                    sx={{ fontWeight: 600 }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Card>
                        </Fade>
                    )}

                    {/* ═══════════ MY CLASSES VIEW ═══════════ */}
                    {activeSection === 'classes' && (
                        <Fade in timeout={400}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="h6" fontWeight={700}>Today's Classes</Typography>
                                </Box>
                                {todaySessions.length === 0 ? (
                                    <Box sx={{ p: 6, textAlign: 'center' }}>
                                        <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="h6" color="text.secondary">No classes scheduled</Typography>
                                        <Typography variant="body2" color="text.disabled">Check back tomorrow!</Typography>
                                    </Box>
                                ) : (
                                    <List disablePadding>
                                        {todaySessions.map((session, idx) => (
                                            <React.Fragment key={idx}>
                                                <ListItem sx={{ py: 2, px: 2.5 }}>
                                                    <Box sx={{
                                                        mr: 2.5, textAlign: 'center', minWidth: 64,
                                                        p: 1.5, borderRadius: 2,
                                                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.06),
                                                    }}>
                                                        <Typography variant="caption" color="text.secondary">START</Typography>
                                                        <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </Box>
                                                    <ListItemText
                                                        primary={<Typography variant="subtitle2" fontWeight={700}>{session.subjectName}</Typography>}
                                                        secondary={session.facultyName}
                                                    />
                                                    {session.status === 'Open' ? (
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<QrCodeScannerIcon />}
                                                            onClick={() => setShowScanPage(true)}
                                                            sx={{ borderRadius: 2, fontWeight: 700 }}
                                                        >
                                                            Scan
                                                        </Button>
                                                    ) : (
                                                        <Chip
                                                            label={session.status}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontWeight: 600 }}
                                                        />
                                                    )}
                                                </ListItem>
                                                {idx < todaySessions.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </Card>
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

                                    {!classCurriculum || classCurriculum.empty ? (
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
                                                <Grid item xs={12} md={6}>
                                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                        <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                                                            Timetable
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                                                            color={classCurriculum.timetableText ? 'text.primary' : 'text.secondary'}
                                                        >
                                                            {classCurriculum.timetableText || 'No timetable text provided.'}
                                                        </Typography>
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
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                startIcon={<DownloadIcon />}
                                                                sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}
                                                                onClick={() => window.open(classCurriculum.syllabusUrl, '_blank', 'noopener,noreferrer')}
                                                            >
                                                                Open syllabus file
                                                            </Button>
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
