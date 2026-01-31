import React from "react";
import { Container, Typography, AppBar, Toolbar, IconButton, Button, Box, Grid, Card, CardContent } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import TimelineIcon from '@mui/icons-material/Timeline';
import ApartmentIcon from '@mui/icons-material/Apartment';

const PrincipalDashboard = () => {
    const { logout } = useAuth();

    return (
        <Box sx={{ flexGrow: 1, height: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="static" color="primary" elevation={0} sx={{ bgcolor: '#4a148c' }}> {/* Different color for Principal */}
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Principal's Overview
                    </Typography>
                    <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>Logout</Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: 'white' }}>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Overall Attendance Today</Typography>
                                <Typography variant="h3" color="primary">78%</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Active Sessions</Typography>
                                <Typography variant="h3" color="secondary">15</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Total Faculty Present</Typography>
                                <Typography variant="h3">45/50</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>Alerts</Typography>
                                <Typography variant="h3" color="error">2</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card sx={{ minHeight: 400 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <TimelineIcon sx={{ mr: 1 }} />
                                    <Typography variant="h6">College Attendance Trends</Typography>
                                </Box>
                                <Box sx={{ height: 300, bgcolor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="textSecondary">Chart goes here</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ minHeight: 400 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <ApartmentIcon sx={{ mr: 1 }} />
                                    <Typography variant="h6">Department Performance</Typography>
                                </Box>
                                <Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2">Computer Science</Typography>
                                        <Box sx={{ width: '100%', height: 10, bgcolor: '#eee', borderRadius: 5 }}>
                                            <Box sx={{ width: '85%', height: '100%', bgcolor: 'success.main', borderRadius: 5 }} />
                                        </Box>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2">Electronics</Typography>
                                        <Box sx={{ width: '100%', height: 10, bgcolor: '#eee', borderRadius: 5 }}>
                                            <Box sx={{ width: '72%', height: '100%', bgcolor: 'warning.main', borderRadius: 5 }} />
                                        </Box>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2">Mechanical</Typography>
                                        <Box sx={{ width: '100%', height: 10, bgcolor: '#eee', borderRadius: 5 }}>
                                            <Box sx={{ width: '65%', height: '100%', bgcolor: 'error.main', borderRadius: 5 }} />
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default PrincipalDashboard;
