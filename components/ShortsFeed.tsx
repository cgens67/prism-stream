'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { VideoItem } from '@/lib/innertube/types';
import { usePlayer } from '@/lib/player-context';
import {
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Compass,
} from 'lucide-react';

interface ShortsFeedProps {
  onChannelClick?: (channelId: string) => void;
}

export function ShortsFeed({ onChannelClick }: ShortsFeedProps) {
  const [shorts, setShorts] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sequenceParams, setSequenceParams] = useState<string | undefined>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likesState, setLikesState] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load initial shorts sequence
  useEffect(() => {
    fetch('/api/reel/sequence')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items?.length) {
          setShorts(data.items);
          if (data.sequenceParams) setSequenceParams(data.sequenceParams);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load shorts sequence:', err);
        setIsLoading(false);
      });
  }, []);

  // Intersection observer to track which short is currently centered
  const handleScroll = () => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    const scrollTop = containerRef.current.scrollTop;
    const current = Math.round(scrollTop / height);
    if (current !== activeIndex && current >= 0 && current < shorts.length) {
      setActiveIndex(current);
    }
  };

  const toggleLike = (id: string) => {
    setLikesState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isLoading && shorts.length === 0) {
    return (
      <div className="w-full h-[calc(100dvh-64px)] flex items-center justify-center bg-[#0e1117]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#ff6f43]/20 border-t-[#ff6f43] animate-spin" />
          <p className="text-xs text-[#9da4b6]">Loading Shorts Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-[calc(100dvh-64px)] overflow-y-auto shorts-container bg-black select-none"
    >
      {shorts.map((item, index) => {
        const isCurrent = index === activeIndex;
        const isLiked = !!likesState[item.id];

        return (
          <div
            key={item.id}
            className="shorts-item w-full h-[calc(100dvh-64px)] relative flex items-center justify-center bg-[#0a0c0f]"
          >
            {/* Short Background Image & Media preview */}
            <div className="relative w-full h-full max-w-[450px] aspect-[9/16] bg-[#12151c] overflow-hidden">
              <Image
                src={item.thumbnail || `https://i.ytimg.com/vi/${item.id}/maxresdefault.jpg`}
                alt={item.title}
                fill
                priority={index === 0}
                className="object-cover"
                referrerPolicy="no-referrer"
                unoptimized
              />

              {/* Gradient shading for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

              {/* Center Play indicator if not currently active */}
              {!isCurrent && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>
                </div>
              )}

              {/* Right Side Thumb-Friendly Floating Controls */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20">
                {/* Like Button */}
                <button
                  onClick={() => toggleLike(item.id)}
                  className="flex flex-col items-center group/btn active:scale-90 transition-transform"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                      isLiked
                        ? 'bg-[#ff6f43] text-black shadow-lg shadow-[#ff6f43]/30'
                        : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-black' : ''}`} />
                  </div>
                  <span className="text-[11px] font-medium text-white mt-1 drop-shadow">
                    {isLiked ? 'Liked' : 'Like'}
                  </span>
                </button>

                {/* Comments */}
                <button className="flex flex-col items-center group/btn active:scale-90 transition-transform">
                  <div className="w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-medium text-white mt-1 drop-shadow">
                    Comments
                  </span>
                </button>

                {/* Share */}
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(`https://www.youtube.com/shorts/${item.id}`);
                    }
                  }}
                  className="flex flex-col items-center group/btn active:scale-90 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-medium text-white mt-1 drop-shadow">
                    Share
                  </span>
                </button>

                {/* Mute toggle */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Bottom Creator & Title Overlay */}
              <div className="absolute bottom-4 left-4 right-16 z-20 text-white">
                {/* Author Info */}
                <div className="flex items-center gap-2 mb-2">
                  {item.author.avatar ? (
                    <button
                      onClick={() => item.author.id && onChannelClick?.(item.author.id)}
                      className="relative w-9 h-9 rounded-full overflow-hidden border border-white/30 flex-shrink-0"
                    >
                      <Image
                        src={item.author.avatar}
                        alt={item.author.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    </button>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#ff6f43] text-black font-bold flex items-center justify-center text-xs">
                      {item.author.name?.charAt(0) || 'S'}
                    </div>
                  )}
                  <button
                    onClick={() => item.author.id && onChannelClick?.(item.author.id)}
                    className="font-medium text-sm hover:underline drop-shadow"
                  >
                    @{item.author.name || 'creator'}
                  </button>
                </div>

                {/* Headline / Title */}
                <p className="text-xs md:text-sm font-normal line-clamp-2 leading-relaxed drop-shadow mb-2">
                  {item.title}
                </p>

                {/* Sound pivot banner */}
                <div className="flex items-center gap-1.5 text-xs text-[#cfe5ff]">
                  <Music2 className="w-3.5 h-3.5 animate-spin [animation-duration:8s]" />
                  <span className="truncate">Original Audio · {item.author.name}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
