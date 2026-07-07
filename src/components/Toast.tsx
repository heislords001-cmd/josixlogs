import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | '';
  onClose: () => void;
}

export default function Toast({ message, type = '', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [message, onClose]);

  const borderColor = type === 'success' ? 'rgba(52,211,153,0.4)' : type === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(245,197,24,0.3)';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const iconColor = type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : 'var(--accent)';

  return (
    <div style={{
      position: 'fixed', bottom: 90, right: 16, left: 16,
      maxWidth: 360, margin: '0 auto',
      background: 'var(--surface2)',
      border: `1px solid ${borderColor}`,
      borderRadius: 12, padding: '14px 16px',
      fontSize: 14, color: 'var(--text)', zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ color: iconColor, fontWeight: 700, fontSize: 16 }}>{icon}</span>
      {message}
    </div>
  );
}
