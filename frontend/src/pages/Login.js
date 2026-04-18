import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'faculty') navigate('/teacher');
      else if (user.role === 'coordinator') navigate('/coordinator');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>AcadeX</h1>
        <p className="subtitle">Early Academic Risk Detection Platform</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><FiMail style={{marginRight: 6, verticalAlign: 'middle'}} /> Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label><FiLock style={{marginRight: 6, verticalAlign: 'middle'}} /> Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{width: '100%', justifyContent: 'center', marginTop: 8}}>
            <FiLogIn /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{marginTop: 24, padding: '14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)'}}>
          <strong style={{color: 'var(--text-secondary)'}}>Demo Credentials</strong><br/>
          Student: student1@acadex.edu<br/>
          Teacher: faculty1@acadex.edu<br/>
          Coordinator: coordinator@acadex.edu<br/>
          Password: password123
        </div>
      </div>
    </div>
  );
}
