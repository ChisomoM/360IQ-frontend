import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, FileText, Calendar, CheckCircle, AlertCircle, Send } from 'lucide-react';
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
        setError('Please connect your Google Calendar first');
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
      toast.success('Added to calendar!');
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
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">Search for documents in your DIMS</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="e.g., Q4 financial reports, HR policies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={loading || !query.trim()}
                size="icon"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Found {searchResults.length} documents</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('search')}
              >
                New Search
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-1 flex-shrink-0 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{doc.preview}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
                        {doc.status && <Badge variant="outline" className="text-xs">{doc.status}</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{docDetails?.title}</h3>
                <p className="text-sm text-gray-600">{docDetails?.type} • {docDetails?.created_at}</p>
                {docDetails?.owner && (
                  <p className="text-xs text-gray-500 mt-1">Owner: {docDetails.owner}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setStep('results'); setDocDetails(null); }}
              >
                Back
              </Button>
            </div>

            {docDetails?.summary && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm">{docDetails.summary}</p>
              </div>
            )}

            {docDetails?.key_points && docDetails.key_points.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Key Points:</p>
                <ul className="space-y-1">
                  {docDetails.key_points.slice(0, 3).map((point, idx) => (
                    <li key={idx} className="text-sm text-gray-700">• {point}</li>
                  ))}
                </ul>
              </div>
            )}

            {docDetails?.entities && (
              <div className="grid grid-cols-2 gap-2">
                {docDetails.entities.people?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600">People:</p>
                    <div className="flex flex-wrap gap-1">
                      {docDetails.entities.people.slice(0, 2).map((p, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {docDetails.entities.amounts?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600">Amounts:</p>
                    <div className="flex flex-wrap gap-1">
                      {docDetails.entities.amounts.slice(0, 2).map((a, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">What would you like to do?</p>
              <Button
                onClick={() => setStep('calendar')}
                className="w-full"
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Add to Google Calendar
              </Button>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold">Add to Calendar</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={suggestedDate}
                  onChange={(e) => setSuggestedDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={suggestedTime}
                  onChange={(e) => setSuggestedTime(e.target.value)}
                  className="mt-1"
                />
              </div>

              {docDetails?.entities?.people && docDetails.entities.people.length > 0 && (
                <div className="p-2 bg-gray-50 rounded text-xs">
                  <p className="font-medium mb-1">People from document:</p>
                  <p className="text-gray-600">{docDetails.entities.people.slice(0, 2).join(', ')}</p>
                  <p className="text-gray-500 text-xs mt-1">They'll be invited to the meeting</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddToCalendar}
                disabled={loading}
                className="flex-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm & Add
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('details')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg">Added to Calendar!</h3>
              <p className="text-sm text-gray-600 mt-1">{successMessage}</p>
            </div>
            <Button
              onClick={() => {
                setStep('search');
                setQuery('');
                setSelectedDoc(null);
                setDocDetails(null);
                setError(null);
              }}
              className="w-full"
            >
              Search Another Document
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="font-semibold">Connect Your Calendar</h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <Button
              onClick={handleConnectCalendar}
              className="w-full"
            >
              Connect Google Calendar
            </Button>
            <Button
              variant="outline"
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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Document AI Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="min-h-96 bg-gray-50 rounded-lg p-4 border"
        >
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}
