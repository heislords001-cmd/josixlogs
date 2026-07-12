import { useState } from 'react';
import Spinner from '../components/Spinner';

interface ResetPasswordProps {
  onSetNewPassword: (password: string) => Promise<{ error?: string }>;
  onDone: () => void;
}

export default function ResetPassword({ onSetNewPassword, onDone }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords don\'t match.');
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await onSetNewPassword(password);
    setSubmitting(false);
    if (res.error) { setError(res.error); return; }
    setDone(true);
  };

  const inputStyle = {
    width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border2)',
    borderRadius: 10, padding: '12px 14px', fontFamily: 'var(--font)', fontSize: 14,
    color: 'var(--text)', outline: 'none',
  } as const;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', height: 58, borderBottom: '1px solid var(--border)', background: 'rgba(8,7,10,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>
          JX<span style={{ color: 'var(--accent)', opacity: 0.65 }}>LOGS</span>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {done ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Password updated</h1>
              <p style={{ color: 'var(--muted2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                You can sign in with your new password now.
              </p>
              <button onClick={onDone} className="btn btn-primary btn-full">Back to Sign In</button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, marginBottom: 8 }}>Set a new password</h1>
                <p style={{ color: 'var(--muted2)', fontSize: 14 }}>Choose something you haven't used before.</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New password (min. 6 characters)"
                  autoComplete="new-password"
                  style={inputStyle}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  style={inputStyle}
                />
                {error && <div style={{ fontSize: 12.5, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>}
                <button onClick={submit} disabled={submitting} className="btn btn-primary btn-full" style={{ opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? <><Spinner size={16} color="#000" /> Updating...</> : 'Update Password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
