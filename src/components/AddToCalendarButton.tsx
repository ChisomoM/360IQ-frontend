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
} from 'lucide-react';
import { toast } from 'sonner';
import type { Document } from '@/types/dms';

interface AddToCalendarProps {
  document: Document | null;
  onSuccess?: () => void;
}

export function AddToCalendarButton({ document, onSuccess }: AddToCalendarProps) {
  const { tokens, user } = useAuth();
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
      toast.success('Event added to Google Calendar!');
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
        variant="outline"
        className="w-full justify-start gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        {checkingStatus ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <CalendarDays className="h-4 w-4" />
            Add to Calendar
          </>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
              Add to Google Calendar
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-1">
              Create a calendar event for this document
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-12 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  Event created successfully!
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Your event has been added to Google Calendar for {new Date(eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          ) : !calendarConnected ? (
            <div className="py-4 space-y-5">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Connect your Google Calendar
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Sign in to add <strong>"{document.title}"</strong> to your calendar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900">Event Preview:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="font-medium text-gray-600 min-w-fit">Date:</span>
                    <span className="text-gray-900 font-semibold">
                      {new Date(eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-medium text-gray-600 min-w-fit">Event:</span>
                    <span className="text-gray-700">{document.title}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  💡 After signing in, you'll be able to select a specific time for this event.
                </p>
              </div>

              <Button
                onClick={handleConnectGoogle}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 py-2.5"
              >
                <LogIn className="h-4 w-4" />
                Sign in with Google
              </Button>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Event Details</p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="font-medium text-gray-600 text-sm min-w-fit">Title:</span>
                    <span className="text-gray-800 font-medium break-words flex-1">{document.title}</span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <label htmlFor="event-date" className="font-medium text-gray-600 text-sm min-w-fit">Date:</label>
                    <Input
                      id="event-date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      disabled={isLoading}
                      className="border-gray-300 text-sm flex-1"
                    />
                  </div>

                  {document.description && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-gray-600 text-sm min-w-fit">Notes:</span>
                      <p className="text-sm text-gray-700 break-words flex-1">
                        {document.description.substring(0, 80)}
                        {document.description.length > 80 ? '...' : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddToCalendar}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Add Event
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
