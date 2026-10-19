'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChannelData, VideoItem } from '@/lib/innertube/types';
import { VideoCard } from './VideoCard';
import { CheckCircle2, X, Users, Film, Radio, Layers } from 'lucide-react';

interface ChannelModalProps {
  channelId: string | null;
  onClose: () => void;
}

export function ChannelModal({ channelId, onClose }: ChannelModalProps) {
  const [data, setData] = useState<ChannelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!channelId) return;
    let isCancelled = false;

    fetch(`/api/channel/${channelId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res: ChannelData) => {
        if (isCancelled) return;
        if (res) {
          setData(res);
          if (res.activeTabContent?.tabId) {
            setActiveTab(res.activeTabContent.tabId);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load channel:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [channelId]);

  if (!channelId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0e1117]/95 backdrop-blur-xl flex flex-col overflow-y-auto animate-in fade-in duration-200">
      {/* Top Bar with Close button */}
      <div className="sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-[#0e1117]/90 backdrop-blur-md border-b border-[#212737]">
        <div className="font-semibold text-sm text-white truncate max-w-sm">
          {data?.title || 'Channel Profile'}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#191e2a] text-[#9da4b6] hover:text-white transition-colors"
          aria-label="Close channel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="w-10 h-10 rounded-full border-4 border-[#ff6f43]/30 border-t-[#ff6f43] animate-spin mb-3" />
          <p className="text-xs text-[#9da4b6]">Loading Channel...</p>
        </div>
      ) : data ? (
        <div className="max-w-6xl w-full mx-auto pb-16">
          {/* Channel Banner */}
          {data.banner && (
            <div className="relative w-full h-32 md:h-52 bg-[#191e2a] overflow-hidden">
              <Image
                src={data.banner}
                alt={data.title}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
                unoptimized
              />
            </div>
          )}

          {/* Channel Info Header */}
          <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#212737]">
            <div className="flex items-start md:items-center gap-4">
              <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden bg-[#212737] border-2 border-[#ff6f43] flex-shrink-0 shadow-lg">
                <Image
                  src={data.avatar}
                  alt={data.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl md:text-2xl font-bold text-white">{data.title}</h1>
                  {data.isVerified && (
                    <CheckCircle2 className="w-5 h-5 text-[#77b8ff] fill-[#77b8ff]/20" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[#9da4b6] mt-1">
                  {data.handle && <span className="font-medium text-white/80">{data.handle}</span>}
                  {data.subscribers && (
                    <>
                      <span>·</span>
                      <span>{data.subscribers}</span>
                    </>
                  )}
                  {data.videoCount && (
                    <>
                      <span>·</span>
                      <span>{data.videoCount}</span>
                    </>
                  )}
                </div>

                {data.description && (
                  <p className="text-xs text-[#9da4b6] line-clamp-2 mt-2 max-w-2xl">
                    {data.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsSubscribed(!isSubscribed)}
              className={`px-6 py-2.5 rounded-full text-xs font-semibold self-start md:self-center transition-all ${
                isSubscribed
                  ? 'bg-[#212737] text-[#e5e8f0] border border-[#3c4355]'
                  : 'bg-[#ff6f43] text-black hover:bg-[#ff8a65] shadow-md shadow-[#ff6f43]/20'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {/* Channel Tabs */}
          <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-b border-[#212737] overflow-x-auto">
            {['videos', 'shorts', 'about'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? 'bg-[#ff6f43] text-black font-semibold'
                    : 'bg-[#191e2a] text-[#9da4b6] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Videos Grid */}
          <div className="p-4 md:p-6">
            {activeTab === 'videos' && (
              <div>
                {data.activeTabContent?.videos?.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#9da4b6]">
                    No videos available for this channel.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {data.activeTabContent?.videos
                      ?.filter((v) => v.type === 'video')
                      .map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shorts' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {data.activeTabContent?.videos
                  ?.filter((v) => v.type === 'short')
                  .map((short) => (
                    <div
                      key={short.id}
                      className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#131720] shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                      <Image
                        src={short.thumbnail}
                        alt={short.title}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                        <p className="text-xs font-medium text-white line-clamp-2">
                          {short.title}
                        </p>
                        {short.views && (
                          <span className="text-[10px] text-[#9da4b6] mt-0.5">{short.views}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="p-4 rounded-2xl bg-[#191e2a] max-w-2xl text-xs text-[#e5e8f0] leading-relaxed">
                <h3 className="font-semibold text-white mb-2 text-sm">About {data.title}</h3>
                <p className="whitespace-pre-wrap">{data.description || 'No detailed bio available.'}</p>
                <div className="mt-4 pt-3 border-t border-[#2d3446] space-y-1 text-[#9da4b6]">
                  {data.subscribers && <div>Subscribers: {data.subscribers}</div>}
                  {data.videoCount && <div>Total Videos: {data.videoCount}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
