export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
  durationSeconds?: number;
  author: {
    name: string;
    id?: string;
    avatar?: string;
    isVerified?: boolean;
  };
  views?: string;
  publishedTime?: string;
  type: 'video' | 'short' | 'live' | 'song';
  badge?: string;
}

export interface PlaylistItem {
  id: string;
  title: string;
  thumbnail: string;
  itemCount?: string;
  author?: {
    name: string;
    id?: string;
  };
  type: 'playlist' | 'album';
}

export interface ShelfItem {
  title: string;
  subtitle?: string;
  type: 'videos' | 'music' | 'shorts' | 'artists' | 'charts';
  items: (VideoItem | PlaylistItem)[];
}

export interface Chapter {
  title: string;
  timeStartSeconds: number;
  thumbnail?: string;
}

export interface HeatmapPoint {
  timeFraction: number; // 0 to 1
  value: number; // normalized height 0 to 1
}

export interface StreamFormat {
  itag: number;
  url: string;
  mimeType: string;
  qualityLabel?: string;
  bitrate: number;
  width?: number;
  height?: number;
  audioChannels?: number;
  audioSampleRate?: string;
  loudnessDb?: number;
  contentLength?: string;
  hasAudio: boolean;
  hasVideo: boolean;
}

export interface CaptionTrack {
  baseUrl: string;
  name: string;
  vssId?: string;
  languageCode: string;
  isTranslatable?: boolean;
}

export interface VideoWatchData {
  id: string;
  title: string;
  description: string;
  thumbnails: { url: string; width: number; height: number }[];
  author: {
    name: string;
    id: string;
    avatar?: string;
    subscribers?: string;
    isVerified: boolean;
  };
  views: string;
  likes?: string;
  publishedDate?: string;
  chapters: Chapter[];
  heatmap: HeatmapPoint[];
  relatedVideos: VideoItem[];
  commentCount?: string;
  commentsContinuation?: string;
  isLive?: boolean;
  liveChatContinuation?: string;
}

export interface PlayerStreamData {
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  thumbnail: string;
  isLive: boolean;
  formats: StreamFormat[];
  adaptiveFormats: StreamFormat[];
  hlsManifestUrl?: string;
  loudnessDb?: number;
  captionTracks: CaptionTrack[];
  bestDirectStream?: string;
  bestAudioStream?: string;
}

export interface ChannelData {
  id: string;
  title: string;
  handle?: string;
  description?: string;
  avatar: string;
  banner?: string;
  subscribers?: string;
  videoCount?: string;
  isVerified: boolean;
  availableTabs: { id: string; title: string; selected?: boolean; continuation?: string }[];
  activeTabContent: {
    tabId: string;
    videos: VideoItem[];
    playlists?: PlaylistItem[];
    continuation?: string;
  };
}

export interface CommentItem {
  id: string;
  author: {
    name: string;
    avatar: string;
    channelId?: string;
    isCreator?: boolean;
    isVerified?: boolean;
  };
  content: string;
  publishedTime: string;
  likes?: string;
  replyCount?: number;
}
