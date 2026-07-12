interface LandingProps { onLogin: () => void; onSignup: () => void; }

const PLATFORM_DOMAINS = [
  'whatsapp.com', 'telegram.org', 'instagram.com', 'x.com', 'facebook.com',
  'tiktok.com', 'discord.com', 'google.com', 'snapchat.com', 'linkedin.com',
  'paypal.com', 'binance.com', 'netflix.com', 'spotify.com', 'tinder.com',
];

function PlatformIcon({ domain }: { domain: string }) {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 14, background: 'var(--surface)',
      border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={domain}
        style={{ width: 26, height: 26, objectFit: 'contain' }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
      />
    </div>
  );
}

export default function Landing({ onLogin, onSignup }: LandingProps) {
  const steps = [
    { n: '01', title: 'Fund your wallet', desc: 'One bank transfer to your own dedicated account number. Reflects in under two minutes.' },
    { n: '02', title: 'Pick what you need', desc: 'A number for SMS verification, a ready-made account, or a boost — search, select, confirm.' },
    { n: '03', title: 'Get it instantly', desc: 'No waiting on a person. Numbers and logs land in your dashboard the moment payment clears.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflowX: 'hidden' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 58,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,7,10,0.92)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>
          JX<span style={{ color: 'var(--accent)', opacity: 0.65 }}>LOGS</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={onLogin}>Log in</button>
          <button className="btn btn-primary btn-sm" onClick={onSignup}>Sign up</button>
        </div>
      </nav>

      {/* HERO — asymmetric split instead of centered block */}
      <div style={{ position: 'relative', padding: '64px 20px 40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 420, height: 420, background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, alignItems: 'center' }} className="hero-grid">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'var(--accent-dim)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: 100, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent)', marginBottom: 24, letterSpacing: 1 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              LIVE CATALOG · REAL-TIME PRICING
            </div>

            <h1 style={{ fontSize: 'clamp(36px,6vw,62px)', fontWeight: 800, lineHeight: 1.02, letterSpacing: -2.5, marginBottom: 20 }}>
              Numbers, accounts,<br />
              and reach —<br />
              <span style={{ color: 'var(--accent)' }}>on demand.</span>
            </h1>

            <p style={{ fontSize: 16, color: 'var(--muted2)', maxWidth: 440, lineHeight: 1.7, marginBottom: 32 }}>
              Fund a wallet once. Pull a live SMS number for any platform, grab a ready-made account, or push real growth — no waiting on a person to fulfill it.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={onSignup} style={{ fontSize: 15, padding: '13px 28px' }}>Get Started — Free</button>
              <button className="btn btn-ghost" onClick={onLogin} style={{ fontSize: 15 }}>Sign in →</button>
            </div>
          </div>

          {/* Mock dashboard preview card — proof instead of an abstract icon */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%', maxWidth: 340, background: 'var(--surface)', border: '1px solid var(--border2)',
              borderRadius: 20, padding: '22px 20px', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              transform: 'rotate(-2deg)',
            }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Your number is ready</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2, marginBottom: 14 }}>+1 555 019 8834</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 10 }}>
                <PlatformIcon domain="whatsapp.com" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>WhatsApp</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>United States</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>● Live</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>Delivered in 4 seconds</div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 32, marginTop: 56, paddingTop: 32, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {[['150+','Platforms'],['10+','Countries'],['<5s','Delivery'],['24/7','Live support']].map(([n,l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{n}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PLATFORM MARQUEE */}
      <div style={{ padding: '32px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="marquee-track" style={{ display: 'flex', gap: 16, width: 'max-content' }}>
          {[...PLATFORM_DOMAINS, ...PLATFORM_DOMAINS].map((d, i) => (
            <PlatformIcon key={`${d}-${i}`} domain={d} />
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: '64px 20px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
        <h2 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 700, letterSpacing: -1, marginBottom: 40, maxWidth: 500 }}>Three steps, no back-and-forth with anyone.</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 28 }}>
          {steps.map(s => (
            <div key={s.n} style={{ position: 'relative' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 52, fontWeight: 800, color: 'var(--border2)', lineHeight: 1, marginBottom: 8 }}>{s.n}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE BLOCKS — asymmetric, not a symmetric icon grid */}
      <div style={{ padding: '20px 20px 64px', maxWidth: 1000, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px 24px' }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>🔒</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--accent)' }}>Your real number stays yours</div>
            <div style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.7 }}>Every virtual number is single-use and disposable. Nothing here ever touches your actual phone or identity.</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px 24px' }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>💛</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--accent)' }}>One wallet, everything</div>
            <div style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.7 }}>Fund it once by transfer. Spend it on numbers, logs, or boosts — no separate checkout each time.</div>
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#161208,#0F0E12)', border: '1px solid var(--accent-a20)', borderRadius: 18, padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 32 }}>💬</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Stuck? Ask, don't wait.</div>
            <div style={{ fontSize: 14, color: 'var(--muted2)', lineHeight: 1.7 }}>Customer service is built into your dashboard — answers on the spot, a real person if it's something only they can fix.</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1 }}>
            JX<span style={{ opacity: 0.65 }}>LOGS</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 1 }}>
            &copy; 2026 44TH-STUDIO INC. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </div>
  );
}
