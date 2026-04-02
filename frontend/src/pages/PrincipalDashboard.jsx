import React, { useState } from "react";
import {
    Typography, Box, Grid, Card, CardContent, Button, Avatar, Tooltip,
    useTheme, Fade, Chip, LinearProgress, Stack, Divider, Paper,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';

const PrincipalDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [activeSection, setActiveSection] = useState('overview');

    // College-wide data
    const dailyData = [
        { day: 'Mon', value: 78, students: 1240 },
        { day: 'Tue', value: 85, students: 1350 },
        { day: 'Wed', value: 82, students: 1310 },
        { day: 'Thu', value: 88, students: 1400 },
        { day: 'Fri', value: 75, students: 1200 },
        { day: 'Sat', value: 60, students: 960 },
    ];

    const departments = [
        { name: 'Computer Science', code: 'CSE', students: 320, faculty: 14, avg: 85, trend: '+3%', color: theme.palette.success.main },
        { name: 'Electronics & Comm.', code: 'ECE', students: 280, faculty: 12, avg: 72, trend: '-1%', color: theme.palette.warning.main },
        { name: 'Mechanical', code: 'MECH', students: 250, faculty: 11, avg: 65, trend: '-4%', color: theme.palette.error.main },
        { name: 'Civil', code: 'CIVIL', students: 200, faculty: 9, avg: 78, trend: '+1%', color: theme.palette.info.main },
        { name: 'Electrical', code: 'EEE', students: 180, faculty: 8, avg: 80, trend: '+2%', color: theme.palette.primary.main },
    ];

    const recentAlerts = [
        { dept: 'MECH', msg: '3 faculty below 60% avg attendance in their classes', severity: 'error', time: '2h ago' },
        { dept: 'ECE', msg: '15 students in critical defaulter zone', severity: 'warning', time: '4h ago' },
        { dept: 'CSE', msg: 'All targets met — 85% average achieved', severity: 'success', time: '1d ago' },
    ];

    const topPerformers = [
        { name: 'Dr. Ramesh K', dept: 'CSE', avg: 92 },
        { name: 'Prof. Sunitha M', dept: 'ECE', avg: 89 },
        { name: 'Dr. Venkat R', dept: 'EEE', avg: 87 },
    ];

    const menuItems = [
        { id: 'overview', icon: <DashboardIcon />, label: 'Overview' },
        { divider: true },
        { label: 'Administration', isLabel: true },
        { id: 'departments', icon: <BusinessIcon />, label: 'Departments' },
        { id: 'reports', icon: <AssignmentIcon />, label: 'Reports' },
    ];

    const currentLabel = menuItems.find(m => m.id === activeSection)?.label || 'Overview';

    return (
        <DashboardLayout
            title={currentLabel}
            subtitle="Executive Dashboard"
            portalIcon={<ApartmentIcon />}
            portalTitle="PRINCIPAL"
            portalSubtitle="Executive View"
            menuItems={menuItems}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
        >
            {activeSection === 'overview' && (
                <Fade in timeout={400}>
                    <Box>
                        {/* KPI Cards */}
                        <Grid container spacing={2.5} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="College Attendance"
                                    value="78%"
                                    icon={<TimelineIcon />}
                                    color={theme.palette.primary.main}
                                    trend="+2.5% vs last week"
                                    animationDelay={0}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Active Sessions"
                                    value="15"
                                    icon={<CalendarIcon />}
                                    color={theme.palette.info.main}
                                    subtitle="running right now"
                                    variant="gradient"
                                    animationDelay={1}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Faculty Present"
                                    value="45/50"
                                    icon={<SchoolIcon />}
                                    color={theme.palette.success.main}
                                    trend="90% attendance"
                                    animationDelay={2}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Critical Alerts"
                                    value="2"
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
                                <Card sx={{ borderRadius: 3, p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar sx={{
                                                bgcolor: alpha(theme.palette.secondary.main, isDark ? 0.15 : 0.08),
                                                color: 'secondary.main',
                                                width: 36, height: 36,
                                            }}>
                                                <TimelineIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight={700} color="text.primary">College Attendance Trends</Typography>
                                                <Typography variant="caption" color="text.secondary">This week's daily overview</Typography>
                                            </Box>
                                        </Box>
                                        <Button size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>Full Report</Button>
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'space-around',
                                        height: 280,
                                        px: 2,
                                        pt: 2,
                                        pb: 1,
                                        bgcolor: alpha(theme.palette.background.default, isDark ? 0.3 : 0.5),
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}>
                                        {dailyData.map((item, i) => (
                                            <Box key={i} display="flex" flexDirection="column" alignItems="center" width="14%">
                                                <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.5}>
                                                    {item.value}%
                                                </Typography>
                                                <Tooltip title={`${item.value}% — ${item.students} students`}>
                                                    <Box
                                                        sx={{
                                                            width: '65%',
                                                            height: `${(item.value / 100) * 220}px`,
                                                            background: `linear-gradient(180deg, ${alpha(theme.palette.secondary.light, 0.7)}, ${theme.palette.secondary.main})`,
                                                            borderRadius: '8px 8px 0 0',
                                                            cursor: 'pointer',
                                                            animation: `growUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s both`,
                                                            '@keyframes growUp': {
                                                                from: { height: 0, opacity: 0 },
                                                                to: { height: `${(item.value / 100) * 220}px`, opacity: 1 },
                                                            },
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                transform: 'scaleY(1.05)',
                                                                boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.4)}`,
                                                            },
                                                        }}
                                                    />
                                                </Tooltip>
                                                <Typography variant="caption" sx={{ mt: 1, fontWeight: 700, color: 'text.secondary' }}>
                                                    {item.day}
                                                </Typography>
                                            </Box>
                                        ))}
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
                                            <Typography variant="h6" fontWeight={700} color="text.primary">Dept. Performance</Typography>
                                            <Typography variant="caption" color="text.secondary">{departments.length} departments</Typography>
                                        </Box>
                                    </Box>

                                    <Stack spacing={2.5}>
                                        {departments.map((dept, i) => {
                                            const perfColor = dept.avg >= 80 ? 'success' : dept.avg >= 70 ? 'warning' : 'error';
                                            return (
                                                <Box key={i} sx={{
                                                    animation: `fadeIn 0.3s ease-out ${i * 0.06}s both`,
                                                    '@keyframes fadeIn': {
                                                        from: { opacity: 0 },
                                                        to: { opacity: 1 },
                                                    },
                                                }}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Typography variant="body2" fontWeight={700} color="text.primary">{dept.code}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{dept.name}</Typography>
                                                        </Box>
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <Typography variant="body2" fontWeight={700} color={`${perfColor}.main`}>
                                                                {dept.avg}%
                                                            </Typography>
                                                            <Chip
                                                                label={dept.trend}
                                                                size="small"
                                                                sx={{
                                                                    height: 18, fontSize: '0.6rem', fontWeight: 700,
                                                                    bgcolor: alpha(dept.color, isDark ? 0.12 : 0.06),
                                                                    color: dept.trend.startsWith('+') ? 'success.main' : 'error.main',
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={dept.avg}
                                                        color={perfColor}
                                                        sx={{
                                                            height: 6,
                                                            borderRadius: 3,
                                                            bgcolor: alpha(dept.color, isDark ? 0.1 : 0.06),
                                                        }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Card>
                            </Grid>

                            {/* Recent Alerts */}
                            <Grid item xs={12} md={6}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar sx={{
                                                bgcolor: alpha(theme.palette.warning.main, isDark ? 0.15 : 0.08),
                                                color: 'warning.main',
                                                width: 36, height: 36,
                                            }}>
                                                <WarningIcon fontSize="small" />
                                            </Avatar>
                                            <Typography variant="subtitle1" fontWeight={700} color="text.primary">Recent Alerts</Typography>
                                        </Box>
                                    </Box>
                                    <Stack divider={<Divider />}>
                                        {recentAlerts.map((alert, i) => (
                                            <Box
                                                key={i}
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    gap: 1.5,
                                                    alignItems: 'flex-start',
                                                    transition: 'background-color 0.2s ease',
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.text.primary, 0.02),
                                                    },
                                                }}
                                            >
                                                <Box sx={{
                                                    width: 8, height: 8,
                                                    borderRadius: '50%',
                                                    mt: 0.8,
                                                    flexShrink: 0,
                                                    bgcolor: alert.severity === 'error'
                                                        ? 'error.main'
                                                        : alert.severity === 'warning'
                                                            ? 'warning.main'
                                                            : 'success.main',
                                                }} />
                                                <Box flex={1}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                        <Chip label={alert.dept} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                                        <Typography variant="caption" color="text.disabled">{alert.time}</Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary">{alert.msg}</Typography>
                                                </Box>
                                            </Box>
                                        ))}
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
                                                <Typography variant="subtitle1" fontWeight={700} color="text.primary">Top Faculty Performers</Typography>
                                                <Typography variant="caption" color="text.secondary">Highest avg attendance in classes</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Stack divider={<Divider />}>
                                        {topPerformers.map((fac, i) => (
                                            <Box
                                                key={i}
                                                sx={{
                                                    p: 2, display: 'flex', alignItems: 'center', gap: 2,
                                                    transition: 'background-color 0.2s ease',
                                                    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.02) },
                                                }}
                                            >
                                                <Avatar sx={{
                                                    width: 40, height: 40, fontWeight: 800,
                                                    bgcolor: i === 0
                                                        ? alpha('#FFD700', isDark ? 0.15 : 0.1)
                                                        : i === 1
                                                            ? alpha('#C0C0C0', isDark ? 0.15 : 0.1)
                                                            : alpha('#CD7F32', isDark ? 0.15 : 0.1),
                                                    color: i === 0 ? '#FFD700' : i === 1 ? '#9CA3AF' : '#CD7F32',
                                                    fontSize: '1.1rem',
                                                }}>
                                                    {i + 1}
                                                </Avatar>
                                                <Box flex={1}>
                                                    <Typography variant="body2" fontWeight={700} color="text.primary">{fac.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{fac.dept} Department</Typography>
                                                </Box>
                                                <Box textAlign="right">
                                                    <Typography variant="h6" fontWeight={800} color="success.main">{fac.avg}%</Typography>
                                                    <Typography variant="caption" color="text.secondary">avg attendance</Typography>
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

            {activeSection !== 'overview' && (
                <Fade in timeout={400}>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" flexDirection="column">
                        <Box sx={{
                            width: 120, height: 120,
                            bgcolor: alpha(theme.palette.text.primary, 0.04),
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mb: 3,
                        }}>
                            <DashboardIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                        </Box>
                        <Typography variant="h5" color="text.secondary" fontWeight={700}>{currentLabel}</Typography>
                        <Typography color="text.disabled" sx={{ mt: 1 }}>This section is under development.</Typography>
                    </Box>
                </Fade>
            )}
        </DashboardLayout>
    );
};

export default PrincipalDashboard;
