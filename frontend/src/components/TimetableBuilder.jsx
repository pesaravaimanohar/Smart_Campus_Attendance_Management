import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Chip, Button, Stack,
    Grid, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
    IconButton, Card, Dialog, DialogTitle, DialogContent,
    DialogActions, List, ListItemButton, ListItemText,
    CircularProgress, Alert, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScienceIcon from '@mui/icons-material/Science';
import { adminDataAPI } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Lunch', 'Period 4', 'Period 5', 'Period 6'];
const PERIOD_TIMINGS = {
    'Period 1': '9:30 - 10:30',
    'Period 2': '10:30 - 11:30',
    'Period 3': '11:30 - 12:30',
    'Lunch': '12:30 - 1:30',
    'Period 4': '1:30 - 2:30',
    'Period 5': '2:30 - 3:30',
    'Period 6': '3:30 - 4:30'
};
const ASSIGNABLE_PERIODS = PERIODS.filter(p => p !== 'Lunch');

// Color palette for subjects (rotating)
const SUBJECT_COLORS = [
    { bg: '#6C63FF', text: '#fff' },
    { bg: '#FF6B6B', text: '#fff' },
    { bg: '#4ECDC4', text: '#fff' },
    { bg: '#45B7D1', text: '#fff' },
    { bg: '#96CEB4', text: '#333' },
    { bg: '#FFEAA7', text: '#333' },
    { bg: '#DDA0DD', text: '#333' },
    { bg: '#FF8C42', text: '#fff' },
    { bg: '#98D8C8', text: '#333' },
    { bg: '#F7DC6F', text: '#333' },
];

export default function TimetableBuilder({ classId, className }) {
    const [timetable, setTimetable] = useState({}); // { 'Monday-Period 1': subjectId }
    const [status, setStatus] = useState('NONE'); // DRAFT or PUBLISHED
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState([]); // array of { day, period } for multi-select
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false); // true when user is selecting slots

    // Build a color map so each subject always gets the same color
    const subjectColorMap = useMemo(() => {
        const map = {};
        subjects.forEach((s, i) => {
            map[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
        });
        return map;
    }, [subjects]);

    // Load data from the backend when classId changes
    useEffect(() => {
        if (!classId) return;
        setLoading(true);
        setError(null);
        
        Promise.all([
            adminDataAPI.request('GET', `/classes/${classId}/subject-assignments`),
            adminDataAPI.request('GET', `/classes/${classId}`)
        ])
        .then(([subjectData, classData]) => {
            // Map subjects
            const mapped = (Array.isArray(subjectData) ? subjectData : []).map(s => ({
                id: s.subjectId || s.id,
                name: s.subjectName,
                code: s.subjectCode,
                faculty: s.facultyName || 'Unassigned',
                isLab: !!s.isLab,
            }));
            setSubjects(mapped);

            // Load existing timetable if present
            if (classData.timetable) {
                try {
                    const parsed = JSON.parse(classData.timetable);
                    setTimetable(parsed);
                } catch (e) {
                    console.error("Failed to parse existing timetable:", e);
                    setTimetable({});
                }
            } else {
                setTimetable({});
            }
            
            setStatus(classData.timetableUrl || 'NONE');
            setSelectedSlots([]);
            setSelectionMode(false);
        })
        .catch(e => {
            console.error("Failed to load class data:", e);
            setError("Failed to load data for this class.");
            setSubjects([]);
        })
        .finally(() => setLoading(false));
    }, [classId]);

    const handleSave = async (newStatus) => {
        setSaving(true);
        try {
            await adminDataAPI.request('PUT', `/classes/${classId}`, {
                timetable: JSON.stringify(timetable),
                timetableUrl: newStatus
            });
            setStatus(newStatus);
            alert(`Timetable ${newStatus === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully!`);
        } catch (e) {
            console.error("Failed to save timetable:", e);
            alert("Failed to save timetable: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    // Count how many periods each subject is assigned to

    // Count how many periods each subject is assigned to
    const assignedCounts = useMemo(() => {
        const counts = {};
        Object.values(timetable).forEach(id => {
            counts[id] = (counts[id] || 0) + 1;
        });
        return counts;
    }, [timetable]);

    const isSlotSelected = (day, period) => {
        return selectedSlots.some(s => s.day === day && s.period === period);
    };

    const handleSlotClick = (day, period) => {
        if (period === 'Lunch') return;
        const key = `${day}-${period}`;

        // If slot is already assigned, ignore for selection
        if (timetable[key]) return;

        if (selectionMode) {
            // Toggle this slot in the selection
            if (isSlotSelected(day, period)) {
                setSelectedSlots(prev => prev.filter(s => !(s.day === day && s.period === period)));
            } else {
                setSelectedSlots(prev => [...prev, { day, period }]);
            }
        } else {
            // Start selection mode with this slot
            setSelectionMode(true);
            setSelectedSlots([{ day, period }]);
        }
    };

    const handleAssign = (subjectId) => {
        if (selectedSlots.length === 0) return;

        const newTimetable = { ...timetable };
        selectedSlots.forEach(({ day, period }) => {
            const key = `${day}-${period}`;
            newTimetable[key] = subjectId;
        });

        setTimetable(newTimetable);
        setDialogOpen(false);
        setSelectedSlots([]);
        setSelectionMode(false);
    };

    const handleRemove = (day, period, e) => {
        e.stopPropagation();
        const key = `${day}-${period}`;
        const newTimetable = { ...timetable };
        delete newTimetable[key];
        setTimetable(newTimetable);
    };

    const handleRemoveMerged = (day, startIdx, span, e) => {
        e.stopPropagation();
        const newTimetable = { ...timetable };
        for (let i = startIdx; i < startIdx + span; i++) {
            const key = `${day}-${PERIODS[i]}`;
            delete newTimetable[key];
        }
        setTimetable(newTimetable);
    };

    const cancelSelection = () => {
        setSelectedSlots([]);
        setSelectionMode(false);
    };

    const openAssignDialog = () => {
        if (selectedSlots.length > 0) {
            setDialogOpen(true);
        }
    };

    const clearAll = () => {
        if (window.confirm('Clear entire timetable?')) {
            setTimetable({});
        }
    };

    // Build merged cells for a given day row
    // Returns an array of { period, periodIdx, span, subjectId } or { period, periodIdx, span: 1, subjectId: null, isLunch, isSelected }
    const getMergedRow = (day) => {
        const cells = [];
        let i = 0;
        while (i < PERIODS.length) {
            const period = PERIODS[i];
            if (period === 'Lunch') {
                cells.push({ periodIdx: i, span: 1, subjectId: null, isLunch: true });
                i++;
                continue;
            }

            const key = `${day}-${period}`;
            const subjectId = timetable[key];

            if (subjectId) {
                // Count how many consecutive periods have the same subject
                let span = 1;
                while (i + span < PERIODS.length) {
                    const nextPeriod = PERIODS[i + span];
                    if (nextPeriod === 'Lunch') break;
                    const nextKey = `${day}-${nextPeriod}`;
                    if (timetable[nextKey] !== subjectId) break;
                    span++;
                }
                cells.push({ periodIdx: i, span, subjectId });
                i += span;
            } else {
                cells.push({ periodIdx: i, span: 1, subjectId: null, isSelected: isSlotSelected(day, period) });
                i++;
            }
        }
        return cells;
    };

    if (!classId) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Select a class to build its timetable.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Top Navigation & Selection Bar */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 2,
                mb: 2,
                borderBottom: 1,
                borderColor: 'divider'
            }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">
                        Class Timetable Manager
                    </Typography>
                    {className && (
                        <Typography variant="body2" color="text.secondary">
                            Building schedule for <strong>{className}</strong>
                        </Typography>
                    )}
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="text" color="error" size="small" onClick={clearAll} disabled={saving}>Clear All</Button>
                    {status === 'PUBLISHED' ? (
                        <Chip label="Published" color="success" variant="filled" />
                    ) : status === 'DRAFT' ? (
                        <Chip label="Draft" color="warning" variant="outlined" />
                    ) : null}
                    <Button 
                        variant="outlined" 
                        onClick={() => handleSave('DRAFT')} 
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button 
                        variant="contained" 
                        disableElevation 
                        onClick={() => handleSave('PUBLISHED')}
                        disabled={saving}
                    >
                        {saving ? 'Publishing...' : 'Publish Timetable'}
                    </Button>
                </Stack>
            </Box>

            {/* Selection Mode Banner */}
            {selectionMode && (
                <Paper elevation={0} sx={{
                    mb: 2, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main', borderRadius: 2
                }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon color="primary" />
                        <Typography variant="body2" fontWeight={600}>
                            {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            — Click more empty slots to add, or assign a subject below
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" size="small" onClick={cancelSelection}>Cancel</Button>
                        <Button variant="contained" size="small" onClick={openAssignDialog}
                            disabled={selectedSlots.length === 0}>
                            Assign Subject to {selectedSlots.length} Slot{selectedSlots.length !== 1 ? 's' : ''}
                        </Button>
                    </Stack>
                </Paper>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : subjects.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No subjects are assigned to this class yet. Go to <strong>Subject Assignments</strong> to assign faculty-subject pairs first.
                </Alert>
            ) : (
                <Grid container spacing={3} sx={{ flexGrow: 1 }}>
                    {/* Left Panel: The Interactive Timetable Grid */}
                    <Grid item xs={12} md={8} lg={9}>
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table size="small" sx={{ tableLayout: 'fixed' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.dark', color: 'primary.contrastText', width: 100, borderRight: '1px solid rgba(255,255,255,0.1)' }}>Day / Period</TableCell>
                                        {PERIODS.map(p => (
                                            <TableCell
                                                key={p}
                                                align="center"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    bgcolor: 'primary.dark',
                                                    color: 'primary.contrastText',
                                                    width: p === 'Lunch' ? 50 : 'auto',
                                                    fontSize: 12,
                                                    borderRight: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', mb: 0.2 }}>
                                                    {p}
                                                </Typography>
                                                <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, fontSize: 10, fontWeight: 'medium' }}>
                                                    {PERIOD_TIMINGS[p]}
                                                </Typography>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {DAYS.map(day => {
                                        const mergedRow = getMergedRow(day);
                                        return (
                                            <TableRow key={day} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell 
                                                    sx={{ 
                                                        fontWeight: 800, 
                                                        bgcolor: 'grey.900', 
                                                        color: '#fff', 
                                                        fontSize: 12, 
                                                        borderRight: '2px solid',
                                                        borderColor: 'primary.main',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 1
                                                    }}
                                                >
                                                    {day}
                                                </TableCell>
                                                {mergedRow.map((cell, cellIdx) => {
                                                    if (cell.isLunch) {
                                                        return (
                                                            <TableCell
                                                                key={`${day}-lunch`}
                                                                sx={{ bgcolor: 'grey.200', textAlign: 'center', p: 0 }}
                                                            />
                                                        );
                                                    }

                                                    if (cell.subjectId) {
                                                        const subject = subjects.find(s => s.id === cell.subjectId);
                                                        const color = subjectColorMap[cell.subjectId] || SUBJECT_COLORS[0];

                                                        return (
                                                            <TableCell
                                                                key={`${day}-${cell.periodIdx}`}
                                                                colSpan={cell.span}
                                                                sx={{
                                                                    p: 0.5,
                                                                    height: 70,
                                                                    border: '1px solid #e0e0e0',
                                                                    position: 'relative',
                                                                }}
                                                            >
                                                                <Paper
                                                                    elevation={0}
                                                                    sx={{
                                                                        bgcolor: color.bg,
                                                                        height: '100%',
                                                                        p: 1,
                                                                        position: 'relative',
                                                                        borderRadius: 1,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center',
                                                                    }}
                                                                >
                                                                    <Typography variant="subtitle2" fontWeight="bold" noWrap
                                                                        sx={{ color: color.text, lineHeight: 1.2 }}>
                                                                        {subject?.name || 'Unknown'}
                                                                    </Typography>
                                                                    <Typography variant="caption" noWrap sx={{ color: color.text, opacity: 0.85 }}>
                                                                        {subject?.faculty}
                                                                    </Typography>
                                                                    {cell.span > 1 && (
                                                                        <Chip label={`${cell.span} hrs`} size="small"
                                                                            sx={{ position: 'absolute', bottom: 2, right: 2, fontSize: 10, height: 18, bgcolor: 'rgba(255,255,255,0.3)', color: color.text }} />
                                                                    )}
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{ position: 'absolute', top: 0, right: 0, color: color.text, p: 0.3, opacity: 0.7, '&:hover': { opacity: 1 } }}
                                                                        onClick={(e) => handleRemoveMerged(day, cell.periodIdx, cell.span, e)}
                                                                    >
                                                                        <CloseIcon sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Paper>
                                                            </TableCell>
                                                        );
                                                    }

                                                    // Empty slot
                                                    const period = PERIODS[cell.periodIdx];
                                                    const selected = cell.isSelected;

                                                    return (
                                                        <TableCell
                                                            key={`${day}-${cell.periodIdx}`}
                                                            onClick={() => handleSlotClick(day, period)}
                                                            sx={{
                                                                bgcolor: selected ? 'primary.light' : 'grey.50',
                                                                border: selected ? '2px solid' : '1px dashed #ccc',
                                                                borderColor: selected ? 'primary.main' : '#ccc',
                                                                cursor: 'pointer',
                                                                p: 1,
                                                                height: 70,
                                                                transition: 'all 0.15s',
                                                                '&:hover': {
                                                                    bgcolor: selected ? 'primary.light' : 'action.hover',
                                                                    '& .add-icon': { opacity: 1 }
                                                                }
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                                                {selected ? (
                                                                    <CheckCircleIcon color="primary" sx={{ fontSize: 20 }} />
                                                                ) : (
                                                                    <AddIcon className="add-icon" sx={{ opacity: 0, color: 'text.disabled', fontSize: 20 }} />
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Quick-assign hint */}
                        {!selectionMode && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                💡 <strong>Tip:</strong> Click multiple empty slots to select them, then assign a subject to all at once. Consecutive same-subject periods auto-merge.
                            </Typography>
                        )}
                    </Grid>

                    {/* Right Sidebar: Subject Bank */}
                    <Grid item xs={12} md={4} lg={3}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Subject Bank</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Select slots on the grid, then click a subject to assign.
                            </Typography>

                            <Stack spacing={1.5}>
                                {subjects.map(sub => {
                                    const count = assignedCounts[sub.id] || 0;
                                    const color = subjectColorMap[sub.id] || SUBJECT_COLORS[0];

                                    return (
                                        <Tooltip key={`${sub.id}-${sub.isLab}`} title={selectionMode && selectedSlots.length > 0 ? `Assign to ${selectedSlots.length} slot(s)` : 'Select slots first'} arrow>
                                            <Card
                                                variant="outlined"
                                                onClick={() => {
                                                    if (selectionMode && selectedSlots.length > 0) {
                                                        handleAssign(sub.id);
                                                    }
                                                }}
                                                sx={{
                                                    p: 1.5,
                                                    cursor: selectionMode && selectedSlots.length > 0 ? 'pointer' : 'default',
                                                    transition: 'all 0.2s',
                                                    borderLeft: `4px solid ${color.bg}`,
                                                    '&:hover': selectionMode && selectedSlots.length > 0 ? {
                                                        bgcolor: 'action.hover',
                                                        transform: 'translateX(2px)',
                                                        boxShadow: 2,
                                                    } : {}
                                                }}
                                            >
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                    <Box sx={{ overflow: 'hidden' }}>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Typography variant="subtitle2" noWrap>{sub.name}</Typography>
                                                            {sub.isLab && <Chip icon={<ScienceIcon />} label="Lab" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: 10 }} />}
                                                        </Stack>
                                                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                                            {sub.code} · {sub.faculty}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={`${count} hr${count !== 1 ? 's' : ''}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: color.bg,
                                                            color: color.text,
                                                            fontWeight: 700,
                                                            fontSize: 11,
                                                            height: 22,
                                                            ml: 0.5,
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                </Stack>
                                            </Card>
                                        </Tooltip>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Assign Dialog (alternative to sidebar click) */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Assign Subject to {selectedSlots.length} Slot{selectedSlots.length !== 1 ? 's' : ''}
                    <Typography variant="body2" color="text.secondary">
                        {selectedSlots.map(s => `${s.day} ${s.period}`).join(', ')}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <List>
                        {subjects.map(sub => {
                            const color = subjectColorMap[sub.id] || SUBJECT_COLORS[0];
                            return (
                                <ListItemButton key={`${sub.id}-${sub.isLab}`} onClick={() => handleAssign(sub.id)}
                                    sx={{ borderRadius: 1, mb: 0.5 }}>
                                    <Box sx={{ width: 6, height: 36, bgcolor: color.bg, borderRadius: 1, mr: 2, flexShrink: 0 }} />
                                    <ListItemText
                                        primary={
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <span>{sub.name} ({sub.code})</span>
                                                {sub.isLab && <Chip label="Lab" size="small" color="secondary" variant="outlined" sx={{ height: 20 }} />}
                                            </Stack>
                                        }
                                        secondary={sub.faculty}
                                    />
                                    <Chip label={`${assignedCounts[sub.id] || 0} hrs`} size="small" variant="outlined" />
                                </ListItemButton>
                            );
                        })}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
