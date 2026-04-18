import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { TableSkeleton, Sk } from './Skeleton';
import {
  FiHome, FiUsers, FiAlertTriangle, FiBookOpen,
  FiPlusCircle, FiLogOut, FiBell, FiChevronRight,
  FiCheckCircle, FiXCircle, FiChevronLeft, FiTrendingUp,
  FiClipboard, FiList, FiBarChart2, FiEdit2, FiSave,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const RISK_COLORS = { low: '#16a34a', medium: '#d97706', high: '#dc2626' };

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
function Sidebar({ user, logout }) {
  const navigate = useNavigate();
  return (
    <div className="sidebar">
      <div className="sidebar-logo"><div className="logo-icon">AX</div><h1>AcadeX</h1></div>
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Mentoring</div>
        <NavLink to="/teacher" end><FiHome /> Dashboard</NavLink>
        <NavLink to="/teacher/mentees"><FiUsers /> My Mentees</NavLink>
        <NavLink to="/teacher/at-risk"><FiAlertTriangle /> At-Risk Students</NavLink>
        <NavLink to="/teacher/alerts"><FiBell /> Alerts</NavLink>
        <div className="sidebar-section-title">Teaching</div>
        <NavLink to="/teacher/subjects"><FiBookOpen /> My Subjects</NavLink>
        <div style={{flex:1}} />
        <button onClick={() => { logout(); navigate('/login'); }}><FiLogOut /> Logout</button>
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{user?.name?.[0]}</div>
        <div className="user-info"><div className="name">{user?.name}</div><div className="role">Faculty / Mentor</div></div>
      </div>
    </div>
  );
}

/* ─── Dashboard Home ──────────────────────────────────────────────────────── */
function DashboardHome() {
  const [mentees, setMentees] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    api.get('/teacher/mentees').then(r => setMentees(r.data)).catch(console.error);
    api.get('/teacher/alerts').then(r => setAlerts(r.data)).catch(console.error);
    api.get('/teacher/subjects').then(r => setSubjects(r.data)).catch(console.error);
  }, []);

  const atRisk = mentees.filter(m => ['medium', 'high'].includes(m.risk_label));
  const high   = mentees.filter(m => m.risk_label === 'high');


  const riskDist = [
    { name: 'Low',    value: mentees.filter(m => m.risk_label === 'low').length,    color: '#16a34a' },
    { name: 'Medium', value: mentees.filter(m => m.risk_label === 'medium').length, color: '#d97706' },
    { name: 'High',   value: mentees.filter(m => m.risk_label === 'high').length,   color: '#dc2626' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="page-header"><h2>Teacher Dashboard</h2><p>Overview of your mentees and subjects</p></div>
      <div className="stat-grid">
        <div className="stat-card accent"><div className="stat-icon"><FiUsers /></div><div className="stat-value">{mentees.length}</div><div className="stat-label">Total Mentees</div></div>
        <div className="stat-card warning"><div className="stat-icon"><FiAlertTriangle /></div><div className="stat-value">{atRisk.length}</div><div className="stat-label">At-Risk Students</div></div>
        <div className="stat-card danger"><div className="stat-icon"><FiXCircle /></div><div className="stat-value">{high.length}</div><div className="stat-label">High Risk</div></div>
        <div className="stat-card success"><div className="stat-icon"><FiBookOpen /></div><div className="stat-value">{subjects.length}</div><div className="stat-label">My Subjects</div></div>
      </div>
      <div className="chart-grid">
        <div className="card">
          <div className="card-title">Mentee Risk Distribution</div>
          {riskDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={riskDist}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {riskDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }}
                  formatter={(value, name) => [value + ' students', name]}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.84rem', color: '#1e293b', fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state">No mentees found</div>}
        </div>
        <div className="card">
          <div className="card-title">Recent Alerts</div>
          {alerts.slice(0, 6).map(a => (
            <div key={a.id} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border-color)'}}>
              <FiAlertTriangle style={{color:'#dc2626', flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{fontSize:'0.85rem', fontWeight:500}}>{a.student_name}</div>
                <div style={{fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'capitalize'}}>{a.alert_type.replace(/_/g, ' ')}</div>
              </div>
              <span className={`badge ${a.is_read ? 'badge-low' : 'badge-high'}`}>{a.is_read ? 'Read' : 'New'}</span>
            </div>
          ))}
          {alerts.length === 0 && <div className="empty-state" style={{padding:20}}>No alerts</div>}
        </div>
      </div>
    </div>
  );
}

/* ─── Mentees Page ───────────────────────────────────────────────────────── */
function MenteesPage() {
  const [mentees, setMentees]         = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [riskFilter, setRiskFilter]   = useState('');
  const [selected, setSelected]       = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [showIVForm, setShowIVForm]   = useState(false);
  const [ivForm, setIvForm]           = useState({ type: 'counselling', remarks: '', meeting_time: '' });
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState('');

  useEffect(() => {
    api.get('/teacher/mentees').then(r => {
      setMentees(r.data);
      setFiltered(r.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setFiltered(riskFilter ? mentees.filter(m => m.risk_label === riskFilter) : mentees);
  }, [riskFilter, mentees]);

  const viewProfile = async (id) => {
    const [prof, ivs] = await Promise.all([
      api.get(`/teacher/mentees/${id}/profile`),
      api.get(`/teacher/mentees/${id}/interventions`),
    ]);
    setSelected(prof.data);
    setInterventions(ivs.data);
    setShowIVForm(false);
    setMsg('');
  };

  const N8N_WEBHOOK = 'https://anshu21666.app.n8n.cloud/webhook/eacc44d3-a0a6-4e8a-a230-e18ae861eeaa';

  const submitIntervention = async () => {
    if (!ivForm.remarks.trim()) { setMsg('Please enter remarks.'); return; }
    if (ivForm.type === 'parent_meeting' && !ivForm.meeting_time) {
      setMsg('Please set a meeting date & time.'); return;
    }
    setSaving(true);
    try {
      await api.post(`/teacher/mentees/${selected.id}/interventions`, {
        type: ivForm.type,
        remarks: ivForm.remarks,
      });
      setMsg('✅ Intervention logged!');

      // If parent meeting — fire n8n webhook
      if (ivForm.type === 'parent_meeting') {
        try {
          await fetch(N8N_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_name:   selected.student_name,
              student_email:  selected.email,
              enrollment_no:  selected.enrollment_no,
              class_name:     selected.class_name,
              risk_label:     selected.risk_label,
              risk_score:     selected.risk_score,
              meeting_time:   ivForm.meeting_time,
              teacher_remarks: ivForm.remarks,
              triggered_at:   new Date().toISOString(),
            }),
          });
          setMsg('✅ Intervention logged & meeting invite sent via n8n!');
        } catch (webhookErr) {
          console.warn('n8n webhook failed:', webhookErr);
          setMsg('✅ Intervention logged. (n8n webhook could not be reached)');
        }
      }

      setShowIVForm(false);
      setIvForm({ type: 'counselling', remarks: '', meeting_time: '' });
      const ivs = await api.get(`/teacher/mentees/${selected.id}/interventions`);
      setInterventions(ivs.data);
    } catch(e) {
      setMsg('❌ ' + (e.response?.data?.detail || e.message));
    }
    setSaving(false);
  };

  const riskPct = selected ? [
    { label: 'Attendance', value: selected.attendance_pct ?? 0, fill: '#6366f1' },
    { label: 'Marks',      value: selected.marks_pct ?? 0,      fill: '#f59e0b' },
    { label: 'Assignments', value: selected.assignment_pct ?? 0, fill: '#16a34a' },
    { label: 'LMS',        value: selected.lms_score ?? 0,      fill: '#ec4899' },
  ] : [];

  return (
    <div>
      <div className="page-header"><h2>My Mentees</h2><p>All students assigned to you as mentor</p></div>
      <div style={{display:'flex', gap:20}}>
        {/* Left: table */}
        <div style={{flex:1, minWidth:0}}>
          <div className="filter-bar" style={{marginBottom:14}}>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
              <option value="">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <span style={{marginLeft:'auto', fontSize:'0.83rem', color:'var(--text-muted)', alignSelf:'center'}}>
              {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="card">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Enrollment</th><th>Class</th><th>Risk</th><th></th></tr></thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} style={{cursor:'pointer', background: selected?.id === m.id ? 'rgba(99,102,241,0.08)' : ''}}
                    onClick={() => viewProfile(m.id)}>
                    <td>{m.student_name}</td>
                    <td>{m.enrollment_no}</td>
                    <td>{m.class_name}</td>
                    <td><span className={`risk-chip ${m.risk_label || 'low'}`}>{m.risk_label} ({m.risk_score})</span></td>
                    <td><FiChevronRight style={{color:'var(--text-muted)'}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: profile panel */}
        {selected && (
          <div style={{width:390}}>
            <div className="card" style={{position:'sticky', top:20}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                <div className="card-title" style={{margin:0}}>Student Profile</div>
                <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)'}} onClick={() => setSelected(null)}>✕</button>
              </div>
              <h3 style={{marginBottom:4}}>{selected.student_name}</h3>
              <p style={{fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:12}}>{selected.email} · {selected.enrollment_no} · {selected.class_name}</p>

              {/* Risk score + badge */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16}}>
                <div style={{padding:12, background:'var(--bg-primary)', borderRadius:8, textAlign:'center'}}>
                  <div style={{fontSize:'1.6rem', fontWeight:700, color:RISK_COLORS[selected.risk_label] || '#aaa'}}>{selected.risk_score}</div>
                  <div style={{fontSize:'0.72rem', color:'var(--text-muted)'}}>Risk Score</div>
                </div>
                <div style={{padding:12, background:'var(--bg-primary)', borderRadius:8, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                  <span className={`badge badge-${selected.risk_label}`} style={{fontSize:'0.85rem'}}>{selected.risk_label?.toUpperCase()}</span>
                  <div style={{fontSize:'0.72rem', color:'var(--text-muted)', marginTop:6}}>{selected.intervention_count} intervention{selected.intervention_count !== 1 ? 's' : ''}</div>
                </div>
              </div>

              {/* AI explanation */}
              {selected.ai_explanation && (
                <div style={{background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, padding:10, marginBottom:14, fontSize:'0.81rem', lineHeight:1.6, color:'var(--text-secondary)'}}>
                  {selected.ai_explanation}
                </div>
              )}

              {msg && <div style={{padding:'8px 12px', borderRadius:6, background: msg.startsWith('✅') ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontSize:'0.82rem', marginBottom:12}}>{msg}</div>}

              {/* Log intervention button — no Compute Risk */}
              <button className="btn btn-primary btn-sm" onClick={() => setShowIVForm(!showIVForm)} style={{width:'100%', marginBottom:12}}>
                <FiPlusCircle /> {showIVForm ? 'Cancel' : 'Log Intervention'}
              </button>

              {showIVForm && (
                <div style={{background:'var(--bg-primary)', borderRadius:8, padding:14, marginBottom:14}}>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={ivForm.type} onChange={e => setIvForm({...ivForm, type: e.target.value, meeting_time: ''})}>
                      <option value="counselling">Counselling</option>
                      <option value="remedial_class">Remedial Class</option>
                      <option value="assignment_extension">Assignment Extension</option>
                      <option value="parent_meeting">Parent Meeting</option>
                      <option value="academic_support">Academic Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Remarks</label>
                    <textarea rows={3} value={ivForm.remarks} onChange={e => setIvForm({...ivForm, remarks: e.target.value})} placeholder="Describe the intervention..." />
                  </div>

                  {/* Meeting scheduler — only for Parent Meeting */}
                  {ivForm.type === 'parent_meeting' && (
                    <div style={{
                      background: 'var(--info-bg)',
                      border: '1px solid rgba(37,99,235,0.2)',
                      borderRadius: 10, padding: '14px 14px 10px',
                      marginBottom: 12,
                    }}>
                      <div style={{fontSize:'0.78rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:10, display:'flex', alignItems:'center', gap:6}}>
                        <FiCheckCircle size={14} /> Schedule Online Meeting
                      </div>
                      <div className="form-group" style={{marginBottom:8}}>
                        <label style={{fontSize:'0.8rem'}}>Meeting Date & Time</label>
                        <input
                          type="datetime-local"
                          value={ivForm.meeting_time}
                          min={new Date().toISOString().slice(0,16)}
                          onChange={e => setIvForm({...ivForm, meeting_time: e.target.value})}
                          style={{background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:8, padding:'8px 12px', color:'var(--text-primary)', fontSize:'0.85rem', width:'100%'}}
                        />
                      </div>
                      <div style={{fontSize:'0.75rem', color:'var(--text-muted)', lineHeight:1.5}}>
                        A Google Calendar invite will be sent to <strong>{selected.email}</strong> via n8n automation once you save.
                      </div>
                    </div>
                  )}

                  <button className="btn btn-primary btn-sm" onClick={submitIntervention} disabled={saving} style={{width:'100%'}}>
                    {saving ? 'Saving...' : (
                      ivForm.type === 'parent_meeting'
                        ? <><FiSave /> Save & Schedule Meeting</>
                        : <><FiSave /> Save Intervention</>
                    )}
                  </button>
                </div>
              )}

              {/* Past interventions */}
              {interventions.length > 0 && (
                <div>
                  <div style={{fontSize:'0.78rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>Past Interventions</div>
                  {interventions.map(iv => (
                    <div key={iv.id} style={{padding:'8px 10px', background:'var(--bg-primary)', borderRadius:8, marginBottom:6}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:2}}>
                        <span style={{fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize'}}>{iv.type.replace(/_/g, ' ')}</span>
                        <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{new Date(iv.conducted_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{fontSize:'0.78rem', color:'var(--text-secondary)'}}>{iv.remarks}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── At-Risk Page ───────────────────────────────────────────────────────── */
function AtRiskPage() {
  const [data, setData]       = useState([]);
  const [severity, setSeverity] = useState('');

  useEffect(() => {
    const params = severity ? `?severity=${severity}` : '';
    api.get(`/teacher/mentees/at-risk${params}`).then(r => setData(r.data)).catch(console.error);
  }, [severity]);

  return (
    <div>
      <div className="page-header"><h2>At-Risk Students</h2><p>Students needing immediate attention</p></div>
      <div className="filter-bar" style={{marginBottom:14}}>
        <select value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Enrollment</th><th>Class</th><th>Risk Score</th><th>Level</th><th>Explanation</th></tr></thead>
          <tbody>
            {data.map(s => (
              <tr key={s.id}>
                <td>{s.student_name}</td><td>{s.enrollment_no}</td><td>{s.class_name}</td>
                <td style={{fontWeight:700, color:RISK_COLORS[s.risk_label]}}>{s.risk_score}</td>
                <td><span className={`badge badge-${s.risk_label}`}>{s.risk_label}</span></td>
                <td style={{fontSize:'0.8rem', maxWidth:280, color:'var(--text-secondary)'}}>{s.ai_explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <div className="empty-state" style={{padding:24}}>No at-risk students found</div>}
      </div>
    </div>
  );
}

/* ─── Alerts Page ────────────────────────────────────────────────────────── */
function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { api.get('/teacher/alerts').then(r => setAlerts(r.data)).catch(console.error); }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Alerts</h2>
        <p>Automated risk alerts for your mentees</p>
      </div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Student</th><th>Enrollment</th><th>Alert Type</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id} style={{opacity: a.is_read ? 0.6 : 1}}>
                <td>{a.student_name}</td>
                <td>{a.enrollment_no}</td>
                <td style={{textTransform:'capitalize'}}>{a.alert_type.replace(/_/g, ' ')}</td>
                <td style={{fontSize:'0.8rem'}}>{new Date(a.triggered_at).toLocaleString()}</td>
                <td><span className={`badge ${a.is_read ? 'badge-low' : 'badge-high'}`}>{a.is_read ? 'Read' : 'New'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {alerts.length === 0 && <div className="empty-state" style={{padding:24}}>No alerts</div>}
      </div>
    </div>
  );
}

/* ─── Assignments Grader ─────────────────────────────────────────────────── */
function AssignmentsGrader({ selectedSubject, assignments, students, onCreated, onAssignmentsUpdated }) {
  const [openId, setOpenId]         = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [edits, setEdits]           = useState({});
  const [saving, setSaving]         = useState({});
  const [rowMsg, setRowMsg]         = useState({});
  const [loadingSubs, setLoadingSubs] = useState(false);

  const toggleAssignment = async (assignId) => {
    if (openId === assignId) { setOpenId(null); return; }
    setOpenId(assignId);
    setLoadingSubs(true);
    setEdits({});
    setRowMsg({});
    try {
      // Fetch all submissions for this assignment via students list
      // We use the students prop to build submission rows
      const res = await api.get(`/teacher/subjects/${selectedSubject.id}/assignments`);
      onAssignmentsUpdated(res.data);
      // Build editable rows from students (submission data comes from backend per-assignment endpoint)
      // We'll use the assignment-mark update endpoint per student
      const initEdits = {};
      students.forEach(s => {
        initEdits[s.id] = { marks_obtained: '', status: 'pending', student_id: s.id, student_name: s.student_name };
      });
      setEdits(initEdits);
    } catch(e) { console.error(e); }
    setLoadingSubs(false);
  };

  const saveRow = async (assignId, studentId) => {
    const entry = edits[studentId];
    if (entry.marks_obtained === '') { setRowMsg(p => ({...p, [studentId]: '⚠ Enter marks'})); return; }
    setSaving(p => ({...p, [studentId]: true}));
    try {
      await api.put(`/teacher/subjects/${selectedSubject.id}/assignments/${assignId}/marks`, {
        student_id: studentId,
        marks_obtained: parseFloat(entry.marks_obtained),
        status: entry.status,
      });
      setRowMsg(p => ({...p, [studentId]: '✅'}));
      // refresh summary counts
      const res = await api.get(`/teacher/subjects/${selectedSubject.id}/assignments`);
      onAssignmentsUpdated(res.data);
    } catch(e) {
      setRowMsg(p => ({...p, [studentId]: '❌ ' + (e.response?.data?.detail || e.message)}));
    }
    setSaving(p => ({...p, [studentId]: false}));
  };

  return (
    <div>
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:12}}>
        <button className="btn btn-primary btn-sm" onClick={onCreated}>
          <FiPlusCircle /> Create Assignment
        </button>
      </div>

      {assignments.length === 0 && <div className="empty-state">No assignments created yet</div>}

      {assignments.map(a => (
        <div key={a.id} className="card" style={{marginBottom:12, padding:0, overflow:'hidden'}}>
          {/* Assignment header row */}
          <div
            style={{display:'flex', alignItems:'center', gap:16, padding:'14px 18px', cursor:'pointer',
              background: openId === a.id ? 'rgba(99,102,241,0.08)' : 'transparent',
              borderBottom: openId === a.id ? '1px solid var(--border-color)' : 'none'}}
            onClick={() => toggleAssignment(a.id)}
          >
            <div style={{flex:1}}>
              <div style={{fontWeight:600, fontSize:'0.95rem'}}>{a.title}</div>
              <div style={{fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2}}>Due: {a.due_date}</div>
            </div>
            <div style={{display:'flex', gap:20, fontSize:'0.83rem'}}>
              <span style={{color:'#16a34a'}}>✓ {a.graded} graded</span>
              <span style={{color:'#d97706'}}>⏳ {a.pending} pending</span>
              <span style={{color:'#dc2626'}}>✕ {a.missing} missing</span>
            </div>
            <FiChevronRight style={{transition:'transform 0.2s', transform: openId === a.id ? 'rotate(90deg)' : 'rotate(0deg)', color:'var(--text-muted)' }} />
          </div>

          {/* Grading panel — expands when clicked */}
          {openId === a.id && (
            <div style={{padding:'0 18px 16px'}}>
              {loadingSubs
                ? <Sk.TableRows n={3} cols={6} />
                : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Marks Obtained</th>
                        <th>Max Marks</th>
                        <th>%</th>
                        <th>Status</th>
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => {
                        const e  = edits[s.id] || { marks_obtained: '', status: 'pending' };
                        const pct = e.marks_obtained !== '' ? Math.round(parseFloat(e.marks_obtained) / 100 * 100) : null;
                        return (
                          <tr key={s.id}>
                            <td style={{fontWeight:500}}>{s.student_name}</td>
                            <td>
                              <input
                                type="number" min={0} max={100}
                                value={e.marks_obtained}
                                onChange={ev => setEdits(p => ({...p, [s.id]: {...e, marks_obtained: ev.target.value}}))}
                                style={{width:80, padding:'4px 8px', background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:6, color:'var(--text-primary)'}}
                              />
                            </td>
                            <td style={{color:'var(--text-muted)'}}>100</td>
                            <td>
                              {e.marks_obtained !== '' && (
                                <span style={{fontWeight:600, color: parseFloat(e.marks_obtained) >= 75 ? '#16a34a' : parseFloat(e.marks_obtained) >= 50 ? '#d97706' : '#dc2626'}}>
                                  {e.marks_obtained}%
                                </span>
                              )}
                            </td>
                            <td>
                              <select
                                value={e.status}
                                onChange={ev => setEdits(p => ({...p, [s.id]: {...e, status: ev.target.value}}))}
                                style={{padding:'4px 8px', background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:6, color:'var(--text-primary)', fontSize:'0.82rem'}}
                              >
                                <option value="pending">Pending</option>
                                <option value="graded">Graded</option>
                                <option value="missing">Missing</option>
                              </select>
                            </td>
                            <td>
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={saving[s.id]}
                                onClick={() => saveRow(a.id, s.id)}
                              >
                                {saving[s.id] ? '...' : <><FiSave /> Save</>}
                              </button>
                            </td>
                            <td style={{fontSize:'0.8rem', color: rowMsg[s.id]?.startsWith('✅') ? '#16a34a' : '#dc2626', whiteSpace:'nowrap'}}>
                              {rowMsg[s.id]}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              }
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Subjects Page ──────────────────────────────────────────────────────── */
function SubjectsPage() {
  const [subjects, setSubjects]       = useState([]);
  const [subjectStats, setSubjectStats] = useState({}); // { [id]: { students, marks, assignments } }
  const [selected, setSelected]       = useState(null);
  const [tab, setTab]                 = useState('overview');
  const [students, setStudents]       = useState([]);
  const [marks, setMarks]             = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Create Assignment form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ title: '', due_date: '' });
  // Upload Marks form
  const [showMarksForm, setShowMarksForm] = useState(false);
  const [marksForm, setMarksForm]   = useState({ exam_type: 'mid_term', entries: [] });
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');

  useEffect(() => {
    api.get('/teacher/subjects').then(async r => {
      const subs = r.data;
      setSubjects(subs);
      // Pre-fetch stats for all subjects in parallel
      const statsResults = await Promise.all(
        subs.map(s => Promise.all([
          api.get(`/teacher/subjects/${s.id}/students`),
          api.get(`/teacher/subjects/${s.id}/marks`),
          api.get(`/teacher/subjects/${s.id}/assignments`),
        ]).then(([stu, mk, asgn]) => ({
          id: s.id,
          students: stu.data.length,
          marks: mk.data.length,
          assignments: asgn.data.length,
        })).catch(() => ({ id: s.id, students: 0, marks: 0, assignments: 0 })))
      );
      const statsMap = {};
      statsResults.forEach(s => { statsMap[s.id] = s; });
      setSubjectStats(statsMap);
    }).catch(console.error);
  }, []);

  const loadSubject = async (subj) => {
    setSelected(subj);
    setTab('overview');
    setMsg('');
    setShowAssignForm(false);
    setShowMarksForm(false);
    const [stu, mk, asgn] = await Promise.all([
      api.get(`/teacher/subjects/${subj.id}/students`),
      api.get(`/teacher/subjects/${subj.id}/marks`),
      api.get(`/teacher/subjects/${subj.id}/assignments`),
    ]);
    setStudents(stu.data);
    setMarks(mk.data);
    setAssignments(asgn.data);
    // Update stats map with fresh counts
    setSubjectStats(prev => ({
      ...prev,
      [subj.id]: { students: stu.data.length, marks: mk.data.length, assignments: asgn.data.length }
    }));
  };

  /* Marks upload: init entries when switching to uploads tab */
  const initMarksEntries = useCallback(() => {
    setMarksForm(prev => ({
      ...prev,
      entries: students.map(s => ({ student_id: s.id, student_name: s.student_name, marks_obtained: '', max_marks: 100 }))
    }));
  }, [students]);

  useEffect(() => {
    if (tab === 'upload_marks') initMarksEntries();
  }, [tab, initMarksEntries]);

  const createAssignment = async () => {
    if (!assignForm.title.trim() || !assignForm.due_date) { setMsg('Fill all fields'); return; }
    setSaving(true);
    try {
      await api.post(`/teacher/subjects/${selected.id}/assignments`, assignForm);
      setMsg('✅ Assignment created!');
      setShowAssignForm(false);
      setAssignForm({ title: '', due_date: '' });
      const r = await api.get(`/teacher/subjects/${selected.id}/assignments`);
      setAssignments(r.data);
      setTab('assignments');
    } catch(e) { setMsg('❌ ' + (e.response?.data?.detail || e.message)); }
    setSaving(false);
  };

  const uploadMarks = async () => {
    setSaving(true);
    try {
      const payload = {
        marks: marksForm.entries
          .filter(e => e.marks_obtained !== '')
          .map(e => ({
            student_id: e.student_id,
            exam_type: marksForm.exam_type,
            marks_obtained: parseFloat(e.marks_obtained),
            max_marks: parseFloat(e.max_marks),
          }))
      };
      await api.post(`/teacher/subjects/${selected.id}/marks`, payload);
      setMsg('✅ Marks uploaded!');
      setShowMarksForm(false);
      const r = await api.get(`/teacher/subjects/${selected.id}/marks`);
      setMarks(r.data);
      setTab('marks');
    } catch(e) { setMsg('❌ ' + (e.response?.data?.detail || e.message)); }
    setSaving(false);
  };

  // Chart data: marks distribution by student
  const marksChartData = students.map(s => {
    const studentMarks = marks.filter(m => m.student_id === s.id);
    const avg = studentMarks.length
      ? Math.round(studentMarks.reduce((acc, m) => acc + (m.marks_obtained || 0), 0) / studentMarks.length)
      : 0;
    return { name: s.student_name.split(' ')[0], avg };
  });

  // Assignment completion
  const assignChartData = assignments.map(a => ({
    name: a.title.substring(0, 14),
    Graded: a.graded,
    Pending: a.pending,
    Missing: a.missing,
  }));

  const TABS = [
    { key: 'overview', Icon: FiBarChart2, label: 'Overview' },
    { key: 'students', Icon: FiUsers,     label: 'Students' },
    { key: 'marks',    Icon: FiList,      label: 'Marks' },
    { key: 'assignments', Icon: FiClipboard, label: 'Assignments' },
    { key: 'upload_marks', Icon: FiEdit2, label: 'Upload Marks' },
  ];

  return (
    <div>
      <div className="page-header"><h2>My Subjects</h2><p>Manage subjects, marks and assignments</p></div>

      {/* Subject cards grid */}
      {subjects.length === 0 && <div className="empty-state">No subjects assigned to you</div>}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:14, marginBottom:28}}>
        {subjects.map(s => {
          const isSelected = selected?.id === s.id;
          return (
            <div
              key={s.id}
              onClick={() => loadSubject(s)}
              style={{
                background: isSelected ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)',
                border: `1.5px solid ${isSelected ? '#6366f1' : 'var(--border-color)'}`,
                borderRadius: 12,
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.18)' : 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isSelected ? '#6366f1' : 'var(--border-color)'; }}
            >
              <div style={{marginBottom:14}}>
                <div style={{fontWeight:700, fontSize:'1rem', marginBottom:4}}>{s.name}</div>
                <span style={{fontSize:'0.72rem', color:'var(--accent)', background:'rgba(99,102,241,0.12)', padding:'2px 8px', borderRadius:20, fontWeight:600}}>{s.code}</span>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
                {[
                  { label: 'Students',    value: subjectStats[s.id]?.students    ?? '…' },
                  { label: 'Assignments', value: subjectStats[s.id]?.assignments ?? '…' },
                  { label: 'Marks',       value: subjectStats[s.id]?.marks       ?? '…' },
                ].map(stat => (
                  <div key={stat.label} style={{background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px 6px', textAlign:'center'}}>
                    <div style={{fontWeight:700, fontSize:'1rem'}}>{stat.value}</div>
                    <div style={{fontSize:'0.68rem', color:'var(--text-muted)', marginTop:2}}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <>
          {/* Subject header bar */}
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16, padding:'14px 18px', background:'var(--bg-card)', borderRadius:12, border:'1px solid var(--border-color)'}}>
            <div style={{fontWeight:700, fontSize:'1.05rem'}}>{selected.name}</div>
            <span style={{fontSize:'0.78rem', color:'var(--accent)', background:'rgba(99,102,241,0.12)', padding:'2px 8px', borderRadius:20, fontWeight:600}}>{selected.code}</span>
            <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{students.length} students</span>
            <div style={{marginLeft:'auto', display:'flex', gap:8}}>
              <button className="btn btn-primary btn-sm" onClick={() => { setShowAssignForm(true); setShowMarksForm(false); setTab('overview'); setMsg(''); }}>
                <FiPlusCircle /> New Assignment
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => { setTab('upload_marks'); setShowAssignForm(false); setShowMarksForm(false); setMsg(''); }}>
                <FiEdit2 /> Upload Marks
              </button>
            </div>
          </div>

          {msg && <div style={{padding:'10px 14px', borderRadius:8, background: msg.startsWith('✅') ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', marginBottom:16}}>{msg}</div>}

          {/* New Assignment Form */}
          {showAssignForm && (
            <div className="card" style={{marginBottom:20, borderLeft:'3px solid var(--accent)'}}>
              <div className="card-title">Create New Assignment</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div className="form-group" style={{margin:0}}>
                  <label>Title</label>
                  <input type="text" value={assignForm.title} onChange={e => setAssignForm({...assignForm, title: e.target.value})} placeholder="Assignment title" />
                </div>
                <div className="form-group" style={{margin:0}}>
                  <label>Due Date</label>
                  <input type="date" value={assignForm.due_date} onChange={e => setAssignForm({...assignForm, due_date: e.target.value})} />
                </div>
              </div>
              <div style={{marginTop:12, display:'flex', gap:8}}>
                <button className="btn btn-primary btn-sm" onClick={createAssignment} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
                <button className="btn btn-outline btn-sm" onClick={() => { setShowAssignForm(false); setMsg(''); }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs" style={{marginBottom:16}}>
            {TABS.map(({key, Icon, label}) => (
              <button key={key} className={`tab ${tab === key ? 'active' : ''}`}
                onClick={() => { setTab(key); setMsg(''); }}>
                <Icon style={{marginRight:5}} />{label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === 'overview' && (
            <div className="chart-grid">
              <div className="card">
                <div className="card-title">Average Marks by Student</div>
                {marksChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={marksChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
                      <Bar dataKey="avg" fill="#334155" name="Avg Marks" radius={[4,4,0,0]}
                        label={{ position: 'top', fontSize: 10, fill: '#94a3b8' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="empty-state">No marks data yet</div>}
              </div>
              <div className="card">
                <div className="card-title">Assignment Completion</div>
                {assignChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={assignChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
                      <Bar dataKey="Graded" fill="#16a34a" radius={[4,4,0,0]} />
                      <Bar dataKey="Pending" fill="#d97706" radius={[4,4,0,0]} />
                      <Bar dataKey="Missing" fill="#dc2626" radius={[4,4,0,0]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.82rem' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="empty-state">No assignments yet</div>}
              </div>
            </div>
          )}

          {/* Students tab */}
          {tab === 'students' && (
            <div className="card">
              <table className="data-table">
                <thead><tr><th>#</th><th>Name</th><th>Enrollment</th><th>Class</th></tr></thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id}>
                      <td style={{color:'var(--text-muted)', width:40}}>{i+1}</td>
                      <td>{s.student_name}</td>
                      <td>{s.enrollment_no}</td>
                      <td>{s.class_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && <div className="empty-state">No students enrolled</div>}
            </div>
          )}

          {/* Marks tab */}
          {tab === 'marks' && (
            <div className="card">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Exam Type</th><th>Obtained</th><th>Max</th><th>%</th></tr></thead>
                <tbody>
                  {marks.map(m => {
                    const pct = m.marks_obtained != null ? Math.round(m.marks_obtained / m.max_marks * 100) : null;
                    return (
                      <tr key={m.id}>
                        <td>{m.student_name}</td>
                        <td style={{textTransform:'capitalize'}}>{m.exam_type.replace(/_/g, ' ')}</td>
                        <td style={{fontWeight:600}}>{m.marks_obtained ?? '—'}</td>
                        <td>{m.max_marks}</td>
                        <td>
                          {pct != null && (
                            <span style={{color: pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626', fontWeight:600}}>
                              {pct}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {marks.length === 0 && <div className="empty-state">No marks uploaded yet</div>}
            </div>
          )}

          {/* Assignments tab */}
          {tab === 'assignments' && (
            <AssignmentsGrader
              selectedSubject={selected}
              assignments={assignments}
              students={students}
              onCreated={() => { setShowAssignForm(true); setTab('overview'); }}
              onAssignmentsUpdated={setAssignments}
            />
          )}

          {/* Upload Marks tab */}
          {tab === 'upload_marks' && (
            <div className="card">
              <div className="card-title">Upload Internal Marks</div>
              <div className="form-group">
                <label>Exam Type</label>
                <select value={marksForm.exam_type} onChange={e => setMarksForm({...marksForm, exam_type: e.target.value})}>
                  <option value="mid_term">Mid Term</option>
                  <option value="end_term">End Term</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="practical">Practical</option>
                </select>
              </div>
              <table className="data-table" style={{marginBottom:16}}>
                <thead><tr><th>Student</th><th>Marks Obtained</th><th>Max Marks</th></tr></thead>
                <tbody>
                  {marksForm.entries.map((e, idx) => (
                    <tr key={e.student_id}>
                      <td>{e.student_name}</td>
                      <td>
                        <input
                          type="number" min={0} max={e.max_marks}
                          value={e.marks_obtained}
                          onChange={ev => setMarksForm(prev => ({
                            ...prev,
                            entries: prev.entries.map((en, i) => i === idx ? {...en, marks_obtained: ev.target.value} : en)
                          }))}
                          style={{width:90, padding:'4px 8px', background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:6, color:'var(--text-primary)'}}
                        />
                      </td>
                      <td>
                        <input
                          type="number" min={1}
                          value={e.max_marks}
                          onChange={ev => setMarksForm(prev => ({
                            ...prev,
                            entries: prev.entries.map((en, i) => i === idx ? {...en, max_marks: ev.target.value} : en)
                          }))}
                          style={{width:80, padding:'4px 8px', background:'var(--bg-primary)', border:'1px solid var(--border-color)', borderRadius:6, color:'var(--text-primary)'}}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{display:'flex', gap:8}}>
                <button className="btn btn-primary" onClick={uploadMarks} disabled={saving}>{saving ? 'Uploading...' : <><FiSave /> Upload Marks</>}</button>
                <button className="btn btn-outline" onClick={() => { setTab('marks'); setMsg(''); }}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── App Layout ─────────────────────────────────────────────────────────── */
export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar user={user} logout={logout} />
      <div className="main-content">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="mentees" element={<MenteesPage />} />
          <Route path="at-risk" element={<AtRiskPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
        </Routes>
      </div>
    </div>
  );
}
