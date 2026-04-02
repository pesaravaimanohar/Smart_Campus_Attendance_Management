import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Typography, Button, Box, MenuItem, Select, FormControl,
    InputLabel, Grid, Card, CardContent, TextField, Slider,
    Avatar, IconButton, useTheme, Fade, Chip, Tooltip, Stack,
    Divider, Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Paper, Switch, CircularProgress, Alert, AlertTitle, LinearProgress,
    Badge
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import QRCode from "react-qr-code";
import {
    getFacultyMappings, createSession, markManualAttendance,
    refreshSessionQr, endSession, getSessionAttendanceCount,
    getSessionAttendance, updateAttendanceStatus
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
    AutorenewRounded as AutorenewIcon,
    LocationOn as LocationIcon,
    Groups as GroupsIcon,
    PlayArrow as PlayIcon,
    OpenInNew as PopOutIcon,
    School as SchoolIcon,
    Timer as DurationIcon,
    GpsFixed as GpsIcon,
    Fullscreen as FullscreenIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
    ThumbUp as ApproveIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    MyLocation as MyLocationIcon,
    RadioButtonChecked as LiveIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';

// ═══════════════════════════════════════════════════════════════
//  FACULTY DASHBOARD — Complete Attendance Session Workflow
// ═══════════════════════════════════════════════════════════════
const FacultyDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // ─── Data ──────────────────────────────
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // ─── Post-Session Review State ─────────
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

    // ─── Sidebar ───────────────────────────
    const [activeSection, setActiveSection] = useState('session');

    // ═══════════════════════════════════════
    //  LOAD FACULTY MAPPINGS
    // ═══════════════════════════════════════
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getFacultyMappings();
                setMappings(data);
            } catch (e) {
                console.error("Failed to load mappings:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ═══════════════════════════════════════
    //  DERIVED: Unique classes & filtered subjects
    // ═══════════════════════════════════════
    const uniqueClasses = React.useMemo(() => {
        const map = new Map();
        mappings.forEach(m => {
            if (!map.has(m.className)) {
                map.set(m.className, { className: m.className, classId: m.classId });
            }
        });
        return [...map.values()];
    }, [mappings]);

    const filteredSubjects = React.useMemo(() => {
        if (!selectedClass) return [];
        return mappings.filter(m => m.className === selectedClass);
    }, [mappings, selectedClass]);

    // ═══════════════════════════════════════
    //  SESSION POLLING (QR refresh, count, timer)
    // ═══════════════════════════════════════
    useEffect(() => {
        let qrInterval, countInterval, timerInterval;
        if (session) {
            setQrValue(session.qrToken || `SESSION:${session.id}`);
            setSessionTimer(0);

            qrInterval = setInterval(async () => {
                try {
                    const data = await refreshSessionQr(session.id);
                    setQrValue(data.qrToken);
                } catch (e) {
                    console.error('QR refresh failed:', e);
                }
            }, 10000);

            countInterval = setInterval(async () => {
                try {
                    const data = await getSessionAttendanceCount(session.id);
                    setAttendanceCount(data.count);
                } catch (e) {
                    console.error('Count poll failed:', e);
                }
            }, 5000);

            timerInterval = setInterval(() => {
                setSessionTimer(t => t + 1);
            }, 1000);

            getSessionAttendanceCount(session.id).then(d => setAttendanceCount(d.count)).catch(() => {});
        } else {
            setAttendanceCount(0);
            setSessionTimer(0);
        }
        return () => {
            clearInterval(qrInterval);
            clearInterval(countInterval);
            clearInterval(timerInterval);
        };
    }, [session]);

    // ═══════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════
    const formatTimer = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const getSelectedMappingInfo = () => {
        return mappings.find(m => String(m.id) === String(selectedMapping));
    };

    // ═══════════════════════════════════════
    //  GET LOCATION
    // ═══════════════════════════════════════
    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation not supported"));
                return;
            }
            setGettingLocation(true);
            setLocationError("");
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    setFacultyLocation(loc);
                    setGettingLocation(false);
                    resolve(loc);
                },
                (err) => {
                    setGettingLocation(false);
                    reject(new Error("Location access denied. Please enable GPS."));
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    };

    // ═══════════════════════════════════════
    //  START SESSION
    // ═══════════════════════════════════════
    const handleStartSession = async () => {
        if (!selectedMapping) return;
        setStartingSession(true);
        setLocationError("");

        try {
            const loc = await getLocation();
            const newSession = await createSession({
                mapId: selectedMapping,
                latitude: loc.latitude,
                longitude: loc.longitude,
                duration: duration,
                radius: radius
            });
            setSession(newSession);
            setQrDialogOpen(true); // Auto-open QR popup
        } catch (e) {
            setLocationError(e.response?.data?.message || e.message || "Failed to start session");
        } finally {
            setStartingSession(false);
        }
    };

    // ═══════════════════════════════════════
    //  END SESSION → Review Mode
    // ═══════════════════════════════════════
    const handleEndSession = async () => {
        if (!session) return;
        const sid = session.id;
        try {
            await endSession(sid);
            setSession(null);
            setQrDialogOpen(false);
            setEndedSessionId(sid);
            setReviewMode(true);
            setApproved(false);
            // Load attendance records
            setLoadingRecords(true);
            const records = await getSessionAttendance(sid);
            setAttendanceRecords(records);
        } catch (e) {
            alert("Failed to end session: " + (e.response?.data?.message || e.message));
        } finally {
            setLoadingRecords(false);
        }
    };

    // ═══════════════════════════════════════
    //  TOGGLE STUDENT STATUS IN REVIEW
    // ═══════════════════════════════════════
    const toggleStudentStatus = (recordId) => {
        setAttendanceRecords(prev => prev.map(r => {
            if (r.recordId === recordId) {
                const newStatus = (r.status === 'PRESENT' || r.status === 'MANUAL_VERIFIED') ? 'REJECTED' : 'PRESENT';
                return { ...r, status: newStatus, modified: true };
            }
            return r;
        }));
    };

    // ═══════════════════════════════════════
    //  APPROVE ATTENDANCE
    // ═══════════════════════════════════════
    const handleApproveAttendance = async () => {
        setApproving(true);
        try {
            const modified = attendanceRecords.filter(r => r.modified);
            for (const record of modified) {
                await updateAttendanceStatus(record.recordId, record.status, record.remarks || "Faculty reviewed");
            }
            setApproved(true);
        } catch (e) {
            alert("Failed to approve: " + (e.response?.data?.message || e.message));
        } finally {
            setApproving(false);
        }
    };

    // ═══════════════════════════════════════
    //  MANUAL ATTENDANCE
    // ═══════════════════════════════════════
    const handleManualSubmit = async () => {
        if (!session) {
            setManualMessage("Start a session first.");
            return;
        }
        try {
            await markManualAttendance({
                sessionId: session.id,
                studentRollNo: manualRollNo,
                reason: manualReason
            });
            setManualMessage(`✅ ${manualRollNo} marked as Present`);
            setManualRollNo("");
            setManualReason("");
            setTimeout(() => setManualMessage(""), 5000);
        } catch (error) {
            setManualMessage("❌ " + (error.response?.data?.message || "Invalid Roll No"));
        }
    };

    const resetToNewSession = () => {
        setReviewMode(false);
        setAttendanceRecords([]);
        setEndedSessionId(null);
        setApproved(false);
        setSelectedClass("");
        setSelectedMapping("");
    };

    // ═══════════════════════════════════════
    //  COMPUTED STATS
    // ═══════════════════════════════════════
    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'MANUAL_VERIFIED').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'REJECTED').length;
    const totalStudents = attendanceRecords.length;

    // ═══════════════════════════════════════
    //  SIDEBAR MENU
    // ═══════════════════════════════════════
    const menuItems = [
        { id: 'session', icon: <QrCodeIcon />, label: 'Live Session' },
        { id: 'classes', icon: <DashboardIcon />, label: 'My Classes' },
        { id: 'reports', icon: <AssignmentIcon />, label: 'Attendance Reports' },
    ];
    const currentLabel = menuItems.find(m => m.id === activeSection)?.label || 'Live Session';

    // ═══════════════════════════════════════════════════════════════
    //  R E N D E R
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
            statusChip={session ? { label: 'Session Active', color: 'success' } : { label: 'No Active Session', color: 'default' }}
        >
            {/* ═══════════════════════════════════════════════════════
                VIEW: LIVE SESSION
            ═══════════════════════════════════════════════════════ */}
            {activeSection === 'session' && (
                <Fade in timeout={400}>
                    <Box>
                        {/* Quick Stats Row */}
                        <Grid container spacing={2.5} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={4}>
                                <StatsCard
                                    title="Assigned Classes"
                                    value={uniqueClasses.length}
                                    icon={<ClassIcon />}
                                    color={theme.palette.primary.main}
                                    subtitle="this semester"
                                    animationDelay={0}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StatsCard
                                    title="Students Present"
                                    value={attendanceCount}
                                    icon={<GroupsIcon />}
                                    color={theme.palette.success.main}
                                    subtitle={session ? "live count" : "no active session"}
                                    animationDelay={100}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StatsCard
                                    title="Session Duration"
                                    value={session ? formatTimer(sessionTimer) : "--:--"}
                                    icon={<TimerIcon />}
                                    color={theme.palette.warning.main}
                                    subtitle={session ? "elapsed" : "not started"}
                                    animationDelay={200}
                                />
                            </Grid>
                        </Grid>

                        {/* ── POST-SESSION REVIEW MODE ──── */}
                        {reviewMode && !session && (
                            <ReviewPanel
                                attendanceRecords={attendanceRecords}
                                loadingRecords={loadingRecords}
                                presentCount={presentCount}
                                absentCount={absentCount}
                                totalStudents={totalStudents}
                                onToggleStatus={toggleStudentStatus}
                                onApprove={handleApproveAttendance}
                                approving={approving}
                                approved={approved}
                                onNewSession={resetToNewSession}
                                theme={theme}
                                isDark={isDark}
                            />
                        )}

                        {/* ── START SESSION FORM ──── */}
                        {!session && !reviewMode && (
                            <StartSessionForm
                                uniqueClasses={uniqueClasses}
                                filteredSubjects={filteredSubjects}
                                selectedClass={selectedClass}
                                setSelectedClass={(v) => { setSelectedClass(v); setSelectedMapping(""); }}
                                selectedMapping={selectedMapping}
                                setSelectedMapping={setSelectedMapping}
                                radius={radius}
                                setRadius={setRadius}
                                duration={duration}
                                setDuration={setDuration}
                                onStart={handleStartSession}
                                starting={startingSession}
                                locationError={locationError}
                                gettingLocation={gettingLocation}
                                loading={loading}
                                theme={theme}
                                isDark={isDark}
                            />
                        )}

                        {/* ── ACTIVE SESSION PANEL ──── */}
                        {session && (
                            <ActiveSessionPanel
                                session={session}
                                mappingInfo={getSelectedMappingInfo()}
                                attendanceCount={attendanceCount}
                                sessionTimer={sessionTimer}
                                formatTimer={formatTimer}
                                onOpenQr={() => setQrDialogOpen(true)}
                                onEnd={handleEndSession}
                                manualRollNo={manualRollNo}
                                setManualRollNo={setManualRollNo}
                                manualReason={manualReason}
                                setManualReason={setManualReason}
                                manualMessage={manualMessage}
                                onManualSubmit={handleManualSubmit}
                                theme={theme}
                                isDark={isDark}
                            />
                        )}
                    </Box>
                </Fade>
            )}

            {/* ═══════════════════════════════════════════════════════
                VIEW: MY CLASSES
            ═══════════════════════════════════════════════════════ */}
            {activeSection === 'classes' && (
                <Fade in timeout={400}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} gutterBottom>My Assigned Classes</Typography>
                        <Grid container spacing={2}>
                            {mappings.map((m, i) => (
                                <Grid item xs={12} sm={6} md={4} key={m.id}>
                                    <Card sx={{
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}`
                                        }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                                <Avatar sx={{
                                                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1),
                                                    color: 'primary.main',
                                                    width: 44, height: 44
                                                }}>
                                                    <SchoolIcon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={700}>{m.subjectName}</Typography>
                                                    <Chip label={m.subjectCode} size="small" color="info" variant="outlined" />
                                                </Box>
                                            </Box>
                                            <Divider sx={{ my: 1.5 }} />
                                            <Stack spacing={1}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Class</Typography>
                                                    <Typography variant="caption" fontWeight={600}>{m.className}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Section</Typography>
                                                    <Typography variant="caption" fontWeight={600}>{m.section || 'All'}</Typography>
                                                </Box>
                                                {m.academicYear && (
                                                    <Box display="flex" justifyContent="space-between">
                                                        <Typography variant="caption" color="text.secondary">Year</Typography>
                                                        <Chip label={m.academicYear} size="small" variant="outlined" />
                                                    </Box>
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                            {mappings.length === 0 && !loading && (
                                <Grid item xs={12}>
                                    <Box textAlign="center" py={8}>
                                        <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="h6" color="text.secondary">No classes assigned yet</Typography>
                                        <Typography variant="body2" color="text.disabled">Contact your HOD to get class assignments.</Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Fade>
            )}

            {/* ═══════════════════════════════════════════════════════
                VIEW: REPORTS (placeholder)
            ═══════════════════════════════════════════════════════ */}
            {activeSection === 'reports' && (
                <Fade in timeout={400}>
                    <Box textAlign="center" py={8}>
                        <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h5" fontWeight={700} color="text.secondary">Attendance Reports</Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                            Session-wise and subject-wise reports will appear here.
                        </Typography>
                    </Box>
                </Fade>
            )}

            {/* ═══════════════════════════════════════════════════════
                QR CODE POPUP DIALOG (Floating)
            ═══════════════════════════════════════════════════════ */}
            <QrPopupDialog
                open={qrDialogOpen}
                onClose={() => setQrDialogOpen(false)}
                qrValue={qrValue}
                attendanceCount={attendanceCount}
                sessionTimer={sessionTimer}
                formatTimer={formatTimer}
                mappingInfo={getSelectedMappingInfo()}
                onEnd={handleEndSession}
                theme={theme}
                isDark={isDark}
            />
        </DashboardLayout>
    );
};

// ═══════════════════════════════════════════════════════════════════════
//  START SESSION FORM COMPONENT
// ═══════════════════════════════════════════════════════════════════════
function StartSessionForm({
    uniqueClasses, filteredSubjects, selectedClass, setSelectedClass,
    selectedMapping, setSelectedMapping, radius, setRadius,
    duration, setDuration, onStart, starting, locationError,
    gettingLocation, loading, theme, isDark
}) {
    return (
        <Card sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
        }}>
            {/* Header */}
            <Box sx={{
                px: 3, py: 2.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: 'white',
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
                        <PlayIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Start Attendance Session</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>Configure and launch a new QR attendance session</Typography>
                    </Box>
                </Box>
            </Box>

            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                {loading ? (
                    <Box textAlign="center" py={4}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading your classes...</Typography>
                    </Box>
                ) : uniqueClasses.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <AlertTitle>No Classes Assigned</AlertTitle>
                        You don't have any classes assigned yet. Contact your admin or HOD.
                    </Alert>
                ) : (
                    <Grid container spacing={3}>
                        {/* Step 1: Select Class */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                p: 2.5, borderRadius: 3,
                                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
                                border: '1px solid',
                                borderColor: alpha(theme.palette.primary.main, 0.15),
                            }}>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Chip label="1" size="small" color="primary" sx={{ fontWeight: 700 }} />
                                    <Typography variant="subtitle2" fontWeight={700}>Select Class</Typography>
                                </Box>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Choose your class</InputLabel>
                                    <Select
                                        value={selectedClass}
                                        label="Choose your class"
                                        onChange={(e) => setSelectedClass(e.target.value)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {uniqueClasses.map(c => (
                                            <MenuItem key={c.classId} value={c.className}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <ClassIcon fontSize="small" color="primary" />
                                                    {c.className}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Grid>

                        {/* Step 2: Select Subject (filtered by class) */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                p: 2.5, borderRadius: 3,
                                bgcolor: alpha(theme.palette.secondary.main, isDark ? 0.08 : 0.04),
                                border: '1px solid',
                                borderColor: alpha(theme.palette.secondary.main, 0.15),
                                opacity: selectedClass ? 1 : 0.5,
                                transition: 'opacity 0.3s',
                            }}>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Chip label="2" size="small" color="secondary" sx={{ fontWeight: 700 }} />
                                    <Typography variant="subtitle2" fontWeight={700}>Select Subject</Typography>
                                </Box>
                                <FormControl fullWidth size="small" disabled={!selectedClass}>
                                    <InputLabel>Choose subject for this class</InputLabel>
                                    <Select
                                        value={selectedMapping}
                                        label="Choose subject for this class"
                                        onChange={(e) => setSelectedMapping(e.target.value)}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {filteredSubjects.map(m => (
                                            <MenuItem key={m.id} value={m.id}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <SchoolIcon fontSize="small" color="secondary" />
                                                    {m.subjectName}
                                                    <Chip label={m.subjectCode} size="small" variant="outlined" sx={{ ml: 'auto' }} />
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {selectedClass && filteredSubjects.length === 0 && (
                                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                        No subjects assigned for this class.
                                    </Typography>
                                )}
                            </Box>
                        </Grid>

                        {/* Step 3: Radius */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                p: 2.5, borderRadius: 3,
                                bgcolor: alpha(theme.palette.success.main, isDark ? 0.08 : 0.04),
                                border: '1px solid',
                                borderColor: alpha(theme.palette.success.main, 0.15),
                            }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Chip label="3" size="small" color="success" sx={{ fontWeight: 700 }} />
                                    <Typography variant="subtitle2" fontWeight={700}>Geo-Fence Radius</Typography>
                                    <Chip
                                        label={`${radius}m`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                        sx={{ ml: 'auto', fontWeight: 700 }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    Students must be within this radius to mark attendance
                                </Typography>
                                <Slider
                                    value={radius}
                                    onChange={(_, v) => setRadius(v)}
                                    min={10}
                                    max={500}
                                    step={10}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(v) => `${v}m`}
                                    color="success"
                                    marks={[
                                        { value: 50, label: '50m' },
                                        { value: 100, label: '100m' },
                                        { value: 250, label: '250m' },
                                        { value: 500, label: '500m' },
                                    ]}
                                />
                            </Box>
                        </Grid>

                        {/* Step 4: Duration */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{
                                p: 2.5, borderRadius: 3,
                                bgcolor: alpha(theme.palette.warning.main, isDark ? 0.08 : 0.04),
                                border: '1px solid',
                                borderColor: alpha(theme.palette.warning.main, 0.15),
                            }}>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Chip label="4" size="small" color="warning" sx={{ fontWeight: 700 }} />
                                    <Typography variant="subtitle2" fontWeight={700}>Session Duration</Typography>
                                    <Chip
                                        label={`${duration} min`}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                        sx={{ ml: 'auto', fontWeight: 700 }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    How long should the session accept responses?
                                </Typography>
                                <Slider
                                    value={duration}
                                    onChange={(_, v) => setDuration(v)}
                                    min={1}
                                    max={60}
                                    step={1}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(v) => `${v} min`}
                                    color="warning"
                                    marks={[
                                        { value: 5, label: '5m' },
                                        { value: 15, label: '15m' },
                                        { value: 30, label: '30m' },
                                        { value: 60, label: '60m' },
                                    ]}
                                />
                            </Box>
                        </Grid>

                        {/* Error */}
                        {locationError && (
                            <Grid item xs={12}>
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    <AlertTitle>Error</AlertTitle>
                                    {locationError}
                                </Alert>
                            </Grid>
                        )}

                        {/* Launch Button */}
                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={onStart}
                                disabled={!selectedMapping || starting}
                                startIcon={starting ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                                sx={{
                                    py: 2,
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    borderRadius: 3,
                                    background: selectedMapping
                                        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                                        : undefined,
                                    boxShadow: selectedMapping
                                        ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`
                                        : undefined,
                                    '&:hover': {
                                        boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`
                                    }
                                }}
                            >
                                {starting ? 'Getting Location & Starting...' : 'Launch Attendance Session'}
                            </Button>
                            <Typography variant="caption" color="text.secondary" textAlign="center" display="block" sx={{ mt: 1 }}>
                                📍 Your current GPS location will be captured as the attendance center
                            </Typography>
                        </Grid>
                    </Grid>
                )}
            </CardContent>
        </Card>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  ACTIVE SESSION PANEL (shown below stats when session is live)
// ═══════════════════════════════════════════════════════════════════════
function ActiveSessionPanel({
    session, mappingInfo, attendanceCount, sessionTimer, formatTimer,
    onOpenQr, onEnd, manualRollNo, setManualRollNo, manualReason,
    setManualReason, manualMessage, onManualSubmit, theme, isDark
}) {
    return (
        <Grid container spacing={3}>
            {/* Left: Session Info + Manual */}
            <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <Box sx={{
                        px: 3, py: 2,
                        bgcolor: alpha(theme.palette.success.main, isDark ? 0.12 : 0.06),
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <LiveIcon sx={{ color: 'success.main', fontSize: 18, animation: 'pulse 1.5s infinite',
                                '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } }
                            }} />
                            <Typography variant="subtitle2" fontWeight={700} color="success.main">SESSION ACTIVE</Typography>
                            <Chip label={formatTimer(sessionTimer)} size="small" color="success" sx={{ ml: 'auto', fontWeight: 700 }} />
                        </Box>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                        {mappingInfo && (
                            <Stack spacing={2} mb={3}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.secondary">Subject</Typography>
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="body2" fontWeight={600}>{mappingInfo.subjectName}</Typography>
                                        <Chip label={mappingInfo.subjectCode} size="small" variant="outlined" />
                                    </Box>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="caption" color="text.secondary">Class</Typography>
                                    <Typography variant="body2" fontWeight={600}>{mappingInfo.className}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="caption" color="text.secondary">Students Marked</Typography>
                                    <Chip label={attendanceCount} size="small" color="primary" sx={{ fontWeight: 700 }} />
                                </Box>
                            </Stack>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Manual Entry */}
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>Manual Override</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            Mark a student present manually (e.g., scanner issues)
                        </Typography>
                        <Stack spacing={1.5}>
                            <TextField
                                size="small"
                                label="Student Roll Number"
                                value={manualRollNo}
                                onChange={(e) => setManualRollNo(e.target.value)}
                                fullWidth
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                                size="small"
                                label="Reason"
                                value={manualReason}
                                onChange={(e) => setManualReason(e.target.value)}
                                fullWidth
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <Button
                                variant="outlined"
                                onClick={onManualSubmit}
                                startIcon={<AddCircleIcon />}
                                sx={{ borderRadius: 2, fontWeight: 600 }}
                            >
                                Mark Present
                            </Button>
                        </Stack>
                        {manualMessage && (
                            <Alert severity={manualMessage.includes('✅') ? 'success' : 'error'} sx={{ mt: 1.5, borderRadius: 2 }}>
                                {manualMessage}
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* Right: QR Preview + Actions */}
            <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                            QR CODE PREVIEW
                        </Typography>
                        <Box sx={{
                            p: 2, mt: 1, mb: 2,
                            bgcolor: 'white',
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
                        }}>
                            <QRCode value={session.qrToken || ''} size={180} />
                        </Box>

                        <Typography variant="caption" color="text.secondary" textAlign="center" mb={2}>
                            Auto-refreshes every 10s for security
                        </Typography>

                        <Stack spacing={1.5} width="100%">
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={onOpenQr}
                                startIcon={<FullscreenIcon />}
                                sx={{
                                    py: 1.5, fontWeight: 700, borderRadius: 2,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                }}
                            >
                                Pop Out QR (Full Screen)
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                onClick={onEnd}
                                startIcon={<StopCircleIcon />}
                                sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
                            >
                                End Session & Review
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  QR POPUP DIALOG (Floating — faculty can do other work)
// ═══════════════════════════════════════════════════════════════════════
function QrPopupDialog({ open, onClose, qrValue, attendanceCount, sessionTimer, formatTimer, mappingInfo, onEnd, theme, isDark }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                }
            }}
        >
            {/* Header */}
            <Box sx={{
                px: 3, py: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <LiveIcon sx={{ animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } }
                    }} />
                    <Box>
                        <Typography variant="subtitle1" fontWeight={800}>Live QR Code</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            {mappingInfo ? `${mappingInfo.subjectName} — ${mappingInfo.className}` : 'Attendance Session'}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    <Chip label={formatTimer(sessionTimer)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* QR Code */}
                <Box sx={{
                    p: 3,
                    bgcolor: 'white',
                    borderRadius: 4,
                    boxShadow: `0 8px 30px ${alpha(theme.palette.common.black, 0.12)}`,
                    mb: 3,
                }}>
                    <QRCode value={qrValue || ''} size={280} />
                </Box>

                {/* Live Counter */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    p: 2, borderRadius: 3,
                    bgcolor: alpha(theme.palette.success.main, isDark ? 0.1 : 0.06),
                    width: '100%', justifyContent: 'center',
                }}>
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

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                    🔄 QR auto-refreshes every 10 seconds · 📍 Geo-fencing active
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>
                    Minimize
                </Button>
                <Button
                    onClick={onEnd}
                    variant="contained"
                    color="error"
                    startIcon={<StopCircleIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    End Session & Review
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  POST-SESSION REVIEW PANEL
// ═══════════════════════════════════════════════════════════════════════
function ReviewPanel({
    attendanceRecords, loadingRecords, presentCount, absentCount, totalStudents,
    onToggleStatus, onApprove, approving, approved, onNewSession, theme, isDark
}) {
    return (
        <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{
                px: 3, py: 2.5,
                background: approved
                    ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                    : `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                color: 'white',
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
                        {approved ? <CheckCircleIcon /> : <EditIcon />}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>
                            {approved ? 'Attendance Approved ✓' : 'Review Attendance'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            {approved ? 'Attendance has been finalized' : 'Toggle student status before approving'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <CardContent sx={{ p: 0 }}>
                {/* Summary Row */}
                <Box sx={{ display: 'flex', gap: 2, p: 3, flexWrap: 'wrap' }}>
                    <Chip
                        icon={<GroupsIcon />}
                        label={`Total: ${totalStudents}`}
                        sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                    />
                    <Chip
                        icon={<CheckCircleIcon />}
                        label={`Present: ${presentCount}`}
                        color="success"
                        sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                    />
                    <Chip
                        icon={<CancelIcon />}
                        label={`Absent: ${absentCount}`}
                        color="error"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                    />
                </Box>

                {loadingRecords ? (
                    <Box textAlign="center" py={6}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading records...</Typography>
                    </Box>
                ) : attendanceRecords.length === 0 ? (
                    <Box textAlign="center" py={6}>
                        <GroupsIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>No students attended</Typography>
                    </Box>
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
                                    {!approved && (
                                        <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Toggle</TableCell>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {attendanceRecords.map((r, i) => {
                                    const isPresent = r.status === 'PRESENT' || r.status === 'MANUAL_VERIFIED';
                                    return (
                                        <TableRow key={r.recordId} sx={{
                                            bgcolor: r.modified ? alpha(theme.palette.warning.main, isDark ? 0.1 : 0.05) : 'transparent',
                                            transition: 'background 0.3s',
                                        }}>
                                            <TableCell>{i + 1}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{r.rollNumber}</Typography>
                                            </TableCell>
                                            <TableCell>{r.studentName}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={isPresent ? 'Present' : 'Absent'}
                                                    size="small"
                                                    color={isPresent ? 'success' : 'error'}
                                                    variant={isPresent ? 'filled' : 'outlined'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">{r.remarks || '—'}</Typography>
                                            </TableCell>
                                            {!approved && (
                                                <TableCell>
                                                    <Switch
                                                        checked={isPresent}
                                                        onChange={() => onToggleStatus(r.recordId)}
                                                        color="success"
                                                        size="small"
                                                    />
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Action Buttons */}
                <Box sx={{ p: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {!approved ? (
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            onClick={onApprove}
                            disabled={approving || attendanceRecords.length === 0}
                            startIcon={approving ? <CircularProgress size={18} color="inherit" /> : <ApproveIcon />}
                            sx={{
                                py: 1.5, px: 4, fontWeight: 800, borderRadius: 3,
                                boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.35)}`,
                            }}
                        >
                            {approving ? 'Approving...' : 'Approve & Finalize Attendance'}
                        </Button>
                    ) : (
                        <Alert severity="success" sx={{ flex: 1, borderRadius: 2 }}>
                            <AlertTitle>Attendance Approved</AlertTitle>
                            All changes have been saved. {presentCount} present, {absentCount} absent.
                        </Alert>
                    )}
                    <Button
                        variant="outlined"
                        onClick={onNewSession}
                        startIcon={<RefreshIcon />}
                        sx={{ py: 1.5, fontWeight: 600, borderRadius: 3 }}
                    >
                        Start New Session
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}

export default FacultyDashboard;
