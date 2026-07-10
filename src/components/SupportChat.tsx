import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import Spinner from './Spinner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  redirect?: boolean;
}

const SUPPORT_EMAIL = 'support@josixlogs.com';

export default function SupportChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm here to help with anything about virtual numbers, logs, your wallet, or orders. What's up?" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    try {
      const res = await api.post<{ reply: string; redirect: boolean }>('/api/support-chat', {
        messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
      });
      setMessages([...nextMessages, { role: 'assistant', content: res.data.reply, redirect: res.data.redirect }]);
    } catch {
      setMessages([...nextMessages, {
        role: 'assistant',
        content: "Something went wrong on my end. You can reach a person directly instead.",
        redirect: true,
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: compact ? 420 : '100%', minHeight: compact ? 420 : 480 }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: compact ? '4px 2px 10px' : '4px 4px 16px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
              color: m.role === 'user' ? '#000' : 'var(--text)',
              border: m.role === 'assistant' ? '1px solid var(--border2)' : 'none',
              borderRadius: 14,
              padding: '10px 14px',
              fontSize: 13.5,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
            {m.redirect && (
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('JXLOGS Support Request')}`}
                style={{
                  marginTop: 6, fontSize: 12, fontWeight: 600, color: 'var(--accent)',
                  textDecoration: 'none', border: '1px solid var(--accent-a25)', borderRadius: 8,
                  padding: '6px 12px', background: 'var(--accent-dim)',
                }}
              >
                ✉️ Email {SUPPORT_EMAIL}
              </a>
            )}
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted2)', fontSize: 12, padding: '4px 2px' }}>
            <Spinner size={14} /> Typing...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask a question..."
          style={{
            flex: 1, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10,
            padding: '10px 14px', color: 'var(--text)', fontSize: 13.5, fontFamily: 'var(--font)', outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="btn btn-primary"
          style={{ padding: '10px 18px', opacity: sending || !input.trim() ? 0.5 : 1 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
