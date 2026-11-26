// ── Types ─────────────────────────────────────────────────────────────────────
export type RoleType   = 'boss' | 'dept' | 'admin';
export type UrgencyType = 'Urgent' | 'Due Today' | 'Pending';
export type DocStatus  = 'approved' | 'pending' | 'rejected' | 'draft';

// ── Color utility — hex → tonal HSL palette ───────────────────────────────────
// Used by OrgVolumeTrend to generate per-dept tonal shades from the tenant primary.
export function hexToHSLTones(hex: string, count: number): string[] {
  const c = hex.startsWith('#') ? hex.slice(1) : hex;
  if (c.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(c)) {
    return Array.from({ length: count }, (_, i) => {
      const l = Math.round(30 + (i * 44) / Math.max(1, count - 1));
      return `hsl(252, 80%, ${l}%)`;
    });
  }
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  return Array.from({ length: count }, (_, i) => {
    const lPct = count === 1 ? 48 : Math.round(30 + (i * 44) / (count - 1));
    return `hsl(${hDeg}, ${sPct}%, ${lPct}%)`;
  });
}

// ── Shared — Activity Panel ───────────────────────────────────────────────────
export const SHARED_PENDING: {
  doc: string; action: string; urgency: UrgencyType; iconKey: 'file' | 'check' | 'alert';
}[] = [
  { doc: 'Q4 Budget Proposal',           action: 'Awaiting your signature', urgency: 'Urgent',    iconKey: 'file'  },
  { doc: 'Vendor Agreement, TechCorp',  action: 'Approval needed',         urgency: 'Due Today', iconKey: 'check' },
  { doc: 'Employee Contract, Sarah M.', action: 'Review required',          urgency: 'Urgent',    iconKey: 'alert' },
  { doc: 'IT Asset Requisition',         action: 'Awaiting your signature',  urgency: 'Pending',   iconKey: 'file'  },
];

export const SHARED_ACTIVITY = [
  { initials: 'TM', name: 'Thandeka Moyo',  action: 'uploaded', doc: 'Procurement Policy v2', dept: 'Operations', time: '4 min ago'  },
  { initials: 'JB', name: 'John Banda',     action: 'approved', doc: 'Leave Application',     dept: 'HR',         time: '22 min ago' },
  { initials: 'CM', name: 'Chisomo Mwale',  action: 'signed',   doc: 'Q4 Budget Proposal',    dept: 'Finance',    time: '2 hr ago'   },
  { initials: 'LN', name: 'Lindiwe Nkosi',  action: 'uploaded', doc: 'Vendor NDA',             dept: 'Legal',      time: 'Yesterday'  },
];

// ── Boss / Org Scope data ─────────────────────────────────────────────────────
export const BOSS_STATS: {
  label: string; value: string; trend: string; trendUp: boolean; chartType: 'bar' | 'line';
}[] = [
  { label: 'Total organisation documents', value: '186', trend: '+8%', trendUp: true,  chartType: 'bar'  },
  { label: 'Pending actions',              value: '24',  trend: '+5%', trendUp: true,  chartType: 'bar'  },
  { label: 'Overdue (organisation)',       value: '7',   trend: '−2',  trendUp: false, chartType: 'line' },
];

export const BOSS_MINI = {
  docs:    [{ m: 'Nov', v: 28 }, { m: 'Dec', v: 35 }, { m: 'Jan', v: 42 }, { m: 'Feb', v: 38 }, { m: 'Mar', v: 47 }, { m: 'Apr', v: 51 }],
  pending: [{ m: 'Nov', v: 18 }, { m: 'Dec', v: 22 }, { m: 'Jan', v: 19 }, { m: 'Feb', v: 25 }, { m: 'Mar', v: 21 }, { m: 'Apr', v: 24 }],
  overdue: [{ m: 'Nov', v: 12 }, { m: 'Dec', v: 10 }, { m: 'Jan', v: 9  }, { m: 'Feb', v: 8  }, { m: 'Mar', v: 9  }, { m: 'Apr', v: 7  }],
};

// Sorted slowest (top) → fastest, in avg days
export const BOSS_THROUGHPUT = [
  { name: 'Legal',      days: 6.8 },
  { name: 'Finance',    days: 5.9 },
  { name: 'HR',         days: 4.4 },
  { name: 'Operations', days: 3.8 },
  { name: 'Executive',  days: 2.6 },
];

export const BOSS_SLA = [
  { dept: 'Finance',     pct: 94 },
  { dept: 'Legal',       pct: 68 },
  { dept: 'HR',          pct: 82 },
  { dept: 'Operations',  pct: 91 },
  { dept: 'Executive',   pct: 97 },
  { dept: 'Procurement', pct: 74 },
];

// 90-day multi-dept volume (deterministic via Math.sin for stable renders)
export type OrgVolumeRow = {
  d: string; Finance: number; Legal: number; HR: number; Operations: number; Executive: number;
};
export const BOSS_ORG_VOLUME: OrgVolumeRow[] = Array.from({ length: 90 }, (_, i) => ({
  d:          String(i + 1),
  Finance:    Math.max(1, Math.round(8 + Math.sin(i * 0.70) * 3 + Math.cos(i * 1.1) * 1)),
  Legal:      Math.max(1, Math.round(6 + Math.sin(i * 0.80 + 1) * 2 + Math.cos(i * 0.5) * 1)),
  HR:         Math.max(1, Math.round(5 + Math.sin(i * 0.60 + 2) * 2)),
  Operations: Math.max(1, Math.round(4 + Math.sin(i * 0.90 + 3) * 2 + Math.cos(i * 0.7) * 1)),
  Executive:  Math.max(1, Math.round(2 + Math.sin(i * 0.50 + 4) * 1)),
}));

export const BOSS_REJECTIONS = [
  { name: 'Legal',      count: 4 },
  { name: 'Finance',    count: 3 },
  { name: 'Operations', count: 3 },
  { name: 'HR',         count: 1 },
  { name: 'Executive',  count: 1 },
];

// ── Dept Head / Department Scope data ─────────────────────────────────────────
export const DEPT_STATS: {
  label: string; value: string; trend: string; trendUp: boolean; chartType: 'bar' | 'line';
}[] = [
  { label: 'Department documents', value: '48', trend: '+6%', trendUp: true,  chartType: 'bar'  },
  { label: 'Department pending',   value: '9',  trend: '+3%', trendUp: true,  chartType: 'bar'  },
  { label: 'Department overdue',   value: '3',  trend: '−1',  trendUp: false, chartType: 'line' },
];

export const DEPT_MINI = {
  docs:    [{ m: 'Nov', v: 8  }, { m: 'Dec', v: 10 }, { m: 'Jan', v: 11 }, { m: 'Feb', v: 9  }, { m: 'Mar', v: 12 }, { m: 'Apr', v: 13 }],
  pending: [{ m: 'Nov', v: 6  }, { m: 'Dec', v: 8  }, { m: 'Jan', v: 7  }, { m: 'Feb', v: 9  }, { m: 'Mar', v: 8  }, { m: 'Apr', v: 9  }],
  overdue: [{ m: 'Nov', v: 5  }, { m: 'Dec', v: 4  }, { m: 'Jan', v: 4  }, { m: 'Feb', v: 3  }, { m: 'Mar', v: 4  }, { m: 'Apr', v: 3  }],
};

export const DEPT_STAGES = [
  { stage: 'Created',           count: 48 },
  { stage: 'Under review',         count: 34 },
  { stage: 'Pending approval',     count: 22 },
  { stage: 'Approved or rejected', count: 18 },
];

export const DEPT_TEAM = [
  { name: 'Amara K.',   pct: 93 },
  { name: 'Lethiwe N.', pct: 88 },
  { name: 'Grace M.',   pct: 82 },
  { name: 'Sipho D.',   pct: 71 },
  { name: 'David B.',   pct: 45 },
];

export const DEPT_OVERDUE_DOCS = [
  { doc: 'Procurement Policy v2', daysOverdue: 8, assignee: 'David B.' },
  { doc: 'Q3 Supplier Agreement', daysOverdue: 5, assignee: 'Sipho D.' },
  { doc: 'IT Asset Requisition',  daysOverdue: 2, assignee: 'Grace M.' },
];

// 30-day deterministic dept activity
export const DEPT_VOL_30D = Array.from({ length: 30 }, (_, i) => ({
  d: String(i + 1),
  v: Math.max(1, Math.round(5 + Math.sin(i * 0.7) * 2 + Math.cos(i * 1.2) * 1)),
}));

// ── Regular Admin / Self Scope data ──────────────────────────────────────────
export const ADMIN_STATS: {
  label: string; value: string; trend: string; trendUp: boolean; chartType: 'bar' | 'line';
}[] = [
  { label: 'My documents', value: '22', trend: '+4%', trendUp: true,  chartType: 'bar'  },
  { label: 'My pending',   value: '5',  trend: '+2',  trendUp: true,  chartType: 'bar'  },
  { label: 'My overdue',   value: '1',  trend: '0%',  trendUp: false, chartType: 'line' },
];

export const ADMIN_MINI = {
  docs:    [{ m: 'Nov', v: 3 }, { m: 'Dec', v: 4 }, { m: 'Jan', v: 5 }, { m: 'Feb', v: 4 }, { m: 'Mar', v: 5 }, { m: 'Apr', v: 6 }],
  pending: [{ m: 'Nov', v: 2 }, { m: 'Dec', v: 3 }, { m: 'Jan', v: 3 }, { m: 'Feb', v: 4 }, { m: 'Mar', v: 3 }, { m: 'Apr', v: 5 }],
  overdue: [{ m: 'Nov', v: 2 }, { m: 'Dec', v: 1 }, { m: 'Jan', v: 2 }, { m: 'Feb', v: 1 }, { m: 'Mar', v: 1 }, { m: 'Apr', v: 1 }],
};

// Approved 14, Pending 5, Rejected 2, Draft 1 → total 22 (matches ADMIN_STATS)
export const ADMIN_DOC_STATUS = [
  { name: 'Approved', value: 14 },
  { name: 'Pending',  value: 5  },
  { name: 'Rejected', value: 2  },
  { name: 'Draft',    value: 1  },
];

export const ADMIN_SUBMISSIONS: { doc: string; status: DocStatus; date: string; dept: string }[] = [
  { doc: 'Leave Application, Aug',  status: 'approved', date: 'Apr 9',  dept: 'HR'         },
  { doc: 'Q4 Budget Proposal',       status: 'pending',  date: 'Apr 8',  dept: 'Finance'    },
  { doc: 'Vendor NDA, TechCorp',    status: 'pending',  date: 'Apr 7',  dept: 'Legal'      },
  { doc: 'IT Asset Requisition',     status: 'rejected', date: 'Apr 5',  dept: 'Operations' },
  { doc: 'Office Supplies Request',  status: 'approved', date: 'Apr 3',  dept: 'Operations' },
];

// Weekly totals → sum = 22, matches ADMIN_STATS total
export const ADMIN_WEEKLY = [
  { week: 'Wk 1', v: 4 },
  { week: 'Wk 2', v: 5 },
  { week: 'Wk 3', v: 6 },
  { week: 'Wk 4', v: 7 },
];

export const ADMIN_PENDING: { doc: string; action: string; urgency: UrgencyType }[] = [
  { doc: 'Q4 Budget Proposal',          action: 'Signature required', urgency: 'Urgent'    },
  { doc: 'Vendor Agreement, TechCorp', action: 'Approval needed',    urgency: 'Due Today' },
  { doc: 'IT Asset Requisition',        action: 'Review requested',   urgency: 'Pending'   },
  { doc: 'Employee NDA, Sarah M.',     action: 'Signature required', urgency: 'Pending'   },
];

// ── Boss — Quick Status Summary Table ─────────────────────────────────────────
export const BOSS_DEPT_STATUS_GRID: {
  dept: string; active: number; pending: number; overdue: number; rejected: number;
}[] = [
  { dept: 'Finance',     active: 22, pending: 8,  overdue: 2, rejected: 3 },
  { dept: 'Legal',       active: 18, pending: 6,  overdue: 3, rejected: 4 },
  { dept: 'HR',          active: 31, pending: 4,  overdue: 1, rejected: 1 },
  { dept: 'Operations',  active: 27, pending: 5,  overdue: 1, rejected: 3 },
  { dept: 'Executive',   active: 12, pending: 1,  overdue: 0, rejected: 1 },
  { dept: 'Procurement', active: 19, pending: 6,  overdue: 2, rejected: 2 },
];

// ── Boss — Org-wide Urgent & Overdue breakdown ────────────────────────────────
export const BOSS_OVERDUE_LIST: {
  doc: string; dept: string; daysOverdue: number; assignee: string;
}[] = [
  { doc: 'Q4 Budget Proposal',       dept: 'Finance',    daysOverdue: 9, assignee: 'Chisomo M.'  },
  { doc: 'Vendor SLA Review',        dept: 'Legal',      daysOverdue: 7, assignee: 'Lindiwe N.'  },
  { doc: 'Procurement Policy v2',    dept: 'Operations', daysOverdue: 6, assignee: 'David B.'    },
  { doc: 'IT Asset Requisition',     dept: 'HR',         daysOverdue: 4, assignee: 'Grace M.'    },
  { doc: 'Q3 Supplier Agreement',    dept: 'Legal',      daysOverdue: 3, assignee: 'Sipho D.'    },
];

// ── Boss — Compliance Alerts ──────────────────────────────────────────────────
export type AlertSeverity = 'critical' | 'warning' | 'info';
export const BOSS_COMPLIANCE_ALERTS: {
  title: string; desc: string; severity: AlertSeverity; dept: string;
}[] = [
  { title: 'Expired NDA, TechCorp',       desc: 'Legal · expired 3 days ago',    severity: 'critical', dept: 'Legal'      },
  { title: 'SLA breach, Legal department',      desc: '68% compliance (target ≥ 90%)', severity: 'critical', dept: 'Legal'      },
  { title: 'Missing signatures on 3 docs', desc: 'Finance · pending 8+ days',     severity: 'warning',  dept: 'Finance'    },
  { title: 'Procurement approval overdue', desc: 'Operations · 6 days idle',      severity: 'warning',  dept: 'Operations' },
  { title: 'Policy review due this month', desc: 'HR · annual review cycle',      severity: 'info',     dept: 'HR'         },
];

// ── Dept — Weekly submissions ─────────────────────────────────────────────────
export const DEPT_WEEKLY = [
  { week: 'Wk 1', v: 6  },
  { week: 'Wk 2', v: 9  },
  { week: 'Wk 3', v: 8  },
  { week: 'Wk 4', v: 11 },
];

// ── Dept — Rejected / Returned in dept ───────────────────────────────────────
export const DEPT_REJECTIONS: { doc: string; reason: string; date: string }[] = [
  { doc: 'Q3 Supplier Agreement',   reason: 'Missing signatures',  date: 'Apr 8'  },
  { doc: 'Leave Application, Aug', reason: 'Incomplete form',     date: 'Apr 5'  },
  { doc: 'Asset Requisition v2',    reason: 'Budget not approved', date: 'Mar 31' },
];

// ── Admin — Urgent items assigned to me ──────────────────────────────────────
export const ADMIN_URGENT: { doc: string; daysOverdue: number; action: string }[] = [
  { doc: 'Q4 Budget Proposal',          daysOverdue: 9, action: 'Signature required' },
  { doc: 'Vendor Agreement, TechCorp', daysOverdue: 2, action: 'Approval pending'   },
];

// ── Shared — Recent Uploads ───────────────────────────────────────────────────
export const RECENT_UPLOADS: {
  id: string;
  title: string;
  dept: string;
  uploadedBy: string;
  date: string;
  fileType: string;
  status: DocStatus;
}[] = [
  { id: '1', title: 'Procurement Policy v2',        dept: 'Operations', uploadedBy: 'Thandeka M.', date: 'Apr 13', fileType: 'PDF',  status: 'pending'  },
  { id: '2', title: 'Q4 Budget Proposal',            dept: 'Finance',    uploadedBy: 'Chisomo M.',  date: 'Apr 12', fileType: 'XLSX', status: 'pending'  },
  { id: '3', title: 'Vendor NDA, TechCorp',         dept: 'Legal',      uploadedBy: 'Lindiwe N.',  date: 'Apr 12', fileType: 'PDF',  status: 'approved' },
  { id: '4', title: 'Leave Application, Sarah M.',  dept: 'HR',         uploadedBy: 'Sarah M.',    date: 'Apr 11', fileType: 'PDF',  status: 'approved' },
  { id: '5', title: 'IT Asset Requisition',          dept: 'Operations', uploadedBy: 'Grace M.',    date: 'Apr 11', fileType: 'PDF',  status: 'rejected' },
  { id: '6', title: 'Q3 Supplier Agreement',         dept: 'Legal',      uploadedBy: 'Sipho D.',    date: 'Apr 10', fileType: 'PDF',  status: 'pending'  },
  { id: '7', title: 'Annual HR Policy Review',       dept: 'HR',         uploadedBy: 'John B.',     date: 'Apr 9',  fileType: 'DOCX', status: 'draft'   },
  { id: '8', title: 'Office Supplies Request',       dept: 'Operations', uploadedBy: 'David B.',    date: 'Apr 9',  fileType: 'PDF',  status: 'approved' },
];
