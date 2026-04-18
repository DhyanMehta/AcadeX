import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import {
  FiHome, FiUsers, FiBarChart2, FiGrid, FiActivity, FiDownload,
  FiLogOut, FiBell, FiTrendingUp, FiShield, FiAlertTriangle
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const RISK_COLORS_MAP = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

function Sidebar({ user, logout }) {
  const navigate = useNavigate();
  return (
    <div className="sidebar">
      <div className="sidebar-logo"><div className="logo-icon">🎓</div><h1>AcadeX</h1></div>
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Analytics</div>
        <NavLink to="/coordinator" end><FiHome /> Dashboard</NavLink>
        <NavLink to="/coordinator/students"><FiUsers /> All Students</NavLink>
        <NavLink to="/coordinator/departments"><FiGrid /> Departments</NavLink>
        <NavLink to="/coordinator/interventions"><FiActivity /> Interventions</NavLink>
        <NavLink to="/coordinator/mentors"><FiShield /> Mentor Activity</NavLink>
        <NavLink to="/coordinator/alerts"><FiBell /> Alerts</NavLink>
        <NavLink to="/coordinator/export"><FiDownload /> Export</NavLink>
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

  if (!dash) return <div className="empty-state">Loading...</div>;

  const pieData = dist ? [
    { name: 'Low', value: dist.low, color: '#10b981' },
    { name: 'Medium', value: dist.medium, color: '#f59e0b' },
    { name: 'High', value: dist.high, color: '#ef4444' },
    { name: 'Critical', value: dist.critical, color: '#dc2626' },
  ].filter(d => d.value > 0) : [];

  return (
    <div>
      <div className="page-header"><h2>Academic Coordinator Dashboard</h2><p>Institution-wide risk analytics</p></div>
      <div className="stat-grid">
        <div className="stat-card accent"><div className="stat-icon"><FiUsers /></div><div className="stat-value">{dash.total_students}</div><div className="stat-label">Total Students</div></div>
        <div className="stat-card warning"><div className="stat-icon"><FiAlertTriangle /></div><div className="stat-value">{dash.at_risk_count}</div><div className="stat-label">At Risk</div></div>
        <div className="stat-card danger"><div className="stat-icon"><FiBarChart2 /></div><div className="stat-value">{dash.high_risk_count}</div><div className="stat-label">High/Critical</div></div>
        <div className="stat-card success"><div className="stat-icon"><FiTrendingUp /></div><div className="stat-value">{dash.intervention_success_rate}%</div><div className="stat-label">Intervention Success</div></div>
      </div>
      <div className="stat-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))'}}>
        <div className="stat-card accent"><div className="stat-value" style={{fontSize:'1.3rem'}}>{dash.avg_risk_score}</div><div className="stat-label">Avg Risk Score</div></div>
        <div className="stat-card success"><div className="stat-value" style={{fontSize:'1.3rem'}}>{dash.total_interventions}</div><div className="stat-label">Total Interventions</div></div>
        <div className="stat-card danger"><div className="stat-value" style={{fontSize:'1.3rem'}}>{dash.active_alerts}</div><div className="stat-label">Active Alerts</div></div>
        <div className="stat-card warning"><div className="stat-value" style={{fontSize:'1.3rem'}}>{dash.critical_risk_count}</div><div className="stat-label">Critical Students</div></div>
      </div>
      <div className="chart-grid">
        <div className="card">
          <div className="card-title">Risk Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,value}) => `${name}: ${value}`}>
              {pieData.map((d,i) => <Cell key={i} fill={d.color} />)}
            </Pie><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Department Analytics</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={depts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="department_name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{background:'#1a1f36', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8}} />
              <Bar dataKey="total_students" fill="#6366f1" name="Total" radius={[4,4,0,0]} />
              <Bar dataKey="high_risk_count" fill="#ef4444" name="High Risk" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  useEffect(() => {
    let params = [];
    if (classFilter) params.push(`class_id=${classFilter}`);
    if (riskFilter) params.push(`risk_label=${riskFilter}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    api.get(`/coordinator/students${qs}`).then(r => setStudents(r.data)).catch(console.error);
  }, [classFilter, riskFilter]);

  return (
    <div>
      <div className="page-header"><h2>All Students</h2><p>Filter and view all student risk data</p></div>
      <div className="filter-bar">
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="low">Low</option><option value="medium">Medium</option>
          <option value="high">High</option><option value="critical">Critical</option>
        </select>
      </div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Enrollment</th><th>Class</th><th>Mentor</th><th>Risk Score</th><th>Level</th></tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.student_name}</td><td>{s.enrollment_no}</td><td>{s.class_name}</td><td>{s.mentor_name}</td>
                <td style={{fontWeight:700, color:RISK_COLORS_MAP[s.risk_label]}}>{s.risk_score}</td>
                <td><span className={`badge badge-${s.risk_label}`}>{s.risk_label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepartmentsPage() {
  const [depts, setDepts] = useState([]);
  useEffect(() => { api.get('/coordinator/departments').then(r => setDepts(r.data)).catch(console.error); }, []);

  return (
    <div>
      <div className="page-header"><h2>Department Analytics</h2><p>Risk overview by department</p></div>
      <div className="stat-grid">
        {depts.map(d => (
          <div key={d.department_id} className="stat-card accent" style={{borderLeft:`3px solid ${d.high_risk_count > 0 ? '#ef4444' : '#10b981'}`}}>
            <h3 style={{fontSize:'1rem', marginBottom:8}}>{d.department_name}</h3>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <div><div style={{fontSize:'1.3rem', fontWeight:700}}>{d.total_students}</div><div style={{fontSize:'0.72rem', color:'var(--text-muted)'}}>Students</div></div>
              <div><div style={{fontSize:'1.3rem', fontWeight:700}}>{d.avg_risk_score}</div><div style={{fontSize:'0.72rem', color:'var(--text-muted)'}}>Avg Risk</div></div>
              <div><div style={{fontSize:'1.3rem', fontWeight:700, color:'var(--danger)'}}>{d.high_risk_count}</div><div style={{fontSize:'0.72rem', color:'var(--text-muted)'}}>High Risk</div></div>
            </div>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="type" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{background:'#1a1f36', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8}} />
              <Bar dataKey="count" fill="#6366f1" name="Count" radius={[4,4,0,0]} />
              <Bar dataKey="improved" fill="#10b981" name="Improved" radius={[4,4,0,0]} />
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

  const computeAll = async () => {
    setComputing(true);
    try {
      await api.post('/risk/compute-all');
      alert('Risk scores computed for all students!');
    } catch(e) { alert('Error: ' + (e.response?.data?.detail || e.message)); }
    setComputing(false);
  };

  const exportCSV = () => {
    const token = localStorage.getItem('token');
    window.open(`http://localhost:8000/coordinator/reports/export?format=csv&token=${token}`, '_blank');
  };

  return (
    <div>
      <div className="page-header"><h2>Reports & Actions</h2><p>Compute risk scores and export reports</p></div>
      <div className="chart-grid">
        <div className="card" style={{textAlign:'center', padding:40}}>
          <FiBarChart2 style={{fontSize:'2.5rem', color:'var(--accent)', marginBottom:16}} />
          <h3 style={{marginBottom:8}}>Compute All Risk Scores</h3>
          <p style={{color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:20}}>
            Run XGBoost + SHAP analysis on all students. This will generate new risk scores, labels, and explanations.
          </p>
          <button className="btn btn-primary" onClick={computeAll} disabled={computing}>
            {computing ? 'Computing...' : 'Compute All Risks'}
          </button>
        </div>
        <div className="card" style={{textAlign:'center', padding:40}}>
          <FiDownload style={{fontSize:'2.5rem', color:'var(--success)', marginBottom:16}} />
          <h3 style={{marginBottom:8}}>Export Risk Report</h3>
          <p style={{color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:20}}>
            Download a CSV report with all students' risk scores, labels, and explanations.
          </p>
          <button className="btn btn-primary" onClick={exportCSV}>Download CSV</button>
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
        </Routes>
      </div>
    </div>
  );
}
