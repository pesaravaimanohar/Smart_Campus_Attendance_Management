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
    refreshSessionQr, endSession, cancelSession, getSessionAttendanceCount,
    getSessionAttendance, updateAttendanceStatus,
    getFacultyDashboard, getSessionHistory, getFacultyClassStats,
    getSessionReport, crcAPI, bulkUploadAPI
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
    CloudUpload as UploadIcon,
    Download as DownloadIcon,
    InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';

// ═══════════════════════════════════════════════════════════════
//  FACULTY DASHBOARD — Complete Attendance System
// ═══════════════════════════════════════════════════════════════
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];

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
    const [selectedPeriod, setSelectedPeriod] = useState("Period 1");
    const [numberOfHours, setNumberOfHours] = useState(1);
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

    // ─── CRC (Class Rep Coordinator) ───────
    const [crcClasses, setCrcClasses] = useState([]);
    const [crcLoading, setCrcLoading] = useState(false);
    const [selectedCrcClass, setSelectedCrcClass] = useState(null);
    const [crcTab, setCrcTab] = useState('students'); // 'students' | 'subjects' | 'atRisk'
    const [crcStudents, setCrcStudents] = useState([]);
    const [crcSubjects, setCrcSubjects] = useState([]);
    const [crcDefaulters, setCrcDefaulters] = useState([]);
    const [crcDetailLoading, setCrcDetailLoading] = useState(false);

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
            const key = `${m.className}-${m.classId}`;
            if (!map.has(key)) map.set(key, { className: m.className, classId: m.classId });
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
            const mapping = getSelectedMappingInfo();
            const newSession = await createSession({ 
                mapId: selectedMapping, 
                lat: loc.latitude, 
                lon: loc.longitude, 
                duration, 
                radius,
                period: selectedPeriod,
                numberOfHours: numberOfHours,
                isLab: mapping?.isLab || false
            });
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

    const handleCancelSession = async () => {
        if (!session) return;
        const sid = session?.id ?? session?.sessionId;
        if (sid === undefined || sid === null) {
            alert("Failed to cancel session: missing session id. Please refresh the page and try again.");
            return;
        }
        if (!window.confirm("Are you sure you want to cancel this session? All attendance records for this session will be deleted and the session will be removed entirely.")) return;
        try {
            await cancelSession(sid);
            setSession(null); setQrDialogOpen(false);
            setReviewMode(false); setAttendanceRecords([]); setEndedSessionId(null);
            setApproved(false); setSelectedClass(""); setSelectedMapping("");
            loadDashboard();
        } catch (e) { alert("Failed to cancel session: " + (e.response?.data?.message || e.message)); }
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

    // ─── PiP Popup ──────────────────────────
    const popOutRef = React.useRef(null);

    // Expose live session data on window for the popup to read
    React.useEffect(() => {
        window.__pipSessionData = session ? {
            qrToken: qrValue,
            attendanceCount,
            sessionTimer,
            subjectName: getSelectedMappingInfo()?.subjectName || '',
            className: getSelectedMappingInfo()?.className || '',
            active: true,
        } : { active: false };
    }, [qrValue, attendanceCount, sessionTimer, session]);

    // Close popup when session ends
    React.useEffect(() => {
        if (!session && popOutRef.current && !popOutRef.current.closed) {
            popOutRef.current.close();
            popOutRef.current = null;
        }
    }, [session]);

    const handlePopOutPiP = () => {
        if (popOutRef.current && !popOutRef.current.closed) {
            popOutRef.current.focus();
            return;
        }
        const w = 380, h = 520;
        const left = window.screenX + window.outerWidth - w - 40;
        const top = window.screenY + 60;
        const pip = window.open('', 'qr_pip', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`);
        if (!pip) { alert('Popup blocked! Please allow popups for this site.'); return; }
        popOutRef.current = pip;
        pip.document.write(`<!DOCTYPE html>
<html><head><title>QR Session</title>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"><\/script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter','Segoe UI',sans-serif; background:#0B0F19; color:#F1F5F9; display:flex; flex-direction:column; align-items:center; height:100vh; padding:20px; }
  .header { display:flex; align-items:center; gap:8px; margin-bottom:12px; width:100%; }
  .live-dot { width:10px; height:10px; border-radius:50%; background:#22C55E; animation:blink 1.5s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .title { font-size:13px; font-weight:700; color:#22C55E; text-transform:uppercase; letter-spacing:1px; }
  .info { font-size:12px; color:#94A3B8; margin-bottom:16px; text-align:center; }
  .qr-box { background:#fff; border-radius:16px; padding:16px; margin-bottom:16px; box-shadow:0 8px 32px rgba(0,0,0,0.4); }
  .qr-box canvas { display:block; }
  .token { font-family:monospace; font-size:15px; font-weight:700; color:#6366F1; letter-spacing:2px; margin-bottom:16px; text-align:center; word-break:break-all; }
  .stats { display:flex; gap:24px; align-items:center; justify-content:center; padding:16px 24px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:12px; width:100%; margin-bottom:12px; }
  .stat-num { font-size:32px; font-weight:800; }
  .stat-label { font-size:11px; color:#94A3B8; font-weight:600; }
  .stat-divider { width:1px; height:40px; background:rgba(255,255,255,0.1); }
  .refresh-note { font-size:11px; color:#64748B; text-align:center; }
</style></head><body>
  <div class="header"><div class="live-dot"></div><span class="title">Session Active</span></div>
  <div class="info" id="info"></div>
  <div class="qr-box" id="qrBox"></div>
  <div class="token" id="token"></div>
  <div class="stats">
    <div style="text-align:center"><div class="stat-num" id="count" style="color:#22C55E">0</div><div class="stat-label">Students</div></div>
    <div class="stat-divider"></div>
    <div style="text-align:center"><div class="stat-num" id="timer">00:00</div><div class="stat-label">Elapsed</div></div>
  </div>
  <div class="refresh-note">🔄 Auto-syncs every 2s · 📍 Geo-fence active</div>
<script>
  var lastToken = '';
  function fmt(s) { return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
  function render(token) {
    var qr = qrcode(0,'M'); qr.addData(token); qr.make();
    var size = 220;
    var el = document.getElementById('qrBox');
    el.innerHTML = '';
    var canvas = document.createElement('canvas'); canvas.width=size; canvas.height=size;
    var ctx = canvas.getContext('2d'); var mc = qr.getModuleCount(); var cs = size/mc;
    for(var r=0;r<mc;r++) for(var c=0;c<mc;c++) { ctx.fillStyle=qr.isDark(r,c)?'#1a1a2e':'#ffffff'; ctx.fillRect(c*cs,r*cs,cs+1,cs+1); }
    el.appendChild(canvas);
  }
  function sync() {
    try {
      var d = window.opener && window.opener.__pipSessionData;
      if(!d || !d.active) { document.title='Session Ended'; return; }
      document.getElementById('count').textContent = d.attendanceCount;
      document.getElementById('timer').textContent = fmt(d.sessionTimer);
      document.getElementById('token').textContent = d.qrToken;
      document.getElementById('info').textContent = (d.subjectName||'')+' — '+(d.className||'');
      document.title = 'QR: '+d.attendanceCount+' students · '+fmt(d.sessionTimer);
      if(d.qrToken !== lastToken) { render(d.qrToken); lastToken = d.qrToken; }
    } catch(e) {}
  }
  setInterval(sync, 2000); setTimeout(sync, 300);
<\/script></body></html>`);
        pip.document.close();
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
        { id: 'bulkupload', icon: <UploadIcon />, label: 'Bulk Upload' },
        { id: 'divider-2', divider: true, label: 'ANALYTICS' },
        { id: 'classes', icon: <ClassIcon />, label: 'My Classes' },
        { id: 'history', icon: <HistoryIcon />, label: 'Session History' },
        { id: 'reports', icon: <AssignmentIcon />, label: 'Reports' },
        { id: 'crc', icon: <GroupsIcon />, label: 'CRC Dashboard' },
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
                                <Card sx={{
                                    borderRadius: 3, border: '1px solid', borderColor: 'divider',
                                    height: '100%', overflow: 'hidden',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06)}, ${alpha(theme.palette.secondary.main, isDark ? 0.08 : 0.03)})`,
                                }}>
                                    <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={700}>Quick Start</Typography>
                                            <Typography variant="caption" color="text.secondary">Launch a QR attendance session</Typography>
                                        </Box>
                                        <Button
                                            variant="contained" size="small"
                                            onClick={() => setActiveSection('attendance')}
                                            startIcon={<PlayIcon />}
                                            sx={{
                                                fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap', px: 2.5,
                                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                                            }}
                                        >
                                            Take Attendance
                                        </Button>
                                    </CardContent>
                                    {session && (
                                        <Alert severity="success" sx={{ borderRadius: 0, py: 0.5 }}>
                                            Session active — <Button size="small" onClick={() => { setActiveSection('attendance'); setQrDialogOpen(true); }}>View QR</Button>
                                        </Alert>
                                    )}
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
                                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                                            <Typography variant="caption" color="text.secondary">{s.subjectCode}</Typography>
                                                                            {s.section === 'LAB' && <Chip label="LAB" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }} />}
                                                                        </Box>
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
                                selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
                                numberOfHours={numberOfHours} setNumberOfHours={setNumberOfHours}
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
                                onPopOut={handlePopOutPiP}
                                onEnd={handleEndSession} onCancel={handleCancelSession} manualRollNo={manualRollNo}
                                setManualRollNo={setManualRollNo} manualReason={manualReason}
                                setManualReason={setManualReason} manualMessage={manualMessage}
                                onManualSubmit={handleManualSubmit} theme={theme} isDark={isDark}
                            />
                        )}
                    </Box>
                </Fade>
            )}

            {/* ══════════════════════════════════════════
                TAB: BULK UPLOAD
            ══════════════════════════════════════════ */}
            {activeSection === 'bulkupload' && (
                <Fade in timeout={400}>
                    <Box>
                        <BulkUploadSection
                            uniqueClasses={uniqueClasses}
                            mappings={mappings}
                            theme={theme}
                            isDark={isDark}
                            loading={mappingsLoading}
                        />
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
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Period</TableCell>
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
                                                    <TableCell><Chip label={s.period || 'N/A'} size="small" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5, borderColor: alpha(theme.palette.primary.main, 0.2), color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }} /></TableCell>
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

            {/* ══════════════════════════════════════════
                TAB: CRC DASHBOARD
            ══════════════════════════════════════════ */}
            {activeSection === 'crc' && (
                <Fade in timeout={400}>
                    <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                            <Box>
                                <Typography variant="h5" fontWeight={800}>CRC Dashboard</Typography>
                                <Typography variant="body2" color="text.secondary">Classes where you are the Class Representative Coordinator</Typography>
                            </Box>
                            <IconButton onClick={async () => {
                                setCrcLoading(true);
                                try { setCrcClasses(await crcAPI.getMyClasses()); } catch(e) {}
                                setCrcLoading(false);
                            }} disabled={crcLoading}><RefreshIcon /></IconButton>
                        </Box>

                        {/* Load CRC classes on mount */}
                        {crcClasses.length === 0 && !crcLoading && (() => {
                            crcAPI.getMyClasses().then(setCrcClasses).catch(() => {});
                            return null;
                        })()}

                        {crcLoading ? (
                            <Grid container spacing={2.5}>
                                {[1,2].map(i => <Grid item xs={12} sm={6} key={i}><Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} /></Grid>)}
                            </Grid>
                        ) : crcClasses.length === 0 ? (
                            <Box textAlign="center" py={8}>
                                <GroupsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">No CRC assignment found</Typography>
                                <Typography variant="body2" color="text.disabled">Ask your admin to assign you as CRC for a class.</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {/* Left: Class list */}
                                <Grid item xs={12} md={4}>
                                    <Stack spacing={1.5}>
                                        {crcClasses.map(cls => (
                                            <Card
                                                key={cls.classId}
                                                onClick={async () => {
                                                    setSelectedCrcClass(cls);
                                                    setCrcTab('students');
                                                    setCrcDetailLoading(true);
                                                    try {
                                                        const [students, subjects, defaulters] = await Promise.all([
                                                            crcAPI.getClassStudents(cls.classId),
                                                            crcAPI.getClassSubjects(cls.classId),
                                                            crcAPI.getClassDefaulters(cls.classId),
                                                        ]);
                                                        setCrcStudents(students);
                                                        setCrcSubjects(subjects);
                                                        setCrcDefaulters(defaulters);
                                                    } catch(e) {}
                                                    setCrcDetailLoading(false);
                                                }}
                                                sx={{
                                                    borderRadius: 3,
                                                    border: '1px solid',
                                                    borderColor: selectedCrcClass?.classId === cls.classId ? 'primary.main' : 'divider',
                                                    cursor: 'pointer',
                                                    bgcolor: selectedCrcClass?.classId === cls.classId ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
                                                    transition: 'all 0.2s',
                                                    '&:hover': { borderColor: 'primary.main', boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}` },
                                                }}
                                            >
                                                <CardContent sx={{ p: 2 }}>
                                                    <Typography variant="subtitle2" fontWeight={700}>{cls.className}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{cls.department} · {cls.programType}</Typography>
                                                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                                                        <Chip label={`${cls.totalStudents} Students`} size="small" color="primary" variant="outlined" />
                                                        <Chip label={`${cls.totalSubjects} Subjects`} size="small" variant="outlined" />
                                                        <Chip label={`Avg ${cls.avgAttendance}%`} size="small"
                                                            color={cls.avgAttendance >= 75 ? 'success' : cls.avgAttendance >= 60 ? 'warning' : 'error'}
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                </Grid>

                                {/* Right: Class detail */}
                                <Grid item xs={12} md={8}>
                                    {!selectedCrcClass ? (
                                        <Box textAlign="center" py={8} sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
                                            <GroupsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                            <Typography variant="h6" color="text.secondary">Select a class to view details</Typography>
                                        </Box>
                                    ) : (
                                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={700}>{selectedCrcClass.className}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{selectedCrcClass.department}</Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1}>
                                                    {['students','subjects','atRisk'].map(tab => (
                                                        <Chip
                                                            key={tab}
                                                            label={tab === 'atRisk' ? 'At Risk' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                                            onClick={() => setCrcTab(tab)}
                                                            color={crcTab === tab ? 'primary' : 'default'}
                                                            variant={crcTab === tab ? 'filled' : 'outlined'}
                                                            size="small"
                                                            sx={{ fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer' }}
                                                        />
                                                    ))}
                                                </Stack>
                                            </Box>
                                            {crcDetailLoading ? (
                                                <Box textAlign="center" py={6}><CircularProgress /><Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading...</Typography></Box>
                                            ) : (
                                                <TableContainer sx={{ maxHeight: 420 }}>
                                                    <Table stickyHeader size="small">
                                                        {crcTab === 'students' && (
                                                            <>
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>#</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Roll No</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Name</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Attendance</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Status</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {crcStudents.map((s, i) => (
                                                                        <TableRow key={s.studentId} hover>
                                                                            <TableCell>{i+1}</TableCell>
                                                                            <TableCell><Typography variant="body2" fontWeight={600}>{s.rollNumber}</Typography></TableCell>
                                                                            <TableCell>{s.name}</TableCell>
                                                                            <TableCell>
                                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                                    <LinearProgress variant="determinate" value={Math.min(s.attendancePercentage,100)}
                                                                                        color={s.attendancePercentage>=75?'success':s.attendancePercentage>=65?'warning':'error'}
                                                                                        sx={{ width: 70, height: 6, borderRadius: 1 }}
                                                                                    />
                                                                                    <Typography variant="caption" fontWeight={700}>{s.attendancePercentage}%</Typography>
                                                                                </Box>
                                                                            </TableCell>
                                                                            <TableCell><Chip label={s.status} size="small" color={s.status==='Safe'?'success':s.status==='At Risk'?'warning':'error'} variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                    {crcStudents.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No students enrolled</TableCell></TableRow>}
                                                                </TableBody>
                                                            </>
                                                        )}
                                                        {crcTab === 'subjects' && (
                                                            <>
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Subject</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Faculty</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Sessions</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Avg Attendance</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {crcSubjects.map((s) => (
                                                                        <TableRow key={s.mappingId} hover>
                                                                            <TableCell>
                                                                                <Typography variant="body2" fontWeight={600}>{s.subjectName}</Typography>
                                                                                <Typography variant="caption" color="text.secondary">{s.subjectCode}</Typography>
                                                                            </TableCell>
                                                                            <TableCell>{s.facultyName}</TableCell>
                                                                            <TableCell>{s.totalSessions}</TableCell>
                                                                            <TableCell>
                                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                                    <LinearProgress variant="determinate" value={Math.min(s.avgAttendance,100)}
                                                                                        color={s.avgAttendance>=75?'success':s.avgAttendance>=50?'warning':'error'}
                                                                                        sx={{ width: 70, height: 6, borderRadius: 1 }}
                                                                                    />
                                                                                    <Typography variant="caption" fontWeight={700}>{s.avgAttendance}%</Typography>
                                                                                </Box>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                    {crcSubjects.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No subjects mapped</TableCell></TableRow>}
                                                                </TableBody>
                                                            </>
                                                        )}
                                                        {crcTab === 'atRisk' && (
                                                            <>
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Roll No</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Name</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Attendance</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Risk</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {crcDefaulters.map((s) => (
                                                                        <TableRow key={s.studentId} hover sx={{ bgcolor: alpha(theme.palette.error.main, 0.04) }}>
                                                                            <TableCell><Typography variant="body2" fontWeight={700} color="error.main">{s.rollNumber}</Typography></TableCell>
                                                                            <TableCell>{s.name}</TableCell>
                                                                            <TableCell>
                                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                                    <LinearProgress variant="determinate" value={Math.min(s.attendancePercentage,100)}
                                                                                        color="error" sx={{ width: 70, height: 6, borderRadius: 1 }}
                                                                                    />
                                                                                    <Typography variant="caption" fontWeight={700} color="error.main">{s.attendancePercentage}%</Typography>
                                                                                </Box>
                                                                            </TableCell>
                                                                            <TableCell><Chip label={s.status} size="small" color={s.status==='Critical'?'error':'warning'} variant="filled" sx={{ fontWeight: 700 }} /></TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                    {crcDefaulters.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>🎉 No defaulters! All students are on track.</TableCell></TableRow>}
                                                                </TableBody>
                                                            </>
                                                        )}
                                                    </Table>
                                                </TableContainer>
                                            )}
                                        </Card>
                                    )}
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
                onCancel={handleCancelSession} theme={theme} isDark={isDark}
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
    selectedMapping, setSelectedMapping, selectedPeriod, setSelectedPeriod, 
    numberOfHours, setNumberOfHours,
    radius, setRadius, duration, setDuration, onStart, starting, locationError,
    gettingLocation, loading, theme, isDark
}) {
    const stepBoxSx = (color) => ({
        p: 2.5,
        borderRadius: 3,
        bgcolor: alpha(color, isDark ? 0.06 : 0.03),
        border: '1px solid',
        borderColor: alpha(color, isDark ? 0.15 : 0.1),
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    });

    return (
        <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            {/* Compact Header */}
            <Box sx={{
                px: 3, py: 2,
                borderBottom: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 1.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, isDark ? 0.1 : 0.05)}, ${alpha(theme.palette.secondary.main, isDark ? 0.06 : 0.02)})`,
            }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main', width: 36, height: 36 }}>
                    <PlayIcon fontSize="small" />
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Start Attendance Session</Typography>
                    <Typography variant="caption" color="text.secondary">Configure and launch a QR session</Typography>
                </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
                {loading ? (
                    <Box textAlign="center" py={4}><CircularProgress size={36} /><Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading classes...</Typography></Box>
                ) : uniqueClasses.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}><AlertTitle>No Classes Assigned</AlertTitle>Contact your admin or HOD to get class assignments.</Alert>
                ) : (
                    <Box>
                        {/* Step 1 & 2: Class + Subject */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={3}>
                                <Box sx={stepBoxSx(theme.palette.primary.main)}>
                                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                        <Chip label="1" size="small" color="primary" sx={{ fontWeight: 700, height: 22, width: 22, '& .MuiChip-label': { px: 0 } }} />
                                        <Typography variant="body2" fontWeight={700}>Select Class</Typography>
                                    </Box>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Choose class</InputLabel>
                                        <Select value={selectedClass} label="Choose class" onChange={(e) => setSelectedClass(e.target.value)} sx={{ borderRadius: 2 }}>
                                            {uniqueClasses.map(c => (<MenuItem key={c.classId} value={c.className}>{c.className}</MenuItem>))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Box sx={{ ...stepBoxSx(theme.palette.secondary.main), opacity: selectedClass ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                        <Chip label="2" size="small" color="secondary" sx={{ fontWeight: 700, height: 22, width: 22, '& .MuiChip-label': { px: 0 } }} />
                                        <Typography variant="body2" fontWeight={700}>Select Subject</Typography>
                                    </Box>
                                    <FormControl fullWidth size="small" disabled={!selectedClass}>
                                        <InputLabel>Choose subject</InputLabel>
                                        <Select value={selectedMapping} label="Choose subject" onChange={(e) => setSelectedMapping(e.target.value)} sx={{ borderRadius: 2 }}>
                                            {filteredSubjects.map(m => (<MenuItem key={m.id} value={m.id}>{m.subjectName} ({m.subjectCode})</MenuItem>))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Box sx={{ ...stepBoxSx(theme.palette.info.main), opacity: selectedMapping ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                        <Chip label="3" size="small" color="info" sx={{ fontWeight: 700, height: 22, width: 22, '& .MuiChip-label': { px: 0 } }} />
                                        <Typography variant="body2" fontWeight={700}>Select Period</Typography>
                                    </Box>
                                    <FormControl fullWidth size="small" disabled={!selectedMapping}>
                                        <InputLabel>Choose period</InputLabel>
                                        <Select value={selectedPeriod} label="Choose period" onChange={(e) => setSelectedPeriod(e.target.value)} sx={{ borderRadius: 2 }}>
                                            {PERIODS.map(p => (<MenuItem key={p} value={p}>{p}</MenuItem>))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Box sx={{ ...stepBoxSx(theme.palette.primary.light), opacity: selectedMapping ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                        <Chip label="4" size="small" color="primary" sx={{ fontWeight: 700, height: 22, width: 22, '& .MuiChip-label': { px: 0 }, bgcolor: theme.palette.primary.light }} />
                                        <Typography variant="body2" fontWeight={700}>Number of Hours</Typography>
                                    </Box>
                                    <FormControl fullWidth size="small" disabled={!selectedMapping}>
                                        <InputLabel>Choose hours</InputLabel>
                                        <Select value={numberOfHours} label="Choose hours" onChange={(e) => setNumberOfHours(e.target.value)} sx={{ borderRadius: 2 }}>
                                            {[1, 2, 3].map(h => (<MenuItem key={h} value={h}>{h} Hour{h > 1 ? 's' : ''}</MenuItem>))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Step 3 & 4: Radius + Duration */}
                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid item xs={12} sm={6}>
                                <Box sx={stepBoxSx(theme.palette.success.main)}>
                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <Chip label="5" size="small" color="success" sx={{ fontWeight: 700, height: 22, width: 22, '& .MuiChip-label': { px: 0 } }} />
                                        <Typography variant="body2" fontWeight={700}>Geo-Fence Radius</Typography>
                                        <Chip label={`${radius}m`} size="small" color="success" variant="outlined" sx={{ ml: 'auto', fontWeight: 700, height: 22 }} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Students must be within this radius</Typography>
                                    <Slider value={radius} onChange={(_, v) => setRadius(v)} min={10} max={500} step={10} valueLabelDisplay="auto" valueLabelFormat={(v) => `${v}m`} color="success" size="small" marks={[{ value: 50, label: '50m' }, { value: 250, label: '250m' }, { value: 500, label: '500m' }]} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Box sx={stepBoxSx(theme.palette.warning.main)}>
                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <Chip label="6" size="small" color="warning" sx={{ fontWeight: 700, height: 22, width: 22, '& .MuiChip-label': { px: 0 } }} />
                                        <Typography variant="body2" fontWeight={700}>Session Duration</Typography>
                                        <Chip label={`${duration} min`} size="small" color="warning" variant="outlined" sx={{ ml: 'auto', fontWeight: 700, height: 22 }} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>How long to accept responses</Typography>
                                    <Slider value={duration} onChange={(_, v) => setDuration(v)} min={1} max={60} step={1} valueLabelDisplay="auto" valueLabelFormat={(v) => `${v}m`} color="warning" size="small" marks={[{ value: 5, label: '5m' }, { value: 15, label: '15m' }, { value: 30, label: '30m' }, { value: 60, label: '60m' }]} />
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Error */}
                        {locationError && (<Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{locationError}</Alert>)}

                        {/* Launch Button */}
                        <Button
                            fullWidth variant="contained" size="large" onClick={onStart}
                            disabled={!selectedMapping || starting}
                            startIcon={starting ? <CircularProgress size={18} color="inherit" /> : <PlayIcon />}
                            sx={{
                                py: 1.5, fontWeight: 800, borderRadius: 2.5, fontSize: '1rem',
                                background: selectedMapping
                                    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                                    : undefined,
                                boxShadow: selectedMapping
                                    ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`
                                    : undefined,
                            }}
                        >
                            {starting ? 'Getting Location...' : 'Launch Session'}
                        </Button>
                        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" sx={{ mt: 1 }}>
                            📍 Your GPS location will be captured as the attendance center
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  ACTIVE SESSION PANEL
// ═══════════════════════════════════════════════════════════════════════
function ActiveSessionPanel({ session, mappingInfo, attendanceCount, sessionTimer, formatTimer, onOpenQr, onPopOut, onEnd, onCancel, manualRollNo, setManualRollNo, manualReason, setManualReason, manualMessage, onManualSubmit, theme, isDark }) {
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
                                <Box display="flex" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Period</Typography><Typography variant="body2" fontWeight={700} color="primary.main">{session.period || "N/A"}</Typography></Box>
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
                            <Stack direction="row" spacing={1.5}>
                                <Button variant="contained" fullWidth onClick={onOpenQr} startIcon={<FullscreenIcon />} sx={{ py: 1.5, fontWeight: 700, borderRadius: 2, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }}>Full Screen</Button>
                                <Button variant="contained" fullWidth onClick={onPopOut} sx={{ py: 1.5, fontWeight: 700, borderRadius: 2, background: `linear-gradient(135deg, ${theme.palette.warning.main}, #F97316)`, color: '#000' }}>Pop Out ↗</Button>
                            </Stack>
                            <Button variant="outlined" color="error" fullWidth onClick={onEnd} startIcon={<StopCircleIcon />} sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}>End Session & Review</Button>
                            <Button variant="outlined" color="warning" fullWidth onClick={onCancel} startIcon={<CancelIcon />} sx={{ py: 1.5, fontWeight: 600, borderRadius: 2 }}>Cancel Session</Button>
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
function QrPopupDialog({ open, onClose, qrValue, attendanceCount, sessionTimer, formatTimer, mappingInfo, onEnd, onCancel, theme, isDark }) {
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
                <Button onClick={onCancel} variant="outlined" color="warning" startIcon={<CancelIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>Cancel Session</Button>
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
// ═══════════════════════════════════════════════════════════════════════
//  BULK UPLOAD SECTION
// ═══════════════════════════════════════════════════════════════════════
function BulkUploadSection({ uniqueClasses, mappings, theme, isDark, loading }) {
    const [selectedClass, setSelectedClass] = React.useState("");
    const [selectedMapping, setSelectedMapping] = React.useState("");
    const [file, setFile] = React.useState(null);
    const [dragOver, setDragOver] = React.useState(false);
    const [validating, setValidating] = React.useState(false);
    const [validationResult, setValidationResult] = React.useState(null);
    const [confirming, setConfirming] = React.useState(false);
    const [confirmed, setConfirmed] = React.useState(false);
    const [confirmCount, setConfirmCount] = React.useState(0);
    const fileInputRef = React.useRef(null);

    const filteredSubjects = React.useMemo(() => {
        if (!selectedClass) return [];
        return mappings.filter(m => m.className === selectedClass);
    }, [selectedClass, mappings]);

    const handleFileSelect = (f) => {
        if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
            setFile(f);
            setValidationResult(null);
            setConfirmed(false);
        }
    };

    const handleValidate = async () => {
        if (!file || !selectedMapping) return;
        setValidating(true);
        setValidationResult(null);
        try {
            const result = await bulkUploadAPI.validateMonthlyAttendance(file, selectedMapping);
            setValidationResult(result);
        } catch (err) {
            setValidationResult({ error: err.response?.data?.message || err.message });
        }
        setValidating(false);
    };

    const handleConfirm = async () => {
        if (!validationResult?.uploadLogId) return;
        setConfirming(true);
        try {
            const count = await bulkUploadAPI.confirmMonthlyAttendance(validationResult.uploadLogId, selectedMapping);
            setConfirmCount(count);
            setConfirmed(true);
        } catch (err) {
            alert("Import failed: " + (err.response?.data?.message || err.message));
        }
        setConfirming(false);
    };

    const handleDownloadTemplate = () => {
        // Generate a simple CSV template
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        const dates = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const day = new Date(year, month - 1, d);
            if (day.getDay() !== 0) { // Skip Sundays
                dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
            }
        }
        let csv = "Roll No," + dates.join(",") + "\n";
        csv += "EXAMPLE001," + dates.map(() => "P").join(",") + "\n";
        csv += "EXAMPLE002," + dates.map(() => "A").join(",") + "\n";

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_template_${year}_${String(month).padStart(2, '0')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setValidationResult(null);
        setConfirmed(false);
        setConfirmCount(0);
    };

    return (
        <Stack spacing={3}>
            {/* Header */}
            <Box>
                <Typography variant="h5" fontWeight={800}>Bulk Attendance Upload</Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload a month's attendance in Excel format — rows are students, columns are dates
                </Typography>
            </Box>

            {/* Step 1 & 2: Select Class + Subject */}
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main', width: 32, height: 32 }}>
                        <ClassIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight={700}>Select Class & Subject</Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                    {loading ? (
                        <Box textAlign="center" py={3}><CircularProgress size={32} /></Box>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Class</InputLabel>
                                    <Select value={selectedClass} label="Class" onChange={(e) => { setSelectedClass(e.target.value); setSelectedMapping(""); setValidationResult(null); setConfirmed(false); }} sx={{ borderRadius: 2 }}>
                                        {uniqueClasses.map(c => <MenuItem key={c.classId} value={c.className}>{c.className}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small" disabled={!selectedClass}>
                                    <InputLabel>Subject</InputLabel>
                                    <Select value={selectedMapping} label="Subject" onChange={(e) => { setSelectedMapping(e.target.value); setValidationResult(null); setConfirmed(false); }} sx={{ borderRadius: 2 }}>
                                        {filteredSubjects.map(m => <MenuItem key={m.id} value={m.id}>{m.subjectName} ({m.subjectCode})</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
            </Card>

            {/* Step 3: Upload File */}
            {selectedMapping && (
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.15), color: 'success.main', width: 32, height: 32 }}>
                                <UploadIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight={700}>Upload Attendance File</Typography>
                        </Box>
                        <Button size="small" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ borderRadius: 2, fontWeight: 600 }}>
                            Download Template
                        </Button>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                        {/* Format Info */}
                        <Alert severity="info" sx={{ borderRadius: 2, mb: 2.5 }}>
                            <AlertTitle>Excel Format</AlertTitle>
                            <strong>Row 1 (header):</strong> Roll No | 2026-05-01 | 2026-05-02 | ... | 2026-05-31<br />
                            <strong>Row 2+:</strong> Student roll numbers with P (Present) or A (Absent) in each date column.<br />
                            Supported: <strong>.xlsx</strong> files. Date format: <strong>YYYY-MM-DD</strong> or <strong>DD/MM/YYYY</strong>.
                        </Alert>

                        {/* Drop Zone */}
                        <Box
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                p: 4, borderRadius: 3, textAlign: 'center', cursor: 'pointer',
                                border: '2px dashed',
                                borderColor: dragOver ? 'primary.main' : file ? 'success.main' : 'divider',
                                bgcolor: dragOver ? alpha(theme.palette.primary.main, 0.05)
                                    : file ? alpha(theme.palette.success.main, 0.04) : 'transparent',
                                transition: 'all 0.2s',
                                '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.03) },
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileSelect(e.target.files[0])}
                            />
                            {file ? (
                                <Box>
                                    <FileIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                    <Typography variant="body1" fontWeight={700} color="success.main">{file.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{(file.size / 1024).toFixed(1)} KB — Click to change</Typography>
                                </Box>
                            ) : (
                                <Box>
                                    <UploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                    <Typography variant="body1" fontWeight={600}>Drop your Excel file here</Typography>
                                    <Typography variant="caption" color="text.secondary">or click to browse — .xlsx only</Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Validate Button */}
                        {file && !validationResult && (
                            <Button
                                fullWidth variant="contained" size="large" sx={{ mt: 2.5, py: 1.5, fontWeight: 700, borderRadius: 2.5 }}
                                onClick={handleValidate} disabled={validating}
                                startIcon={validating ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                            >
                                {validating ? 'Validating...' : 'Validate & Preview'}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Validation Result */}
            {validationResult && !validationResult.error && (
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.15), color: 'warning.main', width: 32, height: 32 }}>
                            <ChartIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={700}>Validation Results</Typography>
                        <Chip label={validationResult.fileName} size="small" variant="outlined" sx={{ ml: 'auto' }} />
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                        {/* Stats */}
                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04) }}>
                                    <Typography variant="h5" fontWeight={800} color="primary">{validationResult.totalStudents}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Students</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, isDark ? 0.08 : 0.04) }}>
                                    <Typography variant="h5" fontWeight={800} color="success.main">{validationResult.presentCount}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Present</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, isDark ? 0.08 : 0.04) }}>
                                    <Typography variant="h5" fontWeight={800} color="error.main">{validationResult.absentCount}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Absent</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, isDark ? 0.08 : 0.04) }}>
                                    <Typography variant="h5" fontWeight={800} color="warning.main">{validationResult.dates?.length || 0}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Days</Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Dates parsed */}
                        {validationResult.dates?.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Dates Detected:</Typography>
                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                    {validationResult.dates.map(d => <Chip key={d} label={d} size="small" variant="outlined" sx={{ fontSize: 11 }} />)}
                                </Box>
                            </Box>
                        )}

                        {/* Errors */}
                        {validationResult.errors?.length > 0 && (
                            <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
                                <AlertTitle>{validationResult.errors.length} Validation Warning(s)</AlertTitle>
                                <Box sx={{ maxHeight: 150, overflow: 'auto', fontSize: 12 }}>
                                    {validationResult.errors.slice(0, 20).map((e, i) => (
                                        <Typography key={i} variant="caption" display="block">
                                            Row {e.rowNumber} [{e.field}]: {e.message}
                                        </Typography>
                                    ))}
                                    {validationResult.errors.length > 20 && (
                                        <Typography variant="caption" fontWeight={700}>... and {validationResult.errors.length - 20} more</Typography>
                                    )}
                                </Box>
                            </Alert>
                        )}

                        {/* Confirm / Status */}
                        {confirmed ? (
                            <Alert severity="success" sx={{ borderRadius: 2 }}>
                                <AlertTitle>Import Complete!</AlertTitle>
                                Successfully imported <strong>{confirmCount}</strong> attendance records.
                                <Button size="small" onClick={handleReset} sx={{ ml: 2 }}>Upload Another</Button>
                            </Alert>
                        ) : validationResult.validRecords > 0 ? (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="contained" color="success" size="large" onClick={handleConfirm}
                                    disabled={confirming}
                                    startIcon={confirming ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                                    sx={{ py: 1.5, px: 4, fontWeight: 800, borderRadius: 2.5, boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.35)}` }}
                                >
                                    {confirming ? 'Importing...' : `Confirm & Import ${validationResult.validRecords} Records`}
                                </Button>
                                <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: 2.5 }}>Cancel</Button>
                            </Stack>
                        ) : (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                No valid records to import. Fix the errors above and re-upload.
                                <Button size="small" onClick={handleReset} sx={{ ml: 2 }}>Try Again</Button>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Error result */}
            {validationResult?.error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    <AlertTitle>Upload Failed</AlertTitle>
                    {validationResult.error}
                    <Button size="small" onClick={handleReset} sx={{ ml: 2 }}>Try Again</Button>
                </Alert>
            )}
        </Stack>
    );
}

export default FacultyDashboard;
