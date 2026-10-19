import { VideoItem, PlaylistItem } from '../types';
import { parseRuns, parseThumbnail, parseDurationToSeconds } from './utils';

export function parseSearchResponse(data: Record<string, unknown>): {
  items: (VideoItem | PlaylistItem)[];
  continuation?: string;
} {
  const items: (VideoItem | PlaylistItem)[] = [];
  let continuationToken: string | undefined;

  const sectionList =
    (data as any)?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ||
    (data as any)?.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems ||
    [];

  for (const section of sectionList) {
    if (section.continuationItemRenderer) {
      continuationToken =
        section.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      continue;
    }

    const itemSection = section.itemSectionRenderer;
    const contents = itemSection?.contents || [section];

    for (const item of contents) {
      if (item.continuationItemRenderer) {
        continuationToken =
          item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
        continue;
      }

      // Video Renderer
      const video = item.videoRenderer;
      if (video && video.videoId) {
        const durStr = parseRuns(video.lengthText);
        const isLive = !!video.badges?.some(
          (b: any) =>
            b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW' ||
            parseRuns(b.metadataBadgeRenderer?.label).toLowerCase().includes('live')
        );

        items.push({
          id: video.videoId,
          title: parseRuns(video.title),
          thumbnail: parseThumbnail(video.thumbnail),
          duration: durStr || (isLive ? 'LIVE' : undefined),
          durationSeconds: parseDurationToSeconds(durStr),
          author: {
            name: parseRuns(video.ownerText),
            id: video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
            avatar: parseThumbnail(video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail),
            isVerified: !!video.ownerBadges?.some((b: any) =>
              b.metadataBadgeRenderer?.style?.includes('VERIFIED')
            ),
          },
          views: parseRuns(video.viewCountText),
          publishedTime: parseRuns(video.publishedTimeText),
          type: isLive ? 'live' : 'video',
        });
        continue;
      }

      // Playlist Renderer
      const playlist = item.playlistRenderer;
      if (playlist && playlist.playlistId) {
        items.push({
          id: playlist.playlistId,
          title: parseRuns(playlist.title),
          thumbnail: parseThumbnail(playlist.thumbnails),
          itemCount: parseRuns(playlist.videoCount),
          author: {
            name: parseRuns(playlist.shortBylineText || playlist.longBylineText),
            id: playlist.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
          },
          type: 'playlist',
        });
        continue;
      }

      // Reel item
      const reel = item.reelItemRenderer;
      if (reel && reel.videoId) {
        items.push({
          id: reel.videoId,
          title: parseRuns(reel.headline || reel.title),
          thumbnail: parseThumbnail(reel.thumbnail),
          views: parseRuns(reel.viewCountText),
          author: {
            name: '',
          },
          type: 'short',
        });
      }
    }
  }

  return { items, continuation: continuationToken };
}

export function parseMusicSearchResponse(data: Record<string, unknown>): {
  items: (VideoItem | PlaylistItem)[];
} {
  const items: (VideoItem | PlaylistItem)[] = [];
  const tab = (data as any)?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer;
  const sectionList = tab?.content?.sectionListRenderer?.contents || [];

  for (const section of sectionList) {
    const shelf = section.musicShelfRenderer;
    if (shelf) {
      for (const item of shelf.contents || []) {
        const responsive = item.musicResponsiveListItemRenderer;
        if (responsive) {
          const videoId =
            responsive.playlistItemData?.videoId ||
            responsive.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
              ?.playNavigationEndpoint?.watchEndpoint?.videoId;
          const browseId =
            responsive.navigationEndpoint?.browseEndpoint?.browseId;
          const title = parseRuns(
            responsive.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text
          );
          const author = parseRuns(
            responsive.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text
          );
          const thumb = parseThumbnail(responsive.thumbnail);

          if (videoId) {
            items.push({
              id: videoId,
              title,
              thumbnail: thumb,
              author: { name: author },
              type: 'song',
            });
          } else if (browseId) {
            items.push({
              id: browseId,
              title,
              thumbnail: thumb,
              author: { name: author },
              type: browseId.startsWith('MPREb_') ? 'album' : 'playlist',
            });
          }
        }
      }
    }
  }

  return { items };
}
