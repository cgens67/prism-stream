'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { usePlayer } from '@/lib/player-context';
import { VideoWatchData, Chapter, VideoItem } from '@/lib/innertube/types';
import { HeatmapTimeline } from './HeatmapTimeline';
import { formatDuration } from '@/lib/innertube/parsers/utils';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  ChevronDown,
  ChevronUp,
  Radio,
  CheckCircle2,
  ThumbsUp,
  Share2,
  ListPlus,
  X,
  MessageSquare,
  BookmarkCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface WatchViewProps {
  onClose: () => void;
  onChannelClick?: (channelId: string) => void;
}

export function WatchView({ onClose, onChannelClick }: WatchViewProps) {
  const {
    currentMedia,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isAudioOnly,
    chapters,
    heatmap,
    activeQuality,
    availableQualities,
    captions,
    activeCaption,
    togglePlay,
    seekTo,
    setVolumeLevel,
    toggleMute,
    setRate,
    toggleAudioOnly,
    setIsDocked,
    setIsExpanded,
    playMedia,
    addToQueue,
    setQuality,
    setCaption,
    videoRef,
    audioRef,
  } = usePlayer();

  const [watchData, setWatchData] = useState<VideoWatchData | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<'related' | 'chapters' | 'chat'>('related');
  const [liveChatMessages, setLiveChatMessages] = useState<any[]>([]);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch watch metadata
  useEffect(() => {
    if (!currentMedia?.id) return;
    let isCancelled = false;

    fetch(`/api/watch/${currentMedia.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: VideoWatchData) => {
        if (isCancelled) return;
        if (data) {
          setWatchData(data);
          if (data.isLive) {
            setActiveTab('chat');
          }
        }
        setIsLoadingMetadata(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load watch data:', err);
          setIsLoadingMetadata(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentMedia?.id]);

  // Live chat polling
  useEffect(() => {
    if (!watchData?.liveChatContinuation) return;

    let token = watchData.liveChatContinuation;
    let isCancelled = false;

    const interval = setInterval(async () => {
      if (!token || isCancelled) return;
      try {
        const res = await fetch(`/api/live-chat/${token}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages?.length > 0) {
            setLiveChatMessages((prev) => [...prev.slice(-40), ...data.messages]);
          }
          if (data.continuation) {
            token = data.continuation;
          }
        }
      } catch (e) {
        console.warn('Live chat polling error', e);
      }
    }, 4000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [watchData?.liveChatContinuation]);

  // Hide player controls after inactivity
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3200);
  };

  const handleMinimize = () => {
    setIsExpanded(false);
    setIsDocked(true);
    onClose();
  };

  // Parse description text and make timestamps clickable!
  const renderInteractiveDescription = (text: string) => {
    if (!text) return null;
    const timestampRegex = /(\b(?:[0-5]?\d:)?[0-5]?\d:[0-5]\d\b)/g;
    const parts = text.split(timestampRegex);

    return parts.map((part, i) => {
      if (timestampRegex.test(part)) {
        const seconds = parseTimestampToSeconds(part);
        return (
          <button
            key={i}
            onClick={() => seekTo(seconds)}
            className="text-[#77b8ff] font-medium hover:underline inline-block px-1 rounded bg-[#1c3652]/40 mx-0.5"
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const parseTimestampToSeconds = (ts: string): number => {
    const parts = ts.trim().split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  if (!currentMedia) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0e1117] flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Bar inside Watch Screen */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#212737] bg-[#0e1117]/95 backdrop-blur-md z-20 flex-shrink-0">
        <button
          onClick={handleMinimize}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#191e2a] text-[#e5e8f0] text-sm font-medium transition-colors"
          aria-label="Minimize player"
        >
          <ChevronDown className="w-5 h-5 text-[#ff6f43]" />
          <span className="hidden sm:inline">Minimize to Mini-Player</span>
        </button>

        {/* Audio Only toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudioOnly}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              isAudioOnly
                ? 'bg-[#ff6f43] text-black font-semibold shadow-md'
                : 'bg-[#191e2a] text-[#9da4b6] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isAudioOnly ? 'Audio Mode Active' : 'Switch to Audio-Only'}</span>
          </button>

          <button
            onClick={() => {
              setIsExpanded(false);
              setIsDocked(false);
              onClose();
            }}
            className="p-2 rounded-full hover:bg-[#191e2a] text-[#9da4b6] hover:text-white transition-colors"
            aria-label="Close watch screen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content: Sticky Player on top (mobile) or 2-column layout (desktop) */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-12 gap-0">
        {/* Left Column / Top Section: Video & Controls & Details */}
        <div className="lg:col-span-8 lg:overflow-y-auto flex flex-col p-0 md:p-4 lg:p-6">
          {/* Video Player Container */}
          <div
            className="relative w-full aspect-video bg-black rounded-none md:rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setControlsVisible(false)}
          >
            {isAudioOnly ? (
              /* Dedicated Audio Mode Player Canvas */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#191e2a] via-[#0e1117] to-[#131720] p-6 text-center">
                <div className="relative w-36 h-36 md:w-56 md:h-56 rounded-3xl overflow-hidden shadow-2xl mb-4 border border-white/10 animate-in zoom-in-95 duration-300">
                  <Image
                    src={currentMedia.thumbnail}
                    alt={currentMedia.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="flex items-end gap-1 h-6">
                        <span className="w-1 bg-[#ff6f43] rounded-full animate-bounce [animation-delay:0ms] h-full" />
                        <span className="w-1 bg-[#ff6f43] rounded-full animate-bounce [animation-delay:150ms] h-4" />
                        <span className="w-1 bg-[#ff6f43] rounded-full animate-bounce [animation-delay:300ms] h-5" />
                      </div>
                    </div>
                  )}
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-white truncate max-w-md">
                  {currentMedia.title}
                </h2>
                <p className="text-sm text-[#9da4b6] mt-1">{currentMedia.author}</p>
                <div className="mt-3 px-3 py-1 rounded-full bg-[#1c3652]/60 text-[#77b8ff] text-xs font-medium flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  Direct High-Bitrate Opus Stream
                </div>
              </div>
            ) : (
              /* HTML5 Video element */
              <video
                ref={videoRef}
                src={currentMedia.streamUrl || undefined}
                className="w-full h-full object-contain"
                playsInline
                autoPlay
                onClick={togglePlay}
              />
            )}

            {/* Audio fallback tag for background/pure audio */}
            <audio
              ref={audioRef}
              src={currentMedia.audioStreamUrl || currentMedia.streamUrl || undefined}
              autoPlay={isAudioOnly}
            />

            {/* Buffering Indicator */}
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                <div className="w-12 h-12 rounded-full border-4 border-[#ff6f43]/30 border-t-[#ff6f43] animate-spin" />
              </div>
            )}

            {/* Custom Overlay Controls */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-3 md:p-4 transition-opacity duration-300 pointer-events-none ${
                controlsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Top Bar inside Player */}
              <div className="flex items-center justify-between pointer-events-auto">
                <h4 className="text-sm font-medium text-white truncate max-w-[70%] drop-shadow-md">
                  {currentMedia.title}
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                    aria-label="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Center Play/Pause Big Button */}
              <div className="flex items-center justify-center pointer-events-auto">
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-[22px] bg-[#ff6f43] text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 fill-black" />
                  ) : (
                    <Play className="w-8 h-8 fill-black ml-1" />
                  )}
                </button>
              </div>

              {/* Bottom Controls Bar with Heatmap */}
              <div className="flex flex-col gap-1 pointer-events-auto">
                {/* Heatmap timeline scrubber */}
                <HeatmapTimeline
                  currentTime={currentTime}
                  duration={duration}
                  chapters={chapters}
                  heatmap={heatmap}
                  onSeek={seekTo}
                />

                {/* Sub-bar: Play, Volume, Time, Quality, Fullscreen */}
                <div className="flex items-center justify-between text-white text-xs mt-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-1.5 hover:text-[#ff6f43] transition-colors"
                      aria-label="Play or pause"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-1.5 group/vol">
                      <button
                        onClick={toggleMute}
                        className="p-1 hover:text-[#ff6f43] transition-colors"
                        aria-label="Toggle mute"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#ff6f43]"
                      />
                    </div>

                    {/* Time display */}
                    <div className="text-[12px] font-mono text-white/90">
                      <span>{formatDuration(currentTime)}</span>
                      <span className="text-white/40 mx-1">/</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>

                  {/* Right side controls: Speed, Quality, Fullscreen */}
                  <div className="flex items-center gap-2">
                    {/* Playback speed quick button */}
                    <button
                      onClick={() => {
                        const rates = [1, 1.25, 1.5, 2];
                        const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
                        setRate(rates[nextIdx]);
                      }}
                      className="px-2 py-0.5 rounded-md hover:bg-white/20 font-mono text-[11px]"
                    >
                      {playbackRate}x
                    </button>

                    {/* Quality label */}
                    <span className="text-[11px] text-white/70 px-1">{activeQuality}</span>

                    <button
                      onClick={() => {
                        if (document.fullscreenElement) document.exitFullscreen();
                        else videoRef.current?.requestFullscreen?.();
                      }}
                      className="p-1.5 hover:text-[#ff6f43] transition-colors"
                      aria-label="Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings popup modal */}
            {showSettingsMenu && (
              <div
                className="absolute right-4 top-14 z-30 w-56 p-2 rounded-2xl bg-[#212737]/95 border border-[#3c4355] shadow-2xl backdrop-blur-md text-xs text-[#e5e8f0]"
                onMouseLeave={() => setShowSettingsMenu(false)}
              >
                <div className="font-semibold text-white px-2 py-1 border-b border-[#3c4355] mb-1">
                  Playback Settings
                </div>
                <div className="py-1">
                  <div className="text-[#9da4b6] px-2 py-0.5">Stream Quality</div>
                  <div className="flex flex-wrap gap-1 px-2 py-1">
                    {availableQualities.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setQuality(q);
                          setShowSettingsMenu(false);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] ${
                          activeQuality === q
                            ? 'bg-[#ff6f43] text-black font-semibold'
                            : 'bg-[#191e2a] hover:bg-[#2b3347]'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="py-1 border-t border-[#3c4355]/60 mt-1">
                  <div className="text-[#9da4b6] px-2 py-0.5">Playback Speed</div>
                  <div className="flex gap-1 px-2 py-1">
                    {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRate(r);
                          setShowSettingsMenu(false);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          playbackRate === r
                            ? 'bg-[#ff6f43] text-black font-semibold'
                            : 'bg-[#191e2a] hover:bg-[#2b3347]'
                        }`}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video Metadata / Channel Section */}
          <div className="p-4 md:px-0">
            <h1 className="text-lg md:text-xl font-bold text-white leading-tight">
              {watchData?.title || currentMedia.title}
            </h1>

            {/* Channel Details & Subscribe & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-3 py-2 border-b border-[#212737]">
              {/* Channel */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    (watchData?.author.id || currentMedia.authorId) &&
                    onChannelClick?.(watchData?.author.id || currentMedia.authorId!)
                  }
                  className="relative w-11 h-11 rounded-full overflow-hidden bg-[#212737] flex-shrink-0"
                >
                  <Image
                    src={
                      watchData?.author.avatar ||
                      currentMedia.avatar ||
                      'https://picsum.photos/seed/avatar/96/96'
                    }
                    alt={watchData?.author.name || currentMedia.author}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                </button>
                <div>
                  <div className="flex items-center gap-1 font-medium text-sm text-white">
                    <span>{watchData?.author.name || currentMedia.author}</span>
                    {watchData?.author.isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-[#77b8ff] fill-[#77b8ff]/20" />
                    )}
                  </div>
                  <div className="text-xs text-[#9da4b6]">
                    {watchData?.author.subscribers || 'Creator'}
                  </div>
                </div>

                <button
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`ml-3 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    isSubscribed
                      ? 'bg-[#212737] text-[#e5e8f0] border border-[#3c4355]'
                      : 'bg-white text-black hover:bg-white/90 shadow-md'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Action Buttons: Like, Share, Queue */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    isLiked
                      ? 'bg-[#ff6f43] text-black font-semibold'
                      : 'bg-[#191e2a] text-[#e5e8f0] hover:bg-[#212737]'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-black' : ''}`} />
                  <span>{watchData?.likes || 'Like'}</span>
                </button>

                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#191e2a] text-[#e5e8f0] hover:bg-[#212737] transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>

                <button
                  onClick={() =>
                    addToQueue({
                      id: currentMedia.id,
                      title: currentMedia.title,
                      author: currentMedia.author,
                      thumbnail: currentMedia.thumbnail,
                      type: currentMedia.type,
                    })
                  }
                  className="p-2.5 rounded-full bg-[#191e2a] text-[#e5e8f0] hover:bg-[#212737] transition-colors"
                  title="Add to Up-Next Queue"
                >
                  <ListPlus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description Container */}
            <div className="mt-3 p-3.5 rounded-2xl bg-[#191e2a] text-xs text-[#e5e8f0] leading-relaxed">
              <div className="flex items-center gap-2 font-medium text-[#9da4b6] mb-1.5">
                <span>{watchData?.views || 'Views'}</span>
                <span>·</span>
                <span>{watchData?.publishedDate || 'Uploaded'}</span>
              </div>

              <div
                className={`whitespace-pre-wrap break-words ${
                  descriptionExpanded ? '' : 'line-clamp-3'
                }`}
              >
                {renderInteractiveDescription(watchData?.description || 'No description provided.')}
              </div>

              {(watchData?.description?.length || 0) > 160 && (
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="mt-2 text-[#ff6f43] font-semibold hover:underline flex items-center gap-0.5"
                >
                  {descriptionExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Desktop) / Lower Section (Mobile): Tabs for Related, Chapters, Live Chat */}
        <div className="lg:col-span-4 lg:overflow-y-auto border-t lg:border-t-0 lg:border-l border-[#212737] bg-[#0e1117] flex flex-col p-4">
          {/* Tab Selection */}
          <div className="flex items-center gap-2 p-1 bg-[#191e2a] rounded-xl mb-4">
            <button
              onClick={() => setActiveTab('related')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'related'
                  ? 'bg-[#2b3347] text-white shadow-sm'
                  : 'text-[#9da4b6] hover:text-white'
              }`}
            >
              Related Videos
            </button>
            {chapters.length > 0 && (
              <button
                onClick={() => setActiveTab('chapters')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'chapters'
                    ? 'bg-[#2b3347] text-white shadow-sm'
                    : 'text-[#9da4b6] hover:text-white'
                }`}
              >
                Chapters ({chapters.length})
              </button>
            )}
            {watchData?.isLive && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-[#2b3347] text-white shadow-sm'
                    : 'text-[#9da4b6] hover:text-white'
                }`}
              >
                Live Chat
              </button>
            )}
          </div>

          {/* Tab Content: Related Videos */}
          {activeTab === 'related' && (
            <div className="flex flex-col gap-3">
              {watchData?.relatedVideos.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    playMedia(
                      {
                        id: item.id,
                        title: item.title,
                        author: item.author.name,
                        thumbnail: item.thumbnail,
                        type: 'video',
                      },
                      { immediate: true, expand: true }
                    )
                  }
                  className="flex gap-2.5 p-1.5 rounded-xl hover:bg-[#191e2a] cursor-pointer group transition-colors"
                >
                  <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-[#131720] flex-shrink-0">
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                    {item.duration && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white">
                        {item.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-[#e5e8f0] line-clamp-2 group-hover:text-[#ffdbd1]">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#9da4b6] truncate mt-1">
                      {item.author.name}
                    </p>
                    <p className="text-[11px] text-[#9da4b6]/70 mt-0.5">
                      {item.views}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content: Chapters List */}
          {activeTab === 'chapters' && (
            <div className="flex flex-col gap-2">
              {chapters.map((ch, idx) => (
                <button
                  key={idx}
                  onClick={() => seekTo(ch.timeStartSeconds)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#191e2a] hover:bg-[#212737] text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-[#ff6f43]">
                      {formatDuration(ch.timeStartSeconds)}
                    </span>
                    <span className="text-xs text-[#e5e8f0] font-medium">
                      {ch.title}
                    </span>
                  </div>
                  {currentTime >= ch.timeStartSeconds && (
                    <span className="w-2 h-2 rounded-full bg-[#ff6f43]" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content: Live Chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-[300px]">
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {liveChatMessages.length === 0 ? (
                  <div className="text-xs text-[#9da4b6] text-center py-8">
                    Waiting for live messages...
                  </div>
                ) : (
                  liveChatMessages.map((msg, i) => (
                    <div key={msg.id || i} className="flex gap-2 text-xs">
                      {msg.authorPhoto && (
                        <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={msg.authorPhoto}
                            alt={msg.authorName}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="font-semibold text-[#ffdbd1] mr-1.5">
                          {msg.authorName}
                        </span>
                        <span className="text-[#e5e8f0]">{msg.message}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
