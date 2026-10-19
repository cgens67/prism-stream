'use client';

import React, { useState, useEffect } from 'react';
import { VideoItem, ShelfItem, PlaylistItem } from '@/lib/innertube/types';
import { VideoCard } from './VideoCard';
import { MusicCard } from './MusicCard';
import { Sparkles, Flame, RefreshCw, AlertCircle, ChevronRight, Music } from 'lucide-react';

interface HomeFeedProps {
  mode: 'videos' | 'music';
  searchQuery?: string;
  searchType?: string;
  onChannelClick?: (channelId: string) => void;
  onPlaylistClick?: (playlistId: string, isAlbum: boolean) => void;
}

export function HomeFeed({
  mode,
  searchQuery,
  searchType,
  onChannelClick,
  onPlaylistClick,
}: HomeFeedProps) {
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [continuation, setContinuation] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState('All');

  const tags = mode === 'videos'
    ? ['All', 'Trending', 'Gaming', 'Tech', 'Music', 'Podcasts', 'News', 'Education']
    : ['All', 'Charts', 'Trending Hits', 'Chill', 'Workout', 'Hip-Hop', 'Electronic', 'Rock'];

  // Load Feed Data
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let endpoint = `/api/home?type=${mode === 'music' ? 'music' : 'video'}`;

        if (searchQuery) {
          endpoint = `/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType || 'video'}`;
        } else if (selectedTag !== 'All') {
          endpoint = `/api/search?q=${encodeURIComponent(selectedTag)}&type=${mode === 'music' ? 'music' : 'video'}`;
        }

        const res = await fetch(endpoint);
        if (!res.ok) {
          throw new Error(`Failed to load content (${res.status})`);
        }

        const data = await res.json();
        if (isCancelled) return;

        if (searchQuery || selectedTag !== 'All') {
          // Search response
          setVideoItems((data.items || []).filter((i: any) => i.type !== 'album' && i.type !== 'playlist'));
          setShelves([]);
          setContinuation(data.continuation);
        } else if (mode === 'music') {
          setShelves(data.shelves || []);
          setVideoItems([]);
          setContinuation(data.continuation);
        } else {
          // Video Home
          setVideoItems(data.items || []);
          setShelves(data.shelves || []);
          setContinuation(data.continuation);
        }

        setIsLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Feed loading error:', err);
          setError(err.message || 'Could not connect to InnerTube stream');
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [mode, searchQuery, searchType, selectedTag]);

  // Load Continuation / Pagination
  const handleLoadMore = async () => {
    if (!continuation || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const endpoint = searchQuery
        ? `/api/search?q=${encodeURIComponent(searchQuery)}&continuation=${encodeURIComponent(continuation)}`
        : `/api/home?type=${mode === 'music' ? 'music' : 'video'}&continuation=${encodeURIComponent(continuation)}`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length > 0) {
          setVideoItems((prev) => [...prev, ...data.items]);
        }
        if (data.shelves?.length > 0) {
          setShelves((prev) => [...prev, ...data.shelves]);
        }
        setContinuation(data.continuation);
      }
    } catch (e) {
      console.warn('Continuation error', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-3 md:p-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Interactive Category Chips Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar select-none">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-95 min-h-[38px] ${
              selectedTag === tag
                ? 'bg-[#ff6f43] text-black font-semibold shadow-md shadow-[#ff6f43]/20'
                : 'bg-[#191e2a] text-[#9da4b6] hover:text-white hover:bg-[#212737]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Search Header indicator */}
      {searchQuery && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm md:text-base font-semibold text-white">
            Results for <span className="text-[#ff6f43]">&ldquo;{searchQuery}&rdquo;</span>
          </h2>
        </div>
      )}

      {/* Loading Skeleton States */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-2 rounded-2xl bg-[#191e2a]/30 animate-pulse">
              <div className="w-full aspect-video rounded-2xl bg-[#212737]" />
              <div className="flex gap-3 mt-2 px-1">
                <div className="w-9 h-9 rounded-full bg-[#212737] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-3.5 bg-[#212737] rounded" />
                  <div className="w-1/2 h-2.5 bg-[#212737] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-8 my-8 rounded-2xl bg-[#191e2a] border border-[#2d3446] text-center max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-[#ff6f43] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">Failed to load media</h3>
          <p className="text-xs text-[#9da4b6] mb-4">{error}</p>
          <button
            onClick={() => setSelectedTag(selectedTag)}
            className="px-4 py-2 rounded-full bg-[#ff6f43] text-black text-xs font-semibold hover:bg-[#ff8a65] inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Video Grid Feed */}
      {!isLoading && !error && videoItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videoItems.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onChannelClick={onChannelClick}
            />
          ))}
        </div>
      )}

      {/* Shelves (Shorts shelves or Music shelves) */}
      {!isLoading && !error && shelves.length > 0 && (
        <div className="space-y-8 mt-6">
          {shelves.map((shelf, sIdx) => (
            <div key={sIdx} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                    {shelf.title}
                  </h3>
                  {shelf.subtitle && (
                    <p className="text-xs text-[#9da4b6]">{shelf.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Horizontal Scroll Carousel */}
              <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar">
                {shelf.items.map((item) => (
                  <MusicCard
                    key={item.id}
                    item={item}
                    onPlaylistClick={onPlaylistClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && videoItems.length === 0 && shelves.length === 0 && (
        <div className="py-16 text-center text-xs text-[#9da4b6]">
          No media found for this section.
        </div>
      )}

      {/* Pagination / Continuation */}
      {continuation && !isLoading && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 rounded-full bg-[#191e2a] hover:bg-[#212737] text-xs font-semibold text-white border border-[#2d3446] transition-all flex items-center gap-2"
          >
            {isLoadingMore ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Loading More Content...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
