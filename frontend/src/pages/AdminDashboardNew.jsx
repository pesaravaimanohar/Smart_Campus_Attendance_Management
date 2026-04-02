import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, Button, IconButton,
    AppBar, Toolbar, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Avatar, Divider, Stack, Menu,
    MenuItem, Badge, Tabs, Tab, Chip, useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Menu as MenuIcon, Dashboard as DashboardIcon, People as PeopleIcon,
    School as SchoolIcon, TrendingUp as TrendingUpIcon,
    Assessment as AssessmentIcon, Settings as SettingsIcon,
    Notifications as NotificationsIcon, AccountCircle as AccountCircleIcon,
    Logout as LogoutIcon, Groups as GroupsIcon, Assignment as AssignmentIcon,
    MenuBook as SubjectIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminDataAPI } from '../services/api';
import BulkUploadModule from '../components/modules/BulkUploadModule';
import PromotionEngineModule from '../components/modules/PromotionEngineModule';

// ─── inline Data Management helpers ────────────────────────────────────────────
const api = adminDataAPI.request;
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
    const BLANK = { firstName: '', lastName: '', email: '', contactNumber: '', gender: 'MALE', rollNumber: '', studentId: '', departmentCode: '', program: 'B_TECH', currentSemester: 1, section: 'A', admissionYear: new Date().getFullYear(), status: 'ACTIVE' };
    const [form, setForm] = useState(BLANK);
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const load = useCallback(async () => { setLoading(true); try { setRows(await api('GET', '/students')); } catch (e) { push(e.message, 'error'); } finally { setLoading(false); } }, [push]);
    useEffect(() => { load(); }, [load]);

    const submit = async e => {
        e.preventDefault();
        try {
            if (modal?.id) { await api('PUT', `/students/${modal.id}`, form); push('Student updated'); }
            else { await api('POST', '/students', form); push('Student added — login: ' + form.rollNumber); }
            setModal(null); load();
        } catch (err) { push(err.message, 'error'); }
    };
    const del = async s => {
        if (!window.confirm(`Delete ${s.firstName} ${s.lastName}?`)) return;
        try { await api('DELETE', `/students/${s.id}`); push('Deleted'); load(); } catch (e) { push(e.message, 'error'); }
    };
    const openEdit = s => { setForm({ firstName: s.firstName||'', lastName: s.lastName||'', email: s.email||'', contactNumber: s.contactNumber||'', gender: s.gender||'MALE', rollNumber: s.rollNumber||'', studentId: s.studentId||'', departmentCode: s.departmentCode||'', program: s.program||'B_TECH', currentSemester: s.currentSemester||1, section: s.section||'A', admissionYear: s.admissionYear||2024, status: s.status||'ACTIVE' }); setModal(s); };

    const filtered = rows.filter(r => `${r.firstName}${r.lastName}${r.rollNumber}${r.email}`.toLowerCase().includes(search.toLowerCase()));

    return (
        <Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`All Students (${rows.length})`} />
                <Tab label="Bulk Upload via Excel" />
            </Tabs>

            {tab === 0 && (
                <>
                    <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
                        <input style={{ ...inputSx, flex: 1, minWidth: 220 }} placeholder="🔍  Search by name, roll number, email…" value={search} onChange={e => setSearch(e.target.value)} />
                        <Button variant="contained" onClick={() => { setForm({ ...BLANK, departmentCode: safeDepartments[0]?.code || '' }); setModal('add'); }}>+ Add Student</Button>
                    </Stack>

                    {loading ? <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Loading…</Typography> : (
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
                                                    <Stack direction="row" gap={1}>
                                                        <Button size="small" onClick={() => openEdit(s)}>Edit</Button>
                                                        <Button size="small" color="error" onClick={() => del(s)}>Delete</Button>
                                                    </Stack>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        </Card>
                    )}
                </>
            )}

            {tab === 1 && <BulkUploadModule type="student" />}

            {modal && (
                <Modal title={modal?.id ? 'Edit Student' : 'Add New Student'} onClose={() => setModal(null)}>
                    <form onSubmit={submit}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}><Field label="First Name *"><input required style={inputSx} value={form.firstName} onChange={set('firstName')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Last Name *"><input required style={inputSx} value={form.lastName} onChange={set('lastName')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Roll Number *"><input required style={inputSx} value={form.rollNumber} onChange={set('rollNumber')} disabled={!!modal?.id} />{!modal?.id && <Typography variant="caption" color="info.main">Used as username & default password</Typography>}</Field></Grid>
                            <Grid item xs={6}><Field label="Email"><input type="email" style={inputSx} value={form.email} onChange={set('email')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Contact"><input style={inputSx} value={form.contactNumber} onChange={set('contactNumber')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Gender"><select style={inputSx} value={form.gender} onChange={set('gender')}><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></Field></Grid>
                            <Grid item xs={6}><Field label="Department *"><select required style={inputSx} value={form.departmentCode} onChange={set('departmentCode')}><option value="">— Select —</option>{safeDepartments.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}</select></Field></Grid>
                            <Grid item xs={6}><Field label="Program"><select style={inputSx} value={form.program} onChange={set('program')}><option value="B_TECH">B.Tech</option><option value="M_TECH">M.Tech</option><option value="MBA">MBA</option><option value="MCA">MCA</option><option value="PHD">PhD</option></select></Field></Grid>
                            <Grid item xs={4}><Field label="Semester"><input type="number" min={1} max={8} style={inputSx} value={form.currentSemester} onChange={set('currentSemester')} /></Field></Grid>
                            <Grid item xs={4}><Field label="Section"><input style={inputSx} value={form.section} onChange={set('section')} /></Field></Grid>
                            <Grid item xs={4}><Field label="Admission Year"><input type="number" style={inputSx} value={form.admissionYear} onChange={set('admissionYear')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Status"><select style={inputSx} value={form.status} onChange={set('status')}><option>ACTIVE</option><option>INACTIVE</option><option>ALUMNI</option></select></Field></Grid>
                        </Grid>
                        <Stack direction="row" gap={1} justifyContent="flex-end" mt={3}>
                            <Button onClick={() => setModal(null)}>Cancel</Button>
                            <Button type="submit" variant="contained">{modal?.id ? 'Update' : 'Add Student'}</Button>
                        </Stack>
                    </form>
                </Modal>
            )}
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
    const BLANK = { firstName: '', lastName: '', email: '', contactNumber: '', gender: 'MALE', facultyId: '', departmentCode: '', designation: 'Assistant Professor', qualifications: '', joiningDate: '', employmentStatus: 'ACTIVE' };
    const [form, setForm] = useState(BLANK);
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const load = useCallback(async () => { setLoading(true); try { setRows(await api('GET', '/faculty')); } catch (e) { push(e.message, 'error'); } finally { setLoading(false); } }, [push]);
    useEffect(() => { load(); }, [load]);

    const submit = async e => {
        e.preventDefault();
        try {
            if (modal?.id) { await api('PUT', `/faculty/${modal.id}`, form); push('Faculty updated'); }
            else { await api('POST', '/faculty', form); push('Faculty added — login: ' + form.facultyId); }
            setModal(null); load();
        } catch (err) { push(err.message, 'error'); }
    };
    const del = async f => {
        if (!window.confirm(`Delete ${f.firstName} ${f.lastName}?`)) return;
        try { await api('DELETE', `/faculty/${f.id}`); push('Deleted'); load(); } catch (e) { push(e.message, 'error'); }
    };
    const openEdit = f => { setForm({ firstName: f.firstName||'', lastName: f.lastName||'', email: f.email||'', contactNumber: f.contactNumber||'', gender: f.gender||'MALE', facultyId: f.facultyId||'', departmentCode: f.departmentCode||'', designation: f.designation||'', qualifications: f.qualifications||'', joiningDate: f.joiningDate||'', employmentStatus: f.employmentStatus||'ACTIVE' }); setModal(f); };

    const filtered = rows.filter(r => `${r.firstName}${r.lastName}${r.facultyId}${r.email}`.toLowerCase().includes(search.toLowerCase()));

    return (
        <Box>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`All Faculty (${rows.length})`} />
                <Tab label="Bulk Upload via Excel" />
            </Tabs>

            {tab === 0 && (
                <>
                    <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
                        <input style={{ ...inputSx, flex: 1, minWidth: 220 }} placeholder="🔍  Search by name, faculty ID, email…" value={search} onChange={e => setSearch(e.target.value)} />
                        <Button variant="contained" onClick={() => { setForm({ ...BLANK, departmentCode: safeDepartments[0]?.code || '' }); setModal('add'); }}>+ Add Faculty</Button>
                    </Stack>

                    {loading ? <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Loading…</Typography> : (
                        <Card variant="outlined">
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                    <thead>
                                        <tr style={{ background: ts.thBg }}>
                                            {['Faculty ID', 'Name', 'Email', 'Department', 'Designation', 'Status', 'Actions'].map(h => (
                                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No faculty found</td></tr>
                                        ) : filtered.map(f => (
                                            <tr key={f.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                                <td style={{ padding: '10px 14px' }}><Chip label={f.facultyId} size="small" color="secondary" variant="outlined" /></td>
                                                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{f.firstName} {f.lastName}</td>
                                                <td style={{ padding: '10px 14px', color: ts.tdMuted }}>{f.email || '—'}</td>
                                                <td style={{ padding: '10px 14px' }}>{f.departmentCode || '—'}</td>
                                                <td style={{ padding: '10px 14px' }}>{f.designation || '—'}</td>
                                                <td style={{ padding: '10px 14px' }}><Chip label={f.employmentStatus} size="small" color={f.employmentStatus === 'ACTIVE' ? 'success' : 'default'} /></td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <Stack direction="row" gap={1}>
                                                        <Button size="small" onClick={() => openEdit(f)}>Edit</Button>
                                                        <Button size="small" color="error" onClick={() => del(f)}>Delete</Button>
                                                    </Stack>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        </Card>
                    )}
                </>
            )}

            {tab === 1 && <BulkUploadModule type="faculty" />}

            {modal && (
                <Modal title={modal?.id ? 'Edit Faculty' : 'Add New Faculty'} onClose={() => setModal(null)}>
                    <form onSubmit={submit}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}><Field label="First Name *"><input required style={inputSx} value={form.firstName} onChange={set('firstName')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Last Name *"><input required style={inputSx} value={form.lastName} onChange={set('lastName')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Faculty ID *"><input required style={inputSx} value={form.facultyId} onChange={set('facultyId')} disabled={!!modal?.id} />{!modal?.id && <Typography variant="caption" color="info.main">Used as username & default password</Typography>}</Field></Grid>
                            <Grid item xs={6}><Field label="Joining Date"><input type="date" style={inputSx} value={form.joiningDate} onChange={set('joiningDate')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Email"><input type="email" style={inputSx} value={form.email} onChange={set('email')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Contact"><input style={inputSx} value={form.contactNumber} onChange={set('contactNumber')} /></Field></Grid>
                            <Grid item xs={6}><Field label="Department *"><select required style={inputSx} value={form.departmentCode} onChange={set('departmentCode')}><option value="">— Select —</option>{safeDepartments.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}</select></Field></Grid>
                            <Grid item xs={6}><Field label="Designation"><select style={inputSx} value={form.designation} onChange={set('designation')}><option>Assistant Professor</option><option>Associate Professor</option><option>Professor</option><option>HOD</option><option>Principal</option><option>Lecturer</option></select></Field></Grid>
                            <Grid item xs={6}><Field label="Qualifications"><input style={inputSx} value={form.qualifications} onChange={set('qualifications')} placeholder="B.Tech, M.Tech…" /></Field></Grid>
                            <Grid item xs={6}><Field label="Gender"><select style={inputSx} value={form.gender} onChange={set('gender')}><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></Field></Grid>
                            <Grid item xs={6}><Field label="Status"><select style={inputSx} value={form.employmentStatus} onChange={set('employmentStatus')}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="ON_LEAVE">ON LEAVE</option></select></Field></Grid>
                        </Grid>
                        <Stack direction="row" gap={1} justifyContent="flex-end" mt={3}>
                            <Button onClick={() => setModal(null)}>Cancel</Button>
                            <Button type="submit" variant="contained">{modal?.id ? 'Update' : 'Add Faculty'}</Button>
                        </Stack>
                    </form>
                </Modal>
            )}
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
    const [sForm, setSForm] = useState({ name: '', code: '' });
    const [dForm, setDForm] = useState({ code: '', name: '' });

    const loadSubjects = useCallback(async () => {
        try { setSubjects(asArray(await api('GET', '/subjects'))); } catch (e) { push(e.message, 'error'); }
    }, [push]);
    const loadDepts = useCallback(async () => {
        try {
            const d = asArray(await api('GET', '/departments'));
            setDepartments(d);
            if (onDeptsChange) onDeptsChange(d);
        } catch (e) { push(e.message, 'error'); }
    }, [push, onDeptsChange]);
    useEffect(() => { loadSubjects(); loadDepts(); }, [loadSubjects, loadDepts]);

    const submitSubject = async e => {
        e.preventDefault();
        try {
            if (modal?.id) { await api('PUT', `/subjects/${modal.id}`, sForm); push('Subject updated'); }
            else { await api('POST', '/subjects', sForm); push('Subject added'); }
            setModal(null); loadSubjects();
        } catch (err) { push(err.message, 'error'); }
    };
    const delSubject = async s => {
        if (!window.confirm(`Delete "${s.name}"?`)) return;
        try { await api('DELETE', `/subjects/${s.id}`); push('Deleted'); loadSubjects(); } catch (e) { push(e.message, 'error'); }
    };

    const submitDept = async e => {
        e.preventDefault();
        try { await api('POST', '/departments', dForm); push('Department created'); setDeptModal(false); setDForm({ code: '', name: '' }); loadDepts(); }
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
                        <Button variant="contained" onClick={() => { setSForm({ name: '', code: '' }); setModal('add'); }}>+ Add Subject</Button>
                    </Stack>
                    <Card variant="outlined">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead><tr style={{ background: ts.thBg }}>{['#', 'Code', 'Subject Name', 'Actions'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                            <tbody>
                                {filteredSub.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No subjects yet</td></tr>
                                    : filteredSub.map((s, i) => (
                                        <tr key={s.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                            <td style={{ padding: '10px 14px', color: ts.tdEmpty }}>{i + 1}</td>
                                            <td style={{ padding: '10px 14px' }}><Chip label={s.code} size="small" color="info" variant="outlined" /></td>
                                            <td style={{ padding: '10px 14px', fontWeight: 500 }}>{s.name}</td>
                                            <td style={{ padding: '10px 14px' }}>
                                                <Stack direction="row" gap={1}>
                                                    <Button size="small" onClick={() => { setSForm({ name: s.name, code: s.code }); setModal(s); }}>Edit</Button>
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
                            <thead><tr style={{ background: ts.thBg }}>{['Code', 'Name', 'Status'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: ts.thColor, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                            <tbody>
                                {safeDepartments.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: ts.tdEmpty }}>No departments yet</td></tr>
                                    : safeDepartments.map(d => (
                                        <tr key={d.id} style={{ borderTop: `1px solid ${ts.tableBorder}` }}>
                                            <td style={{ padding: '10px 14px' }}><Chip label={d.code} size="small" color="primary" variant="outlined" /></td>
                                            <td style={{ padding: '10px 14px', fontWeight: 500 }}>{d.name}</td>
                                            <td style={{ padding: '10px 14px' }}><Chip label={d.active ? 'Active' : 'Inactive'} size="small" color={d.active ? 'success' : 'default'} /></td>
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

    const loadAll = useCallback(async () => {
        try {
            const [a, f, s, c, y] = await Promise.all([api('GET', '/assignments'), api('GET', '/faculty'), api('GET', '/subjects'), api('GET', '/classes'), api('GET', '/academic-years')]);
            setRows(a); setFaculty(f); setSubjects(s); setClasses(c); setYears(y);
        } catch (e) { push(e.message, 'error'); }
    }, [push]);
    useEffect(() => { loadAll(); }, [loadAll]);

    const submit = async e => {
        e.preventDefault();
        try { await api('POST', '/assignments', { facultyId: +form.facultyId, subjectId: +form.subjectId, classId: +form.classId, academicYearId: +form.academicYearId, section: form.section }); push('Assignment created'); setModal(false); loadAll(); } catch (err) { push(err.message, 'error'); }
    };
    const del = async id => { if (!window.confirm('Remove this assignment?')) return; try { await api('DELETE', `/assignments/${id}`); push('Removed'); loadAll(); } catch (e) { push(e.message, 'error'); } };
    const submitYear = async e => {
        e.preventDefault();
        try { await api('POST', '/academic-years', yForm); push('Academic year created'); setYearModal(false); loadAll(); } catch (err) { push(err.message, 'error'); }
    };

    const filtered = rows.filter(r => `${r.facultyName}${r.subjectName}${r.className}`.toLowerCase().includes(search.toLowerCase()));

    return (
        <Box>
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
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const DRAWER_WIDTH = 240;

const MENU = [
    { id: 'dashboard',    label: 'Dashboard',          icon: <DashboardIcon /> },
    { id: 'students',     label: 'Students',            icon: <PeopleIcon /> },
    { id: 'faculty',      label: 'Faculty',             icon: <GroupsIcon /> },
    { id: 'subjects',     label: 'Subjects & Depts',    icon: <SubjectIcon /> },
    { id: 'assignments',  label: 'Subject Assignments', icon: <AssignmentIcon /> },
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
                api('GET', '/students'), api('GET', '/faculty'),
                api('GET', '/departments'), api('GET', '/subjects'),
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
            case 'promotion':   return <PromotionEngineModule />;
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
