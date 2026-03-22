import React, { useState } from "react";
import {
    Container, Typography, Box, Paper, Grid, Card, CardContent, Button,
    TextField, Avatar, IconButton, useTheme, Fade, Chip, Tooltip, LinearProgress
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import {
    Timeline as TimelineIcon,
    Apartment as ApartmentIcon,
    Logout as LogoutIcon,
    Dashboard as DashboardIcon,
    Business as BusinessIcon,
    Assignment as AssignmentIcon,
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    Menu as MenuIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    School as SchoolIcon
} from '@mui/icons-material';

import ChangePasswordDialog from '../components/ChangePasswordDialog';
// ThemeToggle removed
import GlobalHeader from '../components/GlobalHeader';

const PrincipalDashboard = () => {
    const { logout, user } = useAuth();
    const theme = useTheme();
    const [activeSection, setActiveSection] = useState('overview');
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

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

    const StatCard = ({ title, value, icon, color, trend }) => (
        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2, opacity: 0.1 }}>
                {React.cloneElement(icon, { sx: { fontSize: 80, color: color } })}
            </Box>
            <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 48, height: 48 }}>
                        {icon}
                    </Avatar>
                    <Box>
                        <Typography color="text.secondary" variant="subtitle2" fontWeight="600">{title}</Typography>
                        <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary' }}>{value}</Typography>
                    </Box>
                </Box>
                {trend && (
                    <Chip
                        label={trend}
                        size="small"
                        sx={{ bgcolor: `${color}10`, color: color, fontWeight: 'bold' }}
                        icon={<TrendingUpIcon />}
                    />
                )}
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
                        <ApartmentIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
                        <Box>
                            <Typography variant="h6" fontWeight="800" color="text.primary" lineHeight={1.2}>PRINCIPAL</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight="600">Executive View</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1, mt: 3 }}>
                        <SidebarItem icon={<DashboardIcon />} label="Overview" value="overview" />
                        <SidebarItem icon={<BusinessIcon />} label="Departments" value="departments" />
                        <SidebarItem icon={<AssignmentIcon />} label="Reports" value="reports" />
                    </Box>

                    <Box sx={{ p: 3, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Avatar
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=PrincipalUser`}
                                sx={{ width: 48, height: 48, border: '2px solid', borderColor: 'secondary.main' }}
                            />
                            <Box overflow="hidden">
                                <Typography variant="subtitle2" fontWeight="bold" noWrap>{user?.username || 'Principal'}</Typography>
                                <Typography variant="caption" color="text.secondary">Administrator</Typography>
                            </Box>
                        </Box>
                        <Box display="flex" gap={1}>
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                onClick={() => setOpenChangePassword(true)}
                                fullWidth
                                sx={{ borderRadius: 2 }}
                            >
                                Pass
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={logout}
                                startIcon={<LogoutIcon />}
                                fullWidth
                                sx={{ borderRadius: 2 }}
                            >
                                Logout
                            </Button>
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
                            <TextField
                                placeholder="Search..."
                                size="small"
                                InputProps={{
                                    startAdornment: <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />,
                                    sx: { borderRadius: 4, bgcolor: 'grey.50', '& fieldset': { border: 'none' }, minWidth: 200 }
                                }}
                            />
                            {/* ThemeToggle removed */}
                            <IconButton color="primary">
                                <NotificationsIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    <Container maxWidth="xl" sx={{ py: 4 }}>
                        <Fade in timeout={500}>
                            <Box>
                                {/* VIEW: OVERVIEW */}
                                {activeSection === 'overview' && (
                                    <Grid container spacing={4}>
                                        {/* Stats Cards */}
                                        <Grid item xs={12} sm={6} md={3}>
                                            <StatCard
                                                title="Attendance Rate"
                                                value="78%"
                                                icon={<TimelineIcon />}
                                                color="#7e57c2"
                                                trend="+2.5% vs last week"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <StatCard
                                                title="Active Sessions"
                                                value="15"
                                                icon={<DashboardIcon />}
                                                color="#29b6f6"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <StatCard
                                                title="Faculty Present"
                                                value="45/50"
                                                icon={<SchoolIcon />}
                                                color="#ffa726"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <StatCard
                                                title="Critical Alerts"
                                                value="2"
                                                icon={<WarningIcon />}
                                                color="#ef5350"
                                            />
                                        </Grid>

                                        {/* Charts Section */}
                                        <Grid item xs={12} md={8}>
                                            <Card sx={{ borderRadius: 4, p: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ bgcolor: 'secondary.50', color: 'secondary.main', width: 32, height: 32 }}>
                                                            <TimelineIcon fontSize="small" />
                                                        </Avatar>
                                                        <Typography variant="h6" fontWeight="bold">College Attendance Trends</Typography>
                                                    </Box>
                                                    <Button size="small" variant="outlined" sx={{ borderRadius: 4 }}>Full Report</Button>
                                                </Box>

                                                {/* CSS Bar Chart */}
                                                <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 300, px: 2, pt: 2, bgcolor: 'grey.50', borderRadius: 3 }}>
                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                                                        const height = [65, 78, 85, 72, 80, 60][i];
                                                        return (
                                                            <Box key={i} display="flex" flexDirection="column" alignItems="center" width="10%">
                                                                <Box
                                                                    sx={{
                                                                        width: '100%',
                                                                        height: `${height * 3}px`,
                                                                        background: 'linear-gradient(180deg, #d1c4e9 0%, #7e57c2 100%)',
                                                                        borderRadius: '8px 8px 0 0',
                                                                        position: 'relative',
                                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                        '&:hover': {
                                                                            transform: 'scaleY(1.05)',
                                                                            boxShadow: '0 4px 15px rgba(126, 87, 194, 0.4)'
                                                                        },
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <Tooltip title={`${height}% Coverage`}>
                                                                        <Box sx={{ width: '100%', height: '100%' }} />
                                                                    </Tooltip>
                                                                </Box>
                                                                <Typography variant="caption" sx={{ mt: 1.5, fontWeight: 700, color: 'text.secondary' }}>
                                                                    {day}
                                                                </Typography>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            </Card>
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            <Card sx={{ borderRadius: 4, p: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                                <Box display="flex" alignItems="center" gap={1} mb={4}>
                                                    <Avatar sx={{ bgcolor: 'secondary.50', color: 'secondary.main', width: 32, height: 32 }}>
                                                        <BusinessIcon fontSize="small" />
                                                    </Avatar>
                                                    <Typography variant="h6" fontWeight="bold">Dept. Performance</Typography>
                                                </Box>

                                                <Box mt={2}>
                                                    {[
                                                        { name: 'Computer Science', val: 85, color: 'success' },
                                                        { name: 'Electronics', val: 72, color: 'warning' },
                                                        { name: 'Mechanical', val: 65, color: 'error' },
                                                        { name: 'Civil', val: 78, color: 'info' }
                                                    ].map((dept, i) => (
                                                        <Box key={i} sx={{ mb: 4 }}>
                                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                                <Typography variant="subtitle2" fontWeight="700">{dept.name}</Typography>
                                                                <Typography variant="subtitle2" color={`${dept.color}.main`}>{dept.val}%</Typography>
                                                            </Box>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={dept.val}
                                                                color={dept.color}
                                                                sx={{ height: 8, borderRadius: 4, bgcolor: `${dept.color}.50` }}
                                                            />
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                )}

                                {activeSection !== 'overview' && (
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
                                            <DashboardIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                                        </Box>
                                        <Typography variant="h6" color="text.secondary">Section Under Development</Typography>
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

export default PrincipalDashboard;
