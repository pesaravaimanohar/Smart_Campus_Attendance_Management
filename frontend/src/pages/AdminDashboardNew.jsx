import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton,
    AppBar,
    Toolbar,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Divider,
    Chip,
    Stack,
    Menu,
    MenuItem,
    Badge,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    Upload as UploadIcon,
    TrendingUp as TrendingUpIcon,
    Assessment as AssessmentIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
    AccountCircle as AccountCircleIcon,
    Logout as LogoutIcon,
    ChevronLeft as ChevronLeftIcon,
    Groups as GroupsIcon,
    Subject as SubjectIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import BulkUploadModule from '../components/modules/BulkUploadModule';
import PromotionEngineModule from '../components/modules/PromotionEngineModule';
import { studentAPI, facultyAPI, departmentAPI } from '../services/api';

const DRAWER_WIDTH = 280;

const AdminDashboardNew = () => {
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [anchorEl, setAnchorEl] = useState(null);
    const [academicYear, setAcademicYear] = useState('2024-2025');
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalFaculty: 0,
        activeDepartments: 0,
        semestersRunning: 8,
    });

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            const [students, faculty, departments] = await Promise.all([
                studentAPI.getAll(),
                facultyAPI.getAll(),
                departmentAPI.getActive(),
            ]);

            setStats({
                totalStudents: students.length,
                totalFaculty: faculty.length,
                activeDepartments: departments.length,
                semestersRunning: 8,
            });
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
        { id: 'divider1', divider: true },
        { id: 'student-upload', label: 'Upload Students', icon: <UploadIcon /> },
        { id: 'faculty-upload', label: 'Upload Faculty', icon: <UploadIcon /> },
        { id: 'divider2', divider: true },
        { id: 'student-mgmt', label: 'Student Management', icon: <PeopleIcon /> },
        { id: 'faculty-mgmt', label: 'Faculty Management', icon: <GroupsIcon /> },
        { id: 'dept-mgmt', label: 'Department Management', icon: <SchoolIcon /> },
        { id: 'divider3', divider: true },
        { id: 'promotion', label: 'Semester Promotion', icon: <TrendingUpIcon /> },
        { id: 'subject-eligibility', label: 'Subject Eligibility', icon: <SubjectIcon /> },
        { id: 'assignments', label: 'Subject Assignments', icon: <AssignmentIcon /> },
        { id: 'divider4', divider: true },
        { id: 'reports', label: 'Reports & Analytics', icon: <AssessmentIcon /> },
        { id: 'settings', label: 'System Settings', icon: <SettingsIcon /> },
    ];

    const renderDashboard = () => (
        <Box>
            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                        color: 'white',
                    }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalStudents}
                                    </Typography>
                                    <Typography variant="body2">Total Students</Typography>
                                    <Typography variant="caption">UG + PG Programs</Typography>
                                </Box>
                                <PeopleIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                        color: 'white',
                    }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.totalFaculty}
                                    </Typography>
                                    <Typography variant="body2">Active Faculty</Typography>
                                    <Typography variant="caption">Teaching Staff</Typography>
                                </Box>
                                <GroupsIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
                        color: 'white',
                    }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.semestersRunning}
                                    </Typography>
                                    <Typography variant="body2">Semesters Running</Typography>
                                    <Typography variant="caption">Current Academic Year</Typography>
                                </Box>
                                <SchoolIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
                        color: 'white',
                    }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h3" fontWeight="bold">
                                        {stats.activeDepartments}
                                    </Typography>
                                    <Typography variant="body2">Active Departments</Typography>
                                    <Typography variant="caption">All Programs</Typography>
                                </Box>
                                <DashboardIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                        Quick Actions
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<UploadIcon />}
                                onClick={() => setActiveView('student-upload')}
                                sx={{ py: 2 }}
                            >
                                Upload Students
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<UploadIcon />}
                                onClick={() => setActiveView('faculty-upload')}
                                sx={{ py: 2 }}
                            >
                                Upload Faculty
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<TrendingUpIcon />}
                                onClick={() => setActiveView('promotion')}
                                sx={{ py: 2 }}
                            >
                                Semester Promotion
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<AssignmentIcon />}
                                onClick={() => setActiveView('assignments')}
                                sx={{ py: 2 }}
                            >
                                Subject Assignment
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Recent Activity / Alerts */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                Promotion Readiness
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                View department-wise semester promotion status
                            </Typography>
                            <Button variant="contained" onClick={() => setActiveView('promotion')}>
                                View Details
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                Faculty Workload
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Monitor subject assignments and teaching load
                            </Typography>
                            <Button variant="contained" onClick={() => setActiveView('assignments')}>
                                View Assignments
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard':
                return renderDashboard();
            case 'student-upload':
                return <BulkUploadModule type="student" />;
            case 'faculty-upload':
                return <BulkUploadModule type="faculty" />;
            case 'promotion':
                return <PromotionEngineModule />;
            case 'student-mgmt':
                return (
                    <Card>
                        <CardContent>
                            <Typography variant="h5">Student Management</Typography>
                            <Typography color="text.secondary">Coming soon...</Typography>
                        </CardContent>
                    </Card>
                );
            case 'faculty-mgmt':
                return (
                    <Card>
                        <CardContent>
                            <Typography variant="h5">Faculty Management</Typography>
                            <Typography color="text.secondary">Coming soon...</Typography>
                        </CardContent>
                    </Card>
                );
            default:
                return (
                    <Card>
                        <CardContent>
                            <Typography variant="h5">{activeView}</Typography>
                            <Typography color="text.secondary">Module under development...</Typography>
                        </CardContent>
                    </Card>
                );
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: 1,
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" noWrap sx={{ flexGrow: 0, fontWeight: 700, color: 'primary.main' }}>
                        Academic ERP
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Academic Year Selector */}
                    <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
                        <Select
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            displayEmpty
                        >
                            <MenuItem value="2024-2025">AY 2024-2025</MenuItem>
                            <MenuItem value="2023-2024">AY 2023-2024</MenuItem>
                            <MenuItem value="2022-2023">AY 2022-2023</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Notifications */}
                    <IconButton color="inherit" sx={{ mr: 1 }}>
                        <Badge badgeContent={4} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    {/* Profile Menu */}
                    <IconButton
                        color="inherit"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                    >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            A
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem>
                            <ListItemIcon>
                                <AccountCircleIcon fontSize="small" />
                            </ListItemIcon>
                            Profile
                        </MenuItem>
                        <MenuItem>
                            <ListItemIcon>
                                <SettingsIcon fontSize="small" />
                            </ListItemIcon>
                            Settings
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Drawer
                variant="permanent"
                open={drawerOpen}
                sx={{
                    width: drawerOpen ? DRAWER_WIDTH : 72,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerOpen ? DRAWER_WIDTH : 72,
                        boxSizing: 'border-box',
                        transition: 'width 0.3s',
                        overflowX: 'hidden',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                    },
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}

                <Box sx={{ overflow: 'auto', mt: 2 }}>
                    <List>
                        {menuItems.map((item) =>
                            item.divider ? (
                                <Divider key={item.id} sx={{ my: 1 }} />
                            ) : (
                                <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
                                    <ListItemButton
                                        selected={activeView === item.id}
                                        onClick={() => setActiveView(item.id)}
                                        sx={{
                                            minHeight: 48,
                                            justifyContent: drawerOpen ? 'initial' : 'center',
                                            px: 2.5,
                                            '&.Mui-selected': {
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                },
                                                '& .MuiListItemIcon-root': {
                                                    color: 'primary.contrastText',
                                                },
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: drawerOpen ? 3 : 'auto',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            sx={{ opacity: drawerOpen ? 1 : 0 }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            )
                        )}
                    </List>
                </Box>
            </Drawer>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar /> {/* Spacer for AppBar */}

                {/* Breadcrumbs */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        {menuItems.find(item => item.id === activeView)?.label || 'Dashboard'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Academic ERP / {menuItems.find(item => item.id === activeView)?.label || 'Dashboard'}
                    </Typography>
                </Box>

                {/* Content Area */}
                {renderContent()}
            </Box>
        </Box>
    );
};

export default AdminDashboardNew;
