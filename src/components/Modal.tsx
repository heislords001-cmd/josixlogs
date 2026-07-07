import { ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Modal({ onClose, children, title, subtitle }: ModalProps) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px 48px',
        width: '100%', maxWidth: 500,
        position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 20px' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted2)', fontSize: 14 }}>✕</button>
        {title && <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: subtitle ? 6 : 24 }}>{title}</h3>}
        {subtitle && <p style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 24 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
