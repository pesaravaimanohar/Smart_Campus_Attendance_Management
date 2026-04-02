import React, { useState, useEffect, useCallback } from "react";
import {
    Typography, Box, Grid, Card, CardContent, Select, MenuItem,
    Avatar, Chip, Tooltip, useTheme, Fade, LinearProgress,
    Table, TableBody, TableRow, TableCell, TableHead, TableContainer,
    Paper, Button, Stack, Divider
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import {
    BarChart as BarChartIcon,
    People as PeopleIcon,
    Class as ClassIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon,
    School as SchoolIcon,
    Assessment as AssessmentIcon,
    Groups as GroupsIcon,
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';

const HODDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [activeSection, setActiveSection] = useState('dashboard');

    // Stats — these come from mock for now (will be API-driven later)
    const stats = {
        totalFaculty: 12,
        totalStudents: 145,
        avgAttendance: 82.5,
        activeSessions: 3,
    };

    const weeklyData = [
        { day: 'Mon', value: 78, classes: 24 },
        { day: 'Tue', value: 85, classes: 26 },
        { day: 'Wed', value: 72, classes: 22 },
        { day: 'Thu', value: 88, classes: 28 },
        { day: 'Fri', value: 65, classes: 20 },
        { day: 'Sat', value: 45, classes: 12 },
    ];

    const defaulters = [
        { name: "Ravi Kumar", rollNo: "21001A0501", status: "Critical", val: 48.5 },
        { name: "Priya Sharma", rollNo: "21001A0512", status: "Warning", val: 62.1 },
        { name: "Ankit Reddy", rollNo: "21001A0503", status: "Critical", val: 45.0 },
        { name: "Sneha Patel", rollNo: "21001A0520", status: "Warning", val: 64.2 },
        { name: "Mohammed Ali", rollNo: "21001A0508", status: "Critical", val: 51.8 },
    ];

    const facultyPerformance = [
        { name: 'Dr. Ramesh K', subject: 'Data Structures', avg: 88, sessions: 42 },
        { name: 'Prof. Sunitha M', subject: 'DBMS', avg: 76, sessions: 38 },
        { name: 'Dr. Venkat R', subject: 'OS', avg: 82, sessions: 40 },
        { name: 'Prof. Lakshmi N', subject: 'CN', avg: 69, sessions: 35 },
    ];

    const maxBarValue = Math.max(...weeklyData.map(d => d.value));

    const menuItems = [
        { id: 'dashboard', icon: <BarChartIcon />, label: 'Dashboard' },
        { divider: true },
        { label: 'Management', isLabel: true },
        { id: 'faculty', icon: <PeopleIcon />, label: 'Faculty' },
        { id: 'students', icon: <ClassIcon />, label: 'Students' },
        { id: 'analytics', icon: <AssessmentIcon />, label: 'Analytics' },
    ];

    const currentLabel = menuItems.find(m => m.id === activeSection)?.label || 'Dashboard';

    return (
        <DashboardLayout
            title={currentLabel}
            subtitle="Department Head • CSE"
            portalIcon={<BarChartIcon />}
            portalTitle="HOD PANEL"
            portalSubtitle="Department Head"
            menuItems={menuItems}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            notifications={4}
        >
            {activeSection === 'dashboard' && (
                <Fade in timeout={400}>
                    <Box>
                        {/* Stats Row */}
                        <Grid container spacing={2.5} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Total Faculty"
                                    value={stats.totalFaculty}
                                    icon={<PeopleIcon />}
                                    color={theme.palette.primary.main}
                                    trend="+2 this sem"
                                    animationDelay={0}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Total Students"
                                    value={stats.totalStudents}
                                    icon={<GroupsIcon />}
                                    color="#EC407A"
                                    trend="+8 new enrollments"
                                    animationDelay={1}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Avg Attendance"
                                    value={stats.avgAttendance + '%'}
                                    icon={<BarChartIcon />}
                                    color={theme.palette.success.main}
                                    trend="+5% this week"
                                    animationDelay={2}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Active Sessions"
                                    value={stats.activeSessions}
                                    icon={<CalendarIcon />}
                                    color={theme.palette.warning.main}
                                    subtitle="running now"
                                    variant="gradient"
                                    animationDelay={3}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={3}>
                            {/* Weekly Attendance Chart */}
                            <Grid item xs={12} md={8}>
                                <Card sx={{ borderRadius: 3, p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar sx={{
                                                bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
                                                color: 'primary.main',
                                                width: 36, height: 36,
                                            }}>
                                                <BarChartIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight={700} color="text.primary">Attendance Trends</Typography>
                                                <Typography variant="caption" color="text.secondary">Weekly overview</Typography>
                                            </Box>
                                        </Box>
                                        <Select
                                            size="small"
                                            defaultValue="week"
                                            sx={{
                                                minWidth: 120, borderRadius: 2,
                                                bgcolor: alpha(theme.palette.background.default, 0.5),
                                            }}
                                        >
                                            <MenuItem value="week">This Week</MenuItem>
                                            <MenuItem value="month">This Month</MenuItem>
                                        </Select>
                                    </Box>

                                    {/* CSS Bar Chart */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'space-around',
                                        height: 260,
                                        px: 2,
                                        pt: 2,
                                        pb: 1,
                                        bgcolor: alpha(theme.palette.background.default, isDark ? 0.3 : 0.5),
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}>
                                        {weeklyData.map((item, i) => (
                                            <Box key={i} display="flex" flexDirection="column" alignItems="center" width="12%">
                                                <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.5}>
                                                    {item.value}%
                                                </Typography>
                                                <Tooltip title={`${item.value}% — ${item.classes} classes`}>
                                                    <Box
                                                        sx={{
                                                            width: '70%',
                                                            height: `${(item.value / 100) * 200}px`,
                                                            background: item.value < 60
                                                                ? `linear-gradient(180deg, ${alpha(theme.palette.error.main, 0.7)}, ${theme.palette.error.main})`
                                                                : item.value < 75
                                                                    ? `linear-gradient(180deg, ${alpha(theme.palette.warning.main, 0.7)}, ${theme.palette.warning.main})`
                                                                    : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.6)}, ${theme.palette.primary.main})`,
                                                            borderRadius: '8px 8px 0 0',
                                                            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                            animation: `growUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.1}s both`,
                                                            '@keyframes growUp': {
                                                                from: { height: 0, opacity: 0 },
                                                                to: { height: `${(item.value / 100) * 200}px`, opacity: 1 },
                                                            },
                                                            cursor: 'pointer',
                                                            '&:hover': {
                                                                transform: 'scaleY(1.05)',
                                                                filter: 'brightness(1.1)',
                                                            },
                                                        }}
                                                    />
                                                </Tooltip>
                                                <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary', fontWeight: 700 }}>
                                                    {item.day}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    {/* Legend */}
                                    <Stack direction="row" gap={2} mt={2} justifyContent="center">
                                        {[
                                            { label: '< 60% Critical', color: theme.palette.error.main },
                                            { label: '60-75% Warning', color: theme.palette.warning.main },
                                            { label: '> 75% Good', color: theme.palette.primary.main },
                                        ].map(l => (
                                            <Box key={l.label} display="flex" alignItems="center" gap={0.5}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: l.color }} />
                                                <Typography variant="caption" color="text.secondary">{l.label}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Card>
                            </Grid>

                            {/* Defaulters Watchlist */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{ borderRadius: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <Avatar sx={{
                                                bgcolor: alpha(theme.palette.error.main, isDark ? 0.15 : 0.08),
                                                color: 'error.main',
                                                width: 36, height: 36,
                                            }}>
                                                <WarningIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                                    Defaulters Watchlist
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">{defaulters.length} students below threshold</Typography>
                                            </Box>
                                        </Box>

                                        <Stack spacing={1.5}>
                                            {defaulters.map((row, idx) => (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: alpha(
                                                            row.status === 'Critical' ? theme.palette.error.main : theme.palette.warning.main,
                                                            isDark ? 0.06 : 0.03
                                                        ),
                                                        border: '1px solid',
                                                        borderColor: alpha(
                                                            row.status === 'Critical' ? theme.palette.error.main : theme.palette.warning.main,
                                                            0.15
                                                        ),
                                                        transition: 'all 0.2s ease',
                                                        animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`,
                                                        '@keyframes fadeIn': {
                                                            from: { opacity: 0, transform: 'translateX(8px)' },
                                                            to: { opacity: 1, transform: 'translateX(0)' },
                                                        },
                                                        '&:hover': {
                                                            bgcolor: alpha(
                                                                row.status === 'Critical' ? theme.palette.error.main : theme.palette.warning.main,
                                                                isDark ? 0.1 : 0.06
                                                            ),
                                                        },
                                                    }}
                                                >
                                                    <Avatar sx={{
                                                        width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700,
                                                        bgcolor: alpha(
                                                            row.status === 'Critical' ? theme.palette.error.main : theme.palette.warning.main,
                                                            0.15
                                                        ),
                                                        color: row.status === 'Critical' ? 'error.main' : 'warning.main',
                                                    }}>
                                                        {row.name.charAt(0)}
                                                    </Avatar>
                                                    <Box flex={1} overflow="hidden">
                                                        <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                                                            {row.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">{row.rollNo}</Typography>
                                                    </Box>
                                                    <Box textAlign="right">
                                                        <Typography variant="body2" fontWeight={800}
                                                            color={row.val < 50 ? 'error.main' : 'warning.main'}
                                                        >
                                                            {row.val}%
                                                        </Typography>
                                                        <Chip
                                                            label={row.status}
                                                            size="small"
                                                            color={row.status === 'Critical' ? 'error' : 'warning'}
                                                            variant="outlined"
                                                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                                                        />
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>

                                        <Button
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            fullWidth
                                            sx={{ mt: 2, fontWeight: 700, borderRadius: 2 }}
                                        >
                                            View All Defaulters
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Faculty Performance */}
                            <Grid item xs={12}>
                                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Avatar sx={{
                                                bgcolor: alpha(theme.palette.info.main, isDark ? 0.15 : 0.08),
                                                color: 'info.main',
                                                width: 36, height: 36,
                                            }}>
                                                <SchoolIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={700} color="text.primary">Faculty Performance</Typography>
                                                <Typography variant="caption" color="text.secondary">Average attendance in their classes</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Faculty</TableCell>
                                                    <TableCell>Subject</TableCell>
                                                    <TableCell align="center">Sessions</TableCell>
                                                    <TableCell align="center">Avg Attendance</TableCell>
                                                    <TableCell align="right">Performance</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {facultyPerformance.map((fac, i) => {
                                                    const perfColor = fac.avg >= 80 ? 'success' : fac.avg >= 70 ? 'warning' : 'error';
                                                    return (
                                                        <TableRow key={i} hover>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                                    <Avatar sx={{
                                                                        width: 32, height: 32, fontSize: '0.8rem',
                                                                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
                                                                        color: 'primary.main',
                                                                    }}>
                                                                        {fac.name.charAt(0)}
                                                                    </Avatar>
                                                                    <Typography variant="body2" fontWeight={600} color="text.primary">{fac.name}</Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">{fac.subject}</Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography variant="body2" fontWeight={600} color="text.primary">{fac.sessions}</Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                                                                    <LinearProgress
                                                                        variant="determinate"
                                                                        value={fac.avg}
                                                                        color={perfColor}
                                                                        sx={{ width: 60, height: 6, borderRadius: 3 }}
                                                                    />
                                                                    <Typography variant="body2" fontWeight={700} color="text.primary">{fac.avg}%</Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Chip
                                                                    label={fac.avg >= 80 ? 'Excellent' : fac.avg >= 70 ? 'Good' : 'Needs Improvement'}
                                                                    size="small"
                                                                    color={perfColor}
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
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Fade>
            )}

            {/* Other sections placeholder */}
            {activeSection !== 'dashboard' && (
                <Fade in timeout={400}>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" flexDirection="column">
                        <Box sx={{
                            width: 120, height: 120,
                            bgcolor: alpha(theme.palette.text.primary, 0.04),
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mb: 3,
                        }}>
                            <BarChartIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                        </Box>
                        <Typography variant="h5" color="text.secondary" fontWeight={700}>{currentLabel}</Typography>
                        <Typography color="text.disabled" sx={{ mt: 1 }}>This module is coming soon.</Typography>
                    </Box>
                </Fade>
            )}
        </DashboardLayout>
    );
};

export default HODDashboard;
