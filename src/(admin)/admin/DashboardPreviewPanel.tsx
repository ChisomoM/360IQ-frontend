/**
 * DashboardPreviewPanel — pure static UI, zero hooks/routing/auth.
 * Renders a scaled-down faithful replica of the dashboard as the left panel
 * of the login split-screen layout.
 */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, FileText, BarChart2, Users, Settings,
  Clock, AlertTriangle, Plus,
} from "lucide-react";
import { BOSS_MINI, BOSS_THROUGHPUT, SHARED_ACTIVITY } from "./mockData";

const CH_P = "#7C69FF";
const CH_S = "#03D8FD";
const CH_T = "#0D173B";
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true  },
  { label: "Documents",  icon: FileText,        active: false },
  { label: "Analytics",  icon: BarChart2,        active: false },
  { label: "Users",      icon: Users,            active: false },
  { label: "Settings",   icon: Settings,         active: false },
];

const STATS = [
  { label: "Total Org Docs",  value: "186", trend: "+8%", up: true,  icon: FileText,      color: CH_P,      data: BOSS_MINI.docs,    type: "bar"  as const },
  { label: "Pending Actions", value: "24",  trend: "+5%", up: true,  icon: Clock,         color: CH_S,      data: BOSS_MINI.pending, type: "bar"  as const },
  { label: "Overdue",         value: "7",   trend: "−2",  up: false, icon: AlertTriangle, color: "#F59E0B", data: BOSS_MINI.overdue, type: "line" as const },
];

const THROUGHPUT_COLORS = ["#EF4444", CH_P, "#10B981", "#10B981", "#10B981"];

function DotGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="lgn-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lgn-dots)" />
    </svg>
  );
}

function GlowOrbs() {
  return (
    <>
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${CH_P}35 0%, transparent 70%)` }} />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${CH_S}25 0%, transparent 70%)` }} />
    </>
  );
}

function DashboardMockup() {
  return (
    <div style={{ display: "flex", width: "1060px", backgroundColor: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "200px", minHeight: "700px", backgroundColor: CH_T, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: `linear-gradient(135deg, ${CH_P}, ${CH_S})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={14} color="white" />
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "16px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.01em" }}>DIMS</span>
        </div>
        <nav style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", backgroundColor: active ? `${CH_S}18` : "transparent", borderLeft: active ? `2px solid ${CH_S}` : "2px solid transparent", cursor: "default" }}>
              <Icon size={14} style={{ color: active ? CH_S : "rgba(255,255,255,0.35)", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: active ? 600 : 400, color: active ? "white" : "rgba(255,255,255,0.38)" }}>{label}</span>
            </div>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: CH_P, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>CM</div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "white" }}>Chisomo M.</div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.38)", marginTop: "1px" }}>System Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, padding: "24px", backgroundColor: "white", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>Dashboard</h1>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Sunday, 20 April 2026</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "10px", backgroundColor: CH_P, color: "white", fontSize: "11px", fontWeight: 600, border: "none", cursor: "default" }}>
              <Plus size={11} color="white" />
              Upload Document
            </button>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: CH_P, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: 700 }}>CM</div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "14px" }}>
          {STATS.map(({ label, value, trend, up, icon: Icon, color, data, type }) => (
            <div key={label} style={{ backgroundColor: "#fafafa", borderRadius: "14px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <p style={{ fontSize: "9px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</span>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: up ? "#10b981" : "#f59e0b" }}>{up ? "↑" : "↓"} {trend}</span>
                </div>
              </div>
              <div style={{ width: "72px", height: "48px", flexShrink: 0 }}>
                {type === "bar" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={6}><XAxis hide dataKey="m" /><Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}><XAxis hide dataKey="m" /><Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} /></LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Activity */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
          <div style={{ backgroundColor: "#fafafa", borderRadius: "14px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", fontFamily: "'Outfit', sans-serif" }}>Throughput by Department</p>
              <span style={{ fontSize: "10px", color: "#94a3b8", background: "#f1f5f9", padding: "2px 10px", borderRadius: "100px" }}>avg days</span>
            </div>
            <ResponsiveContainer width="100%" height={156}>
              <BarChart data={BOSS_THROUGHPUT} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} barSize={9}>
                <XAxis type="number" hide domain={[0, 9]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} axisLine={false} tickLine={false} width={82} />
                <ReferenceLine x={5} stroke="rgba(148,163,184,0.5)" strokeDasharray="4 4" />
                <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                  {BOSS_THROUGHPUT.map((_, i) => <Cell key={i} fill={THROUGHPUT_COLORS[i] ?? CH_P} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ backgroundColor: "#fafafa", borderRadius: "14px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", padding: "16px", overflow: "hidden" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>Recent Activity</p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {SHARED_ACTIVITY.slice(0, 3).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 0", borderBottom: i < 2 ? "1px solid #f8fafc" : "none" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: i % 2 === 0 ? CH_P : CH_S, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "8px", fontWeight: 700, flexShrink: 0 }}>{item.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "10px", color: "#334155", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><strong>{item.name}</strong> {item.action}</p>
                    <p style={{ fontSize: "9px", color: "#94a3b8", marginTop: "1px" }}>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SVG donut helper ─────────────────────────────────────────────────────────
function DonutChart({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 20;
  const cx = 26;
  const cy = 26;
  const circ = 2 * Math.PI * r;
  const filled = circ * pct;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="#0f172a" fontSize="10" fontWeight="700" fontFamily="'Outfit', sans-serif">{label}</text>
    </svg>
  );
}

// ── Benefit card ──────────────────────────────────────────────────────────────
interface BenefitCardProps {
  title: string;
  subtitle: string;
  pct: number;
  label: string;
  color: string;
  delay: number;
}
function BenefitCard({ title, subtitle, pct, label, color, delay }: BenefitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={[
        { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay } },
      ]}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "12px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      <DonutChart pct={pct} color={color} label={label} />
      <div>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", lineHeight: 1.25, fontFamily: "'Outfit', sans-serif" }}>{title}</p>
        <p style={{ fontSize: "10px", color: "#64748b", marginTop: "3px", lineHeight: 1.3 }}>{subtitle}</p>
      </div>
    </motion.div>
  );
}

// ── Cycling tagline carousel ──────────────────────────────────────────────────
// ── AI highlight card (portrait, no donut) ───────────────────────────────────
function AICard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={[{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay } }]}
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "16px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
        width: "160px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Icon badge */}
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #A855F7 0%, #7C69FF 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px",
        flexShrink: 0,
      }}>
        ✦
      </div>
      {/* Text */}
      <div>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", lineHeight: 1.25, fontFamily: "'Outfit', sans-serif", marginBottom: "4px" }}>
          AI Powered
        </p>
        <p style={{ fontSize: "10px", color: "#64748b", lineHeight: 1.4 }}>
          Smart extraction & auto-classification
        </p>
      </div>
      {/* Decorative shimmer bar */}
      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
        {[1, 0.6, 0.85, 0.45, 0.7, 0.95, 0.5].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${8 + h * 10}px`,
              borderRadius: "3px",
              background: `linear-gradient(to top, #A855F7${Math.round(h * 180).toString(16).padStart(2, "0")}, #7C69FF${Math.round(h * 220).toString(16).padStart(2, "0")})`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}


const SLIDES = [
  {
    heading: ["Stay Organised.", "Work Smarter."],
    sub: "Streamline document workflows, automate approvals, and get real-time insights — all from one platform.",
    accentColor: CH_P,
    features: [
      { label: "Smart Workflows", color: CH_P },
      { label: "Automated Approvals", color: CH_P },
      { label: "Real-time Insights", color: CH_P },
    ],
  },
  {
    heading: ["Your Documents.", "Under Control."],
    sub: "Centralise every contract, policy, and report with role-based access and full version history.",
    accentColor: CH_S,
    features: [
      { label: "Version Control", color: CH_S },
      { label: "Role-based Access", color: CH_S },
      { label: "Secure Storage", color: CH_S },
    ],
  },
  {
    heading: ["AI-Powered.", "Always Ahead."],
    sub: "Surface risks, extract insights, and auto-classify documents with built-in intelligence — no extra tools needed.",
    accentColor: "#A855F7",
    features: [
      { label: "Smart Classification", color: "#A855F7" },
      { label: "Risk Surfacing", color: "#A855F7" },
      { label: "Predictive Analytics", color: "#A855F7" },
    ],
  },
] as const;

function TaglineCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[active];

  return (
    <div className="relative z-10 px-10 pb-10" style={{ minHeight: "180px" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.42, ease: EASE }}
        >
          <h2 className="font-display font-bold text-3xl text-white leading-tight mb-3">
            {slide.heading[0]}{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${slide.accentColor}, ${CH_S})` }}
            >
              {slide.heading[1]}
            </span>
          </h2>
          <p className="font-sans text-base leading-relaxed max-w-sm mb-5" style={{ color: "rgba(255,255,255,0.75)" }}>
            {slide.sub}
          </p>
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {slide.features.map(({ label, color }) => (
              <span
                key={label}
                className="font-sans text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  background: `${color}18`,
                  border: `1px solid ${color}44`,
                  color,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? "20px" : "6px",
              height: "6px",
              backgroundColor: i === active ? slide.accentColor : "rgba(255,255,255,0.22)",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardPreviewPanel() {
  return (
    <div className="hidden lg:flex flex-col w-1/2 min-h-screen relative overflow-hidden select-none" style={{ backgroundColor: CH_T }}>
      <DotGrid />
      <GlowOrbs />

      {/* Brand mark */}
      <motion.div
        className="relative z-10 flex items-center px-10 pt-10"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <img src="/logos/dims-logo-dark.svg" alt="DIMS" style={{ height: "34px", width: "auto" }} />
      </motion.div>

      {/* Dashboard mockup — flex-1 area with overlaid benefit cards */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-8 pt-5 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: EASE, delay: 0.1 }}
          style={{ position: "relative", filter: "drop-shadow(0 24px 64px rgba(0,0,0,0.55))", width: "100%" }}
        >
          {/* Clipped scaled dashboard */}
          <div style={{ width: "100%", height: "320px", overflow: "hidden", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ transform: "scale(0.538)", transformOrigin: "top left", width: "1060px" }}>
              <DashboardMockup />
            </div>
          </div>

          {/* Bottom gradient fade to blend with panel */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100px", background: `linear-gradient(to top, ${CH_T} 0%, transparent 100%)`, borderRadius: "0 0 14px 14px", pointerEvents: "none" }} />

          {/* ── Floating benefit card — top-left ────────────────────────── */}
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.8, ease: "easeInOut", repeat: Infinity, delay: 0 }}
            style={{ position: "absolute", top: "-18px", left: "-18px", width: "210px", zIndex: 10 }}
          >
            <BenefitCard
              title="Institutional Efficiency"
              subtitle="Average improvement org-wide"
              pct={0.87}
              label="87%"
              color={CH_P}
              delay={0.35}
            />
          </motion.div>

          {/* ── Floating benefit card — bottom-right ────────────────────── */}
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4.2, ease: "easeInOut", repeat: Infinity, delay: 0.9 }}
            style={{ position: "absolute", bottom: "60px", right: "-18px", width: "210px", zIndex: 10 }}
          >
            <BenefitCard
              title="SLA Compliance Rate"
              subtitle="Documents processed on time"
              pct={0.94}
              label="94%"
              color={CH_S}
              delay={0.5}
            />
          </motion.div>

          {/* ── Floating benefit card — bottom-left ─────────────────────── */}
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity, delay: 1.6 }}
            style={{ position: "absolute", bottom: "-14px", left: "30px", zIndex: 10 }}
          >
            <AICard delay={0.6} />
          </motion.div>
        </motion.div>
      </div>

      {/* Cycling tagline */}
      <TaglineCarousel />
    </div>
  );
}
