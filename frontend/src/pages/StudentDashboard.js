import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  FiHome, FiBarChart2, FiCalendar, FiBook, FiFileText,
  FiHeart, FiTrendingUp, FiLogOut, FiAlertTriangle, FiCheckCircle
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadialBarChart, RadialBar
} from 'recharts';

const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

function Sidebar({ user, logout }) {
  const navigate = useNavigate();
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🎓</div>
        <h1>AcadeX</h1>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Menu</div>
        <NavLink to="/student" end><FiHome /> Dashboard</NavLink>
        <NavLink to="/student/attendance"><FiCalendar /> Attendance</NavLink>
        <NavLink to="/student/marks"><FiBook /> Marks</NavLink>
        <NavLink to="/student/assignments"><FiFileText /> Assignments</NavLink>
        <NavLink to="/student/interventions"><FiHeart /> Interventions</NavLink>
        <NavLink to="/student/progress"><FiTrendingUp /> Progress</NavLink>
        <div style={{flex:1}} />
        <button onClick={() => { logout(); navigate('/login'); }}><FiLogOut /> Logout</button>
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{user?.name?.[0]}</div>
        <div className="user-info">
          <div className="name">{user?.name}</div>
          <div className="role">{user?.role}</div>
        </div>
      </div>
    </div>
  );
}

function DashboardHome() {
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    api.get('/student/dashboard').then(r => setData(r.data)).catch(console.error);
    api.get('/student/suggestions').then(r => setSuggestions(r.data)).catch(console.error);
  }, []);

  if (!data) return <div className="empty-state">Loading dashboard...</div>;

  const riskColor = RISK_COLORS[data.risk_label] || '#6366f1';
  const gaugeData = [{ name: 'Risk', value: data.risk_score, fill: riskColor }];

  return (
    <div>
      <div className="page-header">
        <h2>Welcome back, {data.student_name} 👋</h2>
        <p>{data.class_name} • Semester {data.semester} • {data.enrollment_no}</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card accent">
          <div className="stat-icon"><FiBarChart2 /></div>
          <div className="stat-value" style={{color: riskColor}}>{data.risk_score}</div>
          <div className="stat-label">Risk Score <span className={`badge badge-${data.risk_label}`}>{data.risk_label}</span></div>
        </div>
        <div className={`stat-card ${data.attendance_pct >= 75 ? 'success' : 'danger'}`}>
          <div className="stat-icon"><FiCalendar /></div>
          <div className="stat-value">{data.attendance_pct}%</div>
          <div className="stat-label">Attendance</div>
        </div>
        <div className={`stat-card ${data.pending_assignments === 0 ? 'success' : 'warning'}`}>
          <div className="stat-icon"><FiFileText /></div>
          <div className="stat-value">{data.pending_assignments}</div>
          <div className="stat-label">Pending Assignments</div>
        </div>
        <div className={`stat-card ${data.active_alerts === 0 ? 'success' : 'danger'}`}>
          <div className="stat-icon"><FiAlertTriangle /></div>
          <div className="stat-value">{data.active_alerts}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-title">Risk Score Gauge</div>
          <div className="gauge-container">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="100%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} barSize={20} data={gaugeData}>
                <RadialBar background dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="gauge-value" style={{color: riskColor, marginTop: -40}}>{data.risk_score}</div>
            <div className="gauge-label">out of 100</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">AI Explanation</div>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7}}>
            {data.ai_explanation || 'No risk analysis available yet. Ask your teacher to compute your risk score.'}
          </p>
          {data.ai_suggestions && (
            <div style={{marginTop: 16}}>
              <div className="card-title" style={{marginBottom: 8}}>Suggestions</div>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>{data.ai_suggestions}</p>
            </div>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="card" style={{marginBottom: 24}}>
          <div className="card-title">Improvement Suggestions</div>
          {suggestions.map((s, i) => (
            <div key={i} className={`suggestion-card ${s.priority}`}>
              {s.priority === 'high' ? <FiAlertTriangle style={{color: 'var(--danger)', flexShrink: 0}} /> :
               s.priority === 'medium' ? <FiAlertTriangle style={{color: 'var(--warning)', flexShrink: 0}} /> :
               <FiCheckCircle style={{color: 'var(--success)', flexShrink: 0}} />}
              <div>
                <strong style={{fontSize: '0.82rem'}}>{s.category}</strong>
                <p style={{fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2}}>{s.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendancePage() {
  const [data, setData] = useState([]);
  useEffect(() => { api.get('/student/attendance').then(r => setData(r.data)).catch(console.error); }, []);

  const chartData = data.map(d => ({ name: d.subject_name, Present: d.present, Absent: d.absent, Late: d.late, percentage: d.percentage }));

  return (
    <div>
      <div className="page-header"><h2>Attendance</h2><p>Subject-wise attendance breakdown</p></div>
      <div className="card" style={{marginBottom: 24}}>
        <div className="card-title">Attendance by Subject</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{background: '#1a1f36', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8}} />
            <Legend />
            <Bar dataKey="Present" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="Absent" fill="#ef4444" radius={[4,4,0,0]} />
            <Bar dataKey="Late" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Subject</th><th>Total</th><th>Present</th><th>Absent</th><th>Late</th><th>%</th></tr></thead>
          <tbody>
            {data.map(d => (
              <tr key={d.subject_id}>
                <td>{d.subject_name}</td><td>{d.total}</td><td>{d.present}</td><td>{d.absent}</td><td>{d.late}</td>
                <td><span className={`badge ${d.percentage >= 75 ? 'badge-low' : d.percentage >= 60 ? 'badge-medium' : 'badge-high'}`}>{d.percentage}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarksPage() {
  const [data, setData] = useState([]);
  useEffect(() => { api.get('/student/marks').then(r => setData(r.data)).catch(console.error); }, []);

  return (
    <div>
      <div className="page-header"><h2>Internal Marks</h2><p>All exam marks across subjects</p></div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Subject</th><th>Exam</th><th>Obtained</th><th>Max</th><th>%</th></tr></thead>
          <tbody>
            {data.map(m => {
              const pct = m.marks_obtained != null ? ((m.marks_obtained / m.max_marks) * 100).toFixed(0) : '-';
              return (
                <tr key={m.id}>
                  <td>{m.subject_name}</td><td style={{textTransform:'capitalize'}}>{m.exam_type.replace(/_/g, ' ')}</td>
                  <td>{m.marks_obtained ?? '-'}</td><td>{m.max_marks}</td>
                  <td><span className={`badge ${pct >= 60 ? 'badge-low' : pct >= 40 ? 'badge-medium' : 'badge-high'}`}>{pct}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssignmentsPage() {
  const [data, setData] = useState([]);
  useEffect(() => { api.get('/student/assignments').then(r => setData(r.data)).catch(console.error); }, []);

  return (
    <div>
      <div className="page-header"><h2>Assignments</h2><p>Track all your assignment submissions</p></div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Assignment</th><th>Subject</th><th>Due Date</th><th>Status</th><th>Marks</th></tr></thead>
          <tbody>
            {data.map(a => (
              <tr key={a.id}>
                <td>{a.assignment_title}</td><td>{a.subject_name}</td><td>{a.due_date}</td>
                <td><span className={`badge ${a.status === 'graded' ? 'badge-low' : a.status === 'pending' ? 'badge-medium' : 'badge-high'}`}>{a.status}</span></td>
                <td>{a.marks_obtained != null ? `${a.marks_obtained}/${a.max_marks}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InterventionsPage() {
  const [data, setData] = useState([]);
  useEffect(() => { api.get('/student/interventions').then(r => setData(r.data)).catch(console.error); }, []);

  return (
    <div>
      <div className="page-header"><h2>Interventions</h2><p>Actions taken by your mentor</p></div>
      {data.length === 0 ? <div className="card empty-state">No interventions recorded yet</div> : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Type</th><th>Remarks</th><th>Risk Before</th><th>Mentor</th><th>Date</th></tr></thead>
            <tbody>
              {data.map(iv => (
                <tr key={iv.id}>
                  <td style={{textTransform:'capitalize'}}>{iv.type.replace(/_/g, ' ')}</td>
                  <td style={{maxWidth:300}}>{iv.remarks}</td>
                  <td>{iv.risk_score_before}</td><td>{iv.mentor_name}</td>
                  <td>{new Date(iv.conducted_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProgressPage() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/student/progress').then(r => setData(r.data)).catch(console.error); }, []);

  if (!data) return <div className="empty-state">Loading...</div>;

  const chartData = data.risk_history.map((r, i) => ({
    date: new Date(r.computed_at).toLocaleDateString(),
    'Risk Score': r.risk_score,
    'Attendance': r.attendance_pct,
    'Marks': r.marks_pct,
  }));

  return (
    <div>
      <div className="page-header"><h2>Progress Tracking</h2><p>See how your performance changes over time</p></div>
      <div className="card" style={{marginBottom: 24}}>
        <div className="card-title">Risk Score Trend</div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{background: '#1a1f36', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8}} />
              <Legend />
              <Line type="monotone" dataKey="Risk Score" stroke="#ef4444" strokeWidth={2} dot={{r:4}} />
              <Line type="monotone" dataKey="Attendance" stroke="#10b981" strokeWidth={2} dot={{r:4}} />
              <Line type="monotone" dataKey="Marks" stroke="#6366f1" strokeWidth={2} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="empty-state">No risk history available</div>}
      </div>
      {data.interventions.length > 0 && (
        <div className="card">
          <div className="card-title">Intervention Timeline</div>
          {data.interventions.map(iv => (
            <div key={iv.id} style={{display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border-color)'}}>
              <div style={{width:8, height:8, borderRadius:'50%', background:'var(--accent)', marginTop:6, flexShrink:0}} />
              <div>
                <div style={{fontSize:'0.85rem', fontWeight:600, textTransform:'capitalize'}}>{iv.type.replace(/_/g, ' ')}</div>
                <div style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>{iv.remarks}</div>
                <div style={{fontSize:'0.72rem', color:'var(--text-muted)', marginTop:4}}>
                  {new Date(iv.conducted_at).toLocaleDateString()} • Risk before: {iv.risk_score_before}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar user={user} logout={logout} />
      <div className="main-content">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="marks" element={<MarksPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="interventions" element={<InterventionsPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Routes>
      </div>
    </div>
  );
}
