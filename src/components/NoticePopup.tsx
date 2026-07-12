import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Notice {
  id: string;
  message: string;
  expiresAt: string;
}

export default function NoticePopup() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get<{ latest: Notice | null }>('/api/notices');
        const n = res.data.latest;
        if (n) {
          const dismissedId = sessionStorage.getItem('dismissed_notice');
          if (dismissedId === n.id) return;
          setNotice(n);
          setTimeout(() => setVisible(true), 400);
        }
      } catch { /* ignore */ }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (notice) sessionStorage.setItem('dismissed_notice', notice.id);
  };

  if (!notice || dismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '120px'})`,
      opacity: visible ? 1 : 0,
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
      zIndex: 9999,
      width: 'min(92vw, 460px)',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1.5px solid rgba(245,197,24,0.35)',
        borderRadius: 16,
        padding: '16px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(245,197,24,0.08)',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(245,197,24,0.1)',
          border: '1px solid rgba(245,197,24,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0, marginTop: 1,
        }}>📢</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: 1.2,
            marginBottom: 5, fontFamily: 'var(--mono)',
          }}>Notice</div>
          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, marginBottom: 10 }}>
            {notice.message}
          </div>
          <button onClick={dismiss} style={{
            fontSize: 12, color: 'var(--muted2)',
            background: 'var(--surface2)',
            border: '1px solid var(--border2)',
            borderRadius: 8, padding: '5px 12px',
            cursor: 'pointer', fontFamily: 'var(--font)',
          }}>Dismiss</button>
        </div>

        <button onClick={dismiss} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 20, lineHeight: 1,
          padding: 0, flexShrink: 0, marginTop: 1,
        }}>×</button>
      </div>
    </div>
  );
}
