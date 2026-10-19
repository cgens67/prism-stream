'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/lib/player-context';
import { Play, X, Disc, Clock, Music } from 'lucide-react';

interface PlaylistModalProps {
  playlistId: string | null;
  isAlbum?: boolean;
  onClose: () => void;
}

export function PlaylistModal({ playlistId, isAlbum = false, onClose }: PlaylistModalProps) {
  const { setQueueList } = usePlayer();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!playlistId) return;
    let isCancelled = false;

    const endpoint = isAlbum ? `/api/album/${playlistId}` : `/api/playlist/${playlistId}`;
    fetch(endpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!isCancelled) {
          if (res) setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load playlist:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [playlistId, isAlbum]);

  if (!playlistId) return null;

  const handlePlayAll = () => {
    if (!data?.tracks?.length) return;
    const playerItems = data.tracks.map((t: any) => ({
      id: t.id,
      title: t.title,
      author: t.author?.name || data.author || 'Artist',
      thumbnail: t.thumbnail || data.thumbnail,
      durationSeconds: t.durationSeconds,
      type: 'song',
      isAudioOnly: isAlbum,
    }));
    setQueueList(playerItems, 0);
    onClose();
  };

  const handlePlayTrack = (index: number) => {
    if (!data?.tracks?.length) return;
    const playerItems = data.tracks.map((t: any) => ({
      id: t.id,
      title: t.title,
      author: t.author?.name || data.author || 'Artist',
      thumbnail: t.thumbnail || data.thumbnail,
      durationSeconds: t.durationSeconds,
      type: 'song',
      isAudioOnly: isAlbum,
    }));
    setQueueList(playerItems, index);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0e1117]/95 backdrop-blur-xl flex flex-col overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-[#0e1117]/90 backdrop-blur-md border-b border-[#212737]">
        <div className="font-semibold text-sm text-white truncate max-w-sm">
          {data?.title || (isAlbum ? 'Album' : 'Playlist')}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#191e2a] text-[#9da4b6] hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="w-10 h-10 rounded-full border-4 border-[#ff6f43]/30 border-t-[#ff6f43] animate-spin mb-3" />
          <p className="text-xs text-[#9da4b6]">Loading {isAlbum ? 'Album' : 'Playlist'}...</p>
        </div>
      ) : data ? (
        <div className="max-w-4xl w-full mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
            <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-2xl bg-[#191e2a] flex-shrink-0">
              <Image
                src={data.thumbnail || 'https://picsum.photos/seed/album/400/400'}
                alt={data.title}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
                unoptimized
              />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#ff6f43] mb-1">
                {isAlbum ? 'Album' : 'Playlist'}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                {data.title}
              </h1>
              <div className="text-sm text-[#9da4b6] flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span>{data.author}</span>
                {data.year && (
                  <>
                    <span>·</span>
                    <span>{data.year}</span>
                  </>
                )}
                {data.totalTracks > 0 && (
                  <>
                    <span>·</span>
                    <span>{data.totalTracks} tracks</span>
                  </>
                )}
              </div>

              {/* Play All button */}
              <div className="mt-5 flex items-center justify-center md:justify-start gap-3">
                <button
                  onClick={handlePlayAll}
                  className="px-6 py-3 rounded-full bg-[#ff6f43] text-black font-semibold text-xs flex items-center gap-2 shadow-lg shadow-[#ff6f43]/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Play All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tracks List */}
          <div className="bg-[#191e2a]/50 rounded-2xl border border-[#212737] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#212737] text-[11px] font-semibold text-[#9da4b6] uppercase tracking-wider grid grid-cols-12">
              <span className="col-span-1">#</span>
              <span className="col-span-8 md:col-span-9">Title</span>
              <span className="col-span-3 md:col-span-2 text-right">Duration</span>
            </div>

            <div className="divide-y divide-[#212737]/60">
              {data.tracks?.map((track: any, index: number) => (
                <div
                  key={track.id || index}
                  onClick={() => handlePlayTrack(index)}
                  className="px-4 py-3 hover:bg-[#212737]/80 cursor-pointer group grid grid-cols-12 items-center text-xs text-[#e5e8f0] transition-colors"
                >
                  <div className="col-span-1 font-mono text-[#9da4b6] group-hover:text-white">
                    <span className="group-hover:hidden">{index + 1}</span>
                    <Play className="w-3.5 h-3.5 fill-[#ff6f43] text-[#ff6f43] hidden group-hover:inline-block" />
                  </div>

                  <div className="col-span-8 md:col-span-9 pr-2">
                    <div className="font-medium text-white group-hover:text-[#ffdbd1] truncate">
                      {track.title}
                    </div>
                    <div className="text-[11px] text-[#9da4b6] truncate mt-0.5">
                      {track.author?.name || data.author}
                    </div>
                  </div>

                  <div className="col-span-3 md:col-span-2 text-right font-mono text-[#9da4b6]">
                    {track.duration || '0:00'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
