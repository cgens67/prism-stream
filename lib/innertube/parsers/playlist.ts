import { PlaylistItem, VideoItem } from '../types';
import { parseRuns, parseThumbnail, parseDurationToSeconds } from './utils';

export function parsePlaylistResponse(data: Record<string, unknown>): {
  id: string;
  title: string;
  description?: string;
  author?: string;
  thumbnail: string;
  year?: string;
  totalTracks?: number;
  tracks: VideoItem[];
} {
  let title = '';
  let description = '';
  let author = '';
  let thumbnail = '';
  let year = '';
  const tracks: VideoItem[] = [];

  // Header
  const header =
    (data as any)?.header?.musicDetailHeaderRenderer ||
    (data as any)?.header?.musicEditablePlaylistDetailHeaderRenderer?.header?.musicDetailHeaderRenderer ||
    (data as any)?.header?.playlistHeaderRenderer;

  if (header) {
    title = parseRuns(header.title);
    description = parseRuns(header.description);
    author = parseRuns(header.subtitle || header.ownerText || header.straplineTextOne);
    thumbnail = parseThumbnail(header.thumbnail);
    year = parseRuns(header.subtitle?.runs?.find((r: any) => /^\d{4}$/.test(r.text?.trim())));
  }

  // Items
  const contents =
    (data as any)?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer?.contents ||
    (data as any)?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents ||
    [];

  for (const item of contents) {
    // Playlist video renderer
    const video = item.playlistVideoRenderer;
    if (video && video.videoId) {
      const dur = parseRuns(video.lengthText);
      tracks.push({
        id: video.videoId,
        title: parseRuns(video.title),
        thumbnail: parseThumbnail(video.thumbnail),
        duration: dur,
        durationSeconds: parseDurationToSeconds(dur),
        author: {
          name: parseRuns(video.shortBylineText),
          id: video.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
        },
        type: 'song',
      });
      continue;
    }

    // Music responsive list item renderer
    const listItem = item.musicResponsiveListItemRenderer;
    if (listItem) {
      const videoId =
        listItem.playlistItemData?.videoId ||
        listItem.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
          ?.playNavigationEndpoint?.watchEndpoint?.videoId;
      const trackTitle = parseRuns(
        listItem.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text
      );
      const artist = parseRuns(
        listItem.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text
      );
      const dur = parseRuns(
        listItem.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text
      );

      if (videoId) {
        tracks.push({
          id: videoId,
          title: trackTitle,
          thumbnail: parseThumbnail(listItem.thumbnail) || thumbnail,
          duration: dur,
          durationSeconds: parseDurationToSeconds(dur),
          author: {
            name: artist || author,
          },
          type: 'song',
        });
      }
    }
  }

  return {
    id: (data as any)?.responseContext?.serviceTrackingParams?.[0]?.params?.find((p: any) => p.key === 'browse_id')?.value || '',
    title: title || 'Playlist',
    description,
    author,
    thumbnail,
    year,
    totalTracks: tracks.length,
    tracks,
  };
}
