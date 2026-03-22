import React, { useState, useEffect } from "react";
import {
    Typography, Button, Paper, Box, MenuItem, Select, FormControl,
    InputLabel, Grid, Card, CardContent, Tabs, Tab, TextField,
    InputAdornment, Slider, Avatar, Divider, IconButton, useTheme, Fade,
    Chip, Tooltip
} from "@mui/material";
import QRCode from "react-qr-code";
import { getFacultyMappings, createSession, markManualAttendance } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
    Dashboard as DashboardIcon,
    QrCode2 as QrCodeIcon,
    AccessTime as TimerIcon,
    Person as PersonIcon,
    Class as ClassIcon,
    Assignment as AssignmentIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    AddCircle as AddCircleIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import ChangePasswordDialog from '../components/ChangePasswordDialog';
// ThemeToggle removed
import GlobalHeader from '../components/GlobalHeader';

const FacultyDashboard = () => {
    const { logout, user } = useAuth();
    const theme = useTheme();
    const [classes, setClasses] = useState([]);
    const [selectedMapId, setSelectedMapId] = useState("");
    const [session, setSession] = useState(null);
    const [qrValue, setQrValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [radius, setRadius] = useState(50);
    const [activeSection, setActiveSection] = useState('session');
    const [showSidebar, setShowSidebar] = useState(true);

    // Manual Override State
    const [manualRollNo, setManualRollNo] = useState("");
    const [manualReason, setManualReason] = useState("");
    const [manualMessage, setManualMessage] = useState("");

    const [openChangePassword, setOpenChangePassword] = useState(false);

    useEffect(() => {
        const loadClasses = async () => {
            try {
                const data = await getFacultyMappings();
                setClasses(data);
            } catch (e) {
                console.error("Failed to load classes");
            } finally {
                setLoading(false);
            }
        };
        loadClasses();
    }, []);

    useEffect(() => {
        let interval;
        if (session) {
            setQrValue(`SESSION:${session.id}`); // Initial value
            interval = setInterval(() => {
                setQrValue(`SESSION:${session.id}:` + Date.now());
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [session]);

    const handleStartSession = async () => {
        if (!selectedMapId) return;

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const newSession = await createSession({
                    mapId: selectedMapId,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    duration: 5,
                    radius: radius
                });
                setSession(newSession);
            } catch (e) {
                console.error(e);
                alert("Failed to create session: " + (e.response?.data?.message || e.message));
            }
        }, (err) => {
            console.error(err);
            alert("Location access required to start session (Geo-fencing). Please enable location services.");
        });
    };

    const handleManualSubmit = async () => {
        if (!session) {
            setManualMessage("Please start a session first.");
            return;
        }
        try {
            await markManualAttendance({
                sessionId: session.id,
                studentRollNo: manualRollNo,
                reason: manualReason
            });
            setManualMessage(`Success: Marked ${manualRollNo} as Present.`);
            setManualRollNo("");
            setManualReason("");
            setTimeout(() => setManualMessage(""), 5000);
        } catch (error) {
            setManualMessage("Failed: " + (error.response?.data?.message || "Invalid Roll No"));
        }
    };

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
                {/* Active Indicator */}
                {isActive && (
                    <Box sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f0f2f5' }}>
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
                        <ClassIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h6" fontWeight="800" color="text.primary" lineHeight={1.2}>FACULTY</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight="600">Portal</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1, mt: 3 }}>
                        <SidebarItem icon={<QrCodeIcon />} label="Live Session" value="session" />
                        <SidebarItem icon={<DashboardIcon />} label="My Classes" value="classes" />
                        <SidebarItem icon={<AssignmentIcon />} label="Attendance Reports" value="reports" />
                    </Box>

                    <Box sx={{ p: 3, bgcolor: 'background.default' }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Avatar
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                                sx={{ width: 48, height: 48, border: '2px solid', borderColor: 'primary.main' }}
                            />
                            <Box overflow="hidden">
                                <Typography variant="subtitle2" fontWeight="bold" noWrap>{user?.firstName || user?.username}</Typography>
                                <Typography variant="caption" color="text.secondary">Faculty Member</Typography>
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
                    {/* AppBar / Header */}
                    <Box sx={{
                        p: 2,
                        px: 4,
                        bgcolor: 'white',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100
                    }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <IconButton onClick={() => setShowSidebar(!showSidebar)} color="primary">
                                <MenuIcon />
                            </IconButton>
                            <Box>
                                <Typography variant="h6" fontWeight="800" color="text.primary">
                                    {activeSection === 'session' ? 'Live Attendance Console' :
                                        activeSection === 'classes' ? 'My Classes' : 'Reports & Analytics'}
                                </Typography>
                            </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={2}>
                            {/* ThemeToggle removed */}
                            <Chip
                                icon={<CheckCircleIcon />}
                                label="System Operational"
                                color="success"
                                size="small"
                                variant="outlined"
                                sx={{ display: { xs: 'none', sm: 'flex' } }}
                            />
                            <IconButton>
                                <NotificationsIcon color="action" />
                            </IconButton>
                        </Box>
                    </Box>

                    <Box sx={{ p: { xs: 2, md: 4 } }}>
                        {/* VIEW: SESSION (Attendance Tool) */}
                        {activeSection === 'session' && (
                            <Fade in timeout={500}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Paper sx={{
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }}>
                                            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                                                <Tabs
                                                    value={tabValue}
                                                    onChange={(e, v) => setTabValue(v)}
                                                    textColor="primary"
                                                    indicatorColor="primary"
                                                    sx={{ px: 2 }}
                                                >
                                                    <Tab label="Start Attendance" sx={{ fontWeight: 700, p: 3 }} icon={<QrCodeIcon />} iconPosition="start" />
                                                    <Tab label="Manual Entry" sx={{ fontWeight: 700, p: 3 }} icon={<PersonIcon />} iconPosition="start" />
                                                </Tabs>
                                            </Box>

                                            <Box sx={{ p: 4 }}>
                                                {tabValue === 0 && (
                                                    <Grid container spacing={4}>
                                                        {/* Left Side - Controls & QR */}
                                                        <Grid item xs={12} md={5}>
                                                            <Box height="100%" display="flex" flexDirection="column">
                                                                {!session ? (
                                                                    <Box sx={{
                                                                        p: 4,
                                                                        border: '2px dashed',
                                                                        borderColor: 'primary.light',
                                                                        borderRadius: 4,
                                                                        textAlign: 'center',
                                                                        bgcolor: 'primary.50'
                                                                    }}>
                                                                        <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 60, height: 60, mx: 'auto', mb: 2, boxShadow: 2 }}>
                                                                            <AddCircleIcon sx={{ fontSize: 30 }} />
                                                                        </Avatar>
                                                                        <Typography variant="h5" gutterBottom fontWeight="700">Start New Session</Typography>
                                                                        <Typography variant="body1" color="text.secondary" mb={4}>
                                                                            Select a class to generate a secure, geo-fenced QR code.
                                                                        </Typography>

                                                                        <FormControl fullWidth sx={{ mb: 3, bgcolor: 'white' }} variant="outlined">
                                                                            <InputLabel>Select Class Period</InputLabel>
                                                                            <Select
                                                                                value={selectedMapId}
                                                                                label="Select Class Period"
                                                                                onChange={(e) => setSelectedMapId(e.target.value)}
                                                                            >
                                                                                {loading ? <MenuItem disabled>Loading Classes...</MenuItem> :
                                                                                    classes.map((map) => (
                                                                                        <MenuItem key={map.id} value={map.id}>
                                                                                            {map.subject.name} <Typography component="span" variant="caption" color="text.secondary" ml={1}>({map.courseClass.name})</Typography>
                                                                                        </MenuItem>
                                                                                    ))
                                                                                }
                                                                            </Select>
                                                                        </FormControl>

                                                                        <Button
                                                                            variant="contained"
                                                                            size="large"
                                                                            onClick={handleStartSession}
                                                                            disabled={!selectedMapId}
                                                                            fullWidth
                                                                            sx={{
                                                                                py: 2,
                                                                                fontSize: '1.1rem',
                                                                                borderRadius: 3,
                                                                                fontWeight: 700,
                                                                                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)'
                                                                            }}
                                                                        >
                                                                            Launch Session
                                                                        </Button>
                                                                    </Box>
                                                                ) : (
                                                                    <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'secondary.50', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                                        <Typography variant="overline" color="success.main" fontWeight="800" letterSpacing={2}>
                                                                            LIVE SESSION ACTIVE
                                                                        </Typography>

                                                                        <Box sx={{
                                                                            p: 3,
                                                                            bgcolor: 'white',
                                                                            borderRadius: 4,
                                                                            display: 'inline-block',
                                                                            my: 3,
                                                                            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                                                                            mx: 'auto'
                                                                        }}>
                                                                            <QRCode value={qrValue} size={200} />
                                                                        </Box>

                                                                        <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={3}>
                                                                            <TimerIcon color="primary" fontSize="small" />
                                                                            <Typography variant="caption" fontWeight="700" color="primary.main">
                                                                                Auto-refreshing every 10s
                                                                            </Typography>
                                                                        </Box>

                                                                        <Button
                                                                            variant="outlined"
                                                                            color="error"
                                                                            onClick={() => setSession(null)}
                                                                            fullWidth
                                                                            size="large"
                                                                            sx={{ border: '2px solid', fontWeight: 700, borderRadius: 3 }}
                                                                        >
                                                                            End Session
                                                                        </Button>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </Grid>

                                                        {/* Right Side - Map & Status */}
                                                        <Grid item xs={12} md={7}>
                                                            <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                                <Box sx={{
                                                                    flexGrow: 1,
                                                                    bgcolor: '#e0f7fa',
                                                                    position: 'relative',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    minHeight: 300,
                                                                    borderBottom: '1px solid divider',
                                                                    overflow: 'hidden'
                                                                }}>
                                                                    {/* Decorative Map Grid */}
                                                                    <div style={{
                                                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                                        backgroundImage: 'linear-gradient(#cfd8dc 1px, transparent 1px), linear-gradient(90deg, #cfd8dc 1px, transparent 1px)',
                                                                        backgroundSize: '20px 20px',
                                                                        opacity: 0.5
                                                                    }} />

                                                                    {/* Center Point */}
                                                                    <Box sx={{ position: 'absolute', zIndex: 2 }}>
                                                                        <Box sx={{
                                                                            width: 24, height: 24, bgcolor: 'error.main', borderRadius: '50%', border: '4px solid white', boxShadow: 3
                                                                        }} />
                                                                    </Box>

                                                                    {/* Geofence Area */}
                                                                    <Box sx={{
                                                                        width: `${Math.min(radius * 3, 300)}px`,
                                                                        height: `${Math.min(radius * 3, 300)}px`,
                                                                        bgcolor: 'rgba(33, 150, 243, 0.2)',
                                                                        border: '2px solid #2196f3',
                                                                        borderRadius: '50%',
                                                                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                    }} />

                                                                    <Box position="absolute" top={16} right={16}>
                                                                        <Chip
                                                                            label="Geo-Fencing Active"
                                                                            color="primary"
                                                                            size="small"
                                                                            icon={<CheckCircleIcon />}
                                                                            sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 700 }}
                                                                        />
                                                                    </Box>
                                                                </Box>

                                                                <Box sx={{ p: 3 }}>
                                                                    <Typography gutterBottom variant="subtitle2" fontWeight="700" color="text.secondary">
                                                                        SESSION CONFIGURATION
                                                                    </Typography>

                                                                    <Grid container spacing={3} alignItems="center">
                                                                        <Grid item xs={12} sm={8}>
                                                                            <Typography variant="body2" fontWeight="600" mb={1}>
                                                                                Allowable Radius: {radius} meters
                                                                            </Typography>
                                                                            <Slider
                                                                                value={radius}
                                                                                onChange={(e, v) => setRadius(v)}
                                                                                min={10}
                                                                                max={100}
                                                                                disabled={!!session}
                                                                                sx={{ height: 8 }}
                                                                            />
                                                                        </Grid>
                                                                        <Grid item xs={12} sm={4}>
                                                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50', borderColor: 'primary.main' }}>
                                                                                <Typography variant="h4" fontWeight="800" color="primary.main">
                                                                                    {/* Placeholder for attendance count - needs socket/polling */}
                                                                                    0
                                                                                </Typography>
                                                                                <Typography variant="caption" fontWeight="700" color="text.secondary">
                                                                                    STUDENTS PRESENT
                                                                                </Typography>
                                                                            </Paper>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Box>
                                                            </Card>
                                                        </Grid>
                                                    </Grid>
                                                )}

                                                {tabValue === 1 && (
                                                    <Box sx={{ maxWidth: 600, mx: 'auto', py: 2 }}>
                                                        <Box textAlign="center" mb={4}>
                                                            <Typography variant="h5" fontWeight="700">Manual Attendance Override</Typography>
                                                            <Typography color="text.secondary">
                                                                Mark attendance for students with device issues.
                                                            </Typography>
                                                        </Box>

                                                        {session ? (
                                                            <Card variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
                                                                <Grid container spacing={2}>
                                                                    <Grid item xs={12}>
                                                                        <TextField
                                                                            fullWidth
                                                                            label="Student Roll Number"
                                                                            value={manualRollNo}
                                                                            onChange={(e) => setManualRollNo(e.target.value)}
                                                                            placeholder="e.g. 21001A0501"
                                                                            InputProps={{
                                                                                startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>,
                                                                            }}
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12}>
                                                                        <TextField
                                                                            fullWidth
                                                                            label="Reason"
                                                                            multiline
                                                                            rows={2}
                                                                            value={manualReason}
                                                                            onChange={(e) => setManualReason(e.target.value)}
                                                                            placeholder="Why are they being marked manually?"
                                                                        />
                                                                    </Grid>
                                                                    <Grid item xs={12}>
                                                                        <Button
                                                                            variant="contained"
                                                                            color="primary"
                                                                            fullWidth
                                                                            size="large"
                                                                            onClick={handleManualSubmit}
                                                                            startIcon={<CheckCircleIcon />}
                                                                            sx={{ borderRadius: 2, py: 1.5, fontWeight: 700 }}
                                                                        >
                                                                            Mark As Present
                                                                        </Button>
                                                                    </Grid>
                                                                </Grid>

                                                                {manualMessage && (
                                                                    <Fade in>
                                                                        <Box
                                                                            sx={{
                                                                                mt: 3,
                                                                                p: 2,
                                                                                bgcolor: manualMessage.includes("Success") ? 'success.50' : 'error.50',
                                                                                color: manualMessage.includes("Success") ? 'success.dark' : 'error.dark',
                                                                                borderRadius: 2,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 1
                                                                            }}
                                                                        >
                                                                            {manualMessage.includes("Success") ? <CheckCircleIcon /> : <WarningIcon />}
                                                                            <Typography fontWeight="600">{manualMessage}</Typography>
                                                                        </Box>
                                                                    </Fade>
                                                                )}
                                                            </Card>
                                                        ) : (
                                                            <Paper
                                                                elevation={0}
                                                                sx={{
                                                                    p: 4,
                                                                    bgcolor: 'warning.50',
                                                                    color: 'warning.dark',
                                                                    borderRadius: 4,
                                                                    textAlign: 'center',
                                                                    border: '1px dashed',
                                                                    borderColor: 'warning.main'
                                                                }}
                                                            >
                                                                <WarningIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                                                <Typography variant="h6" fontWeight="bold">No Active Session</Typography>
                                                                <Typography>You must start a class session to mark manual attendance.</Typography>
                                                            </Paper>
                                                        )}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Fade>
                        )}

                        {activeSection !== 'session' && (
                            <Box display="flex" justifyContent="center" alignItems="center" height="60vh" flexDirection="column">
                                <Box
                                    sx={{
                                        width: 200,
                                        height: 200,
                                        bgcolor: 'grey.100',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 3
                                    }}
                                >
                                    <DashboardIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
                                </Box>
                                <Typography variant="h5" color="text.secondary" fontWeight="700">Module Under Construction</Typography>
                                <Typography color="text.disabled">This feature will be available in the next update.</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default FacultyDashboard;
