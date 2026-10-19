'use client';

import React from 'react';
import Image from 'next/image';
import { usePlayer } from '@/lib/player-context';
import { Play, Pause, SkipForward, X, ChevronUp, Radio } from 'lucide-react';

export function MiniPlayer() {
  const {
    currentMedia,
    isPlaying,
    currentTime,
    duration,
    isAudioOnly,
    isExpanded,
    togglePlay,
    nextTrack,
    setIsExpanded,
    pause,
    playMedia,
  } = usePlayer();

  if (!currentMedia || isExpanded) return null;

  const progressFraction = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleExpand = () => {
    setIsExpanded(true);
  };

  return (
    <div
      onClick={handleExpand}
      className="fixed bottom-[68px] md:bottom-4 left-3 right-3 md:left-auto md:right-6 md:w-[420px] z-40 bg-[#191e2a]/95 backdrop-blur-xl border border-[#2d3446] rounded-2xl shadow-2xl overflow-hidden cursor-pointer group hover:bg-[#212737] transition-all duration-200 select-none animate-in slide-in-from-bottom-4"
    >
      {/* Top micro progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-[#ff6f43] transition-all duration-100"
          style={{ width: `${progressFraction}%` }}
        />
      </div>

      <div className="flex items-center gap-3 p-2.5">
        {/* Animated mini thumbnail / Album Art */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#131720] flex-shrink-0 shadow-md">
          <Image
            src={currentMedia.thumbnail}
            alt={currentMedia.title}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
            unoptimized
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[#ff6f43] animate-ping" />
            </div>
          )}
        </div>

        {/* Title and author */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            {isAudioOnly && (
              <Radio className="w-3 h-3 text-[#ff6f43] flex-shrink-0" />
            )}
            <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#ffdbd1] transition-colors">
              {currentMedia.title}
            </h4>
          </div>
          <p className="text-[11px] text-[#9da4b6] truncate mt-0.5">
            {currentMedia.author}
          </p>
        </div>

        {/* Action Controls */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-[#ff6f43] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            className="p-2 rounded-full text-[#9da4b6] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Expand Button */}
          <button
            onClick={handleExpand}
            className="p-2 rounded-full text-[#9da4b6] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Expand player"
          >
            <ChevronUp className="w-4 h-4 text-[#ff6f43]" />
          </button>
        </div>
      </div>
    </div>
  );
}
