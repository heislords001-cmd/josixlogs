import { useState } from 'react';
import Spinner from '../components/Spinner';

interface LoginProps {
  onAuth: () => void;
  onEmailLogin: (email: string, password: string) => Promise<{ error?: string }>;
  onForgotPassword: (email: string) => Promise<{ error?: string }>;
  onBack: () => void;
  onSignup: () => void;
}

export default function Login({ onAuth, onEmailLogin, onForgotPassword, onBack, onSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await onEmailLogin(email.trim(), password);
    if (res.error) setError(res.error);
    setSubmitting(false);
  };

  const submitForgot = async () => {
    if (!forgotEmail.trim()) {
      setForgotError('Enter your email address.');
      return;
    }
    setForgotSubmitting(true);
    setForgotError('');
    const res = await onForgotPassword(forgotEmail.trim());
    setForgotSubmitting(false);
    if (res.error) { setForgotError(res.error); return; }
    setForgotSent(true);
  };

  const inputStyle = {
    width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border2)',
    borderRadius: 10, padding: '12px 14px', fontFamily: 'var(--font)', fontSize: 14,
    color: 'var(--text)', outline: 'none',
  } as const;

  const eyeButtonStyle = {
    position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)',
    padding: 4, display: 'flex', alignItems: 'center',
  };

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );

  const backToLogin = () => {
    setForgotMode(false);
    setForgotSent(false);
    setForgotEmail('');
    setForgotError('');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 58, borderBottom: '1px solid var(--border)', background: 'rgba(8,7,10,0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={forgotMode ? backToLogin : onBack} style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>
          JX<span style={{ color: 'var(--accent)', opacity: 0.65 }}>LOGS</span>
        </div>
        <div style={{ width: 60 }} />
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {forgotMode ? (
            forgotSent ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '36px 28px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📩</div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Check your email</h1>
                <p style={{ color: 'var(--muted2)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                  If an account exists for <strong style={{ color: 'var(--text)' }}>{forgotEmail}</strong>, a password reset link is on its way.
                </p>
                <button onClick={backToLogin} className="btn btn-ghost btn-full">Back to Sign In</button>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, marginBottom: 8 }}>Reset your password</h1>
                  <p style={{ color: 'var(--muted2)', fontSize: 14 }}>We'll email you a link to set a new one.</p>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submitForgot(); }}
                    placeholder="Email address"
                    autoComplete="email"
                    style={inputStyle}
                  />
                  {forgotError && <div style={{ fontSize: 12.5, color: 'var(--red)', lineHeight: 1.5 }}>{forgotError}</div>}
                  <button onClick={submitForgot} disabled={forgotSubmitting} className="btn btn-primary btn-full" style={{ opacity: forgotSubmitting ? 0.6 : 1 }}>
                    {forgotSubmitting ? <><Spinner size={16} color="#000" /> Sending...</> : 'Send Reset Link'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted2)', margin: 0 }}>
                    <button onClick={backToLogin} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>Back to Sign In</button>
                  </p>
                </div>
              </>
            )
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Welcome back</div>
                <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, marginBottom: 8 }}>Sign in to JXLOGS</h1>
                <p style={{ color: 'var(--muted2)', fontSize: 14 }}>Access your dashboard and virtual numbers.</p>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <button
                  onClick={onAuth}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '13px 20px', background: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#111', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.96 2.31-8.16 2.31-6.26 0-11.57-3.58-13.47-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  or sign in with email
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
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                    placeholder="Password"
                    autoComplete="current-password"
                    style={{ ...inputStyle, paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} style={eyeButtonStyle} title={showPassword ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>

                <div style={{ textAlign: 'right', marginTop: -6 }}>
                  <button onClick={() => setForgotMode(true)} style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', fontSize: 12.5, padding: 0 }}>Forgot password?</button>
                </div>

                {error && <div style={{ fontSize: 12.5, color: 'var(--red)', lineHeight: 1.5 }}>{error}</div>}

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="btn btn-primary btn-full"
                  style={{ opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? <><Spinner size={16} color="#000" /> Signing in...</> : 'Sign In'}
                </button>

                <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted2)', margin: 0 }}>
                  Don't have an account?{' '}
                  <button onClick={onSignup} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>Sign up</button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
