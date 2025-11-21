'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useApiRequest } from '@/lib/hooks/useApiRequest';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  type: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data, loading, request } = useApiRequest<SearchResponse>();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        request(`/api/search?q=${encodeURIComponent(query)}`);
        setIsOpen(true);
        setSelectedIndex(-1);
      } else {
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, request]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!data?.results || data.results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < data.results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < data.results.length) {
          handleResultClick(data.results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    router.push(result.url);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-primary px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      course: 'Course',
      service: 'Service',
      offer: 'Offer',
      faq: 'FAQ',
      contact: 'Contact',
      newsletter: 'Subscriber',
      review: 'Review',
      testimonial: 'Testimonial'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      course: 'bg-blue-100 text-blue-800',
      service: 'bg-green-100 text-green-800',
      offer: 'bg-purple-100 text-purple-800',
      faq: 'bg-orange-100 text-orange-800',
      contact: 'bg-red-100 text-red-800',
      newsletter: 'bg-indigo-100 text-indigo-800',
      review: 'bg-pink-100 text-pink-800',
      testimonial: 'bg-teal-100 text-teal-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search everything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (data?.results && data.results.length > 0) {
              setIsOpen(true);
            }
          }}
          className="w-64 pl-10 pr-4"
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {isOpen && data?.results && data.results.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full bg-secondary border border-theme rounded-md shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search results"
        >
          <div className="p-2">
            <div className="text-xs text-primary mb-2 px-2">
              {data.total > data.results.length
                ? `Showing ${data.results.length} of ${data.total} results`
                : `${data.results.length} result${data.results.length !== 1 ? 's' : ''}`
              }
            </div>
            {data.results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                id={`search-result-${index}`}
                onClick={() => handleResultClick(result)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  index === selectedIndex
                    ? 'bg-primary text-secondary'
                    : 'hover:bg-primary hover:bg-opacity-10'
                }`}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}
                      >
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-primary truncate">
                      {highlightText(result.title, query)}
                    </div>
                    <div className="text-xs text-primary opacity-75 truncate mt-1">
                      {highlightText(result.description, query)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {data.total > data.results.length && (
            <div className="border-t border-theme p-2">
              <div className="text-xs text-primary opacity-60 text-center">
                Use more specific search terms for better results
              </div>
            </div>
          )}
        </div>
      )}

      {isOpen && query.length >= 2 && !loading && (!data?.results || data.results.length === 0) && (
        <div className="absolute z-50 mt-1 w-full bg-secondary border border-theme rounded-md shadow-lg">
          <div className="p-4 text-center text-primary opacity-60">
            No results found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}