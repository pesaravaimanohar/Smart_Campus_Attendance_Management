import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Paper, Button, Grid, Card, CardContent,
    AppBar, Toolbar, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Snackbar, Alert, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, CircularProgress, Fab,
    Tabs, Tab, Avatar, useTheme, Fade, Tooltip, Collapse, LinearProgress,
    FormControl, InputLabel, Select, MenuItem, Radio, RadioGroup, FormControlLabel, FormLabel
} from '@mui/material';
import { alpha } from "@mui/material/styles";
import {
    Logout as LogoutIcon,
    School as SchoolIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Class as ClassIcon,
    Upload as UploadIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Dashboard as DashboardIcon,
    LockReset as LockResetIcon,
    Menu as MenuIcon,
    Search as SearchIcon,
    CloudUpload as CloudUploadIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { uploadStudents, uploadFaculty, createClass, getClasses, getAdminStats, deleteClass, resetAllUsers } from '../services/api';
import ChangePasswordDialog from '../components/ChangePasswordDialog';
// ThemeToggle removed
import GlobalHeader from '../components/GlobalHeader';

const UG_BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEM'];
const PG_BRANCHES = ['M.Tech', 'MCA', 'MBA'];

const AdminDashboard = () => {
    const { logout, user } = useAuth();
    const theme = useTheme();
    const [stats, setStats] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    // Navigation State
    const [activeSection, setActiveSection] = useState('dashboard');
    const [showSidebar, setShowSidebar] = useState(true);

    // Dialog states
    const [openCreateClass, setOpenCreateClass] = useState(false);
    const [openChangePassword, setOpenChangePassword] = useState(false);

    // Form states
    const [studentFile, setStudentFile] = useState(null);
    const [facultyFile, setFacultyFile] = useState(null);


    // Create Class Form State
    const [graduationLevel, setGraduationLevel] = useState('UG');
    const [classNameInput, setClassNameInput] = useState('');
    const [section, setSection] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [yearLevel, setYearLevel] = useState(1);

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
            setFacultyFile(null);
            fetchData();
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'Failed to upload faculty', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateClass = async () => {
        if (!classNameInput || !section || !selectedBranch) {
            showSnackbar('Please fill all fields', 'warning');
            return;
        }

        const fullClassName = `${classNameInput}-${section}`;

        try {
            await createClass({
                name: fullClassName,
                department: selectedBranch,
                yearLevel: yearLevel
            });
            showSnackbar('Class created successfully', 'success');
            setOpenCreateClass(false);

            // Reset form
            setClassNameInput('');
            setSection('');
            setSelectedBranch('');
            setYearLevel(1);
            setGraduationLevel('UG');

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

    const handleResetUsers = async () => {
        if (!window.confirm('Are you sure you want to reset ALL users to first login status? This will force everyone to change their password on next login.')) return;

        try {
            await resetAllUsers();
            showSnackbar('All users have been reset to first login status', 'success');
        } catch (error) {
            showSnackbar('Failed to reset users', 'error');
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
        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
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
                        <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h6" fontWeight="800" color="text.primary" lineHeight={1.2}>ADMIN</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight="600">Control Panel</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1, mt: 3, overflowY: 'auto' }}>
                        <Typography variant="overline" color="text.disabled" sx={{ px: 4, mb: 1, display: 'block' }}>Overview</Typography>
                        <SidebarItem icon={<DashboardIcon />} label="Dashboard" value="dashboard" />

                        <Typography variant="overline" color="text.disabled" sx={{ px: 4, mb: 1, mt: 2, display: 'block' }}>Management</Typography>
                        <SidebarItem icon={<ClassIcon />} label="Classes" value="classes" />
                        <SidebarItem icon={<PeopleIcon />} label="Students" value="students" />
                        <SidebarItem icon={<SchoolIcon />} label="Faculty" value="faculty" />

                        <Typography variant="overline" color="text.disabled" sx={{ px: 4, mb: 1, mt: 2, display: 'block' }}>System</Typography>
                        <SidebarItem icon={<LockResetIcon />} label="Security" value="security" />
                    </Box>

                    <Box sx={{ p: 3, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Avatar
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.username}`}
                                sx={{ width: 48, height: 48, border: '2px solid', borderColor: 'primary.main' }}
                            />
                            <Box overflow="hidden">
                                <Typography variant="subtitle2" fontWeight="bold" noWrap>{user?.firstName || 'Admin'}</Typography>
                                <Typography variant="caption" color="text.secondary">System Admin</Typography>
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
                        p: 2, px: 4,
                        bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(11, 17, 33, 0.8)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid', borderColor: 'divider',
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
                            <TextField
                                placeholder="Quick Search..."
                                size="small"
                                InputProps={{
                                    startAdornment: <SearchIcon color="action" sx={{ mr: 1, fontSize: 20 }} />,
                                    sx: { borderRadius: 4, bgcolor: 'grey.50', '& fieldset': { border: 'none' }, minWidth: 250 }
                                }}
                            />
                            <IconButton color="primary">
                                <CheckCircleIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    <Container maxWidth="xl" sx={{ py: 4 }}>
                        <Fade in timeout={500}>
                            <Box>
                                {/* VIEW: DASHBOARD */}
                                {activeSection === 'dashboard' && (
                                    <Grid container spacing={4}>
                                        {!loading && (
                                            <>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={<PeopleIcon />} color={theme.palette.primary.main} />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <StatCard title="Total Faculty" value={stats?.totalFaculty || 0} icon={<SchoolIcon />} color={theme.palette.secondary.main} />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <StatCard title="Total Classes" value={stats?.totalClasses || 0} icon={<ClassIcon />} color={theme.palette.success.main} />
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={3}>
                                                    <StatCard title="Active Sessions" value={stats?.totalSessions || 0} icon={<DashboardIcon />} color={theme.palette.warning.main} />
                                                </Grid>
                                            </>
                                        )}

                                        {/* Action Cards Removed */}
                                    </Grid>
                                )}

                                {/* VIEW: CLASSES */}
                                {activeSection === 'classes' && (
                                    <Box>
                                        <Box display="flex" justifyContent="flex-end" mb={3}>
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={() => setOpenCreateClass(true)}
                                                size="large"
                                                sx={{ borderRadius: 3, textTransform: 'none', px: 3, fontWeight: 'bold' }}
                                            >
                                                Create Class
                                            </Button>
                                        </Box>
                                        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                            <TableContainer>
                                                <Table>
                                                    <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : 'grey.50' }}>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>CLASS NAME</TableCell>
                                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>DEPARTMENT</TableCell>
                                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>YEAR LEVEL</TableCell>
                                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }} align="right">ACTIONS</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {loading ? (
                                                            <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={30} /></TableCell></TableRow>
                                                        ) : classes.map((cls) => (
                                                            <TableRow key={cls.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                <TableCell fontWeight="600">{cls.name}</TableCell>
                                                                <TableCell>{cls.department}</TableCell>
                                                                <TableCell>
                                                                    <Chip label={`Year ${cls.yearLevel}`} size="small" sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 'bold' }} />
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Tooltip title="Delete Class">
                                                                        <IconButton size="small" color="error" onClick={() => handleDeleteClass(cls.id)}>
                                                                            <DeleteIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {classes.length === 0 && !loading && (
                                                            <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled' }}>No classes found</TableCell></TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Paper>
                                    </Box>
                                )}

                                {/* VIEW: STUDENTS / FACULTY (Uploads) */}
                                {(activeSection === 'students' || activeSection === 'faculty') && (
                                    <Grid container spacing={4} justifyContent="center">
                                        <Grid item xs={12} md={8}>
                                            <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', transition: 'border-color 0.3s', '&:hover': { borderColor: 'primary.main' } }}>
                                                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 3, bgcolor: 'primary.50', color: 'primary.main' }}>
                                                    <CloudUploadIcon sx={{ fontSize: 40 }} />
                                                </Avatar>
                                                <Typography variant="h4" fontWeight="800" gutterBottom>
                                                    Upload {activeSection === 'students' ? 'Students' : 'Faculty'} Data
                                                </Typography>
                                                <Typography color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 4 }}>
                                                    Bulk upload users via Excel file (.xlsx or .xls). Ensure your file follows the standard template format.
                                                </Typography>

                                                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                                    <Button
                                                        component="label"
                                                        variant="outlined"
                                                        size="large"
                                                        startIcon={<UploadIcon />}
                                                        sx={{ py: 1.5, px: 4, borderRadius: 3, textTransform: 'none' }}
                                                    >
                                                        Select File
                                                        <input type="file" hidden accept=".xlsx,.xls" onChange={(e) => activeSection === 'students' ? setStudentFile(e.target.files[0]) : setFacultyFile(e.target.files[0])} />
                                                    </Button>

                                                    <Alert severity="info" sx={{ mt: 2, textAlign: 'left', width: '100%', maxWidth: 600 }}>
                                                        <Typography variant="subtitle2" fontWeight="bold">Excel Template Format:</Typography>
                                                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                                            <li><b>Row 1 (Header):</b> Must match exactly.</li>
                                                            {activeSection === 'students' ? (
                                                                <>
                                                                    <li><b>Columns:</b> Roll Number, Name, Date of Birth (DD-MM-YYYY), Email, Phone, Department, Year, Section</li>
                                                                    <li><b>Example:</b> 219X1A0501, John Doe, 15-08-2003, john@example.com, 9876543210, CSE, 4, A</li>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <li><b>Columns:</b> Employee ID, Name, Date of Birth (DD-MM-YYYY), Email, Phone, Department, Designation</li>
                                                                    <li><b>Example:</b> EMP101, Dr. Smith, 20-05-1980, smith@college.edu, 9876543210, CSE, Professor</li>
                                                                </>
                                                            )}
                                                        </ul>
                                                    </Alert>

                                                    {(studentFile || facultyFile) && (
                                                        <Fade in>
                                                            <Box mt={2}>
                                                                <Chip
                                                                    label={activeSection === 'students' ? studentFile.name : facultyFile.name}
                                                                    onDelete={() => activeSection === 'students' ? setStudentFile(null) : setFacultyFile(null)}
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            </Box>
                                                        </Fade>
                                                    )}

                                                    <Button
                                                        variant="contained"
                                                        size="large"
                                                        onClick={activeSection === 'students' ? handleStudentUpload : handleFacultyUpload}
                                                        disabled={uploading || (activeSection === 'students' ? !studentFile : !facultyFile)}
                                                        sx={{ mt: 2, minWidth: 200, py: 1.5, borderRadius: 3, fontWeight: 'bold' }}
                                                    >
                                                        {uploading ? <CircularProgress size={24} color="inherit" /> : 'Start Upload'}
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                )}

                                {/* VIEW: SECURITY */}
                                {activeSection === 'security' && (
                                    <Grid container spacing={4} justifyContent="center">
                                        <Grid item xs={12} md={6}>
                                            <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
                                                <Box sx={{ p: 4, bgcolor: 'error.main', color: 'white' }}>
                                                    <LockResetIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                                                    <Typography variant="h5" fontWeight="bold">Emergency Security Actions</Typography>
                                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Advanced controls for system security.</Typography>
                                                </Box>
                                                <CardContent sx={{ p: 4 }}>
                                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Reset All Users</Typography>
                                                    <Typography color="text.secondary" paragraph>
                                                        This action will force a password reset for <b>every user</b> in the system upon their next login. Use this only if you suspect a security breach or at the start of a new semester.
                                                    </Typography>

                                                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                                                        This action cannot be undone. All active sessions might be terminated.
                                                    </Alert>

                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={handleResetUsers}
                                                        fullWidth
                                                        size="large"
                                                        startIcon={<WarningIcon />}
                                                        sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold', border: '2px solid' }}
                                                    >
                                                        Execute Global Reset
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                )}
                            </Box>
                        </Fade>
                    </Container>
                </Box>

                {/* Create Class Dialog */}
                <Dialog
                    open={openCreateClass}
                    onClose={() => setOpenCreateClass(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Add New Class</DialogTitle>
                    <DialogContent>
                        <Typography color="text.secondary" variant="body2" mb={2}>Fill in the details to create a new class.</Typography>
                        <FormControl component="fieldset" margin="normal">
                            <FormLabel component="legend">Graduation Level</FormLabel>
                            <RadioGroup
                                row
                                value={graduationLevel}
                                onChange={(e) => {
                                    setGraduationLevel(e.target.value);
                                    setSelectedBranch(''); // Reset branch on switch
                                }}
                            >
                                <FormControlLabel value="UG" control={<Radio />} label="Undergraduate (B.Tech)" />
                                <FormControlLabel value="PG" control={<Radio />} label="Postgraduate (M.Tech/MCA)" />
                            </RadioGroup>
                        </FormControl>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth label="Class Name (e.g. IV B.Tech)" margin="dense" variant="outlined"
                                    value={classNameInput} onChange={(e) => setClassNameInput(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth label="Section (e.g. A)" margin="dense" variant="outlined"
                                    value={section} onChange={(e) => setSection(e.target.value)}
                                />
                            </Grid>
                        </Grid>

                        <FormControl fullWidth margin="dense" variant="outlined" sx={{ mt: 2 }}>
                            <InputLabel>Department / Branch</InputLabel>
                            <Select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                label="Department / Branch"
                            >
                                {(graduationLevel === 'UG' ? UG_BRANCHES : PG_BRANCHES).map((branch) => (
                                    <MenuItem key={branch} value={branch}>{branch}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth label="Year Level" type="number" margin="dense" variant="outlined"
                            value={yearLevel} onChange={(e) => setYearLevel(parseInt(e.target.value))}
                            inputProps={{ min: 1, max: 4 }}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setOpenCreateClass(false)} color="inherit">Cancel</Button>
                        <Button onClick={handleCreateClass} variant="contained" sx={{ px: 3, borderRadius: 2 }}>Create Class</Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    );

};

export default AdminDashboard;
