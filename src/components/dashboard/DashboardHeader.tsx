import { useState, useRef, useEffect } from 'react';
import { Search, Upload, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface SearchResult {
  id: string;
  title: string;
  department?: string;
  lastAccessedAt?: Date;
}

interface DashboardHeaderProps {
  onUploadClick: () => void;
  recentSearches?: string[];
  onSearch?: (query: string) => Promise<SearchResult[]>;
}

export function DashboardHeader({ onUploadClick, recentSearches = [], onSearch }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      if (onSearch) {
        const results = await onSearch(query);
        setSearchResults(results);
      }
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (documentId: string) => {
    navigate(`/admin/documents/${documentId}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200/50 shadow-premium-sm">
      <div className="px-8 py-5">
        <div className="flex items-center justify-between gap-6">
          {/* Search Bar */}
          <div className="flex-1 relative max-w-md" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
              <input
                type="search"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                aria-label="Search documents by name, department, or content"
                className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-slate-900 placeholder:text-slate-500"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200/50 rounded-xl shadow-premium-lg z-50 overflow-hidden animate-fade-in-up">
                {searchResults.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors ${idx !== searchResults.length - 1 ? 'border-b border-slate-100' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                            {result.department && (
                              <p className="text-xs text-slate-500 mt-1">{result.department}</p>
                            )}
                          </div>
                          {result.lastAccessedAt && (
                            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                              {dayjs(result.lastAccessedAt).fromNow()}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="px-4 py-8 text-center text-slate-500 text-sm">
                    No documents found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="px-4 py-4">
                    {recentSearches.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wider">Recent Searches</p>
                        <div className="space-y-1">
                          {recentSearches.map((search) => (
                            <button
                              key={search}
                              onClick={() => handleSearchChange(search)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100/50 rounded-lg transition-colors"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {recentSearches.length === 0 && (
                      <p className="text-xs text-slate-400">Start typing to search...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <Button
            onClick={onUploadClick}
            variant="tenantPrimary"
            className="gap-2 shadow-premium-md hover:shadow-premium-lg transition-all hover:scale-105 active:scale-95"
            aria-label="Upload a new document"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          {/* Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
