import { Building2, Users, Activity, Globe } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export default function ControlHubDashboard() {
  const stats = [
    {
      id: "tenants",
      icon: Building2,
      title: "Total Tenants",
      subtitle: "Active ecosystem",
      value: "12",
      trend: { direction: "up" as const, percentage: 20, label: "+2 this week" },
      sparkline: [40, 50, 60, 65, 70, 75, 80, 85, 90],
    },
    {
      id: "users",
      icon: Users,
      title: "Active Users",
      subtitle: "Across all tenants",
      value: "2,845",
      trend: { direction: "up" as const, percentage: 15, label: "+340 this month" },
      sparkline: [50, 55, 58, 65, 72, 78, 82, 88, 95],
    },
    {
      id: "health",
      icon: Activity,
      title: "System Health",
      subtitle: "Overall uptime",
      value: "99.9%",
      trend: { direction: "up" as const, percentage: 0.1, label: "vs last week" },
      sparkline: [95, 96, 98, 99, 99, 99, 99, 99, 100],
    },
    {
      id: "reach",
      icon: Globe,
      title: "Global Reach",
      subtitle: "Regions covered",
      value: "8",
      trend: { direction: "up" as const, percentage: 33, label: "+1 new region" },
      sparkline: [2, 3, 4, 5, 6, 7, 7, 8, 8],
    },
  ];

  const activities = [
    {
      id: 1,
      type: "tenant",
      icon: Building2,
      title: "Acme Corp registered",
      description: "Database: acme_prod, 156 users provisioned",
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      type: "user",
      icon: Users,
      title: "Sarah Ahmed added as admin",
      description: "For Widgets Inc (permissions: all)",
      timestamp: "4 hours ago",
    },
    {
      id: 3,
      type: "success",
      icon: Activity,
      title: "System backup completed",
      description: "All tenant data: 520GB, 4.2s average query time",
      timestamp: "8 hours ago",
    },
  ];

  const activityTypeConfig: Record<string, { bg: string; icon: string }> = {
    user: { bg: "bg-ch-primary/10", icon: "text-ch-primary" },
    tenant: { bg: "bg-ch-primary/10", icon: "text-ch-primary" },
    alert: { bg: "bg-caution-tint", icon: "text-caution" },
    success: { bg: "bg-positive-tint", icon: "text-positive" },
    system: { bg: "bg-ch-secondary/10", icon: "text-ch-secondary" },
  };

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Control Hub</h1>
        <p className="text-gray-600 text-lg mt-2">Manage your tenant ecosystem at a glance</p>
      </div>

      {/* System Overview Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Real-time metrics across your organization</p>
          </div>
          <button className="text-sm font-medium text-ch-primary hover:text-ch-primary/70 transition-colors whitespace-nowrap">
            ↻ Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-max">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            
            // Color schemes for each stat card
            const colorSchemes = [
              { // Signal teal - Primary
                bg: "bg-surface-1",
                border: "border-line",
                iconBg: "bg-signal-tint",
                icon: "text-signal-text",
                hex: "var(--chart-1)",
              },
              { // Blue - Secondary
                bg: "bg-surface-1",
                border: "border-line",
                iconBg: "bg-positive-tint",
                icon: "text-positive",
                hex: "var(--chart-2)",
              },
              { // Caution
                bg: "bg-surface-1",
                border: "border-line",
                iconBg: "bg-caution-tint",
                icon: "text-caution",
                hex: "var(--chart-3)",
              },
              { // Positive
                bg: "bg-surface-1",
                border: "border-line",
                iconBg: "bg-positive-tint",
                icon: "text-positive",
                hex: "var(--chart-4)",
              },
            ];
            
            const scheme = colorSchemes[idx % colorSchemes.length];
            const areaData = stat.sparkline.map((v) => ({ v }));
            
            return (
              <div
                key={stat.id}
                className={`${scheme.bg} border ${scheme.border} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col group`}
              >
                {/* Header: Title + Trend */}
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-semibold text-gray-600 tracking-tight">
                      {stat.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stat.subtitle}
                    </p>
                  </div>
                  
                  {/* Icon Badge */}
                  <div className={`h-9 w-9 rounded-lg ${scheme.iconBg} flex items-center justify-center flex-shrink-0 ml-2 shadow-sm`}>
                    <Icon className={`h-5 w-5 ${scheme.icon}`} />
                  </div>
                </div>

                {/* Main Number + Sparkline */}
                <div className="space-y-4 flex-1 flex flex-col">
                  {/* Number + Trend */}
                  <div>
                    <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                    {stat.trend && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-positive-tint">
                          <span className="text-xs font-semibold text-positive">
                            {stat.trend.direction === "up" ? "↑" : "↓"} {stat.trend.percentage}%
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">{stat.trend.label}</span>
                      </div>
                    )}
                  </div>

                  {/* Area Chart Sparkline */}
                  {stat.sparkline && (
                    <div className="mt-auto -mx-1">
                      <ResponsiveContainer width="100%" height={52}>
                        <AreaChart data={areaData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`grad-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={scheme.hex} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={scheme.hex} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke={scheme.hex}
                            strokeWidth={2}
                            fill={`url(#grad-${stat.id})`}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Activities Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-500 mt-1">Latest tenant registrations and system events</p>
          </div>
          <button className="text-sm font-medium text-ch-primary hover:text-ch-primary/70 transition-colors whitespace-nowrap">
            View All →
          </button>
        </div>

        {/* Activities Container */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {activities.map((activity, idx) => {
              const ActivityIcon = activity.icon;
              const config = activityTypeConfig[activity.type];

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors duration-150 group"
                >
                  {/* Icon */}
                  <div className={`${config.bg} p-2.5 rounded-lg flex-shrink-0 transition-all group-hover:scale-110`}>
                    <ActivityIcon className={`h-4 w-4 ${config.icon}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{activity.description}</p>
                  </div>

                  {/* Timestamp */}
                  <time className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap ml-4">
                    {activity.timestamp}
                  </time>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
