import React, { useState, useEffect, useCallback } from 'react';
import { adminDataAPI, triggerFullSeed } from '../services/api';

async function apiCall(method, path, body) {
  return adminDataAPI.request(method, path, body);
}

// ─── Reusable Modal ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-modal" onClick={e => e.stopPropagation()}>
        <div className="dm-modal-header">
          <h3>{title}</h3>
          <button className="dm-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="dm-modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`dm-toast dm-toast-${type}`}>
      <span>{type === 'success' ? '✓' : '✗'}</span> {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function StudentsTab({ departments, toast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', contactNumber: '',
    gender: 'MALE', rollNumber: '', studentId: '', departmentCode: '',
    program: 'B_TECH', currentSemester: 1, section: 'A',
    admissionYear: new Date().getFullYear(), status: 'ACTIVE',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { setStudents(await apiCall('GET', '/students')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({
      firstName: '', lastName: '', email: '', contactNumber: '',
      gender: 'MALE', rollNumber: '', studentId: '', departmentCode: departments[0]?.code || '',
      program: 'B_TECH', currentSemester: 1, section: 'A',
      admissionYear: new Date().getFullYear(), status: 'ACTIVE',
    });
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      firstName: s.firstName || '', lastName: s.lastName || '',
      email: s.email || '', contactNumber: s.contactNumber || '',
      gender: s.gender || 'MALE', rollNumber: s.rollNumber || '',
      studentId: s.studentId || '', departmentCode: s.departmentCode || '',
      program: s.program || 'B_TECH', currentSemester: s.currentSemester || 1,
      section: s.section || 'A', admissionYear: s.admissionYear || new Date().getFullYear(),
      status: s.status || 'ACTIVE',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) {
        await apiCall('PUT', `/students/${editTarget.id}`, form);
        toast('Student updated successfully', 'success');
      } else {
        await apiCall('POST', '/students', form);
        toast('Student added successfully', 'success');
      }
      setShowForm(false);
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student ${name}? This will also delete their login account.`)) return;
    try {
      await apiCall('DELETE', `/students/${id}`);
      toast('Student deleted', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.rollNumber} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dm-tab-content">
      <div className="dm-toolbar">
        <input className="dm-search" placeholder="🔍 Search students…" value={search}
          onChange={e => setSearch(e.target.value)} />
        <button className="dm-btn dm-btn-primary" onClick={openAdd}>+ Add Student</button>
      </div>

      {loading ? <div className="dm-loading">Loading…</div> : (
        <div className="dm-table-wrap">
          <table className="dm-table">
            <thead>
              <tr>
                <th>Roll No</th><th>Name</th><th>Email</th><th>Department</th>
                <th>Program</th><th>Sem</th><th>Section</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="9" className="dm-empty">No students found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}>
                  <td><span className="dm-badge dm-badge-blue">{s.rollNumber}</span></td>
                  <td className="dm-name">{s.firstName} {s.lastName}</td>
                  <td className="dm-muted">{s.email}</td>
                  <td>{s.departmentName || s.departmentCode || '—'}</td>
                  <td>{s.program}</td>
                  <td>{s.currentSemester}</td>
                  <td>{s.section}</td>
                  <td>
                    <span className={`dm-badge ${s.status === 'ACTIVE' ? 'dm-badge-green' : 'dm-badge-red'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="dm-actions">
                    <button className="dm-btn dm-btn-sm dm-btn-ghost" onClick={() => openEdit(s)}>✏️ Edit</button>
                    <button className="dm-btn dm-btn-sm dm-btn-danger" onClick={() => handleDelete(s.id, `${s.firstName} ${s.lastName}`)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dm-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      )}

      {showForm && (
        <Modal title={editTarget ? 'Edit Student' : 'Add New Student'} onClose={() => setShowForm(false)}>
          <form className="dm-form" onSubmit={handleSubmit}>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>First Name *</label>
                <input required value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} placeholder="First name" />
              </div>
              <div className="dm-form-group">
                <label>Last Name *</label>
                <input required value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} placeholder="Last name" />
              </div>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Roll Number *</label>
                <input required value={form.rollNumber} onChange={e => setForm(f => ({...f, rollNumber: e.target.value}))} placeholder="e.g. 22B91A0501" disabled={!!editTarget} />
                {!editTarget && <small>Used as login username & default password</small>}
              </div>
              <div className="dm-form-group">
                <label>Student ID</label>
                <input value={form.studentId} onChange={e => setForm(f => ({...f, studentId: e.target.value}))} placeholder="Optional" />
              </div>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="student@college.edu" />
              </div>
              <div className="dm-form-group">
                <label>Contact Number</label>
                <input value={form.contactNumber} onChange={e => setForm(f => ({...f, contactNumber: e.target.value}))} placeholder="+91 XXXXXXXXXX" />
              </div>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Department *</label>
                <select required value={form.departmentCode} onChange={e => setForm(f => ({...f, departmentCode: e.target.value}))}>
                  <option value="">— Select —</option>
                  {departments.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                </select>
              </div>
              <div className="dm-form-group">
                <label>Program</label>
                <select value={form.program} onChange={e => setForm(f => ({...f, program: e.target.value}))}>
                  <option value="B_TECH">B.Tech</option>
                  <option value="M_TECH">M.Tech</option>
                  <option value="MBA">MBA</option>
                  <option value="MCA">MCA</option>
                  <option value="PHD">PhD</option>
                </select>
              </div>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Semester</label>
                <input type="number" min={1} max={8} value={form.currentSemester} onChange={e => setForm(f => ({...f, currentSemester: +e.target.value}))} />
              </div>
              <div className="dm-form-group">
                <label>Section</label>
                <input value={form.section} onChange={e => setForm(f => ({...f, section: e.target.value}))} placeholder="A / B / C" />
              </div>
              <div className="dm-form-group">
                <label>Admission Year</label>
                <input type="number" min={2000} max={2099} value={form.admissionYear} onChange={e => setForm(f => ({...f, admissionYear: +e.target.value}))} />
              </div>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                  <option>MALE</option><option>FEMALE</option><option>OTHER</option>
                </select>
              </div>
              <div className="dm-form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                  <option>ACTIVE</option><option>INACTIVE</option><option>ALUMNI</option>
                </select>
              </div>
            </div>
            <div className="dm-form-actions">
              <button type="button" className="dm-btn dm-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="dm-btn dm-btn-primary">{editTarget ? 'Update Student' : 'Add Student'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FACULTY TAB
// ═══════════════════════════════════════════════════════════════════════════════
function FacultyTab({ departments, toast }) {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState('');
  const BLANK = { firstName: '', lastName: '', email: '', contactNumber: '',
    gender: 'MALE', facultyId: '', departmentCode: '', designation: 'Assistant Professor',
    qualifications: '', joiningDate: '', employmentStatus: 'ACTIVE' };
  const [form, setForm] = useState(BLANK);

  const load = useCallback(async () => {
    setLoading(true);
    try { setFaculty(await apiCall('GET', '/faculty')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditTarget(null); setForm({...BLANK, departmentCode: departments[0]?.code || ''}); setShowForm(true); };
  const openEdit = (f) => {
    setEditTarget(f);
    setForm({ firstName: f.firstName||'', lastName: f.lastName||'', email: f.email||'',
      contactNumber: f.contactNumber||'', gender: f.gender||'MALE', facultyId: f.facultyId||'',
      departmentCode: f.departmentCode||'', designation: f.designation||'',
      qualifications: f.qualifications||'', joiningDate: f.joiningDate||'',
      employmentStatus: f.employmentStatus||'ACTIVE' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) { await apiCall('PUT', `/faculty/${editTarget.id}`, form); toast('Faculty updated', 'success'); }
      else { await apiCall('POST', '/faculty', form); toast('Faculty added', 'success'); }
      setShowForm(false); load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete faculty ${name}?`)) return;
    try { await apiCall('DELETE', `/faculty/${id}`); toast('Faculty deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const filtered = faculty.filter(f =>
    `${f.firstName} ${f.lastName} ${f.facultyId} ${f.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dm-tab-content">
      <div className="dm-toolbar">
        <input className="dm-search" placeholder="🔍 Search faculty…" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="dm-btn dm-btn-primary" onClick={openAdd}>+ Add Faculty</button>
      </div>

      {loading ? <div className="dm-loading">Loading…</div> : (
        <div className="dm-table-wrap">
          <table className="dm-table">
            <thead>
              <tr>
                <th>Faculty ID</th><th>Name</th><th>Email</th><th>Department</th>
                <th>Designation</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="7" className="dm-empty">No faculty found</td></tr>
              : filtered.map(f => (
                <tr key={f.id}>
                  <td><span className="dm-badge dm-badge-purple">{f.facultyId}</span></td>
                  <td className="dm-name">{f.firstName} {f.lastName}</td>
                  <td className="dm-muted">{f.email}</td>
                  <td>{f.departmentName || f.departmentCode || '—'}</td>
                  <td>{f.designation}</td>
                  <td><span className={`dm-badge ${f.employmentStatus === 'ACTIVE' ? 'dm-badge-green' : 'dm-badge-red'}`}>{f.employmentStatus}</span></td>
                  <td className="dm-actions">
                    <button className="dm-btn dm-btn-sm dm-btn-ghost" onClick={() => openEdit(f)}>✏️ Edit</button>
                    <button className="dm-btn dm-btn-sm dm-btn-danger" onClick={() => handleDelete(f.id, `${f.firstName} ${f.lastName}`)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dm-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      )}

      {showForm && (
        <Modal title={editTarget ? 'Edit Faculty' : 'Add New Faculty'} onClose={() => setShowForm(false)}>
          <form className="dm-form" onSubmit={handleSubmit}>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>First Name *</label>
                <input required value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} placeholder="First name" />
              </div>
              <div className="dm-form-group">
                <label>Last Name *</label>
                <input required value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} placeholder="Last name" />
              </div>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Faculty ID *</label>
                <input required value={form.facultyId} onChange={e => setForm(f => ({...f, facultyId: e.target.value}))} placeholder="e.g. FAC001" disabled={!!editTarget} />
                {!editTarget && <small>Used as login username & default password</small>}
              </div>
              <div className="dm-form-group">
                <label>Joining Date</label>
                <input type="date" value={form.joiningDate} onChange={e => setForm(f => ({...f, joiningDate: e.target.value}))} />
              </div>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="faculty@college.edu" />
              </div>
              <div className="dm-form-group">
                <label>Contact Number</label>
                <input value={form.contactNumber} onChange={e => setForm(f => ({...f, contactNumber: e.target.value}))} placeholder="+91 XXXXXXXXXX" />
              </div>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Department *</label>
                <select required value={form.departmentCode} onChange={e => setForm(f => ({...f, departmentCode: e.target.value}))}>
                  <option value="">— Select —</option>
                  {departments.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                </select>
              </div>
              <div className="dm-form-group">
                <label>Designation</label>
                <select value={form.designation} onChange={e => setForm(f => ({...f, designation: e.target.value}))}>
                  <option>Assistant Professor</option>
                  <option>Associate Professor</option>
                  <option>Professor</option>
                  <option>HOD</option>
                  <option>Principal</option>
                  <option>Lecturer</option>
                </select>
              </div>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Qualifications</label>
                <input value={form.qualifications} onChange={e => setForm(f => ({...f, qualifications: e.target.value}))} placeholder="B.Tech, M.Tech, PhD…" />
              </div>
              <div className="dm-form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))}>
                  <option>MALE</option><option>FEMALE</option><option>OTHER</option>
                </select>
              </div>
              <div className="dm-form-group">
                <label>Status</label>
                <select value={form.employmentStatus} onChange={e => setForm(f => ({...f, employmentStatus: e.target.value}))}>
                  <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="ON_LEAVE">ON LEAVE</option>
                </select>
              </div>
            </div>
            <div className="dm-form-actions">
              <button type="button" className="dm-btn dm-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="dm-btn dm-btn-primary">{editTarget ? 'Update Faculty' : 'Add Faculty'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SUBJECTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function SubjectsTab({ toast }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', code: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setSubjects(await apiCall('GET', '/subjects')); }
    catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditTarget(null); setForm({ name: '', code: '' }); setShowForm(true); };
  const openEdit = (s) => { setEditTarget(s); setForm({ name: s.name, code: s.code }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTarget) { await apiCall('PUT', `/subjects/${editTarget.id}`, form); toast('Subject updated', 'success'); }
      else { await apiCall('POST', '/subjects', form); toast('Subject added', 'success'); }
      setShowForm(false); load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete subject "${name}"?`)) return;
    try { await apiCall('DELETE', `/subjects/${id}`); toast('Subject deleted', 'success'); load(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const filtered = subjects.filter(s =>
    `${s.name} ${s.code}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dm-tab-content">
      <div className="dm-toolbar">
        <input className="dm-search" placeholder="🔍 Search subjects…" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="dm-btn dm-btn-primary" onClick={openAdd}>+ Add Subject</button>
      </div>

      {loading ? <div className="dm-loading">Loading…</div> : (
        <div className="dm-table-wrap">
          <table className="dm-table">
            <thead><tr><th>#</th><th>Subject Code</th><th>Subject Name</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="4" className="dm-empty">No subjects found</td></tr>
              : filtered.map((s, i) => (
                <tr key={s.id}>
                  <td className="dm-muted">{i + 1}</td>
                  <td><span className="dm-badge dm-badge-teal">{s.code}</span></td>
                  <td className="dm-name">{s.name}</td>
                  <td className="dm-actions">
                    <button className="dm-btn dm-btn-sm dm-btn-ghost" onClick={() => openEdit(s)}>✏️ Edit</button>
                    <button className="dm-btn dm-btn-sm dm-btn-danger" onClick={() => handleDelete(s.id, s.name)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dm-count">{filtered.length} subject{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      )}

      {showForm && (
        <Modal title={editTarget ? 'Edit Subject' : 'Add New Subject'} onClose={() => setShowForm(false)}>
          <form className="dm-form" onSubmit={handleSubmit}>
            <div className="dm-form-group">
              <label>Subject Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Data Structures & Algorithms" />
            </div>
            <div className="dm-form-group">
              <label>Subject Code *</label>
              <input required value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} placeholder="e.g. CS301" />
            </div>
            <div className="dm-form-actions">
              <button type="button" className="dm-btn dm-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="dm-btn dm-btn-primary">{editTarget ? 'Update Subject' : 'Add Subject'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ASSIGNMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function AssignmentsTab({ toast }) {
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    facultyId: '', subjectId: '', classId: '', academicYearId: '', section: 'A'
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [a, f, s, c, ay] = await Promise.all([
        apiCall('GET', '/assignments'), apiCall('GET', '/faculty'),
        apiCall('GET', '/subjects'), apiCall('GET', '/classes'),
        apiCall('GET', '/academic-years'),
      ]);
      setAssignments(a); setFaculty(f); setSubjects(s); setClasses(c); setAcademicYears(ay);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openAdd = () => {
    setForm({
      facultyId: faculty[0]?.id || '', subjectId: subjects[0]?.id || '',
      classId: classes[0]?.id || '', academicYearId: academicYears.find(ay => ay.active)?.id || academicYears[0]?.id || '',
      section: 'A'
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall('POST', '/assignments', {
        facultyId: +form.facultyId, subjectId: +form.subjectId,
        classId: +form.classId, academicYearId: +form.academicYearId,
        section: form.section
      });
      toast('Assignment created', 'success');
      setShowForm(false); loadAll();
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this faculty-subject assignment?')) return;
    try { await apiCall('DELETE', `/assignments/${id}`); toast('Assignment removed', 'success'); loadAll(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const filtered = assignments.filter(a =>
    `${a.facultyName} ${a.facultyIdCode} ${a.subjectName} ${a.subjectCode} ${a.className} ${a.academicYearName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dm-tab-content">
      <div className="dm-toolbar">
        <input className="dm-search" placeholder="🔍 Search assignments…" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="dm-btn dm-btn-primary" onClick={openAdd} disabled={faculty.length === 0 || subjects.length === 0}>
          + Assign Subject to Faculty
        </button>
      </div>
      {faculty.length === 0 && <div className="dm-info-banner">⚠️ Add faculty and subjects first before creating assignments.</div>}

      {loading ? <div className="dm-loading">Loading…</div> : (
        <div className="dm-table-wrap">
          <table className="dm-table">
            <thead>
              <tr><th>Faculty</th><th>Subject</th><th>Class</th><th>Academic Year</th><th>Section</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="6" className="dm-empty">No assignments found</td></tr>
              : filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="dm-name">{a.facultyName}</div>
                    <div className="dm-muted" style={{fontSize:'0.75rem'}}>{a.facultyIdCode}</div>
                  </td>
                  <td>
                    <div>{a.subjectName}</div>
                    <span className="dm-badge dm-badge-teal" style={{fontSize:'0.7rem'}}>{a.subjectCode}</span>
                  </td>
                  <td>{a.className}</td>
                  <td><span className="dm-badge dm-badge-orange">{a.academicYearName}</span></td>
                  <td>{a.section}</td>
                  <td className="dm-actions">
                    <button className="dm-btn dm-btn-sm dm-btn-danger" onClick={() => handleDelete(a.id)}>🗑️ Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dm-count">{filtered.length} assignment{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      )}

      {showForm && (
        <Modal title="Assign Subject to Faculty" onClose={() => setShowForm(false)}>
          <form className="dm-form" onSubmit={handleSubmit}>
            <div className="dm-form-group">
              <label>Faculty *</label>
              <select required value={form.facultyId} onChange={e => setForm(f => ({...f, facultyId: e.target.value}))}>
                <option value="">— Select Faculty —</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.firstName} {f.lastName} ({f.facultyId})</option>)}
              </select>
            </div>
            <div className="dm-form-group">
              <label>Subject *</label>
              <select required value={form.subjectId} onChange={e => setForm(f => ({...f, subjectId: e.target.value}))}>
                <option value="">— Select Subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div className="dm-form-group">
              <label>Class *</label>
              <select required value={form.classId} onChange={e => setForm(f => ({...f, classId: e.target.value}))}>
                <option value="">— Select Class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} - Year {c.yearLevel}</option>)}
              </select>
            </div>
            <div className="dm-form-row">
              <div className="dm-form-group">
                <label>Academic Year *</label>
                <select required value={form.academicYearId} onChange={e => setForm(f => ({...f, academicYearId: e.target.value}))}>
                  <option value="">— Select —</option>
                  {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}{ay.active ? ' ✓ Active' : ''}</option>)}
                </select>
              </div>
              <div className="dm-form-group">
                <label>Section</label>
                <input value={form.section} onChange={e => setForm(f => ({...f, section: e.target.value}))} placeholder="A / B / C" />
              </div>
            </div>
            <div className="dm-form-actions">
              <button type="button" className="dm-btn dm-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="dm-btn dm-btn-primary">Create Assignment</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DEPARTMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function DepartmentsTab({ departments, onRefresh, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '' });
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  const handleSeedDepartments = async () => {
    setSeeding(true);
    try {
      await apiCall('POST', '/departments/seed');
      toast('JNTUA department catalog refreshed', 'success');
      onRefresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall('POST', '/departments', form);
      toast('Department created', 'success');
      setShowForm(false); onRefresh();
    } catch (err) { toast(err.message, 'error'); }
  };

  const filtered = departments.filter(d =>
    `${d.name} ${d.code}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dm-tab-content">
      <div className="dm-toolbar">
        <input className="dm-search" placeholder="🔍 Search departments…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="dm-toolbar-actions">
          <button className="dm-btn dm-btn-secondary" onClick={handleSeedDepartments} disabled={seeding}>
            {seeding ? 'Seeding departments…' : 'Seed JNTUA departments'}
          </button>
          <button className="dm-btn dm-btn-primary" onClick={() => { setForm({code:'',name:''}); setShowForm(true); }}>+ Add Department</button>
        </div>
      </div>
      <div className="dm-table-wrap">
        <table className="dm-table">
          <thead><tr><th>#</th><th>Code</th><th>Name</th><th>Active</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan="4" className="dm-empty">No departments found</td></tr>
            : filtered.map((d, i) => (
              <tr key={d.id}>
                <td className="dm-muted">{i + 1}</td>
                <td><span className="dm-badge dm-badge-blue">{d.code}</span></td>
                <td className="dm-name">{d.name}</td>
                <td><span className={`dm-badge ${d.active ? 'dm-badge-green' : 'dm-badge-red'}`}>{d.active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dm-count">{filtered.length} department{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {showForm && (
        <Modal title="Add Department" onClose={() => setShowForm(false)}>
          <form className="dm-form" onSubmit={handleSubmit}>
            <div className="dm-form-group">
              <label>Department Code *</label>
              <input required value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))} placeholder="e.g. CSE, ECE, MECH" />
            </div>
            <div className="dm-form-group">
              <label>Department Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Computer Science & Engineering" />
            </div>
            <div className="dm-form-actions">
              <button type="button" className="dm-btn dm-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="dm-btn dm-btn-primary">Add Department</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SYSTEM TAB
// ═══════════════════════════════════════════════════════════════════════════════
function SystemTab({ toast }) {
  const [loading, setLoading] = useState(false);

  const handleFullSeed = async () => {
    if (!window.confirm("WARNING: This will generate a massive amount of randomized data (Students, Faculty, and Attendance Sessions). Use this for testing analysis and charts. Proceed?")) return;
    
    setLoading(true);
    try {
      const res = await triggerFullSeed();
      toast(res.message, 'success');
    } catch (e) {
      toast(e.message || "Seeding failed", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dm-tab-content">
      <div className="dm-toolbar">
         <h3 style={{ margin: 0, color: '#e2e8f0' }}>System Maintenance</h3>
      </div>
      
      <div style={{ 
        background: '#1a2035', 
        padding: '2rem', 
        borderRadius: '12px', 
        border: '1px solid #2d3748',
        maxWidth: '700px',
        margin: '2rem auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>🚀</div>
          <div>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Complete Data Seeder</h4>
            <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Populate the entire college system with realistic data. This includes students (60 per class), 
              faculty assignments, and 30 days of randomized attendance history for live analysis.
            </p>
          </div>
        </div>

        <div style={{ 
          background: 'rgba(99,102,241,0.1)', 
          padding: '1rem', 
          borderRadius: '8px', 
          borderLeft: '4px solid #6366f1',
          marginBottom: '2rem'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#a5b4fc', lineHeight: 1.5 }}>
            <strong>Note:</strong> This process might take 10-20 seconds as thousands of records are created. 
            Existing records will be updated or skipped to prevent duplicates.
          </p>
        </div>

        <button 
          className="dm-btn dm-btn-primary" 
          onClick={handleFullSeed}
          disabled={loading}
          style={{ padding: '1rem 2rem', fontSize: '1rem', width: '100%', justifyContent: 'center' }}
        >
          {loading ? '🚀 Seeding Database...' : 'Run Full System Seed'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function DataManagement() {
  const [activeTab, setActiveTab] = useState('students');
  const [departments, setDepartments] = useState([]);
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const loadDepartments = useCallback(async () => {
    try { setDepartments(await apiCall('GET', '/departments')); }
    catch { /* silent */ }
  }, []);

  useEffect(() => { loadDepartments(); }, [loadDepartments]);

  const TABS = [
    { key: 'departments', label: '🏢 Departments', icon: '🏢' },
    { key: 'students',    label: '🎓 Students',    icon: '🎓' },
    { key: 'faculty',     label: '👨‍🏫 Faculty',    icon: '👨‍🏫' },
    { key: 'subjects',    label: '📚 Subjects',    icon: '📚' },
    { key: 'assignments', label: '🔗 Assignments', icon: '🔗' },
    { key: 'system',      label: '🚀 System',      icon: '🚀' },
  ];

  return (
    <div className="dm-page">
      {/* Toast container */}
      <div className="dm-toast-container">
        {toasts.map(t => (
          <Toast key={t.id} msg={t.msg} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Header */}
      <div className="dm-header">
        <div className="dm-header-content">
          <div className="dm-header-icon">⚙️</div>
          <div>
            <h1 className="dm-title">Data Management</h1>
            <p className="dm-subtitle">Manage students, faculty, subjects and subject assignments</p>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="dm-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`dm-tab ${activeTab === t.key ? 'dm-tab-active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="dm-panel">
        {activeTab === 'departments' && <DepartmentsTab departments={departments} onRefresh={loadDepartments} toast={pushToast} />}
        {activeTab === 'students'    && <StudentsTab departments={departments} toast={pushToast} />}
        {activeTab === 'faculty'     && <FacultyTab departments={departments} toast={pushToast} />}
        {activeTab === 'subjects'    && <SubjectsTab toast={pushToast} />}
        {activeTab === 'assignments' && <AssignmentsTab toast={pushToast} />}
        {activeTab === 'system'      && <SystemTab toast={pushToast} />}
      </div>

      <style>{`
        /* ── Root & Layout ── */
        .dm-page { min-height: 100vh; background: #0f1117; color: #e2e8f0; font-family: 'Inter', 'Segoe UI', sans-serif; }
        .dm-header { background: linear-gradient(135deg, #1a1f2e 0%, #0f1117 100%); border-bottom: 1px solid #2d3748; padding: 2rem 2.5rem 1.5rem; }
        .dm-header-content { display: flex; align-items: center; gap: 1.25rem; }
        .dm-header-icon { font-size: 2.5rem; filter: drop-shadow(0 0 10px rgba(99,102,241,.6)); }
        .dm-title { font-size: 1.9rem; font-weight: 700; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
        .dm-subtitle { color: #64748b; font-size: 0.9rem; margin: 0.2rem 0 0; }

        /* ── Tabs ── */
        .dm-tabs { display: flex; gap: 0; border-bottom: 1px solid #2d3748; padding: 0 2.5rem; background: #13192a; overflow-x: auto; }
        .dm-tab { padding: 1rem 1.4rem; font-size: 0.88rem; font-weight: 500; border: none; background: none; color: #64748b; cursor: pointer; border-bottom: 2.5px solid transparent; transition: all .2s; white-space: nowrap; }
        .dm-tab:hover { color: #a5b4fc; }
        .dm-tab-active { color: #818cf8; border-bottom-color: #6366f1; background: rgba(99,102,241,.06); }

        /* ── Panel ── */
        .dm-panel { padding: 1.75rem 2.5rem; }
        .dm-tab-content { }

        /* ── Toolbar ── */
        .dm-toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .dm-toolbar-actions { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
        .dm-search { flex: 1; min-width: 220px; padding: .6rem 1rem; background: #1e2535; border: 1px solid #2d3748; border-radius: 8px; color: #e2e8f0; font-size: 0.9rem; outline: none; transition: border-color .2s; }
        .dm-search:focus { border-color: #6366f1; }
        .dm-info-banner { background: rgba(234,179,8,.1); border: 1px solid rgba(234,179,8,.3); color: #fbbf24; padding: .75rem 1rem; border-radius: 8px; font-size: .875rem; margin-bottom: 1rem; }

        /* ── Buttons ── */
        .dm-btn { padding: .55rem 1.15rem; border-radius: 8px; font-size: .875rem; font-weight: 500; border: none; cursor: pointer; transition: all .18s; display: inline-flex; align-items: center; gap: .4rem; }
        .dm-btn-secondary { background: rgba(99,102,241,0.16); color: #c7d2fe; border: 1px solid rgba(99,102,241,0.4); }
        .dm-btn-secondary:hover:not(:disabled) { color: #fff; border-color: rgba(99,102,241,0.8); }
        .dm-btn:disabled { opacity: .45; cursor: not-allowed; }
        .dm-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,.35); }
        .dm-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,.5); }
        .dm-btn-ghost { background: #1e2535; color: #94a3b8; border: 1px solid #2d3748; }
        .dm-btn-ghost:hover { color: #e2e8f0; border-color: #475569; }
        .dm-btn-danger { background: rgba(239,68,68,.12); color: #f87171; border: 1px solid rgba(239,68,68,.25); }
        .dm-btn-danger:hover { background: rgba(239,68,68,.2); }
        .dm-btn-sm { padding: .35rem .75rem; font-size: .8rem; }

        /* ── Table ── */
        .dm-table-wrap { border: 1px solid #2d3748; border-radius: 10px; overflow: hidden; }
        .dm-table { width: 100%; border-collapse: collapse; }
        .dm-table thead { background: #1a2035; }
        .dm-table th { padding: .85rem 1rem; text-align: left; font-size: .78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #2d3748; }
        .dm-table td { padding: .85rem 1rem; border-bottom: 1px solid #1e2535; font-size: .875rem; }
        .dm-table tbody tr:last-child td { border-bottom: none; }
        .dm-table tbody tr { transition: background .15s; }
        .dm-table tbody tr:hover { background: rgba(99,102,241,.05); }
        .dm-actions { display: flex; gap: .5rem; align-items: center; }
        .dm-empty { text-align: center; color: #475569; padding: 3rem !important; font-style: italic; }
        .dm-loading { text-align: center; color: #6366f1; padding: 3rem; font-size: 1rem; }
        .dm-count { padding: .6rem 1rem; background: #1a2035; color: #475569; font-size: .78rem; border-top: 1px solid #2d3748; text-align: right; }
        .dm-name { font-weight: 500; color: #e2e8f0; }
        .dm-muted { color: #64748b; }

        /* ── Badges ── */
        .dm-badge { display: inline-block; padding: .15rem .6rem; border-radius: 999px; font-size: .75rem; font-weight: 600; }
        .dm-badge-blue   { background: rgba(59,130,246,.15); color: #60a5fa; }
        .dm-badge-green  { background: rgba(34,197,94,.15);  color: #4ade80; }
        .dm-badge-red    { background: rgba(239,68,68,.15);  color: #f87171; }
        .dm-badge-purple { background: rgba(139,92,246,.15); color: #a78bfa; }
        .dm-badge-teal   { background: rgba(20,184,166,.15); color: #2dd4bf; }
        .dm-badge-orange { background: rgba(249,115,22,.15); color: #fb923c; }

        /* ── Modal ── */
        .dm-overlay { position: fixed; inset: 0; background: rgba(4,8,20,.85); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .dm-modal { background: linear-gradient(180deg, #111827 0%, #0a0f1c 70%, #050709 100%); border: 1px solid rgba(148,163,184,0.45); border-radius: 18px; width: 100%; max-width: 640px; max-height: 90vh; overflow: hidden; box-shadow: 0 28px 60px rgba(2,6,23,.85); animation: slideIn .25s ease; }
        @keyframes slideIn { from { opacity:0; transform: translateY(-20px) scale(.95); } to { opacity:1; transform: none; } }
        .dm-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(148,163,184,0.25); }
        .dm-modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #e2e8f0; }
        .dm-close-btn { background: none; border: none; color: #64748b; font-size: 1.1rem; cursor: pointer; padding: .25rem; border-radius: 4px; transition: color .15s; }
        .dm-close-btn:hover { color: #e2e8f0; }
        .dm-modal-body { padding: 1.75rem; background: #0c1220; }

        /* ── Form ── */
        .dm-form { display: flex; flex-direction: column; gap: 1rem; background: #0f172a; border: 1px solid rgba(148,163,184,0.3); border-radius: 14px; padding: 1.25rem; box-shadow: 0 16px 40px rgba(2,6,23,.55); }
        .dm-form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .dm-form-group { display: flex; flex-direction: column; gap: .4rem; }
        .dm-form-group label { font-size: .8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .03em; }
        .dm-form-group input, .dm-form-group select { background: #0b1220; border: 1px solid rgba(148,163,184,0.3); border-radius: 10px; color: #e2e8f0; font-size: .875rem; padding: .7rem .95rem; outline: none; transition: border-color .2s, box-shadow .2s; }
        .dm-form-group input:focus, .dm-form-group select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
        .dm-form-group input:disabled { opacity: .5; cursor: not-allowed; }
        .dm-form-group small { color: #64748b; font-size: .75rem; }
        .dm-form-actions { display: flex; gap: .75rem; justify-content: flex-end; padding-top: .5rem; border-top: 1px solid #2d3748; margin-top: .5rem; }

        /* ── Toast ── */
        .dm-toast-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 99999; display: flex; flex-direction: column; gap: .5rem; }
        .dm-toast { display: flex; align-items: center; gap: .6rem; padding: .8rem 1.25rem; border-radius: 10px; font-size: .875rem; font-weight: 500; animation: toastIn .25s ease; box-shadow: 0 4px 20px rgba(0,0,0,.4); min-width: 260px; }
        @keyframes toastIn { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: none; } }
        .dm-toast-success { background: rgba(34,197,94,.15); border: 1px solid rgba(34,197,94,.35); color: #4ade80; }
        .dm-toast-error   { background: rgba(239,68,68,.15);  border: 1px solid rgba(239,68,68,.35); color: #f87171; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .dm-header { padding: 1.25rem; }
          .dm-panel { padding: 1rem; }
          .dm-tabs { padding: 0 1rem; }
          .dm-table th, .dm-table td { padding: .65rem .75rem; }
        }
      `}</style>
    </div>
  );
}
