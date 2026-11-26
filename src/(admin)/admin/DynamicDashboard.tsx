import { useEffect, useState } from 'react';
import { getDashboardCardsGrouped } from '@/lib/api/dashboard';
import { EscalationsCard } from '@/components/dashboard/EscalationsCard';
import { TrendingUp, DollarSign, Users, LayoutDashboard } from '@/components/icons';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DashboardCard, DashboardCardsGroupedByZone, EscalationItem } from '@/lib/api/dashboard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { SectionBody } from '@/components/shared/SectionBody';
import { KpiTile } from '@/components/shared/KpiTile';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  axisProps, gridProps, tooltipProps, legendProps, barCursor, lineCursor,
  BAR_RADIUS, MAX_BAR_SIZE,
} from '@/components/dashboard/chartTheme';
import type { Tone } from '@/lib/status';

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

const cellTone = (value: string): Tone => {
  if (value === 'high' || value === 'urgent') return 'risk';
  if (value === 'medium') return 'caution';
  if (value === 'low' || value === 'open') return 'positive';
  return 'neutral';
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

    case 'metric': {
      const metricData = card.data as Record<string, any>;
      const hasValue = 'value' in metricData;

      const Icon = card.card_id.includes('spend') || card.title.toLowerCase().includes('spend')
        ? DollarSign
        : card.card_id.includes('headcount') || card.title.toLowerCase().includes('team')
        ? Users
        : TrendingUp;

      if (!hasValue) {
        return (
          <SectionCard title={card.title} className="h-full">
            <dl className="grid grid-cols-2 gap-4">
              {Object.entries(metricData).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs capitalize text-text-muted">{key.replace(/_/g, ' ')}</dt>
                  <dd className="text-xl font-semibold text-text-primary">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        );
      }

      const hasHint = metricData.trend || metricData.percentage !== undefined || metricData.target;

      return (
        <KpiTile
          className="h-full"
          label={card.title}
          icon={<Icon size={18} />}
          value={
            typeof metricData.value === 'number' && metricData.currency === 'USD'
              ? `$${(metricData.value / 1000).toFixed(1)}k`
              : metricData.value
          }
          hint={hasHint ? (
            <span className="flex w-full flex-col gap-1.5">
              {metricData.trend && (
                <span className="flex items-center gap-1 text-text-secondary">
                  <TrendingUp size={14} className={metricData.trendDirection === 'down' ? 'rotate-180' : undefined} />
                  {metricData.trendDirection === 'up' ? '+' : ''}{metricData.trend}
                </span>
              )}
              {metricData.percentage !== undefined && (
                <>
                  <span className="flex justify-between">
                    <span>Progress</span>
                    <span className="font-mono">{metricData.percentage}%</span>
                  </span>
                  <span className="block h-1.5 overflow-hidden rounded-pill bg-surface-2">
                    <span
                      className="block h-full rounded-pill bg-signal"
                      style={{ width: `${metricData.percentage}%` }}
                    />
                  </span>
                </>
              )}
              {metricData.target && (
                <span>
                  Target: {metricData.currency === 'USD' ? `$${(metricData.target / 1000).toFixed(0)}k` : metricData.target}
                </span>
              )}
            </span>
          ) : undefined}
        />
      );
    }

    case 'chart': {
      const chartData = Array.isArray(card.data) ? card.data : [];
      const isLine = card.config?.chartType === 'line' || card.card_id.includes('revenue');

      return (
        <SectionCard eyebrow={card.description || 'Analytics'} title={card.title}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {isLine ? (
                <AreaChart data={chartData}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...axisProps} dataKey={card.card_id.includes('revenue') ? 'month' : 'label'} />
                  <YAxis
                    {...axisProps}
                    tickFormatter={(val) => card.card_id.includes('revenue') ? `$${val/1000}k` : val}
                  />
                  <Tooltip {...tooltipProps} cursor={lineCursor} />
                  <Area
                    type="monotone"
                    dataKey={card.card_id.includes('revenue') ? 'revenue' : 'value'}
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="var(--chart-1)"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid {...gridProps} />
                  <XAxis {...axisProps} dataKey={card.card_id.includes('hiring') ? 'position' : 'label'} />
                  <YAxis {...axisProps} />
                  <Tooltip {...tooltipProps} cursor={barCursor} />
                  {card.card_id.includes('hiring') && <Legend {...legendProps} />}
                  {card.card_id.includes('hiring') ? (
                    <>
                      <Bar dataKey="applications" fill="var(--chart-1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} name="Applications" />
                      <Bar dataKey="interviews" fill="var(--chart-2)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} name="Interviews" />
                    </>
                  ) : (
                    <Bar dataKey="value" fill="var(--chart-1)" radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </SectionCard>
      );
    }

    case 'table': {
      const tableData = Array.isArray(card.data) ? card.data.slice(0, 5) : [];
      const headers = tableData.length > 0 ? Object.keys(tableData[0]).filter(k => k !== 'id') : [];

      return (
        <SectionCard
          eyebrow={card.description || 'Recent details'}
          title={card.title}
          padded={false}
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map(h => (
                    <TableHead key={h} className="capitalize">{h.replace(/([A-Z])/g, ' $1')}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    {headers.map(h => (
                      <TableCell key={h} className="text-[13px] text-text-secondary">
                        {h.toLowerCase().includes('priority') || h.toLowerCase().includes('status') ? (
                          <StatusBadge tone={cellTone(String(row[h]).toLowerCase())} className="capitalize">
                            {String(row[h]).replace('_', ' ')}
                          </StatusBadge>
                        ) : String(row[h])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-line p-3 text-center">
            <Button variant="ghost" size="sm">View all records</Button>
          </div>
        </SectionCard>
      );
    }

    default:
      return (
        <SectionCard title="Unknown card type">
          <p className="text-sm text-text-secondary">{card.card_type}</p>
        </SectionCard>
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
        const message = err instanceof Error ? err.message : "Couldn't load the dashboard cards";
        setError(message);
        toast({
          title: "Couldn't load the dashboard",
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [toast]);

  const isEmpty = !cardsGrouped || (cardsGrouped.top.length === 0 && cardsGrouped.side.length === 0 && cardsGrouped.middle.length === 0);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <PageHeader
        title="Management dashboard"
        description="A current view of your operations."
      />

      <SectionBody
        loading={loading}
        skeleton={
          <div role="status" aria-busy="true" aria-label="Loading" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-[104px] rounded-lg" />)}
          </div>
        }
        error={error}
        onRetry={() => window.location.reload()}
        isEmpty={isEmpty}
        empty={
          <SectionCard>
            <EmptyState
              icon={<LayoutDashboard size={24} />}
              title="No cards set up yet"
              description="Ask your administrator to set up dashboard cards."
            />
          </SectionCard>
        }
      >
        {cardsGrouped && (
          <>
            {/* Top zone: summary metrics */}
            {cardsGrouped.top.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cardsGrouped.top.map((card) => (
                  <div
                    key={card.card_id}
                    className={`${getCardSpanClass(card, { top: true, single: cardsGrouped.top.length === 1 })} min-w-0`}
                  >
                    <DynamicCardRenderer card={card} />
                  </div>
                ))}
              </div>
            )}

            {/* Main content */}
            {(cardsGrouped.side.length > 0 || cardsGrouped.middle.length > 0) && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                {[...cardsGrouped.side, ...cardsGrouped.middle].map((card) => (
                  <div
                    key={card.card_id}
                    className={`${getCardSpanClass(card)} min-w-0`}
                  >
                    <DynamicCardRenderer card={card} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </SectionBody>
    </div>
  );
}
