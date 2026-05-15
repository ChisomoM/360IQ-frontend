// logos-v4.jsx — refining D6 (negative-space page-D) + D7 (slash wordmark)

// ───────── Helpers: D6 variants ─────────

// V6a — original B&W baseline
function PageD_BW({ primary = '#0F172A' }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="8" fill={primary}/>
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff"/>
      <path d="M44 18 L32 18 L44 28 Z" fill="#e5e7eb"/>
    </svg>
  );
}

// V6b — colored container
function PageD_Color({ primary = '#1E3A8A', fold = '#3B82F6' }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="8" fill={primary}/>
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff"/>
      <path d="M44 18 L32 18 L44 28 Z" fill={fold}/>
    </svg>
  );
}

// V6c — gradient container, colored fold
function PageD_Gradient({ id = 'pdg1' }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4F46E5"/>
          <stop offset="1" stopColor="#06B6D4"/>
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="8" fill={`url(#${id})`}/>
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff"/>
      <path d="M44 18 L32 18 L44 28 Z" fill="#A855F7"/>
    </svg>
  );
}

// V6d — inverted: light container, dark D
function PageD_Inverted({ ink = '#0F172A', accent = '#3B82F6' }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="8" fill="#F3F4F6" stroke={ink} strokeWidth="1.5"/>
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill={ink}/>
      <path d="M44 18 L32 18 L44 28 Z" fill={accent}/>
    </svg>
  );
}

// V6e — rule lines inside the D counter (text lines on the page)
function PageD_Lines({ primary = '#0F172A', accent = '#3B82F6' }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="8" fill={primary}/>
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff"/>
      <rect x="24" y="24" width="14" height="1.5" fill={primary} opacity="0.3"/>
      <rect x="24" y="29" width="16" height="1.5" fill={primary} opacity="0.3"/>
      <rect x="24" y="34" width="12" height="1.5" fill={primary} opacity="0.3"/>
      <rect x="24" y="39" width="14" height="1.5" fill={accent}/>
      <path d="M44 18 L32 18 L44 28 Z" fill="#e5e7eb"/>
    </svg>
  );
}

// V6f — deeper fold + shadow, more dimensional page
function PageD_Deep({ primary = '#111827', fold = '#A855F7' }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="10" fill={primary}/>
      <path d="M20 18 L20 46 L30 46 Q 44 46 44 32 Q 44 18 30 18 Z" fill="#fff"/>
      {/* deeper fold triangle + inner shadow */}
      <path d="M44 18 L30 18 L44 32 Z" fill={fold}/>
      <path d="M44 18 L44 32 L30 18" stroke="#fff" strokeWidth="0.8" opacity="0.6"/>
    </svg>
  );
}

// ───────── D7 slash wordmark variants ─────────

// W7a — original
function Slash_Original({ ink = '#0F172A', accent = '#3B82F6' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em',
      color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <span style={{ display: 'inline-block', width: 18, height: 56, background: accent, transform: 'skewX(-20deg)', margin: '0 4px' }}/>
      <span>MS</span>
    </div>
  );
}

// W7b — slash as an explicit page (with fold corner)
function Slash_Page({ ink = '#0F172A', accent = '#3B82F6', fold = '#60A5FA' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em',
      color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <svg width="40" height="56" viewBox="-8 0 40 56" style={{ margin: '0 6px', overflow: 'visible' }}>
        <g transform="skewX(-20)">
          <path d="M0 0 L14 0 L20 8 L20 56 L0 56 Z" fill={ink}/>
          <path d="M14 0 L14 8 L20 8 Z" fill={fold}/>
          <rect x="4" y="22" width="12" height="3" fill={accent}/>
        </g>
      </svg>
      <span>MS</span>
    </div>
  );
}

// W7c — thinner slash, monochrome, elegant
function Slash_Thin({ ink = '#0F172A' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 2,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 600, letterSpacing: '-0.04em',
      color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <span style={{ display: 'inline-block', width: 10, height: 58, background: ink, transform: 'skewX(-18deg)', margin: '0 6px' }}/>
      <span>MS</span>
    </div>
  );
}

// W7d — two-tone split slash
function Slash_TwoTone({ ink = '#0F172A', c1 = '#3B82F6', c2 = '#A855F7' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em',
      color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <span style={{ display: 'inline-flex', flexDirection: 'column', width: 18, height: 56, margin: '0 4px', transform: 'skewX(-20deg)' }}>
        <span style={{ background: c1, flex: 1 }}/>
        <span style={{ background: c2, flex: 1 }}/>
      </span>
      <span>MS</span>
    </div>
  );
}

// W7e — slash is a full gradient page w/ spine rule
function Slash_Gradient({ ink = '#0F172A' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em',
      color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <span style={{
        display: 'inline-block', width: 20, height: 56,
        background: 'linear-gradient(180deg, #6366F1 0%, #A855F7 50%, #06B6D4 100%)',
        transform: 'skewX(-20deg)', margin: '0 5px',
      }}/>
      <span>MS</span>
    </div>
  );
}

// ───────── MERGE: D6 mark + D7 slash wordmark lockups ─────────

// M1 — Solid page-D mark + slash wordmark. Blue system.
function Merge_Blue() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <PageD_Color primary="#1E3A8A" fold="#3B82F6"/>
      <Slash_Original ink="#0F172A" accent="#3B82F6"/>
    </div>
  );
}

// M2 — Gradient mark + two-tone slash
function Merge_Gradient() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <PageD_Gradient id="merge-grad"/>
      <Slash_TwoTone ink="#0F172A" c1="#4F46E5" c2="#06B6D4"/>
    </div>
  );
}

// M3 — Deep purple fold + matching slash
function Merge_Purple() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <PageD_Deep primary="#111827" fold="#A855F7"/>
      <Slash_Original ink="#0F172A" accent="#A855F7"/>
    </div>
  );
}

// M4 — Monochrome sophistication
function Merge_Mono() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <PageD_BW primary="#0F172A"/>
      <Slash_Thin ink="#0F172A"/>
    </div>
  );
}

// M5 — REVERSE: shared-DNA mark + wordmark where the slash
// literally uses the same folded-page silhouette.
function Merge_Unified({ ink = '#0F172A', accent = '#3B82F6', fold = '#60A5FA' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
        <rect x="6" y="6" width="52" height="52" rx="8" fill={ink}/>
        <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff"/>
        <path d="M44 18 L32 18 L44 28 Z" fill={accent}/>
      </svg>
      <Slash_Page ink={ink} accent={accent} fold={fold}/>
    </div>
  );
}

// M6 — INTEGRATED: the mark IS the D of the wordmark.
// Page-D square sits inline with "IMS", slash replaces the I.
function Merge_Integrated({ ink = '#0F172A', accent = '#3B82F6' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em',
      color: ink, lineHeight: 1,
    }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="2" y="2" width="60" height="60" rx="10" fill={ink}/>
        <path d="M18 14 L18 50 L32 50 Q 46 50 46 32 Q 46 14 32 14 Z" fill="#fff"/>
        <path d="M46 14 L32 14 L46 26 Z" fill={accent}/>
      </svg>
      <span style={{ display: 'inline-block', width: 14, height: 48, background: accent, transform: 'skewX(-20deg)', margin: '0 6px 4px' }}/>
      <span>MS</span>
    </div>
  );
}

Object.assign(window, {
  PageD_BW, PageD_Color, PageD_Gradient, PageD_Inverted, PageD_Lines, PageD_Deep,
  Slash_Original, Slash_Page, Slash_Thin, Slash_TwoTone, Slash_Gradient,
  Merge_Blue, Merge_Gradient, Merge_Purple, Merge_Mono, Merge_Unified, Merge_Integrated,
});
