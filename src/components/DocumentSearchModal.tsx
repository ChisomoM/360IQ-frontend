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
import {
  Search,
  Loader2,
  FileText,
  Building,
  Calendar,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Document } from '@/types/dms';

interface DocumentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (document: Document) => void;
}

const XTenantID = localStorage.getItem('X-Tenant-ID') || '';

export function DocumentSearchModal({
  isOpen,
  onClose,
  onSelect,
}: DocumentSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
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
      const response = await fetch('/api/v1/chat/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': XTenantID,
        },
        body: JSON.stringify({ search_query: query }),
      });

      if (!response.ok) {
        throw new Error('Failed to search documents');
      }

      const data = await response.json();
      setResults(data.data?.documents || []);
      if (!data.data?.documents || data.data.documents.length === 0) {
        setError('No documents found matching your search.');
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
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Search Documents
          </DialogTitle>
          <DialogDescription>
            Find documents using keywords. Results will be sorted by relevance.
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Input
            placeholder="Enter keyword to search (e.g., 'budget', 'contract', 'meeting')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery);
              }
            }}
            className="pl-10 h-11 border-blue-200 focus:ring-blue-500"
            autoFocus
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        </div>

        {/* Search Button */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleSearch(searchQuery)}
            disabled={isSearching || !searchQuery.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
          {searchQuery && (
            <Button
              variant="outline"
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
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
          {error && !results.length && (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-semibold px-2">
                {results.length} document{results.length !== 1 ? 's' : ''} found
              </p>
              {results.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDocument(doc)}
                  className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded flex-shrink-0 group-hover:bg-blue-200">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-blue-700">
                        {doc.title}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex gap-3 mt-2 flex-wrap">
                        {doc.document_type && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {doc.document_type}
                          </span>
                        )}
                        {doc.department_id && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            <Building className="h-3 w-3" />
                            {doc.department_id.slice(0, 8)}...
                          </span>
                        )}
                        {doc.created_at && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            <Calendar className="h-3 w-3" />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
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
              <p className="text-gray-500 text-sm">No results yet. Try adjusting your search.</p>
            </div>
          )}

          {!results.length && !searchQuery && !isSearching && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">Start searching for documents</p>
              <p className="text-gray-400 text-sm mt-1">
                Enter a keyword above to find documents
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
