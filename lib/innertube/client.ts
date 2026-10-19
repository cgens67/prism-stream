import { YOUTUBE_CLIENTS, INNERTUBE_BASE_URL, MUSIC_BASE_URL, ClientConfig } from './clients';

export interface InnerTubeRequestOptions {
  clientType?: 'VISIONOS' | 'WEB_REMIX' | 'WEB' | 'ANDROID_VR' | 'MWEB';
  endpoint: string;
  body?: Record<string, unknown>;
  useMusicBase?: boolean;
  timeoutMs?: number;
}

export async function postInnerTube<T = Record<string, unknown>>(
  options: InnerTubeRequestOptions
): Promise<T> {
  const {
    clientType = 'WEB',
    endpoint,
    body = {},
    useMusicBase = false,
    timeoutMs = 12000,
  } = options;

  const client: ClientConfig = YOUTUBE_CLIENTS[clientType] || YOUTUBE_CLIENTS.WEB;
  const baseUrl = useMusicBase ? MUSIC_BASE_URL : INNERTUBE_BASE_URL;
  const url = `${baseUrl}/${endpoint}?prettyPrint=false`;

  const context: Record<string, unknown> = {
    client: {
      clientName: client.clientName,
      clientVersion: client.clientVersion,
      hl: 'en',
      gl: 'US',
      ...(client.osName ? { osName: client.osName } : {}),
      ...(client.osVersion ? { osVersion: client.osVersion } : {}),
      ...(client.platform ? { platform: client.platform } : {}),
      ...(client.deviceMake ? { deviceMake: client.deviceMake } : {}),
      ...(client.deviceModel ? { deviceModel: client.deviceModel } : {}),
    },
    user: {
      lockedSafetyMode: false,
    },
    request: {
      useSsl: true,
      internalExperimentFlags: [],
    },
  };

  const payload = {
    context,
    ...body,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': client.userAgent,
    'X-YouTube-Client-Name': String(client.clientNumber || 1),
    'X-YouTube-Client-Version': client.clientVersion,
    Origin: useMusicBase ? 'https://music.youtube.com' : 'https://www.youtube.com',
    Referer: useMusicBase ? 'https://music.youtube.com/' : 'https://www.youtube.com/',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`InnerTube request to ${endpoint} failed with HTTP status ${res.status}`);
    }

    const data = (await res.json()) as T;
    return data;
  } catch (err: unknown) {
    clearTimeout(timer);
    throw err;
  }
}
