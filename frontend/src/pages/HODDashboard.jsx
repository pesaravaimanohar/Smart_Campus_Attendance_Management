import React, { useState } from "react";
import {
    Container, Typography, AppBar, Toolbar, IconButton, Button, Box, Grid, Card, CardContent,
    Select, MenuItem, Paper, Divider, Avatar, InputBase, Badge, TableContainer, Table, TableBody,
    TableRow, TableCell, TableHead, Chip, Tooltip, useTheme, Fade, LinearProgress
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import {
    Menu as MenuIcon,
    Logout as LogoutIcon,
    BarChart as BarChartIcon,
    People as PeopleIcon,
    Class as ClassIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

import ChangePasswordDialog from '../components/ChangePasswordDialog';
// ThemeToggle removed
import GlobalHeader from '../components/GlobalHeader';

const HODDashboard = () => {
    const { logout, user } = useAuth();
    const theme = useTheme();
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    // Mock Data for now
    const stats = {
        totalFaculty: 12,
        totalStudents: 145,
        avgAttendance: 82.5
    };

    // Navigation State
    const [activeSection, setActiveSection] = useState('dashboard');

    // Layout Components
    const SidebarItem = ({ icon, label, value }) => {
        const isActive = activeSection === value;
        return (
            <Box
                onClick={() => setActiveSection(value)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    mx: 2,
                    mb: 1,
                    borderRadius: 3,
                    cursor: 'pointer',
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.secondary',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                        bgcolor: isActive ? 'primary.dark' : 'rgba(0,0,0,0.04)',
                        transform: 'translateX(5px)'
                    }
                }}
            >
                {isActive && (
                    <Box sx={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0, width: 4,
                        bgcolor: 'secondary.main'
                    }} />
                )}
                <Box sx={{ ml: isActive ? 1 : 0, transition: 'margin 0.3s' }}>
                    {React.cloneElement(icon, { sx: { fontSize: 24, mr: 2, color: isActive ? 'white' : 'inherit' } })}
                </Box>
                <Typography fontWeight="600" fontSize="0.95rem">{label}</Typography>
            </Box>
        );
    };

    const StatCard = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                        <Typography color="text.secondary" variant="subtitle2" fontWeight="600" gutterBottom>{title}</Typography>
                        <Typography variant="h4" fontWeight="800" sx={{ color: color }}>{value}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48 }}>
                        {icon}
                    </Avatar>
                </Box>
                <Box mt={2}>
                    <Chip
                        size="small"
                        label="+5% this week"
                        sx={{ bgcolor: 'success.50', color: 'success.dark', fontWeight: 'bold' }}
                        icon={<TrendingUpIcon />}
                    />
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
            <GlobalHeader />
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <Paper
                    elevation={3}
                    sx={{
                        width: showSidebar ? 280 : 0,
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'width 0.3s ease',
                        overflow: 'hidden',
                        zIndex: 1200,
                        position: { xs: 'absolute', md: 'relative' },
                        height: '100%'
                    }}
                >
                    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <BarChartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h6" fontWeight="800" color="text.primary" lineHeight={1.2}>HOD PANEL</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight="600">Department Head</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1, mt: 3 }}>
                        <SidebarItem icon={<BarChartIcon />} label="Dashboard" value="dashboard" />
                        <SidebarItem icon={<PeopleIcon />} label="Faculty" value="faculty" />
                        <SidebarItem icon={<ClassIcon />} label="Students" value="students" />
                    </Box>

                    <Box sx={{ p: 3, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Avatar
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=HODUser`}
                                sx={{ width: 48, height: 48, border: '2px solid', borderColor: 'primary.main' }}
                            />
                            <Box overflow="hidden">
                                <Typography variant="subtitle2" fontWeight="bold" noWrap>{user?.username || 'Header'}</Typography>
                                <Typography variant="caption" color="text.secondary">CSE Dept.</Typography>
                            </Box>
                        </Box>
                        <Box display="flex" gap={1}>
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                onClick={logout}
                                startIcon={<LogoutIcon />}
                                fullWidth
                                sx={{ borderRadius: 2 }}
                            >
                                Logout
                            </Button>
                            <Tooltip title="Change Password">
                                <IconButton size="small" onClick={() => setOpenChangePassword(true)}>
                                    <WarningIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </Paper>

                <ChangePasswordDialog open={openChangePassword} onClose={() => setOpenChangePassword(false)} />

                {/* Main Content */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0, position: 'relative' }}>
                    {/* AppBar */}
                    <Box sx={{
                        p: 2, px: 4, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        position: 'sticky', top: 0, zIndex: 1100
                    }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <IconButton onClick={() => setShowSidebar(!showSidebar)} color="primary">
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" fontWeight="800" color="text.primary">
                                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                            {/* ThemeToggle removed */}
                            <Box sx={{ position: 'relative', mr: 2 }}>
                                <SearchIcon sx={{ position: 'absolute', left: 10, top: 8, color: 'text.disabled' }} />
                                <InputBase
                                    placeholder="Search..."
                                    sx={{
                                        pl: 5, pr: 2, py: 0.5,
                                        bgcolor: 'grey.50',
                                        borderRadius: 4,
                                        fontSize: '0.9rem',
                                        minWidth: 200
                                    }}
                                />
                            </Box>
                            <IconButton>
                                <Badge badgeContent={4} color="error">
                                    <NotificationsIcon color="action" />
                                </Badge>
                            </IconButton>
                        </Box>
                    </Box>

                    <Container maxWidth="xl" sx={{ py: 4 }}>
                        <Fade in timeout={500}>
                            <Box>
                                {/* VIEW: DASHBOARD */}
                                {activeSection === 'dashboard' && (
                                    <Grid container spacing={4}>
                                        {/* Stats Cards Row */}
                                        <Grid item xs={12} sm={4}>
                                            <StatCard
                                                title="Total Faculty"
                                                value={stats.totalFaculty}
                                                icon={<PeopleIcon />}
                                                color="#7e57c2"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <StatCard
                                                title="Total Students"
                                                value={stats.totalStudents}
                                                icon={<ClassIcon />}
                                                color="#ec407a"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <StatCard
                                                title="Avg Attendance"
                                                value={stats.avgAttendance + "%"}
                                                icon={<BarChartIcon />}
                                                color="#29b6f6"
                                            />
                                        </Grid>

                                        {/* Main Analytics Section */}
                                        <Grid item xs={12} md={8}>
                                            <Card sx={{ borderRadius: 4, p: 3, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', width: 32, height: 32 }}>
                                                            <BarChartIcon fontSize="small" />
                                                        </Avatar>
                                                        <Typography variant="h6" fontWeight="bold">Attendance Trends</Typography>
                                                    </Box>
                                                    <Select size="small" defaultValue="week" sx={{ minWidth: 120, borderRadius: 2, bgcolor: 'grey.50' }}>
                                                        <MenuItem value="week">This Week</MenuItem>
                                                        <MenuItem value="month">This Month</MenuItem>
                                                    </Select>
                                                </Box>

                                                {/* CSS Bar Chart */}
                                                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 280, px: 2, bgcolor: 'background.default', borderRadius: 3, pt: 2 }}>
                                                    {[65, 82, 75, 60, 45, 90, 78].map((val, i) => (
                                                        <Box key={i} display="flex" flexDirection="column" alignItems="center" width="10%">
                                                            <Tooltip title={`${val}% Attendance`}>
                                                                <Box
                                                                    sx={{
                                                                        width: '60%',
                                                                        height: `${val * 2.8}px`,
                                                                        bgcolor: i === 4 ? 'error.main' : 'primary.main', // Highlight strict day
                                                                        borderRadius: '8px 8px 0 0',
                                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                        opacity: 0.8,
                                                                        '&:hover': { opacity: 1, transform: 'scaleY(1.05)' },
                                                                        cursor: 'pointer'
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                            <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary', fontWeight: 700 }}>
                                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Card>
                                        </Grid>

                                        {/* Defaulters List */}
                                        <Grid item xs={12} md={4}>
                                            <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                                <CardContent>
                                                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'error.main', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <WarningIcon /> Defaulters Watchlist
                                                    </Typography>
                                                    <TableContainer>
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold' }} align="right">%</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {[
                                                                    { name: "Sakbik Mara", status: "Critical", val: 58.5 },
                                                                    { name: "Sashi Aghani", status: "Warning", val: 62.1 },
                                                                    { name: "Satini Mdcen", status: "Critical", val: 45.0 },
                                                                    { name: "Saohi Halhan", status: "Warning", val: 64.2 },
                                                                    { name: "User 502", status: "Critical", val: 51.8 },
                                                                ].map((row, idx) => (
                                                                    <TableRow key={idx} hover>
                                                                        <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                                                                        <TableCell>
                                                                            <Chip
                                                                                label={row.status}
                                                                                size="small"
                                                                                color={row.status === 'Critical' ? 'error' : 'warning'}
                                                                                variant="outlined"
                                                                                sx={{ fontWeight: 'bold', height: 20, fontSize: '0.7rem' }}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 800, color: row.val < 50 ? 'error.dark' : 'warning.dark' }}>
                                                                            {row.val}%
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                    <Button size="small" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>View All Defaulters</Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                )}
                                {activeSection !== 'dashboard' && (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="50vh" flexDirection="column">
                                        <Box
                                            sx={{
                                                width: 120,
                                                height: 120,
                                                bgcolor: 'grey.100',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 2
                                            }}
                                        >
                                            <BarChartIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                                        </Box>
                                        <Typography variant="h6" color="text.secondary">Analytics Module Coming Soon</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Fade>
                    </Container>
                </Box>
            </Box>
        </Box>
    );
};

export default HODDashboard;
