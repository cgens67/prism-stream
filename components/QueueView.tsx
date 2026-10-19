'use client';

import React from 'react';
import Image from 'next/image';
import { usePlayer } from '@/lib/player-context';
import { Play, Trash2, ListMusic, Music, Radio } from 'lucide-react';

export function QueueView() {
  const { queue, queueIndex, playMedia, setQueueList } = usePlayer();

  const handlePlayIndex = (index: number) => {
    setQueueList(queue, index);
  };

  const handleClear = () => {
    setQueueList([]);
  };

  return (
    <div className="w-full flex-1 max-w-4xl mx-auto p-4 md:p-8 pb-24">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#212737]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ff6f43]/20 text-[#ff6f43] flex items-center justify-center">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Playback Queue</h1>
            <p className="text-xs text-[#9da4b6]">
              {queue.length} {queue.length === 1 ? 'item' : 'items'} in queue
            </p>
          </div>
        </div>

        {queue.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#191e2a] hover:bg-[#212737] text-xs text-[#9da4b6] hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Queue</span>
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="py-20 text-center text-xs text-[#9da4b6] bg-[#191e2a]/40 rounded-3xl border border-[#212737] p-8">
          <Music className="w-10 h-10 text-[#9da4b6]/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">Queue is empty</h3>
          <p>Add songs or videos to your queue from the browse feeds.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((item, idx) => {
            const isCurrent = idx === queueIndex;

            return (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => handlePlayIndex(idx)}
                className={`flex items-center gap-3.5 p-2.5 rounded-2xl cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-[#5d1a04]/40 border border-[#ff6f43]/40'
                    : 'hover:bg-[#191e2a] border border-transparent'
                }`}
              >
                <div className="w-6 text-center text-xs font-mono font-medium text-[#9da4b6]">
                  {isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-[#ff6f43] inline-block animate-pulse" />
                  ) : (
                    idx + 1
                  )}
                </div>

                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#131720] flex-shrink-0">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                  {isCurrent && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-[#ff6f43] text-[#ff6f43]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-xs font-medium truncate ${
                      isCurrent ? 'text-[#ffdbd1] font-semibold' : 'text-white'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#9da4b6] truncate mt-0.5">
                    {item.author}
                  </p>
                </div>

                {item.isAudioOnly && (
                  <span className="px-2 py-0.5 rounded-md bg-[#1c3652] text-[#77b8ff] text-[10px] font-medium flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    Audio
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
