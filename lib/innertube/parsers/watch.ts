import { VideoWatchData, Chapter, HeatmapPoint, VideoItem } from '../types';
import { parseRuns, parseThumbnail, parseDurationToSeconds } from './utils';

export function parseWatchResponse(
  videoId: string,
  data: Record<string, unknown>
): VideoWatchData {
  let title = '';
  let description = '';
  let authorName = '';
  let authorId = '';
  let authorAvatar = '';
  let authorSubscribers = '';
  let isVerified = false;
  let views = '';
  let likes = '';
  let publishedDate = '';
  let isLive = false;
  let commentsContinuation = '';
  let liveChatContinuation = '';
  const chapters: Chapter[] = [];
  const heatmap: HeatmapPoint[] = [];
  const relatedVideos: VideoItem[] = [];

  const results = (data as any)?.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];

  for (const item of results) {
    // Primary Info
    if (item.videoPrimaryInfoRenderer) {
      const primary = item.videoPrimaryInfoRenderer;
      title = parseRuns(primary.title);
      views = parseRuns(primary.viewCount?.videoViewCountRenderer?.viewCount);
      publishedDate = parseRuns(primary.dateText);

      // Likes
      const topLevelButtons =
        primary.videoActions?.menuRenderer?.topLevelButtons || [];
      for (const btn of topLevelButtons) {
        const toggleBtn = btn.segmentedLikeDislikeButtonRenderer?.likeButton?.toggleButtonRenderer;
        if (toggleBtn) {
          likes = parseRuns(toggleBtn.defaultText);
        }
      }
    }

    // Secondary Info
    if (item.videoSecondaryInfoRenderer) {
      const secondary = item.videoSecondaryInfoRenderer;
      const owner = secondary.owner?.videoOwnerRenderer;
      if (owner) {
        authorName = parseRuns(owner.title);
        authorId = owner.navigationEndpoint?.browseEndpoint?.browseId || '';
        authorAvatar = parseThumbnail(owner.thumbnail);
        authorSubscribers = parseRuns(owner.subscriberCountText);
        isVerified = !!owner.badges?.some((b: any) =>
          b.metadataBadgeRenderer?.style?.includes('VERIFIED')
        );
      }

      description =
        parseRuns(secondary.attributedDescription) ||
        parseRuns(secondary.description);
    }

    // Item Section (Comments continuation)
    if (item.itemSectionRenderer) {
      const itemContents = item.itemSectionRenderer.contents || [];
      for (const c of itemContents) {
        if (c.continuationItemRenderer) {
          commentsContinuation =
            c.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token || '';
        }
      }
    }
  }

  // Secondary Results (Related videos)
  const secondaryResults =
    (data as any)?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results ||
    (data as any)?.contents?.twoColumnWatchNextResults?.secondaryResults?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ||
    [];

  for (const item of secondaryResults) {
    const compact = item.compactVideoRenderer;
    if (compact && compact.videoId) {
      const durStr = parseRuns(compact.lengthText);
      relatedVideos.push({
        id: compact.videoId,
        title: parseRuns(compact.title),
        thumbnail: parseThumbnail(compact.thumbnail),
        duration: durStr,
        durationSeconds: parseDurationToSeconds(durStr),
        author: {
          name: parseRuns(compact.shortBylineText || compact.longBylineText),
          id: compact.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
          avatar: parseThumbnail(compact.channelThumbnail),
          isVerified: !!compact.ownerBadges?.some((b: any) =>
            b.metadataBadgeRenderer?.style?.includes('VERIFIED')
          ),
        },
        views: parseRuns(compact.viewCountText || compact.shortViewCountText),
        publishedTime: parseRuns(compact.publishedTimeText),
        type: 'video',
      });
    }
  }

  // Player Overlays (Chapters & Heatmap curve)
  const markersMap =
    (data as any)?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer
      ?.decoratedPlayerBarRenderer?.playerBar?.multiMarkersPlayerBarRenderer?.markersMap || [];

  for (const markerEntry of markersMap) {
    const key = markerEntry.key;
    const value = markerEntry.value;

    // Chapters
    if (key === 'MARKER_TYPE_CHAPTERS' || key?.includes('CHAPTERS')) {
      const chapterList = value?.chapters || [];
      for (const ch of chapterList) {
        const renderer = ch.chapterRenderer;
        if (renderer) {
          const startMs = Number(renderer.timeRangeStartMillis || 0);
          chapters.push({
            title: parseRuns(renderer.title),
            timeStartSeconds: Math.floor(startMs / 1000),
            thumbnail: parseThumbnail(renderer.thumbnail),
          });
        }
      }
    }

    // Heatmap curve
    if (key === 'MARKER_TYPE_HEATMAP' || key?.includes('HEATMAP')) {
      const timedDecorators = value?.timedMarkerDecorators || [];
      for (const dec of timedDecorators) {
        const heatmapRenderer = dec.timedMarkerDecoratorRenderer;
        if (heatmapRenderer) {
          const val = Number(heatmapRenderer.value || heatmapRenderer.normalizedValue || 0);
          // Decorator can also have points array
          heatmap.push({
            timeFraction: 0,
            value: Math.max(0, Math.min(1, val)),
          });
        }
      }

      // Check if markers list contains intensity data
      const markers = value?.heatmap?.heatmapRenderer?.maxHeightPoint ? [value.heatmap.heatmapRenderer] : [];
      if (value?.heatmap?.heatMarkers) {
        const heatMarkers = value.heatmap.heatMarkers;
        const total = heatMarkers.length;
        heatMarkers.forEach((hm: any, idx: number) => {
          const intensity = Number(hm.heatMarkerRenderer?.heatMarkerIntensityScoreNormalized || 0);
          heatmap.push({
            timeFraction: total > 1 ? idx / (total - 1) : 0,
            value: intensity,
          });
        });
      }
    }
  }

  // Live chat continuation
  const conversationBar =
    (data as any)?.contents?.twoColumnWatchNextResults?.conversationBar?.liveChatRenderer;
  if (conversationBar) {
    isLive = true;
    const continuations = conversationBar.continuations || [];
    liveChatContinuation =
      continuations[0]?.reloadContinuationData?.continuation ||
      continuations[0]?.timedContinuationData?.continuation ||
      '';
  }

  return {
    id: videoId,
    title: title || 'YouTube Video',
    description,
    thumbnails: [
      { url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, width: 1280, height: 720 },
      { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, width: 480, height: 360 },
    ],
    author: {
      name: authorName || 'Creator',
      id: authorId,
      avatar: authorAvatar,
      subscribers: authorSubscribers,
      isVerified,
    },
    views: views || '',
    likes: likes || '',
    publishedDate: publishedDate || '',
    chapters,
    heatmap,
    relatedVideos,
    commentsContinuation,
    isLive,
    liveChatContinuation,
  };
}
