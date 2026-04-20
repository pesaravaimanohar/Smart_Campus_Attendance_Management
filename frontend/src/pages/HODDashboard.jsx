import React, { useState, useEffect, useCallback } from "react";
import {
    Typography, Box, Grid, Card, CardContent, Select, MenuItem,
    Avatar, Chip, Tooltip, useTheme, Fade, LinearProgress,
    Table, TableBody, TableRow, TableCell, TableHead, TableContainer,
    Paper, Button, Stack, Divider
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
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
import { getHodDashboard } from "../services/api";

const HODDashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [activeSection, setActiveSection] = useState('dashboard');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getHodDashboard();
            setData(res);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load department data");
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

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: theme.shadows[4] }}>
                    <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="body2" color="primary.main">
                        Attendance: <strong>{payload[0].value}%</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Classes held: {payload[0].payload.classes || 0}
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <DashboardLayout
            title={currentLabel}
            subtitle={`Department Head • ${user?.department || 'CSE'}`}
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
                                    value={totalFaculty}
                                    icon={<PeopleIcon />}
                                    color={theme.palette.primary.main}
                                    trend="+2 this sem"
                                    animationDelay={0}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Total Students"
                                    value={totalStudents}
                                    icon={<GroupsIcon />}
                                    color="#EC407A"
                                    trend="+8 new enrollments"
                                    animationDelay={1}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Avg Attendance"
                                    value={avgAttendance + '%'}
                                    icon={<BarChartIcon />}
                                    color={theme.palette.success.main}
                                    trend="+5% this week"
                                    animationDelay={2}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatsCard
                                    title="Active Sessions"
                                    value={activeSessions}
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
                                                <TrendingUpIcon fontSize="small" />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight={700} color="text.primary">Attendance Trends</Typography>
                                                <Typography variant="caption" color="text.secondary">Weekly performance analysis</Typography>
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
                                            <MenuItem value="week">Last 7 Days</MenuItem>
                                            <MenuItem value="month">Current Month</MenuItem>
                                        </Select>
                                    </Box>

                                    <Box sx={{ height: 300, mt: 2 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: alpha(theme.palette.primary.main, 0.05), radius: 8 }} />
                                                <Bar 
                                                    dataKey="value" 
                                                    radius={[6, 6, 0, 0]} 
                                                    barSize={40}
                                                    animationDuration={1500}
                                                >
                                                    {weeklyTrends.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={entry.value < 65 ? theme.palette.error.main : entry.value < 75 ? theme.palette.warning.main : theme.palette.primary.main} 
                                                            fillOpacity={0.85}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>

                                    <Stack direction="row" gap={3} mt={3} justifyContent="center">
                                        {[
                                            { label: 'Critical (<65%)', color: theme.palette.error.main },
                                            { label: 'Warning (65-75%)', color: theme.palette.warning.main },
                                            { label: 'Good (>75%)', color: theme.palette.primary.main },
                                        ].map(l => (
                                            <Box key={l.label} display="flex" alignItems="center" gap={1}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: l.color }} />
                                                <Typography variant="caption" fontWeight={600} color="text.secondary">{l.label}</Typography>
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
                                                    component={motion.div}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
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
                                                        '&:hover': {
                                                            bgcolor: alpha(
                                                                row.status === 'Critical' ? theme.palette.error.main : theme.palette.warning.main,
                                                                isDark ? 0.1 : 0.06
                                                            ),
                                                            transform: 'translateY(-2px)',
                                                            transition: 'all 0.2s ease',
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
                                            View Detailed Report
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
                                                <Typography variant="subtitle1" fontWeight={700} color="text.primary">Faculty Performance Metrics</Typography>
                                                <Typography variant="caption" color="text.secondary">Engagement analysis based on class attendance</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                                                    <TableCell sx={{ fontWeight: 700 }}>Faculty Member</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>Primary Subject</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Sessions</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Avg Attendance</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Efficiency</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {facultyPerformance.map((fac, i) => {
                                                    const perfColor = fac.avg >= 85 ? 'success' : fac.avg >= 70 ? 'warning' : 'error';
                                                    return (
                                                        <TableRow key={i} hover>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                                    <Avatar src={fac.avatar} sx={{
                                                                        width: 32, height: 32, fontSize: '0.8rem',
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
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
                                                                <Typography variant="body2" fontWeight={600}>{fac.sessions}</Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Box display="flex" alignItems="center" gap={1.5} justifyContent="center">
                                                                    <Box sx={{ width: 80 }}>
                                                                        <LinearProgress
                                                                            variant="determinate"
                                                                            value={fac.avg}
                                                                            color={perfColor}
                                                                            sx={{ height: 6, borderRadius: 3 }}
                                                                        />
                                                                    </Box>
                                                                    <Typography variant="body2" fontWeight={800}>{fac.avg}%</Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Chip
                                                                    label={fac.avg >= 85 ? 'Excellent' : fac.avg >= 70 ? 'Good' : 'Review'}
                                                                    size="small"
                                                                    color={perfColor}
                                                                    sx={{ fontWeight: 700 }}
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

            {/* Placeholder for other sections */}
            {activeSection !== 'dashboard' && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" flexDirection="column">
                    <Box component={motion.div} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                         <AssessmentIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    </Box>
                    <Typography variant="h5" color="text.secondary" fontWeight={700}>{currentLabel}</Typography>
                    <Typography color="text.disabled">Advanced analysis for this module is being generated.</Typography>
                </Box>
            )}
        </DashboardLayout>
    );
};

export default HODDashboard;
