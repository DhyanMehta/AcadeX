import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  FiHome, FiUsers, FiAlertTriangle, FiBookOpen, FiClipboard,
  FiPlusCircle, FiLogOut, FiBell, FiChevronRight, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

function Sidebar({ user, logout }) {
  const navigate = useNavigate();
  return (
    <div className="sidebar">
      <div className="sidebar-logo"><div className="logo-icon">🎓</div><h1>AcadeX</h1></div>
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

function DashboardHome() {
  const [mentees, setMentees] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    api.get('/teacher/mentees').then(r => setMentees(r.data)).catch(console.error);
    api.get('/teacher/alerts').then(r => setAlerts(r.data)).catch(console.error);
    api.get('/teacher/subjects').then(r => setSubjects(r.data)).catch(console.error);
  }, []);

  const atRisk = mentees.filter(m => ['medium','high','critical'].includes(m.risk_label));
  const high = mentees.filter(m => ['high','critical'].includes(m.risk_label));
  const unreadAlerts = alerts.filter(a => !a.is_read);
  const riskDist = [
    { name: 'Low', value: mentees.filter(m => m.risk_label === 'low').length, color: '#10b981' },
    { name: 'Medium', value: mentees.filter(m => m.risk_label === 'medium').length, color: '#f59e0b' },
    { name: 'High', value: mentees.filter(m => m.risk_label === 'high').length, color: '#ef4444' },
    { name: 'Critical', value: mentees.filter(m => m.risk_label === 'critical').length, color: '#dc2626' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="page-header"><h2>Teacher Dashboard</h2><p>Overview of your mentees and subjects</p></div>
      <div className="stat-grid">
        <div className="stat-card accent"><div className="stat-icon"><FiUsers /></div><div className="stat-value">{mentees.length}</div><div className="stat-label">Total Mentees</div></div>
        <div className="stat-card warning"><div className="stat-icon"><FiAlertTriangle /></div><div className="stat-value">{atRisk.length}</div><div className="stat-label">At-Risk Students</div></div>
        <div className="stat-card danger"><div className="stat-icon"><FiXCircle /></div><div className="stat-value">{high.length}</div><div className="stat-label">High/Critical Risk</div></div>
        <div className="stat-card success"><div className="stat-icon"><FiBookOpen /></div><div className="stat-value">{subjects.length}</div><div className="stat-label">My Subjects</div></div>
      </div>
      <div className="chart-grid">
        <div className="card">
          <div className="card-title">Mentee Risk Distribution</div>
          {riskDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart><Pie data={riskDist} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
                {riskDist.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Pie><Legend /></PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state">No mentees found</div>}
        </div>
        <div className="card">
          <div className="card-title">Recent Alerts ({unreadAlerts.length} unread)</div>
          {alerts.slice(0, 5).map(a => (
            <div key={a.id} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border-color)'}}>
              <FiAlertTriangle style={{color: a.alert_type === 'critical_risk' ? '#dc2626' : '#ef4444', flexShrink:0}} />
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

function MenteesPage() {
  const [mentees, setMentees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [ivForm, setIvForm] = useState({ type: 'counselling', remarks: '' });

  useEffect(() => { api.get('/teacher/mentees').then(r => setMentees(r.data)).catch(console.error); }, []);

  const viewProfile = async (id) => {
    const res = await api.get(`/teacher/mentees/${id}/profile`);
    setSelected(res.data);
  };

  const submitIntervention = async () => {
    await api.post(`/teacher/mentees/${selected.id}/interventions`, ivForm);
    setShowIntervention(false);
    setIvForm({ type: 'counselling', remarks: '' });
    viewProfile(selected.id);
  };

  return (
    <div>
      <div className="page-header"><h2>My Mentees</h2><p>All students assigned to you</p></div>
      <div style={{display:'flex', gap:20}}>
        <div style={{flex:1}}>
          <div className="card">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Enrollment</th><th>Class</th><th>Risk</th><th></th></tr></thead>
              <tbody>
                {mentees.map(m => (
                  <tr key={m.id} style={{cursor:'pointer'}} onClick={() => viewProfile(m.id)}>
                    <td>{m.student_name}</td><td>{m.enrollment_no}</td><td>{m.class_name}</td>
                    <td><span className={`badge badge-${m.risk_label}`}>{m.risk_label} ({m.risk_score})</span></td>
                    <td><FiChevronRight style={{color:'var(--text-muted)'}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {selected && (
          <div style={{width:380}}>
            <div className="card" style={{position:'sticky', top:20}}>
              <div className="card-title">Student Profile</div>
              <h3 style={{marginBottom:4}}>{selected.student_name}</h3>
              <p style={{fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:16}}>{selected.email} • {selected.enrollment_no}</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16}}>
                <div style={{padding:10, background:'var(--bg-primary)', borderRadius:8, textAlign:'center'}}>
                  <div style={{fontSize:'1.3rem', fontWeight:700, color:RISK_COLORS[selected.risk_label]}}>{selected.risk_score}</div>
                  <div style={{fontSize:'0.72rem', color:'var(--text-muted)'}}>Risk Score</div>
                </div>
                <div style={{padding:10, background:'var(--bg-primary)', borderRadius:8, textAlign:'center'}}>
                  <div className={`badge badge-${selected.risk_label}`} style={{fontSize:'0.78rem'}}>{selected.risk_label}</div>
                  <div style={{fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4}}>Level</div>
                </div>
              </div>
              {selected.ai_explanation && <p style={{fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:16, lineHeight:1.6}}>{selected.ai_explanation}</p>}
              <div style={{display:'flex', gap:8}}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowIntervention(true)}><FiPlusCircle /> Log Intervention</button>
                <button className="btn btn-outline btn-sm" onClick={() => api.post(`/risk/compute/${selected.id}`).then(() => viewProfile(selected.id))}>Compute Risk</button>
              </div>
              {showIntervention && (
                <div style={{marginTop:16, padding:14, background:'var(--bg-primary)', borderRadius:8}}>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={ivForm.type} onChange={e => setIvForm({...ivForm, type: e.target.value})}>
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
                    <textarea rows={3} value={ivForm.remarks} onChange={e => setIvForm({...ivForm, remarks: e.target.value})} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={submitIntervention}>Save</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AtRiskPage() {
  const [data, setData] = useState([]);
  const [severity, setSeverity] = useState('');

  useEffect(() => {
    const params = severity ? `?severity=${severity}` : '';
    api.get(`/teacher/mentees/at-risk${params}`).then(r => setData(r.data)).catch(console.error);
  }, [severity]);

  return (
    <div>
      <div className="page-header"><h2>At-Risk Students</h2><p>Students needing immediate attention</p></div>
      <div className="filter-bar">
        <select value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
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
                <td style={{fontSize:'0.8rem', maxWidth:300}}>{s.ai_explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <div className="empty-state" style={{padding:24}}>No at-risk students found</div>}
      </div>
    </div>
  );
}

function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { api.get('/teacher/alerts').then(r => setAlerts(r.data)).catch(console.error); }, []);

  const markRead = async (id) => {
    await api.put(`/alerts/${id}/read`);
    setAlerts(alerts.map(a => a.id === id ? {...a, is_read: true} : a));
  };

  return (
    <div>
      <div className="page-header"><h2>Alerts</h2><p>Automated risk alerts for your mentees</p></div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Student</th><th>Enrollment</th><th>Alert Type</th><th>Time</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id}>
                <td>{a.student_name}</td><td>{a.enrollment_no}</td>
                <td style={{textTransform:'capitalize'}}>{a.alert_type.replace(/_/g, ' ')}</td>
                <td>{new Date(a.triggered_at).toLocaleString()}</td>
                <td><span className={`badge ${a.is_read ? 'badge-low' : 'badge-high'}`}>{a.is_read ? 'Read' : 'New'}</span></td>
                <td>{!a.is_read && <button className="btn btn-outline btn-sm" onClick={() => markRead(a.id)}><FiCheckCircle /> Mark Read</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('students');
  const [subjectData, setSubjectData] = useState({ students: [], attendance: [], marks: [], assignments: [] });

  useEffect(() => { api.get('/teacher/subjects').then(r => setSubjects(r.data)).catch(console.error); }, []);

  const selectSubject = async (subj) => {
    setSelected(subj);
    const [students, marks, assignments] = await Promise.all([
      api.get(`/teacher/subjects/${subj.id}/students`),
      api.get(`/teacher/subjects/${subj.id}/marks`),
      api.get(`/teacher/subjects/${subj.id}/assignments`),
    ]);
    setSubjectData({ students: students.data, marks: marks.data, assignments: assignments.data });
  };

  return (
    <div>
      <div className="page-header"><h2>My Subjects</h2><p>Manage your assigned subjects</p></div>
      <div className="filter-bar">
        {subjects.map(s => (
          <button key={s.id} className={`btn ${selected?.id === s.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => selectSubject(s)}>{s.name} ({s.code})</button>
        ))}
      </div>
      {selected && (
        <>
          <div className="tabs">
            {['students','marks','assignments'].map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)} style={{textTransform:'capitalize'}}>{t}</button>
            ))}
          </div>
          <div className="card">
            {tab === 'students' && (
              <table className="data-table">
                <thead><tr><th>Name</th><th>Enrollment</th><th>Class</th></tr></thead>
                <tbody>{subjectData.students.map(s => (
                  <tr key={s.id}><td>{s.student_name}</td><td>{s.enrollment_no}</td><td>{s.class_name}</td></tr>
                ))}</tbody>
              </table>
            )}
            {tab === 'marks' && (
              <table className="data-table">
                <thead><tr><th>Student</th><th>Exam</th><th>Obtained</th><th>Max</th></tr></thead>
                <tbody>{subjectData.marks.map(m => (
                  <tr key={m.id}><td>{m.student_name}</td><td style={{textTransform:'capitalize'}}>{m.exam_type.replace(/_/g,' ')}</td>
                    <td>{m.marks_obtained ?? '-'}</td><td>{m.max_marks}</td></tr>
                ))}</tbody>
              </table>
            )}
            {tab === 'assignments' && (
              <table className="data-table">
                <thead><tr><th>Title</th><th>Due Date</th><th>Graded</th><th>Pending</th><th>Missing</th></tr></thead>
                <tbody>{subjectData.assignments.map(a => (
                  <tr key={a.id}><td>{a.title}</td><td>{a.due_date}</td>
                    <td>{a.graded}</td><td>{a.pending}</td><td>{a.missing}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

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
