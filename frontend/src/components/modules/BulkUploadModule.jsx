import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton,
    Alert,
    AlertTitle,
    LinearProgress,
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
    Tabs,
    Tab,
} from '@mui/material';
import {
    Upload as UploadIcon,
    Download as DownloadIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { bulkUploadAPI } from '../../services/api';

const BulkUploadModule = ({ type = 'student' }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [file, setFile] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        const name = selectedFile?.name?.toLowerCase() || '';
        if (selectedFile && (name.endsWith('.xlsx') || name.endsWith('.csv'))) {
            setFile(selectedFile);
            setValidationResult(null);
            setUploadComplete(false);
        } else {
            alert('Please select a valid Excel (.xlsx) or CSV (.csv) file');
        }
    };

    const handleValidate = async () => {
        if (!file) {
            alert('Please select a file first');
            return;
        }

        setIsValidating(true);
        try {
            const result = type === 'student'
                ? await bulkUploadAPI.validateStudentUpload(file)
                : await bulkUploadAPI.validateFacultyUpload(file);

            setValidationResult(result);
            setActiveTab(1); // Switch to preview tab
        } catch (error) {
            alert('Validation failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsValidating(false);
        }
    };

    const handleConfirm = async () => {
        if (!validationResult?.uploadLogId) {
            alert('No validated data to confirm');
            return;
        }

        setIsConfirming(true);
        try {
            const count = type === 'student'
                ? await bulkUploadAPI.confirmStudentUpload(validationResult.uploadLogId)
                : await bulkUploadAPI.confirmFacultyUpload(validationResult.uploadLogId);

            setUploadComplete(true);
            setConfirmDialogOpen(false);
            setActiveTab(2); // Switch to success tab
            alert(`Successfully imported ${count} ${type}(s)`);
        } catch (error) {
            alert('Confirmation failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsConfirming(false);
        }
    };

    const handleDownloadTemplate = () => {
        // Build CSV with correct headers per type
        const studentHeaders = [
            'firstName', 'lastName', 'email', 'contactNumber', 'gender',
            'rollNumber', 'studentId', 'departmentCode', 'program',
            'currentSemester', 'section', 'admissionYear', 'status'
        ];
        const facultyHeaders = [
            'firstName', 'lastName', 'email', 'contactNumber', 'gender',
            'facultyId', 'departmentCode', 'designation', 'qualifications',
            'joiningDate', 'employmentStatus'
        ];

        const studentExample = [
            'Ravi', 'Kumar', 'ravi@college.edu', '9876543210', 'MALE',
            '22B91A0501', '22B91A0501', 'CSE', 'B_TECH',
            '3', 'A', '2022', 'ACTIVE'
        ];
        const facultyExample = [
            'Suresh', 'Reddy', 'suresh@college.edu', '9876543211', 'MALE',
            'FAC001', 'CSE', 'Assistant Professor', 'M.Tech',
            '2020-06-01', 'ACTIVE'
        ];

        const headers = type === 'student' ? studentHeaders : facultyHeaders;
        const example = type === 'student' ? studentExample : facultyExample;

        const csvContent = [
            headers.join(','),
            example.join(','),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_upload_template.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setValidationResult(null);
        setUploadComplete(false);
        setActiveTab(0);
    };

    const renderUploadTab = () => (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
                Upload {type === 'student' ? 'Student' : 'Faculty'} Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Download the template, fill in the data, and upload the Excel file
            </Typography>

            <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                sx={{ mb: 4 }}
            >
                Download Excel Template
            </Button>

            <Box
                sx={{
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 6,
                    mb: 3,
                    bgcolor: 'background.default',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                    },
                }}
                onClick={() => document.getElementById('file-upload').click()}
            >
                <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {file ? file.name : 'Click to browse or drag and drop'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Excel (.xlsx) or CSV (.csv) files accepted
                </Typography>
            </Box>

            {file && (
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleValidate}
                    disabled={isValidating}
                    sx={{ minWidth: 200 }}
                >
                    {isValidating ? 'Validating...' : 'Validate Upload'}
                </Button>
            )}
        </Box>
    );

    const renderPreviewTab = () => {
        if (!validationResult) return null;

        const { validRecords, errors, totalProcessed } = validationResult;
        const hasErrors = errors && errors.length > 0;

        return (
            <Box sx={{ p: 3 }}>
                {/* Summary Cards */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Card sx={{ flex: 1, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <CardContent>
                            <Typography variant="h4" fontWeight="bold">
                                {validRecords?.length || 0}
                            </Typography>
                            <Typography variant="body2">Valid Records</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1, bgcolor: 'error.light', color: 'error.contrastText' }}>
                        <CardContent>
                            <Typography variant="h4" fontWeight="bold">
                                {errors?.length || 0}
                            </Typography>
                            <Typography variant="body2">Errors Found</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{ flex: 1, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <CardContent>
                            <Typography variant="h4" fontWeight="bold">
                                {totalProcessed || 0}
                            </Typography>
                            <Typography variant="body2">Total Processed</Typography>
                        </CardContent>
                    </Card>
                </Stack>

                {/* Errors Table */}
                {hasErrors && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        <AlertTitle>Validation Errors Found</AlertTitle>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Please fix the following errors and re-upload the file:
                        </Typography>
                        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Row</strong></TableCell>
                                        <TableCell><strong>Field</strong></TableCell>
                                        <TableCell><strong>Error Message</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {errors.map((error, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{error.rowNumber}</TableCell>
                                            <TableCell>
                                                <Chip label={error.field} size="small" color="error" variant="outlined" />
                                            </TableCell>
                                            <TableCell>{error.message}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Alert>
                )}

                {/* Valid Records Preview */}
                {validRecords && validRecords.length > 0 && (
                    <>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            <AlertTitle>Ready to Import</AlertTitle>
                            {validRecords.length} valid record(s) are ready to be imported.
                        </Alert>
                        <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 3 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        {Object.keys(validRecords[0] || {}).slice(0, 6).map((key) => (
                                            <TableCell key={key}><strong>{key}</strong></TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {validRecords.slice(0, 10).map((record, index) => (
                                        <TableRow key={index}>
                                            {Object.values(record).slice(0, 6).map((value, i) => (
                                                <TableCell key={i}>{String(value)}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {validRecords.length > 10 && (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                                Showing first 10 of {validRecords.length} records
                            </Typography>
                        )}
                    </>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button variant="outlined" onClick={handleReset}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setConfirmDialogOpen(true)}
                        disabled={hasErrors || !validRecords || validRecords.length === 0}
                    >
                        Confirm Import
                    </Button>
                </Stack>
            </Box>
        );
    };

    const renderSuccessTab = () => (
        <Box sx={{ p: 6, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 96, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight={600}>
                Import Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                All records have been successfully imported into the system.
            </Typography>
            <Button variant="contained" onClick={handleReset}>
                Upload Another File
            </Button>
        </Box>
    );

    return (
        <Card sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                    <Tab label="Upload" />
                    <Tab label="Preview" disabled={!validationResult} />
                    <Tab label="Complete" disabled={!uploadComplete} />
                </Tabs>
            </Box>

            {isValidating && <LinearProgress />}

            <CardContent sx={{ minHeight: 400 }}>
                {activeTab === 0 && renderUploadTab()}
                {activeTab === 1 && renderPreviewTab()}
                {activeTab === 2 && renderSuccessTab()}
            </CardContent>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
                <DialogTitle>Confirm Import</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to import {validationResult?.validRecords?.length || 0} record(s)?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirm}
                        disabled={isConfirming}
                    >
                        {isConfirming ? 'Importing...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default BulkUploadModule;
