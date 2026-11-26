import { useState, useRef, useEffect } from 'react';
import { Search, Upload, MoreVertical, Loader2 } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/PageHeader';
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
    <PageHeader
      title="Dashboard"
      actions={
        <>
          {/* Search bar */}
          <div className="relative w-72 max-w-full" ref={searchRef}>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              type="search"
              placeholder="Search documents"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
              aria-label="Search documents by name, department or content"
              className="px-9"
            />
            {isSearching && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-text-muted" />
            )}

            {/* Search results dropdown */}
            {showResults && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-line bg-surface-1 shadow-raised">
                {searchResults.length > 0 ? (
                  <ul className="max-h-96 divide-y divide-line overflow-y-auto">
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => handleResultClick(result.id)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                        >
                          <span className="block min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-text-primary">{result.title}</span>
                            {result.department && (
                              <span className="mt-0.5 block text-xs text-text-muted">{result.department}</span>
                            )}
                          </span>
                          {result.lastAccessedAt && (
                            <span className="ml-2 whitespace-nowrap text-xs text-text-muted">
                              {dayjs(result.lastAccessedAt).fromNow()}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : searchQuery.trim() ? (
                  <p className="px-4 py-8 text-center text-sm text-text-muted">
                    No documents found for "{searchQuery}"
                  </p>
                ) : (
                  <div className="p-2">
                    {recentSearches.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-[.04em] text-text-muted">Recent searches</p>
                        {recentSearches.map((search) => (
                          <button
                            type="button"
                            key={search}
                            onClick={() => handleSearchChange(search)}
                            className="w-full rounded-inner px-2 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-2"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    )}
                    {recentSearches.length === 0 && (
                      <p className="px-2 py-2 text-xs text-text-muted">Type to search</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <Button onClick={onUploadClick}>
            <Upload size={16} />
            Upload document
          </Button>

          {/* Menu */}
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreVertical size={18} />
          </Button>
        </>
      }
    />
  );
}
