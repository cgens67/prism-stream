export interface ClientConfig {
  clientName: string;
  clientVersion: string;
  clientNumber?: number;
  userAgent: string;
  osName?: string;
  osVersion?: string;
  platform?: string;
  deviceMake?: string;
  deviceModel?: string;
}

export const YOUTUBE_CLIENTS: Record<string, ClientConfig> = {
  VISIONOS: {
    clientName: 'VISIONOS',
    clientVersion: '1.0.3',
    clientNumber: 95,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    osName: 'VisionOS',
    osVersion: '1.0.3',
    platform: 'MOBILE',
    deviceMake: 'Apple',
    deviceModel: 'Vision Pro',
  },
  WEB_REMIX: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20240101.01.00',
    clientNumber: 67,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    osName: 'Windows',
    osVersion: '10.0',
    platform: 'DESKTOP',
  },
  WEB: {
    clientName: 'WEB',
    clientVersion: '2.20240101.00.00',
    clientNumber: 1,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    osName: 'Windows',
    osVersion: '10.0',
    platform: 'DESKTOP',
  },
  ANDROID_VR: {
    clientName: 'ANDROID_VR',
    clientVersion: '1.56.21',
    clientNumber: 56,
    userAgent:
      'Mozilla/5.0 (Linux; Android 10; Quest 2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    osName: 'Android',
    osVersion: '10',
    platform: 'VR',
    deviceMake: 'Oculus',
    deviceModel: 'Quest 2',
  },
  MWEB: {
    clientName: 'MWEB',
    clientVersion: '2.20240101.00.00',
    clientNumber: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    osName: 'iOS',
    osVersion: '16.5',
    platform: 'MOBILE',
  },
};

export const INNERTUBE_BASE_URL = 'https://www.youtube.com/youtubei/v1';
export const MUSIC_BASE_URL = 'https://music.youtube.com/youtubei/v1';
