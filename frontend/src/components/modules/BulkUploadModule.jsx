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
        // Build CSV with comprehensive headers and multiple example rows
        const studentHeaders = [
            'firstName', 'lastName', 'email', 'contactNumber', 'gender',
            'rollNumber', 'departmentCode', 'program', 'currentSemester',
            'section', 'admissionYear', 'status'
        ];

        const studentExamples = [
            ['Ravi', 'Kumar', 'ravi.kumar@college.edu', '9876543210', 'MALE', '22B91A0501', 'CSE', 'UG', '3', 'A', '2022', 'ACTIVE'],
            ['Priya', 'Sharma', 'priya.sharma@college.edu', '9876543211', 'FEMALE', '22B91A0502', 'ECE', 'UG', '3', 'B', '2022', 'ACTIVE'],
            ['Amit', 'Singh', 'amit.singh@college.edu', '9876543212', 'MALE', '22B91A0503', 'MECH', 'UG', '3', 'A', '2022', 'ACTIVE'],
            ['Sneha', 'Patel', 'sneha.patel@college.edu', '9876543213', 'FEMALE', '22B91A0504', 'CIVIL', 'UG', '3', 'C', '2022', 'ACTIVE'],
            ['Rahul', 'Verma', 'rahul.verma@college.edu', '9876543214', 'MALE', '22B91A0505', 'CSE', 'UG', '3', 'B', '2022', 'ACTIVE']
        ];

        const facultyHeaders = [
            'firstName', 'lastName', 'email', 'contactNumber', 'gender',
            'facultyId', 'departmentCode', 'role', 'designation', 'qualifications',
            'joiningDate', 'employmentStatus'
        ];

        const facultyExamples = [
            ['Dr. Suresh', 'Reddy', 'suresh.reddy@college.edu', '9876543215', 'MALE', 'FAC001', 'CSE', 'FACULTY', 'Assistant Professor', 'M.Tech, Ph.D.', '2020-06-01', 'ACTIVE'],
            ['Prof. Meera', 'Iyer', 'meera.iyer@college.edu', '9876543216', 'FEMALE', 'FAC002', 'ECE', 'FACULTY', 'Associate Professor', 'M.E., Ph.D.', '2018-07-15', 'ACTIVE'],
            ['Dr. Rajesh', 'Gupta', 'rajesh.gupta@college.edu', '9876543217', 'MALE', 'FAC003', 'MECH', 'HOD', 'Professor', 'B.E., M.Tech, Ph.D.', '2015-01-10', 'ACTIVE'],
            ['Ms. Kavita', 'Sharma', 'kavita.sharma@college.edu', '9876543218', 'FEMALE', 'FAC004', 'CIVIL', 'FACULTY', 'Lecturer', 'B.Tech, M.Tech', '2021-08-20', 'ACTIVE'],
            ['Dr. Vikram', 'Singh', 'vikram.singh@college.edu', '9876543219', 'MALE', 'FAC005', 'CSE', 'PRINCIPAL', 'Principal', 'B.Tech, M.Tech, Ph.D.', '2010-06-01', 'ACTIVE']
        ];

        const headers = type === 'student' ? studentHeaders : facultyHeaders;
        const examples = type === 'student' ? studentExamples : facultyExamples;

        // Create CSV content with headers and examples
        let csvContent = headers.join(',') + '\n';
        examples.forEach(example => {
            csvContent += example.map(field => `"${field}"`).join(',') + '\n';
        });

        // Add instructions as comments at the top
        const instructions = type === 'student'
            ? `# Student Bulk Upload Template
# Instructions:
# 1. Do not modify the header row
# 2. Fill in one row per student
# 3. Required fields: firstName, lastName, email, rollNumber, departmentCode
# 4. Email must be unique and valid
# 5. Roll number must be unique
# 6. Department code must exist in the system (e.g., CSE, ECE, MECH, CIVIL)
# 7. Gender: MALE or FEMALE
# 8. Program: UG or PG
# 9. Current semester: 1-8 for UG, 1-4 for PG
# 10. Section: A, B, C, etc.
# 11. Status: ACTIVE or INACTIVE
#
`
            : `# Faculty Bulk Upload Template
# Instructions:
# 1. Do not modify the header row
# 2. Fill in one row per faculty member
# 3. Required fields: firstName, lastName, email, facultyId, departmentCode
# 4. Email must be unique and valid
# 5. Faculty ID must be unique
# 6. Department code must exist in the system (e.g., CSE, ECE, MECH, CIVIL)
# 7. Role: FACULTY, HOD, or PRINCIPAL
# 8. Gender: MALE or FEMALE
# 9. Employment Status: ACTIVE or INACTIVE
# 10. Date format for joiningDate: YYYY-MM-DD
#
`;

        csvContent = instructions + csvContent;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_bulk_upload_template.csv`;
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
            <Typography variant="h5" gutterBottom fontWeight={600} color="primary">
                Bulk Upload {type === 'student' ? 'Students' : 'Faculty'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Upload multiple {type === 'student' ? 'students' : 'faculty members'} at once using a CSV or Excel file
            </Typography>

            <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
                <AlertTitle>How to use bulk upload:</AlertTitle>
                <Typography variant="body2" component="div">
                    <ol style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>Download the template file below</li>
                        <li>Fill in the data following the format and instructions in the template</li>
                        <li>Save as CSV or Excel (.xlsx) format</li>
                        <li>Upload the file and validate before confirming</li>
                    </ol>
                </Typography>
            </Alert>

            <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                sx={{ mb: 4, px: 4, py: 1.5 }}
                size="large"
            >
                Download {type === 'student' ? 'Student' : 'Faculty'} Template
            </Button>

            <Box
                sx={{
                    border: '2px dashed',
                    borderColor: file ? 'success.main' : 'divider',
                    borderRadius: 3,
                    p: 6,
                    mb: 3,
                    bgcolor: file ? 'success.light' : 'background.default',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                        transform: 'scale(1.02)',
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
                {file ? (
                    <>
                        <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" gutterBottom color="success.main">
                            File Selected: {file.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Click to change file or proceed to validate
                        </Typography>
                    </>
                ) : (
                    <>
                        <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Click to browse or drag and drop
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            CSV or Excel (.xlsx) files accepted • Max 10MB
                        </Typography>
                    </>
                )}
            </Box>

            {file && (
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleValidate}
                    disabled={isValidating}
                    sx={{ minWidth: 200, py: 1.5 }}
                    startIcon={isValidating ? null : <CheckCircleIcon />}
                >
                    {isValidating ? (
                        <>
                            <LinearProgress sx={{ width: '100%', mr: 2 }} />
                            Validating...
                        </>
                    ) : (
                        'Validate Upload'
                    )}
                </Button>
            )}
        </Box>
    );

    const renderPreviewTab = () => {
        if (!validationResult) return null;

        // Backend returns: { totalRecords, validRecords, invalidRecords, validData, errors, uploadLogId }
        const rawValidRecords = validationResult.validData || validationResult.validRecords || [];
        const validRecords = rawValidRecords.map((record) => (record?.data ? record.data : record));
        const errors = validationResult.errors || [];
        const totalProcessed = validationResult.totalRecords ?? validationResult.totalProcessed ?? 0;
        const hasErrors = errors && errors.length > 0;
        const successRate = totalProcessed > 0 ? Math.round((validRecords.length / totalProcessed) * 100) : 0;
        const previewFields = validRecords[0] ? Object.keys(validRecords[0]).slice(0, 6) : [];

        return (
            <Box sx={{ p: 3 }}>
                {/* Summary Header */}
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                        Upload Validation Results
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Processed {totalProcessed} records • {successRate}% success rate
                    </Typography>
                </Box>

                {/* Summary Cards */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }} justifyContent="center">
                    <Card sx={{
                        flex: 1,
                        bgcolor: 'success.light',
                        color: 'success.contrastText',
                        maxWidth: 200
                    }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <CheckCircleIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" fontWeight="bold">
                                {validRecords?.length || 0}
                            </Typography>
                            <Typography variant="body2">Valid Records</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{
                        flex: 1,
                        bgcolor: hasErrors ? 'error.light' : 'grey.300',
                        color: hasErrors ? 'error.contrastText' : 'grey.700',
                        maxWidth: 200
                    }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ErrorIcon sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h4" fontWeight="bold">
                                {errors?.length || 0}
                            </Typography>
                            <Typography variant="body2">Errors Found</Typography>
                        </CardContent>
                    </Card>
                    <Card sx={{
                        flex: 1,
                        bgcolor: 'info.light',
                        color: 'info.contrastText',
                        maxWidth: 200
                    }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <UploadIcon sx={{ fontSize: 40, mb: 1 }} />
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
                                            <TableCell>{error.errorMessage || error.message || 'Unknown error'}</TableCell>
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
                                        {previewFields.map((key) => (
                                            <TableCell key={key}><strong>{key}</strong></TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {validRecords.slice(0, 10).map((record, index) => (
                                        <TableRow key={index}>
                                            {previewFields.map((key, i) => (
                                                <TableCell key={i}>{String(record[key] ?? '')}</TableCell>
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
                        Are you sure you want to import {(validationResult?.validData?.length || validationResult?.validRecords?.length || 0)} record(s)?
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
