import { VideoItem, PlaylistItem, ShelfItem } from '../types';
import { parseRuns, parseThumbnail, parseDurationToSeconds } from './utils';

export function parseVideoHomeResponse(data: Record<string, unknown>): {
  items: VideoItem[];
  shelves: ShelfItem[];
  continuation?: string;
} {
  const items: VideoItem[] = [];
  const shelves: ShelfItem[] = [];
  let continuationToken: string | undefined;

  // Traverse contents -> twoColumnBrowseResultsRenderer -> tabs -> tabRenderer -> content -> richGridRenderer
  const twoColumn = (data as any)?.contents?.twoColumnBrowseResultsRenderer;
  const tabs = twoColumn?.tabs || [];
  const selectedTab = tabs.find((t: any) => t.tabRenderer?.selected) || tabs[0];
  const grid = selectedTab?.tabRenderer?.content?.richGridRenderer;

  const contents = grid?.contents || [];

  for (const item of contents) {
    // Check continuation
    if (item.continuationItemRenderer) {
      continuationToken =
        item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      continue;
    }

    // Rich section (e.g. Shorts shelf or category shelves)
    if (item.richSectionRenderer) {
      const sectionContent = item.richSectionRenderer.content;
      if (sectionContent?.richShelfRenderer) {
        const shelf = sectionContent.richShelfRenderer;
        const shelfTitle = parseRuns(shelf.title);
        const shelfItems: VideoItem[] = [];

        for (const child of shelf.contents || []) {
          const reel = child.richItemRenderer?.content?.reelItemRenderer;
          if (reel) {
            shelfItems.push({
              id: reel.videoId,
              title: parseRuns(reel.headline || reel.title),
              thumbnail: parseThumbnail(reel.thumbnail),
              views: parseRuns(reel.viewCountText),
              type: 'short',
              author: {
                name: '',
              },
            });
          }
        }

        if (shelfItems.length > 0) {
          shelves.push({
            title: shelfTitle || 'Trending Shorts',
            type: 'shorts',
            items: shelfItems,
          });
        }
      }
      continue;
    }

    // Rich item (individual video)
    const videoRenderer = item.richItemRenderer?.content?.videoRenderer;
    if (videoRenderer && videoRenderer.videoId) {
      const durationStr = parseRuns(videoRenderer.lengthText);
      const isLive = !!videoRenderer.badges?.some(
        (b: any) =>
          b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW' ||
          parseRuns(b.metadataBadgeRenderer?.label).toLowerCase().includes('live')
      );

      items.push({
        id: videoRenderer.videoId,
        title: parseRuns(videoRenderer.title),
        thumbnail: parseThumbnail(videoRenderer.thumbnail),
        duration: durationStr || (isLive ? 'LIVE' : undefined),
        durationSeconds: parseDurationToSeconds(durationStr),
        author: {
          name: parseRuns(videoRenderer.ownerText || videoRenderer.shortBylineText),
          id:
            videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
            videoRenderer.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
          avatar: parseThumbnail(videoRenderer.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail),
          isVerified: !!videoRenderer.ownerBadges?.some(
            (b: any) => b.metadataBadgeRenderer?.style?.includes('VERIFIED')
          ),
        },
        views: parseRuns(videoRenderer.viewCountText || videoRenderer.shortViewCountText),
        publishedTime: parseRuns(videoRenderer.publishedTimeText),
        type: isLive ? 'live' : 'video',
      });
    }
  }

  return { items, shelves, continuation: continuationToken };
}

export function parseMusicHomeResponse(data: Record<string, unknown>): {
  shelves: ShelfItem[];
  continuation?: string;
} {
  const shelves: ShelfItem[] = [];
  let continuationToken: string | undefined;

  // YouTube Music structure: contents -> singleColumnBrowseResultsRenderer -> tabs -> sectionListRenderer -> contents
  const singleColumn = (data as any)?.contents?.singleColumnBrowseResultsRenderer;
  const tabs = singleColumn?.tabs || [];
  const selectedTab = tabs.find((t: any) => t.tabRenderer?.selected) || tabs[0];
  const sectionList = selectedTab?.tabRenderer?.content?.sectionListRenderer;
  const sections = sectionList?.contents || [];

  for (const section of sections) {
    if (section.continuationItemRenderer) {
      continuationToken =
        section.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
      continue;
    }

    // musicCarouselShelfRenderer
    const carousel = section.musicCarouselShelfRenderer;
    if (carousel) {
      const headerTitle = parseRuns(carousel.header?.musicCarouselShelfBasicHeaderRenderer?.title);
      const headerSubtitle = parseRuns(
        carousel.header?.musicCarouselShelfBasicHeaderRenderer?.strapline
      );
      const shelfItems: (VideoItem | PlaylistItem)[] = [];

      for (const item of carousel.contents || []) {
        // musicTwoRowItemRenderer (album, playlist, or song)
        const twoRow = item.musicTwoRowItemRenderer;
        if (twoRow) {
          const navEndpoint = twoRow.navigationEndpoint;
          const browseId = navEndpoint?.browseEndpoint?.browseId;
          const videoId = navEndpoint?.watchEndpoint?.videoId;
          const title = parseRuns(twoRow.title);
          const subtitle = parseRuns(twoRow.subtitle);
          const thumb = parseThumbnail(twoRow.thumbnailRenderer);

          if (videoId) {
            shelfItems.push({
              id: videoId,
              title,
              thumbnail: thumb,
              author: {
                name: subtitle,
              },
              type: 'song',
            });
          } else if (browseId) {
            shelfItems.push({
              id: browseId,
              title,
              thumbnail: thumb,
              author: {
                name: subtitle,
              },
              type: browseId.startsWith('MPREb_') ? 'album' : 'playlist',
            });
          }
        }

        // musicResponsiveListItemRenderer
        const listItem = item.musicResponsiveListItemRenderer;
        if (listItem) {
          const videoId =
            listItem.playlistItemData?.videoId ||
            listItem.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
              ?.playNavigationEndpoint?.watchEndpoint?.videoId;
          const titleRuns = listItem.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text;
          const authorRuns = listItem.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text;

          if (videoId) {
            shelfItems.push({
              id: videoId,
              title: parseRuns(titleRuns),
              thumbnail: parseThumbnail(listItem.thumbnail),
              author: {
                name: parseRuns(authorRuns),
              },
              type: 'song',
            });
          }
        }
      }

      if (shelfItems.length > 0) {
        shelves.push({
          title: headerTitle || 'Music Picks',
          subtitle: headerSubtitle,
          type: 'music',
          items: shelfItems,
        });
      }
    }
  }

  return { shelves, continuation: continuationToken };
}
