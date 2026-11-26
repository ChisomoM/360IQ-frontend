import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Loader2, Sparkles, FileText, Calendar, CheckCircle, AlertCircle, Send } from '@/components/icons';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  title: string;
  type: string;
  created_at: string;
  preview: string;
  owner?: string;
  status?: string;
}

interface Entity {
  people?: string[];
  dates?: string[];
  amounts?: string[];
  organizations?: string[];
  themes?: string[];
}

interface DocumentDetails {
  id: string;
  title: string;
  type: string;
  created_at: string;
  owner?: string;
  status?: string;
  category?: string;
  summary?: string;
  key_points?: string[];
  entities: Entity;
}

type UIStep = 'search' | 'results' | 'details' | 'calendar' | 'success' | 'error';

export function DocumentChat() {
  const { tokens, user } = useAuth();
  const token = tokens?.token || '';
  const tenantId = user?.tenantId || localStorage.getItem('tenantId') || '';
  // State
  const [step, setStep] = useState<UIStep>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<SearchResult | null>(null);
  const [docDetails, setDocDetails] = useState<DocumentDetails | null>(null);
  const [suggestedDate, setSuggestedDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [suggestedTime, setSuggestedTime] = useState('10:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [calendarConnected, setCalendarConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [step]);

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/chat/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query, limit: 5 }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.data?.results || []);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle document selection
  const handleSelectDocument = async (doc: SearchResult) => {
    setSelectedDoc(doc);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/chat/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ document_id: doc.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to load document details');
      }

      const data = await response.json();
      setDocDetails(data.data);
      setStep('details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  // Handle add to calendar
  const handleAddToCalendar = async () => {
    if (!selectedDoc) return;

    setLoading(true);
    setError(null);

    try {
      // Check if calendar is connected (simplified check)
      const statusResponse = await fetch('/api/v1/chat/calendar-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!statusResponse.ok || !calendarConnected) {
        setError('Connect your Google Calendar first.');
        setStep('error');
        toast.error('Google Calendar not connected');
        return;
      }

      const response = await fetch('/api/v1/chat/add-to-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: selectedDoc.id,
          suggested_date: new Date(suggestedDate).toISOString(),
          suggested_time: suggestedTime,
          add_meet: true,
          attendees_from_doc: docDetails?.entities?.people || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to calendar');
      }

      const data = await response.json();
      setSuccessMessage(data.data?.message || 'Event added to calendar');
      setStep('success');
      toast.success('Added to calendar');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to calendar');
      setStep('error');
      toast.error('Failed to add to calendar');
    } finally {
      setLoading(false);
    }
  };

  // Handle reconnect calendar
  const handleConnectCalendar = () => {
    // TODO: Implement OAuth flow
    setCalendarConnected(true);
    toast.info('Calendar connection flow would start');
  };

  // Render based on step
  const renderContent = () => {
    switch (step) {
      case 'search':
        return (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">Search your documents to read a summary of one.</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                aria-label="Search documents"
                placeholder="Zambezi Logistics contract"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                size="icon"
                aria-label="Search"
                title="Search"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
            </form>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text-primary">
                <span className="font-mono">{searchResults.length}</span> document{searchResults.length !== 1 ? 's' : ''} found
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep('search')}
              >
                New search
              </Button>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {searchResults.map((doc) => (
                <button
                  type="button"
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className="block w-full rounded-md border border-line bg-surface-1 p-3 text-left transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-start gap-2">
                    <FileText size={16} className="mt-0.5 shrink-0 text-text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{doc.title}</p>
                      <p className="line-clamp-2 text-xs text-text-muted">{doc.preview}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <StatusBadge tone="neutral">{doc.type}</StatusBadge>
                        {doc.status && <StatusBadge status={doc.status} />}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-text-primary">{docDetails?.title}</h3>
                <p className="text-sm text-text-secondary">{docDetails?.type} · <span className="font-mono text-xs">{docDetails?.created_at}</span></p>
                {docDetails?.owner && (
                  <p className="mt-1 text-xs text-text-muted">Owner: {docDetails.owner}</p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setStep('results'); setDocDetails(null); }}
              >
                Back
              </Button>
            </div>

            {(docDetails?.summary || (docDetails?.key_points && docDetails.key_points.length > 0)) && (
              <div className="space-y-3 rounded-lg p-4 iq-grad-border [--surface-1:var(--signal-tint)]">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.04em] text-signal-text">
                  <Sparkles size={16} />360IQ summary
                </p>
                {docDetails?.summary && (
                  <p className="text-sm text-text-primary">{docDetails.summary}</p>
                )}
                {docDetails?.key_points && docDetails.key_points.length > 0 && (
                  <ul className="space-y-1">
                    {docDetails.key_points.slice(0, 3).map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle size={14} className="mt-0.5 shrink-0 text-signal-text" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="flex items-center gap-1.5 text-xs text-signal-text">
                  <FileText size={14} className="shrink-0" />
                  Source: {docDetails?.title}
                </p>
              </div>
            )}

            {docDetails?.entities && (
              <div className="grid grid-cols-2 gap-2">
                {(docDetails.entities.people?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-text-muted">People</p>
                    <div className="flex flex-wrap gap-1">
                      {docDetails.entities.people?.slice(0, 2).map((p, idx) => (
                        <StatusBadge key={idx} tone="neutral">{p}</StatusBadge>
                      ))}
                    </div>
                  </div>
                )}
                {(docDetails.entities.amounts?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-1 text-xs text-text-muted">Amounts</p>
                    <div className="flex flex-wrap gap-1">
                      {docDetails.entities.amounts?.slice(0, 2).map((a, idx) => (
                        <StatusBadge key={idx} tone="neutral"><span className="font-mono">{a}</span></StatusBadge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={() => setStep('calendar')}
              className="w-full"
              size="sm"
            >
              <Calendar />
              Add to Google Calendar
            </Button>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-text-primary">Add to calendar</h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="chat-event-date">Date</Label>
                <Input
                  id="chat-event-date"
                  type="date"
                  value={suggestedDate}
                  onChange={(e) => setSuggestedDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chat-event-time">Time</Label>
                <Input
                  id="chat-event-time"
                  type="time"
                  value={suggestedTime}
                  onChange={(e) => setSuggestedTime(e.target.value)}
                />
              </div>

              {docDetails?.entities?.people && docDetails.entities.people.length > 0 && (
                <div className="rounded-md bg-field p-3 text-xs">
                  <p className="mb-1 font-medium text-text-primary">People from the document</p>
                  <p className="text-text-secondary">{docDetails.entities.people.slice(0, 2).join(', ')}</p>
                  <p className="mt-1 text-text-muted">They will be invited to the meeting.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep('details')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToCalendar}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : null}
                Add event
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div role="status" className="space-y-4 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-positive-tint text-positive">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Added to calendar</h3>
              <p className="mt-1 text-sm text-text-secondary">{successMessage}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setStep('search');
                setQuery('');
                setSelectedDoc(null);
                setDocDetails(null);
                setError(null);
              }}
              className="w-full"
            >
              Search another document
            </Button>
          </div>
        );

      case 'error':
        return (
          <div role="alert" className="space-y-4 text-center">
            <AlertCircle size={32} className="mx-auto text-risk" />
            <div>
              <h3 className="text-base font-semibold text-text-primary">Connect your calendar</h3>
              <p className="mt-1 text-sm text-text-secondary">{error}</p>
            </div>
            <Button
              onClick={handleConnectCalendar}
              className="w-full"
            >
              Connect Google Calendar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setStep('details')}
              className="w-full"
            >
              Back
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SectionCard
      className="w-full max-w-2xl"
      eyebrow={<span className="flex items-center gap-1.5 text-signal-text"><Sparkles size={16} />360IQ</span>}
      title="Ask about your documents"
    >
      <div
        ref={scrollRef}
        className="min-h-96 rounded-md border border-line p-4"
      >
        {renderContent()}
      </div>
    </SectionCard>
  );
}
