import React, { useState } from "react";
import { Container, Typography, AppBar, Toolbar, IconButton, Button, Box, Grid, Card, CardContent } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';

const HODDashboard = () => {
    const { logout } = useAuth();

    // Mock Data for now
    const stats = {
        totalFaculty: 12,
        totalStudents: 145,
        avgAttendance: 82.5
    };

    return (
        <Box sx={{ flexGrow: 1, height: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="static" color="primary" elevation={0}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        HOD Dashboard - Dept. of Computer Science
                    </Typography>
                    <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>Logout</Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* Stats */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography color="textSecondary">Total Faculty</Typography>
                                        <Typography variant="h3" color="primary">{stats.totalFaculty}</Typography>
                                    </Box>
                                    <PeopleIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography color="textSecondary">Total Students</Typography>
                                        <Typography variant="h3" color="secondary">{stats.totalStudents}</Typography>
                                    </Box>
                                    <ClassIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography color="textSecondary">Dept. Avg Attendance</Typography>
                                        <Typography variant="h3" color="success.main">{stats.avgAttendance}%</Typography>
                                    </Box>
                                    <BarChartIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Main Section */}
                <Typography variant="h5" gutterBottom>Department Analytics</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
                            <Typography color="textSecondary">Attendance Trend Chart (Placeholder)</Typography>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default HODDashboard;
