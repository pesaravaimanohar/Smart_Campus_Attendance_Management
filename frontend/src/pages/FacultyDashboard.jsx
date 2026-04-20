import React, { useState, useEffect, useCallback } from "react";
import {
    Typography, Button, Box, MenuItem, Select, FormControl,
    InputLabel, Grid, Card, CardContent, TextField, Slider,
    Avatar, IconButton, useTheme, Fade, Chip, Tooltip, Stack,
    Divider, Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Paper, Switch, CircularProgress, Alert, AlertTitle, LinearProgress,
    Badge, Skeleton, InputAdornment
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import QRCode from "react-qr-code";
import {
    getFacultyMappings, createSession, markManualAttendance,
    refreshSessionQr, endSession, getSessionAttendanceCount,
    getSessionAttendance, updateAttendanceStatus,
    getFacultyDashboard, getSessionHistory, getFacultyClassStats,
    getSessionReport
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
    Dashboard as DashboardIcon,
    QrCode2 as QrCodeIcon,
    AccessTime as TimerIcon,
    Person as PersonIcon,
    Class as ClassIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AddCircle as AddCircleIcon,
    StopCircle as StopCircleIcon,
    LocationOn as LocationIcon,
    Groups as GroupsIcon,
    PlayArrow as PlayIcon,
    School as SchoolIcon,
    Fullscreen as FullscreenIcon,
    Close as CloseIcon,
    ThumbUp as ApproveIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    RadioButtonChecked as LiveIcon,
    History as HistoryIcon,
    TrendingUp as TrendingUpIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    CalendarToday as CalendarIcon,
    BarChart as ChartIcon,
    EventNote as EventIcon,
    ArrowForward as ArrowIcon,
    Speed as SpeedIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';

// ═══════════════════════════════════════════════════════════════
//  FACULTY DASHBOARD — Complete Attendance System
// ═══════════════════════════════════════════════════════════════
const FacultyDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // ─── Tab State ─────────────────────────
    const [activeSection, setActiveSection] = useState('dashboard');

    // ─── Dashboard Data ────────────────────
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);

    // ─── Mappings (for session form) ───────
    const [mappings, setMappings] = useState([]);
    const [mappingsLoading, setMappingsLoading] = useState(true);

    // ─── Session Form State ────────────────
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedMapping, setSelectedMapping] = useState("");
    const [radius, setRadius] = useState(50);
    const [duration, setDuration] = useState(10);
    const [startingSession, setStartingSession] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [gettingLocation, setGettingLocation] = useState(false);
    const [facultyLocation, setFacultyLocation] = useState(null);

    // ─── Active Session State ──────────────
    const [session, setSession] = useState(null);
    const [qrValue, setQrValue] = useState("");
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [sessionTimer, setSessionTimer] = useState(0);
    const [qrDialogOpen, setQrDialogOpen] = useState(false);

    // ─── Post-Session Review ───────────────
    const [reviewMode, setReviewMode] = useState(false);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [approving, setApproving] = useState(false);
    const [approved, setApproved] = useState(false);
    const [endedSessionId, setEndedSessionId] = useState(null);

    // ─── Manual Entry ──────────────────────
    const [manualRollNo, setManualRollNo] = useState("");
    const [manualReason, setManualReason] = useState("");
    const [manualMessage, setManualMessage] = useState("");

    // ─── Session History ───────────────────
    const [sessionHistoryData, setSessionHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySearch, setHistorySearch] = useState("");

    // ─── Class Stats ───────────────────────
    const [classStats, setClassStats] = useState([]);
    const [classStatsLoading, setClassStatsLoading] = useState(false);

    // ─── Session Report Dialog ─────────────
    const [reportDialog, setReportDialog] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    // ═══════════════════════════════════════
    //  LOAD DATA
    // ═══════════════════════════════════════
    useEffect(() => {
        loadDashboard();
        loadMappings();
    }, []);

    useEffect(() => {
        if (activeSection === 'history' && sessionHistoryData.length === 0) loadHistory();
        if (activeSection === 'classes' && classStats.length === 0) loadClassStats();
        if (activeSection === 'reports' && classStats.length === 0) loadClassStats();
    }, [activeSection]);

    const loadDashboard = async () => {
        setDashboardLoading(true);
        try {
            const data = await getFacultyDashboard();
            setDashboardData(data);
        } catch (e) { console.error("Dashboard load error:", e); }
        finally { setDashboardLoading(false); }
    };

    const loadMappings = async () => {
        setMappingsLoading(true);
        try {
            const data = await getFacultyMappings();
            setMappings(data);
        } catch (e) { console.error("Mappings load error:", e); }
        finally { setMappingsLoading(false); }
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const data = await getSessionHistory(100);
            setSessionHistoryData(data);
        } catch (e) { console.error("History load error:", e); }
        finally { setHistoryLoading(false); }
    };

    const loadClassStats = async () => {
        setClassStatsLoading(true);
        try {
            const data = await getFacultyClassStats();
            setClassStats(data);
        } catch (e) { console.error("Class stats error:", e); }
        finally { setClassStatsLoading(false); }
    };

    const openReport = async (sessionId) => {
        setReportLoading(true);
        setReportDialog(true);
        try {
            const data = await getSessionReport(sessionId);
            setReportData(data);
        } catch (e) { console.error("Report error:", e); }
        finally { setReportLoading(false); }
    };

    // ═══════════════════════════════════════
    //  DERIVED VALUES
    // ═══════════════════════════════════════
    const uniqueClasses = React.useMemo(() => {
        const map = new Map();
        mappings.forEach(m => {
            if (!map.has(m.className)) map.set(m.className, { className: m.className, classId: m.classId });
        });
        return [...map.values()];
    }, [mappings]);

    const filteredSubjects = React.useMemo(() => {
        if (!selectedClass) return [];
        return mappings.filter(m => m.className === selectedClass);
    }, [mappings, selectedClass]);

    const getSelectedMappingInfo = () => mappings.find(m => String(m.id) === String(selectedMapping));

    const formatTimer = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.sub || 'Faculty';

    // ═══════════════════════════════════════
    //  SESSION POLLING
    // ═══════════════════════════════════════
    useEffect(() => {
        let qrInterval, countInterval, timerInterval;
        if (session) {
            const sid = session?.id ?? session?.sessionId;
            setQrValue(session.qrToken || `SESSION:${sid ?? ''}`);
            console.log("Current Session Token:", session.qrToken);
            setSessionTimer(0);
            qrInterval = setInterval(async () => {
                try {
                    const id = (session?.id ?? session?.sessionId);
                    if (id == null) return;
                    const d = await refreshSessionQr(id);
                    setQrValue(d.qrToken);
                } catch (e) {}
            }, 10000);
            countInterval = setInterval(async () => {
                try {
                    const id = (session?.id ?? session?.sessionId);
                    if (id == null) return;
                    const d = await getSessionAttendanceCount(id);
                    setAttendanceCount(d.count);
                } catch (e) {}
            }, 5000);
            timerInterval = setInterval(() => setSessionTimer(t => t + 1), 1000);
            if (sid != null) {
                getSessionAttendanceCount(sid).then(d => setAttendanceCount(d.count)).catch(() => {});
            }
        } else { setAttendanceCount(0); setSessionTimer(0); }
        return () => { clearInterval(qrInterval); clearInterval(countInterval); clearInterval(timerInterval); };
    }, [session]);

    // ═══════════════════════════════════════
    //  ACTIONS
    // ═══════════════════════════════════════
    const getLocation = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error("Geolocation not supported")); return; }
        setGettingLocation(true); setLocationError("");
        navigator.geolocation.getCurrentPosition(
            (pos) => { const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }; setFacultyLocation(loc); setGettingLocation(false); resolve(loc); },
            () => { setGettingLocation(false); reject(new Error("Location access denied. Please enable GPS.")); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

    const handleStartSession = async () => {
        if (!selectedMapping) return;
        setStartingSession(true); setLocationError("");
        try {
            const loc = await getLocation();
            const newSession = await createSession({ mapId: selectedMapping, latitude: loc.latitude, longitude: loc.longitude, duration, radius });
            const normalized = {
                ...newSession,
                id: newSession?.id ?? newSession?.sessionId,
            };
            setSession(normalized);
            setQrDialogOpen(true);
        } catch (e) { setLocationError(e.response?.data?.message || e.message || "Failed to start session"); }
        finally { setStartingSession(false); }
    };

    const handleEndSession = async () => {
        if (!session) return;
        const sid = session?.id ?? session?.sessionId;
        if (sid === undefined || sid === null) {
            alert("Failed to end session: missing session id. Please refresh the page and try again.");
            return;
        }
        try {
            await endSession(sid);
            setSession(null); setQrDialogOpen(false);
            setEndedSessionId(sid); setReviewMode(true); setApproved(false);
            setLoadingRecords(true);
            const records = await getSessionAttendance(sid);
            setAttendanceRecords(records);
        } catch (e) { alert("Failed to end session: " + (e.response?.data?.message || e.message)); }
        finally { setLoadingRecords(false); }
    };

    const toggleStudentStatus = (recordId) => {
        setAttendanceRecords(prev => prev.map(r => {
            if (r.recordId === recordId) {
                const newStatus = (r.status === 'PRESENT' || r.status === 'MANUAL_VERIFIED') ? 'REJECTED' : 'PRESENT';
                return { ...r, status: newStatus, modified: true };
            }
            return r;
        }));
    };

    const handleApproveAttendance = async () => {
        setApproving(true);
        try {
            const modified = attendanceRecords.filter(r => r.modified);
            for (const record of modified) {
                await updateAttendanceStatus(record.recordId, record.status, record.remarks || "Faculty reviewed");
            }
            setApproved(true);
            loadDashboard(); // Refresh dashboard stats
        } catch (e) { alert("Failed to approve: " + (e.response?.data?.message || e.message)); }
        finally { setApproving(false); }
    };

    const handleManualSubmit = async () => {
        if (!session) { setManualMessage("Start a session first."); return; }
        try {
            const sid = session?.id ?? session?.sessionId;
            if (sid == null) { setManualMessage("❌ Missing session id. Please refresh and try again."); return; }
            await markManualAttendance({ sessionId: sid, studentRollNo: manualRollNo, reason: manualReason });
            setManualMessage(`✅ ${manualRollNo} marked as Present`);
            setManualRollNo(""); setManualReason("");
            setTimeout(() => setManualMessage(""), 5000);
        } catch (error) { setManualMessage("❌ " + (error.response?.data?.message || "Invalid Roll No")); }
    };

    const resetToNewSession = () => {
        setReviewMode(false); setAttendanceRecords([]); setEndedSessionId(null);
        setApproved(false); setSelectedClass(""); setSelectedMapping("");
    };

    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'MANUAL_VERIFIED').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'REJECTED').length;

    // Filtered history
    const filteredHistory = sessionHistoryData.filter(s =>
        !historySearch ||
        s.subjectName?.toLowerCase().includes(historySearch.toLowerCase()) ||
        s.className?.toLowerCase().includes(historySearch.toLowerCase()) ||
        s.subjectCode?.toLowerCase().includes(historySearch.toLowerCase())
    );

    // ═══════════════════════════════════════
    //  SIDEBAR MENU
    // ═══════════════════════════════════════
    const menuItems = [
        { id: 'dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
        { id: 'divider-1', divider: true },
        { id: 'attendance', icon: <QrCodeIcon />, label: 'Take Attendance', highlight: true, badge: session ? 'LIVE' : null, badgeColor: 'error' },
        { id: 'divider-2', divider: true, label: 'ANALYTICS' },
        { id: 'classes', icon: <ClassIcon />, label: 'My Classes' },
        { id: 'history', icon: <HistoryIcon />, label: 'Session History' },
        { id: 'reports', icon: <AssignmentIcon />, label: 'Reports' },
    ];

    const currentLabel = menuItems.find(m => m.id === activeSection)?.label || 'Dashboard';

    // ═══════════════════════════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════════════════════════
    return (
        <DashboardLayout
            title={currentLabel}
            subtitle="Faculty Portal"
            portalIcon={<ClassIcon />}
            portalTitle="FACULTY"
            portalSubtitle="Attendance Portal"
            menuItems={menuItems}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            statusChip={session ? { label: 'Session Active', color: 'success' } : undefined}
        >

            {/* ══════════════════════════════════════════
                TAB: DASHBOARD OVERVIEW
            ══════════════════════════════════════════ */}
            {activeSection === 'dashboard' && (
                <Fade in timeout={400}>
                    <Box>
                        {/* Greeting */}
                        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#6366f1', 0.03) }}>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                {getGreeting()}, {displayName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Here's an overview of your teaching and attendance activity.
                            </Typography>
                        </Paper>

                        {/* Stats Cards */}
                        {dashboardLoading ? (
                            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                {[1,2,3,4].map(i => (
                                    <Grid item xs={6} md={3} key={i}>
                                        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : dashboardData && (
                            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                <Grid item xs={6} md={3}>
                                    <StatsCard title="Total Sessions" value={dashboardData.totalSessions} icon={<EventIcon />} color={theme.palette.primary.main} subtitle={`${dashboardData.todaySessions} today`} animationDelay={0} />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <StatsCard title="Assigned Classes" value={dashboardData.totalClasses} icon={<ClassIcon />} color={theme.palette.info.main} subtitle={`${dashboardData.totalSubjects} subjects`} animationDelay={100} />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <StatsCard title="Avg Attendance" value={`${dashboardData.avgAttendance}%`} icon={<TrendingUpIcon />} color={dashboardData.avgAttendance >= 75 ? theme.palette.success.main : theme.palette.warning.main} subtitle="across all sessions" animationDelay={200} />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <StatsCard title="Students Marked" value={dashboardData.totalStudentsMarked} icon={<GroupsIcon />} color={theme.palette.secondary.main} subtitle="total present marks" animationDelay={300} />
                                </Grid>
                            </Grid>
                        )}

                        {/* Quick Action + Recent Sessions */}
                        <Grid container spacing={3}>
                            {/* Quick Start */}
                            <Grid item xs={12} md={5}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                                    <Box sx={{ p: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, color: 'white', borderRadius: '12px 12px 0 0' }}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                                                <QrCodeIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight={800}>Quick Start</Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.9 }}>Take attendance in seconds</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Launch a QR-based attendance session for your class. Students scan the QR code with their phones and their location is automatically verified.
                                        </Typography>
                                        <Button
                                            fullWidth variant="contained" size="large"
                                            onClick={() => setActiveSection('attendance')}
                                            startIcon={<PlayIcon />}
                                            sx={{ py: 1.5, fontWeight: 700, borderRadius: 2, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}` }}
                                        >
                                            Start Attendance Session
                                        </Button>
                                        {session && (
                                            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                                                <AlertTitle>Session Active</AlertTitle>
                                                A session is currently running. <Button size="small" onClick={() => { setActiveSection('attendance'); setQrDialogOpen(true); }}>View QR</Button>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Recent Sessions */}
                            <Grid item xs={12} md={7}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <HistoryIcon fontSize="small" color="primary" />
                                            <Typography variant="subtitle1" fontWeight={700}>Recent Sessions</Typography>
                                        </Box>
                                        <Button size="small" endIcon={<ArrowIcon />} onClick={() => setActiveSection('history')} sx={{ fontWeight: 600 }}>View All</Button>
                                    </Box>
                                    <CardContent sx={{ p: 0 }}>
                                        {dashboardLoading ? (
                                            <Box p={3}><Skeleton variant="rounded" height={200} /></Box>
                                        ) : dashboardData?.recentSessions?.length > 0 ? (
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>Subject</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>Class</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>Date</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}>Present</TableCell>
                                                            <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}></TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {dashboardData.recentSessions.map((s) => (
                                                            <TableRow key={s.sessionId} hover sx={{ cursor: 'pointer' }} onClick={() => openReport(s.sessionId)}>
                                                                <TableCell>
                                                                    <Box>
                                                                        <Typography variant="body2" fontWeight={600}>{s.subjectName}</Typography>
                                                                        <Typography variant="caption" color="text.secondary">{s.subjectCode}</Typography>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell><Typography variant="body2">{s.className}</Typography></TableCell>
                                                                <TableCell><Typography variant="caption">{new Date(s.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Typography></TableCell>
                                                                <TableCell>
                                                                    <Chip label={s.presentCount} size="small" color="success" sx={{ fontWeight: 700, minWidth: 32 }} />
                                                                </TableCell>
                                                                <TableCell><IconButton size="small"><ViewIcon fontSize="small" /></IconButton></TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Box textAlign="center" py={5}>
                                                <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                <Typography variant="body2" color="text.secondary">No sessions conducted yet</Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Fade>
            )}

            {/* ══════════════════════════════════════════
                TAB: TAKE ATTENDANCE (Live Session)
            ══════════════════════════════════════════ */}
            {activeSection === 'attendance' && (
                <Fade in timeout={400}>
                    <Box>
                        {/* Quick Stats Row */}
                        <Grid container spacing={2.5} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={4}>
                                <StatsCard title="Assigned Classes" value={uniqueClasses.length} icon={<ClassIcon />} color={theme.palette.primary.main} subtitle="this semester" animationDelay={0} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StatsCard title="Students Present" value={attendanceCount} icon={<GroupsIcon />} color={theme.palette.success.main} subtitle={session ? "live count" : "no active session"} animationDelay={100} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StatsCard title="Session Duration" value={session ? formatTimer(sessionTimer) : "--:--"} icon={<TimerIcon />} color={theme.palette.warning.main} subtitle={session ? "elapsed" : "not started"} animationDelay={200} />
                            </Grid>
                        </Grid>

                        {/* POST-SESSION REVIEW */}
                        {reviewMode && !session && (
                            <ReviewPanel
                                attendanceRecords={attendanceRecords} loadingRecords={loadingRecords}
                                presentCount={presentCount} absentCount={absentCount} totalStudents={attendanceRecords.length}
                                onToggleStatus={toggleStudentStatus} onApprove={handleApproveAttendance}
                                approving={approving} approved={approved} onNewSession={resetToNewSession}
                                theme={theme} isDark={isDark}
                            />
                        )}

                        {/* START SESSION FORM */}
                        {!session && !reviewMode && (
                            <StartSessionForm
                                uniqueClasses={uniqueClasses} filteredSubjects={filteredSubjects}
                                selectedClass={selectedClass}
                                setSelectedClass={(v) => { setSelectedClass(v); setSelectedMapping(""); }}
                                selectedMapping={selectedMapping} setSelectedMapping={setSelectedMapping}
                                radius={radius} setRadius={setRadius} duration={duration} setDuration={setDuration}
                                onStart={handleStartSession} starting={startingSession}
                                locationError={locationError} gettingLocation={gettingLocation}
                                loading={mappingsLoading} theme={theme} isDark={isDark}
                            />
                        )}

                        {/* ACTIVE SESSION PANEL */}
                        {session && (
                            <ActiveSessionPanel
                                session={session} mappingInfo={getSelectedMappingInfo()}
                                attendanceCount={attendanceCount} sessionTimer={sessionTimer}
                                formatTimer={formatTimer} onOpenQr={() => setQrDialogOpen(true)}
                                onEnd={handleEndSession} manualRollNo={manualRollNo}
                                setManualRollNo={setManualRollNo} manualReason={manualReason}
                                setManualReason={setManualReason} manualMessage={manualMessage}
                                onManualSubmit={handleManualSubmit} theme={theme} isDark={isDark}
                            />
                        )}
                    </Box>
                </Fade>
            )}

            {/* ══════════════════════════════════════════
                TAB: MY CLASSES
            ══════════════════════════════════════════ */}
            {activeSection === 'classes' && (
                <Fade in timeout={400}>
                    <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                            <Box>
                                <Typography variant="h5" fontWeight={800}>My Assigned Classes</Typography>
                                <Typography variant="body2" color="text.secondary">View attendance statistics for each class-subject combination</Typography>
                            </Box>
                            <IconButton onClick={loadClassStats} disabled={classStatsLoading}><RefreshIcon /></IconButton>
                        </Box>

                        {classStatsLoading ? (
                            <Grid container spacing={2.5}>
                                {[1,2,3,4].map(i => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} /></Grid>)}
                            </Grid>
                        ) : classStats.length === 0 ? (
                            <Box textAlign="center" py={8}>
                                <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">No classes assigned yet</Typography>
                                <Typography variant="body2" color="text.disabled">Contact your HOD to get class assignments.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2.5}>
                                {classStats.map((c) => {
                                    const pct = c.avgAttendancePercentage || 0;
                                    const statusColor = pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'error';
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={c.mappingId}>
                                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}` } }}>
                                                <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${alpha(theme.palette[statusColor].main, 0.08)}, ${alpha(theme.palette[statusColor].main, 0.02)})`, borderBottom: '1px solid', borderColor: 'divider' }}>
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        <Avatar sx={{ bgcolor: alpha(theme.palette[statusColor].main, 0.15), color: `${statusColor}.main`, width: 44, height: 44 }}>
                                                            <SchoolIcon />
                                                        </Avatar>
                                                        <Box flex={1} overflow="hidden">
                                                            <Typography variant="subtitle1" fontWeight={700} noWrap>{c.subjectName}</Typography>
                                                            <Chip label={c.subjectCode} size="small" variant="outlined" />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                <CardContent sx={{ p: 2.5 }}>
                                                    {/* Attendance Progress */}
                                                    <Box mb={2}>
                                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Avg Attendance</Typography>
                                                            <Typography variant="caption" fontWeight={700} color={`${statusColor}.main`}>{pct}%</Typography>
                                                        </Box>
                                                        <LinearProgress variant="determinate" value={Math.min(pct, 100)} color={statusColor} sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette[statusColor].main, 0.1) }} />
                                                    </Box>
                                                    <Stack spacing={1}>
                                                        <Box display="flex" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">Class</Typography>
                                                            <Typography variant="caption" fontWeight={600}>{c.className}</Typography>
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">Section</Typography>
                                                            <Typography variant="caption" fontWeight={600}>{c.section || 'All'}</Typography>
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">Sessions Taken</Typography>
                                                            <Chip label={c.totalSessions} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">Students</Typography>
                                                            <Typography variant="caption" fontWeight={600}>{c.totalStudents}</Typography>
                                                        </Box>
                                                        {c.lastSessionDate && (
                                                            <Box display="flex" justifyContent="space-between">
                                                                <Typography variant="caption" color="text.secondary">Last Session</Typography>
                                                                <Typography variant="caption" fontWeight={600}>{new Date(c.lastSessionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Typography>
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </Box>
                </Fade>
            )}

            {/* ══════════════════════════════════════════
                TAB: SESSION HISTORY
            ══════════════════════════════════════════ */}
            {activeSection === 'history' && (
                <Fade in timeout={400}>
                    <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
                            <Box>
                                <Typography variant="h5" fontWeight={800}>Session History</Typography>
                                <Typography variant="body2" color="text.secondary">View all past attendance sessions</Typography>
                            </Box>
                            <TextField
                                size="small" placeholder="Search by subject or class..."
                                value={historySearch} onChange={(e) => setHistorySearch(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="disabled" /></InputAdornment> }}
                                sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Box>

                        {historyLoading ? (
                            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
                        ) : filteredHistory.length === 0 ? (
                            <Box textAlign="center" py={8}>
                                <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">No sessions found</Typography>
                                <Typography variant="body2" color="text.disabled">Start your first attendance session to see history here.</Typography>
                            </Box>
                        ) : (
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                <TableContainer sx={{ maxHeight: 600 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Subject</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Class</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Date & Time</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Present</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Status</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredHistory.map((s, i) => (
                                                <TableRow key={s.sessionId} hover>
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>{s.subjectName}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{s.subjectCode}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell><Typography variant="body2">{s.className} {s.section ? `(${s.section})` : ''}</Typography></TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">{new Date(s.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{new Date(s.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <Chip label={s.presentCount} size="small" color="success" sx={{ fontWeight: 700, minWidth: 28 }} />
                                                            <Typography variant="caption" color="text.secondary">/ {s.totalRecords}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={s.isActive ? 'Active' : 'Completed'} size="small"
                                                            color={s.isActive ? 'success' : 'default'}
                                                            variant={s.isActive ? 'filled' : 'outlined'}
                                                            sx={{ fontWeight: 600, fontSize: 11 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title="View Report">
                                                            <IconButton size="small" color="primary" onClick={() => openReport(s.sessionId)}>
                                                                <ViewIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        )}
                    </Box>
                </Fade>
            )}

            {/* ══════════════════════════════════════════
                TAB: REPORTS
            ══════════════════════════════════════════ */}
            {activeSection === 'reports' && (
                <Fade in timeout={400}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} gutterBottom>Attendance Reports</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Subject-wise attendance breakdown across all your classes</Typography>

                        {classStatsLoading ? (
                            <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
                        ) : classStats.length === 0 ? (
                            <Box textAlign="center" py={8}>
                                <ChartIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">No data available yet</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {/* Summary Card */}
                                <Grid item xs={12}>
                                    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                        <Box sx={{ px: 3, py: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderBottom: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="subtitle1" fontWeight={700}>Subject-wise Summary</Typography>
                                        </Box>
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Subject</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Class</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Sessions</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Total Students</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Avg Attendance</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Progress</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {classStats.map((c) => {
                                                        const pct = c.avgAttendancePercentage || 0;
                                                        const statusColor = pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'error';
                                                        return (
                                                            <TableRow key={c.mappingId} hover>
                                                                <TableCell>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 36, height: 36 }}>
                                                                            <SchoolIcon fontSize="small" />
                                                                        </Avatar>
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight={600}>{c.subjectName}</Typography>
                                                                            <Typography variant="caption" color="text.secondary">{c.subjectCode}</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>{c.className}</TableCell>
                                                                <TableCell><Chip label={c.totalSessions} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                                                                <TableCell>{c.totalStudents}</TableCell>
                                                                <TableCell>
                                                                    <Chip label={`${pct}%`} size="small" color={statusColor} sx={{ fontWeight: 700, minWidth: 56 }} />
                                                                </TableCell>
                                                                <TableCell sx={{ minWidth: 150 }}>
                                                                    <LinearProgress variant="determinate" value={Math.min(pct, 100)} color={statusColor} sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette[statusColor].main, 0.1) }} />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}
                    </Box>
                </Fade>
            )}

            {/* QR POPUP DIALOG */}
            <QrPopupDialog
                open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}
                qrValue={qrValue} attendanceCount={attendanceCount}
                sessionTimer={sessionTimer} formatTimer={formatTimer}
                mappingInfo={getSelectedMappingInfo()} onEnd={handleEndSession}
                theme={theme} isDark={isDark}
            />

            {/* SESSION REPORT DIALOG */}
            <Dialog open={reportDialog} onClose={() => { setReportDialog(false); setReportData(null); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                {reportLoading ? (
                    <Box p={6} textAlign="center"><CircularProgress /><Typography variant="body2" sx={{ mt: 2 }}>Loading report...</Typography></Box>
                ) : reportData ? (
                    <>
                        <Box sx={{ px: 3, py: 2, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, color: 'white' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h6" fontWeight={800}>Session Report</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>{reportData.subjectName} — {reportData.className}</Typography>
                                </Box>
                                <IconButton onClick={() => { setReportDialog(false); setReportData(null); }} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                            </Box>
                        </Box>
                        <DialogContent sx={{ p: 3 }}>
                            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                                <Chip icon={<CalendarIcon />} label={new Date(reportData.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
                                <Chip icon={<TimerIcon />} label={`${new Date(reportData.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(reportData.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`} />
                                <Chip icon={<CheckCircleIcon />} label={`Present: ${reportData.presentCount}`} color="success" />
                                <Chip icon={<CancelIcon />} label={`Absent: ${reportData.absentCount}`} color="error" variant="outlined" />
                            </Box>
                            {reportData.students?.length > 0 ? (
                                <TableContainer sx={{ maxHeight: 400 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reportData.students.map((s, i) => (
                                                <TableRow key={s.recordId}>
                                                    <TableCell>{i + 1}</TableCell>
                                                    <TableCell><Typography variant="body2" fontWeight={600}>{s.rollNumber}</Typography></TableCell>
                                                    <TableCell>{s.studentName}</TableCell>
                                                    <TableCell><Chip label={s.status === 'PRESENT' || s.status === 'MANUAL_VERIFIED' ? 'Present' : 'Absent'} size="small" color={s.status === 'PRESENT' || s.status === 'MANUAL_VERIFIED' ? 'success' : 'error'} sx={{ fontWeight: 600 }} /></TableCell>
                                                    <TableCell><Typography variant="caption">{s.timestamp ? new Date(s.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</Typography></TableCell>
                                                    <TableCell><Typography variant="caption" color="text.secondary">{s.remarks || '—'}</Typography></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box textAlign="center" py={4}>
                                    <GroupsIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No attendance records</Typography>
                                </Box>
                            )}
                        </DialogContent>
                    </>
                ) : null}
            </Dialog>

        </DashboardLayout>
    );
};

// ═══════════════════════════════════════════════════════════════════════
//  START SESSION FORM 
// ═══════════════════════════════════════════════════════════════════════
function StartSessionForm({
    uniqueClasses, filteredSubjects, selectedClass, setSelectedClass,
    selectedMapping, setSelectedMapping, radius, setRadius,
    duration, setDuration, onStart, starting, locationError,
    gettingLocation, loading, theme, isDark
}) {
    return (
        <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, color: 'white' }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}><PlayIcon /></Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Start Attendance Session</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>Configure and launch a new QR attendance session</Typography>
                    </Box>
                </Box>
            </Box>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                {loading ? (
                    <Box textAlign="center" py={4}><CircularProgress size={40} /><Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading your classes...</Typography></Box>
                ) : uniqueClasses.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}><AlertTitle>No Classes Assigned</AlertTitle>You don't have any classes assigned yet. Contact your admin or HOD.</Alert>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.15) }}>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Chip label="1" size="small" color="primary" sx={{ fontWeight: 700 }} />
                                    <Typography variant="subtitle2" fontWeight={700}>Select Class</Typography>
                                </Box>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Choose your class</InputLabel>
                                    <Select value={selectedClass} label="Choose your class" onChange={(e) => setSelectedClass(e.target.value)} sx={{ borderRadius: 2 }}>
                                        {uniqueClasses.map(c => (<MenuItem key={c.classId} value={c.className}><Box display="flex" alignItems="center" gap={1}><ClassIcon fontSize="small" color="primary" />{c.className}</Box></MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, isDark ? 0.08 : 0.04), border: '1px solid', borderColor: alpha(theme.palette.secondary.main, 0.15), opacity: selectedClass ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Chip label="2" size="small" color="secondary" sx={{ fontWeight: 700 }} />
                                    <Typography variant="subtitle2" fontWeight={700}>Select Subject</Typography>
                                </Box>
                                <FormControl fullWidth size="small" disabled={!selectedClass}>
                                    <InputLabel>Choose subject</InputLabel>
                                    <Select value={selectedMapping} label="Choose subject" onChange={(e) => setSelectedMapping(e.target.value)} sx={{ borderRadius: 2 }}>
                                        {filteredSubjects.map(m => (<MenuItem key={m.id} value={m.id}><Box display="flex" alignItems="center" gap={1}><SchoolIcon fontSize="small" color="secondary" />{m.subjectName}<Chip label={m.subjectCode} size="small" variant="outlined" sx={{ ml: 'auto' }} /></Box></MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, isDark ? 0.08 : 0.04), border: '1px solid', borderColor: alpha(theme.palette.success.main, 0.15) }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Chip label="3" size="small" color="success" sx={{ fontWeight: 700 }} />
                                    <Typography variant="subtitle2" fontWeight={700}>Geo-Fence Radius</Typography>
                                    <Chip label={`${radius}m`} size="small" color="success" variant="outlined" sx={{ ml: 'auto', fontWeight: 700 }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Students must be within this radius</Typography>
                                <Slider value={radius} onChange={(_, v) => setRadius(v)} min={10} max={500} step={10} valueLabelDisplay="auto" valueLabelFormat={(v) => `${v}m`} color="success" marks={[{ value: 50, label: '50m' }, { value: 100, label: '100m' }, { value: 250, label: '250m' }, { value: 500, label: '500m' }]} />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(theme.palette.warning.main, isDark ? 0.08 : 0.04), border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.15) }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Chip label="4" size="small" color="warning" sx={{ fontWeight: 700 }} />
                                    <Typography variant="subtitle2" fontWeight={700}>Session Duration</Typography>
                                    <Chip label={`${duration} min`} size="small" color="warning" variant="outlined" sx={{ ml: 'auto', fontWeight: 700 }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>How long should the session accept responses?</Typography>
                                <Slider value={duration} onChange={(_, v) => setDuration(v)} min={1} max={60} step={1} valueLabelDisplay="auto" valueLabelFormat={(v) => `${v} min`} color="warning" marks={[{ value: 5, label: '5m' }, { value: 15, label: '15m' }, { value: 30, label: '30m' }, { value: 60, label: '60m' }]} />
                            </Box>
                        </Grid>
                        {locationError && (<Grid item xs={12}><Alert severity="error" sx={{ borderRadius: 2 }}><AlertTitle>Error</AlertTitle>{locationError}</Alert></Grid>)}
                        <Grid item xs={12}>
                            <Button fullWidth variant="contained" size="large" onClick={onStart} disabled={!selectedMapping || starting}
                                startIcon={starting ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                                sx={{ py: 2, fontSize: '1.1rem', fontWeight: 800, borderRadius: 3, background: selectedMapping ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` : undefined, boxShadow: selectedMapping ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}` : undefined }}
                            >
                                {starting ? 'Getting Location & Starting...' : 'Launch Attendance Session'}
                            </Button>
                            <Typography variant="caption" color="text.secondary" textAlign="center" display="block" sx={{ mt: 1 }}>📍 Your current GPS location will be captured as the attendance center</Typography>
                        </Grid>
                    </Grid>
                )}
            </CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  ACTIVE SESSION PANEL
// ═══════════════════════════════════════════════════════════════════════
function ActiveSessionPanel({ session, mappingInfo, attendanceCount, sessionTimer, formatTimer, onOpenQr, onEnd, manualRollNo, setManualRollNo, manualReason, setManualReason, manualMessage, onManualSubmit, theme, isDark }) {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <Box sx={{ px: 3, py: 2, bgcolor: alpha(theme.palette.success.main, isDark ? 0.12 : 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <LiveIcon sx={{ color: 'success.main', fontSize: 18, animation: 'pulse 1.5s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                            <Typography variant="subtitle2" fontWeight={700} color="success.main">SESSION ACTIVE</Typography>
                            <Chip label={formatTimer(sessionTimer)} size="small" color="success" sx={{ ml: 'auto', fontWeight: 700 }} />
                        </Box>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                        {mappingInfo && (
                            <Stack spacing={2} mb={3}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.secondary">Subject</Typography>
                                    <Box display="flex" alignItems="center" gap={0.5}><Typography variant="body2" fontWeight={600}>{mappingInfo.subjectName}</Typography><Chip label={mappingInfo.subjectCode} size="small" variant="outlined" /></Box>
                                </Box>
                                <Box display="flex" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Class</Typography><Typography variant="body2" fontWeight={600}>{mappingInfo.className}</Typography></Box>
                                <Box display="flex" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Students Marked</Typography><Chip label={attendanceCount} size="small" color="primary" sx={{ fontWeight: 700 }} /></Box>
                            </Stack>
                        )}
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Manual Override</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>Mark a student present manually (e.g., scanner issues)</Typography>
                        <Stack spacing={1.5}>
                            <TextField size="small" label="Student Roll Number" value={manualRollNo} onChange={(e) => setManualRollNo(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <TextField size="small" label="Reason" value={manualReason} onChange={(e) => setManualReason(e.target.value)} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <Button variant="outlined" onClick={onManualSubmit} startIcon={<AddCircleIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>Mark Present</Button>
                        </Stack>
                        {manualMessage && (<Alert severity={manualMessage.includes('✅') ? 'success' : 'error'} sx={{ mt: 1.5, borderRadius: 2 }}>{manualMessage}</Alert>)}
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>QR CODE PREVIEW</Typography>
                        <Box sx={{ p: 2, mt: 1, mb: 1, bgcolor: 'white', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}` }}>
                            <QRCode value={session.qrToken || ''} size={180} />
                        </Box>
                        <Typography variant="body2" fontWeight={700} color="primary" sx={{ mb: 1, letterSpacing: 1 }}>{session.qrToken}</Typography>
                        <Typography variant="caption" color="text.secondary" textAlign="center" mb={2}>Auto-refreshes every 10s for security</Typography>
                        <Stack spacing={1.5} width="100%">
                            <Button variant="contained" fullWidth onClick={onOpenQr} startIcon={<FullscreenIcon />} sx={{ py: 1.5, fontWeight: 700, borderRadius: 2, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }}>Pop Out QR (Full Screen)</Button>
                            <Button variant="outlined" color="error" fullWidth onClick={onEnd} startIcon={<StopCircleIcon />} sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}>End Session & Review</Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  QR POPUP DIALOG
// ═══════════════════════════════════════════════════════════════════════
function QrPopupDialog({ open, onClose, qrValue, attendanceCount, sessionTimer, formatTimer, mappingInfo, onEnd, theme, isDark }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
            <Box sx={{ px: 3, py: 2, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <LiveIcon sx={{ animation: 'pulse 1.5s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                    <Box>
                        <Typography variant="subtitle1" fontWeight={800}>Live QR Code</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>{mappingInfo ? `${mappingInfo.subjectName} — ${mappingInfo.className}` : 'Attendance Session'}</Typography>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Chip label={formatTimer(sessionTimer)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                    <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                </Box>
            </Box>
            <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 4, boxShadow: `0 8px 30px ${alpha(theme.palette.common.black, 0.12)}`, mb: 2 }}>
                    <QRCode value={qrValue || ''} size={280} />
                </Box>
                <Typography variant="h6" fontWeight={800} color="primary" sx={{ mb: 3, letterSpacing: 2 }}>{qrValue}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, isDark ? 0.1 : 0.06), width: '100%', justifyContent: 'center' }}>
                    <Box textAlign="center">
                        <Typography variant="h3" fontWeight={800} color="success.main">{attendanceCount}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Students Marked</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box textAlign="center">
                        <Typography variant="h4" fontWeight={700} color="text.primary">{formatTimer(sessionTimer)}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Elapsed</Typography>
                    </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>🔄 QR auto-refreshes every 10 seconds · 📍 Geo-fencing active</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>Minimize</Button>
                <Button onClick={onEnd} variant="contained" color="error" startIcon={<StopCircleIcon />} sx={{ borderRadius: 2, fontWeight: 700 }}>End Session & Review</Button>
            </DialogActions>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  REVIEW PANEL
// ═══════════════════════════════════════════════════════════════════════
function ReviewPanel({ attendanceRecords, loadingRecords, presentCount, absentCount, totalStudents, onToggleStatus, onApprove, approving, approved, onNewSession, theme, isDark }) {
    return (
        <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, background: approved ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})` : `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`, color: 'white' }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>{approved ? <CheckCircleIcon /> : <EditIcon />}</Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>{approved ? 'Attendance Approved ✓' : 'Review Attendance'}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>{approved ? 'Attendance has been finalized' : 'Toggle student status before approving'}</Typography>
                    </Box>
                </Box>
            </Box>
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', gap: 2, p: 3, flexWrap: 'wrap' }}>
                    <Chip icon={<GroupsIcon />} label={`Total: ${totalStudents}`} sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
                    <Chip icon={<CheckCircleIcon />} label={`Present: ${presentCount}`} color="success" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
                    <Chip icon={<CancelIcon />} label={`Absent: ${absentCount}`} color="error" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.85rem' }} />
                </Box>
                {loadingRecords ? (
                    <Box textAlign="center" py={6}><CircularProgress /><Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading records...</Typography></Box>
                ) : attendanceRecords.length === 0 ? (
                    <Box textAlign="center" py={6}><GroupsIcon sx={{ fontSize: 64, color: 'text.disabled' }} /><Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>No students attended</Typography></Box>
                ) : (
                    <TableContainer sx={{ maxHeight: 450 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Roll No</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Student Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Remarks</TableCell>
                                    {!approved && (<TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Toggle</TableCell>)}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {attendanceRecords.map((r, i) => {
                                    const isPresent = r.status === 'PRESENT' || r.status === 'MANUAL_VERIFIED';
                                    return (
                                        <TableRow key={r.recordId} sx={{ bgcolor: r.modified ? alpha(theme.palette.warning.main, isDark ? 0.1 : 0.05) : 'transparent', transition: 'background 0.3s' }}>
                                            <TableCell>{i + 1}</TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={600}>{r.rollNumber}</Typography></TableCell>
                                            <TableCell>{r.studentName}</TableCell>
                                            <TableCell><Chip label={isPresent ? 'Present' : 'Absent'} size="small" color={isPresent ? 'success' : 'error'} variant={isPresent ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} /></TableCell>
                                            <TableCell><Typography variant="caption" color="text.secondary">{r.remarks || '—'}</Typography></TableCell>
                                            {!approved && (<TableCell><Switch checked={isPresent} onChange={() => onToggleStatus(r.recordId)} color="success" size="small" /></TableCell>)}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                <Box sx={{ p: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {!approved ? (
                        <Button variant="contained" color="success" size="large" onClick={onApprove} disabled={approving || attendanceRecords.length === 0}
                            startIcon={approving ? <CircularProgress size={18} color="inherit" /> : <ApproveIcon />}
                            sx={{ py: 1.5, px: 4, fontWeight: 800, borderRadius: 3, boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.35)}` }}
                        >{approving ? 'Approving...' : 'Approve & Finalize Attendance'}</Button>
                    ) : (
                        <Alert severity="success" sx={{ flex: 1, borderRadius: 2 }}><AlertTitle>Attendance Approved</AlertTitle>All changes have been saved. {presentCount} present, {absentCount} absent.</Alert>
                    )}
                    <Button variant="outlined" onClick={onNewSession} startIcon={<RefreshIcon />} sx={{ py: 1.5, fontWeight: 600, borderRadius: 3 }}>Start New Session</Button>
                </Box>
            </CardContent>
        </Card>
    );
}

export default FacultyDashboard;
