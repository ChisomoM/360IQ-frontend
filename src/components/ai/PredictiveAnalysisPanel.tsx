import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  Sparkles,
  X,
  Loader2,
  type LucideIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Tone } from '@/lib/status';

interface PredictiveAnalysisResult {
  summary: string;
  key_predictions: string[];
  anomalies_and_risks: string[];
  recommendations: string[];
  confidence_indicators?: Record<string, string | boolean>;
}

interface PredictiveAnalysisPanelProps {
  result: PredictiveAnalysisResult | null;
  isLoading: boolean;
  error?: string | null;
  onClose?: () => void;
}

function AnalysisList({ title, Icon, items, iconClass }: {
  title: string;
  Icon: LucideIcon;
  items: string[];
  iconClass: string;
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Icon size={16} className={iconClass} />
        {title}
      </h3>
      <ul className="list-disc space-y-1.5 pl-5">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-text-secondary">{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Displays predictive analysis results in a collapsible panel
 */
export const PredictiveAnalysisPanel: React.FC<PredictiveAnalysisPanelProps> = ({
  result,
  isLoading,
  error,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (!result && !isLoading && !error) {
    return null;
  }

  const closeButton = onClose && (
    <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close analysis">
      <X size={16} />
    </Button>
  );

  // Loading state
  if (isLoading) {
    return (
      <SectionCard tone="ai" actions={closeButton} title="Predictive analysis">
        <p role="status" className="flex items-center gap-2 text-sm text-signal-text">
          <Loader2 size={18} className="animate-spin" />
          360IQ is reading your chart data…
        </p>
      </SectionCard>
    );
  }

  // Error state
  if (error) {
    return (
      <SectionCard actions={closeButton} title="Predictive analysis">
        <div role="alert" className="flex items-start gap-2 text-risk">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Couldn't complete the analysis</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      </SectionCard>
    );
  }

  // Results state
  if (!result) return null;

  const confLevel = result.confidence_indicators?.predictability || 'unknown';
  const dataQuality = result.confidence_indicators?.data_quality || 'unknown';

  const confidenceTone = (level: string | boolean): Tone => {
    const levelStr = String(level).toLowerCase();
    if (levelStr === 'high') return 'positive';
    if (levelStr === 'medium' || levelStr === 'low') return 'caution';
    return 'neutral';
  };

  return (
    <SectionCard
      tone="ai"
      eyebrow={
        <span className="flex items-center gap-1.5 text-signal-text">
          <Sparkles size={16} />
          Forecast from chart data
        </span>
      }
      title="Predictive analysis"
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse analysis' : 'Expand analysis'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          {closeButton}
        </>
      }
    >
      {isExpanded && (
        <div className="space-y-4">
          {/* Confidence indicators */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={confidenceTone(dataQuality)}>Data quality: {String(dataQuality)}</StatusBadge>
            <StatusBadge tone={confidenceTone(confLevel)}>Predictability: {String(confLevel)}</StatusBadge>
          </div>

          {/* Summary */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <CheckCircle size={16} className="text-signal-text" />
              Summary
            </h3>
            <p className="text-sm leading-relaxed text-text-primary">{result.summary}</p>
          </div>

          {result.key_predictions && result.key_predictions.length > 0 && (
            <AnalysisList title="Key predictions" Icon={TrendingUp} items={result.key_predictions} iconClass="text-signal-text" />
          )}

          {result.anomalies_and_risks && result.anomalies_and_risks.length > 0 && (
            <AnalysisList title="Anomalies and risks to watch" Icon={AlertTriangle} items={result.anomalies_and_risks} iconClass="text-caution" />
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <AnalysisList title="Recommendations" Icon={Lightbulb} items={result.recommendations} iconClass="text-signal-text" />
          )}

          {/* Footer note */}
          <p className="border-t border-line pt-3 text-xs text-text-muted">
            Based on the patterns in the selected chart data. Check that the data is complete before you rely on a prediction.
          </p>
        </div>
      )}
    </SectionCard>
  );
};
