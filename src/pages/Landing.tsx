interface LandingProps { onLogin: () => void; onSignup: () => void; }

export default function Landing({ onLogin, onSignup }: LandingProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 24px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(245,197,24,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'var(--accent-dim)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: 100, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent)', marginBottom: 28, letterSpacing: 1 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          LIVE · 24+ SERVICES · 10+ COUNTRIES
        </div>

        <h1 style={{ fontSize: 'clamp(34px,8vw,70px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, marginBottom: 16, maxWidth: 700 }}>
          Virtual Numbers.<br />
          <span style={{ color: 'var(--accent)' }}>Instant Delivery.</span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--muted2)', maxWidth: 420, lineHeight: 1.7, marginBottom: 36 }}>
          Buy virtual phone numbers for SMS verification on any platform. Private, fast, delivered to your dashboard.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onSignup} style={{ fontSize: 15, padding: '13px 28px' }}>Get Started — Free</button>
          <button className="btn btn-ghost" onClick={onLogin} style={{ fontSize: 15 }}>Sign in →</button>
        </div>

        <div style={{ display: 'flex', gap: 32, marginTop: 60, paddingTop: 40, borderTop: '1px solid var(--border)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['24+','Services'],['10+','Countries'],['<5s','Delivery'],['24/7','Support']].map(([n,l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{n}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '48px 20px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          {[
            ['⚡','Instant','Number hits your dashboard seconds after purchase.'],
            ['🔒','Private','Your real number stays completely hidden.'],
            ['🌍','Global','10+ countries, 24+ platforms covered.'],
            ['💛','Simple','Fund wallet once, buy numbers anytime.'],
          ].map(([icon,title,desc]) => (
            <div key={String(title)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--accent)' }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '24px 16px 40px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 1, borderTop: '1px solid var(--border)', marginTop: 0 }}>
        &copy; 2026 44TH-STUDIO INC. ALL RIGHTS RESERVED.
      </div>
    </div>
  );
}
