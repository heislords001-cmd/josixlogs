import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { AuthUser } from '../lib/authTypes';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

interface AdminLog {
  id: string;
  platform: string;
  domain: string;
  label: string;
  description: string;
  price: number;
  sold: boolean;
  uploadedAt: string;
}

interface AdminProps {
  user: AuthUser;
  onBack: () => void;
}

const PLATFORMS = [
  'Facebook', 'Instagram', 'Twitter', 'TikTok', 'Snapchat',
  'Discord', 'LinkedIn', 'Telegram', 'Gmail', 'Reddit',
  'YouTube', 'Pinterest', 'Twitch', 'Netflix', 'Spotify', 'VPN',
];

const DOMAIN_MAP: Record<string, string> = {
  Facebook: 'facebook.com', Instagram: 'instagram.com', Twitter: 'twitter.com',
  TikTok: 'tiktok.com', Snapchat: 'snapchat.com', Discord: 'discord.com',
  LinkedIn: 'linkedin.com', Telegram: 'telegram.org', Gmail: 'gmail.com',
  Reddit: 'reddit.com', YouTube: 'youtube.com', Pinterest: 'pinterest.com',
  Twitch: 'twitch.tv', Netflix: 'netflix.com', Spotify: 'spotify.com',
  // VPN intentionally omitted — providers vary (NordVPN, ExpressVPN, Surfshark...),
  // so the domain field stays editable per-log instead of one fixed icon.
};

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14,
} as const;

export default function Admin({ user, onBack }: AdminProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('jx-theme');
    return (saved === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  });
  const [scheme, setScheme] = useState<'gold' | 'emerald' | 'sapphire'>(() => {
    const saved = localStorage.getItem('jx-scheme');
    return (saved === 'emerald' || saved === 'sapphire') ? saved : 'gold';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jx-theme', theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute('data-scheme', scheme);
    localStorage.setItem('jx-scheme', scheme);
  }, [scheme]);
  const SCHEMES: { id: 'gold' | 'emerald' | 'sapphire'; label: string; c1: string; c2: string }[] = [
    { id: 'gold', label: 'Black & Gold', c1: '#0A0A0A', c2: '#F5C518' },
    { id: 'emerald', label: 'Black & Emerald', c1: '#0A0A0A', c2: '#2ECC71' },
    { id: 'sapphire', label: 'Black & Sapphire', c1: '#0A0A0A', c2: '#3B82F6' },
  ];
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | '' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'logs' | 'upload' | 'notices' | 'tickets'>('logs');

  // Form state
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [customDomain, setCustomDomain] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [credentials, setCredentials] = useState('');

  // Notice state
  const [noticeMsg, setNoticeMsg] = useState('');
  const [noticeDuration, setNoticeDuration] = useState('60');
  const [sendingNotice, setSendingNotice] = useState(false);
  const [activeNotices, setActiveNotices] = useState<{ id: string; message: string; expiresAt: string; createdAt: string }[]>([]);
  const [deletingNoticeId, setDeletingNoticeId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | '' = '') =>
    setToast({ msg, type });

  const loadActiveNotices = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/notices');
      setActiveNotices(res.data.notices || []);
    } catch { /* ignore */ }
  }, []);

  interface Ticket { id: string; userEmail: string; topic: string; subject: string; message: string; status: string; createdAt: string; }
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const res = await api.get('/api/admin/tickets');
      setTickets(res.data.tickets || []);
    } catch {
      showToast('Failed to load tickets', 'error');
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const resolveTicket = async (id: string, status: 'open' | 'resolved') => {
    setUpdatingTicketId(id);
    try {
      await api.post('/api/admin/tickets', { id, status });
      await loadTickets();
    } catch {
      showToast('Failed to update ticket', 'error');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  useEffect(() => { if (tab === 'tickets') loadTickets(); }, [tab, loadTickets]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/logs');
      setLogs(res.data.logs || []);
    } catch {
      showToast('Failed to load logs', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); loadActiveNotices(); }, [loadLogs, loadActiveNotices]);

  const uploadLog = async () => {
    if (!platform || !price || !credentials || !label) {
      showToast('Fill all required fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/admin/logs', {
        platform,
        domain: customDomain || DOMAIN_MAP[platform] || platform.toLowerCase() + '.com',
        label,
        description,
        price: Number(price),
        credentials,
      });
      showToast('Log uploaded!', 'success');
      setPlatform(PLATFORMS[0]);
      setCustomDomain('');
      setLabel('');
      setDescription('');
      setPrice('');
      setCredentials('');
      setTab('logs');
      await loadLogs();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      showToast(err?.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/logs/${deleteTarget.id}`);
      showToast('Log deleted', 'success');
      setDeleteTarget(null);
      await loadLogs();
    } catch {
      showToast('Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const available = logs.filter(l => !l.sold).length;
  const sold = logs.filter(l => l.sold).length;
  const revenue = logs.filter(l => l.sold).reduce((a, b) => a + b.price, 0);

  const inputStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1.5px solid var(--border2)',
    borderRadius: 10,
    padding: '12px 14px',
    fontFamily: 'var(--font)',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
  } as const;

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--muted2)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 6,
    display: 'block',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none' as const,
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23F5C518' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 14px center' as const,
    paddingRight: 40,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 56,
        borderBottom: '1px solid rgba(245,197,24,0.08)',
        background: 'rgba(3,2,10,0.95)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack}
            style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: 'var(--muted2)' }}>
            ←
          </button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>
            JX<span style={{ color: 'var(--accent)', opacity: 0.65 }}>LOGS</span>
            <span style={{ color: 'var(--muted)', marginLeft: 8 }}>/ ADMIN</span>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setProfileOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 20, padding: '5px 12px 5px 5px', cursor: 'pointer' }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {(user.email ?? 'A')[0].toUpperCase()}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--mono)' }}>{user.email}</span>
          </button>
          {profileOpen && (
            <>
              <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 260, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Appearance</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {(['dark', 'light'] as const).map(m => (
                    <button key={m} onClick={() => setTheme(m)} style={{ flex: 1, padding: 8, borderRadius: 9, border: `1.5px solid ${theme === m ? 'var(--accent)' : 'var(--border2)'}`, background: theme === m ? 'var(--accent-dim)' : 'var(--surface2)', color: theme === m ? 'var(--accent)' : 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{m === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {SCHEMES.map(s => (
                    <button key={s.id} onClick={() => setScheme(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, border: `1.5px solid ${scheme === s.id ? 'var(--accent)' : 'var(--border2)'}`, background: scheme === s.id ? 'var(--accent-dim)' : 'var(--surface2)', cursor: 'pointer' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: `linear-gradient(135deg, ${s.c1} 50%, ${s.c2} 50%)`, border: '1px solid var(--border2)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: scheme === s.id ? 'var(--accent)' : 'var(--text)' }}>{s.label}</span>
                    </button>
                  ))}
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 12px' }} />
                <button onClick={onBack} className="btn btn-danger" style={{ width: '100%', padding: 10, borderRadius: 9, fontSize: 13 }}>🚪 Sign Out</button>
              </div>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Available', value: available, color: 'var(--green)' },
            { label: 'Sold', value: sold, color: 'var(--accent)' },
            { label: 'Revenue', value: `₦${revenue.toLocaleString()}`, color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '16px 14px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 4 }}>
          {(['logs', 'upload', 'notices', 'tickets'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: tab === t ? 'rgba(245,197,24,0.1)' : 'transparent',
                color: tab === t ? 'var(--accent)' : 'var(--muted2)',
                fontFamily: 'var(--font)', fontWeight: 700, fontSize: 12,
                transition: 'all 0.15s',
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
              {t === 'logs' ? '📁 Logs' : t === 'upload' ? '➕ Upload' : t === 'notices' ? '📢 Notices' : '🎫 Tickets'}
            </button>
          ))}
        </div>

        {/* LOGS TABLE */}
        {tab === 'logs' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12, color: 'var(--muted2)', flexDirection: 'column' }}>
                <Spinner />
                <span style={{ fontSize: 13 }}>Loading logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted2)', marginBottom: 6 }}>No logs yet</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Upload your first log to get started.</div>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('upload')}>Upload Log</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...logs].reverse().map(log => (
                  <div key={log.id} style={{ ...card, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${log.domain}&sz=64`}
                          alt={log.platform}
                          style={{ width: 26, height: 26, objectFit: 'contain' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{log.label}</span>
                          <span style={{
                            fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700,
                            padding: '2px 8px', borderRadius: 100,
                            background: log.sold ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                            color: log.sold ? 'var(--red)' : 'var(--green)',
                          }}>
                            {log.sold ? 'SOLD' : 'AVAILABLE'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 2 }}>
                          {log.platform} · {log.domain}
                        </div>
                        {log.description && (
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.description}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>₦{log.price.toLocaleString()}</div>
                        {!log.sold && (
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(log)} style={{ fontSize: 11, padding: '4px 10px' }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPLOAD FORM */}
        {tab === 'upload' && (
          <div style={{ animation: 'fadeIn 0.2s ease', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...card, padding: '20px 18px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>New Log</div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Platform *</label>
                <select value={platform} onChange={e => { setPlatform(e.target.value); setCustomDomain(''); }} style={selectStyle}>
                  {PLATFORMS.map(p => <option key={p} value={p} style={{ background: 'var(--surface)' }}>{p}</option>)}
                  <option value="Other" style={{ background: 'var(--surface)' }}>Other</option>
                </select>
              </div>

              {(platform === 'Other' || !DOMAIN_MAP[platform]) && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Domain</label>
                  <input value={customDomain} onChange={e => setCustomDomain(e.target.value)}
                    placeholder="e.g. example.com" style={inputStyle} />
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Label *</label>
                <input value={label} onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Instagram Aged Account 2019" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. 500 followers, verified email" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Price (₦) *</label>
                <input value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 2500" inputMode="numeric" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Credentials *</label>
                <textarea value={credentials} onChange={e => setCredentials(e.target.value)}
                  placeholder="email:password or username:password:recovery"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: 'var(--mono)', fontSize: 13 }} />
              </div>

              {credentials && (
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Preview</div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--accent)', wordBreak: 'break-all', lineHeight: 1.6 }}>{credentials}</div>
                </div>
              )}

              <button className="btn btn-primary btn-full" onClick={uploadLog} disabled={submitting}>
                {submitting ? <><Spinner size={16} color="#000" /> Uploading...</> : 'Upload Log'}
              </button>
            </div>
          </div>
        )}

        {/* NOTICES PANEL */}
        {tab === 'notices' && (
          <div style={{ animation: 'fadeIn 0.2s ease', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Active notices — multiple can run at once now. Only the most
                recently sent one pops up as a toast for users; all of them
                sit in the bell panel. */}
            <div style={{ ...card, padding: '18px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Active Notices {activeNotices.length > 0 && `(${activeNotices.length})`}
              </div>
              {activeNotices.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeNotices.map((n, i) => (
                    <div key={n.id} style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                        <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{n.message}</div>
                        {i === 0 && (
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, padding: '2px 7px', borderRadius: 100, background: 'var(--accent)', color: '#000', fontFamily: 'var(--mono)', flexShrink: 0 }}>POPUP</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Expires: {new Date(n.expiresAt).toLocaleString()}</div>
                        <button className="btn btn-danger btn-sm" disabled={deletingNoticeId === n.id} style={{ fontSize: 11, padding: '4px 10px' }} onClick={async () => {
                          setDeletingNoticeId(n.id);
                          try {
                            await api.delete('/api/admin/notices', { id: n.id });
                            showToast('Notice removed', 'success');
                            await loadActiveNotices();
                          } catch (e) { showToast((e as Error)?.message || 'Failed to remove', 'error'); }
                          finally { setDeletingNoticeId(null); }
                        }}>
                          {deletingNoticeId === n.id ? 'Removing...' : '🗑 Remove'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>No active notices</div>
              )}
            </div>

            {/* Send new notice */}
            <div style={{ ...card, padding: '20px 18px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Send New Notice</div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Message *</label>
                <textarea value={noticeMsg} onChange={e => setNoticeMsg(e.target.value)}
                  placeholder="e.g. We are performing maintenance from 2AM–4AM tonight."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Display Duration</label>
                <select value={noticeDuration} onChange={e => setNoticeDuration(e.target.value)} style={selectStyle}>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="360">6 hours</option>
                  <option value="720">12 hours</option>
                  <option value="1440">24 hours</option>
                  <option value="4320">3 days</option>
                  <option value="10080">1 week</option>
                  <option value="43200">1 month</option>
                </select>
              </div>

              <button className="btn btn-primary btn-full" disabled={sendingNotice || !noticeMsg.trim()} onClick={async () => {
                setSendingNotice(true);
                try {
                  await api.post('/api/admin/notices', { message: noticeMsg.trim(), duration: Number(noticeDuration) });
                  showToast('Notice sent!', 'success');
                  setNoticeMsg('');
                  await loadActiveNotices();
                } catch (e) { showToast((e as Error)?.message || 'Failed to send notice', 'error'); }
                finally { setSendingNotice(false); }
              }}>
                {sendingNotice ? 'Sending...' : '📢 Send Notice'}
              </button>
            </div>
          </div>
        )}

        {/* TICKETS PANEL */}
        {tab === 'tickets' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            {ticketsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12, color: 'var(--muted2)', flexDirection: 'column' }}>
                <Spinner />
                <span style={{ fontSize: 13 }}>Loading reports...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted2)' }}>No reports yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tickets.map(t => (
                  <div key={t.id} style={{ ...card, padding: '14px 16px', opacity: t.status === 'resolved' ? 0.55 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{t.subject}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{t.topic}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 2 }}>{t.userEmail} · {new Date(t.createdAt).toLocaleString()}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, padding: '2px 8px', borderRadius: 100, flexShrink: 0, background: t.status === 'resolved' ? 'rgba(52,211,153,0.1)' : 'rgba(245,197,24,0.1)', color: t.status === 'resolved' ? 'var(--green)' : 'var(--accent)' }}>
                        {t.status === 'resolved' ? 'RESOLVED' : 'OPEN'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{t.message}</div>
                    <button
                      className={t.status === 'resolved' ? 'btn btn-ghost btn-sm' : 'btn btn-primary btn-sm'}
                      disabled={updatingTicketId === t.id}
                      onClick={() => resolveTicket(t.id, t.status === 'resolved' ? 'open' : 'resolved')}
                      style={{ fontSize: 12 }}
                    >
                      {updatingTicketId === t.id ? 'Updating...' : t.status === 'resolved' ? 'Reopen' : 'Mark Resolved'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <Modal onClose={() => !deleting && setDeleteTarget(null)} title="Delete Log" subtitle={`This will permanently remove "${deleteTarget.label}" from the store.`}>
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6 }}>
            ⚠️ This action cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-full" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
            <button className="btn btn-danger btn-full" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <><Spinner size={14} color="var(--red)" /> Deleting...</> : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
