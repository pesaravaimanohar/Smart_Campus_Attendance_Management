import React, { useState, useEffect, useCallback } from "react";
import {
    Typography, Box, Grid, Card, CardContent, Button, Avatar, Tooltip,
    useTheme, Fade, Chip, LinearProgress, Stack, Divider, Paper,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    IconButton
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
    Timeline as TimelineIcon,
    Apartment as ApartmentIcon,
    Dashboard as DashboardIcon,
    Business as BusinessIcon,
    Assignment as AssignmentIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    School as SchoolIcon,
    People as PeopleIcon,
    Groups as GroupsIcon,
    CalendarMonth as CalendarIcon,
    EmojiEvents as TrophyIcon,
    QrCode2 as QrCodeIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import { getPrincipalDashboard } from "../services/api";

const PrincipalDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [activeSection, setActiveSection] = useState('overview');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPrincipalDashboard();
            setData(res);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) return <Box p={4}><LinearProgress /></Box>;
    if (error) return <Box p={4}><Typography color="error">{error}</Typography></Box>;
    if (!data) return null;

    const { 
        collegeAttendance, activeSessions, facultyPresent, totalFaculty, 
        criticalAlerts, weeklyTrends, departments, topPerformers, recentAlerts = [] 
    } = data;

    const menuItems = [
        { id: 'overview', icon: <DashboardIcon />, label: 'Overview' },
        { divider: true },
        { label: 'Administration', isLabel: true },
        { id: 'departments', icon: <BusinessIcon />, label: 'Departments' },
        { id: 'reports', icon: <AssignmentIcon />, label: 'Reports' },
    ];

    const handleSectionChange = (id) => {
        setActiveSection(id);
    };

    const currentLabel = menuItems.find(m => m.id === activeSection)?.label || 'Overview';

    // Custom Tooltip for AreaChart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: theme.shadows[8], bgcolor: alpha(theme.palette.background.paper, 0.9) }}>
                    <Typography variant="subtitle2" fontWeight={800}>{label}</Typography>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="body2" color="secondary.main" fontWeight={700}>
                        Attendance: {payload[0].value}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Overall college performance
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <DashboardLayout
            title={currentLabel}
            subtitle={`Executive Dashboard • ${user?.collegeName || 'JNTUA College of Engineering'}`}
            portalIcon={<TimelineIcon />}
            portalTitle="PRINCIPAL"
            portalSubtitle="College Administration"
            menuItems={menuItems}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            notifications={criticalAlerts}
        >
            {activeSection === 'overview' && (
                <Fade in timeout={400}>
                    <Box>
                        {/* KPI Cards */}
                        <Grid container spacing={2.5} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="College Attendance"
                                    value={collegeAttendance + "%"}
                                    icon={<TimelineIcon />}
                                    color={theme.palette.primary.main}
                                    trend="+2.5% vs last week"
                                    animationDelay={0}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Active Sessions"
                                    value={activeSessions}
                                    icon={<CalendarIcon />}
                                    color={theme.palette.info.main}
                                    subtitle="running right now"
                                    variant="gradient"
                                    animationDelay={1}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Faculty Presence"
                                    value={`${facultyPresent}/${totalFaculty}`}
                                    icon={<SchoolIcon />}
                                    color={theme.palette.success.main}
                                    trend={`${Math.round((facultyPresent/totalFaculty)*100)}% active`}
                                    animationDelay={2}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Critical Alerts"
                                    value={criticalAlerts}
                                    icon={<WarningIcon />}
                                    color={theme.palette.error.main}
                                    subtitle="require attention"
                                    animationDelay={3}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={3}>
                            {/* College Attendance Trends */}
                            <Grid item xs={12} md={8}>
                                <Card sx={{ borderRadius: 3, p: 3, height: '100%', border: '1px solid', borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar sx={{
                                                bgcolor: alpha(theme.palette.secondary.main, isDark ? 0.15 : 0.08),
                                                color: 'secondary.main',
                                                width: 36, height: 36,
                                            }}>
                                                <TrendingUpIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} color="text.primary">College Attendance Analytics</Typography>
                                                <Typography variant="caption" color="text.secondary">7-day performance trajectory</Typography>
                                            </Box>
                                        </Box>
                                        <Button size="small" variant="contained" color="secondary" sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>Download Report</Button>
                                    </Box>

                                    <Box sx={{ height: 300, mt: 2 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                                <XAxis 
                                                    dataKey="day" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 12, fontWeight: 600, fill: theme.palette.text.secondary }}
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fontSize: 12, fontWeight: 600, fill: theme.palette.text.secondary }}
                                                    domain={[0, 100]}
                                                />
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="value" 
                                                    stroke={theme.palette.secondary.main} 
                                                    strokeWidth={4}
                                                    fillOpacity={1} 
                                                    fill="url(#colorValue)" 
                                                    animationDuration={2000}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Card>
                            </Grid>

                            {/* Department Performance Summary */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{ borderRadius: 3, p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                                        <Avatar sx={{
                                            bgcolor: alpha(theme.palette.info.main, isDark ? 0.15 : 0.08),
                                            color: 'info.main',
                                            width: 36, height: 36,
                                        }}>
                                            <BusinessIcon fontSize="small" />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight={800} color="text.primary">Dept. Performance</Typography>
                                            <Typography variant="caption" color="text.secondary">Cross-departmental audit</Typography>
                                        </Box>
                                    </Box>

                                    <Stack spacing={3}>
                                        {departments.map((dept, i) => {
                                            const perfColor = dept.avg >= 85 ? 'success' : dept.avg >= 70 ? 'warning' : 'error';
                                            return (
                                                <Box key={i} component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={800} color="text.primary">{dept.code}</Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 120 }}>{dept.name}</Typography>
                                                        </Box>
                                                        <Box textAlign="right">
                                                            <Typography variant="body2" fontWeight={900} color={`${perfColor}.main`}>{dept.avg}%</Typography>
                                                            <Typography variant="caption" color={dept.trend.startsWith('+') ? 'success.main' : 'error.main'} sx={{ fontWeight: 700 }}>
                                                                {dept.trend}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={dept.avg}
                                                        color={perfColor}
                                                        sx={{
                                                            height: 8,
                                                            borderRadius: 4,
                                                            bgcolor: alpha(theme.palette.text.disabled, 0.1),
                                                        }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </Stack>

                                    <Button fullWidth variant="outlined" sx={{ mt: 4, borderRadius: 2, fontWeight: 700, borderColor: 'divider' }}>View All Departments</Button>
                                </Card>
                            </Grid>

                            {/* Recent Alerts */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar sx={{
                                                bgcolor: alpha(theme.palette.error.main, isDark ? 0.15 : 0.08),
                                                color: 'error.main',
                                                width: 36, height: 36,
                                            }}>
                                                <WarningIcon fontSize="small" />
                                            </Avatar>
                                            <Typography variant="subtitle1" fontWeight={800} color="text.primary">Critical System Alerts</Typography>
                                        </Box>
                                    </Box>
                                    <Stack divider={<Divider />}>
                                        {recentAlerts.length > 0 ? recentAlerts.map((alert, i) => (
                                            <Box
                                                key={i}
                                                sx={{
                                                    p: 2, display: 'flex', gap: 2, alignItems: 'flex-start',
                                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.03) },
                                                }}
                                            >
                                                <Box sx={{
                                                    width: 10, height: 10, borderRadius: '50%', mt: 0.8,
                                                    bgcolor: alert.severity === 'error' ? 'error.main' : 'warning.main',
                                                    boxShadow: `0 0 10px ${alert.severity === 'error' ? theme.palette.error.main : theme.palette.warning.main}`
                                                }} />
                                                <Box flex={1}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                        <Chip label={alert.dept} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} color="error" variant="outlined" />
                                                        <Typography variant="caption" color="text.disabled">{alert.time}</Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="text.primary" fontWeight={500}>{alert.msg}</Typography>
                                                </Box>
                                            </Box>
                                        )) : (
                                            <Box p={4} textAlign="center">
                                                <Typography variant="body2" color="text.disabled">No critical alerts at this time.</Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </Card>
                            </Grid>

                            {/* Top Performers */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar sx={{
                                                bgcolor: alpha(theme.palette.success.main, isDark ? 0.15 : 0.08),
                                                color: 'success.main',
                                                width: 36, height: 36,
                                            }}>
                                                <TrophyIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={800} color="text.primary">Top Faculty Performers</Typography>
                                                <Typography variant="caption" color="text.secondary">Excellence in student engagement</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Stack divider={<Divider />}>
                                        {topPerformers.map((fac, i) => (
                                            <Box
                                                key={i}
                                                sx={{
                                                    p: 2, display: 'flex', alignItems: 'center', gap: 2,
                                                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.03) },
                                                }}
                                            >
                                                <Avatar sx={{
                                                    width: 40, height: 40, fontWeight: 900,
                                                    bgcolor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32',
                                                    color: '#fff',
                                                    fontSize: '1.2rem',
                                                    boxShadow: theme.shadows[2]
                                                }}>
                                                    {i + 1}
                                                </Avatar>
                                                <Box flex={1}>
                                                    <Typography variant="body2" fontWeight={800} color="text.primary">{fac.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{fac.dept} Department</Typography>
                                                </Box>
                                                <Box textAlign="right">
                                                    <Typography variant="h6" fontWeight={900} color="success.main">{fac.avg}%</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Avg. Attendance</Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Fade>
            )}

            {activeSection === 'departments' && (
                <Fade in timeout={400}><Box>
                    <Typography variant="h5" fontWeight={800} gutterBottom>Department Overview</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Attendance performance across all departments</Typography>
                    <Grid container spacing={2.5}>
                        {(departments || []).map((dept, i) => {
                            const sc = dept.avg >= 75 ? 'success' : dept.avg >= 65 ? 'warning' : 'error';
                            return (
                                <Grid item xs={12} sm={6} md={4} key={i}>
                                    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'all 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.12)}` } }}>
                                        <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${alpha(theme.palette[sc].main, 0.08)}, transparent)`,
                                            borderBottom: '1px solid', borderColor: 'divider' }}>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Avatar sx={{ bgcolor: alpha(theme.palette[sc].main, 0.15), color: `${sc}.main`, width: 44, height: 44 }}>
                                                    <BusinessIcon />
                                                </Avatar>
                                                <Box flex={1}>
                                                    <Typography variant="subtitle1" fontWeight={700}>{dept.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{dept.code}</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Box mb={2}>
                                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                    <Typography variant="caption" color="text.secondary">Avg Attendance</Typography>
                                                    <Typography variant="caption" fontWeight={700} color={`${sc}.main`}>{dept.avg}%</Typography>
                                                </Box>
                                                <LinearProgress variant="determinate" value={Math.min(dept.avg, 100)} color={sc}
                                                    sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette[sc].main, 0.1) }} />
                                            </Box>
                                            <Stack spacing={1}>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Students</Typography>
                                                    <Typography variant="caption" fontWeight={600}>{dept.students || 0}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Faculty</Typography>
                                                    <Typography variant="caption" fontWeight={600}>{dept.faculty || 0}</Typography>
                                                </Box>
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="caption" color="text.secondary">Sessions</Typography>
                                                    <Chip label={dept.sessions || 0} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box></Fade>
            )}

            {activeSection === 'reports' && (
                <Fade in timeout={400}><Box>
                    <Typography variant="h5" fontWeight={800} gutterBottom>College Reports</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Summary and comparative analysis</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Department Comparison</Typography>
                                </Box>
                                <TableContainer><Table>
                                    <TableHead><TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Students</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Faculty</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Sessions</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700 }}>Avg Attendance</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                                    </TableRow></TableHead>
                                    <TableBody>{(departments || []).map((dept, i) => {
                                        const sc = dept.avg >= 75 ? 'success' : dept.avg >= 65 ? 'warning' : 'error';
                                        return (
                                            <TableRow key={i} hover>
                                                <TableCell><Typography variant="body2" fontWeight={600}>{dept.name}</Typography></TableCell>
                                                <TableCell align="center">{dept.students || 0}</TableCell>
                                                <TableCell align="center">{dept.faculty || 0}</TableCell>
                                                <TableCell align="center">{dept.sessions || 0}</TableCell>
                                                <TableCell align="center">
                                                    <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                                                        <LinearProgress variant="determinate" value={Math.min(dept.avg, 100)} color={sc} sx={{ width: 60, height: 6, borderRadius: 3 }} />
                                                        <Typography variant="body2" fontWeight={700} color={`${sc}.main`}>{dept.avg}%</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip label={dept.avg >= 75 ? 'Good' : dept.avg >= 65 ? 'Warning' : 'Critical'} size="small" color={sc} sx={{ fontWeight: 700 }} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}</TableBody>
                                </Table></TableContainer>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>College Summary</Typography>
                                <Stack spacing={2}>
                                    <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">College Attendance</Typography><Typography fontWeight={700} color={collegeAttendance >= 75 ? 'success.main' : 'warning.main'}>{collegeAttendance}%</Typography></Box>
                                    <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Total Faculty</Typography><Typography fontWeight={700}>{totalFaculty}</Typography></Box>
                                    <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Active Sessions</Typography><Typography fontWeight={700}>{activeSessions}</Typography></Box>
                                    <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Critical Alerts</Typography><Typography fontWeight={700} color="error.main">{criticalAlerts}</Typography></Box>
                                </Stack>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Quick Actions</Typography>
                                <Stack spacing={1.5}>
                                    <Button variant="outlined" fullWidth sx={{ borderRadius: 2, fontWeight: 600 }} onClick={() => setActiveSection('departments')}>View Departments</Button>
                                    <Button variant="outlined" fullWidth sx={{ borderRadius: 2, fontWeight: 600 }} onClick={() => setActiveSection('overview')}>Back to Overview</Button>
                                </Stack>
                            </Card>
                        </Grid>
                    </Grid>
                </Box></Fade>
            )}
        </DashboardLayout>
    );
};

export default PrincipalDashboard;
