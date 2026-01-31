import React, { useState, useEffect } from "react";
import { Container, Typography, Button, Paper, Box, MenuItem, Select, FormControl, InputLabel, AppBar, Toolbar, IconButton, Grid, Card, CardContent, Tabs, Tab, TextField, InputAdornment, Slider } from "@mui/material";
import QRCode from "react-qr-code";
import { getFacultyMappings, createSession, markManualAttendance } from "../services/api";
import { useAuth } from "../context/AuthContext";
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import QrCodeIcon from '@mui/icons-material/QrCode';
import TimerIcon from '@mui/icons-material/Timer';
import PersonIcon from '@mui/icons-material/Person';

const FacultyDashboard = () => {
    const { logout } = useAuth();
    const [classes, setClasses] = useState([]);
    const [selectedMapId, setSelectedMapId] = useState("");
    const [session, setSession] = useState(null);
    const [qrValue, setQrValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [radius, setRadius] = useState(50);

    // Manual Override State
    const [manualRollNo, setManualRollNo] = useState("");
    const [manualReason, setManualReason] = useState("");
    const [manualMessage, setManualMessage] = useState("");

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
            setQrValue(`SESSION:${session.id}`);
            interval = setInterval(() => {
                setQrValue(`SESSION:${session.id}:` + Date.now());
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [session]);

    const handleStartSession = async () => {
        if (!selectedMapId) return;

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const newSession = await createSession({
                    mapId: selectedMapId,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    duration: 5,
                    radius: radius // Pass selected radius
                });
                setSession(newSession);
            } catch (e) {
                alert("Failed to create session");
            }
        }, (err) => {
            alert("Location access required to start session (Geo-fencing)");
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
        } catch (error) {
            setManualMessage("Failed: " + (error.response?.data?.message || "Invalid Roll No"));
        }
    };

    return (
        <Box sx={{ flexGrow: 1, height: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="static" color="primary" elevation={0}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Faculty Dashboard
                    </Typography>
                    <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>Logout</Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                    {/* Welcome Section */}
                    <Grid item xs={12}>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>My Classes</Typography>
                        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                            <Tab label="Start Attendance" />
                            <Tab label="Manual Entry (Override)" />
                        </Tabs>
                    </Grid>

                    {/* Active Session / Create Session Card */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 4, minHeight: 400 }}>
                            {tabValue === 0 && (
                                !session ? (
                                    <Box sx={{ width: '100%', textAlign: 'center' }}>
                                        <QrCodeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                        <Typography variant="h5" gutterBottom>Start Attendance Session</Typography>

                                        <FormControl fullWidth sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                                            <InputLabel>Select Class</InputLabel>
                                            <Select
                                                value={selectedMapId}
                                                label="Select Class"
                                                onChange={(e) => setSelectedMapId(e.target.value)}
                                            >
                                                {loading ? <MenuItem disabled>Loading...</MenuItem> :
                                                    classes.map((map) => (
                                                        <MenuItem key={map.id} value={map.id}>
                                                            {map.subject.name} - {map.courseClass.name}
                                                        </MenuItem>
                                                    ))
                                                }
                                            </Select>
                                        </FormControl>

                                        <Box sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
                                            <Typography gutterBottom>Attendance Radius: {radius}m</Typography>
                                            <Slider
                                                value={radius}
                                                onChange={(e, v) => setRadius(v)}
                                                min={10}
                                                max={100}
                                                valueLabelDisplay="auto"
                                            />
                                        </Box>

                                        <Button variant="contained" size="large" onClick={handleStartSession} disabled={!selectedMapId} sx={{ maxWidth: 400 }}>
                                            Generate QR Code
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h5" color="primary" gutterBottom>
                                            Session Active
                                        </Typography>
                                        <Box sx={{ p: 3, bgcolor: 'white', border: '1px solid #eee', borderRadius: 2, display: 'inline-block', mb: 2 }}>
                                            <QRCode value={qrValue} size={256} />
                                        </Box>
                                        <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={3}>
                                            <TimerIcon color="action" />
                                            <Typography variant="body2">QR rotates every 10s • Session expires in 5m</Typography>
                                        </Box>
                                        <Button variant="outlined" color="error" onClick={() => setSession(null)}>
                                            End Session
                                        </Button>
                                    </Box>
                                )
                            )}

                            {tabValue === 1 && (
                                <Box sx={{ maxWidth: 500, mx: 'auto' }}>
                                    <Typography variant="h6" gutterBottom>Manual Attendance Override</Typography>
                                    <Typography paragraph color="textSecondary">
                                        Use this to mark students who cannot scan the QR code. This action is logged.
                                    </Typography>

                                    {!session ? (
                                        <Typography color="error">You must start a session in the "Start Attendance" tab first.</Typography>
                                    ) : (
                                        <>
                                            <TextField
                                                fullWidth
                                                label="Student Roll Number"
                                                value={manualRollNo}
                                                onChange={(e) => setManualRollNo(e.target.value)}
                                                sx={{ mb: 2 }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <PersonIcon />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                            <TextField
                                                fullWidth
                                                label="Reason (e.g., Camera broken, Tablet issue)"
                                                value={manualReason}
                                                onChange={(e) => setManualReason(e.target.value)}
                                                sx={{ mb: 2 }}
                                            />
                                            <Button variant="contained" color="warning" fullWidth onClick={handleManualSubmit}>
                                                Mark as Present (Manual)
                                            </Button>

                                            {manualMessage && (
                                                <Typography sx={{ mt: 2 }} color={manualMessage.includes("Success") ? "success.main" : "error"}>
                                                    {manualMessage}
                                                </Typography>
                                            )}
                                        </>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Stats Side Panel */}
                    <Grid item xs={12} md={4}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>Today's Classes</Typography>
                                        <Typography variant="h3" color="primary">{classes.length}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>Total Students</Typography>
                                        <Typography variant="h3" color="secondary">64</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default FacultyDashboard;
