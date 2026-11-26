import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Search,
  Loader2,
  FileText,
  Building,
  Calendar,
  AlertCircle,
} from '@/components/icons';
import { toast } from 'sonner';
import type { Document } from '@/types/dms';
import { post } from '@/lib/api/crud';
import { formatDate } from '@/lib/format';

interface DocumentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (document: Document) => void;
}

export function DocumentSearchModal({
  isOpen,
  onClose,
  onSelect,
}: DocumentSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const data = await post('DOCUMENT_SEARCH', { query });
      setResults(data?.results || []);
      if (!data?.results || data.results.length === 0) {
        setError('No documents match your search.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDocument = (doc: Document) => {
    onSelect?.(doc);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setResults([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Search documents</DialogTitle>
          <DialogDescription>
            Search by keyword. The most relevant results come first.
          </DialogDescription>
        </DialogHeader>

        {/* Search input and actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              aria-label="Search documents"
              placeholder="Zambezi Logistics contract"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
              className="pl-10"
              autoFocus
            />
          </div>
          <Button
            onClick={() => handleSearch(searchQuery)}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <>
                <Loader2 className="animate-spin" />
                Searching
              </>
            ) : (
              'Search'
            )}
          </Button>
          {searchQuery && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setResults([]);
                setError(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="min-h-[200px] flex-1 space-y-2 overflow-y-auto">
          {error && !results.length && (
            <div role="status" className="flex items-center gap-2 rounded-md bg-field p-4 text-text-secondary">
              <AlertCircle size={16} className="shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-xs text-text-muted">
                <span className="font-mono">{results.length}</span> document{results.length !== 1 ? 's' : ''} found
              </p>
              {results.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className="w-full rounded-md border border-line p-4 text-left transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {doc.title}
                      </p>
                      {doc.preview && (
                        <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                          {doc.preview}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {doc.type && (
                          <StatusBadge tone="neutral">{doc.type}</StatusBadge>
                        )}
                        {doc.owner && (
                          <StatusBadge tone="neutral">
                            <Building size={14} />
                            {doc.owner}
                          </StatusBadge>
                        )}
                        {doc.created_at && (
                          <StatusBadge tone="neutral">
                            <Calendar size={14} />
                            <span className="font-mono">{formatDate(doc.created_at)}</span>
                          </StatusBadge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!results.length && !error && searchQuery && !isSearching && (
            <div className="flex justify-center py-10">
              <p className="text-sm text-text-muted">Press Enter to search.</p>
            </div>
          )}

          {!results.length && !searchQuery && !isSearching && (
            <EmptyState
              className="py-8"
              icon={<Search size={24} />}
              title="Find a document"
              description="Enter a keyword above to search your documents."
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
