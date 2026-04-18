import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import UserManagement from './UserManagement';
import { DashboardSkeleton, TableSkeleton } from './Skeleton';
import {
  FiHome, FiUsers, FiBarChart2, FiGrid, FiActivity, FiDownload,
  FiLogOut, FiBell, FiTrendingUp, FiShield, FiAlertTriangle, FiChevronLeft,
  FiUserPlus,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// Only 3 risk levels — no critical
const RISK_COLORS_MAP = { low: '#16a34a', medium: '#d97706', high: '#dc2626' };

function Sidebar({ user, logout }) {
  const navigate = useNavigate();
  return (
    <div className="sidebar">
      <div className="sidebar-logo"><div className="logo-icon">AX</div><h1>AcadeX</h1></div>
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Analytics</div>
        <NavLink to="/coordinator" end><FiHome /> Dashboard</NavLink>
        <NavLink to="/coordinator/students"><FiUsers /> All Students</NavLink>
        <NavLink to="/coordinator/departments"><FiGrid /> Departments</NavLink>
        <NavLink to="/coordinator/interventions"><FiActivity /> Interventions</NavLink>
        <NavLink to="/coordinator/mentors"><FiShield /> Mentor Activity</NavLink>
        <NavLink to="/coordinator/alerts"><FiBell /> Alerts</NavLink>
        <NavLink to="/coordinator/export"><FiDownload /> Export</NavLink>
        <NavLink to="/coordinator/users"><FiUserPlus /> User Management</NavLink>
        <div style={{flex:1}} />
        <button onClick={() => { logout(); navigate('/login'); }}><FiLogOut /> Logout</button>
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{user?.name?.[0]}</div>
        <div className="user-info"><div className="name">{user?.name}</div><div className="role">Coordinator</div></div>
      </div>
    </div>
  );
}

function DashboardHome() {
  const [dash, setDash] = useState(null);
  const [dist, setDist] = useState(null);
  const [depts, setDepts] = useState([]);

  useEffect(() => {
    api.get('/coordinator/dashboard').then(r => setDash(r.data)).catch(console.error);
    api.get('/coordinator/risk-distribution').then(r => setDist(r.data)).catch(console.error);
    api.get('/coordinator/departments').then(r => setDepts(r.data)).catch(console.error);
  }, []);

  if (!dash) return <DashboardSkeleton />;


  // Only 3 risk levels — combine critical into high
  const pieData = dist ? [
    { name: 'Low', value: dist.low, color: '#16a34a' },
    { name: 'Medium', value: dist.medium, color: '#d97706' },
    { name: 'High', value: (dist.high || 0) + (dist.critical || 0), color: '#dc2626' },
  ].filter(d => d.value > 0) : [];

  return (
    <div>
      <div className="page-header"><h2>Academic Coordinator Dashboard</h2><p>Institution-wide risk analytics</p></div>
      <div className="stat-grid">
        <div className="stat-card accent"><div className="stat-icon"><FiUsers /></div><div className="stat-value">{dash.total_students}</div><div className="stat-label">Total Students</div></div>
        <div className="stat-card warning"><div className="stat-icon"><FiAlertTriangle /></div><div className="stat-value">{dash.at_risk_count}</div><div className="stat-label">At Risk</div></div>
        <div className="stat-card danger"><div className="stat-icon"><FiBarChart2 /></div><div className="stat-value">{dash.high_risk_count}</div><div className="stat-label">High Risk</div></div>
        <div className="stat-card success"><div className="stat-icon"><FiTrendingUp /></div><div className="stat-value">{dash.intervention_success_rate}%</div><div className="stat-label">Intervention Success</div></div>
      </div>
      <div className="stat-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))'}}>
        <div className="stat-card accent"><div className="stat-value" style={{fontSize:'1.3rem'}}>{dash.avg_risk_score}</div><div className="stat-label">Avg Risk Score</div></div>
        <div className="stat-card success"><div className="stat-value" style={{fontSize:'1.3rem'}}>{dash.total_interventions}</div><div className="stat-label">Total Interventions</div></div>
        <div className="stat-card danger"><div className="stat-value" style={{fontSize:'1.3rem'}}>{dash.active_alerts}</div><div className="stat-label">Active Alerts</div></div>
      </div>
      <div className="chart-grid">
        <div className="card">
          <div className="card-title">Risk Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }}
                formatter={(value, name) => [value + ' students', name]}
              />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.84rem', color: '#1e293b', fontWeight: 500 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Department Analytics</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={depts} barGap={4} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="department_name" tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }}
                cursor={{ fill: 'rgba(15,23,42,0.04)' }}
              />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.84rem', color: '#1e293b', fontWeight: 500, paddingTop: 8 }} />
              <Bar dataKey="total_students" fill="#334155" name="Total Students" radius={[5, 5, 0, 0]} />
              <Bar dataKey="high_risk_count" fill="#dc2626" name="High Risk" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [depts, setDepts] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [classes, setClasses] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [mentorFilter, setMentorFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Load filter options
  useEffect(() => {
    api.get('/coordinator/departments').then(r => setDepts(r.data)).catch(console.error);
    api.get('/coordinator/teachers/mentor-activity').then(r => setMentors(r.data)).catch(console.error);
    api.get('/setup/classes').then(r => setClasses(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (deptFilter) params.append('department_id', deptFilter);
    if (classFilter) params.append('class_id', classFilter);
    if (mentorFilter) params.append('mentor_id', mentorFilter);
    if (riskFilter) params.append('risk_label', riskFilter);
    const qs = params.toString() ? `?${params.toString()}` : '';
    api.get(`/coordinator/students${qs}`)
      .then(r => setStudents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [deptFilter, classFilter, mentorFilter, riskFilter]);

  return (
    <div>
      <div className="page-header"><h2>All Students</h2><p>Filter and view all student risk data</p></div>
      <div className="filter-bar" style={{display:'flex', gap:10, flexWrap:'wrap', marginBottom:20}}>
        <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setClassFilter(''); }}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
        </select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classes
            .filter(c => !deptFilter || String(c.department_id) === String(deptFilter))
            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={mentorFilter} onChange={e => setMentorFilter(e.target.value)}>
          <option value="">All Mentors</option>
          {mentors.map(m => <option key={m.mentor_id} value={m.mentor_id}>{m.mentor_name}</option>)}
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {(deptFilter || classFilter || mentorFilter || riskFilter) && (
          <button className="btn btn-outline btn-sm"
            onClick={() => { setDeptFilter(''); setClassFilter(''); setMentorFilter(''); setRiskFilter(''); }}>
            Clear Filters
          </button>
        )}
        <span style={{ marginLeft: 'auto', color: '#374151', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'center' }}>
          {students.length} student{students.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="card">
        {loading ? <TableSkeleton rows={5} cols={5} /> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Enrollment</th><th>Class</th><th>Mentor</th><th>Attendance %</th><th>Marks %</th><th>Risk Score</th><th>Level</th></tr></thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={8} style={{textAlign:'center', color:'var(--text-muted)', padding:32}}>No students found</td></tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td>{s.student_name}</td>
                  <td>{s.enrollment_no}</td>
                  <td>{s.class_name}</td>
                  <td>{s.mentor_name}</td>
                  <td>{s.attendance_pct != null ? `${s.attendance_pct}%` : '—'}</td>
                  <td>{s.marks_pct != null ? `${s.marks_pct}%` : '—'}</td>
                  <td>
                    <span className={`risk-chip ${s.risk_label || 'low'}`}>{s.risk_score ?? '—'}</span>
                  </td>
                  <td><span className={`badge badge-${s.risk_label}`}>{s.risk_label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DepartmentsPage() {
  const [depts, setDepts] = useState([]);
  const [selected, setSelected] = useState(null); // selected department object
  const [deptStudents, setDeptStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    api.get('/coordinator/departments').then(r => setDepts(r.data)).catch(console.error);
  }, []);

  const handleDeptClick = (dept) => {
    setSelected(dept);
    setLoadingStudents(true);
    api.get(`/coordinator/departments/${dept.department_id}/students`)
      .then(r => setDeptStudents(r.data))
      .catch(console.error)
      .finally(() => setLoadingStudents(false));
  };

  if (selected) {
    return (
      <div>
        <div className="page-header" style={{display:'flex', alignItems:'center', gap:12}}>
          <button className="btn btn-outline btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }}
            onClick={() => { setSelected(null); setDeptStudents([]); }}>
            <FiChevronLeft /> Back
          </button>
          <div>
            <h2>{selected.department_name} — Students</h2>
            <p>{selected.total_students} students · Avg risk: {selected.avg_risk_score} · High risk: {selected.high_risk_count}</p>
          </div>
        </div>
        <div className="card">
          {loadingStudents ? <TableSkeleton rows={5} cols={4} /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Enrollment</th><th>Class</th><th>Mentor</th>
                  <th>Attendance %</th><th>Marks %</th><th>Assignments %</th>
                  <th>Risk Score</th><th>Level</th>
                </tr>
              </thead>
              <tbody>
                {deptStudents.length === 0 ? (
                  <tr><td colSpan={9} style={{textAlign:'center', color:'var(--text-muted)', padding:32}}>No students found</td></tr>
                ) : deptStudents.map(s => (
                  <tr key={s.id}>
                    <td>{s.student_name}</td>
                    <td>{s.enrollment_no}</td>
                    <td>{s.class_name}</td>
                    <td>{s.mentor_name}</td>
                    <td>{s.attendance_pct != null ? `${s.attendance_pct}%` : '—'}</td>
                    <td>{s.marks_pct != null ? `${s.marks_pct}%` : '—'}</td>
                    <td>{s.assignment_pct != null ? `${s.assignment_pct}%` : '—'}</td>
                    <td>
                      <span className={`risk-chip ${s.risk_label || 'low'}`}>{s.risk_score ?? '—'}</span>
                    </td>
                    <td><span className={`badge badge-${s.risk_label}`}>{s.risk_label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h2>Department Analytics</h2><p>Click a department to view its students</p></div>
      <div className="stat-grid">
        {depts.map(d => (
          <div key={d.department_id}
            className="stat-card accent"
            style={{ borderLeft: `3px solid ${d.high_risk_count > 0 ? '#dc2626' : '#16a34a'}`, cursor: 'pointer', transition: 'transform 0.15s' }}
            onClick={() => handleDeptClick(d)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{d.department_name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{d.total_students}</div><div style={{ fontSize: '0.72rem', color: '#374151' }}>Students</div></div>
              <div><div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{d.avg_risk_score}</div><div style={{ fontSize: '0.72rem', color: '#374151' }}>Avg Risk</div></div>
              <div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--danger)' }}>{d.high_risk_count}</div><div style={{ fontSize: '0.72rem', color: '#374151' }}>High Risk</div></div>
            </div>
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#374151', fontWeight: 600 }}>Click to view students →</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterventionsPage() {
  const [data, setData] = useState(null);
  const [list, setList] = useState([]);
  useEffect(() => {
    api.get('/coordinator/interventions/effectiveness').then(r => setData(r.data)).catch(console.error);
    api.get('/coordinator/interventions').then(r => setList(r.data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="page-header"><h2>Intervention Analytics</h2><p>Track intervention effectiveness</p></div>
      {data && (
        <div className="stat-grid">
          <div className="stat-card accent"><div className="stat-value">{data.total_interventions}</div><div className="stat-label">Total</div></div>
          <div className="stat-card success"><div className="stat-value">{data.with_outcomes}</div><div className="stat-label">With Outcomes</div></div>
          <div className="stat-card warning"><div className="stat-value">{data.avg_score_improvement}</div><div className="stat-label">Avg Improvement</div></div>
          <div className="stat-card success"><div className="stat-value">{data.success_rate}%</div><div className="stat-label">Success Rate</div></div>
        </div>
      )}
      {data?.by_type?.length > 0 && (
        <div className="card" style={{marginBottom:24}}>
          <div className="card-title">Effectiveness by Type</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.by_type}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
              <Bar dataKey="count" fill="#334155" name="Count" radius={[4,4,0,0]} />
              <Bar dataKey="improved" fill="#16a34a" name="Improved" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="card">
        <div className="card-title">Recent Interventions</div>
        <table className="data-table">
          <thead><tr><th>Student</th><th>Mentor</th><th>Type</th><th>Risk Before</th><th>Date</th></tr></thead>
          <tbody>
            {list.map(iv => (
              <tr key={iv.id}><td>{iv.student_name}</td><td>{iv.mentor_name}</td>
                <td style={{textTransform:'capitalize'}}>{iv.type.replace(/_/g,' ')}</td>
                <td>{iv.risk_score_before}</td><td>{new Date(iv.conducted_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  useEffect(() => { api.get('/coordinator/teachers/mentor-activity').then(r => setMentors(r.data)).catch(console.error); }, []);

  return (
    <div>
      <div className="page-header"><h2>Mentor Activity</h2><p>Track mentor engagement and interventions</p></div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Mentor</th><th>Total Mentees</th><th>At-Risk</th><th>Interventions</th><th>Last Intervention</th></tr></thead>
          <tbody>
            {mentors.map(m => (
              <tr key={m.mentor_id}>
                <td>{m.mentor_name}</td><td>{m.total_mentees}</td>
                <td><span className={`badge ${m.at_risk_mentees > 0 ? 'badge-high' : 'badge-low'}`}>{m.at_risk_mentees}</span></td>
                <td>{m.interventions_count}</td>
                <td>{m.last_intervention ? new Date(m.last_intervention).toLocaleDateString() : 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { api.get('/coordinator/alerts').then(r => setAlerts(r.data)).catch(console.error); }, []);

  return (
    <div>
      <div className="page-header"><h2>All Alerts</h2><p>Institution-wide alert log</p></div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Student</th><th>Enrollment</th><th>Type</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id}>
                <td>{a.student_name}</td><td>{a.enrollment_no}</td>
                <td style={{textTransform:'capitalize'}}>{a.alert_type.replace(/_/g,' ')}</td>
                <td>{new Date(a.triggered_at).toLocaleString()}</td>
                <td><span className={`badge ${a.is_read ? 'badge-low' : 'badge-high'}`}>{a.is_read ? 'Read' : 'New'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportPage() {
  const [computing, setComputing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState('');

  const computeAll = async () => {
    setComputing(true);
    setMsg('');
    try {
      await api.post('/risk/compute-all');
      setMsg('✅ Risk scores computed for all students!');
    } catch(e) {
      setMsg('❌ Error: ' + (e.response?.data?.detail || e.message));
    }
    setComputing(false);
  };

  // Use axios (api) so auth header is sent automatically — no window.open
  const exportCSV = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/coordinator/reports/export?format=csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'risk_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch(e) {
      alert('Export failed: ' + (e.response?.data?.detail || e.message));
    }
    setDownloading(false);
  };

  return (
    <div>
      <div className="page-header"><h2>Reports &amp; Actions</h2><p>Compute risk scores and export reports</p></div>
      {msg && <div style={{padding:'12px 16px', borderRadius:8, background: msg.startsWith('✅') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: msg.startsWith('✅') ? '#10b981' : '#ef4444', marginBottom:20}}>{msg}</div>}
      <div className="chart-grid">
        <div className="card" style={{textAlign:'center', padding:40}}>
          <FiBarChart2 style={{fontSize:'2.5rem', color:'var(--accent)', marginBottom:16}} />
          <h3 style={{marginBottom:8}}>Compute All Risk Scores</h3>
          <p style={{color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:20}}>
            Run XGBoost + SHAP analysis on all students. Generates new risk scores, labels, and explanations.
          </p>
          <button className="btn btn-primary" onClick={computeAll} disabled={computing}>
            {computing ? 'Computing...' : 'Compute All Risks'}
          </button>
        </div>
        <div className="card" style={{textAlign:'center', padding:40}}>
          <FiDownload style={{fontSize:'2.5rem', color:'var(--success)', marginBottom:16}} />
          <h3 style={{marginBottom:8}}>Export Risk Report (CSV)</h3>
          <p style={{color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:20}}>
            Download a CSV with all students' risk scores, labels, attendance, marks, and AI explanations.
          </p>
          <button className="btn btn-primary" onClick={exportCSV} disabled={downloading}>
            {downloading ? 'Preparing...' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoordinatorDashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="app-layout">
      <Sidebar user={user} logout={logout} />
      <div className="main-content">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="interventions" element={<InterventionsPage />} />
          <Route path="mentors" element={<MentorsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="users" element={<UserManagement />} />
        </Routes>
      </div>
    </div>
  );
}
