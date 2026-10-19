import { PlayerStreamData, StreamFormat, CaptionTrack } from '../types';
import { parseRuns } from './utils';

export function parsePlayerResponse(data: Record<string, unknown>): PlayerStreamData {
  const videoDetails = (data as any)?.videoDetails || {};
  const streamingData = (data as any)?.streamingData || {};
  const captions = (data as any)?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

  const rawFormats = [
    ...(streamingData.formats || []),
    ...(streamingData.adaptiveFormats || []),
  ];

  const formats: StreamFormat[] = [];
  const adaptiveFormats: StreamFormat[] = [];

  for (const f of rawFormats) {
    const url = f.url || '';
    if (!url) continue;

    const mime = f.mimeType || '';
    const isVideo = mime.startsWith('video/');
    const isAudio = mime.startsWith('audio/');

    const item: StreamFormat = {
      itag: f.itag,
      url,
      mimeType: mime,
      qualityLabel: f.qualityLabel || (f.height ? `${f.height}p` : undefined),
      bitrate: f.bitrate || f.averageBitrate || 0,
      width: f.width,
      height: f.height,
      audioChannels: f.audioChannels,
      audioSampleRate: f.audioSampleRate,
      loudnessDb: f.loudnessDb,
      contentLength: f.contentLength,
      hasVideo: isVideo,
      hasAudio: isAudio || (!mime.includes('codecs=') && !mime.includes('video/mp4; codecs="avc1') && !mime.includes('video/webm; codecs="vp9')),
    };

    if (f.qualityLabel && !mime.includes('audio/')) {
      // adaptive or muxed
      adaptiveFormats.push(item);
    } else if (isAudio) {
      adaptiveFormats.push(item);
    }

    formats.push(item);
  }

  // Find best combined or video stream
  const muxed = formats.filter(
    (f) => f.url && f.hasVideo && (f.hasAudio || (f.mimeType.includes('video/mp4') && f.audioChannels))
  );
  let bestDirectStream: string | undefined;

  if (muxed.length > 0) {
    // Sort by height descending
    muxed.sort((a, b) => (b.height || 0) - (a.height || 0));
    bestDirectStream = muxed[0].url;
  } else {
    // Pick highest video stream with url
    const vOnly = formats.filter((f) => f.url && f.hasVideo);
    if (vOnly.length > 0) {
      vOnly.sort((a, b) => (b.height || 0) - (a.height || 0));
      bestDirectStream = vOnly[0].url;
    }
  }

  // Find best audio stream (prioritize audio/webm with highest bitrate, or audio/mp4)
  const audioOnly = formats.filter((f) => f.url && f.mimeType.startsWith('audio/'));
  let bestAudioStream: string | undefined;
  if (audioOnly.length > 0) {
    audioOnly.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    bestAudioStream = audioOnly[0].url;
  }

  const captionTracks: CaptionTrack[] = captions.map((c: any) => ({
    baseUrl: c.baseUrl,
    name: parseRuns(c.name),
    vssId: c.vssId,
    languageCode: c.languageCode,
    isTranslatable: c.isTranslatable,
  }));

  return {
    videoId: videoDetails.videoId || '',
    title: videoDetails.title || '',
    author: videoDetails.author || '',
    lengthSeconds: Number(videoDetails.lengthSeconds || 0),
    thumbnail:
      videoDetails.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
      `https://i.ytimg.com/vi/${videoDetails.videoId}/hqdefault.jpg`,
    isLive: !!videoDetails.isLive,
    formats,
    adaptiveFormats,
    hlsManifestUrl: streamingData.hlsManifestUrl,
    loudnessDb: (data as any)?.playerConfig?.audioConfig?.loudnessDb,
    captionTracks,
    bestDirectStream,
    bestAudioStream,
  };
}
