import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, Button, IconButton,
    AppBar, Toolbar, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Avatar, Divider, Stack, Menu,
    MenuItem, Badge, Tabs, Tab, Chip, useTheme, Tooltip, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select,
    Accordion, AccordionSummary, AccordionDetails,
    Alert, AlertTitle, Breadcrumbs,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Menu as MenuIcon, Dashboard as DashboardIcon, People as PeopleIcon,
    School as SchoolIcon, TrendingUp as TrendingUpIcon,
    Assessment as AssessmentIcon, Settings as SettingsIcon,
    Notifications as NotificationsIcon, AccountCircle as AccountCircleIcon,
    Logout as LogoutIcon, Groups as GroupsIcon, Assignment as AssignmentIcon,
    MenuBook as SubjectIcon,
    EventNote as ClassResourcesIcon,
    DeleteOutline as DeleteOutlineIcon,
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon,
    Add as AddIcon,
    CloudUpload as CloudUploadIcon,
    Close as CloseIcon,
    DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient, { adminDataAPI, uploadClassTimetableFile, uploadClassSyllabusFile } from '../services/api';
import BulkUploadModule from '../components/modules/BulkUploadModule';
import PromotionEngineModule from '../components/modules/PromotionEngineModule';
import TimetableBuilder from '../components/TimetableBuilder';

// ─── inline Data Management helpers ────────────────────────────────────────────
const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    return [];
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
    return (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {toasts.map(t => (
                <Box key={t.id} onClick={() => remove(t.id)} sx={{
                    px: 2.5, py: 1.2, borderRadius: 2, cursor: 'pointer', minWidth: 260,
                    bgcolor: t.type === 'success' ? 'success.main' : 'error.main', color: '#fff',
                    boxShadow: 4, fontSize: 14, fontWeight: 500,
                    animation: 'fadeIn .25s ease', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1 } }
                }}>
                    {t.type === 'success' ? '✓ ' : '✗ '}{t.msg}
                </Box>
            ))}
        </Box>
    );
}
function useToast() {
    const [toasts, setToasts] = useState([]);
    const push = useCallback((msg, type = 'success') => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3500);
    }, []);
    const remove = useCallback(id => setToasts(p => p.filter(x => x.id !== id)), []);
    return { toasts, push, remove };
}

// ─── Inline Modal ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
    return (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }} onClick={onClose}>
            <Card sx={{ width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight={600}>{title}</Typography>
                        <IconButton size="small" onClick={onClose}>✕</IconButton>
                    </Stack>
                    {children}
                </CardContent>
            </Card>
        </Box>
    );
}
function Field({ label, children }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
            {children}
        </Box>
    );
}
const inputSx = { width: '100%', p: '8px 12px', border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: 14, bgcolor: 'background.default', color: 'text.primary', outline: 'none' };

const StudentsTable = React.memo(function StudentsTable({ filtered, ts, onEdit, onDelete }) {
    return (
        <Card variant="outlined">
            <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: ts.thBg }}>
                            {['Roll No', 'Name', 'Email', 'Dept', 'Sem / Sec', 'Status', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No students found</td></tr>
                        ) : filtered.map(s => (
                            <tr key={s.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                <td style={{ padding: '10px 14px' }}><Chip label={s.rollNumber} size="small" color="primary" variant="outlined" /></td>
                                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{s.firstName} {s.lastName}</td>
                                <td style={{ padding: '10px 14px', color: ts.tdMuted }}>{s.email || '—'}</td>
                                <td style={{ padding: '10px 14px' }}>{s.departmentCode || '—'}</td>
                                <td style={{ padding: '10px 14px' }}>Sem {s.currentSemester} / {s.section}</td>
                                <td style={{ padding: '10px 14px' }}><Chip label={s.status} size="small" color={s.status === 'ACTIVE' ? 'success' : 'default'} /></td>
                                <td style={{ padding: '10px 14px' }}>
                                    <Stack direction="row" gap={0.5} alignItems="center">
                                        <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => onEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Delete student"><IconButton size="small" color="error" onClick={() => onDelete(s)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                    </Stack>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Box>
        </Card>
    );
});

const FacultyTable = React.memo(function FacultyTable({ filtered, ts, onEdit, onDelete }) {
    return (
        <Card variant="outlined">
            <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                        <tr style={{ background: ts.thBg }}>
                            {['Faculty ID', 'Name', 'Email', 'Department', 'Role', 'Designation', 'Status', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No faculty found</td></tr>
                        ) : filtered.map(f => (
                            <tr key={f.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                <td style={{ padding: '10px 14px' }}><Chip label={f.facultyId} size="small" color="secondary" variant="outlined" /></td>
                                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{f.firstName} {f.lastName}</td>
                                <td style={{ padding: '10px 14px', color: ts.tdMuted }}>{f.email || '—'}</td>
                                <td style={{ padding: '10px 14px' }}>{f.departmentCode || '—'}</td>
                                <td style={{ padding: '10px 14px' }}><Chip label={f.role || 'FACULTY'} size="small" variant="outlined" /></td>
                                <td style={{ padding: '10px 14px' }}>{f.designation || '—'}</td>
                                <td style={{ padding: '10px 14px' }}><Chip label={f.employmentStatus} size="small" color={f.employmentStatus === 'ACTIVE' ? 'success' : 'default'} /></td>
                                <td style={{ padding: '10px 14px' }}>
                                    <Stack direction="row" gap={0.5} alignItems="center">
                                        <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => onEdit(f)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="Remove faculty"><IconButton size="small" color="error" onClick={() => onDelete(f)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                    </Stack>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Box>
        </Card>
    );
});

const GroupedStudentsView = React.memo(function GroupedStudentsView({ groups, ts, onEdit, onDelete }) {
    const deptEntries = Object.entries(groups);
    if (deptEntries.length === 0) {
        return (
            <Card variant="outlined">
                <Box sx={{ p: 6, textAlign: 'center', color: ts.tdEmpty }}>
                    No students found
                </Box>
            </Card>
        );
    }

    return (
        <Stack spacing={1.5}>
            {deptEntries.map(([dept, semMap]) => {
                const deptCount = Object.values(semMap).reduce(
                    (acc, secMap) => acc + Object.values(secMap).reduce((a, arr) => a + arr.length, 0),
                    0
                );

                return (
                    <Accordion key={dept} defaultExpanded={deptEntries.length <= 2} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                                <Chip label={dept || '—'} size="small" color="primary" variant="outlined" />
                                <Typography fontWeight={800}>Department</Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Chip label={`${deptCount} students`} size="small" />
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                {Object.entries(semMap)
                                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                                    .map(([sem, secMap]) => (
                                        <Box key={sem}>
                                            <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                                                Semester {sem}
                                            </Typography>
                                            <Stack spacing={1.25}>
                                                {Object.entries(secMap)
                                                    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
                                                    .map(([sec, students]) => (
                                                        <Box key={`${sem}-${sec}`}>
                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                                <Chip label={`Section ${sec || '—'}`} size="small" color="secondary" variant="outlined" />
                                                                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                                                    {students.length} students
                                                                </Typography>
                                                            </Stack>
                                                            <StudentsTable filtered={students} ts={ts} onEdit={onEdit} onDelete={onDelete} />
                                                        </Box>
                                                    ))}
                                            </Stack>
                                        </Box>
                                    ))}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Stack>
    );
});

// Theme-aware table style helpers
function useTableStyles() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    return {
        thBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        thColor: isDark ? '#94A3B8' : '#666',
        tdMuted: isDark ? '#94A3B8' : '#666',
        tdEmpty: isDark ? '#64748B' : '#999',
        tdSub: isDark ? '#64748B' : '#888',
        tableBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENTS VIEW — List + Add/Edit + Bulk Upload tabs
// ═══════════════════════════════════════════════════════════════════════════════
function StudentsView({ departments, push }) {
    const safeDepartments = asArray(departments);
    const ts = useTableStyles();
    const [tab, setTab] = useState(0);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null); // null | 'add' | student-obj
    const [search, setSearch] = useState('');
    const [groupedView, setGroupedView] = useState(true);
    const BLANK = { firstName: '', lastName: '', email: '', contactNumber: '', gender: 'MALE', rollNumber: '', studentId: '', departmentCode: '', program: 'UG', currentSemester: 1, section: 'A', admissionYear: new Date().getFullYear(), status: 'ACTIVE' };
    const [form, setForm] = useState(BLANK);
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const setV = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const load = useCallback(async () => { setLoading(true); try { setRows(await adminDataAPI.request('GET', '/students')); } catch (e) { push(e.message, 'error'); } finally { setLoading(false); } }, [push]);
    useEffect(() => { load(); }, [load]);

    const submit = async e => {
        e.preventDefault();
        try {
            if (modal?.id) { await adminDataAPI.request('PUT', `/students/${modal.id}`, form); push('Student updated'); }
            else { await adminDataAPI.request('POST', '/students', form); push('Student added — login: ' + form.rollNumber); }
            setModal(null); load();
        } catch (err) { push(err.message, 'error'); }
    };
    const del = async s => {
        if (!window.confirm(`Delete ${s.firstName} ${s.lastName}?`)) return;
        try { await adminDataAPI.request('DELETE', `/students/${s.id}`); push('Deleted'); load(); } catch (e) { push(e.message, 'error'); }
    };
    const openEdit = s => { setForm({ firstName: s.firstName||'', lastName: s.lastName||'', email: s.email||'', contactNumber: s.contactNumber||'', gender: s.gender||'MALE', rollNumber: s.rollNumber||'', studentId: s.studentId||'', departmentCode: s.departmentCode||'', program: s.program||'UG', currentSemester: s.currentSemester||1, section: s.section||'A', admissionYear: s.admissionYear||2024, status: s.status||'ACTIVE' }); setModal(s); };

    // Memoized list to keep typing in the modal snappy (avoid re-rendering table rows on every keystroke)
    const filtered = useMemo(
        () => rows.filter(r => `${r.firstName}${r.lastName}${r.rollNumber}${r.email}`.toLowerCase().includes(search.toLowerCase())),
        [rows, search]
    );

    const groups = useMemo(() => {
        // dept -> sem -> section -> students[]
        const out = {};
        for (const s of filtered) {
            const dept = s.departmentCode || '—';
            const sem = String(s.currentSemester ?? '—');
            const sec = String(s.section ?? '—');
            out[dept] = out[dept] || {};
            out[dept][sem] = out[dept][sem] || {};
            out[dept][sem][sec] = out[dept][sem][sec] || [];
            out[dept][sem][sec].push(s);
        }
        return out;
    }, [filtered]);

    const isEdit = !!modal?.id;
    const dialogOpen = Boolean(modal);

    return (
        <Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`All Students (${rows.length})`} />
                <Tab label="Bulk Upload via Excel" />
            </Tabs>

            {tab === 0 && (
                <>
                    <Stack direction="row" gap={2} mb={2} flexWrap="wrap" alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Search by name, roll number, email…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ flex: 1, minWidth: 240 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>View</InputLabel>
                            <Select
                                label="View"
                                value={groupedView ? 'GROUPED' : 'FLAT'}
                                onChange={(e) => setGroupedView(e.target.value === 'GROUPED')}
                            >
                                <MenuItem value="GROUPED">Grouped (Dept / Sem / Sec)</MenuItem>
                                <MenuItem value="FLAT">All students (flat)</MenuItem>
                            </Select>
                        </FormControl>
                        <Button variant="contained" size="large" onClick={() => { setForm({ ...BLANK, departmentCode: safeDepartments[0]?.code || '' }); setModal('add'); }}>+ Add student</Button>
                    </Stack>

                    {loading ? <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Loading…</Typography> : (
                        groupedView
                            ? <GroupedStudentsView groups={groups} ts={ts} onEdit={openEdit} onDelete={del} />
                            : <StudentsTable filtered={filtered} ts={ts} onEdit={openEdit} onDelete={del} />
                    )}
                </>
            )}

            {tab === 1 && <BulkUploadModule type="student" />}

            <Dialog open={dialogOpen} onClose={() => setModal(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {isEdit ? 'Edit Student' : 'Add New Student'}
                </DialogTitle>
                <DialogContent dividers sx={{ pt: 2.5 }}>
                    <Box component="form" id="student-form" onSubmit={submit}>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 2.5,
                        }}>
                            <TextField label="First name" value={form.firstName} onChange={set('firstName')} fullWidth required />
                            <TextField label="Last name" value={form.lastName} onChange={set('lastName')} fullWidth required />

                            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                                <TextField
                                    label="Roll number"
                                    value={form.rollNumber}
                                    onChange={(e) => {
                                        const v = e.target.value.toUpperCase();
                                        setForm(f => ({ ...f, rollNumber: v, studentId: f.studentId || v }));
                                    }}
                                    fullWidth
                                    required
                                    disabled={isEdit}
                                    helperText={isEdit ? 'Roll number cannot be changed.' : 'Used as username and default password.'}
                                />
                            </Box>
                            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                                <TextField
                                    label="Student ID"
                                    value={form.studentId}
                                    onChange={set('studentId')}
                                    fullWidth
                                    placeholder="Optional (defaults to roll number)"
                                />
                            </Box>

                            <TextField label="Email" type="email" value={form.email} onChange={set('email')} fullWidth />
                            <TextField label="Contact number" value={form.contactNumber} onChange={set('contactNumber')} fullWidth />

                            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                                <FormControl fullWidth>
                                    <InputLabel>Gender</InputLabel>
                                    <Select label="Gender" value={form.gender} onChange={(e) => setV('gender', e.target.value)}>
                                        <MenuItem value="MALE">Male</MenuItem>
                                        <MenuItem value="FEMALE">Female</MenuItem>
                                        <MenuItem value="OTHER">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Department</InputLabel>
                                    <Select label="Department" value={form.departmentCode} onChange={(e) => setV('departmentCode', e.target.value)}>
                                        {safeDepartments.map(d => (
                                            <MenuItem key={d.code} value={d.code}>
                                                {d.name} ({d.code})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                                <FormControl fullWidth>
                                    <InputLabel>Program</InputLabel>
                                    <Select label="Program" value={form.program} onChange={(e) => setV('program', e.target.value)}>
                                        <MenuItem value="UG">Undergraduate (UG)</MenuItem>
                                        <MenuItem value="PG">Postgraduate (PG)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <TextField label="Semester" type="number" value={form.currentSemester} onChange={set('currentSemester')} fullWidth inputProps={{ min: 1, max: 16 }} />
                            <TextField label="Section" value={form.section} onChange={set('section')} fullWidth />

                            <TextField label="Admission year" type="number" value={form.admissionYear} onChange={set('admissionYear')} fullWidth />
                            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Select label="Status" value={form.status} onChange={(e) => setV('status', e.target.value)}>
                                        <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                                        <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                                        <MenuItem value="ALUMNI">ALUMNI</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setModal(null)}>Cancel</Button>
                    <Button type="submit" form="student-form" variant="contained">
                        {isEdit ? 'Update student' : 'Add student'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACULTY VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function FacultyView({ departments, push }) {
    const safeDepartments = asArray(departments);
    const ts = useTableStyles();
    const [tab, setTab] = useState(0);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);
    const [search, setSearch] = useState('');
    const BLANK = { firstName: '', lastName: '', email: '', contactNumber: '', gender: 'MALE', facultyId: '', departmentCode: '', role: 'FACULTY', designation: 'Assistant Professor', qualifications: '', joiningDate: '', employmentStatus: 'ACTIVE' };
    const [form, setForm] = useState(BLANK);
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const setV = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const load = useCallback(async () => { setLoading(true); try { setRows(await adminDataAPI.request('GET', '/faculty')); } catch (e) { push(e.message, 'error'); } finally { setLoading(false); } }, [push]);
    useEffect(() => { load(); }, [load]);

    const submit = async e => {
        e.preventDefault();
        try {
            if (modal?.id) { await adminDataAPI.request('PUT', `/faculty/${modal.id}`, form); push('Faculty updated'); }
            else { await adminDataAPI.request('POST', '/faculty', form); push('Faculty added — login: ' + form.facultyId); }
            setModal(null); load();
        } catch (err) { push(err.message, 'error'); }
    };
    const del = async f => {
        if (!window.confirm(`Delete ${f.firstName} ${f.lastName}?`)) return;
        try { await adminDataAPI.request('DELETE', `/faculty/${f.id}`); push('Deleted'); load(); } catch (e) { push(e.message, 'error'); }
    };
    const openEdit = f => { setForm({ firstName: f.firstName||'', lastName: f.lastName||'', email: f.email||'', contactNumber: f.contactNumber||'', gender: f.gender||'MALE', facultyId: f.facultyId||'', departmentCode: f.departmentCode||'', role: f.role || 'FACULTY', designation: f.designation||'', qualifications: f.qualifications||'', joiningDate: f.joiningDate||'', employmentStatus: f.employmentStatus||'ACTIVE' }); setModal(f); };

    const filtered = useMemo(
        () => rows.filter(r => `${r.firstName}${r.lastName}${r.facultyId}${r.email}`.toLowerCase().includes(search.toLowerCase())),
        [rows, search]
    );
    const isEdit = !!modal?.id;
    const dialogOpen = Boolean(modal);

    return (
        <Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`All Faculty (${rows.length})`} />
                <Tab label="Bulk Upload via Excel" />
            </Tabs>

            {tab === 0 && (
                <>
                    <Stack direction="row" gap={2} mb={2} flexWrap="wrap" alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Search by name, faculty ID, email…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ flex: 1, minWidth: 240 }}
                        />
                        <Button variant="contained" size="large" onClick={() => { setForm({ ...BLANK, departmentCode: safeDepartments[0]?.code || '' }); setModal('add'); }}>+ Add faculty</Button>
                    </Stack>

                    {loading ? <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Loading…</Typography> : (
                        <FacultyTable filtered={filtered} ts={ts} onEdit={openEdit} onDelete={del} />
                    )}
                </>
            )}

            {tab === 1 && <BulkUploadModule type="faculty" />}

            <Dialog open={dialogOpen} onClose={() => setModal(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {isEdit ? 'Edit Faculty' : 'Add New Faculty'}
                </DialogTitle>
                <DialogContent dividers sx={{ pt: 2.5 }}>
                    <Box component="form" id="faculty-form" onSubmit={submit}>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 2.5,
                        }}>
                            <TextField label="First name" value={form.firstName} onChange={set('firstName')} fullWidth required />
                            <TextField label="Last name" value={form.lastName} onChange={set('lastName')} fullWidth required />

                            <TextField
                                label="Faculty ID"
                                value={form.facultyId}
                                onChange={(e) => setForm(f => ({ ...f, facultyId: e.target.value.toUpperCase() }))}
                                fullWidth
                                required
                                disabled={isEdit}
                                helperText={isEdit ? 'Faculty ID cannot be changed.' : 'Used as username and default password.'}
                            />
                            <TextField
                                label="Joining date"
                                type="date"
                                value={form.joiningDate || ''}
                                onChange={set('joiningDate')}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField label="Email" type="email" value={form.email} onChange={set('email')} fullWidth />
                            <TextField label="Contact number" value={form.contactNumber} onChange={set('contactNumber')} fullWidth />

                            <FormControl fullWidth required sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                                <InputLabel>Department</InputLabel>
                                <Select label="Department" value={form.departmentCode} onChange={(e) => setV('departmentCode', e.target.value)}>
                                    {safeDepartments.map(d => (
                                        <MenuItem key={d.code} value={d.code}>
                                            {d.name} ({d.code})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                                <InputLabel>Academic designation</InputLabel>
                                <Select label="Academic designation" value={form.designation} onChange={(e) => setV('designation', e.target.value)}>
                                    <MenuItem value="Assistant Professor">Assistant Professor</MenuItem>
                                    <MenuItem value="Associate Professor">Associate Professor</MenuItem>
                                    <MenuItem value="Professor">Professor</MenuItem>
                                    <MenuItem value="Lecturer">Lecturer</MenuItem>
                                    <MenuItem value="Adjunct Faculty">Adjunct Faculty</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField label="Qualifications" value={form.qualifications} onChange={set('qualifications')} fullWidth placeholder="B.Tech, M.Tech…" />

                            <FormControl fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select label="Gender" value={form.gender} onChange={(e) => setV('gender', e.target.value)}>
                                    <MenuItem value="MALE">Male</MenuItem>
                                    <MenuItem value="FEMALE">Female</MenuItem>
                                    <MenuItem value="OTHER">Other</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select label="Status" value={form.employmentStatus} onChange={(e) => setV('employmentStatus', e.target.value)}>
                                    <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                                    <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                                    <MenuItem value="ON_LEAVE">ON LEAVE</MenuItem>
                                </Select>
                            </FormControl>

                            <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1 / -1' }}>
                                Teaching staff use the same portal; HOD/Principal add department or college duties.
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setModal(null)}>Cancel</Button>
                    <Button type="submit" form="faculty-form" variant="contained">
                        {isEdit ? 'Update faculty' : 'Add faculty'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBJECTS & DEPARTMENTS VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function SubjectsView({ push, onDeptsChange }) {
    const ts = useTableStyles();
    const [tab, setTab] = useState(0);
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [modal, setModal] = useState(null);
    const [deptModal, setDeptModal] = useState(false);
    const [search, setSearch] = useState('');
    const [sForm, setSForm] = useState({ name: '', code: '', subjectType: 'REGULAR' });
    const [dForm, setDForm] = useState({ code: '', name: '' });

    const loadSubjects = useCallback(async () => {
        try { setSubjects(asArray(await adminDataAPI.request('GET', '/subjects'))); } catch (e) { push(e.message, 'error'); }
    }, [push]);
    const loadDepts = useCallback(async () => {
        try {
            const d = asArray(await adminDataAPI.request('GET', '/departments'));
            setDepartments(d);
            if (onDeptsChange) onDeptsChange(d);
        } catch (e) { push(e.message, 'error'); }
    }, [push, onDeptsChange]);

    useEffect(() => { loadSubjects(); loadDepts(); }, [loadSubjects, loadDepts]);

    const submitSubject = async e => {
        e.preventDefault();
        try {
            if (modal?.id) { await adminDataAPI.request('PUT', `/subjects/${modal.id}`, sForm); push('Subject updated'); }
            else { await adminDataAPI.request('POST', '/subjects', sForm); push('Subject added'); }
            setModal(null); loadSubjects();
        } catch (err) { push(err.message, 'error'); }
    };

    const delSubject = async s => {
        if (!window.confirm(`Delete "${s.name}"?`)) return;
        try { 
            await adminDataAPI.request('DELETE', `/subjects/${s.id}`); 
            push('Deleted'); 
            loadSubjects(); 
        } catch (e) { 
            const msg = e.response?.data?.message || e.message;
            push(msg, 'error'); 
        }
    };

    const submitDept = async e => {
        e.preventDefault();
        try { await adminDataAPI.request('POST', '/departments', dForm); push('Department created'); setDeptModal(false); setDForm({ code: '', name: '' }); loadDepts(); }
        catch (err) { push(err.message, 'error'); }
    };

    const safeSubjects = asArray(subjects);
    const safeDepartments = asArray(departments);
    const filteredSub = safeSubjects.filter(s => `${s.name}${s.code}`.toLowerCase().includes(search.toLowerCase()));

    return (
        <Box>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); }} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`Subjects (${safeSubjects.length})`} />
                <Tab label={`Departments (${safeDepartments.length})`} />
            </Tabs>

            {tab === 0 && (
                <>
                    <Stack direction="row" gap={2} mb={2}>
                        <input style={{ ...inputSx, flex: 1 }} placeholder="🔍  Search subjects…" value={search} onChange={e => setSearch(e.target.value)} />
                        <Button variant="contained" onClick={() => { setSForm({ name: '', code: '', subjectType: 'REGULAR' }); setModal('add'); }}>+ Add Subject</Button>
                    </Stack>
                    <Card variant="outlined">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead><tr style={{ background: ts.thBg }}>{['#', 'Code', 'Subject Name', 'Type', 'Actions'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                            <tbody>
                                {filteredSub.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No subjects yet</td></tr>
                                    : filteredSub.map((s, i) => (
                                        <tr key={s.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                            <td style={{ padding: '10px 14px', color: ts.tdEmpty }}>{i + 1}</td>
                                            <td style={{ padding: '10px 14px' }}><Chip label={s.code} size="small" color="info" variant="outlined" /></td>
                                            <td style={{ padding: '10px 14px', fontWeight: 500 }}>{s.name}</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <Chip label={s.subjectType || 'REGULAR'} size="small" variant="outlined" color={s.subjectType === 'LAB' ? 'secondary' : 'default'} />
                                            </td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <Stack direction="row" gap={1}>
                                                    <Button size="small" onClick={() => { setSForm({ name: s.name, code: s.code, subjectType: s.subjectType || 'REGULAR' }); setModal(s); }}>Edit</Button>
                                                    <Button size="small" color="error" onClick={() => delSubject(s)}>Delete</Button>
                                                </Stack>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </Card>
                </>
            )}

            {tab === 1 && (
                <>
                    <Stack direction="row" justifyContent="flex-end" mb={2}>
                        <Button variant="contained" onClick={() => { setDForm({ code: '', name: '' }); setDeptModal(true); }}>+ Add Department</Button>
                    </Stack>
                    <Card variant="outlined">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead><tr style={{ background: ts.thBg }}>{['Code', 'Name', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                            <tbody>
                                {safeDepartments.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No departments yet</td></tr>
                                    : safeDepartments.map(d => (
                                        <tr key={d.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                            <td style={{ padding: '10px 14px' }}><Chip label={d.code} size="small" color="primary" variant="outlined" /></td>
                                            <td style={{ padding: '10px 14px', fontWeight: 500 }}>{d.name}</td>
                                            <td style={{ padding: '10px 14px' }}><Chip label={d.active ? 'Active' : 'Inactive'} size="small" color={d.active ? 'success' : 'default'} /></td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <Button size="small" color="error" onClick={async () => {
                                                    if (!window.confirm(`Delete department "${d.name}"? This will also remove associated programs.`)) return;
                                                    try {
                                                        await adminDataAPI.request('DELETE', `/departments/${d.id}`);
                                                        push('Department deleted');
                                                        loadDepts();
                                                    } catch (e) {
                                                        push(e.message, 'error');
                                                    }
                                                }}>Delete</Button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </Card>
                </>
            )}

            {modal && (
                <Modal title={modal?.id ? 'Edit Subject' : 'Add Subject'} onClose={() => setModal(null)}>
                    <form onSubmit={submitSubject}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}><Field label="Subject Name *"><input required style={inputSx} value={sForm.name} onChange={e => setSForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Data Structures" /></Field></Grid>
                            <Grid item xs={12}><Field label="Subject Code *"><input required style={inputSx} value={sForm.code} onChange={e => setSForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CS301" /></Field></Grid>
                            <Grid item xs={12}>
                                <Field label="Subject Type *">
                                    <select style={inputSx} value={sForm.subjectType} onChange={e => setSForm(f => ({ ...f, subjectType: e.target.value }))}>
                                        <option value="REGULAR">REGULAR (Single Faculty)</option>
                                        <option value="LAB">LAB (Multiple Faculty)</option>
                                    </select>
                                </Field>
                            </Grid>
                        </Grid>
                        <Stack direction="row" gap={1} justifyContent="flex-end" mt={3}>
                            <Button onClick={() => setModal(null)}>Cancel</Button>
                            <Button type="submit" variant="contained">{modal?.id ? 'Update' : 'Add'}</Button>
                        </Stack>
                    </form>
                </Modal>
            )}
            {deptModal && (
                <Modal title="Add Department" onClose={() => setDeptModal(false)}>
                    <form onSubmit={submitDept}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}><Field label="Code *"><input required style={inputSx} value={dForm.code} onChange={e => setDForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CSE, ECE, MECH…" /></Field></Grid>
                            <Grid item xs={12}><Field label="Full Name *"><input required style={inputSx} value={dForm.name} onChange={e => setDForm(f => ({ ...f, name: e.target.value }))} placeholder="Computer Science & Engineering" /></Field></Grid>
                        </Grid>
                        <Stack direction="row" gap={1} justifyContent="flex-end" mt={3}>
                            <Button onClick={() => setDeptModal(false)}>Cancel</Button>
                            <Button type="submit" variant="contained">Add Department</Button>
                        </Stack>
                    </form>
                </Modal>
            )}


        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGNMENTS VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function AssignmentsView({ push }) {
    const ts = useTableStyles();
    const [activeTab, setActiveTab] = useState(0);

    // Subject Assignments state
    const [rows, setRows] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [years, setYears] = useState([]);
    const [modal, setModal] = useState(false);
    const [yearModal, setYearModal] = useState(false);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ facultyId: '', subjectId: '', classId: '', academicYearId: '', section: 'A' });
    const [yForm, setYForm] = useState({ name: '', active: false });

    // Lab Assignments state
    const [labForm, setLabForm] = useState({ labId: '', facultyIds: ['', '', ''], classId: '', academicYearId: '' });
    const [activeLabs, setActiveLabs] = useState([]);
    const [loadingLabs, setLoadingLabs] = useState(false);

    const loadAll = useCallback(async () => {
        try {
            const [a, f, s, c, y] = await Promise.all([adminDataAPI.request('GET', '/assignments'), adminDataAPI.request('GET', '/faculty'), adminDataAPI.request('GET', '/subjects'), adminDataAPI.request('GET', '/classes'), adminDataAPI.request('GET', '/academic-years')]);
            setRows(a); setFaculty(f); setSubjects(asArray(s)); setClasses(c); setYears(y);
        } catch (e) { push(e.message, 'error'); }
    }, [push]);

    const loadLabData = useCallback(async () => {
        setLoadingLabs(true);
        try {
            const al = await adminDataAPI.request('GET', '/labs/assignments/active');
            setActiveLabs(asArray(al));
        } catch (e) {
            console.error("Failed to load active labs:", e);
            setActiveLabs([]);
        } finally { setLoadingLabs(false); }
    }, []);

    useEffect(() => { loadAll(); loadLabData(); }, [loadAll, loadLabData]);

    const submit = async e => {
        e.preventDefault();
        try { await adminDataAPI.request('POST', '/assignments', { facultyId: +form.facultyId, subjectId: +form.subjectId, classId: +form.classId, academicYearId: +form.academicYearId, section: form.section }); push('Assignment created'); setModal(false); loadAll(); } catch (err) { push(err.message, 'error'); }
    };
    const del = async id => { if (!window.confirm('Remove this assignment?')) return; try { await adminDataAPI.request('DELETE', `/assignments/${id}`); push('Removed'); loadAll(); } catch (e) { push(e.message, 'error'); } };
    const submitYear = async e => {
        e.preventDefault();
        try { await adminDataAPI.request('POST', '/academic-years', yForm); push('Academic year created'); setYearModal(false); loadAll(); } catch (err) { push(err.message, 'error'); }
    };

    const submitLabAssignment = async e => {
        e.preventDefault();
        const ids = labForm.facultyIds.filter(id => id !== '');
        if (ids.length !== 3) {
            push('Exactly 3 faculty members are required for lab assignment', 'error');
            return;
        }
        try {
            await adminDataAPI.request('POST', `/labs/${labForm.labId}/faculty`, null, {
                facultyIds: ids.join(','),
                classId: labForm.classId,
                academicYearId: labForm.academicYearId
            });
            push('Lab faculty assigned successfully');
            setLabForm({ labId: '', facultyIds: ['', '', ''], classId: '', academicYearId: '' });
            loadLabData();
        } catch (err) { 
            const msg = err.response?.data?.message || err.message;
            push(msg, 'error'); 
        }
    };

    const filtered = rows.filter(r => `${r.facultyName}${r.subjectName}${r.className}`.toLowerCase().includes(search.toLowerCase()));

    return (
        <Box>
            <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setSearch(''); }} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Subject Assignments" />
                <Tab label={`Lab Assignments (${activeLabs.length})`} />
            </Tabs>

            {activeTab === 0 && (
                <>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                        <Stack direction="row" gap={2} flex={1}>
                            <input style={{ ...inputSx, flex: 1, minWidth: 200 }} placeholder="🔍  Search…" value={search} onChange={e => setSearch(e.target.value)} />
                        </Stack>
                        <Stack direction="row" gap={1}>
                            <Button variant="outlined" onClick={() => { setYForm({ name: '', active: false }); setYearModal(true); }}>+ Academic Year</Button>
                            <Button variant="contained" onClick={() => { setForm({ facultyId: faculty[0]?.id || '', subjectId: subjects[0]?.id || '', classId: classes[0]?.id || '', academicYearId: years.find(y => y.active)?.id || years[0]?.id || '', section: 'A' }); setModal(true); }} disabled={!faculty.length || !subjects.length}>+ Assign Subject</Button>
                        </Stack>
                    </Stack>

                    {(!faculty.length || !subjects.length) && (
                        <Box sx={{ p: 2, mb: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                            <Typography variant="body2">⚠️ Add faculty & subjects first before creating assignments.</Typography>
                        </Box>
                    )}

                    <Card variant="outlined">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead><tr style={{ background: ts.thBg }}>{['Faculty', 'Subject', 'Class', 'Academic Year', 'Section', 'Actions'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                            <tbody>
                                {filtered.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No assignments yet</td></tr>
                                    : filtered.map(r => (
                                        <tr key={r.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                            <td style={{ padding: '10px 14px' }}><div style={{ fontWeight: 500 }}>{r.facultyName}</div><div style={{ fontSize: 12, color: ts.tdSub }}>{r.facultyIdCode}</div></td>
                                            <td style={{ padding: '10px 14px' }}><div>{r.subjectName}</div><Chip label={r.subjectCode} size="small" color="info" variant="outlined" sx={{ mt: 0.5 }} /></td>
                                            <td style={{ padding: '10px 14px' }}>{r.className}</td>
                                            <td style={{ padding: '10px 14px' }}><Chip label={r.academicYearName} size="small" color="warning" variant="outlined" /></td>
                                            <td style={{ padding: '10px 14px' }}>{r.section}</td>
                                            <td style={{ padding: '10px 14px' }}><Button size="small" color="error" onClick={() => del(r.id)}>Remove</Button></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </Card>

                    {modal && (
                        <Modal title="Assign Subject to Faculty" onClose={() => setModal(false)}>
                            <form onSubmit={submit}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}><Field label="Faculty *"><select required style={inputSx} value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}><option value="">— Select —</option>{faculty.map(f => <option key={f.id} value={f.id}>{f.firstName} {f.lastName} ({f.facultyId})</option>)}</select></Field></Grid>
                                    <Grid item xs={12}><Field label="Subject *"><select required style={inputSx} value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}><option value="">— Select —</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></Field></Grid>
                                    <Grid item xs={12}><Field label="Class *"><select required style={inputSx} value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}><option value="">— Select —</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></Grid>
                                    <Grid item xs={8}><Field label="Academic Year *"><select required style={inputSx} value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))}><option value="">— Select —</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}{y.active ? ' ✓' : ''}</option>)}</select></Field></Grid>
                                    <Grid item xs={4}><Field label="Section"><input style={inputSx} value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} /></Field></Grid>
                                </Grid>
                                <Stack direction="row" gap={1} justifyContent="flex-end" mt={3}>
                                    <Button onClick={() => setModal(false)}>Cancel</Button>
                                    <Button type="submit" variant="contained">Create Assignment</Button>
                                </Stack>
                            </form>
                        </Modal>
                    )}
                    {yearModal && (
                        <Modal title="Create Academic Year" onClose={() => setYearModal(false)}>
                            <form onSubmit={submitYear}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}><Field label="Year Name *"><input required style={inputSx} value={yForm.name} onChange={e => setYForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 2024-2025" /></Field></Grid>
                                    <Grid item xs={12}><label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={yForm.active} onChange={e => setYForm(f => ({ ...f, active: e.target.checked }))} /> Set as current active year</label></Grid>
                                </Grid>
                                <Stack direction="row" gap={1} justifyContent="flex-end" mt={3}>
                                    <Button onClick={() => setYearModal(false)}>Cancel</Button>
                                    <Button type="submit" variant="contained">Create</Button>
                                </Stack>
                            </form>
                        </Modal>
                    )}
                </>
            )}

            {activeTab === 1 && (
                <>
                    <Card variant="outlined" sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Assign Faculty to Lab</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Select a lab subject and exactly three faculty members to conduct the lab sessions.
                        </Typography>
                        <form onSubmit={submitLabAssignment}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Field label="Lab Subject *">
                                        <select required style={inputSx} value={labForm.labId} onChange={e => setLabForm(f => ({ ...f, labId: e.target.value }))}>
                                            <option value="">— Select Lab —</option>
                                            {subjects.filter(s => s.subjectType === 'LAB').map(l => (
                                                <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                                            ))}
                                        </select>
                                    </Field>
                                </Grid>
                                
                                {[0, 1, 2].map(i => (
                                    <Grid item xs={12} md={4} key={i}>
                                        <Field label={`Faculty Member ${i + 1} *`}>
                                            <select required style={inputSx} value={labForm.facultyIds[i]} onChange={e => {
                                                const newIds = [...labForm.facultyIds];
                                                newIds[i] = e.target.value;
                                                setLabForm(f => ({ ...f, facultyIds: newIds }));
                                            }}>
                                                <option value="">— Select —</option>
                                                {faculty.map(f => (
                                                    <option key={f.id} value={f.id}>{f.firstName} {f.lastName} ({f.facultyId})</option>
                                                ))}
                                            </select>
                                        </Field>
                                    </Grid>
                                ))}

                                <Grid item xs={12} md={6}>
                                    <Field label="Course Class *">
                                        <select required style={inputSx} value={labForm.classId} onChange={e => setLabForm(f => ({ ...f, classId: e.target.value }))}>
                                            <option value="">— Select Class —</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Field label="Academic Year *">
                                        <select required style={inputSx} value={labForm.academicYearId} onChange={e => setLabForm(f => ({ ...f, academicYearId: e.target.value }))}>
                                            <option value="">— Select Year —</option>
                                            {years.map(ay => (
                                                <option key={ay.id} value={ay.id}>{ay.name}{ay.active ? ' (Active)' : ''}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </Grid>

                                <Grid item xs={12}>
                                    <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
                                        <Button type="submit" variant="contained" size="large" sx={{ px: 4 }}>Assign Lab Faculty</Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </form>
                    </Card>

                    {/* Active Lab Assignments Table */}
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>Active Lab Assignments ({activeLabs.length})</Typography>
                        <Card variant="outlined">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: ts.thBg }}>
                                        {['Lab Subject', 'Class', 'Faculty Members', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeLabs.length === 0 ? (
                                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No lab assignments yet</td></tr>
                                    ) : (
                                        Object.values(activeLabs.reduce((acc, curr) => {
                                            const key = `${curr.labSubject?.id}-${curr.courseClass?.id}`;
                                            if (!acc[key]) acc[key] = { ...curr, facultyList: [curr.faculty] };
                                            else acc[key].facultyList.push(curr.faculty);
                                            return acc;
                                        }, {})).map((group, idx) => (
                                            <tr key={idx} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <Typography variant="body2" fontWeight={600}>{group.labSubject?.name}</Typography>
                                                    <Chip label={group.labSubject?.code} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                                                </td>
                                                <td style={{ padding: '10px 14px' }}>{group.courseClass?.name}</td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <Stack spacing={0.5}>
                                                        {group.facultyList?.map(f => (
                                                            <Typography key={f.id} variant="caption" sx={{ display: 'block' }}>
                                                                • {f.firstName} {f.lastName} ({f.facultyId})
                                                            </Typography>
                                                        ))}
                                                    </Stack>
                                                </td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <Button size="small" color="error" onClick={async () => {
                                                        if (!window.confirm('Deactivate these assignments?')) return;
                                                        try {
                                                            await adminDataAPI.request('DELETE', `/labs/assignment/${group.id}`);
                                                            push('Assignment removed');
                                                            loadLabData();
                                                        } catch (e) { push(e.message, 'error'); }
                                                    }}>Remove</Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </Box>
                </>
            )}
        </Box>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ACADEMIC EXPLORER — UG/PG -> Dept -> Class -> Manage
// ═══════════════════════════════════════════════════════════════════════════════
function AcademicExplorerView({ departments, push }) {
    const ts = useTableStyles();
    const [phase, setPhase] = useState('PROGRAM'); // PROGRAM | DEPT | CLASS | MANAGE
    const [selection, setSelection] = useState({ program: null, dept: null, class: null });
    const [phaseData, setPhaseData] = useState({ depts: [], classes: [], classDetails: null, students: [], teachingFaculty: [] });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    // Add Modals State
    const [openAddDept, setOpenAddDept] = useState(false);
    const [openAddClass, setOpenAddClass] = useState(false);
    const [openAddStudent, setOpenAddStudent] = useState(false);
    const [openBulkUpload, setOpenBulkUpload] = useState(false);

    const [deptForm, setDeptForm] = useState({ code: '', name: '' });
    const [classForm, setClassForm] = useState({ name: '', yearLevel: 1 });
    const [stForm, setStForm] = useState({ firstName: '', lastName: '', rollNumber: '', email: '', contactNumber: '', section: 'A' });

    const onSelectProgram = async (p) => {
        setLoading(true);
        try {
            const d = await adminDataAPI.request('GET', '/departments', null, { programType: p });
            setSelection({ program: p, dept: null, class: null });
            setPhaseData(prev => ({ ...prev, depts: asArray(d) }));
            setPhase('DEPT');
        } catch (e) { push(e.message, 'error'); }
        finally { setLoading(false); }
    };

    const onSelectDept = async (d) => {
        setLoading(true);
        try {
            const allC = await adminDataAPI.request('GET', '/classes');
            const filtered = asArray(allC).filter(c => {
                const match = c.department === d.code && c.programType === selection.program;
                if (!match) console.log(`DEBUG: Filtered out class ${c.name} (Dept: ${c.department}, PT: ${c.programType}) because it doesn't match ${d.code} / ${selection.program}`);
                return match;
            });
            setSelection(prev => ({ ...prev, dept: d, class: null }));
            setPhaseData(prev => ({ ...prev, classes: filtered }));
            setPhase('CLASS');
        } catch (e) { push(e.message, 'error'); }
        finally { setLoading(false); }
    };

    const onSelectClass = async (c) => {
        setLoading(true);
        try {
            const [details, students, faculty] = await Promise.all([
                adminDataAPI.request('GET', `/classes/${c.id}`),
                adminDataAPI.request('GET', `/classes/${c.id}/students`),
                adminDataAPI.request('GET', `/classes/${c.id}/teaching-faculty`)
            ]);
            
            setSelection(prev => ({ ...prev, class: c }));
            setPhaseData(prev => ({ ...prev, classDetails: details, students: asArray(students), teachingFaculty: asArray(faculty) }));
            setPhase('MANAGE');
            setActiveTab(0);
        } catch (e) { push(e.message, 'error'); }
        finally { setLoading(false); }
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminDataAPI.request('POST', '/classes', {
                name: classForm.name,
                department: selection.dept?.code,
                yearLevel: classForm.yearLevel,
                programType: selection.program,
            });
            push('Class created successfully', 'success');
            setOpenAddClass(false);
            setClassForm({ name: '', yearLevel: 1 });
            // Refresh class list
            const allC = await adminDataAPI.request('GET', '/classes');
            const filtered = asArray(allC).filter(c => c.department === selection.dept?.code && c.programType === selection.program);
            setPhaseData(prev => ({ ...prev, classes: filtered }));
        } catch (e) { push(e.message, 'error'); }
        finally { setLoading(false); }
    };

    const handleUpdateClass = async (body) => {
        try {
            const updated = await adminDataAPI.request('PUT', `/classes/${selection.class.id}`, body);
            setPhaseData(prev => ({ ...prev, classDetails: updated }));
            push('Class details updated successfully');
        } catch (e) { push(e.message, 'error'); }
    };

    const handleClassFileUpload = async (type, file) => {
        if (!file) return;
        setLoading(true);
        try {
            let res;
            if (type === 'timetable') {
                res = await uploadClassTimetableFile(selection.class.id, file);
            } else {
                res = await uploadClassSyllabusFile(selection.class.id, file);
            }
            
            const data = res; // API wrapper already returns response.data
            
            // Update local state
            setPhaseData(prev => ({
                ...prev,
                classDetails: {
                    ...prev.classDetails,
                    [type === 'timetable' ? 'timetableUrl' : 'syllabusUrl']: data.fileUrl
                }
            }));
            
            push(`${type === 'timetable' ? 'Timetable' : 'Syllabus'} uploaded successfully!`);
        } catch (e) { push(e.message, 'error'); }
        finally { setLoading(false); }
    };

    const handleDeleteClass = async (id) => {
        setLoading(true);
        try {
            await adminDataAPI.request('DELETE', `/classes/${id}`);
            push('Class deleted successfully');
            // Refresh classes for current department
            const allC = await adminDataAPI.request('GET', '/classes');
            const filtered = asArray(allC).filter(c =>
                c.department === selection.dept.code && c.programType === selection.program
            );
            setPhaseData(prev => ({ ...prev, classes: filtered }));
        } catch (e) { push(e.message, 'error'); }
        finally { setLoading(false); }
    };

    const handleDeleteStudent = async (student) => {
        if (!window.confirm(`Are you sure you want to delete student ${student.firstName} ${student.lastName} (${student.rollNumber})? This will remove all their attendance records and class mappings.`)) return;
        setLoading(true);
        try {
            await adminDataAPI.request('DELETE', `/students/${student.id}`);
            push('Student deleted successfully');
            // Refresh student list
            const students = await adminDataAPI.request('GET', `/classes/${selection.class.id}/students`);
            setPhaseData(prev => ({ ...prev, students: asArray(students) }));
        } catch (e) { push(e.message, 'error'); }
        finally { setLoading(false); }
    };


    const goBack = () => {
        if (phase === 'DEPT') {
            setPhase('PROGRAM');
            setSelection({ program: null, dept: null, class: null });
        }
        if (phase === 'CLASS') {
            setPhase('DEPT');
            setSelection(prev => ({ ...prev, dept: null, class: null }));
        }
        if (phase === 'MANAGE') {
            setPhase('CLASS');
            setSelection(prev => ({ ...prev, class: null }));
        }
    };

    const handleAddDept = async (e) => {
        e.preventDefault();
        try {
            await adminDataAPI.request('POST', '/departments', deptForm);
            push('Department added successfully');
            setOpenAddDept(false);
            setDeptForm({ code: '', name: '' });
            onSelectProgram(selection.program);
        } catch (e) { push(e.message, 'error'); }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await adminDataAPI.request('POST', '/students', {
                ...stForm,
                departmentCode: selection.dept.code,
                program: selection.program,
                currentSemester: selection.class.yearLevel,
                admissionYear: new Date().getFullYear(),
                status: 'ACTIVE',
                classId: selection.class.id
            });
            push('Student added successfully');
            setOpenAddStudent(false);
            setStForm({ firstName: '', lastName: '', rollNumber: '', email: '', contactNumber: '', section: 'A' });
            onSelectClass(selection.class);
        } catch (e) { push(e.message, 'error'); }
    };

    if (loading && phase !== 'MANAGE') return <Box sx={{ py: 8, textAlign: 'center' }}><Typography color="text.secondary">Loading academic structure…</Typography></Box>;

    return (
        <Box>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                {phase !== 'PROGRAM' && <IconButton onClick={goBack}><LogoutIcon sx={{ transform: 'rotate(180deg)' }} /></IconButton>}
                <Breadcrumbs separator="›">
                    <Typography variant="body2" color={phase === 'PROGRAM' ? 'primary' : 'text.secondary'} sx={{ fontWeight: phase === 'PROGRAM' ? 700 : 400 }}>Programs</Typography>
                    {selection.program && <Typography variant="body2" color={phase === 'DEPT' ? 'primary' : 'text.secondary'} sx={{ fontWeight: phase === 'DEPT' ? 700 : 400 }}>{selection.program}</Typography>}
                    {selection.dept && <Typography variant="body2" color={phase === 'CLASS' ? 'primary' : 'text.secondary'} sx={{ fontWeight: phase === 'CLASS' ? 700 : 400 }}>{selection.dept.code}</Typography>}
                    {selection.class && <Typography variant="body2" color={phase === 'MANAGE' ? 'primary' : 'text.secondary'} sx={{ fontWeight: phase === 'MANAGE' ? 700 : 400 }}>{selection.class.name}</Typography>}
                </Breadcrumbs>
            </Stack>

            {phase === 'PROGRAM' && (
                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="subtitle2" color="text.secondary">Select a program category to explore departments and classes.</Typography>
                        <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<SettingsIcon />} 
                            onClick={async () => {
                                if (window.confirm('This will ensure all standard JNTUA departments (CSE, ECE, CIVIL, etc.) exist with their default UG/PG programs. Continue?')) {
                                    try {
                                        await adminDataAPI.request('POST', '/departments/seed');
                                        push('Departments and Programs initialized successfully');
                                        // No need to refresh as we are in PROGRAM phase, but user can click a program to see them
                                    } catch (e) { push(e.message, 'error'); }
                                }
                            }}
                        >
                            Quick Initialize All Depts
                        </Button>
                    </Stack>
                    <Grid container spacing={3}>
                        {['UG', 'PG'].map(p => (
                            <Grid item xs={12} sm={6} key={p}>
                                <Card sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.3s', '&:hover': { borderColor: 'primary.main', transform: 'scale(1.02)' } }} onClick={() => onSelectProgram(p)}>
                                    <Stack alignItems="center">
                                        <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                        <Typography variant="h4" fontWeight={900}>{p}</Typography>
                                        <Typography color="text.secondary">{p === 'UG' ? 'Undergraduate' : 'Postgraduate'} Programs</Typography>
                                    </Stack>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {phase === 'DEPT' && (
                <Box>
                    <Grid container spacing={2}>
                        {phaseData.depts.map(d => (
                            <Grid item xs={12} sm={4} md={3} key={d.code}>
                                <Card sx={{ p: 3, cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => onSelectDept(d)}>
                                    <Typography variant="h6" fontWeight={800} color="primary">{d.code}</Typography>
                                    <Typography variant="body2" noWrap>{d.name}</Typography>
                                </Card>
                            </Grid>
                        ))}
                        <Grid item xs={12} sm={4} md={3}>
                            <Card 
                                sx={{ p: 3, cursor: 'pointer', border: '2px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 100, transition: '0.2s', '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' } }} 
                                onClick={() => setOpenAddDept(true)}
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AddIcon color="primary" />
                                    <Typography fontWeight={700} color="primary">Add Dept</Typography>
                                </Stack>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {phase === 'CLASS' && (
                <Box>
                    <Grid container spacing={2}>
                        {phaseData.classes.map(c => (
                            <Grid item xs={12} sm={6} md={4} key={c.id}>
                                <Card sx={{ p: 3, cursor: 'pointer', position: 'relative', transition: '0.2s', '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-4px)', boxShadow: 4 } }} onClick={() => onSelectClass(c)}>
                                    <IconButton 
                                        size="small" 
                                        sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Delete class "${c.name}"? This will remove all student and faculty mappings.`)) {
                                                handleDeleteClass(c.id);
                                            }
                                        }}
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                    <Typography variant="h6" fontWeight={800}>{c.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">Year Level: {c.yearLevel}</Typography>
                                </Card>
                            </Grid>
                        ))}
                        <Grid item xs={12} sm={6} md={4}>
                            <Card 
                                sx={{ p: 3, cursor: 'pointer', border: '2px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 100, transition: '0.2s', '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' } }} 
                                onClick={() => setOpenAddClass(true)}
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AddIcon color="primary" />
                                    <Typography fontWeight={700} color="primary">Add New Class</Typography>
                                </Stack>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {phase === 'MANAGE' && (
                <Box>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                            <Tab label={`Students (${phaseData.students.length})`} />
                            <Tab label="Time Table & Syllabus" />
                            <Tab label="Class Teacher (CRC)" />
                        </Tabs>
                    </Box>

                    {activeTab === 0 && (
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                                <Box>
                                    <Typography variant="h6" fontWeight={800}>Student List</Typography>
                                    <Typography variant="caption" color="text.secondary">Only students enrolled in {selection.class.name} are shown here.</Typography>
                                </Box>
                                <Stack direction="row" spacing={1}>
                                    <Button 
                                        variant="outlined" 
                                        size="small" 
                                        startIcon={<CloudUploadIcon />}
                                        onClick={() => setOpenBulkUpload(true)}
                                    >
                                        Bulk Import
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        size="small" 
                                        startIcon={<AddIcon />}
                                        onClick={() => setOpenAddStudent(true)}
                                    >
                                        Add Student
                                    </Button>
                                </Stack>
                            </Stack>
                            <StudentsTable filtered={phaseData.students} ts={ts} onEdit={() => {}} onDelete={handleDeleteStudent} />
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box sx={{ maxWidth: 1200 }}>
                            <Stack spacing={3}>
                                <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                                    <TimetableBuilder classId={selection.class?.id} className={selection.class?.name} />
                                </Card>

                                <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={700}>Class Syllabus</Typography>
                                            <Typography variant="caption" color="text.secondary">Upload the syllabus PDF or document</Typography>
                                        </Box>
                                        {phaseData.classDetails?.syllabusUrl && (
                                            <Chip 
                                                label="File Uploaded" 
                                                color="success" 
                                                size="small" 
                                                onClick={() => window.open(`http://localhost:8080${phaseData.classDetails.syllabusUrl}`, '_blank')}
                                                sx={{ cursor: 'pointer' }}
                                            />
                                        )}
                                    </Stack>

                                    <Box sx={{ 
                                        p: 4, border: '2px dashed', borderColor: 'divider', borderRadius: 2, 
                                        textAlign: 'center', bgcolor: 'action.hover', position: 'relative',
                                        transition: '0.3s', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.selected' }
                                    }}>
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf" 
                                            style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                            onChange={(e) => handleClassFileUpload('syllabus', e.target.files[0])}
                                        />
                                        <CloudUploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="body2" fontWeight={600}>Click or drag to upload syllabus</Typography>
                                        <Typography variant="caption" color="text.secondary">Supports PNG, JPG, PDF</Typography>
                                    </Box>

                                    {phaseData.classDetails?.syllabusUrl && (
                                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                                Current: {phaseData.classDetails.syllabusUrl.split('/').pop()}
                                            </Typography>
                                            <Button size="small" onClick={() => window.open(`http://localhost:8080${phaseData.classDetails.syllabusUrl}`, '_blank')}>View</Button>
                                        </Box>
                                    )}

                                    <Divider sx={{ my: 3 }} />

                                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Text Fallback (Optional)</Typography>
                                    <TextField 
                                        fullWidth 
                                        multiline 
                                        rows={3} 
                                        placeholder="Or enter text details..." 
                                        value={phaseData.classDetails?.syllabus || ''}
                                        onChange={(e) => setPhaseData(p => ({ ...p, classDetails: { ...p.classDetails, syllabus: e.target.value } }))}
                                        size="small"
                                    />
                                    <Button variant="outlined" sx={{ mt: 2 }} onClick={() => handleUpdateClass({ syllabus: phaseData.classDetails.syllabus })}>Update Text</Button>
                                </Card>
                            </Stack>
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Card sx={{ p: 4, maxWidth: 600 }}>
                            <Typography variant="h6" fontWeight={700} mb={1}>Class Review Coordinator (CRC)</Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>The CRC must be a faculty member who teaches at least one subject to this class.</Typography>
                            
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Select CRC</InputLabel>
                                <Select 
                                    label="Select CRC"
                                    value={phaseData.classDetails?.crcId || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        handleUpdateClass({ crcId: val || null });
                                    }}
                                >
                                    <MenuItem value=""><em>None Assigned</em></MenuItem>
                                    {phaseData.teachingFaculty.map(f => (
                                        <MenuItem key={f.id} value={f.id}>{f.firstName} {f.lastName} ({f.facultyId})</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {phaseData.teachingFaculty.length === 0 && (
                                <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.light' }}>
                                    <Typography variant="caption" color="error.main" fontWeight={600}>
                                        ⚠️ Note: No faculty members are currently assigned to teach this class. Assign subjects to faculty first to select a CRC.
                                    </Typography>
                                </Box>
                            )}
                            
                            {phaseData.classDetails?.crc && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                                    <Typography variant="body2" color="success.dark">
                                        Current CRC: <strong>{phaseData.classDetails.crc.firstName} {phaseData.classDetails.crc.lastName}</strong>
                                    </Typography>
                                </Box>
                            )}
                        </Card>
                    )}
                </Box>
            )}

            {/* Modals for Academic Explorer - Moved outside of phase blocks */}
            {openAddDept && (
                <Modal title="Add New Department" onClose={() => setOpenAddDept(false)}>
                    <form onSubmit={handleAddDept}>
                        <Stack spacing={2.5}>
                            <Field label="Department Code *">
                                <input required style={inputSx} placeholder="e.g. CSE" value={deptForm.code} onChange={e => setDeptForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                            </Field>
                            <Field label="Full Name *">
                                <input required style={inputSx} placeholder="e.g. Computer Science & Engineering" value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))} />
                            </Field>
                            <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
                                <Button onClick={() => setOpenAddDept(false)}>Cancel</Button>
                                <Button type="submit" variant="contained">Create Department</Button>
                            </Stack>
                        </Stack>
                    </form>
                </Modal>
            )}

            {openAddClass && (
                <Modal title={`Add New Class to ${selection.dept?.code}`} onClose={() => setOpenAddClass(false)}>
                    <form onSubmit={handleAddClass}>
                        <Stack spacing={2.5}>
                            <Field label="Class Name *">
                                <input required style={inputSx} placeholder="e.g. CSE-UG-3A" value={classForm.name} onChange={e => setClassForm(f => ({ ...f, name: e.target.value.toUpperCase() }))} />
                            </Field>
                            <Field label="Year Level *">
                                <input required type="number" style={inputSx} min={1} max={4} value={classForm.yearLevel} onChange={e => setClassForm(f => ({ ...f, yearLevel: parseInt(e.target.value) }))} />
                            </Field>
                            <Typography variant="caption" color="text.secondary">The class will be assigned to {selection.program} {selection.dept?.code}.</Typography>
                            <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
                                <Button onClick={() => setOpenAddClass(false)}>Cancel</Button>
                                <Button type="submit" variant="contained">Create Class</Button>
                            </Stack>
                        </Stack>
                    </form>
                </Modal>
            )}

            {openAddStudent && (
                <Modal title={`Add Student to ${selection.class?.name}`} onClose={() => setOpenAddStudent(false)}>
                    <form onSubmit={handleAddStudent}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}><Field label="First Name *"><input required style={inputSx} value={stForm.firstName} onChange={e => setStForm(f => ({ ...f, firstName: e.target.value }))} /></Field></Grid>
                            <Grid item xs={6}><Field label="Last Name *"><input required style={inputSx} value={stForm.lastName} onChange={e => setStForm(f => ({ ...f, lastName: e.target.value }))} /></Field></Grid>
                            <Grid item xs={12}><Field label="Roll Number *"><input required style={inputSx} value={stForm.rollNumber} onChange={e => setStForm(f => ({ ...f, rollNumber: e.target.value.toUpperCase() }))} /></Field></Grid>
                            <Grid item xs={12}><Field label="Email"><input type="email" style={inputSx} value={stForm.email} onChange={e => setStForm(f => ({ ...f, email: e.target.value }))} /></Field></Grid>
                            <Grid item xs={6}><Field label="Contact No"><input style={inputSx} value={stForm.contactNumber} onChange={e => setStForm(f => ({ ...f, contactNumber: e.target.value }))} /></Field></Grid>
                            <Grid item xs={6}><Field label="Section"><input style={inputSx} value={stForm.section} onChange={e => setStForm(f => ({ ...f, section: e.target.value.toUpperCase() }))} /></Field></Grid>
                        </Grid>
                        <Typography variant="caption" color="primary" sx={{ mt: 2, display: 'block' }}>
                            Note: Dept, Program, and Semester are automatically set for this class.
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="flex-end" mt={3}>
                            <Button onClick={() => setOpenAddStudent(false)}>Cancel</Button>
                            <Button type="submit" variant="contained">Add Student</Button>
                        </Stack>
                    </form>
                </Modal>
            )}

            {openBulkUpload && (
                <Dialog open={openBulkUpload} onClose={() => setOpenBulkUpload(false)} maxWidth="lg" fullWidth>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={800}>Bulk Import Students - {selection.class?.name}</Typography>
                        <IconButton onClick={() => setOpenBulkUpload(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Important: Ensure the Excel/CSV file contains the correct Department ({selection.dept?.code}), Program ({selection.program}), Semester ({selection.class?.yearLevel}), and Section for this class.
                        </Alert>
                        <BulkUploadModule type="student" context={selection.class} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setOpenBulkUpload(false); onSelectClass(selection.class); }} variant="contained">Close & Refresh List</Button>
                    </DialogActions>
                </Dialog>
            )}

        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSES LIST VIEW (Flat list of all classes)
// ═══════════════════════════════════════════════════════════════════════════════
function ClassesView({ push, departments = [] }) {
    const ts = useTableStyles();
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [editModal, setEditModal] = useState(null);
    const [form, setForm] = useState({ name: '', department: '', programType: 'UG', yearLevel: 1 });

    const load = useCallback(async () => {
        setLoading(true);
        try { setRows(asArray(await adminDataAPI.request('GET', '/classes'))); } catch (e) { push(e.message, 'error'); }
        finally { setLoading(false); }
    }, [push]);

    useEffect(() => { load(); }, [load]);

    const openEdit = (r) => {
        setEditModal(r);
        setForm({ name: r.name, department: r.department, programType: r.programType || 'UG', yearLevel: r.yearLevel });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await adminDataAPI.request('PUT', `/classes/${editModal.id}`, form);
            push('Class updated successfully');
            setEditModal(null);
            load();
        } catch (e) { push(e.message, 'error'); }
    };

    const del = async id => {
        if (!window.confirm('Remove this class? All student mappings will be lost.')) return;
        try { await adminDataAPI.request('DELETE', `/classes/${id}`); push('Class deleted'); load(); } catch (e) { push(e.message, 'error'); }
    };

    const filtered = rows.filter(r => 
        `${r.name} ${r.department} ${r.programType}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} gap={2}>
                <input style={{ ...inputSx, maxWidth: 400 }} placeholder="🔍  Search classes…" value={search} onChange={e => setSearch(e.target.value)} />
                <Button variant="outlined" onClick={load} disabled={loading}>Refresh List</Button>
            </Stack>

            <Card variant="outlined">
                <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ background: ts.thBg }}>
                                {['Class Name', 'Department', 'Program', 'Year Level', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Loading classes…</td></tr>
                            : filtered.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No classes found</td></tr>
                            : filtered.map(r => (
                                <tr key={r.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.name}</td>
                                    <td style={{ padding: '10px 14px' }}><Chip label={r.department || 'N/A'} size="small" variant="outlined" color={!r.department ? 'error' : 'default'} /></td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <Chip 
                                            label={r.programType || 'UG'} 
                                            size="small" 
                                            color={r.programType === 'PG' ? 'secondary' : (r.programType === 'UG' ? 'primary' : 'error')} 
                                            variant="contained" 
                                        />
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>Year {r.yearLevel}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <Stack direction="row" gap={1}>
                                            <IconButton size="small" color="primary" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => del(r.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                                        </Stack>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>
            </Card>

            {editModal && (
                <Modal title="Edit Class Metadata" onClose={() => setEditModal(null)}>
                    <form onSubmit={handleSave}>
                        <Stack spacing={2}>
                            <Field label="Class Name *"><input required style={inputSx} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
                            <Field label="Department *">
                                <select required style={inputSx} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                                    <option value="">— Select —</option>
                                    {departments.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                                </select>
                            </Field>
                            <Field label="Program Type *">
                                <select style={inputSx} value={form.programType} onChange={e => setForm(f => ({ ...f, programType: e.target.value }))}>
                                    <option value="UG">UG</option>
                                    <option value="PG">PG</option>
                                </select>
                            </Field>
                            <Field label="Year Level *"><input type="number" required style={inputSx} value={form.yearLevel} onChange={e => setForm(f => ({ ...f, yearLevel: parseInt(e.target.value) }))} /></Field>
                            <Button fullWidth type="submit" variant="contained" sx={{ mt: 1 }}>Save Changes</Button>
                        </Stack>
                    </form>
                </Modal>
            )}
        </Box>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// BULK ATTENDANCE VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function BulkAttendanceView({ push }) {
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const loadAssignments = useCallback(async () => {
        try {
            const data = await adminDataAPI.request('GET', '/assignments');
            setAssignments(asArray(data));
        } catch (e) { push(e.message, 'error'); }
    }, [push]);

    useEffect(() => { loadAssignments(); }, [loadAssignments]);

    return (
        <Box>
            <Typography variant="h5" fontWeight={800} mb={1}>Bulk Attendance Upload</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Upload past attendance records for a specific subject and class.</Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                        <CardContent>
                            <Stack spacing={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Select Class & Subject</InputLabel>
                                    <Select
                                        value={selectedAssignment}
                                        label="Select Class & Subject"
                                        onChange={(e) => setSelectedAssignment(e.target.value)}
                                    >
                                        {assignments.map(a => (
                                            <MenuItem key={a.id} value={a.id}>
                                                {a.className} - {a.subjectName} ({a.facultyName})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {selectedAssignment ? (
                <BulkUploadModule 
                    type="attendance" 
                    context={{ mappingId: selectedAssignment, date }} 
                />
            ) : (
                <Alert severity="info">Please select a class and subject to proceed with upload.</Alert>
            )}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const DRAWER_WIDTH = 240;

const MENU = [
    { id: 'dashboard',    label: 'Dashboard',          icon: <DashboardIcon /> },
    { id: 'explorer',     label: 'Academic Explorer', icon: <SchoolIcon /> },
    { id: 'students',     label: 'Students',            icon: <PeopleIcon /> },
    { id: 'faculty',      label: 'Faculty',             icon: <GroupsIcon /> },

    { id: 'subjects',     label: 'Subjects & Depts',    icon: <SubjectIcon /> },
    { id: 'assignments',  label: 'Subject Assignments', icon: <AssignmentIcon /> },
    { id: 'bulk_attendance', label: 'Bulk Attendance', icon: <CloudUploadIcon /> },
    { id: 'divider' },
    { id: 'promotion',    label: 'Semester Promotion',  icon: <TrendingUpIcon /> },
    { id: 'reports',      label: 'Reports & Analytics', icon: <AssessmentIcon /> },
    { id: 'settings',     label: 'Settings',            icon: <SettingsIcon /> },
];

const AdminDashboardNew = () => {
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [anchorEl, setAnchorEl] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [stats, setStats] = useState({ totalStudents: 0, totalFaculty: 0, activeDepartments: 0, totalSubjects: 0 });
    const { toasts, push, remove } = useToast();

    const loadStats = useCallback(async () => {
        try {
            const [s, f, d, sub] = await Promise.all([
                adminDataAPI.request('GET', '/students'), adminDataAPI.request('GET', '/faculty'),
                adminDataAPI.request('GET', '/departments'), adminDataAPI.request('GET', '/subjects'),
            ]);
            const safeStudents = asArray(s);
            const safeFaculty = asArray(f);
            const safeDepartments = asArray(d);
            const safeSubjects = asArray(sub);
            setStats({
                totalStudents: safeStudents.length,
                totalFaculty: safeFaculty.length,
                activeDepartments: safeDepartments.length,
                totalSubjects: safeSubjects.length
            });
            setDepartments(safeDepartments);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

    const KPI = [
        { label: 'Total Students', value: stats.totalStudents, sub: 'enrolled', grad: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', icon: <PeopleIcon sx={{ fontSize: 56, opacity: 0.25 }} />, view: 'students' },
        { label: 'Total Faculty', value: stats.totalFaculty, sub: 'teaching staff', grad: 'linear-gradient(135deg,#065f46,#10b981)', icon: <GroupsIcon sx={{ fontSize: 56, opacity: 0.25 }} />, view: 'faculty' },
        { label: 'Subjects', value: stats.totalSubjects, sub: 'in curriculum', grad: 'linear-gradient(135deg,#78350f,#f59e0b)', icon: <SubjectIcon sx={{ fontSize: 56, opacity: 0.25 }} />, view: 'subjects' },
        { label: 'Departments', value: stats.activeDepartments, sub: 'active', grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)', icon: <SchoolIcon sx={{ fontSize: 56, opacity: 0.25 }} />, view: 'subjects' },
    ];

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return (
                <Box>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {KPI.map(k => (
                            <Grid item xs={12} sm={6} md={3} key={k.label}>
                                <Card sx={{ background: k.grad, color: '#fff', cursor: 'pointer', transition: 'transform .2s', '&:hover': { transform: 'translateY(-3px)' } }} onClick={() => setActiveView(k.view)}>
                                    <CardContent>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="h3" fontWeight={800}>{k.value}</Typography>
                                                <Typography variant="body1" fontWeight={600}>{k.label}</Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.8 }}>{k.sub}</Typography>
                                            </Box>
                                            {k.icon}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Typography variant="h6" fontWeight={600} mb={2}>Quick Actions</Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {[
                            { label: '+ Add Student', color: 'primary', action: () => setActiveView('students') },
                            { label: '+ Add Faculty', color: 'secondary', action: () => setActiveView('faculty') },
                            { label: '+ Add Subject', color: 'info', action: () => setActiveView('subjects') },
                            { label: 'Assign Subjects', color: 'warning', action: () => setActiveView('assignments') },
                            { label: 'Semester Promotion', color: 'success', action: () => setActiveView('promotion') },
                            { label: 'Academic Explorer', color: 'primary', action: () => setActiveView('explorer') },
                        ].map(a => (
                            <Grid item xs={12} sm={6} md key={a.label}>
                                <Button fullWidth variant="outlined" color={a.color} onClick={a.action} sx={{ py: 1.75, fontWeight: 600 }}>{a.label}</Button>
                            </Grid>
                        ))}
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card><CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>Semester Promotion</Typography>
                                <Typography variant="body2" color="text.secondary" mb={2}>Run end-of-semester promotion for all students by department.</Typography>
                                <Button variant="contained" onClick={() => setActiveView('promotion')}>Open Promotion Engine</Button>
                            </CardContent></Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card><CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>Subject Assignments</Typography>
                                <Typography variant="body2" color="text.secondary" mb={2}>Assign faculty members to subjects and classes for the current year.</Typography>
                                <Button variant="contained" onClick={() => setActiveView('assignments')}>Manage Assignments</Button>
                            </CardContent></Card>
                        </Grid>
                    </Grid>
                </Box>
            );
            case 'students':    return <StudentsView departments={departments} push={push} />;
            case 'faculty':     return <FacultyView departments={departments} push={push} />;
            case 'subjects':    return <SubjectsView push={push} onDeptsChange={setDepartments} />;
            case 'assignments': return <AssignmentsView push={push} />;
            case 'explorer':    return <AcademicExplorerView departments={departments} push={push} />;
            case 'classes':     return <ClassesView push={push} departments={departments} />;
            case 'promotion':   return <PromotionEngineModule />;
            case 'bulk_attendance': return <BulkAttendanceView push={push} />;
            default: return <Card><CardContent><Typography>{activeView} — coming soon</Typography></CardContent></Card>;
        }
    };

    const currentLabel = MENU.find(m => m.id === activeView)?.label || 'Dashboard';

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Toast toasts={toasts} remove={remove} />

            {/* AppBar */}
            <AppBar position="fixed" sx={{ zIndex: t => t.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 1 }}>
                <Toolbar>
                    <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(o => !o)} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: 'primary.main' }}>AttendX Admin</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton color="inherit" sx={{ mr: 1 }}>
                        <Badge badgeContent={0} color="error"><NotificationsIcon /></Badge>
                    </IconButton>
                    <IconButton color="inherit" onClick={e => setAnchorEl(e.currentTarget)}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>A</Avatar>
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem><ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>Profile</MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>Logout</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Drawer variant="permanent" open={drawerOpen} sx={{
                width: drawerOpen ? DRAWER_WIDTH : 64,
                flexShrink: 0,
                '& .MuiDrawer-paper': { width: drawerOpen ? DRAWER_WIDTH : 64, boxSizing: 'border-box', transition: 'width 0.25s', overflowX: 'hidden', borderRight: '1px solid', borderColor: 'divider' },
            }}>
                <Toolbar />
                <Box sx={{ pt: 1 }}>
                    <List dense>
                        {MENU.map(item => item.id === 'divider'
                            ? <Divider key="div" sx={{ my: 1 }} />
                            : (
                                <ListItem key={item.id} disablePadding>
                                    <ListItemButton
                                        selected={activeView === item.id}
                                        onClick={() => setActiveView(item.id)}
                                        sx={{
                                            mx: 1, borderRadius: 1.5, mb: 0.25,
                                            justifyContent: drawerOpen ? 'initial' : 'center',
                                            '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '& .MuiListItemIcon-root': { color: '#fff' }, '&:hover': { bgcolor: 'primary.dark' } },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 0, mr: drawerOpen ? 2 : 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                                        {drawerOpen && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: activeView === item.id ? 600 : 400 }} />}
                                    </ListItemButton>
                                </ListItem>
                            )
                        )}
                    </List>
                </Box>
            </Drawer>

            {/* Main */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
                <Toolbar />
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" fontWeight={700}>{currentLabel}</Typography>
                    <Typography variant="body2" color="text.secondary">Admin Panel / {currentLabel}</Typography>
                </Box>
                {renderContent()}
            </Box>
        </Box>
    );
};

export default AdminDashboardNew;
