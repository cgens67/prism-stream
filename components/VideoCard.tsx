'use client';

import React from 'react';
import Image from 'next/image';
import { VideoItem } from '@/lib/innertube/types';
import { usePlayer } from '@/lib/player-context';
import { CheckCircle2, MoreVertical, Play, Plus, Radio } from 'lucide-react';

interface VideoCardProps {
  video: VideoItem;
  onChannelClick?: (channelId: string) => void;
}

export function VideoCard({ video, onChannelClick }: VideoCardProps) {
  const { playMedia, addToQueue } = usePlayer();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handlePlay = (audioOnly = false) => {
    playMedia(
      {
        id: video.id,
        title: video.title,
        author: video.author.name,
        authorId: video.author.id,
        avatar: video.author.avatar,
        thumbnail: video.thumbnail,
        durationSeconds: video.durationSeconds,
        type: video.type === 'song' ? 'song' : 'video',
        isAudioOnly: audioOnly,
      },
      { immediate: true, expand: true }
    );
  };

  return (
    <div className="group flex flex-col relative rounded-2xl p-2 transition-all duration-200 hover:bg-[#191e2a]/70">
      {/* Thumbnail Container */}
      <div
        onClick={() => handlePlay(false)}
        className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#131720] cursor-pointer shadow-sm group-hover:shadow-md transition-transform duration-200 group-hover:scale-[1.01]"
      >
        <Image
          src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-opacity duration-300"
          referrerPolicy="no-referrer"
          unoptimized
        />

        {/* Play Overlay Icon on Hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#ff6f43] text-black flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
            <Play className="w-6 h-6 fill-black ml-0.5" />
          </div>
        </div>

        {/* Duration / Live Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-medium text-white tracking-wide">
            {video.type === 'live' ? (
              <span className="flex items-center gap-1 text-[#ff4f4f] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4f4f] animate-pulse" />
                LIVE
              </span>
            ) : (
              video.duration
            )}
          </div>
        )}
      </div>

      {/* Metadata Section */}
      <div className="flex gap-3 mt-3 items-start px-1">
        {/* Channel Avatar */}
        {video.author.avatar ? (
          <button
            onClick={() => video.author.id && onChannelClick?.(video.author.id)}
            className="flex-shrink-0 relative w-9 h-9 rounded-full overflow-hidden bg-[#212737] hover:ring-2 hover:ring-[#ff6f43] transition-all"
            aria-label={`View channel ${video.author.name}`}
          >
            <Image
              src={video.author.avatar}
              alt={video.author.name}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
              unoptimized
            />
          </button>
        ) : (
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#212737] flex items-center justify-center text-xs font-semibold text-[#ffdbd1]">
            {video.author.name ? video.author.name.charAt(0).toUpperCase() : 'V'}
          </div>
        )}

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <h3
            onClick={() => handlePlay(false)}
            className="text-[14px] font-medium text-[#e5e8f0] line-clamp-2 leading-snug cursor-pointer hover:text-[#ffdbd1] transition-colors"
            title={video.title}
          >
            {video.title}
          </h3>

          {/* Author Name */}
          <div className="flex items-center gap-1 mt-1 text-xs text-[#9da4b6]">
            <button
              onClick={() => video.author.id && onChannelClick?.(video.author.id)}
              className="hover:text-white transition-colors truncate font-normal"
            >
              {video.author.name}
            </button>
            {video.author.isVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#77b8ff] fill-[#77b8ff]/20 flex-shrink-0" />
            )}
          </div>

          {/* Unboxed Metadata with Typographic Separator */}
          <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-[#9da4b6]/80">
            {video.views && <span>{video.views}</span>}
            {video.views && video.publishedTime && <span aria-hidden="true">·</span>}
            {video.publishedTime && <span>{video.publishedTime}</span>}
          </div>
        </div>

        {/* More Actions Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 -mr-1 rounded-full text-[#9da4b6] hover:text-white hover:bg-[#212737] transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-30 w-44 py-1.5 bg-[#212737] border border-[#2d3446] rounded-xl shadow-xl backdrop-blur-md"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue({
                    id: video.id,
                    title: video.title,
                    author: video.author.name,
                    thumbnail: video.thumbnail,
                    type: video.type === 'song' ? 'song' : 'video',
                  });
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-[#e5e8f0] hover:bg-[#2b3347] flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-[#ff6f43]" />
                Add to Queue
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(true);
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-[#e5e8f0] hover:bg-[#2b3347] flex items-center gap-2"
              >
                <Radio className="w-3.5 h-3.5 text-[#77b8ff]" />
                Stream Audio Only
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
