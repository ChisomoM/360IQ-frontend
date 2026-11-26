import { useState } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle2,
  LogIn,
} from '@/components/icons';
import { toast } from 'sonner';
import type { Document } from '@/types/dms';
import { formatDate } from '@/lib/format';

interface AddToCalendarProps {
  document: Document | null;
  onSuccess?: () => void;
}

export function AddToCalendarButton({ document, onSuccess }: AddToCalendarProps) {
  const { tokens } = useAuth();
  const token = tokens?.token || '';
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check calendar connection when dialog opens
  const handleOpenDialog = async () => {
    setError(null);
    setSuccess(false);
    setCheckingStatus(true);

    try {
      const response = await fetch('/api/v1/chat/calendar-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setCalendarConnected(data.data?.connected || false);
    } catch (err) {
      console.error('Failed to check calendar status:', err);
      setCalendarConnected(false);
    } finally {
      setCheckingStatus(false);
      setIsDialogOpen(true);
    }
  };

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/google-calendar/login', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const data = await response.json();
      // The backend returns { auth_url: "...", state: "..." }
      const authUrl = data.auth_url || data.data?.auth_url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error('No OAuth URL returned');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect Google';
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!document) {
      toast.error('No document selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/chat/add-to-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          document_id: document.id,
          event_date: eventDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to add event to calendar'
        );
      }

      setSuccess(true);
      toast.success('Event added to Google Calendar');
      setTimeout(() => {
        setIsDialogOpen(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add event';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!document) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        disabled={checkingStatus}
        variant="secondary"
        className="w-full justify-start"
      >
        {checkingStatus ? (
          <>
            <Loader2 className="animate-spin" />
            Checking
          </>
        ) : (
          <>
            <CalendarDays />
            Add to calendar
          </>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add to Google Calendar</DialogTitle>
            <DialogDescription>
              Create a calendar event for this document.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div role="status" className="space-y-3 py-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-positive-tint text-positive">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">
                  Event added
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  It is in your Google Calendar on <span className="font-mono">{formatDate(eventDate)}</span>.
                </p>
              </div>
            </div>
          ) : !calendarConnected ? (
            <div className="space-y-4">
              <div className="rounded-md bg-field p-4">
                <p className="text-sm font-semibold text-text-primary">
                  Connect your Google Calendar
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Sign in to add <strong>"{document.title}"</strong> to your calendar.
                </p>
              </div>

              <dl className="space-y-2 rounded-md border border-line p-4 text-sm">
                <div className="flex items-start gap-3">
                  <dt className="min-w-fit text-text-muted">Date</dt>
                  <dd className="font-mono text-text-primary">{formatDate(eventDate)}</dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="min-w-fit text-text-muted">Event</dt>
                  <dd className="text-text-primary">{document.title}</dd>
                </div>
              </dl>

              <p className="text-xs text-text-muted">
                After you sign in, you can choose a time for this event.
              </p>

              {error && (
                <p role="alert" className="text-xs text-risk">{error}</p>
              )}

              <DialogFooter>
                <Button
                  onClick={handleConnectGoogle}
                  disabled={isLoading}
                >
                  <LogIn />
                  Sign in with Google
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div role="alert" className="flex gap-2 rounded-md bg-risk-tint p-3 text-risk">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-text-muted">Title</p>
                <p className="break-words text-sm font-medium text-text-primary">{document.title}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {document.description && (
                <div>
                  <p className="text-xs text-text-muted">Notes</p>
                  <p className="break-words text-sm text-text-secondary">
                    {document.description.substring(0, 80)}
                    {document.description.length > 80 ? '…' : ''}
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddToCalendar}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Adding
                    </>
                  ) : (
                    <>
                      <CalendarDays />
                      Add event
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
