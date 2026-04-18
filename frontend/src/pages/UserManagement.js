import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiUsers, FiUserPlus, FiMail, FiLock, FiToggleLeft, FiToggleRight, FiCopy, FiCheck } from 'react-icons/fi';

/* ──────────────────────────────────────────────────────────────────────────
   User Management Module — used inside CoordinatorDashboard
   ────────────────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'list',    label: 'All Users',      icon: <FiUsers /> },
  { key: 'student', label: 'Add Student',    icon: <FiUserPlus /> },
  { key: 'teacher', label: 'Add Teacher',    icon: <FiUserPlus /> },
];

export default function UserManagement() {
  const [tab, setTab] = useState('list');
  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <p>Add students and teachers, manage accounts</p>
      </div>
      <div className="tabs" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === 'list'    && <UserList />}
      {tab === 'student' && <AddStudentForm onSuccess={() => setTab('list')} />}
      {tab === 'teacher' && <AddTeacherForm onSuccess={() => setTab('list')} />}
    </div>
  );
}

/* ── User List ──────────────────────────────────────────────────────────── */
function UserList() {
  const [users, setUsers]         = useState([]);
  const [roleFilter, setRole]     = useState('');
  const [toggling, setToggling]   = useState({});
  const [mentors, setMentors]     = useState([]);
  const [mentorPanel, setPanel]   = useState(null);  // user_id of open panel
  const [selectedMentor, setSel]  = useState('');
  const [saving, setSaving]       = useState(false);
  const [panelMsg, setPanelMsg]   = useState('');

  const load = () => {
    const qs = roleFilter ? `?role=${roleFilter}` : '';
    api.get(`/coordinator/users/list${qs}`).then(r => setUsers(r.data)).catch(console.error);
  };

  useEffect(() => { load(); }, [roleFilter]);

  useEffect(() => {
    api.get('/coordinator/teachers/mentor-activity')
      .then(r => setMentors(r.data))
      .catch(console.error);
  }, []);

  const toggle = async (id) => {
    setToggling(p => ({ ...p, [id]: true }));
    try {
      const r = await api.put(`/coordinator/users/toggle-active/${id}`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: r.data.is_active } : u));
    } catch(e) { console.error(e); }
    setToggling(p => ({ ...p, [id]: false }));
  };

  const openMentorPanel = (userId) => {
    setPanel(userId === mentorPanel ? null : userId);
    setSel('');
    setPanelMsg('');
  };

  const changeMentor = async (userId) => {
    if (!selectedMentor) { setPanelMsg('Select a mentor first.'); return; }
    setSaving(true); setPanelMsg('');
    try {
      const r = await api.put(`/coordinator/users/${userId}/change-mentor`, { mentor_id: parseInt(selectedMentor) });
      setPanelMsg(r.data.message);
      setTimeout(() => { setPanel(null); setPanelMsg(''); }, 1800);
    } catch(e) {
      setPanelMsg(e.response?.data?.detail || 'Failed to update mentor.');
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="filter-bar" style={{ marginBottom: 14 }}>
        <select value={roleFilter} onChange={e => setRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="faculty">Faculty</option>
          <option value="coordinator">Coordinators</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.83rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          {users.length} user{users.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th>
              <th>Password</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <>
                <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className={`badge ${u.role === 'student' ? 'badge-low' : u.role === 'faculty' ? 'badge-medium' : 'badge-high'}`}>{u.role}</span></td>
                  <td>
                    {u.must_change_password
                      ? <span style={{ fontSize: '0.78rem', color: '#f59e0b' }}>Must change</span>
                      : <span style={{ fontSize: '0.78rem', color: '#10b981' }}>Set</span>}
                  </td>
                  <td><span className={`badge ${u.is_active ? 'badge-low' : 'badge-high'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={toggling[u.id]}
                        onClick={() => toggle(u.id)}
                        style={{ padding: '4px 10px' }}
                      >
                        {u.is_active ? <><FiToggleRight style={{ color: '#10b981' }} /> Deactivate</> : <><FiToggleLeft /> Activate</>}
                      </button>
                      {u.role === 'student' && (
                        <button
                          className={`btn btn-sm ${mentorPanel === u.id ? 'btn-primary' : 'btn-outline'}`}
                          style={{ padding: '4px 10px' }}
                          onClick={() => openMentorPanel(u.id)}
                        >
                          Change Mentor
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Inline Change Mentor Panel */}
                {u.role === 'student' && mentorPanel === u.id && (
                  <tr key={`mentor-${u.id}`}>
                    <td colSpan={6} style={{ background: 'rgba(99,102,241,0.06)', padding: '14px 20px', borderTop: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', minWidth: 130 }}>
                          New mentor for <strong>{u.name}</strong>:
                        </span>
                        <select
                          value={selectedMentor}
                          onChange={e => setSel(e.target.value)}
                          style={{ flex: 1, minWidth: 200, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        >
                          <option value="">Select mentor...</option>
                          {mentors.map(m => (
                            <option key={m.mentor_id} value={m.mentor_id}>{m.mentor_name}</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={saving}
                          onClick={() => changeMentor(u.id)}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setPanel(null)}>Cancel</button>
                        {panelMsg && (
                          <span style={{ fontSize: '0.8rem', color: panelMsg.includes('success') ? '#10b981' : '#ef4444' }}>
                            {panelMsg}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="empty-state">No users found</div>}
      </div>
    </div>
  );
}

/* ── Add Student Form ───────────────────────────────────────────────────── */
function AddStudentForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: '', email: '', enrollment_no: '', class_id: '', mentor_id: '', department_id: '',
  });
  const [depts, setDepts]   = useState([]);
  const [classes, setClasses] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/coordinator/departments').then(r => setDepts(r.data)).catch(console.error);
    api.get('/coordinator/teachers/mentor-activity').then(r => setMentors(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.department_id) {
      api.get(`/setup/classes?department_id=${form.department_id}`).then(r => setClasses(r.data)).catch(console.error);
    } else {
      api.get('/setup/classes').then(r => setClasses(r.data)).catch(console.error);
    }
  }, [form.department_id]);

  const submit = async () => {
    if (!form.name || !form.email || !form.enrollment_no || !form.class_id || !form.mentor_id) {
      setError('Please fill all required fields.'); return;
    }
    setSaving(true); setError(''); setResult(null);
    try {
      const r = await api.post('/coordinator/users/add-student', {
        ...form,
        class_id: parseInt(form.class_id),
        mentor_id: parseInt(form.mentor_id),
        department_id: form.department_id ? parseInt(form.department_id) : null,
      });
      setResult(r.data);
    } catch(e) {
      setError(e.response?.data?.detail || e.message);
    }
    setSaving(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result) return (
    <div className="card" style={{ maxWidth: 520, borderLeft: '3px solid #10b981' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
        <div>
          <div style={{ fontWeight: 700 }}>Student Created!</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{result.message}</div>
        </div>
      </div>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Temporary Password</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <code style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa', flex: 1 }}>{result.temp_password}</code>
          <button className="btn btn-outline btn-sm" onClick={() => copy(result.temp_password)}>
            {copied ? <><FiCheck style={{ color: '#10b981' }} /> Copied</> : <><FiCopy /> Copy</>}
          </button>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 8 }}>⚠ Save this password. A credentials email was also sent to the student.</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { setResult(null); setForm({ name:'', email:'', enrollment_no:'', class_id:'', mentor_id:'', department_id:'' }); }}>Add Another</button>
        <button className="btn btn-outline btn-sm" onClick={onSuccess}>View All Users</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card">
        <div className="card-title">Add New Student</div>
        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', marginBottom: 16, fontSize: '0.85rem' }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group"><label>Full Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></div>
          <div className="form-group"><label>Email Address *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@college.edu" /></div>
          <div className="form-group"><label>Enrollment Number *</label><input type="text" value={form.enrollment_no} onChange={e => setForm({ ...form, enrollment_no: e.target.value })} placeholder="2024CS001" /></div>
          <div className="form-group">
            <label>Department</label>
            <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value, class_id: '' })}>
              <option value="">Select Department</option>
              {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Class / Section *</label>
            <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} (Sem {c.semester})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Assign Mentor *</label>
            <select value={form.mentor_id} onChange={e => setForm({ ...form, mentor_id: e.target.value })}>
              <option value="">Select Mentor</option>
              {mentors.map(m => <option key={m.mentor_id} value={m.mentor_id}>{m.mentor_name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <FiMail style={{ marginRight: 6, verticalAlign: 'middle' }} />
          A temporary password will be <strong>auto-generated</strong> and sent to the student's email. They must change it on first login.
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Creating...' : <><FiUserPlus /> Create Student</>}</button>
          <button className="btn btn-outline" onClick={onSuccess}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Teacher Form ───────────────────────────────────────────────────── */
function AddTeacherForm({ onSuccess }) {
  const [form, setForm]   = useState({ name: '', email: '', department_id: '' });
  const [depts, setDepts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/coordinator/departments').then(r => setDepts(r.data)).catch(console.error);
  }, []);

  const submit = async () => {
    if (!form.name || !form.email) { setError('Name and email are required.'); return; }
    setSaving(true); setError(''); setResult(null);
    try {
      const r = await api.post('/coordinator/users/add-teacher', {
        ...form,
        department_id: form.department_id ? parseInt(form.department_id) : null,
      });
      setResult(r.data);
    } catch(e) {
      setError(e.response?.data?.detail || e.message);
    }
    setSaving(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result) return (
    <div className="card" style={{ maxWidth: 520, borderLeft: '3px solid #10b981' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
        <div>
          <div style={{ fontWeight: 700 }}>Teacher Created!</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{result.message}</div>
        </div>
      </div>
      <div style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Temporary Password</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <code style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa', flex: 1 }}>{result.temp_password}</code>
          <button className="btn btn-outline btn-sm" onClick={() => copy(result.temp_password)}>
            {copied ? <><FiCheck style={{ color: '#10b981' }} /> Copied</> : <><FiCopy /> Copy</>}
          </button>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 8 }}>⚠ Save this password. A credentials email was also sent to the teacher.</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { setResult(null); setForm({ name:'', email:'', department_id:'' }); }}>Add Another</button>
        <button className="btn btn-outline btn-sm" onClick={onSuccess}>View All Users</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="card">
        <div className="card-title">Add New Teacher / Faculty</div>
        {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', marginBottom: 16, fontSize: '0.85rem' }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group"><label>Full Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Smith" /></div>
          <div className="form-group"><label>Email Address *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@college.edu" /></div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label>Department</label>
            <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Select Department (optional)</option>
              {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <FiMail style={{ marginRight: 6, verticalAlign: 'middle' }} />
          A temporary password will be <strong>auto-generated</strong> and sent to the teacher's email. They must change it on first login.
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Creating...' : <><FiUserPlus /> Create Teacher</>}</button>
          <button className="btn btn-outline" onClick={onSuccess}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
