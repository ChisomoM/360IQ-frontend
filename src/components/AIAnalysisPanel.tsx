import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { SectionCard } from '@/components/shared/SectionCard';

interface InsightItem {
  type: 'trend' | 'anomaly' | 'prediction' | 'insight';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const mockInsights: InsightItem[] = [
  {
    type: 'trend',
    title: 'Rising invoice volume',
    description: 'Invoice submissions have increased 42% YoY, driven primarily by Q2 growth. The Finance department is maintaining a 71.6% processing rate.',
    icon: <TrendingUp size={18} className="text-text-secondary" />,
  },
  {
    type: 'anomaly',
    title: 'Processing time spike',
    description: 'Registry documents are taking 2-3 days longer than normal this month. Recommended action: review staffing levels and workload distribution.',
    icon: <AlertTriangle size={18} className="text-caution" />,
  },
  {
    type: 'prediction',
    title: 'Contract renewals coming',
    description: 'Predictive analysis shows 18 HR contracts expiring next month. Planning ahead will prevent processing bottlenecks.',
    icon: <TrendingUp size={18} className="text-text-secondary" />,
  },
];

interface AIAnalysisPanelProps {
  onClose?: () => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    // Simulate API call delay (mock)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock responses based on keywords
    const lowerQuestion = question.toLowerCase();
    let mockResponse = 'Based on the current data analytics, ';

    if (lowerQuestion.includes('invoice') || lowerQuestion.includes('finance')) {
      mockResponse += 'Finance invoices show strong growth with 220K in value this June. The approval rate is solid at 65%, with 22% pending and 13% rejected. Consider reviewing the rejected invoices to identify bottlenecks.';
    } else if (lowerQuestion.includes('registry') || lowerQuestion.includes('submission')) {
      mockResponse += 'Registry submissions are tracking well with 165 documents submitted in June. Processing rate is at 94%, which is excellent. Most documents are being processed within 3 days.';
    } else if (lowerQuestion.includes('hr') || lowerQuestion.includes('contract') || lowerQuestion.includes('signature')) {
      mockResponse += 'HR contracts show healthy status with 92 active contracts. However, 18 contracts are expiring next month. Signature completion is at 78%, with some documents still pending. Recommend prioritizing expiring contracts.';
    } else if (lowerQuestion.includes('trend') || lowerQuestion.includes('growth')) {
      mockResponse += 'Overall document volume shows positive growth trajectory. All departments are meeting their processing targets. The average processing time is 2.3 days per document.';
    } else {
      mockResponse += 'The analytics dashboard shows strong performance across all departments. Total documents this period: 1,245. Processed: 892 (71.6% completion rate). Average processing time: 2.3 days.';
    }

    setResponse(mockResponse);
    setIsLoading(false);
  };

  const toggleExpanded = () => setIsExpanded((v) => !v);

  return (
    <SectionCard tone="ai" padded={false}>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between gap-3 p-6 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <Sparkles size={24} className="shrink-0 text-signal-text" />
          <span className="min-w-0">
            <span className="block text-base font-semibold text-signal-text">360IQ insights</span>
            <span className="block text-xs text-text-secondary">Sample analysis of your analytics data</span>
          </span>
        </span>
        <span className="shrink-0 text-text-secondary">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-5 border-t border-line p-6">
          {/* Auto insights */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Key insights</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {mockInsights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-md border border-line p-4">
                  {insight.icon}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{insight.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ask about the data */}
          <div className="space-y-3 border-t border-line pt-5">
            <h3 className="text-sm font-semibold text-text-primary">Ask about this data</h3>
            <div className="flex gap-2">
              <Input
                aria-label="Ask about this data"
                placeholder="How are finance invoices doing?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                disabled={isLoading}
              />
              <Button
                onClick={handleAskQuestion}
                disabled={isLoading || !question.trim()}
                size="icon"
                variant="secondary"
                aria-label="Ask"
                className="shrink-0"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>

            <div aria-live="polite">
              {isLoading && <p className="text-sm text-signal-text">360IQ is reading your question…</p>}
              {response && !isLoading && (
                <div className="flex gap-3">
                  <Sparkles size={18} className="mt-0.5 shrink-0 text-signal-text" />
                  <p className="text-sm leading-relaxed text-text-primary">{response}</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-text-muted">
            These insights and answers are sample content for demonstration. They are not yet connected to a live analysis service.
          </p>
        </div>
      )}
    </SectionCard>
  );
};

export default AIAnalysisPanel;
