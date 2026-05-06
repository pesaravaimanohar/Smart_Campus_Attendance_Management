import React, { useState, useEffect, useCallback } from "react";
import {
    Typography, Box, Grid, Card, CardContent,
    Avatar, Chip, useTheme, Fade, LinearProgress,
    Table, TableBody, TableRow, TableCell, TableHead, TableContainer,
    Paper, Button, Stack, Divider, Skeleton, TextField, InputAdornment,
    IconButton
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import { useAuth } from "../context/AuthContext";
import {
    BarChart as BarChartIcon, People as PeopleIcon, Class as ClassIcon,
    TrendingUp as TrendingUpIcon, Warning as WarningIcon,
    Assessment as AssessmentIcon, Groups as GroupsIcon,
    CalendarMonth as CalendarIcon, Search as SearchIcon,
    Refresh as RefreshIcon, QrCode2 as QrCodeIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import { getHodDashboard, getHodFacultyList, getHodStudentList } from "../services/api";

const HODDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [activeSection, setActiveSection] = useState('dashboard');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [facultyList, setFacultyList] = useState([]);
    const [facultyLoading, setFacultyLoading] = useState(false);
    const [studentList, setStudentList] = useState([]);
    const [studentLoading, setStudentLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try { setData(await getHodDashboard()); }
        catch (e) { setError(e.response?.data?.message || "Failed to load"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        if (activeSection === 'faculty' && facultyList.length === 0) loadFaculty();
        if (activeSection === 'students' && studentList.length === 0) loadStudents();
    }, [activeSection]);

    const loadFaculty = async () => {
        setFacultyLoading(true);
        try { setFacultyList(await getHodFacultyList()); }
        catch (e) { console.error(e); }
        finally { setFacultyLoading(false); }
    };
    const loadStudents = async () => {
        setStudentLoading(true);
        try { setStudentList(await getHodStudentList()); }
        catch (e) { console.error(e); }
        finally { setStudentLoading(false); }
    };

    if (loading) return <Box p={4}><LinearProgress /></Box>;
    if (error) return <Box p={4}><Typography color="error">{error}</Typography></Box>;
    if (!data) return null;

    const { totalFaculty, totalStudents, avgAttendance, activeSessions, weeklyTrends, defaulters, facultyPerformance } = data;

    const menuItems = [
        { id: 'dashboard', icon: <BarChartIcon />, label: 'Dashboard' },
        { divider: true },
        { label: 'Management', isLabel: true },
        { id: 'faculty', icon: <PeopleIcon />, label: 'Faculty' },
        { id: 'students', icon: <ClassIcon />, label: 'Students' },
        { id: 'analytics', icon: <AssessmentIcon />, label: 'Analytics' },
    ];

    const currentLabel = menuItems.find(m => m.id === activeSection)?.label || 'Dashboard';

    const handleSectionChange = (id) => {
        setActiveSection(id);
    };

    const filteredStudents = studentList.filter(s =>
        !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
        <DashboardLayout title={currentLabel} subtitle={`Department Head • ${user?.department || 'Dept'}`}
            portalIcon={<BarChartIcon />} portalTitle="HOD PANEL" portalSubtitle="Department Head"
            menuItems={menuItems} activeSection={activeSection} onSectionChange={handleSectionChange} notifications={4}>

            {activeSection === 'dashboard' && (
                <Fade in timeout={400}><Box>
                    <Grid container spacing={2.5} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}><StatsCard title="Total Faculty" value={totalFaculty} icon={<PeopleIcon />} color={theme.palette.primary.main} animationDelay={0} /></Grid>
                        <Grid item xs={6} sm={3}><StatsCard title="Total Students" value={totalStudents} icon={<GroupsIcon />} color="#EC407A" animationDelay={1} /></Grid>
                        <Grid item xs={6} sm={3}><StatsCard title="Avg Attendance" value={avgAttendance + '%'} icon={<BarChartIcon />} color={theme.palette.success.main} animationDelay={2} /></Grid>
                        <Grid item xs={6} sm={3}><StatsCard title="Active Sessions" value={activeSessions} icon={<CalendarIcon />} color={theme.palette.warning.main} animationDelay={3} /></Grid>
                    </Grid>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card sx={{ borderRadius: 3, p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', width: 36, height: 36 }}><TrendingUpIcon fontSize="small" /></Avatar>
                                    <Typography variant="h6" fontWeight={700}>Weekly Trends</Typography>
                                </Box>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} domain={[0, 100]} />
                                            <RechartsTooltip />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500}>
                                                {(weeklyTrends || []).map((e, i) => (
                                                    <Cell key={i} fill={e.value < 65 ? theme.palette.error.main : e.value < 75 ? theme.palette.warning.main : theme.palette.primary.main} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.08), color: 'error.main', width: 36, height: 36 }}><WarningIcon fontSize="small" /></Avatar>
                                        <Typography variant="subtitle1" fontWeight={700}>At Risk ({(defaulters||[]).length})</Typography>
                                    </Box>
                                    <Stack spacing={1.5}>
                                        {(defaulters||[]).map((row, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2,
                                                bgcolor: alpha(theme.palette.error.main, 0.03), border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.12) }}>
                                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700, bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' }}>
                                                    {(row.name||'?').charAt(0)}
                                                </Avatar>
                                                <Box flex={1}><Typography variant="body2" fontWeight={600} noWrap>{row.name}</Typography><Typography variant="caption" color="text.secondary">{row.rollNo}</Typography></Box>
                                                <Typography variant="body2" fontWeight={800} color="error.main">{row.val}%</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Faculty Performance</Typography>
                                </Box>
                                <TableContainer><Table>
                                    <TableHead><TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Faculty</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Sessions</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Avg Attendance</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Rating</TableCell>
                                    </TableRow></TableHead>
                                    <TableBody>{(facultyPerformance||[]).map((fac, i) => {
                                        const pc = fac.avg >= 85 ? 'success' : fac.avg >= 70 ? 'warning' : 'error';
                                        return (
                                            <TableRow key={i} hover>
                                                <TableCell><Typography variant="body2" fontWeight={600}>{fac.name}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" color="text.secondary">{fac.subject}</Typography></TableCell>
                                                <TableCell align="center">{fac.sessions}</TableCell>
                                                <TableCell align="center">
                                                    <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                                                        <LinearProgress variant="determinate" value={fac.avg} color={pc} sx={{ width: 80, height: 6, borderRadius: 3 }} />
                                                        <Typography variant="body2" fontWeight={800}>{fac.avg}%</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right"><Chip label={fac.avg >= 85 ? 'Excellent' : fac.avg >= 70 ? 'Good' : 'Review'} size="small" color={pc} sx={{ fontWeight: 700 }} /></TableCell>
                                            </TableRow>
                                        );
                                    })}</TableBody>
                                </Table></TableContainer>
                            </Card>
                        </Grid>
                    </Grid>
                </Box></Fade>
            )}

            {activeSection === 'faculty' && (
                <Fade in timeout={400}><Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                        <Box><Typography variant="h5" fontWeight={800}>Department Faculty</Typography><Typography variant="body2" color="text.secondary">{facultyList.length} members</Typography></Box>
                        <IconButton onClick={loadFaculty} disabled={facultyLoading}><RefreshIcon /></IconButton>
                    </Box>
                    {facultyLoading ? <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} /> : (
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                            <TableContainer><Table>
                                <TableHead><TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell><TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell><TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Sessions</TableCell><TableCell align="center" sx={{ fontWeight: 700 }}>Avg Attendance</TableCell>
                                </TableRow></TableHead>
                                <TableBody>{facultyList.map((f, i) => {
                                    const pc = f.avgAttendance >= 85 ? 'success' : f.avgAttendance >= 70 ? 'warning' : 'error';
                                    return (
                                        <TableRow key={f.id} hover>
                                            <TableCell>{i + 1}</TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={600}>{f.name}</Typography></TableCell>
                                            <TableCell><Typography variant="caption" color="text.secondary">{f.facultyId}</Typography></TableCell>
                                            <TableCell>{f.designation || '—'}</TableCell>
                                            <TableCell align="center"><Chip label={f.totalSessions} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                                            <TableCell align="center">
                                                <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                                                    <LinearProgress variant="determinate" value={f.avgAttendance} color={pc} sx={{ width: 60, height: 6, borderRadius: 3 }} />
                                                    <Typography variant="body2" fontWeight={700}>{f.avgAttendance}%</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}</TableBody>
                            </Table></TableContainer>
                        </Card>
                    )}
                </Box></Fade>
            )}

            {activeSection === 'students' && (
                <Fade in timeout={400}><Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
                        <Box><Typography variant="h5" fontWeight={800}>Department Students</Typography><Typography variant="body2" color="text.secondary">{studentList.length} students</Typography></Box>
                        <Box display="flex" gap={1}>
                            <TextField size="small" placeholder="Search..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="disabled" /></InputAdornment> }}
                                sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <IconButton onClick={loadStudents} disabled={studentLoading}><RefreshIcon /></IconButton>
                        </Box>
                    </Box>
                    {studentLoading ? <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} /> : (
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                            <TableContainer sx={{ maxHeight: 600 }}><Table stickyHeader size="small">
                                <TableHead><TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell><TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell><TableCell sx={{ fontWeight: 700 }}>Sem</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Attendance</TableCell><TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                </TableRow></TableHead>
                                <TableBody>{filteredStudents.map((s, i) => {
                                    const sc = s.attendancePercentage >= 75 ? 'success' : s.attendancePercentage >= 65 ? 'warning' : 'error';
                                    return (
                                        <TableRow key={s.id} hover>
                                            <TableCell>{i + 1}</TableCell>
                                            <TableCell><Typography variant="body2" fontWeight={600}>{s.rollNumber}</Typography></TableCell>
                                            <TableCell>{s.name}</TableCell>
                                            <TableCell>{s.semester || '—'}</TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <LinearProgress variant="determinate" value={Math.min(s.attendancePercentage, 100)} color={sc} sx={{ width: 60, height: 6, borderRadius: 3 }} />
                                                    <Typography variant="body2" fontWeight={700} color={`${sc}.main`}>{s.attendancePercentage}%</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell><Chip label={s.status} size="small" color={sc} variant="outlined" sx={{ fontWeight: 600, fontSize: 11 }} /></TableCell>
                                        </TableRow>
                                    );
                                })}</TableBody>
                            </Table></TableContainer>
                        </Card>
                    )}
                </Box></Fade>
            )}

            {activeSection === 'analytics' && (
                <Fade in timeout={400}><Box>
                    <Typography variant="h5" fontWeight={800} gutterBottom>Department Analytics</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Faculty Workload</Typography>
                                </Box>
                                <Box sx={{ height: 300, p: 3 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={facultyPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} />
                                            <RechartsTooltip />
                                            <Bar dataKey="sessions" fill={theme.palette.info.main} radius={[4, 4, 0, 0]} barSize={30} name="Sessions" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Summary</Typography>
                                <Stack spacing={2}>
                                    <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Total Faculty</Typography><Typography fontWeight={700}>{totalFaculty}</Typography></Box>
                                    <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Total Students</Typography><Typography fontWeight={700}>{totalStudents}</Typography></Box>
                                    <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Avg Attendance</Typography><Typography fontWeight={700} color={avgAttendance >= 75 ? 'success.main' : 'warning.main'}>{avgAttendance}%</Typography></Box>
                                    <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">At Risk Students</Typography><Typography fontWeight={700} color="error.main">{(defaulters||[]).length}</Typography></Box>
                                </Stack>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Quick Actions</Typography>
                                <Stack spacing={1.5}>
                                    <Button variant="outlined" fullWidth sx={{ borderRadius: 2, fontWeight: 600 }} onClick={() => setActiveSection('faculty')}>View Faculty</Button>
                                    <Button variant="outlined" fullWidth sx={{ borderRadius: 2, fontWeight: 600 }} onClick={() => setActiveSection('students')}>View Students</Button>
                                </Stack>
                            </Card>
                        </Grid>
                    </Grid>
                </Box></Fade>
            )}
        </DashboardLayout>
    );
};

export default HODDashboard;
