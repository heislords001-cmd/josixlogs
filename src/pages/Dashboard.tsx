import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { AuthUser } from '../lib/authTypes';
import type { User, Order, Transaction, LogItem } from '../types';
import { SERVICES } from '../services';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import SupportChat from '../components/SupportChat';

type Tab = 'home' | 'store' | 'logs' | 'boost' | 'orders' | 'wallet' | 'profile' | 'support';

interface DashboardProps {
  user: AuthUser;
  onSignOut: () => void;
  onAdmin: () => void;
}

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

function Badge({ children, color = 'var(--accent)' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ background: `${color}18`, color, padding: '3px 10px', borderRadius: 100, fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 600 }}>
      {children}
    </span>
  );
}

function NavIcon({ id }: { id: 'home' | 'store' | 'logs' | 'boost' | 'orders' | 'wallet' | 'profile' | 'support' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'home':
      return (<svg {...common}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>);
    case 'store':
      return (<svg {...common}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>);
    case 'logs':
      return (<svg {...common}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>);
    case 'boost':
      return (<svg {...common}><path d="M5 15c-1-4 1-9 5-11 1 3 4 4 6 8 1.5 3-.5 6.5-3 8-1-2-2-3-4-3s-3 1-4 3c-1-1.5-1-3 0-5Z" /><circle cx="12" cy="10" r="1.4" /></svg>);
    case 'wallet':
      return (<svg {...common}><rect x="2.5" y="6" width="19" height="13" rx="2.5" /><path d="M2.5 10h19" /><circle cx="17.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" /></svg>);
    case 'support':
      return (<svg {...common}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" /></svg>);
    default:
      return null;
  }
}

const LOGO_DOMAINS: Record<string, string> = {
  'Facebook': 'facebook.com', 'Instagram': 'instagram.com', 'Twitter': 'twitter.com',
  'Gmail': 'gmail.com', 'Google': 'google.com', 'TikTok': 'tiktok.com',
  'Snapchat': 'snapchat.com', 'Discord': 'discord.com', 'LinkedIn': 'linkedin.com',
  'Twitter / X': 'x.com', 'YouTube': 'youtube.com', 'Telegram': 'telegram.org',
};

export default function Dashboard({ user, onSignOut }: DashboardProps) {
  const [tab, setTab] = useState<Tab>('home');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('jx-theme');
    return (saved === 'light' ? 'light' : 'dark') as 'dark' | 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jx-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const [scheme, setScheme] = useState<'gold' | 'emerald' | 'sapphire'>(() => {
    const saved = localStorage.getItem('jx-scheme');
    return (saved === 'emerald' || saved === 'sapphire') ? saved : 'gold';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-scheme', scheme);
    localStorage.setItem('jx-scheme', scheme);
  }, [scheme]);

  const SCHEMES: { id: 'gold' | 'emerald' | 'sapphire'; label: string; c1: string; c2: string }[] = [
    { id: 'gold', label: 'Black & Gold', c1: '#0A0A0A', c2: '#F5C518' },
    { id: 'emerald', label: 'Black & Emerald', c1: '#0A0A0A', c2: '#2ECC71' },
    { id: 'sapphire', label: 'Black & Sapphire', c1: '#0A0A0A', c2: '#3B82F6' },
  ];
  const [profile, setProfile] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | '' } | null>(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const NGN_PER_USD = 1550; // Approximate manual rate — update periodically, or wire to a live FX API later
  const [supportOpen, setSupportOpen] = useState(false);

  // Store state
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0]>(SERVICES[0]);
  const [countryPrices, setCountryPrices] = useState<{ country: string; countryCode: string; price: number; available: number }[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchasedNumber, setPurchasedNumber] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [buyingLog, setBuyingLog] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | '' = '') => setToast({ msg, type });

  const loadData = useCallback(async () => {
    try {
      const [pRes, oRes, tRes] = await Promise.all([
        api.get('/api/profile'),
        api.get('/api/orders'),
        api.get('/api/transactions'),
      ]);
      setProfile(pRes.data.profile);
      setOrders(oRes.data.orders || []);
      setTxns(tRes.data.transactions || []);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!loading) { setSlowLoad(false); return; }
    const t = setTimeout(() => setSlowLoad(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/api/logs');
      setLogs(res.data.logs || []);
    } catch {
      showToast('Failed to load logs', 'error');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab]);

  const buyLog = async (log: LogItem) => {
    if (!profile) return;
    if (profile.balance < log.price) {
      setFundOpen(true);
      showToast('Insufficient balance. Fund your wallet first.', 'error');
      return;
    }
    setBuyingLog(log.id);
    try {
      const res = await api.post('/api/logs/buy', { logId: log.id });
      await loadData();
      await loadLogs();
      const creds = res.data.credentials as string;
      showToast('Log purchased!', 'success');
      setPurchasedCreds({ label: log.label, platform: log.platform, creds });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      showToast(err?.response?.data?.error || 'Purchase failed.', 'error');
    } finally {
      setBuyingLog(null);
    }
  };

  const [purchasedCreds, setPurchasedCreds] = useState<{ label: string; platform: string; creds: string } | null>(null);

  const selectService = async (svc: typeof SERVICES[0]) => {
    setSelectedService(svc);
    setLoadingPrices(true);
    setCountryPrices([]);
    setPurchasedNumber(null);
    setSelectedCountryCode('');
    try {
      const res = await api.get(`/api/prices/${svc.fivesimCode}`);
      const prices = res.data.prices || [];
      setCountryPrices(prices);
      if (prices.length > 0) setSelectedCountryCode(prices[0].countryCode);
    } catch {
      showToast('Failed to load prices', 'error');
    } finally {
      setLoadingPrices(false);
    }
  };

  useEffect(() => { if (tab === 'store' && countryPrices.length === 0 && !loadingPrices) { selectService(selectedService); } }, [tab]);

  const selectedCountry = countryPrices.find(c => c.countryCode === selectedCountryCode) ?? null;
  const [platformSearch, setPlatformSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const filteredServices = SERVICES.filter(s =>
    s.name.toLowerCase().includes(platformSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(platformSearch.toLowerCase())
  );
  const filteredCountries = countryPrices.filter(c =>
    c.country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const buyNumber = async () => {
    if (!selectedService || !selectedCountry || !profile) return;
    if (profile.balance < selectedCountry.price) {
      setFundOpen(true);
      showToast('Insufficient balance. Fund your wallet first.', 'error');
      return;
    }
    setPurchasing(true);
    try {
      const res = await api.post('/api/orders', {
        service: selectedService.name,
        serviceIcon: selectedService.logo,
        fivesimCode: selectedService.fivesimCode,
        countryCode: selectedCountry.countryCode,
        country: selectedCountry.country,
        price: selectedCountry.price,
      });
      setPurchasedNumber(res.data.order.number);
      await loadData();
      showToast('Number purchased!', 'success');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      showToast(err?.response?.data?.error || 'Purchase failed. Try again.', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied!', 'success'));
  };

  const bal = profile?.balance ?? 0;
  const recentOrders = [...orders].reverse().slice(0, 5);
  const thisMonth = orders.filter(o => new Date(o.date).getMonth() === new Date().getMonth()).length;
  const totalSpent = orders.reduce((a, b) => a + b.price, 0);

  const NAV = [
    { id: 'home' as Tab, label: 'Home' },
    { id: 'store' as Tab, label: 'Numbers' },
    { id: 'logs' as Tab, label: 'Logs' },
    { id: 'boost' as Tab, label: 'Boost' },
    { id: 'wallet' as Tab, label: 'Wallet' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', gap: 12, color: 'var(--muted2)', flexDirection: 'column', padding: '0 32px', textAlign: 'center' }}>
      <Spinner size={36} />
      <span style={{ fontSize: 14 }}>{slowLoad ? 'Waking up the server — this can take a bit after inactivity...' : 'Loading...'}</span>
    </div>
  );

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, transition: 'all 0.15s ease' } as const;
  const sectionTitle = { fontSize: 20, fontWeight: 700, marginBottom: 20 } as const;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 100 }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, borderBottom: '1px solid var(--accent-a08)', background: 'rgba(3,2,10,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2, textShadow: '0 0 20px var(--accent-a30)' }}>
          JX<span style={{ color: 'var(--text)' }}>LOGS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Cart icon */}
          <button
            onClick={() => setTab('orders')}
            style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, transition: 'all 0.15s' }}
          >
            🛒
            {orders.length > 0 && (
              <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#000', fontFamily: 'var(--mono)', animation: 'popIn 0.3s ease' }}>
                {orders.length > 9 ? '9+' : orders.length}
              </div>
            )}
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, transition: 'all 0.15s', flexShrink: 0 }}
          >{theme === 'dark' ? '☀️' : '🌙'}</button>
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setAvatarOpen(o => !o)}
              style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#000', cursor: 'pointer', boxShadow: '0 0 12px var(--accent-a25)', transition: 'all 0.15s', userSelect: 'none' }}
            >
              {(user.name ?? 'U')[0].toUpperCase()}
            </div>
            {avatarOpen && (
              <>
                <div onClick={() => setAvatarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                <div style={{ position: 'absolute', top: 42, right: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: '8px 0', minWidth: 180, zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name ?? 'User'}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                  </div>
                  <button
                    onClick={() => { setAvatarOpen(false); setTab('profile'); }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '10px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  >👤 My Profile</button>
                  <button
                    onClick={() => { setAvatarOpen(false); onSignOut(); }}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '10px 16px', textAlign: 'left', fontSize: 13, color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  >🚪 Sign Out</button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="content-shell">

        {/* HOME */}
        {tab === 'home' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 4 }}>Welcome back,</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{user.name?.split(' ')[0]} 👋</div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#161208,#0F0E12)', border: '1px solid var(--accent-a20)', borderRadius: 18, padding: '24px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, background: 'radial-gradient(circle,var(--accent-a10) 0%,transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 2 }}>WALLET BALANCE</div>
                <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 100, padding: 3 }}>
                  {(['NGN', 'USD'] as const).map(c => (
                    <button key={c} onClick={() => setCurrency(c)} style={{ padding: '4px 12px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', background: currency === c ? 'var(--accent)' : 'transparent', color: currency === c ? '#000' : 'var(--muted2)', transition: 'all 0.15s' }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
                {currency === 'NGN' ? (<><span style={{ fontSize: 18, color: 'var(--accent)', opacity: 0.7, marginRight: 2 }}>₦</span>{fmt(bal)}</>) : (<><span style={{ fontSize: 18, color: 'var(--accent)', opacity: 0.7, marginRight: 2 }}>$</span>{fmt(bal / NGN_PER_USD)}</>)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 16 }}>{currency === 'USD' ? `≈ Approximate rate, ₦${NGN_PER_USD.toLocaleString()}/$1` : 'Nigerian Naira'}</div>
              <button className="btn btn-primary btn-sm" onClick={() => setFundOpen(true)}>+ Add Funds</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[['Bought', orders.length],['This Month', thisMonth],['Spent', `₦${totalSpent.toLocaleString()}`]].map(([l,v]) => (
                <div key={String(l)} style={{ ...card, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{v}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</div>
                </div>
              ))}
            </div>
            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Virtual Numbers', sub: 'Buy SMS numbers', tab: 'store' as Tab, icon: '📱' },
                { label: 'Logs', sub: 'Social accounts', tab: 'logs' as Tab, icon: '📁' },
                { label: 'Customer Service', sub: 'Get help fast', tab: 'support' as Tab, icon: '💬' },
              ].map(item => (
                <div key={item.label} onClick={() => setTab(item.tab)}
                  style={{ ...card, padding: '16px 14px', cursor: 'pointer', transition: 'all 0.15s' }}
                  onTouchStart={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'}
                  onTouchEnd={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Orders</span>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setTab('orders')}>View all</button>
              </div>
              {recentOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 14, color: 'var(--muted2)' }}>No orders yet</div>
                </div>
              ) : recentOrders.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: 'var(--surface2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{o.service}</div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--mono)', cursor: 'pointer' }} onClick={() => copyText(o.number)}>{o.number} 📋</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>₦{o.price.toLocaleString()}</div>
                    <Badge color="var(--green)">✓ Done</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STORE */}
        {tab === 'store' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={sectionTitle}>Virtual Numbers</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Bal: <strong style={{ color: 'var(--accent)' }}>{currency === 'NGN' ? `₦${bal.toLocaleString()}` : `$${(bal / NGN_PER_USD).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</strong></div>
            </div>
            {purchasedNumber ? (
              <div style={{ background: 'linear-gradient(135deg,#161208,#0F0E12)', border: '1px solid var(--accent-a35)', borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>YOUR NUMBER IS READY</div>
                <div onClick={() => copyText(purchasedNumber)} style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 700, color: 'var(--accent)', letterSpacing: 3, marginBottom: 6, cursor: 'pointer' }}>{purchasedNumber}</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 20 }}>Tap to copy</div>
                <div style={{ background: 'var(--accent-a06)', border: '1px solid var(--accent-a12)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 20 }}>Use this number for SMS verification. One-time use — copy it now.</div>
                <button className="btn btn-primary btn-full" onClick={() => setPurchasedNumber(null)}>Buy Another</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Select Platform</div>
                <div style={{ ...card, marginBottom: 20 }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '8px 10px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                      <input
                        value={platformSearch}
                        onChange={e => setPlatformSearch(e.target.value)}
                        placeholder="Search platform or category..."
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)' }}
                      />
                    </div>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {filteredServices.length === 0 && (
                      <div style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--muted2)', fontSize: 13 }}>No platforms match "{platformSearch}"</div>
                    )}
                    {filteredServices.map((s, i) => {
                      const isActive = selectedService?.id === s.id;
                      return (
                        <div key={s.id} onClick={() => selectService(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i === filteredServices.length - 1 ? 'none' : '1px solid var(--border)', cursor: 'pointer', background: isActive ? 'var(--accent-a06)' : 'transparent', transition: 'background 0.15s' }}
                        >
                          <div style={{ width: 34, height: 34, borderRadius: 9, overflow: 'hidden', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <img src={s.logo} alt={s.name} style={{ width: 22, height: 22, objectFit: 'contain' }}
                              onError={e => { const el = e.currentTarget; el.style.display='none'; if (el.parentElement) el.parentElement.innerHTML=`<span style="font-size:14px;font-weight:700;color:var(--accent)">${s.name[0]}</span>`; }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text)' }}>{s.name}</span>
                              {s.badge && (
                                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.4, padding: '2px 5px', borderRadius: 5, color: '#000', fontFamily: 'var(--mono)', background: s.badge === 'HOT' ? '#FF6B4A' : s.badge === 'NEW' ? '#34D399' : s.badge === 'GOLD' ? 'var(--accent)' : '#8B7FFF' }}>{s.badge}</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{s.category}</div>
                          </div>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border2)'}`, background: isActive ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isActive && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Select Country</div>
                {loadingPrices ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--muted2)', fontSize: 14, marginBottom: 20 }}>
                    <Spinner size={16} /> Fetching prices...
                  </div>
                ) : (
                  <div style={{ position: 'relative', marginBottom: 20 }}>
                    <button
                      onClick={() => setCountryDropdownOpen(o => !o)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', border: `1.5px solid ${selectedCountryCode ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 16px', fontFamily: 'var(--font)', fontSize: 15, color: selectedCountryCode ? 'var(--text)' : 'var(--muted2)', cursor: 'pointer' }}
                    >
                      <span>{selectedCountry ? `${selectedCountry.country} — ₦${selectedCountry.price.toLocaleString()}` : (countryPrices.length === 0 ? 'No countries available' : 'Choose a country')}</span>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--accent)" style={{ transform: countryDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" /></svg>
                    </button>
                    {countryDropdownOpen && (
                      <>
                        <div onClick={() => setCountryDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, maxHeight: 300, overflow: 'hidden', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 9, padding: '7px 10px' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                              <input
                                autoFocus
                                value={countrySearch}
                                onChange={e => setCountrySearch(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                placeholder="Search country..."
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)' }}
                              />
                            </div>
                          </div>
                          <div style={{ overflowY: 'auto' }}>
                            {filteredCountries.length === 0 && (
                              <div style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--muted2)', fontSize: 13 }}>No countries match "{countrySearch}"</div>
                            )}
                            {filteredCountries.map((c, i) => (
                              <div key={c.countryCode} onClick={() => { setSelectedCountryCode(c.countryCode); setCountryDropdownOpen(false); setCountrySearch(''); }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', borderBottom: i === filteredCountries.length - 1 ? 'none' : '1px solid var(--border)', cursor: 'pointer', background: selectedCountryCode === c.countryCode ? 'var(--accent-a06)' : 'transparent' }}
                              >
                                <div>
                                  <div style={{ fontSize: 13.5, fontWeight: 600, color: selectedCountryCode === c.countryCode ? 'var(--accent)' : 'var(--text)' }}>{c.country}</div>
                                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{c.available.toLocaleString()} available</div>
                                </div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>₦{c.price.toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {selectedCountry && !loadingPrices && (
                  <div style={{ background: 'linear-gradient(135deg,#161208,#0F0E12)', border: '1px solid var(--accent-a20)', borderRadius: 14, padding: '18px 16px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedService.name} Number</div>
                        <div style={{ fontSize: 13, color: 'var(--muted2)', marginTop: 2 }}>{selectedCountry.country}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>₦{selectedCountry.price.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 2 }}>from your wallet</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 16 }}>Number delivered instantly after purchase.</div>
                    <button className="btn btn-primary btn-full" style={{ fontSize: 15, fontWeight: 700 }} onClick={buyNumber} disabled={purchasing}>
                      {purchasing ? <><Spinner size={16} color="#000" /> Purchasing...</> : 'Buy Number Instantly'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* LOGS */}
        {tab === 'logs' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={sectionTitle}>Logs</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Ready-to-use social media accounts</div>
            </div>

            {purchasedCreds ? (
              <div style={{ background: 'linear-gradient(135deg,#161208,#0F0E12)', border: '1px solid var(--accent-a35)', borderRadius: 16, padding: '28px 20px' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>YOUR {purchasedCreds.platform.toUpperCase()} LOG</div>
                <div onClick={() => copyText(purchasedCreds.creds)}
                  style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', cursor: 'pointer', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 8 }}>
                  {purchasedCreds.creds}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 20 }}>Tap to copy — save this, it won't show again</div>
                <div style={{ background: 'var(--accent-a06)', border: '1px solid var(--accent-a12)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 16 }}>
                  ⚠️ Store these credentials securely. This is a one-time reveal.
                </div>
                <button className="btn btn-primary btn-full" onClick={() => setPurchasedCreds(null)}>Back to Logs</button>
              </div>
            ) : logsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12, color: 'var(--muted2)', flexDirection: 'column' }}>
                <Spinner />
                <span style={{ fontSize: 13 }}>Loading available logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div style={{ ...card, padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted2)', marginBottom: 6 }}>No logs available</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Check back soon — new logs are added regularly</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from(new Set(logs.map(l => l.platform))).map(platform => (
                  <div key={platform}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, paddingTop: 8 }}>{platform}</div>
                    {logs.filter(l => l.platform === platform).map(log => (
                      <div key={log.id} style={{ ...card, padding: '14px 16px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <img src={`https://www.google.com/s2/favicons?domain=${log.domain || LOGO_DOMAINS[log.platform] || log.platform.toLowerCase() + '.com'}&sz=64`}
                                alt={log.platform} style={{ width: 28, height: 28, objectFit: 'contain' }}
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{log.label}</div>
                              {log.description && <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description}</div>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>₦{log.price.toLocaleString()}</div>
                            <button className="btn btn-primary btn-sm" onClick={() => buyLog(log)} disabled={buyingLog === log.id} style={{ fontSize: 12, padding: '6px 14px' }}>
                              {buyingLog === log.id ? <Spinner size={12} color="#000" /> : 'Buy'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={sectionTitle}>My Orders</div>
            {orders.length === 0 ? (
              <div style={{ ...card, padding: '48px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted2)', marginBottom: 6 }}>No orders yet</div>
                <div style={{ fontSize: 13 }}>Buy your first number or log to see it here</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...orders].reverse().map(o => (
                  <div key={o.id} style={{ ...card, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: 'var(--surface2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{o.service}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{o.country} · {new Date(o.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <Badge color="var(--green)">✓ Done</Badge>
                    </div>
                    <div onClick={() => copyText(o.number)} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', wordBreak: 'break-all' }}>
                      <span style={{ flex: 1 }}>{o.number}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted2)', marginLeft: 8, flexShrink: 0 }}>📋</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted2)', textAlign: 'right' }}>₦{o.price.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOOST */}
        {tab === 'boost' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={sectionTitle}>Boost</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)' }}>Grow your social media instantly</div>
            </div>

            {/* Coming soon / API not connected */}
            <div style={{ background: 'linear-gradient(135deg,#161208,#0F0E12)', border: '1px solid var(--accent-a20)', borderRadius: 16, padding: '28px 20px', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Boosting Coming Soon</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6 }}>SMM panel integration is being set up. Check back soon.</div>
            </div>

            {/* Service categories preview */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Available Services</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { platform: 'Instagram', icon: 'instagram.com', services: ['Followers', 'Likes', 'Views', 'Comments'] },
                { platform: 'TikTok', icon: 'tiktok.com', services: ['Followers', 'Likes', 'Views'] },
                { platform: 'Twitter / X', icon: 'x.com', services: ['Followers', 'Likes', 'Retweets'] },
                { platform: 'YouTube', icon: 'youtube.com', services: ['Subscribers', 'Views', 'Likes'] },
                { platform: 'Facebook', icon: 'facebook.com', services: ['Page Likes', 'Followers', 'Post Likes'] },
                { platform: 'Telegram', icon: 'telegram.org', services: ['Members', 'Views', 'Reactions'] },
                { platform: 'Spotify', icon: 'spotify.com', services: ['Streams', 'Followers', 'Plays'] },
                { platform: 'Snapchat', icon: 'snapchat.com', services: ['Followers', 'Views'] },
              ].map(item => (
                <div key={item.platform} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={`https://www.google.com/s2/favicons?domain=${item.icon}&sz=64`} alt={item.platform}
                      style={{ width: 28, height: 28, objectFit: 'contain' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.platform}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.services.map(s => (
                        <span key={s} style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted2)', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)', flexShrink: 0 }}>Soon</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WALLET */}
        {tab === 'wallet' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={sectionTitle}>Wallet</div>
              <button className="btn btn-primary btn-sm" onClick={() => setFundOpen(true)}>+ Add Funds</button>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#161208,#0F0E12)', border: '1px solid var(--accent-a20)', borderRadius: 18, padding: '24px 20px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 2 }}>CURRENT BALANCE</div>
                <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 100, padding: 3 }}>
                  {(['NGN', 'USD'] as const).map(c => (
                    <button key={c} onClick={() => setCurrency(c)} style={{ padding: '4px 12px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', background: currency === c ? 'var(--accent)' : 'transparent', color: currency === c ? '#000' : 'var(--muted2)', transition: 'all 0.15s' }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>
                {currency === 'NGN' ? (<><span style={{ fontSize: 18, color: 'var(--accent)', opacity: 0.7, marginRight: 2 }}>₦</span>{fmt(bal)}</>) : (<><span style={{ fontSize: 18, color: 'var(--accent)', opacity: 0.7, marginRight: 2 }}>$</span>{fmt(bal / NGN_PER_USD)}</>)}
              </div>
            </div>
            <div style={card}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>Transactions</div>
              {txns.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
                  <div style={{ fontSize: 14, color: 'var(--muted2)' }}>No transactions yet</div>
                </div>
              ) : [...txns].reverse().map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: t.type === 'credit' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      {t.type === 'credit' ? '↓' : '↑'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t.desc}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{new Date(t.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: t.type === 'credit' ? 'var(--green)' : 'var(--red)' }}>
                    {t.type === 'credit' ? '+' : '-'}₦{t.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={sectionTitle}>My Profile</div>

            <div style={{ ...card, padding: '28px 20px', textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#000', margin: '0 auto 14px', boxShadow: '0 0 20px var(--accent-a25)' }}>
                {(user.name ?? 'U')[0].toUpperCase()}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{user.name ?? 'User'}</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)' }}>{user.email}</div>
            </div>

            <div style={{ ...card, marginBottom: 20 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>Account</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--muted2)' }}>Wallet Balance</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>₦{fmt(bal)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                <span style={{ fontSize: 13, color: 'var(--muted2)' }}>Member Since</span>
                <span style={{ fontSize: 13 }}>{profile?.joined ? new Date(profile.joined).toLocaleDateString() : '—'}</span>
              </div>
            </div>

            <div style={{ ...card, marginBottom: 20, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Appearance</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 8 }}>Mode</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                {(['dark', 'light'] as const).map(m => (
                  <button key={m} onClick={() => setTheme(m)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid ${theme === m ? 'var(--accent)' : 'var(--border2)'}`, background: theme === m ? 'var(--accent-dim)' : 'var(--surface2)', color: theme === m ? 'var(--accent)' : 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{m === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 8 }}>Color Scheme</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCHEMES.map(s => (
                  <button key={s.id} onClick={() => setScheme(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${scheme === s.id ? 'var(--accent)' : 'var(--border2)'}`, background: scheme === s.id ? 'var(--accent-dim)' : 'var(--surface2)', cursor: 'pointer' }}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${s.c1} 50%, ${s.c2} 50%)`, border: '1px solid var(--border2)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: scheme === s.id ? 'var(--accent)' : 'var(--text)' }}>{s.label}</span>
                    {scheme === s.id && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)' }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-danger" onClick={onSignOut} style={{ width: '100%', padding: 12, borderRadius: 12 }}>🚪 Sign Out</button>
          </div>
        )}

        {/* SUPPORT (dashboard tab) */}
        {tab === 'support' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={sectionTitle}>Customer Service</div>
            <div style={{ ...card, padding: '14px 16px' }}>
              <SupportChat />
            </div>
          </div>
        )}

      </div>

      {/* App nav — floating pill on phones, sidebar on desktop (see .app-nav in index.css) */}
      <div className="app-nav">
        {NAV.map(item => {
          const isActive = tab === item.id;
          return (
            <button key={item.id}
              className="app-nav-item"
              onClick={() => { setTab(item.id); setPurchasedNumber(null); setPurchasedCreds(null); }}
              style={{
                background: isActive ? 'var(--accent-a10)' : 'transparent',
                cursor: 'pointer',
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                transform: isActive ? 'translateY(-2px)' : 'none',
                animation: isActive ? 'goldPulse 2s infinite' : 'none',
              }}
            >
              {/* Active dot (mobile only — hidden on desktop sidebar layout) */}
              {isActive && (
                <div className="app-nav-dot" style={{
                  position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                  animation: 'popIn 0.3s ease',
                }} />
              )}
              <span className="app-nav-icon" style={{ transform: isActive ? 'scale(1.15)' : 'scale(1)' }}><NavIcon id={item.id} /></span>
              <span className="app-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Floating support button */}
      <button
        className="floating-support-btn"
        onClick={() => setSupportOpen(true)}
        title="Customer Service"
        style={{
          position: 'fixed', bottom: 92, right: 16, width: 48, height: 48, borderRadius: '50%',
          background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 24px var(--accent-a35)', zIndex: 99,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
        </svg>
      </button>

      {/* SUPPORT MODAL */}
      {supportOpen && (
        <Modal onClose={() => setSupportOpen(false)} title="Customer Service">
          <SupportChat compact />
        </Modal>
      )}

      {/* FUND MODAL */}
      {fundOpen && (
        <Modal onClose={() => setFundOpen(false)} title="Fund Wallet" subtitle="Transfer to the account below. Your wallet credits automatically.">
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {[
              ['Bank', profile?.acctBank ?? 'Wema Bank'],
              ['Account Number', profile?.acctNumber ?? '—'],
              ['Account Name', `JXLOGS / ${(user.name ?? '').split(' ')[0].toUpperCase()}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--mono)' }}>{k}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)' }}>{v}</div>
                  {k === 'Account Number' && (
                    <button onClick={() => copyText(v)} style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-a25)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--mono)' }}>COPY</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--accent-a05)', border: '1px solid var(--accent-a12)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 16 }}>
            <strong style={{ color: 'var(--accent)' }}>Note:</strong> This account is unique to you. Transfers reflect within 1–2 minutes. Min: <strong style={{ color: 'var(--accent)' }}>₦500</strong>.
          </div>
          <button className="btn btn-ghost btn-full" onClick={() => setFundOpen(false)}>Close</button>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ textAlign: 'center', padding: '20px 16px 120px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 1 }}>
        &copy; 2026 44TH-STUDIO INC. ALL RIGHTS RESERVED.
      </div>
    </div>
  );
}
