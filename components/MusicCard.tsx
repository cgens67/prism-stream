'use client';

import React from 'react';
import Image from 'next/image';
import { VideoItem, PlaylistItem } from '@/lib/innertube/types';
import { usePlayer } from '@/lib/player-context';
import { Play, Disc, ListMusic } from 'lucide-react';

interface MusicCardProps {
  item: VideoItem | PlaylistItem;
  onPlaylistClick?: (id: string, isAlbum: boolean) => void;
}

export function MusicCard({ item, onPlaylistClick }: MusicCardProps) {
  const { playMedia } = usePlayer();

  const isSong = item.type === 'song';
  const isAlbum = item.type === 'album';

  const handleClick = () => {
    if (isSong) {
      playMedia(
        {
          id: item.id,
          title: item.title,
          author: item.author?.name || 'Artist',
          thumbnail: item.thumbnail,
          type: 'song',
          isAudioOnly: true,
        },
        { immediate: true, expand: true }
      );
    } else {
      onPlaylistClick?.(item.id, isAlbum);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group flex-shrink-0 w-44 md:w-48 p-2 rounded-2xl cursor-pointer hover:bg-[#191e2a]/80 transition-all duration-200"
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#131720] shadow-sm group-hover:shadow-lg transition-transform duration-200 group-hover:scale-[1.02]">
        <Image
          src={item.thumbnail || 'https://picsum.photos/seed/album/300/300'}
          alt={item.title}
          fill
          sizes="192px"
          className="object-cover"
          referrerPolicy="no-referrer"
          unoptimized
        />

        {/* Squircle Play Overlay */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-[18px] bg-[#ff6f43] text-black flex items-center justify-center shadow-xl transform transition-transform group-hover:scale-110">
            <Play className="w-5 h-5 fill-black ml-0.5" />
          </div>
        </div>

        {/* Type indicator for Album/Playlist */}
        {!isSong && (
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-[#cfe5ff]">
            {isAlbum ? <Disc className="w-3.5 h-3.5" /> : <ListMusic className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        <h4 className="text-sm font-medium text-[#e5e8f0] truncate group-hover:text-[#ffdbd1] transition-colors">
          {item.title}
        </h4>
        <p className="text-xs text-[#9da4b6] truncate mt-0.5">
          {item.author?.name || (isAlbum ? 'Album' : 'Playlist')}
        </p>
      </div>
    </div>
  );
}
