'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { VideoItem, Chapter, HeatmapPoint, CaptionTrack } from '@/lib/innertube/types';

export interface PlayerMedia {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  avatar?: string;
  thumbnail: string;
  durationSeconds?: number;
  type: 'video' | 'song' | 'short';
  streamUrl?: string;
  audioStreamUrl?: string;
  isAudioOnly?: boolean;
}

interface PlayerContextType {
  currentMedia: PlayerMedia | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isAudioOnly: boolean;
  isDocked: boolean;
  isExpanded: boolean;
  chapters: Chapter[];
  heatmap: HeatmapPoint[];
  queue: PlayerMedia[];
  queueIndex: number;
  activeQuality: string;
  availableQualities: string[];
  captions: CaptionTrack[];
  activeCaption: string | null;

  // Actions
  playMedia: (media: PlayerMedia, options?: { immediate?: boolean; expand?: boolean }) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  setRate: (rate: number) => void;
  toggleAudioOnly: () => void;
  setIsDocked: (docked: boolean) => void;
  setIsExpanded: (expanded: boolean) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addToQueue: (media: PlayerMedia) => void;
  setQueueList: (list: PlayerMedia[], startIndex?: number) => void;
  setQuality: (quality: string) => void;
  setCaption: (langCode: string | null) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentMedia, setCurrentMedia] = useState<PlayerMedia | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);
  const [isDocked, setIsDocked] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [queue, setQueue] = useState<PlayerMedia[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [activeQuality, setActiveQuality] = useState<string>('Auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>(['Auto', '1080p', '720p', '480p', '360p']);
  const [captions, setCaptions] = useState<CaptionTrack[]>([]);
  const [activeCaption, setActiveCaption] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play media implementation
  const playMedia = useCallback(
    async (media: PlayerMedia, options?: { immediate?: boolean; expand?: boolean }) => {
      setCurrentMedia(media);
      setIsPlaying(false);
      setIsBuffering(true);
      setCurrentTime(0);

      if (options?.expand) {
        setIsExpanded(true);
        setIsDocked(false);
      }

      try {
        // Fetch stream and watch data in parallel
        const [playerRes, watchRes] = await Promise.allSettled([
          fetch(`/api/player/${media.id}`).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/watch/${media.id}`).then((r) => (r.ok ? r.json() : null)),
        ]);

        let streamUrl = media.streamUrl;
        let audioStreamUrl = media.audioStreamUrl;

        if (playerRes.status === 'fulfilled' && playerRes.value) {
          const p = playerRes.value;
          streamUrl = p.bestDirectStream || streamUrl;
          audioStreamUrl = p.bestAudioStream || audioStreamUrl;
          if (p.captionTracks) {
            setCaptions(p.captionTracks);
          }
          if (p.lengthSeconds) {
            setDuration(p.lengthSeconds);
          }
          if (p.formats?.length > 0) {
            const quals = Array.from(
              new Set(
                p.formats
                  .map((f: any) => f.qualityLabel)
                  .filter(Boolean)
              )
            ) as string[];
            setAvailableQualities(['Auto', ...quals]);
          }
        }

        if (watchRes.status === 'fulfilled' && watchRes.value) {
          const w = watchRes.value;
          if (w.chapters?.length) setChapters(w.chapters);
          else setChapters([]);
          if (w.heatmap?.length) setHeatmap(w.heatmap);
          else setHeatmap([]);
        }

        const resolvedMedia = {
          ...media,
          streamUrl: streamUrl ? `/api/proxy-stream?url=${encodeURIComponent(streamUrl)}` : undefined,
          audioStreamUrl: audioStreamUrl
            ? `/api/proxy-stream?url=${encodeURIComponent(audioStreamUrl)}`
            : undefined,
        };

        setCurrentMedia(resolvedMedia);
        setIsBuffering(false);

        // Update MediaSession
        if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: media.title,
            artist: media.author,
            artwork: [
              { src: media.thumbnail, sizes: '512x512', type: 'image/jpeg' },
            ],
          });
        }
      } catch (err) {
        console.error('Error initiating playback:', err);
        setIsBuffering(false);
      }
    },
    []
  );

  const togglePlay = useCallback(() => {
    const el = isAudioOnly ? audioRef.current : videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(console.warn);
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [isAudioOnly]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      const el = isAudioOnly ? audioRef.current : videoRef.current;
      if (el) {
        el.currentTime = Math.max(0, Math.min(seconds, duration || el.duration || 0));
        setCurrentTime(el.currentTime);
      }
    },
    [isAudioOnly, duration]
  );

  const setVolumeLevel = useCallback((vol: number) => {
    const v = Math.max(0, Math.min(1, vol));
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    if (audioRef.current) audioRef.current.volume = v;
    if (v === 0) setIsMuted(true);
    else setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, []);

  const toggleAudioOnly = useCallback(() => {
    setIsAudioOnly((prev) => !prev);
  }, []);

  const nextTrack = useCallback(() => {
    if (queue.length > 0 && queueIndex + 1 < queue.length) {
      const nextIndex = queueIndex + 1;
      setQueueIndex(nextIndex);
      playMedia(queue[nextIndex], { immediate: true });
    }
  }, [queue, queueIndex, playMedia]);

  const prevTrack = useCallback(() => {
    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      setQueueIndex(prevIdx);
      playMedia(queue[prevIdx], { immediate: true });
    } else if (currentTime > 3) {
      seekTo(0);
    }
  }, [queue, queueIndex, currentTime, playMedia, seekTo]);

  const addToQueue = useCallback((media: PlayerMedia) => {
    setQueue((prev) => [...prev, media]);
  }, []);

  const setQueueList = useCallback(
    (list: PlayerMedia[], startIndex = 0) => {
      setQueue(list);
      setQueueIndex(startIndex);
      if (list[startIndex]) {
        playMedia(list[startIndex], { immediate: true, expand: true });
      }
    },
    [playMedia]
  );

  // Setup mediaSession action handlers
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null) seekTo(details.seekTime);
      });
    }
  }, [togglePlay, pause, prevTrack, nextTrack, seekTo]);

  return (
    <PlayerContext.Provider
      value={{
        currentMedia,
        isPlaying,
        isBuffering,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackRate,
        isAudioOnly,
        isDocked,
        isExpanded,
        chapters,
        heatmap,
        queue,
        queueIndex,
        activeQuality,
        availableQualities,
        captions,
        activeCaption,
        playMedia,
        togglePlay,
        pause,
        seekTo,
        setVolumeLevel,
        toggleMute,
        setRate,
        toggleAudioOnly,
        setIsDocked,
        setIsExpanded,
        nextTrack,
        prevTrack,
        addToQueue,
        setQueueList,
        setQuality: setActiveQuality,
        setCaption: setActiveCaption,
        videoRef,
        audioRef,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}
