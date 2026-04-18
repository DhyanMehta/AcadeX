import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function ChangePasswordModal() {
  const { clearMustChangePassword, logout } = useAuth();
  const [form, setForm]   = useState({ current_password: '', new_password: '', confirm: '' });
  const [show, setShow]   = useState({ cur: false, new: false, conf: false });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const submit = async () => {
    if (form.new_password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.new_password !== form.confirm) { setError('Passwords do not match.'); return; }
    setSaving(true); setError('');
    try {
      await api.put('/auth/change-password', {
        current_password: form.current_password,
        new_password:     form.new_password,
      });
      clearMustChangePassword();
    } catch(e) {
      setError(e.response?.data?.detail || 'Failed to change password.');
    }
    setSaving(false);
  };

  const EyeBtn = ({ field }) => (
    <button type="button" onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))}
      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>
      {show[field] ? <FiEyeOff size={15} /> : <FiEye size={15} />}
    </button>
  );

  return (
    /* Full-screen overlay */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 16, padding: 36, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <FiLock size={22} color="#fff" />
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem' }}>Change Your Password</h2>
          <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            This is your first login. Please set a new password to continue.
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', marginBottom: 16, fontSize: '0.83rem' }}>
            {error}
          </div>
        )}

        {/* Current password */}
        <div className="form-group">
          <label>Temporary Password</label>
          <div style={{ position: 'relative' }}>
            <input type={show.cur ? 'text' : 'password'} value={form.current_password}
              onChange={e => setForm({ ...form, current_password: e.target.value })}
              placeholder="Enter your temporary password" style={{ paddingRight: 36 }} />
            <EyeBtn field="cur" />
          </div>
        </div>

        {/* New password */}
        <div className="form-group">
          <label>New Password</label>
          <div style={{ position: 'relative' }}>
            <input type={show.new ? 'text' : 'password'} value={form.new_password}
              onChange={e => setForm({ ...form, new_password: e.target.value })}
              placeholder="Min 6 characters" style={{ paddingRight: 36 }} />
            <EyeBtn field="new" />
          </div>
        </div>

        {/* Confirm */}
        <div className="form-group">
          <label>Confirm New Password</label>
          <div style={{ position: 'relative' }}>
            <input type={show.conf ? 'text' : 'password'} value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repeat new password" style={{ paddingRight: 36 }} />
            <EyeBtn field="conf" />
          </div>
        </div>

        {/* Strength bar */}
        {form.new_password && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 4, borderRadius: 4, background: 'var(--border-color)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, transition: 'width 0.3s',
                width: form.new_password.length >= 10 ? '100%' : form.new_password.length >= 6 ? '60%' : '25%',
                background: form.new_password.length >= 10 ? '#10b981' : form.new_password.length >= 6 ? '#f59e0b' : '#ef4444',
              }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {form.new_password.length >= 10 ? 'Strong' : form.new_password.length >= 6 ? 'Medium' : 'Too short'}
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 10 }}
          onClick={submit} disabled={saving}>
          {saving ? 'Saving...' : 'Set New Password & Continue'}
        </button>
        <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.82rem' }}
          onClick={() => logout()}>
          Logout instead
        </button>
      </div>
    </div>
  );
}
