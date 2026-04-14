import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

/**
 * Displays predictive analysis results in an collapsible panel
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

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#febb00]" />
              <CardTitle className="text-base">Generating Predictive Analysis</CardTitle>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Analyzing your data and generating insights. This may take a moment...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base text-red-900">Analysis Failed</CardTitle>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Results state
  if (!result) return null;

  const confLevel = result.confidence_indicators?.predictability || 'unknown';
  const dataQuality = result.confidence_indicators?.data_quality || 'unknown';

  const getConfidenceBadgeColor = (level: string | boolean) => {
    const levelStr = String(level).toLowerCase();
    if (levelStr === 'high') return 'bg-green-100 text-green-800';
    if (levelStr === 'medium') return 'bg-yellow-100 text-yellow-800';
    if (levelStr === 'low') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="border-[#febb00]/30 bg-yellow-50/20 overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-[#febb00]/20 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <TrendingUp className="h-5 w-5 text-[#febb00] flex-shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-base">Predictive Analysis Results</CardTitle>
              <CardDescription className="text-xs mt-1">
                AI-generated insights and forecasts based on chart data
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              className="text-gray-500 hover:text-gray-700 transition"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      {isExpanded && (
        <CardContent className="pt-4 space-y-4">
          {/* Confidence Indicators */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={`text-xs ${getConfidenceBadgeColor(dataQuality)}`}>
              Data Quality: {dataQuality}
            </Badge>
            <Badge className={`text-xs ${getConfidenceBadgeColor(confLevel)}`}>
              Predictability: {confLevel}
            </Badge>
          </div>

          {/* Summary */}
          <div>
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Summary
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed bg-blue-50/50 p-3 rounded border border-blue-100">
              {result.summary}
            </p>
          </div>

          {/* Key Predictions */}
          {result.key_predictions && result.key_predictions.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Key Predictions
              </h3>
              <ul className="space-y-1.5">
                {result.key_predictions.map((pred, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-green-600 font-bold min-w-fit">→</span>
                    <span>{pred}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Anomalies & Risks */}
          {result.anomalies_and_risks && result.anomalies_and_risks.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Anomalies & Risks to Watch
              </h3>
              <ul className="space-y-1.5">
                {result.anomalies_and_risks.map((risk, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-orange-600 font-bold min-w-fit">⚠</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-purple-600" />
                Recommendations
              </h3>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-purple-600 font-bold min-w-fit">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer note */}
          <p className="text-xs text-gray-400 italic border-t border-gray-200 pt-3">
            Predictions are based on visible data patterns. For best results, ensure your data is complete and representative.
          </p>
        </CardContent>
      )}
    </Card>
  );
};
