import React, { useState, useEffect, useCallback } from "react";
import {
    Typography, Box, Grid, Card, CardContent, Avatar, Chip, Tooltip,
    useTheme, Fade, LinearProgress, Table, TableBody, TableRow, TableCell,
    TableHead, TableContainer, Paper, Button, Stack, Divider, Skeleton,
    IconButton, TextField, InputAdornment
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    Class as ClassIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    Groups as GroupsIcon,
    MenuBook as SubjectIcon,
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    EventNote as EventIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import { crcAPI } from "../services/api";

const CRCDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [activeSection, setActiveSection] = useState('overview');
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState(null);
    const [classStudents, setClassStudents] = useState([]);
    const [classSubjects, setClassSubjects] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [atRiskLoading, setAtRiskLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState("");

    const loadClasses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await crcAPI.getMyClasses();
            setClasses(data);
            if (data.length > 0 && !selectedClass) setSelectedClass(data[0]);
        } catch (e) { console.error("CRC classes error:", e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadClasses(); }, [loadClasses]);

    useEffect(() => {
        if (selectedClass) {
            if (activeSection === 'students') loadStudents(selectedClass.classId);
            if (activeSection === 'subjects') loadSubjects(selectedClass.classId);
            if (activeSection === 'atRisk') loadAtRisk(selectedClass.classId);
        }
    }, [activeSection, selectedClass]);

    const loadStudents = async (classId) => {
        setStudentsLoading(true);
        try { setClassStudents(await crcAPI.getClassStudents(classId)); }
        catch (e) { console.error(e); }
        finally { setStudentsLoading(false); }
    };
    const loadSubjects = async (classId) => {
        setSubjectsLoading(true);
        try { setClassSubjects(await crcAPI.getClassSubjects(classId)); }
        catch (e) { console.error(e); }
        finally { setSubjectsLoading(false); }
    };
    const loadAtRisk = async (classId) => {
        setAtRiskLoading(true);
        try { setAtRiskStudents(await crcAPI.getClassDefaulters(classId)); }
        catch (e) { console.error(e); }
        finally { setAtRiskLoading(false); }
    };

    const menuItems = [
        { id: 'overview', icon: <DashboardIcon />, label: 'Overview' },
        { divider: true },
        { label: 'Class Insights', isLabel: true },
        { id: 'students', icon: <GroupsIcon />, label: 'Student Details' },
        { id: 'subjects', icon: <SubjectIcon />, label: 'Subject Analytics' },
        { id: 'atRisk', icon: <WarningIcon />, label: 'At Risk List', badge: atRiskStudents.length || null, badgeColor: 'error' },
    ];

    const currentLabel = menuItems.find(m => m.id === activeSection)?.label || 'Overview';
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.sub || 'Faculty';
    const filteredStudents = classStudents.filter(s =>
        !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const getStatusColor = (pct) => pct >= 75 ? 'success' : pct >= 65 ? 'warning' : 'error';

    if (loading) return <Box p={4}><LinearProgress /></Box>;

    if (classes.length === 0) {
        return (
            <DashboardLayout title="CRC Portal" subtitle="Class Coordinator" portalIcon={<ClassIcon />}
                portalTitle="CRC" portalSubtitle="Class Coordinator" menuItems={[]} activeSection="overview">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column">
                    <ClassIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h5" color="text.secondary" fontWeight={700}>No Classes Assigned</Typography>
                    <Typography color="text.disabled" sx={{ mt: 1 }}>You are not assigned as CRC for any class.</Typography>
                    <Button variant="outlined" href="/faculty" sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }}>Go to Faculty Portal</Button>
                </Box>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={currentLabel}
            subtitle={selectedClass ? `CRC • ${selectedClass.className}` : 'Class Coordinator'}
            portalIcon={<ClassIcon />}
            portalTitle="CRC PORTAL"
            portalSubtitle="Class Coordinator"
            menuItems={menuItems}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            notifications={atRiskStudents.length}
        >
            {/* Class Selector (when multiple classes) */}
            {classes.length > 1 && (
                <Box sx={{ mb: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {classes.map(c => (
                        <Chip key={c.classId} label={c.className}
                            color={selectedClass?.classId === c.classId ? 'primary' : 'default'}
                            variant={selectedClass?.classId === c.classId ? 'filled' : 'outlined'}
                            onClick={() => { setSelectedClass(c); setClassStudents([]); setClassSubjects([]); setAtRiskStudents([]); }}
                            sx={{ fontWeight: 700, borderRadius: 2, px: 1 }}
                        />
                    ))}
                </Box>
            )}

            {/* ═══════ OVERVIEW ═══════ */}
            {activeSection === 'overview' && selectedClass && (
                <Fade in timeout={400}>
                    <Box>
                        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: alpha('#8b5cf6', 0.03) }}>
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                {selectedClass.className}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedClass.department} • Year {selectedClass.yearLevel} • {selectedClass.programType || 'B.Tech'}
                            </Typography>
                        </Paper>

                        <Grid container spacing={2.5} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={3}>
                                <StatsCard title="Students" value={selectedClass.totalStudents} icon={<GroupsIcon />}
                                    color={theme.palette.primary.main} subtitle="enrolled" animationDelay={0} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <StatsCard title="Subjects" value={selectedClass.totalSubjects} icon={<SubjectIcon />}
                                    color={theme.palette.info.main} subtitle="being taught" animationDelay={100} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <StatsCard title="Faculty" value={selectedClass.totalFaculty} icon={<PeopleIcon />}
                                    color={theme.palette.secondary.main} subtitle="teaching" animationDelay={200} />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <StatsCard title="Avg Attendance" value={`${selectedClass.avgAttendance}%`}
                                    icon={<TrendingUpIcon />}
                                    color={theme.palette[getStatusColor(selectedClass.avgAttendance)].main}
                                    subtitle="overall" animationDelay={300} />
                            </Grid>
                        </Grid>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <GroupsIcon color="primary" fontSize="small" />
                                            <Typography variant="subtitle1" fontWeight={700}>Quick Student View</Typography>
                                        </Box>
                                        <Button size="small" onClick={() => setActiveSection('students')} sx={{ fontWeight: 600 }}>View All →</Button>
                                    </Box>
                                    <CardContent sx={{ p: 0 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>
                                            Click "Student Details" in the sidebar to view full student attendance data with search and filtering.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <SubjectIcon color="primary" fontSize="small" />
                                            <Typography variant="subtitle1" fontWeight={700}>Quick Subject View</Typography>
                                        </Box>
                                        <Button size="small" onClick={() => setActiveSection('subjects')} sx={{ fontWeight: 600 }}>View All →</Button>
                                    </Box>
                                    <CardContent sx={{ p: 0 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ p: 2.5 }}>
                                            Click "Subject Analytics" in the sidebar for subject-wise attendance breakdown with faculty info.
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Fade>
            )}

            {/* ═══════ STUDENTS ═══════ */}
            {activeSection === 'students' && selectedClass && (
                <Fade in timeout={400}>
                    <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
                            <Box>
                                <Typography variant="h5" fontWeight={800}>Student Attendance</Typography>
                                <Typography variant="body2" color="text.secondary">{selectedClass.className} — {classStudents.length} students</Typography>
                            </Box>
                            <Box display="flex" gap={1}>
                                <TextField size="small" placeholder="Search by name or roll..." value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="disabled" /></InputAdornment> }}
                                    sx={{ minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                <IconButton onClick={() => loadStudents(selectedClass.classId)} disabled={studentsLoading}><RefreshIcon /></IconButton>
                            </Box>
                        </Box>

                        {studentsLoading ? <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} /> : (
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                <TableContainer sx={{ maxHeight: 600 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Roll No</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Present / Total</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Attendance</TableCell>
                                                <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredStudents.map((s, i) => {
                                                const sc = getStatusColor(s.attendancePercentage);
                                                return (
                                                    <TableRow key={s.studentId} hover>
                                                        <TableCell>{i + 1}</TableCell>
                                                        <TableCell><Typography variant="body2" fontWeight={600}>{s.rollNumber}</Typography></TableCell>
                                                        <TableCell><Typography variant="body2">{s.name}</Typography></TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {s.totalPresent} / {s.totalSessions}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <LinearProgress variant="determinate" value={Math.min(s.attendancePercentage, 100)}
                                                                    color={sc} sx={{ width: 80, height: 6, borderRadius: 3 }} />
                                                                <Typography variant="body2" fontWeight={700} color={`${sc}.main`}>
                                                                    {s.attendancePercentage}%
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={s.status} size="small" color={sc} variant="outlined" sx={{ fontWeight: 600, fontSize: 11 }} />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        )}
                    </Box>
                </Fade>
            )}

            {/* ═══════ SUBJECTS ═══════ */}
            {activeSection === 'subjects' && selectedClass && (
                <Fade in timeout={400}>
                    <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                            <Box>
                                <Typography variant="h5" fontWeight={800}>Subject Analytics</Typography>
                                <Typography variant="body2" color="text.secondary">{selectedClass.className} — {classSubjects.length} subjects</Typography>
                            </Box>
                            <IconButton onClick={() => loadSubjects(selectedClass.classId)} disabled={subjectsLoading}><RefreshIcon /></IconButton>
                        </Box>

                        {subjectsLoading ? <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} /> : (
                            <Grid container spacing={2.5}>
                                {classSubjects.map(sub => {
                                    const sc = getStatusColor(sub.avgAttendance);
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={sub.mappingId}>
                                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'all 0.2s',
                                                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.15)}` } }}>
                                                <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${alpha(theme.palette[sc].main, 0.08)}, ${alpha(theme.palette[sc].main, 0.02)})`,
                                                    borderBottom: '1px solid', borderColor: 'divider' }}>
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        <Avatar sx={{ bgcolor: alpha(theme.palette[sc].main, 0.15), color: `${sc}.main`, width: 44, height: 44 }}>
                                                            <SchoolIcon />
                                                        </Avatar>
                                                        <Box flex={1} overflow="hidden">
                                                            <Typography variant="subtitle1" fontWeight={700} noWrap>{sub.subjectName}</Typography>
                                                            <Chip label={sub.subjectCode} size="small" variant="outlined" />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                <CardContent sx={{ p: 2.5 }}>
                                                    <Box mb={2}>
                                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Avg Attendance</Typography>
                                                            <Typography variant="caption" fontWeight={700} color={`${sc}.main`}>{sub.avgAttendance}%</Typography>
                                                        </Box>
                                                        <LinearProgress variant="determinate" value={Math.min(sub.avgAttendance, 100)} color={sc}
                                                            sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette[sc].main, 0.1) }} />
                                                    </Box>
                                                    <Stack spacing={1}>
                                                        <Box display="flex" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">Faculty</Typography>
                                                            <Typography variant="caption" fontWeight={600}>{sub.facultyName}</Typography>
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">Sessions</Typography>
                                                            <Chip label={sub.totalSessions} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                                                        </Box>
                                                        <Box display="flex" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">Section</Typography>
                                                            <Typography variant="caption" fontWeight={600}>{sub.section || 'All'}</Typography>
                                                        </Box>
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

            {/* ═══════ AT RISK LIST ═══════ */}
            {activeSection === 'atRisk' && selectedClass && (
                <Fade in timeout={400}>
                    <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                            <Box>
                                <Typography variant="h5" fontWeight={800}>At Risk Watchlist</Typography>
                                <Typography variant="body2" color="text.secondary">Students below 75% attendance in {selectedClass.className}</Typography>
                            </Box>
                            <IconButton onClick={() => loadAtRisk(selectedClass.classId)} disabled={atRiskLoading}><RefreshIcon /></IconButton>
                        </Box>

                        {atRiskLoading ? <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} /> :
                            atRiskStudents.length === 0 ? (
                                <Box textAlign="center" py={8}>
                                    <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">No students at risk!</Typography>
                                    <Typography variant="body2" color="text.disabled">All students are above 75% attendance.</Typography>
                                </Box>
                            ) : (
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>#</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Roll No</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Attendance</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>Risk Level</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {atRiskStudents.map((d, i) => (
                                                    <TableRow key={d.studentId} hover sx={{
                                                        bgcolor: alpha(d.status === 'Critical' ? theme.palette.error.main : theme.palette.warning.main, 0.03)
                                                    }}>
                                                        <TableCell>{i + 1}</TableCell>
                                                        <TableCell><Typography variant="body2" fontWeight={600}>{d.rollNumber}</Typography></TableCell>
                                                        <TableCell><Typography variant="body2">{d.name}</Typography></TableCell>
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <LinearProgress variant="determinate" value={Math.min(d.attendancePercentage, 100)}
                                                                    color={d.status === 'Critical' ? 'error' : 'warning'}
                                                                    sx={{ width: 60, height: 6, borderRadius: 3 }} />
                                                                <Typography variant="body2" fontWeight={700}
                                                                    color={d.status === 'Critical' ? 'error.main' : 'warning.main'}>
                                                                    {d.attendancePercentage}%
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={d.status} size="small"
                                                                color={d.status === 'Critical' ? 'error' : 'warning'}
                                                                sx={{ fontWeight: 700, fontSize: 11 }} />
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
        </DashboardLayout>
    );
};

export default CRCDashboard;
