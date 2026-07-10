import { useState } from 'react';
import Spinner from '../components/Spinner';

interface SignupProps {
  onAuth: () => void;
  onEmailSignup: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  onBack: () => void;
  onLogin: () => void;
}

export default function Signup({ onAuth, onEmailSignup, onBack, onLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and a password.');
      return;
    }
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
    const res = await onEmailSignup(email.trim(), password);
    setSubmitting(false);
    if (res.error) { setError(res.error); return; }
    if (res.needsConfirmation) { setConfirmationSent(true); return; }
    // If confirmation isn't required, the auth state listener in App.tsx
    // will pick up the new session automatically and navigate away.
  };

  const inputStyle = {
    width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border2)',
    borderRadius: 10, padding: '12px 14px', fontFamily: 'var(--font)', fontSize: 14,
    color: 'var(--text)', outline: 'none',
  } as const;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 58, borderBottom: '1px solid var(--border)', background: 'rgba(8,7,10,0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>
          JX<span style={{ color: 'var(--text)' }}>LOGS</span>
        </div>
        <div style={{ width: 60 }} />
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {confirmationSent ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📩</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Check your email</h1>
              <p style={{ color: 'var(--muted2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                We sent a confirmation link to <strong style={{ color: 'var(--text)' }}>{email}</strong>. Click it to verify your account, then come back and sign in.
              </p>
              <button onClick={onLogin} className="btn btn-ghost btn-full">Back to Sign In</button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'var(--accent-dim)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: 100, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent)', marginBottom: 16, letterSpacing: 1 }}>
                  FREE ACCOUNT · NO CARD REQUIRED
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, marginBottom: 8 }}>Create your account</h1>
                <p style={{ color: 'var(--muted2)', fontSize: 14, lineHeight: 1.6 }}>Get instant access to virtual numbers for any platform.</p>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', background: 'var(--surface2)', borderRadius: 12, fontSize: 13, color: 'var(--muted2)', lineHeight: 1.7 }}>
                  {['⚡ Instant number delivery to your dashboard', '🔒 Your real number stays private', '🌍 10+ countries, 24+ platforms', '💛 Fund wallet, buy anytime'].map(item => (
                    <div key={item}>{item}</div>
                  ))}
                </div>

                <button
                  onClick={onAuth}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '13px 20px', background: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#111', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.96 2.31-8.16 2.31-6.26 0-11.57-3.58-13.47-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Sign up with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  or sign up with email
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  style={inputStyle}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password (min. 6 characters)"
                  autoComplete="new-password"
                  style={inputStyle}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  style={inputStyle}
                />

                {error && <div style={{ fontSize: 12.5, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>}

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="btn btn-primary btn-full"
                  style={{ opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? <><Spinner size={16} color="#000" /> Creating account...</> : 'Create Account'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                  By signing up you agree to our Terms of Service. We'll email you a link to verify your account.
                </p>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted2)', margin: 0 }}>
                  Already have an account?{' '}
                  <button onClick={onLogin} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>Log in</button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
