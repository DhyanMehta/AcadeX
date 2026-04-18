import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { DashboardSkeleton } from './Skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  FiLogOut, FiCheckCircle,
  FiAlertTriangle, FiTrendingUp, FiCalendar, FiShield,
} from 'react-icons/fi';

const RISK_COLOR  = { low: '#16a34a', medium: '#d97706', high: '#dc2626' };
const RISK_BG     = { low: 'rgba(16,185,129,0.12)', medium: 'rgba(245,158,11,0.12)', high: 'rgba(239,68,68,0.12)' };
const RISK_LABEL  = {
  low:    { icon: '✓', title: 'On Track',       desc: 'Your child is performing well across all areas. Keep it up!' },
  medium: { icon: '!', title: 'Needs Attention', desc: 'Your child has some areas that need improvement. Please review the details below.' },
  high:   { icon: '!!', title: 'At Risk',         desc: 'Your child is at academic risk. We recommend contacting the mentor immediately.' },
};

export default function GuardianDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash]         = useState(null);
  const [attendance, setAtt]    = useState([]);
  const [marks, setMarks]       = useState([]);
  const [assignments, setAssigns] = useState([]);
  const [suggestions, setSugg]  = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/dashboard'),
      api.get('/student/attendance'),
      api.get('/student/marks'),
      api.get('/student/assignments'),
      api.get('/student/suggestions'),
    ]).then(([d, a, m, asgn, s]) => {
      setDash(d.data);
      setAtt(a.data);
      setMarks(m.data);
      setAssigns(asgn.data);
      setSugg(s.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const risk      = dash?.risk_label || 'low';
  const riskInfo  = RISK_LABEL[risk];

  // Attendance pie
  const attTotal   = attendance.reduce((a, s) => a + s.total, 0);
  const attPresent = attendance.reduce((a, s) => a + s.present, 0);
  const attPie = [
    { name: 'Present', value: attPresent, color: '#16a34a' },
    { name: 'Absent',  value: attTotal - attPresent, color: '#dc2626' },
  ];

  // Subject-wise marks bar
  const marksChart = Object.values(
    marks.reduce((acc, m) => {
      if (!acc[m.subject_name]) acc[m.subject_name] = { name: m.subject_name?.substring(0, 12), total: 0, count: 0 };
      acc[m.subject_name].total += m.marks_obtained || 0;
      acc[m.subject_name].count += 1;
      return acc;
    }, {})
  ).map(s => ({ name: s.name, avg: Math.round(s.total / s.count) }));

  // Assignment stats
  const graded  = assignments.filter(a => a.status === 'graded').length;
  const pending = assignments.filter(a => a.status === 'pending').length;
  const missing = assignments.filter(a => a.status === 'missing').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'var(--font)' }}>

      {/* Top bar */}
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
        padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 7, background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
          G
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Guardian View</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Read-only report for your child</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{dash?.student_name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dash?.enrollment_no} · {dash?.class_name}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--border-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
            {dash?.student_name?.[0]}
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

        {/* Hero risk card */}
        <div style={{
          background: RISK_BG[risk],
          border: `1.5px solid ${RISK_COLOR[risk]}`,
          borderRadius: 16, padding: '24px 28px',
          display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24,
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: RISK_COLOR[risk], lineHeight: 1 }}>{riskInfo.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: RISK_COLOR[risk], textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Academic Status
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>{riskInfo.title}</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 560 }}>
              {riskInfo.desc}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: RISK_COLOR[risk] }}>
              {Math.round(dash?.risk_score)}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Risk Score</div>
          </div>
        </div>

        {/* 4 stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: <FiCalendar />, label: 'Overall Attendance', value: `${dash?.attendance_pct}%`, color: dash?.attendance_pct >= 75 ? '#16a34a' : '#dc2626', note: dash?.attendance_pct >= 75 ? 'Good' : 'Below 75%' },
            { icon: <FiCheckCircle />, label: 'Assignments Done', value: graded, color: 'var(--text-primary)', note: `${pending} pending` },
            { icon: <FiAlertTriangle />, label: 'Missing Work', value: missing, color: missing > 0 ? '#dc2626' : '#16a34a', note: missing > 0 ? 'Needs attention' : 'All submitted' },
            { icon: <FiTrendingUp />, label: 'Avg Marks', value: marksChart.length ? `${Math.round(marksChart.reduce((a, m) => a + m.avg, 0) / marksChart.length)}%` : '—', color: 'var(--text-primary)', note: 'Across subjects' },
          ].map(c => (
            <div key={c.label} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ color: c.color, fontSize: '1.2rem' }}>{c.icon}</div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.label}</span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{c.note}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>

          {/* Attendance donut */}
          <div className="card">
            <div className="card-title">Attendance Overview</div>
            {attTotal > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                <Pie data={attPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {attPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.82rem' }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }} />
              </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">No attendance data</div>}
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: dash?.attendance_pct >= 75 ? '#16a34a' : '#dc2626' }}>
                {dash?.attendance_pct}%
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 6 }}>overall</span>
            </div>
          </div>

          {/* Subject marks bar */}
          <div className="card">
            <div className="card-title">Subject-wise Average Marks</div>
            {marksChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={marksChart} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#0f172a', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 13, fill: '#0f172a', fontWeight: 500 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'Avg']} contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', color: '#0f172a', fontSize: '0.84rem' }} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
                  <Bar dataKey="avg" fill="#6366f1" radius={[6, 6, 0, 0]}>
                    {marksChart.map((entry, i) => (
                      <Cell key={i} fill={entry.avg >= 75 ? '#16a34a' : entry.avg >= 50 ? '#d97706' : '#dc2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">No marks recorded yet</div>}
          </div>
        </div>

        {/* Subject attendance progress bars */}
        {attendance.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title">Subject-wise Attendance</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
              {attendance.map(s => (
                <div key={s.subject_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.83rem', fontWeight: 500 }}>{s.subject_name}</span>
                    <span style={{ fontSize: '0.83rem', fontWeight: 700, color: s.percentage >= 75 ? '#16a34a' : '#dc2626' }}>
                      {s.percentage}%
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--border-color)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4, transition: 'width 0.4s',
                      width: `${s.percentage}%`,
                      background: s.percentage >= 75 ? '#16a34a' : s.percentage >= 60 ? '#d97706' : '#dc2626',
                    }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {s.present} present · {s.absent} absent · {s.total} total
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiShield /> Recommendations for Your Child
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '12px 16px', borderRadius: 10,
                  background: s.priority === 'high' ? 'rgba(239,68,68,0.07)' : s.priority === 'medium' ? 'rgba(245,158,11,0.07)' : 'rgba(16,185,129,0.07)',
                  border: `1px solid ${s.priority === 'high' ? 'rgba(239,68,68,0.2)' : s.priority === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                    background: s.priority === 'high' ? '#dc2626' : s.priority === 'medium' ? '#d97706' : '#16a34a',
                  }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.83rem', marginBottom: 2 }}>{s.category}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, paddingBottom: 24 }}>
          This is a read-only view. For detailed information, please contact the Academic Coordinator or your child's mentor.
        </div>
      </div>
    </div>
  );
}
