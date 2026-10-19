'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, History, ArrowRight, Video, Music2, Film } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, type: string) => void;
  activeType: string;
}

export function SearchBar({ onSearch, activeType }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'video' | 'music' | 'shorts'>('video');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch real Google/YouTube suggestions as user types
  useEffect(() => {
    const q = query.trim();
    if (!q) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions) {
            setSuggestions(data.suggestions.slice(0, 8));
          }
        }
      } catch (err) {
        console.warn('Suggestions error:', err);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), selectedFilter);
      setIsFocused(false);
    }
  };

  const handleSelectSuggestion = (s: string) => {
    setQuery(s);
    onSearch(s, selectedFilter);
    setIsFocused(false);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Morphing Search Input Pill */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center w-full transition-all duration-200 ${
          isFocused
            ? 'bg-[#212737] rounded-3xl shadow-xl ring-2 ring-[#ff6f43]'
            : 'bg-[#191e2a] hover:bg-[#212737]/70 rounded-full'
        }`}
      >
        <div className="pl-4 text-[#9da4b6]">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search videos, music, artists, channels..."
          className="w-full py-2.5 pl-3 pr-10 bg-transparent text-xs md:text-sm text-white placeholder-[#9da4b6] focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="p-1.5 mr-2 text-[#9da4b6] hover:text-white rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown Suggestions Modal */}
      {isFocused && (
        <div className="absolute top-12 left-0 right-0 z-40 bg-[#212737] border border-[#2d3446] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Filter Buttons inside search */}
          <div className="flex items-center gap-1.5 p-2.5 border-b border-[#2d3446]/60 bg-[#191e2a]/60">
            <button
              type="button"
              onClick={() => setSelectedFilter('video')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedFilter === 'video'
                  ? 'bg-[#ff6f43] text-black font-semibold'
                  : 'bg-[#212737] text-[#9da4b6] hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Videos
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('music')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedFilter === 'music'
                  ? 'bg-[#ff6f43] text-black font-semibold'
                  : 'bg-[#212737] text-[#9da4b6] hover:text-white'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              Music
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('shorts')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedFilter === 'shorts'
                  ? 'bg-[#ff6f43] text-black font-semibold'
                  : 'bg-[#212737] text-[#9da4b6] hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Shorts
            </button>
          </div>

          {/* Real Google/InnerTube Autocomplete Suggestions */}
          {suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="flex items-center justify-between px-4 py-2.5 text-xs text-[#e5e8f0] hover:bg-[#2b3347] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Search className="w-3.5 h-3.5 text-[#9da4b6]" />
                    <span>{item}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-[#9da4b6] opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          ) : query ? (
            <div
              onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
              className="px-4 py-3 text-xs text-[#ff6f43] hover:bg-[#2b3347] cursor-pointer flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              Search for &quot;{query}&quot;
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-[#9da4b6] text-center">
              Type to see live suggestions from InnerTube
            </div>
          )}
        </div>
      )}
    </div>
  );
}
