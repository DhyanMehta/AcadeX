import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { DashboardSkeleton, TableSkeleton, Sk } from './Skeleton';
import {
  FiHome, FiBarChart2, FiCalendar, FiBook, FiFileText,
  FiHeart, FiTrendingUp, FiLogOut, FiAlertTriangle, FiCheckCircle
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const RISK_COLORS = { low: '#16a34a', medium: '#d97706', high: '#dc2626', critical: '#b91c1c' };

function Sidebar({ user, logout }) {
  const navigate = useNavigate();
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">AX</div>
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

  if (!data) return <DashboardSkeleton />;

  const riskColor = RISK_COLORS[data.risk_label] || '#334155';

  return (
    <div>
      <div className="page-header">
        <h2>Welcome back, {data.student_name}</h2>
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
          <div className="card-title">Risk Score</div>
          {/* Professional SVG Arc Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 8px' }}>
            <svg width="220" height="130" viewBox="0 0 220 130">
              {/* Background track arc */}
              <path
                d="M 20 110 A 90 90 0 0 1 200 110"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="18"
                strokeLinecap="round"
              />
              {/* Colored fill arc — dasharray trick on a semicircle (length ≈ 283) */}
              <path
                d="M 20 110 A 90 90 0 0 1 200 110"
                fill="none"
                stroke={riskColor}
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={`${(data.risk_score / 100) * 283} 283`}
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
              {/* Center score number */}
              <text x="110" y="98" textAnchor="middle" fontSize="38" fontWeight="800" fill={riskColor} fontFamily="Inter, sans-serif">
                {data.risk_score}
              </text>
              {/* "/ 100" label */}
              <text x="110" y="118" textAnchor="middle" fontSize="12" fill="#94a3b8" fontFamily="Inter, sans-serif">
                out of 100
              </text>
            </svg>

            {/* Risk level badge */}
            <span className={`risk-chip ${data.risk_label}`} style={{ fontSize: '0.82rem', padding: '5px 18px', marginTop: 2 }}>
              {data.risk_label.charAt(0).toUpperCase() + data.risk_label.slice(1)} Risk
            </span>

            {/* 3-step track bar */}
            <div style={{ display: 'flex', gap: 4, marginTop: 14, width: '80%' }}>
              {[
                { label: 'Low', color: '#16a34a', range: '0–33' },
                { label: 'Medium', color: '#d97706', range: '34–66' },
                { label: 'High', color: '#dc2626', range: '67–100' },
              ].map(seg => (
                <div key={seg.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 6,
                    borderRadius: 3,
                    background: seg.color,
                    opacity: data.risk_label === seg.label.toLowerCase() ? 1 : 0.2,
                    transition: 'opacity 0.3s',
                  }} />
                  <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: 4, fontWeight: 600 }}>{seg.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Remarks</div>
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/student/attendance').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <TableSkeleton rows={5} cols={6} />;

  const chartData = data.map(d => ({ name: d.subject_name, Present: d.present, Absent: d.absent, Late: d.late, percentage: d.percentage }));

  return (
    <div>
      <div className="page-header"><h2>Attendance</h2><p>Subject-wise attendance breakdown</p></div>
      <div className="card" style={{marginBottom: 24}}>
        <div className="card-title">Attendance by Subject</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
            <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.82rem' }} />
            <Bar dataKey="Present" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Absent" fill="#dc2626" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Late" fill="#d97706" radius={[4, 4, 0, 0]} />
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/student/marks').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <TableSkeleton rows={5} cols={5} />;

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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/student/assignments').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <TableSkeleton rows={5} cols={5} />;

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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/student/interventions').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <TableSkeleton rows={4} cols={5} />;

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

  if (!data) return (
    <div>
      <div className="page-header">
        <Sk.Title width="30%" style={{ marginBottom: 6 }} />
        <Sk.Text width="20%" style={{ marginBottom: 0 }} />
      </div>
      <Sk.ChartBox height={300} />
    </div>
  );

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
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.82rem' }} />
              <Line type="monotone" dataKey="Risk Score" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Attendance" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Marks" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
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
