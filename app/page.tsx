'use client';

import React, { useState } from 'react';
import { PlayerProvider, usePlayer } from '@/lib/player-context';
import { NavigationRail } from '@/components/Navigation';
import { HomeFeed } from '@/components/HomeFeed';
import { ShortsFeed } from '@/components/ShortsFeed';
import { QueueView } from '@/components/QueueView';
import { WatchView } from '@/components/WatchView';
import { MiniPlayer } from '@/components/MiniPlayer';
import { ChannelModal } from '@/components/ChannelModal';
import { PlaylistModal } from '@/components/PlaylistModal';
import { SearchBar } from '@/components/SearchBar';
import { Tv, Music2, Radio, PlayCircle } from 'lucide-react';

function MainApp() {
  const { currentMedia, isExpanded, setIsExpanded, queue } = usePlayer();

  const [currentView, setCurrentView] = useState<'videos' | 'music' | 'shorts' | 'queue'>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('video');
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [isAlbumMode, setIsAlbumMode] = useState(false);

  const handleSearch = (q: string, type: string) => {
    setSearchQuery(q);
    setSearchType(type);
    if (type === 'music') {
      setCurrentView('music');
    } else if (type === 'shorts') {
      setCurrentView('shorts');
    } else {
      setCurrentView('videos');
    }
  };

  const handleOpenPlaylist = (id: string, isAlbum: boolean) => {
    setActivePlaylistId(id);
    setIsAlbumMode(isAlbum);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0e1117] text-[#e5e8f0]">
      {/* Top App Bar Header */}
      <header className="sticky top-0 z-30 h-16 px-3 md:px-6 bg-[#0e1117]/90 backdrop-blur-xl border-b border-[#212737] flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          onClick={() => {
            setSearchQuery('');
            setCurrentView('videos');
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff6f43] to-[#ff9e80] flex items-center justify-center shadow-lg shadow-[#ff6f43]/20">
            <PlayCircle className="w-5 h-5 text-black fill-black/20" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-base tracking-tight text-white">
              Prism
            </span>
            <span className="ml-1 text-[11px] font-semibold text-[#ff6f43] uppercase tracking-wider">
              Stream
            </span>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-xl mx-2 md:mx-6">
          <SearchBar onSearch={handleSearch} activeType={searchType} />
        </div>

        {/* Video / Music Pivot Switch */}
        <div className="flex items-center p-1 bg-[#191e2a] rounded-full border border-[#2d3446] flex-shrink-0">
          <button
            onClick={() => {
              setCurrentView('videos');
              setSearchQuery('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentView === 'videos'
                ? 'bg-[#ff6f43] text-black shadow-md'
                : 'text-[#9da4b6] hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Videos</span>
          </button>
          <button
            onClick={() => {
              setCurrentView('music');
              setSearchQuery('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentView === 'music'
                ? 'bg-[#ff6f43] text-black shadow-md'
                : 'text-[#9da4b6] hover:text-white'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Music</span>
          </button>
        </div>
      </header>

      {/* Main Body with Nav Rail + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Rail for Desktop */}
        <NavigationRail
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setSearchQuery('');
          }}
          queueCount={queue.length}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {currentView === 'videos' && (
            <HomeFeed
              mode="videos"
              searchQuery={searchQuery}
              searchType={searchType}
              onChannelClick={setActiveChannelId}
              onPlaylistClick={handleOpenPlaylist}
            />
          )}

          {currentView === 'music' && (
            <HomeFeed
              mode="music"
              searchQuery={searchQuery}
              searchType={searchType}
              onChannelClick={setActiveChannelId}
              onPlaylistClick={handleOpenPlaylist}
            />
          )}

          {currentView === 'shorts' && (
            <ShortsFeed onChannelClick={setActiveChannelId} />
          )}

          {currentView === 'queue' && <QueueView />}
        </main>
      </div>

      {/* Floating Bottom Mini-Player Bar */}
      <MiniPlayer />

      {/* Fullscreen / Docked Watch View */}
      {isExpanded && (
        <WatchView
          onClose={() => setIsExpanded(false)}
          onChannelClick={setActiveChannelId}
        />
      )}

      {/* Channel Profile Modal */}
      {activeChannelId && (
        <ChannelModal
          channelId={activeChannelId}
          onClose={() => setActiveChannelId(null)}
        />
      )}

      {/* Playlist / Album Modal */}
      {activePlaylistId && (
        <PlaylistModal
          playlistId={activePlaylistId}
          isAlbum={isAlbumMode}
          onClose={() => setActivePlaylistId(null)}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <PlayerProvider>
      <MainApp />
    </PlayerProvider>
  );
}
