import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, Button, Grid, Card, CardContent,
    AppBar, Toolbar, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Snackbar, Alert, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress, Fab
} from '@mui/material';
import {
    Logout as LogoutIcon,
    School as SchoolIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Class as ClassIcon,
    Upload as UploadIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { uploadStudents, uploadFaculty, createClass, getClasses, getAdminStats, deleteClass } from '../services/api';

const AdminDashboard = () => {
    const { logout, user } = useAuth();
    const [stats, setStats] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [openStudentUpload, setOpenStudentUpload] = useState(false);
    const [openFacultyUpload, setOpenFacultyUpload] = useState(false);
    const [openCreateClass, setOpenCreateClass] = useState(false);

    // Form states
    const [studentFile, setStudentFile] = useState(null);
    const [facultyFile, setFacultyFile] = useState(null);
    const [newClass, setNewClass] = useState({ name: '', department: '', yearLevel: 1 });

    // UI states
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, classesData] = await Promise.all([
                getAdminStats(),
                getClasses()
            ]);
            setStats(statsData);
            setClasses(classesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            showSnackbar('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleStudentUpload = async () => {
        if (!studentFile) {
            showSnackbar('Please select a file', 'warning');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', studentFile);
            const response = await uploadStudents(formData);
            showSnackbar(`${response.count} students uploaded successfully`, 'success');
            setOpenStudentUpload(false);
            setStudentFile(null);
            fetchData();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to upload students', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleFacultyUpload = async () => {
        if (!facultyFile) {
            showSnackbar('Please select a file', 'warning');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', facultyFile);
            const response = await uploadFaculty(formData);
            showSnackbar(`${response.count} faculty members uploaded successfully`, 'success');
            setOpenFacultyUpload(false);
            setFacultyFile(null);
            fetchData();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to upload faculty', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateClass = async () => {
        if (!newClass.name || !newClass.department) {
            showSnackbar('Please fill all fields', 'warning');
            return;
        }

        try {
            await createClass(newClass);
            showSnackbar('Class created successfully', 'success');
            setOpenCreateClass(false);
            setNewClass({ name: '', department: '', yearLevel: 1 });
            fetchData();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to create class', 'error');
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class?')) return;

        try {
            await deleteClass(id);
            showSnackbar('Class deleted successfully', 'success');
            fetchData();
        } catch (error) {
            showSnackbar('Failed to delete class', 'error');
        }
    };

    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* AppBar */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
                <Toolbar>
                    <DashboardIcon sx={{ mr: 1, fontSize: 28, color: '#667eea' }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, color: '#333' }}>
                        Admin Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ mr: 2, color: '#666' }}>
                        {user?.username}
                    </Typography>
                    <Button onClick={logout} startIcon={<LogoutIcon />} sx={{ color: '#666', fontWeight: 600 }}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                                        <SchoolIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" fontWeight="800" color="primary">
                                            {loading ? '...' : stats?.totalStudents || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Students
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box sx={{ p: 1.5, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                                        <PeopleIcon sx={{ fontSize: 32, color: '#9c27b0' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" fontWeight="800" sx={{ color: '#9c27b0' }}>
                                            {loading ? '...' : stats?.totalFaculty || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Faculty
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                                        <ClassIcon sx={{ fontSize: 32, color: '#4caf50' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" fontWeight="800" sx={{ color: '#4caf50' }}>
                                            {loading ? '...' : stats?.totalClasses || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Classes
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box sx={{ p: 1.5, bgcolor: '#fff3e0', borderRadius: 2 }}>
                                        <PersonIcon sx={{ fontSize: 32, color: '#ff9800' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h4" fontWeight="800" sx={{ color: '#ff9800' }}>
                                            {loading ? '...' : stats?.totalSessions || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Sessions
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={<UploadIcon />}
                            onClick={() => setOpenStudentUpload(true)}
                            sx={{
                                py: 2,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontWeight: 700
                            }}
                        >
                            Upload Students
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={<UploadIcon />}
                            onClick={() => setOpenFacultyUpload(true)}
                            sx={{
                                py: 2,
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                fontWeight: 700
                            }}
                        >
                            Upload Faculty
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenCreateClass(true)}
                            sx={{
                                py: 2,
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                fontWeight: 700
                            }}
                        >
                            Create Class
                        </Button>
                    </Grid>
                </Grid>

                {/* Classes Table */}
                <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="h6" fontWeight="700">
                            Classes
                        </Typography>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Class Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Year Level</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : classes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">No classes found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    classes.map((cls) => (
                                        <TableRow key={cls.id} hover>
                                            <TableCell>{cls.name}</TableCell>
                                            <TableCell>{cls.department}</TableCell>
                                            <TableCell>
                                                <Chip label={`Year ${cls.yearLevel}`} size="small" color="primary" />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteClass(cls.id)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>

            {/* Upload Students Dialog */}
            <Dialog open={openStudentUpload} onClose={() => setOpenStudentUpload(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Students</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload an Excel file (.xlsx) with student data. Required columns:
                    </Typography>
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" component="div">
                            1. Roll No (Username)<br />
                            2. Full Name<br />
                            3. DOB (YYYY-MM-DD)<br />
                            4. Department<br />
                            5. Admission Year<br />
                            6. Gender<br />
                            7. Mobile Number<br />
                            8. Email
                        </Typography>
                    </Box>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setStudentFile(e.target.files[0])}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenStudentUpload(false)}>Cancel</Button>
                    <Button
                        onClick={handleStudentUpload}
                        variant="contained"
                        disabled={uploading || !studentFile}
                    >
                        {uploading ? <CircularProgress size={24} /> : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upload Faculty Dialog */}
            <Dialog open={openFacultyUpload} onClose={() => setOpenFacultyUpload(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Faculty</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload an Excel file (.xlsx) with faculty data. Required columns:
                    </Typography>
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" component="div">
                            1. Employee ID (Username)<br />
                            2. Full Name<br />
                            3. DOB (YYYY-MM-DD)<br />
                            4. Department<br />
                            5. Designation<br />
                            6. Role (FACULTY/HOD/PRINCIPAL)<br />
                            7. Gender<br />
                            8. Mobile Number<br />
                            9. Email
                        </Typography>
                    </Box>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setFacultyFile(e.target.files[0])}
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenFacultyUpload(false)}>Cancel</Button>
                    <Button
                        onClick={handleFacultyUpload}
                        variant="contained"
                        disabled={uploading || !facultyFile}
                    >
                        {uploading ? <CircularProgress size={24} /> : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Class Dialog */}
            <Dialog open={openCreateClass} onClose={() => setOpenCreateClass(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Class Name"
                        value={newClass.name}
                        onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Department"
                        value={newClass.department}
                        onChange={(e) => setNewClass({ ...newClass, department: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Year Level"
                        type="number"
                        value={newClass.yearLevel}
                        onChange={(e) => setNewClass({ ...newClass, yearLevel: parseInt(e.target.value) })}
                        margin="normal"
                        inputProps={{ min: 1, max: 4 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateClass(false)}>Cancel</Button>
                    <Button onClick={handleCreateClass} variant="contained">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminDashboard;
