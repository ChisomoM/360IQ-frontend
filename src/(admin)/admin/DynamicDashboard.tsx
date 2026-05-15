import { useEffect, useState } from 'react';
import { getDashboardCardsGrouped } from '@/lib/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EscalationsCard } from '@/components/dashboard/EscalationsCard';
import { AlertCircle, Loader2, BarChart3, TrendingUp, DollarSign, Users, Filter } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DashboardCard, DashboardCardsGroupedByZone, EscalationItem } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/use-toast';

const getCardSpanClass = (card: DashboardCard, options?: { top?: boolean; single?: boolean }) => {
  if (options?.single) {
    return 'col-span-full';
  }

  switch (card.card_type) {
    case 'metric':
      return options?.top ? 'col-span-full md:col-span-1' : 'col-span-full xl:col-span-4';
    case 'escalations':
      return 'col-span-full';
    case 'chart':
    case 'table':
      return 'col-span-full xl:col-span-6';
    default:
      return 'col-span-full xl:col-span-4';
  }
};

const DynamicCardRenderer = ({ card }: { card: DashboardCard }) => {
  switch (card.card_type) {
    case 'escalations':
      return (
        <EscalationsCard
          data={(card.data as EscalationItem[]) || []}
          title={card.title}
          description={card.card_id}
        />
      );

    case 'metric':
      const metricData = card.data as Record<string, any>;
      const hasValue = 'value' in metricData;
      
      let gradientClass = "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg border-0";
      let textClass = "text-white";
      let subtextClass = "text-white/80";
      
      if (card.card_id.includes('spend') || card.card_id.includes('revenue') || card.title.toLowerCase().includes('spend')) {
        gradientClass = "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg border-0";
      } else if (card.card_id.includes('headcount') || card.card_id.includes('users') || card.title.toLowerCase().includes('team')) {
        gradientClass = "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg border-0";
      } else if (card.card_id.includes('task') || card.card_id.includes('compliance')) {
        gradientClass = "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg border-0";
      }
      
      const Icon = card.card_id.includes('spend') || card.title.toLowerCase().includes('spend') 
        ? DollarSign 
        : card.card_id.includes('headcount') || card.title.toLowerCase().includes('team')
        ? Users 
        : TrendingUp;

      return (
        <Card className={`${gradientClass} hover:shadow-xl transition-shadow overflow-hidden group`}>
          <CardHeader className="pb-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full -mr-4 -mt-4 group-hover:scale-125 transition-transform duration-700" />
            <div className="flex items-center justify-between z-10 relative">
              <div className={`text-sm font-medium ${subtextClass}`}>{card.title}</div>
              <Icon className={`h-5 w-5 ${subtextClass}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-2 relative z-10">
            {hasValue ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-3xl font-bold ${textClass}`}>
                    {typeof metricData.value === 'number' && metricData.currency === 'USD' 
                      ? `$${(metricData.value / 1000).toFixed(1)}k` 
                      : metricData.value}
                  </h3>
                  {metricData.trend && (
                    <span className={`text-sm font-bold flex items-center gap-1 ${subtextClass}`}>
                      {metricData.trendDirection === 'up' ? '+' : ''}{metricData.trend}
                      <TrendingUp className={`h-3 w-3 ${metricData.trendDirection === 'down' ? 'rotate-180' : ''}`} />
                    </span>
                  )}
                </div>
                
                {metricData.percentage !== undefined && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-xs font-medium opacity-90">
                      <span>Progress</span>
                      <span>{metricData.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${metricData.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {metricData.target && (
                  <p className={`text-xs ${subtextClass} mt-1`}>
                    Target: {metricData.currency === 'USD' ? `$${(metricData.target / 1000).toFixed(0)}k` : metricData.target}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(metricData).map(([key, value]) => (
                  <div key={key}>
                    <p className={`text-[10px] font-bold ${subtextClass} uppercase mb-1`}>{key.replace(/_/g, ' ')}</p>
                    <p className={`text-xl font-bold ${textClass}`}>{String(value)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'chart':
      const chartData = Array.isArray(card.data) ? card.data : [];
      const isLine = card.config?.chartType === 'line' || card.card_id.includes('revenue');

      return (
        <Card className="shadow-md border-gray-200 bg-white group">
          <CardHeader className="pb-4 border-b border-gray-50">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {card.title}
            </CardTitle>
            <CardDescription>{card.description || 'Analytics view'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {isLine ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`gradient-${card.card_id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey={card.card_id.includes('revenue') ? 'month' : 'label'} 
                      tick={{ fontSize: 12, fill: '#6B7280' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6B7280' }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => card.card_id.includes('revenue') ? `$${val/1000}k` : val} 
                    />
                    <Tooltip 
                      cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey={card.card_id.includes('revenue') ? 'revenue' : 'value'} 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      fill={`url(#gradient-${card.card_id})`} 
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey={card.card_id.includes('hiring') ? 'position' : 'label'} 
                      tick={{ fontSize: 12, fill: '#6B7280' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6B7280' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    {card.card_id.includes('hiring') ? (
                      <>
                        <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Applications" />
                        <Bar dataKey="interviews" fill="#10b981" radius={[4, 4, 0, 0]} name="Interviews" />
                      </>
                    ) : (
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );

    case 'table':
      const tableData = Array.isArray(card.data) ? card.data.slice(0, 5) : [];
      const headers = tableData.length > 0 ? Object.keys(tableData[0]).filter(k => k !== 'id') : [];

      return (
        <Card className="shadow-md border-gray-200 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
               <Filter className="h-5 w-5 text-indigo-600" />
               {card.title}
            </CardTitle>
            <CardDescription>{card.description || 'Recent details'}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50/50">
                  <tr className="text-left">
                    {headers.map(h => (
                      <th key={h} className="pb-3 pt-3 px-6 font-semibold text-gray-500 uppercase tracking-wider text-[11px]">{h.replace(/([A-Z])/g, ' $1')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-gray-50/50 transition-colors">
                      {headers.map(h => (
                        <td key={h} className="py-3 px-6 text-gray-700">
                          {h.toLowerCase().includes('priority') || h.toLowerCase().includes('status') ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                              ${String(row[h]).toLowerCase() === 'high' || String(row[h]).toLowerCase() === 'urgent' ? 'bg-red-100 text-red-800' : ''}
                              ${String(row[h]).toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-800' : ''}
                              ${String(row[h]).toLowerCase() === 'low' || String(row[h]).toLowerCase() === 'open' ? 'bg-green-100 text-green-800' : ''}
                              ${String(row[h]).toLowerCase() === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
                              ${String(row[h]).toLowerCase() === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                            `}>
                              {String(row[h]).replace('_', ' ')}
                            </span>
                          ) : String(row[h])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 text-center">
              <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">View All Records</button>
            </div>
          </CardContent>
        </Card>
      );

    default:
      return (
        <Card className="border-slate-200/50 shadow-premium-sm bg-white">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 text-slate-500">
              <AlertCircle className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-700">Unknown Card Type</p>
                <p className="text-sm text-slate-500 mt-1">{card.card_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
  }
};

export default function DynamicDashboard() {
  const [cardsGrouped, setCardsGrouped] = useState<DashboardCardsGroupedByZone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardCardsGrouped();
        setCardsGrouped(data || { top: [], side: [], middle: [] });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard cards';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [toast]);

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-b from-slate-50 to-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="absolute inset-0 animate-pulse rounded-full border-4 border-primary/20" />
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading your dashboard...</p>
          <p className="text-sm text-slate-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gradient-to-b from-slate-50 to-white min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="border-red-200/50 shadow-premium-lg bg-white">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="bg-red-100/50 p-4 rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Dashboard</h3>
                <p className="text-red-700 text-sm mb-6 leading-relaxed">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:shadow-premium-md transition-all"
                >
                  Retry
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!cardsGrouped || (cardsGrouped.top.length === 0 && cardsGrouped.side.length === 0 && cardsGrouped.middle.length === 0)) {
    return (
      <div className="p-8 bg-gradient-to-b from-slate-50 to-white min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md border-slate-200/50 shadow-premium-sm bg-white">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
              <p className="text-slate-600 font-semibold mb-1">No Cards Configured</p>
              <p className="text-slate-500 text-sm">
                Contact your administrator to set up dashboard cards
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Management Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time visibility into your operations
            </p>
          </div>
        </div>

        {/* Top Zone: 3-column summary metrics */}
        {cardsGrouped.top.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {cardsGrouped.top.map((card, idx) => (
                <div
                  key={card.card_id}
                  className={`${getCardSpanClass(card, { top: true, single: cardsGrouped.top.length === 1 })} min-w-0 animate-fade-in-up`}
                  style={{ animationDelay: `${150 + idx * 50}ms` }}
                >
                  <DynamicCardRenderer card={card} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        {(cardsGrouped.side.length > 0 || cardsGrouped.middle.length > 0) && (
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              {[...cardsGrouped.side, ...cardsGrouped.middle].map((card, idx) => (
                <div
                  key={card.card_id}
                  className={`${getCardSpanClass(card)} min-w-0 animate-fade-in-up`}
                  style={{ animationDelay: `${250 + idx * 50}ms` }}
                >
                  <DynamicCardRenderer card={card} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
