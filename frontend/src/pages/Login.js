import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import { FiMail, FiLock, FiLogIn, FiArrowLeft, FiUser, FiUsers } from 'react-icons/fi';

export default function Login() {
  const [mode, setMode]       = useState('login'); // 'login' | 'forgot' | 'who'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState(null); // stored after student auth
  const { login } = useAuth();
  const navigate  = useNavigate();

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      const result = await login(email, password);
      const { userData: user } = result;
      if (user.role === 'faculty')      navigate('/teacher');
      else if (user.role === 'coordinator') navigate('/coordinator');
      else if (user.role === 'student') {
        // Ask: are you the student or a parent?
        setLoginData(user);
        setMode('who');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot Password ── */
  const handleForgot = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      const r = await api.post('/auth/forgot-password', { email });
      setInfo(r.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Who are you ── */
  const continueAs = (role) => {
    if (role === 'student') navigate('/student');
    else navigate('/guardian');
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── Who are you? ── */}
        {mode === 'who' && (
          <div>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--border-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FiUsers size={24} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h2 style={{ marginBottom: 6 }}>Who's logging in?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 28 }}>
              Welcome, <strong>{loginData?.name}</strong>. Are you the student or a parent/guardian?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <button
                className="btn btn-outline"
                style={{ flexDirection: 'column', gap: 10, padding: '20px 10px', height: 'auto', borderRadius: 12 }}
                onClick={() => continueAs('student')}
              >
                <FiUser size={28} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700 }}>I'm the Student</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Access full dashboard</span>
              </button>
              <button
                className="btn btn-outline"
                style={{ flexDirection: 'column', gap: 10, padding: '20px 10px', height: 'auto', borderRadius: 12 }}
                onClick={() => continueAs('guardian')}
              >
                <FiUsers size={28} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 700 }}>I'm a Parent</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>View child's report</span>
              </button>
            </div>
            <button
              style={{ marginTop: 18, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
              onClick={() => { setMode('login'); setLoginData(null); }}
            >
              ← Back to login
            </button>
          </div>
        )}

        {/* ── Login Form ── */}
        {mode === 'login' && (
          <>
            <h1>AcadeX</h1>
            <p className="subtitle">Early Academic Risk Detection Platform</p>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label><FiMail style={{ marginRight: 6, verticalAlign: 'middle' }} /> Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email" required />
              </div>
              <div className="form-group">
                <label><FiLock style={{ marginRight: 6, verticalAlign: 'middle' }} /> Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" required />
              </div>
              <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
                <button type="button" onClick={() => { setMode('forgot'); setError(''); setInfo(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                <FiLogIn /> {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div style={{ marginTop: 24, padding: '14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Demo Credentials</strong><br />
              Student: student1@acadex.edu<br />
              Teacher: faculty1@acadex.edu<br />
              Coordinator: coordinator@acadex.edu<br />
              Password: password123
            </div>
          </>
        )}

        {/* ── Forgot Password Form ── */}
        {mode === 'forgot' && (
          <>
            <h1>AcadeX</h1>
            <p className="subtitle">Reset your password</p>
            {error && <div className="error">{error}</div>}
            {info && (
              <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.5 }}>
                {info}
              </div>
            )}
            <form onSubmit={handleForgot}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                Enter your registered email and we'll send you a reset link.
              </p>
              <div className="form-group">
                <label><FiMail style={{ marginRight: 6, verticalAlign: 'middle' }} /> Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); }}
                className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
                <FiArrowLeft /> Back to Login
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
