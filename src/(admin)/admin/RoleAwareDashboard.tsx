import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Bell, CheckCircle, Clock, AlertCircle, FileSignature, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';

export type RoleLevel = 'SuperAdmin' | 'TenantAdmin' | 'Manager' | 'User';
export type Department = 'Finance' | 'Registry' | 'HR' | 'None';

export default function RoleAwareDashboard() {
  const [role, setRole] = useState<RoleLevel>('SuperAdmin');
  const [department, setDepartment] = useState<Department>('Finance');

  // Hardcoded mock user
  const user = { firstName: 'Alex' };
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // -----------------------------------------------------
  // Subtitles base on role
  // -----------------------------------------------------
  const subtitleMap: Record<RoleLevel, string> = {
    SuperAdmin: "System is operating normally. 12 tenants active.",
    TenantAdmin: "Tenant overview: 4 pending approvals need review.",
    Manager: "You have 3 documents awaiting your signature and 2 approvals pending.",
    User: "You have 1 document awaiting your signature."
  };

  // -----------------------------------------------------
  // Metric Data calculations based on role
  // -----------------------------------------------------
  // SuperAdmin/TenantAdmin sees all 3, Manager sees Approvals and Signatures, User sees Signatures
  const showTotalDocs = role === 'SuperAdmin' || role === 'TenantAdmin';
  const showApprovals = role === 'SuperAdmin' || role === 'TenantAdmin' || role === 'Manager';
  const showSignatures = true; // All roles with signing rights

  // -----------------------------------------------------
  // Render Chart Configurations
  // -----------------------------------------------------
  const renderCharts = () => {
    switch (department) {
      case 'Finance':
        return (
          <>
            <ChartCard title="Invoice Volume by Month" desc="Number of invoices processed">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[{ name: 'Jan', val: 40 }, { name: 'Feb', val: 30 }, { name: 'Mar', val: 20 }, { name: 'Apr', val: 27 }, { name: 'May', val: 18 }, { name: 'Jun', val: 23 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <ChartCard title="Invoice Status" desc="Pending vs Approved vs Paid">
                 <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[{ name: 'Pending', value: 400 }, { name: 'Approved', value: 300 }, { name: 'Paid', value: 300 }]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#f59e0b" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Value Trend (6mo)" desc="Total invoice value ($)">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[{ month: 'Jan', val: 4000 }, { month: 'Feb', val: 3000 }, { month: 'Mar', val: 2000 }, { month: 'Apr', val: 2780 }, { month: 'May', val: 1890 }, { month: 'Jun', val: 2390 }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false}/>
                    <YAxis fontSize={12} tickLine={false} axisLine={false}/>
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        );
      case 'Registry':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Documents by Status" desc="Breakdown of document states">
               <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[{ name: 'Pending', value: 45 }, { name: 'Signed', value: 300 }, { name: 'Rejected', value: 20 }]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Submission Trends" desc="Past 30 days">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[{ day: '1', val: 10 }, { day: '10', val: 15 }, { day: '20', val: 8 }, { day: '30', val: 22 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis fontSize={12} tickLine={false} axisLine={false}/>
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        );
      case 'HR':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Contracts Status" desc="Active, Expiring, Expired">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[{ name: 'Q1', Active: 400, Expiring: 240, Expired: 24 }, { name: 'Q2', Active: 300, Expiring: 139, Expired: 22 }]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false}/>
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="Active" stackId="a" fill="#10b981" />
                  <Bar dataKey="Expiring" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Expired" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Signature Turnaround" desc="Average time (days)">
               <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[{ week: 'W1', val: 4 }, { week: 'W2', val: 3.5 }, { week: 'W3', val: 2 }, { week: 'W4', val: 2.5 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis fontSize={12} tickLine={false} axisLine={false}/>
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        );
      case 'None':
      default:
        return (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Document Status" desc="Completed vs Pending">
               <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[{ name: 'Pending', value: 40 }, { name: 'Completed', value: 300 }]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Activity (30 Days)" desc="General document actions">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[{ day: '1', val: 5 }, { day: '10', val: 25 }, { day: '20', val: 12 }, { day: '30', val: 18 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis fontSize={12} tickLine={false} axisLine={false}/>
                  <RechartsTooltip />
                  <Line type="step" dataKey="val" stroke="#6366f1" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Dev Control Panel - To test different roles */}
      <div className="bg-indigo-900 text-white p-3 flex items-center justify-between shadow-md relative z-50">
        <div className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Dashboard Preview Controller
        </div>
        <div className="flex gap-4">
          <select value={role} onChange={e => setRole(e.target.value as RoleLevel)} className="bg-indigo-800 border-indigo-700 text-white text-sm rounded px-2 py-1 outline-none">
            <option value="SuperAdmin">Role: Super Admin</option>
            <option value="TenantAdmin">Role: Tenant Admin</option>
            <option value="Manager">Role: Manager / HOD</option>
            <option value="User">Role: Regular User</option>
          </select>
          <select value={department} onChange={e => setDepartment(e.target.value as Department)} className="bg-indigo-800 border-indigo-700 text-white text-sm rounded px-2 py-1 outline-none">
            <option value="Finance">Dept: Finance</option>
            <option value="Registry">Dept: Registry</option>
            <option value="HR">Dept: HR</option>
            <option value="None">Dept: None (Fallback)</option>
          </select>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 flex flex-col gap-8">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Welcome back, {user.firstName}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">{subtitleMap[role]}</p>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <div className="text-sm text-slate-500 font-medium">{currentDate}</div>
          </div>
        </div>

        {/* Zone 1: Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showTotalDocs && (
            <MetricCard title="Total Documents" value="1,248" trend="+12" trendUp icon={<FileText className="text-indigo-600 w-5 h-5" />} bg="bg-indigo-50" />
          )}
          {showApprovals && (
            <MetricCard title="Pending Approvals" value="4" trend="-2" trendUp={false} icon={<CheckCircle className="text-amber-600 w-5 h-5" />} bg="bg-amber-50" />
          )}
          {showSignatures && (
            <MetricCard title="Pending Signatures" value="3" icon={<FileSignature className="text-rose-600 w-5 h-5" />} bg="bg-rose-50" />
          )}
        </div>

        {/* Zones 2 & 3: Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Zone 2: Left Column (Charts) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-200">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              {department !== 'None' ? `${department} Analytics` : 'Organization Overview'}
            </h2>
            {role === 'SuperAdmin' || role === 'TenantAdmin' ? (
              <div className="flex flex-col gap-6 mb-6">
                <CustomFunnelChart />
                <CustomRankingChart />
              </div>
            ) : null}
            {renderCharts()}
          </div>

          {/* Zone 3: Right Column (Activity Panel) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
             {/* Documents Needing Attention */}
             <Card className="border-rose-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-rose-50/80 pb-4 border-b border-rose-100">
                <CardTitle className="text-base text-rose-900 flex items-center gap-2 font-bold">
                  <AlertCircle className="w-[18px] h-[18px] text-rose-600" />
                  Requires Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 p-0">
                <div className="divide-y divide-slate-100">
                  <AttentionItem doc="Q3 Partnership Agreement" action="Sign" label="Overdue" />
                  <AttentionItem doc="Invoice #8841-A" action="Approve" />
                  <AttentionItem doc="Employee Contract - Sarah M." action="Review" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
                <CardTitle className="text-base flex items-center gap-2 text-slate-800 font-bold">
                  <Clock className="w-[18px] h-[18px] text-slate-500" />
                  Recent Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 p-0 px-4">
                <div className="space-y-4 pb-4">
                  <RequestItem doc="Vendor API License" status="Pending" time="2 hours ago" />
                  <RequestItem doc="Leave Application (August)" status="Approved" time="1 day ago" />
                  <RequestItem doc="Hardware Procurement" status="Rejected" time="3 days ago" />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="shadow-sm border-slate-200 rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-slate-800 font-bold">
                  <Bell className="w-[18px] h-[18px] text-slate-500" />
                  Alerts
                </CardTitle>
                <a href="#" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold tracking-wide">View all</a>
              </CardHeader>
              <CardContent className="pt-4 p-0 px-4">
                 <div className="space-y-4 pb-4">
                  <NotificationItem msg="John Doe requested signature on ND-330" time="10 min ago" unread />
                  <NotificationItem msg="Your document 'Expense Q2' was approved" time="2 hr ago" />
                  <NotificationItem msg="System maintenance scheduled for Friday" time="1 day ago" />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Zone 4: Bottom Documents Section */}
        <div className="mt-8 flex flex-col gap-5">
          <div className="flex justify-between items-end border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Recent Documents
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Latest files associated with your workflow</p>
            </div>
            <Button variant="outline" size="sm" className="bg-white font-semibold shadow-sm">Show All Documents</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DocumentCard title="Q3 Marketing Strategy" type="Word" status="In Progress" author="Alex" />
            <Button className="h-full min-h-[140px] border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/50 flex flex-col items-center justify-center text-slate-600 hover:text-indigo-700 gap-3 font-semibold transition-all shadow-sm rounded-xl">
              <FileCardIcon />
              Upload New Document
            </Button>
            <DocumentCard title="2026 Budget Draft" type="PDF" status="Pending Approval" author="Sarah M." />
          </div>
        </div>

      </div>
    </div>
  );
}

// -----------------------------------------------------
// Helper Components
// -----------------------------------------------------

function MetricCard({ title, value, trend, trendUp, icon, bg }: { title: string, value: string, trend?: string, trendUp?: boolean, icon: React.ReactNode, bg: string }) {
  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group bg-white rounded-xl">
      <CardContent className="p-6 relative">
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full ${bg} -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform duration-500`} />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{title}</p>
          <div className={`p-2.5 rounded-xl ${bg} shadow-sm text-primary`}>{icon}</div>
        </div>
        <div className="flex items-end gap-3 relative z-10">
          <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
          {trend && (
            <span className={`text-sm font-bold pb-1.5 ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trendUp ? '↗' : '↘'} {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, desc, children }: { title: string, desc: string, children: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-slate-200 rounded-xl bg-white overflow-hidden">
      <CardHeader className="pb-4 bg-slate-50/30 border-b border-slate-100">
        <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-700">{title}</CardTitle>
        <CardDescription className="font-medium text-slate-500">{desc}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 px-4">
        {children}
      </CardContent>
    </Card>
  );
}

function AttentionItem({ doc, action, label }: { doc: string, action: string, label?: string }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-rose-50/30 transition-colors">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
           <p className="font-semibold text-sm text-slate-800 truncate">{doc}</p>
           {label && <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">{label}</span>}
        </div>
        <p className="text-xs text-rose-600 font-medium mt-1 w-max px-2 py-0.5 bg-rose-100 rounded">Requires {action}</p>
      </div>
      <div>
        <Button size="sm" className={action === 'Sign' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-800 hover:bg-slate-900'}>{action}</Button>
      </div>
    </div>
  );
}

function RequestItem({ doc, status, time }: { doc: string, status: string, time: string }) {
  const isApproved = status === 'Approved';
  const isRejected = status === 'Rejected';
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <FileText className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
            isApproved ? 'bg-emerald-100 text-emerald-700' : 
            isRejected ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
          }`}>{status}</span>
          <span className="text-xs text-slate-400">{time}</span>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ msg, time, unread }: { msg: string, time: string, unread?: boolean }) {
  return (
    <div className="flex items-start gap-3 relative">
      {unread && <div className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-indigo-600" />}
      <div className="flex-1 min-w-0 pl-3">
        <p className={`text-sm ${unread ? 'font-medium text-slate-800' : 'text-slate-600'} leading-snug`}>{msg}</p>
        <span className="text-xs text-slate-400 mt-1 block">{time}</span>
      </div>
    </div>
  );
}

function DocumentCard({ title, type, status, author }: { title: string, type: string, status: string, author: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow group flex flex-col justify-between cursor-pointer border-slate-200">
      <CardContent className="p-5 flex flex-col h-full gap-4">
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
             <FileCardIcon />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {type}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">Edited by {author}</p>
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status.includes('Progress') ? 'bg-amber-400' : 'bg-rose-400'}`} />
            {status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function FileCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  );
}

// Custom Funnel Chart
function CustomFunnelChart() {
  return (
    <Card className="shadow-sm border-slate-200 rounded-xl bg-white overflow-hidden flex flex-col h-full w-full">
      <CardHeader className="pb-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Document Workflow Funnel</CardTitle>
        </div>
        <CardDescription className="text-slate-500 text-sm">Stage progression with drop-off analysis</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 px-6 flex-1">
        <div className="space-y-5">
           <FunnelStage label="Submitted" count="1,248" percentage="100.0%" width="100%" />
           <FunnelStage label="Under Review" count="1,032" percentage="82.6%" width="82.6%" drop="216" />
           <FunnelStage label="Approved" count="890" percentage="71.3%" width="71.3%" drop="142" />
           <FunnelStage label="Signed & Completed" count="750" percentage="60.0%" width="60.0%" drop="140" />
        </div>
        <div className="mt-8 bg-primary/10 rounded-xl p-4 border border-primary/20">
           <p className="font-semibold text-primary">Overall Completion Rate: 60.0%</p>
           <p className="text-sm text-primary/70 mt-0.5">750 completed out of 1,248 submissions</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelStage({ label, count, percentage, width, drop }: { label: string; count: string; percentage: string; width: string; drop?: string; }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <span className="font-bold text-slate-800 text-sm">{label}</span>
        <span className="text-sm font-medium"><span className="text-slate-900">{count}</span> <span className="text-slate-500">({percentage})</span></span>
      </div>
      <div className="relative h-9 w-full bg-slate-100 rounded-md overflow-hidden flex">
        <div className="h-full bg-primary rounded-md shadow-sm transition-all duration-1000" style={{ width }}>
        </div>
        {drop && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 pointer-events-none">
             <span className="text-xs font-bold text-slate-500 bg-white/80 backdrop-blur px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
               <span className="text-slate-400">↓</span> {drop}
             </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom Ranking Chart
function CustomRankingChart() {
  return (
    <Card className="shadow-sm border-slate-200 rounded-xl bg-white overflow-hidden flex flex-col h-full w-full">
      <CardHeader className="pb-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Workflow Popularity Ranking</CardTitle>
        </div>
        <CardDescription className="text-slate-500 text-sm">Top workflows by document submissions</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 px-6 flex-1">
         <div className="space-y-6">
           <RankingItem rank={1} title="Vendor Agreement Form" dept="Procurement" count="350" conv="84.0%" />
           <RankingItem rank={2} title="Employee Leave Request" dept="Human Resources" count="282" conv="92.0%" />
           <RankingItem rank={3} title="Q3 Expense Report" dept="Finance" count="215" conv="78.5%" />
           <RankingItem rank={4} title="IT Asset Requisition" dept="IT Operations" count="190" conv="88.2%" />
           <RankingItem rank={5} title="Client Onboarding Setup" dept="Sales" count="145" conv="65.0%" />
         </div>
      </CardContent>
    </Card>
  );
}

function RankingItem({ rank, title, dept, count, conv }: { rank: number; title: string; dept: string; count: string; conv: string; }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-full bg-primary shadow-md text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{dept}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-slate-900 text-sm">{count}</p>
        <p className="text-xs text-emerald-600 font-semibold mt-0.5">{conv} conv</p>
      </div>
    </div>
  );
}

