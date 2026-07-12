import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './lib/supabaseClient';
import type { AuthUser } from './lib/authTypes';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Spinner from './components/Spinner';
import NoticePopup from './components/NoticePopup';
import './index.css';

const ADMIN_EMAIL = 'himjustin98@gmail.com';

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const u = session.user;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  return {
    userId: u.id,
    email: u.email ?? undefined,
    name: (meta.full_name as string) || (meta.name as string) || u.email || undefined,
    picture: (meta.avatar_url as string) || undefined,
  };
}

export default function App() {
  const [page, setPage] = useState<'landing' | 'login' | 'signup' | 'dashboard' | 'admin' | 'reset-password'>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const supabase = await getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const u = toAuthUser(data.session);
      if (u) {
        setUser(u);
        setPage(u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'dashboard');
      }
      setLoading(false);

      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        // A password-recovery link lands here with a valid temporary session
        // and this specific event — intercept it before the normal
        // logged-in-user routing below sends them straight to the dashboard.
        if (event === 'PASSWORD_RECOVERY') {
          setPage('reset-password');
          return;
        }
        const nu = toAuthUser(session);
        setUser(nu);
        if (nu) {
          setPage(nu.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'dashboard');
        } else {
          setPage('landing');
        }
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    })();

    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleAuth = async () => {
    const supabase = await getSupabaseClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // This is the actual fix for the "stuck on one Google account" bug —
        // it forces Google's account picker instead of silently reusing
        // whichever Google session is already active in the browser.
        queryParams: { prompt: 'select_account' },
      },
    });
    if (err) alert('Sign-in failed: ' + err.message);
  };

  const handleEmailSignup = async (username: string, email: string, password: string): Promise<{ error?: string; needsConfirmation?: boolean }> => {
    const supabase = await getSupabaseClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        // Without this, the auth listener falls back to using the raw email
        // as the display name — this is what actually sets the username.
        data: { full_name: username },
      },
    });
    if (err) return { error: err.message };
    // With "Confirm email" enabled in Supabase, signUp succeeds but returns
    // no active session until the user clicks the link in their inbox.
    if (!data.session) return { needsConfirmation: true };
    return {};
  };

  const handleEmailLogin = async (email: string, password: string): Promise<{ error?: string }> => {
    const supabase = await getSupabaseClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) return { error: err.message };
    return {};
  };

  const handleForgotPassword = async (email: string): Promise<{ error?: string }> => {
    const supabase = await getSupabaseClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (err) return { error: err.message };
    return {};
  };

  const handleSetNewPassword = async (password: string): Promise<{ error?: string }> => {
    const supabase = await getSupabaseClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) return { error: err.message };
    return {};
  };

  const handleSignOut = async () => {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setPage('landing');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <Spinner size={32} />
    </div>
  );

  return (
    <>
      {page === 'admin' && user && <Admin user={user} onBack={handleSignOut} />}
      {page === 'dashboard' && user && (
        <>
          <Dashboard user={user} onSignOut={handleSignOut} onAdmin={() => setPage('admin')} />
          <NoticePopup />
        </>
      )}
      {page === 'landing' && <Landing onLogin={() => setPage('login')} onSignup={() => setPage('signup')} />}
      {page === 'login' && <Login onAuth={handleAuth} onEmailLogin={handleEmailLogin} onForgotPassword={handleForgotPassword} onBack={() => setPage('landing')} onSignup={() => setPage('signup')} />}
      {page === 'signup' && <Signup onAuth={handleAuth} onEmailSignup={handleEmailSignup} onBack={() => setPage('landing')} onLogin={() => setPage('login')} />}
      {page === 'reset-password' && <ResetPassword onSetNewPassword={handleSetNewPassword} onDone={() => setPage('login')} />}
    </>
  );
}
