import React from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
};

// ─── Pannable/zoomable canvas ─────────────────────────────────────────────────
function DesignCanvas({ children }: { children: React.ReactNode }) {
  const vpRef = React.useRef<HTMLDivElement>(null);
  const worldRef = React.useRef<HTMLDivElement>(null);
  const tf = React.useRef({ x: 0, y: 0, scale: 1 });

  const apply = React.useCallback(() => {
    const { x, y, scale } = tf.current;
    if (worldRef.current) {
      worldRef.current.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
    }
  }, []);

  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;

    const MIN = 0.1, MAX = 8;
    const zoomAt = (cx: number, cy: number, factor: number) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left, py = cy - r.top;
      const t = tf.current;
      const next = Math.min(MAX, Math.max(MIN, t.scale * factor));
      const k = next / t.scale;
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
    };

    const isMouseWheel = (e: WheelEvent) =>
      e.deltaMode !== 0 || (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40);

    let isGesturing = false;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isGesturing) return;
      if (e.ctrlKey) {
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    let drag: { id: number; lx: number; ly: number } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      const onBg = e.target === vp || e.target === worldRef.current;
      if (!(e.button === 1 || (e.button === 0 && onBg))) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX; drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply]);

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;

  return (
    <div ref={vpRef} style={{
      height: '100vh', width: '100vw',
      background: DC.bg, overflow: 'hidden',
      overscrollBehavior: 'none', touchAction: 'none',
      position: 'relative', fontFamily: DC.font, boxSizing: 'border-box',
    }}>
      <div ref={worldRef} style={{
        position: 'absolute', top: 0, left: 0,
        transformOrigin: '0 0', willChange: 'transform',
        width: 'max-content', minWidth: '100%', minHeight: '100%',
        padding: '60px 0 80px',
        backgroundImage: gridSvg, backgroundSize: '120px 120px',
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── Section layout ───────────────────────────────────────────────────────────
function DCSection({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 80, position: 'relative' }}>
      <div style={{ padding: '0 60px 36px' }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: DC.title, letterSpacing: -0.3, marginBottom: 4 }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: 14, color: DC.subtitle }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', gap: 48, padding: '0 60px', alignItems: 'flex-start', width: 'max-content' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Artboard card ────────────────────────────────────────────────────────────
function DCArtboard({ label, children, width = 420, height = 300, bg = '#ffffff' }: {
  label: string; children: React.ReactNode; width?: number; height?: number; bg?: string;
}) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', bottom: '100%', left: 0, paddingBottom: 8,
        fontSize: 12, fontWeight: 500, color: DC.label, whiteSpace: 'nowrap',
      }}>{label}</div>
      <div style={{
        borderRadius: 2, overflow: 'hidden', width, height, background: bg,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, padding: 24, boxSizing: 'border-box',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Post-it ──────────────────────────────────────────────────────────────────
function DCPostIt({ children, top, left, rotate = -2, width = 220 }: {
  children: React.ReactNode; top?: number; left?: number; rotate?: number; width?: number;
}) {
  return (
    <div style={{
      position: 'absolute', top, left, width,
      background: DC.postitBg, padding: '14px 16px',
      fontFamily: '"Comic Sans MS","Marker Felt","Segoe Print",cursive',
      fontSize: 14, lineHeight: 1.4, color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      transform: `rotate(${rotate}deg)`, zIndex: 5,
    }}>{children}</div>
  );
}

// ─── Lane 1: Page-D mark variants ────────────────────────────────────────────

function PageD_BW({ primary = '#0F172A' }: { primary?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="8" fill={primary} />
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff" />
      <path d="M44 18 L32 18 L44 28 Z" fill="#e5e7eb" />
    </svg>
  );
}

function PageD_Color({ primary = '#1E3A8A', fold = '#3B82F6' }: { primary?: string; fold?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="8" fill={primary} />
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff" />
      <path d="M44 18 L32 18 L44 28 Z" fill={fold} />
    </svg>
  );
}

function PageD_Gradient() {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="pdg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#pdg1)" />
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff" />
      <path d="M44 18 L32 18 L44 28 Z" fill="#A855F7" />
    </svg>
  );
}

function PageD_Inverted({ ink = '#0F172A', accent = '#3B82F6' }: { ink?: string; accent?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="8" fill="#F3F4F6" stroke={ink} strokeWidth="1.5" />
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill={ink} />
      <path d="M44 18 L32 18 L44 28 Z" fill={accent} />
    </svg>
  );
}

function PageD_Lines({ primary = '#0F172A', accent = '#3B82F6' }: { primary?: string; accent?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="8" fill={primary} />
      <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff" />
      <rect x="24" y="24" width="14" height="1.5" fill={primary} opacity="0.3" />
      <rect x="24" y="29" width="16" height="1.5" fill={primary} opacity="0.3" />
      <rect x="24" y="34" width="12" height="1.5" fill={primary} opacity="0.3" />
      <rect x="24" y="39" width="14" height="1.5" fill={accent} />
      <path d="M44 18 L32 18 L44 28 Z" fill="#e5e7eb" />
    </svg>
  );
}

function PageD_Deep({ primary = '#111827', fold = '#A855F7' }: { primary?: string; fold?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
      <rect x="6" y="6" width="52" height="52" rx="10" fill={primary} />
      <path d="M20 18 L20 46 L30 46 Q 44 46 44 32 Q 44 18 30 18 Z" fill="#fff" />
      <path d="M44 18 L30 18 L44 32 Z" fill={fold} />
      <path d="M44 18 L44 32 L30 18" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

// ─── Lane 2: Slash wordmark variants ─────────────────────────────────────────

function Slash_Original({ ink = '#0F172A', accent = '#3B82F6' }: { ink?: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em', color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <span style={{ display: 'inline-block', width: 18, height: 56, background: accent, transform: 'skewX(-20deg)', margin: '0 4px' }} />
      <span>MS</span>
    </div>
  );
}

function Slash_Page({ ink = '#0F172A', accent = '#3B82F6', fold = '#60A5FA' }: { ink?: string; accent?: string; fold?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em', color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <svg width="40" height="56" viewBox="-8 0 40 56" style={{ margin: '0 6px', overflow: 'visible' }}>
        <g transform="skewX(-20)">
          <path d="M0 0 L14 0 L20 8 L20 56 L0 56 Z" fill={ink} />
          <path d="M14 0 L14 8 L20 8 Z" fill={fold} />
          <rect x="4" y="22" width="12" height="3" fill={accent} />
        </g>
      </svg>
      <span>MS</span>
    </div>
  );
}

function Slash_Thin({ ink = '#0F172A' }: { ink?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 2,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 600, letterSpacing: '-0.04em', color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <span style={{ display: 'inline-block', width: 10, height: 58, background: ink, transform: 'skewX(-18deg)', margin: '0 6px' }} />
      <span>MS</span>
    </div>
  );
}

function Slash_TwoTone({ ink = '#0F172A', c1 = '#3B82F6', c2 = '#A855F7' }: { ink?: string; c1?: string; c2?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em', color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <span style={{ display: 'inline-flex', flexDirection: 'column', width: 18, height: 56, margin: '0 4px', transform: 'skewX(-20deg)' }}>
        <span style={{ background: c1, flex: 1 }} />
        <span style={{ background: c2, flex: 1 }} />
      </span>
      <span>MS</span>
    </div>
  );
}

function Slash_Gradient({ ink = '#0F172A' }: { ink?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em', color: ink, lineHeight: 1,
    }}>
      <span>D</span>
      <span style={{
        display: 'inline-block', width: 20, height: 56,
        background: 'linear-gradient(180deg,#6366F1 0%,#A855F7 50%,#06B6D4 100%)',
        transform: 'skewX(-20deg)', margin: '0 5px',
      }} />
      <span>MS</span>
    </div>
  );
}

// ─── Lane 3: Combined lockups ─────────────────────────────────────────────────

function Merge_Blue() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <PageD_Color primary="#1E3A8A" fold="#3B82F6" />
      <Slash_Original ink="#0F172A" accent="#3B82F6" />
    </div>
  );
}

function Merge_Gradient() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="merge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4F46E5" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#merge-grad)" />
        <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff" />
        <path d="M44 18 L32 18 L44 28 Z" fill="#A855F7" />
      </svg>
      <Slash_TwoTone ink="#0F172A" c1="#4F46E5" c2="#06B6D4" />
    </div>
  );
}

function Merge_Purple() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <PageD_Deep primary="#111827" fold="#A855F7" />
      <Slash_Original ink="#0F172A" accent="#A855F7" />
    </div>
  );
}

function Merge_Mono() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <PageD_BW primary="#0F172A" />
      <Slash_Thin ink="#0F172A" />
    </div>
  );
}

function Merge_Unified({ ink = '#0F172A', accent = '#3B82F6', fold = '#60A5FA' }: { ink?: string; accent?: string; fold?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
        <rect x="6" y="6" width="52" height="52" rx="8" fill={ink} />
        <path d="M20 18 L20 46 L32 46 Q 44 46 44 32 Q 44 18 32 18 Z" fill="#fff" />
        <path d="M44 18 L32 18 L44 28 Z" fill={accent} />
      </svg>
      <Slash_Page ink={ink} accent={accent} fold={fold} />
    </div>
  );
}

function Merge_Integrated({ ink = '#0F172A', accent = '#3B82F6' }: { ink?: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontFamily: 'Geist, Inter, system-ui, sans-serif',
      fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em', color: ink, lineHeight: 1,
    }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="2" y="2" width="60" height="60" rx="10" fill={ink} />
        <path d="M18 14 L18 50 L32 50 Q 46 50 46 32 Q 46 14 32 14 Z" fill="#fff" />
        <path d="M46 14 L32 14 L46 26 Z" fill={accent} />
      </svg>
      <span style={{ display: 'inline-block', width: 14, height: 48, background: accent, transform: 'skewX(-20deg)', margin: '0 6px 4px' }} />
      <span>MS</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LogoExploration() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <DesignCanvas>
        {/* Header */}
        <div style={{ padding: '20px 60px 40px', maxWidth: 980 }}>
          <div style={{
            fontFamily: 'ui-monospace,"SF Mono",Menlo,monospace',
            fontSize: 11, letterSpacing: '0.24em', color: '#8B7F6E',
            textTransform: 'uppercase', marginBottom: 14,
          }}>Logo Exploration · v4 · Apr 2026</div>
          <div style={{ fontSize: 44, fontWeight: 600, color: '#2B2014', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 16 }}>
            D6 + D7, pushed
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: '#5A4A2A', maxWidth: 780 }}>
            Locking in your two favorites and exploring them properly. <b>Lane 1</b> — the negative-space
            page-D with color/material variations. <b>Lane 2</b> — the slash wordmark with different
            weights and treatments. <b>Lane 3</b> — combining them into unified lockups.
          </div>
        </div>

        {/* Lane 1 — Page-D variants */}
        <DCSection title="Page-D · color & material" subtitle="Same silhouette, different palettes">
          <DCArtboard label="1a · Baseline (B&W)" width={420} height={300}>
            <PageD_BW />
          </DCArtboard>
          <DCArtboard label="1b · Deep blue + sky fold" width={420} height={300}>
            <PageD_Color primary="#1E3A8A" fold="#3B82F6" />
          </DCArtboard>
          <DCArtboard label="1c · Indigo→cyan gradient" width={420} height={300}>
            <PageD_Gradient />
          </DCArtboard>
          <DCArtboard label="1d · Inverted (light bg)" width={420} height={300}>
            <PageD_Inverted />
          </DCArtboard>
          <DCArtboard label="1e · Text rules in counter" width={420} height={300}>
            <PageD_Lines />
          </DCArtboard>
          <DCArtboard label="1f · Deeper fold, purple" width={420} height={300}>
            <PageD_Deep />
          </DCArtboard>
        </DCSection>

        {/* Lane 2 — Slash wordmark variants */}
        <DCSection title="Slash wordmark · variations" subtitle="The I as a leaning page">
          <DCArtboard label="2a · Original" width={520} height={300}>
            <Slash_Original />
          </DCArtboard>
          <DCArtboard label="2b · Slash = full page w/ fold" width={520} height={300}>
            <Slash_Page />
          </DCArtboard>
          <DCArtboard label="2c · Thin, monochrome" width={520} height={300}>
            <Slash_Thin />
          </DCArtboard>
          <DCArtboard label="2d · Two-tone split" width={520} height={300}>
            <Slash_TwoTone />
          </DCArtboard>
          <DCArtboard label="2e · Full gradient" width={520} height={300}>
            <Slash_Gradient />
          </DCArtboard>
        </DCSection>

        {/* Lane 3 — Merged lockups */}
        <DCSection title="Merged lockups" subtitle="Mark + wordmark together">
          <DCArtboard label="3a · Blue system" width={560} height={300}>
            <Merge_Blue />
          </DCArtboard>
          <DCArtboard label="3b · Gradient + two-tone" width={560} height={300}>
            <Merge_Gradient />
          </DCArtboard>
          <DCArtboard label="3c · Deep purple fold ★ selected" width={560} height={300} bg="#fafafa">
            <div style={{ position: 'relative' }}>
              <Merge_Purple />
              <div style={{
                position: 'absolute', top: -28, right: -8,
                background: '#A855F7', color: '#fff',
                fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase',
              }}>Selected</div>
            </div>
          </DCArtboard>
          <DCArtboard label="3d · Monochrome" width={560} height={300}>
            <Merge_Mono />
          </DCArtboard>
          <DCArtboard label="3e · Unified DNA" width={560} height={300}>
            <Merge_Unified />
          </DCArtboard>
          <DCArtboard label="3f · Integrated (mark = the D)" width={560} height={300}>
            <Merge_Integrated />
          </DCArtboard>
        </DCSection>

        <div style={{ padding: '0 60px 40px', maxWidth: 900, position: 'relative' }}>
          <DCPostIt top={-8} left={0} rotate={-1.5} width={260}>
            Final pick: <b>3c — Deep Purple Fold</b>. Dark ink container, purple fold, slash wordmark with purple accent.
          </DCPostIt>
        </div>
        <div style={{ height: 160 }} />
      </DesignCanvas>
    </>
  );
}
