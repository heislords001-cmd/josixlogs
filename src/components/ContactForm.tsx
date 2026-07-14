import { useState } from 'react';
import { api } from '../lib/api';
import Spinner from './Spinner';

const TOPICS = ['General', 'Account', 'Payment', 'Logs / Purchase', 'Boosting', 'Refund', 'Technical', 'Other'];

const FAQS: { q: string; a: string }[] = [
  { q: 'How long does it take to receive a number?', a: 'Numbers are delivered instantly to your dashboard the moment payment is confirmed — usually within a few seconds.' },
  { q: 'My log or account isn\'t working — what should I do?', a: 'Report it here with the order details (platform, date, and what went wrong) and our team will look into it.' },
  { q: 'How do I fund my wallet?', a: 'Go to Wallet → Add Funds. You\'ll see a dedicated account number — transfer to it and your balance updates within 1–2 minutes.' },
  { q: 'Can I get a refund?', a: 'Refunds are handled case by case. Submit a report under the "Refund" topic with your order details and we\'ll get back to you.' },
  { q: 'How long until I get a reply?', a: 'Most reports get a response within a few hours. Urgent account or payment issues are prioritized.' },
];

export default function ContactForm() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const submit = async () => {
    if (!subject.trim()) { setError('Add a short subject.'); return; }
    if (message.trim().length < 15) { setError('Describe the issue in at least 15 characters.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/support-ticket', { topic, subject: subject.trim(), message: message.trim() });
      setSubmitted(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || 'Failed to submit — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'var(--surface2)', border: '1.5px solid var(--border2)',
    borderRadius: 10, padding: '12px 14px', fontFamily: 'var(--font)', fontSize: 14,
    color: 'var(--text)', outline: 'none',
  } as const;

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 8px' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Report sent</div>
        <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 20 }}>We'll follow up by looking into your account — most reports get a response within a few hours.</div>
        <button className="btn btn-ghost btn-full" onClick={() => { setSubmitted(false); setSubject(''); setMessage(''); setTopic(TOPICS[0]); }}>Send Another</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Topic</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {TOPICS.map(t => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            style={{
              padding: '7px 14px', borderRadius: 100, fontSize: 12.5, fontWeight: 600,
              border: `1.5px solid ${topic === t ? 'var(--accent)' : 'var(--border2)'}`,
              background: topic === t ? 'var(--accent-dim)' : 'var(--surface2)',
              color: topic === t ? 'var(--accent)' : 'var(--muted2)',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Subject</label>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 3000))}
          placeholder="Describe your issue in detail so we can help you faster..."
          rows={5}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>{message.length} / 3000</div>

      {error && <div style={{ fontSize: 12.5, color: 'var(--red)', lineHeight: 1.5, marginBottom: 12 }}>{error}</div>}

      <button className="btn btn-primary btn-full" onClick={submit} disabled={submitting}>
        {submitting ? <><Spinner size={16} color="#000" /> Sending...</> : 'Send Message'}
      </button>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', margin: '28px 0 12px' }}>Frequently Asked Questions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQS.map((f, i) => (
          <div key={f.q} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, overflow: 'hidden' }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{f.q}</span>
              <span style={{ color: 'var(--muted2)', fontSize: 12, flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
            </button>
            {openFaq === i && (
              <div style={{ padding: '0 14px 14px', fontSize: 12.5, color: 'var(--muted2)', lineHeight: 1.6 }}>{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
