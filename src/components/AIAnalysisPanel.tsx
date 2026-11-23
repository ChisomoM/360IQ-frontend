import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface InsightItem {
  type: 'trend' | 'anomaly' | 'prediction' | 'insight';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const mockInsights: InsightItem[] = [
  {
    type: 'trend',
    title: 'Rising Invoice Volume',
    description: 'Invoice submissions have increased 42% YoY, driven primarily by Q2 growth. The Finance department is maintaining a 71.6% processing rate.',
    icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
  },
  {
    type: 'anomaly',
    title: 'Processing Time Spike',
    description: 'Registry documents are taking 2-3 days longer than normal this month. Recommended action: Review staffing levels and workload distribution.',
    icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
  },
  {
    type: 'prediction',
    title: 'Contract Renewals Coming',
    description: 'Predictive analysis shows 18 HR contracts expiring next month. Planning ahead will prevent processing bottlenecks.',
    icon: <TrendingUp className="h-5 w-5 text-green-600" />,
  },
];

interface AIAnalysisPanelProps {
  onClose?: () => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ onClose }) => {
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
    <Card className="bg-signal-tint iq-grad-border">
      <CardHeader
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse AI insights' : 'Expand AI insights'}
        onClick={toggleExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
        className="cursor-pointer select-none border-b border-primary/10 rounded-t-xl outline-none transition-colors hover:bg-slate-100/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-signal rounded-md shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg">AI-Powered Insights</CardTitle>
              <CardDescription>Contextual analysis of your analytics data</CardDescription>
            </div>
          </div>
          <span
            className="text-muted-foreground shrink-0 text-lg font-medium leading-none tabular-nums"
            aria-hidden
          >
            {isExpanded ? '−' : '+'}
          </span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-6">
          {/* Auto Insights */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {insight.icon}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800">{insight.title}</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ask About Data */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-sm text-gray-700">Ask About This Data</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question about the analytics..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                disabled={isLoading}
                className="bg-white"
              />
              <Button
                onClick={handleAskQuestion}
                disabled={isLoading || !question.trim()}
                size="icon"
                variant="default"
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isLoading && (
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            )}

            {response && !isLoading && (
              <div className="p-4 rounded-lg bg-signal-tint iq-grad-border">
                <div className="flex gap-3">
                  <Sparkles className="h-5 w-5 text-signal-text flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-primary leading-relaxed">{response}</p>
                </div>
              </div>
            )}
          </div>

          {/* Note about AI */}
          <div className="p-3 bg-positive-tint border border-line rounded-lg">
            <p className="text-xs text-positive">
              ℹ️ <strong>Note:</strong> AI insights are mocked for demonstration. In production, this will connect to a live backend AI service for real-time analysis.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AIAnalysisPanel;
