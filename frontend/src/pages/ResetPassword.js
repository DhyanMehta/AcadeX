import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';

export default function ResetPassword() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token');

  const [newPass, setNewPass]   = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showNew, setShowNew]   = useState(false);
  const [showCon, setShowCon]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  if (!token) return (
    <div className="login-page">
      <div className="login-card" style={{textAlign:'center'}}>
        <div style={{fontSize:'2.5rem', marginBottom:12}}>⚠️</div>
        <h2>Invalid Link</h2>
        <p style={{color:'var(--text-muted)', marginBottom:20}}>This reset link is missing a token. Please request a new one.</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPass !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: newPass });
      setDone(true);
    } catch(err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    }
    setLoading(false);
  };

  if (done) return (
    <div className="login-page">
      <div className="login-card" style={{textAlign:'center'}}>
        <div style={{width:60, height:60, borderRadius:'50%', background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
          <FiCheckCircle size={28} color="#10b981" />
        </div>
        <h2 style={{marginBottom:8}}>Password Reset!</h2>
        <p style={{color:'var(--text-muted)', marginBottom:24, fontSize:'0.88rem'}}>
          Your password has been updated successfully. You can now log in with your new password.
        </p>
        <button className="btn btn-primary" style={{width:'100%', justifyContent:'center'}} onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    </div>
  );

  const strength = newPass.length >= 10 ? 'Strong' : newPass.length >= 6 ? 'Medium' : 'Too short';
  const strengthColor = newPass.length >= 10 ? '#10b981' : newPass.length >= 6 ? '#f59e0b' : '#ef4444';
  const strengthPct   = newPass.length >= 10 ? '100%' : newPass.length >= 6 ? '60%' : newPass.length > 0 ? '25%' : '0%';

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{textAlign:'center', marginBottom:24}}>
          <div style={{width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px'}}>
            <FiLock size={22} color="#fff" />
          </div>
          <h1 style={{fontSize:'1.4rem', marginBottom:4}}>Set New Password</h1>
          <p style={{color:'var(--text-muted)', fontSize:'0.84rem', margin:0}}>Enter and confirm your new password below.</p>
        </div>

        {error && (
          <div className="error" style={{marginBottom:16}}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* New password */}
          <div className="form-group" style={{position:'relative'}}>
            <label><FiLock style={{marginRight:6, verticalAlign:'middle'}} /> New Password</label>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Min 6 characters"
              style={{paddingRight:36}}
              required
            />
            <button type="button" onClick={() => setShowNew(p => !p)}
              style={{position:'absolute', right:10, top:'calc(50% + 10px)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0}}>
              {showNew ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>

          {/* Strength bar */}
          {newPass && (
            <div style={{marginTop:-8, marginBottom:16}}>
              <div style={{height:4, borderRadius:4, background:'var(--border-color)', overflow:'hidden'}}>
                <div style={{height:'100%', width:strengthPct, background:strengthColor, borderRadius:4, transition:'width 0.3s, background 0.3s'}} />
              </div>
              <div style={{fontSize:'0.72rem', color:strengthColor, marginTop:4}}>{strength}</div>
            </div>
          )}

          {/* Confirm */}
          <div className="form-group" style={{position:'relative'}}>
            <label><FiLock style={{marginRight:6, verticalAlign:'middle'}} /> Confirm Password</label>
            <input
              type={showCon ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              style={{paddingRight:36}}
              required
            />
            <button type="button" onClick={() => setShowCon(p => !p)}
              style={{position:'absolute', right:10, top:'calc(50% + 10px)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0}}>
              {showCon ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
            {confirm && newPass !== confirm && (
              <div style={{fontSize:'0.75rem', color:'#ef4444', marginTop:4}}>Passwords do not match</div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{width:'100%', justifyContent:'center', marginTop:4}}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <button type="button" className="btn btn-outline" style={{width:'100%', justifyContent:'center', marginTop:10}}
            onClick={() => navigate('/login')}>
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
