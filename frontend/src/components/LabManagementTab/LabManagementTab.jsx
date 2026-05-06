import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Card, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Tooltip, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { adminDataAPI } from '../../services/api';

// Table styles helper
const useTableStyles = () => ({
    thBg: '#f5f5f5',
    thColor: '#666',
    tableBorder: '#e0e0e0',
    tdEmpty: '#999',
});

/**
 * LabManagementTab Component
 * Manages lab creation and faculty assignments
 */
export default function LabManagementTab({ push }) {
    const ts = useTableStyles();
    const [labs, setLabs] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [classes, setClasses] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createLabOpen, setCreateLabOpen] = useState(false);
    const [assignFacultyOpen, setAssignFacultyOpen] = useState(false);
    const [selectedLab, setSelectedLab] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [search, setSearch] = useState('');

    const [createForm, setCreateForm] = useState({ labName: '', labCode: '' });
    const [assignForm, setAssignForm] = useState({ faculty1Id: '', faculty2Id: '', faculty3Id: '' });

    // Load all required data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [labsRes, facultyRes, classesRes, yearsRes] = await Promise.all([
                adminDataAPI.request('GET', '/admin/labs/list'),
                adminDataAPI.request('GET', '/faculty'),
                adminDataAPI.request('GET', '/classes'),
                adminDataAPI.request('GET', '/academic-years'),
            ]);
            setLabs(Array.isArray(labsRes) ? labsRes : labsRes.data || []);
            setFaculty(Array.isArray(facultyRes) ? facultyRes : facultyRes.data || []);
            setClasses(Array.isArray(classesRes) ? classesRes : classesRes.data || []);
            setAcademicYears(Array.isArray(yearsRes) ? yearsRes : yearsRes.data || []);
        } catch (error) {
            push('Failed to load data: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [push]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Create new lab
    const handleCreateLab = async (e) => {
        e.preventDefault();
        if (!createForm.labName.trim() || !createForm.labCode.trim()) {
            push('Lab name and code are required', 'error');
            return;
        }

        try {
            await adminDataAPI.request('POST', '/admin/labs/create', null, {
                labName: createForm.labName,
                labCode: createForm.labCode,
            });
            push('Lab created successfully');
            setCreateForm({ labName: '', labCode: '' });
            setCreateLabOpen(false);
            loadData();
        } catch (error) {
            push('Failed to create lab: ' + error.message, 'error');
        }
    };

    // Assign faculty to lab
    const handleAssignFaculty = async (e) => {
        e.preventDefault();
        if (!selectedLab || !selectedClass || !selectedYear) {
            push('Please select lab, class, and academic year', 'error');
            return;
        }

        const facultyIds = [
            assignForm.faculty1Id,
            assignForm.faculty2Id,
            assignForm.faculty3Id,
        ].filter(id => id);

        if (facultyIds.length !== 3) {
            push('Exactly 3 faculty members must be selected', 'error');
            return;
        }

        try {
            await adminDataAPI.request('POST', `/admin/labs/${selectedLab.id}/faculty`, null, {
                facultyIds: facultyIds.map(id => parseInt(id)),
                classId: parseInt(selectedClass),
                academicYearId: parseInt(selectedYear),
            });
            push('Faculty assigned successfully');
            setAssignForm({ faculty1Id: '', faculty2Id: '', faculty3Id: '' });
            setAssignFacultyOpen(false);
            loadData();
        } catch (error) {
            push('Failed to assign faculty: ' + error.message, 'error');
        }
    };

    // Remove faculty from lab assignment
    const handleRemoveAssignment = async (assignmentId) => {
        if (!window.confirm('Remove this faculty from the lab?')) return;

        try {
            await adminDataAPI.request('DELETE', `/admin/labs/assignment/${assignmentId}`);
            push('Faculty removed successfully');
            loadData();
        } catch (error) {
            push('Failed to remove faculty: ' + error.message, 'error');
        }
    };

    // Delete lab
    const handleDeleteLab = async (labId) => {
        if (!window.confirm('Delete this lab? This action cannot be undone.')) return;

        try {
            await adminDataAPI.request('DELETE', `/admin/labs/${labId}`);
            push('Lab deleted successfully');
            loadData();
        } catch (error) {
            push('Failed to delete lab: ' + error.message, 'error');
        }
    };

    const filteredLabs = labs.filter(lab =>
        `${lab.name}${lab.code}`.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Loading labs...</Typography>;
    }

    return (
        <Box>
            <Stack direction="row" gap={2} mb={3} alignItems="center" flexWrap="wrap">
                <TextField
                    size="small"
                    placeholder="Search labs by name or code…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flex: 1, minWidth: 240 }}
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setCreateForm({ labName: '', labCode: '' });
                        setCreateLabOpen(true);
                    }}
                >
                    Create New Lab
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => {
                        setSelectedLab(null);
                        setAssignForm({ faculty1Id: '', faculty2Id: '', faculty3Id: '' });
                        setAssignFacultyOpen(true);
                    }}
                    disabled={labs.length === 0}
                >
                    Assign Faculty to Lab
                </Button>
            </Stack>

            {/* Labs List */}
            <Card variant="outlined">
                <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: ts.thBg }}>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>#</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>Lab Code</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>Lab Name</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>Assigned Faculty</th>
                                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLabs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>
                                        No labs yet. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredLabs.map((lab, index) => (
                                    <tr key={lab.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                        <td style={{ padding: '12px 14px', color: ts.tdEmpty }}>{index + 1}</td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <Chip label={lab.code} size="small" color="info" variant="outlined" />
                                        </td>
                                        <td style={{ padding: '12px 14px', fontWeight: 500 }}>{lab.name}</td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Manage faculty assignments below
                                            </Typography>
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            <Stack direction="row" gap={1}>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedLab(lab);
                                                        setAssignForm({ faculty1Id: '', faculty2Id: '', faculty3Id: '' });
                                                        setAssignFacultyOpen(true);
                                                    }}
                                                >
                                                    Assign
                                                </Button>
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteLab(lab.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </Stack>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Box>
            </Card>

            {/* Create Lab Dialog */}
            <Dialog open={createLabOpen} onClose={() => setCreateLabOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Lab</DialogTitle>
                <DialogContent dividers sx={{ pt: 2 }}>
                    <form onSubmit={handleCreateLab}>
                        <Stack spacing={2}>
                            <TextField
                                label="Lab Name"
                                placeholder="e.g., Data Structures Lab"
                                fullWidth
                                required
                                value={createForm.labName}
                                onChange={(e) => setCreateForm(f => ({ ...f, labName: e.target.value }))}
                            />
                            <TextField
                                label="Lab Code"
                                placeholder="e.g., CSLAB301"
                                fullWidth
                                required
                                value={createForm.labCode}
                                onChange={(e) => setCreateForm(f => ({ ...f, labCode: e.target.value.toUpperCase() }))}
                            />
                        </Stack>
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateLabOpen(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleCreateLab} variant="contained">
                        Create Lab
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Faculty Dialog */}
            <Dialog open={assignFacultyOpen} onClose={() => setAssignFacultyOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Faculty to Lab</DialogTitle>
                <DialogContent dividers sx={{ pt: 2 }}>
                    <Stack spacing={2}>
                        <Alert severity="info">
                            Select exactly 3 faculty members to assign to this lab. All 3 faculty will have equal permissions to take attendance.
                        </Alert>

                        <FormControl fullWidth required>
                            <InputLabel>Lab</InputLabel>
                            <Select
                                value={selectedLab?.id || ''}
                                label="Lab"
                                onChange={(e) => {
                                    const lab = labs.find(l => l.id === e.target.value);
                                    setSelectedLab(lab);
                                }}
                            >
                                {labs.map(lab => (
                                    <MenuItem key={lab.id} value={lab.id}>
                                        {lab.name} ({lab.code})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={selectedClass || ''}
                                label="Class"
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                {classes.map(cls => (
                                    <MenuItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel>Academic Year</InputLabel>
                            <Select
                                value={selectedYear || ''}
                                label="Academic Year"
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {academicYears.map(year => (
                                    <MenuItem key={year.id} value={year.id}>
                                        {year.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
                            Select 3 Faculty Members
                        </Typography>

                        <FormControl fullWidth required>
                            <InputLabel>Faculty 1</InputLabel>
                            <Select
                                value={assignForm.faculty1Id}
                                label="Faculty 1"
                                onChange={(e) => setAssignForm(f => ({ ...f, faculty1Id: e.target.value }))}
                            >
                                {faculty.map(fac => (
                                    <MenuItem key={fac.id} value={fac.id}>
                                        {fac.user?.firstName} {fac.user?.lastName} ({fac.facultyId})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel>Faculty 2</InputLabel>
                            <Select
                                value={assignForm.faculty2Id}
                                label="Faculty 2"
                                onChange={(e) => setAssignForm(f => ({ ...f, faculty2Id: e.target.value }))}
                            >
                                {faculty.map(fac => (
                                    <MenuItem key={fac.id} value={fac.id}>
                                        {fac.user?.firstName} {fac.user?.lastName} ({fac.facultyId})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth required>
                            <InputLabel>Faculty 3</InputLabel>
                            <Select
                                value={assignForm.faculty3Id}
                                label="Faculty 3"
                                onChange={(e) => setAssignForm(f => ({ ...f, faculty3Id: e.target.value }))}
                            >
                                {faculty.map(fac => (
                                    <MenuItem key={fac.id} value={fac.id}>
                                        {fac.user?.firstName} {fac.user?.lastName} ({fac.facultyId})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignFacultyOpen(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleAssignFaculty} variant="contained">
                        Assign Faculty
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
