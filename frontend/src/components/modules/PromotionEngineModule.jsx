import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    AlertTitle,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    LinearProgress,
    TextField,
} from '@mui/material';
import {
    PlayArrow as PlayArrowIcon,
    Undo as UndoIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { promotionAPI, departmentAPI } from '../../services/api';

const PromotionEngineModule = ({ userDepartment }) => {
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(userDepartment || '');
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [academicYear, setAcademicYear] = useState('2024-2025');
    const [eligibleStudents, setEligibleStudents] = useState([]);
    const [promotionData, setPromotionData] = useState({});
    const [promotionResult, setPromotionResult] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const loadDepartments = useCallback(async () => {
        try {
            const data = await departmentAPI.getActive();
            setDepartments(data);
        } catch (error) {
            console.error('Failed to load departments:', error);
        }
    }, []);

    const loadEligibleStudents = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await promotionAPI.getEligibleStudents(selectedDepartment, selectedSemester);
            setEligibleStudents(data);

            // Initialize promotion data
            const initialData = {};
            data.forEach(student => {
                initialData[student.rollNumber] = {
                    passed: false,
                    backlogs: 0,
                };
            });
            setPromotionData(initialData);
        } catch (error) {
            console.error('Failed to load eligible students:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDepartment, selectedSemester]);

    const loadStatistics = useCallback(async () => {
        try {
            const stats = await promotionAPI.getStatistics(selectedDepartment, academicYear);
            setStatistics(stats);
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }, [selectedDepartment, academicYear]);

    useEffect(() => {
        void loadDepartments();
    }, [loadDepartments]);

    useEffect(() => {
        if (selectedDepartment && selectedSemester) {
            void loadEligibleStudents();
            void loadStatistics();
        }
    }, [selectedDepartment, selectedSemester, academicYear, loadEligibleStudents, loadStatistics]);

    const handlePromotionDataChange = (rollNumber, field, value) => {
        setPromotionData(prev => ({
            ...prev,
            [rollNumber]: {
                ...prev[rollNumber],
                [field]: value,
            },
        }));
    };

    const handleExecutePromotion = async () => {
        try {
            setIsLoading(true);
            const result = await promotionAPI.execute(
                selectedDepartment,
                selectedSemester,
                academicYear,
                promotionData
            );
            setPromotionResult(result);
            setConfirmDialogOpen(false);
            loadStatistics(); // Reload statistics
            alert('Promotion executed successfully!');
        } catch (error) {
            alert('Promotion failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleReversePromotion = async () => {
        if (!window.confirm('Are you sure you want to reverse this promotion? This action requires admin privileges.')) {
            return;
        }

        try {
            setIsLoading(true);
            const count = await promotionAPI.reverse(selectedDepartment, selectedSemester, academicYear);
            alert(`Successfully reversed promotion for ${count} students`);
            loadEligibleStudents();
            loadStatistics();
        } catch (error) {
            alert('Reversal failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const getPromotionStatus = (rollNumber) => {
        const data = promotionData[rollNumber];
        if (!data) return 'UNKNOWN';
        if (data.passed) return 'PROMOTED';
        if (data.backlogs > 0 && data.backlogs <= 3) return 'CONDITIONAL';
        return 'DETAINED';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PROMOTED':
                return 'success';
            case 'CONDITIONAL':
                return 'warning';
            case 'DETAINED':
                return 'error';
            default:
                return 'default';
        }
    };

    const previewCounts = Object.keys(promotionData).reduce(
        (acc, rollNumber) => {
            const status = getPromotionStatus(rollNumber);
            if (status === 'PROMOTED') acc.promoted++;
            else if (status === 'CONDITIONAL') acc.conditional++;
            else if (status === 'DETAINED') acc.detained++;
            return acc;
        },
        { promoted: 0, conditional: 0, detained: 0 }
    );

    return (
        <Box sx={{ maxWidth: 1400 }}>
            {/* Context Selectors */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                        Semester Promotion Engine
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={selectedDepartment}
                                    label="Department"
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    disabled={!!userDepartment} // HOD can't change department
                                >
                                    {departments.map((dept) => (
                                        <MenuItem key={dept.code} value={dept.code}>
                                            {dept.name} ({dept.code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Current Semester</InputLabel>
                                <Select
                                    value={selectedSemester}
                                    label="Current Semester"
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                        <MenuItem key={sem} value={sem}>
                                            Semester {sem}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Academic Year"
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                placeholder="2024-2025"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={loadEligibleStudents}
                                sx={{ height: '100%' }}
                            >
                                Load Students
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Statistics Dashboard */}
            {statistics && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <CardContent>
                                <Typography variant="h3" fontWeight="bold">
                                    {statistics.promoted}
                                </Typography>
                                <Typography variant="body2">Promoted</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                            <CardContent>
                                <Typography variant="h3" fontWeight="bold">
                                    {statistics.conditional}
                                </Typography>
                                <Typography variant="body2">Conditional</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
                            <CardContent>
                                <Typography variant="h3" fontWeight="bold">
                                    {statistics.detained}
                                </Typography>
                                <Typography variant="body2">Detained</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <CardContent>
                                <Typography variant="h3" fontWeight="bold">
                                    {statistics.promotionRate?.toFixed(1)}%
                                </Typography>
                                <Typography variant="body2">Promotion Rate</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Preview Section */}
            {eligibleStudents.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Promotion Preview
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Chip icon={<CheckCircleIcon />} label={`Promoted: ${previewCounts.promoted}`} color="success" />
                                <Chip label={`Conditional: ${previewCounts.conditional}`} color="warning" />
                                <Chip label={`Detained: ${previewCounts.detained}`} color="error" />
                            </Stack>
                        </Stack>

                        {isLoading && <LinearProgress sx={{ mb: 2 }} />}

                        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Roll Number</strong></TableCell>
                                        <TableCell><strong>Name</strong></TableCell>
                                        <TableCell><strong>Current Sem</strong></TableCell>
                                        <TableCell><strong>Passed</strong></TableCell>
                                        <TableCell><strong>Backlogs</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {eligibleStudents.map((student) => (
                                        <TableRow key={student.rollNumber}>
                                            <TableCell>{student.rollNumber}</TableCell>
                                            <TableCell>{student.firstName} {student.lastName}</TableCell>
                                            <TableCell>{student.currentSemester}</TableCell>
                                            <TableCell>
                                                <Select
                                                    size="small"
                                                    value={promotionData[student.rollNumber]?.passed || false}
                                                    onChange={(e) => handlePromotionDataChange(student.rollNumber, 'passed', e.target.value)}
                                                >
                                                    <MenuItem value={true}>Yes</MenuItem>
                                                    <MenuItem value={false}>No</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={promotionData[student.rollNumber]?.backlogs || 0}
                                                    onChange={(e) => handlePromotionDataChange(student.rollNumber, 'backlogs', parseInt(e.target.value) || 0)}
                                                    inputProps={{ min: 0, max: 10, style: { width: 60 } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getPromotionStatus(student.rollNumber)}
                                                    color={getStatusColor(getPromotionStatus(student.rollNumber))}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<UndoIcon />}
                                onClick={handleReversePromotion}
                            >
                                Reverse Promotion
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<PlayArrowIcon />}
                                onClick={() => setConfirmDialogOpen(true)}
                                disabled={eligibleStudents.length === 0}
                                size="large"
                            >
                                Execute Promotion
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            {/* Promotion Result */}
            {promotionResult && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    <AlertTitle>Promotion Completed Successfully!</AlertTitle>
                    <Typography variant="body2">
                        • Promoted: {promotionResult.promoted} students<br />
                        • Conditional: {promotionResult.conditionalPromoted} students<br />
                        • Detained: {promotionResult.detained} students<br />
                        • Total: {promotionResult.totalStudents} students processed
                    </Typography>
                </Alert>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirm Bulk Promotion</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <AlertTitle>Warning</AlertTitle>
                        This action will update student records and cannot be easily undone.
                    </Alert>
                    <Typography variant="body1" gutterBottom>
                        You are about to promote {eligibleStudents.length} students:
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 2 }}>
                        <Typography>• Promoted: <strong>{previewCounts.promoted}</strong></Typography>
                        <Typography>• Conditional: <strong>{previewCounts.conditional}</strong></Typography>
                        <Typography>• Detained: <strong>{previewCounts.detained}</strong></Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleExecutePromotion}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Confirm Promotion'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PromotionEngineModule;
