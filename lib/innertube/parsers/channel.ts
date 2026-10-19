import { ChannelData, VideoItem, PlaylistItem } from '../types';
import { parseRuns, parseThumbnail, parseDurationToSeconds } from './utils';

export function parseChannelResponse(
  channelId: string,
  data: Record<string, unknown>
): ChannelData {
  let title = '';
  let handle = '';
  let description = '';
  let avatar = '';
  let banner = '';
  let subscribers = '';
  let videoCount = '';
  let isVerified = false;

  // Header parsing (c4TabbedHeaderRenderer or pageHeaderRenderer)
  const header = (data as any)?.header?.c4TabbedHeaderRenderer || (data as any)?.header?.pageHeaderRenderer;
  if (header) {
    if (header.content?.pageHeaderViewModel) {
      // Modern page header view model
      const vm = header.content.pageHeaderViewModel;
      title = vm.title?.dynamicTextViewModel?.text?.content || '';
      avatar = parseThumbnail(vm.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image);
      banner = parseThumbnail(vm.banner?.imageBannerViewModel?.image);
      const metadataRows = vm.metadata?.contentMetadataViewModel?.metadataRows || [];
      for (const row of metadataRows) {
        for (const part of row.metadataParts || []) {
          const text = part.text?.content || '';
          if (text.startsWith('@')) handle = text;
          else if (text.toLowerCase().includes('subscriber')) subscribers = text;
          else if (text.toLowerCase().includes('video')) videoCount = text;
        }
      }
    } else {
      title = header.title || '';
      avatar = parseThumbnail(header.avatar);
      banner = parseThumbnail(header.banner || header.tvBanner);
      subscribers = parseRuns(header.subscriberCountText);
      videoCount = parseRuns(header.videosCountText);
      isVerified = !!header.badges?.some((b: any) =>
        b.metadataBadgeRenderer?.style?.includes('VERIFIED')
      );
    }
  }

  // Tabs
  const availableTabs: { id: string; title: string; selected?: boolean; continuation?: string }[] = [];
  const tabs = (data as any)?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  let activeTabId = 'videos';
  const videos: VideoItem[] = [];
  const playlists: PlaylistItem[] = [];
  let continuationToken: string | undefined;

  for (const t of tabs) {
    const tabRenderer = t.tabRenderer;
    if (tabRenderer) {
      const tabTitle = tabRenderer.title || '';
      const tabId = tabTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isSelected = !!tabRenderer.selected;
      availableTabs.push({
        id: tabId,
        title: tabTitle,
        selected: isSelected,
      });

      if (isSelected || availableTabs.length === 1) {
        activeTabId = tabId;
        const grid =
          tabRenderer.content?.richGridRenderer ||
          tabRenderer.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer;

        const contents = grid?.contents || tabRenderer.content?.sectionListRenderer?.contents || [];

        for (const item of contents) {
          if (item.continuationItemRenderer) {
            continuationToken =
              item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
            continue;
          }

          // richItemRenderer -> videoRenderer or reelItemRenderer
          const video =
            item.richItemRenderer?.content?.videoRenderer ||
            item.gridVideoRenderer ||
            item.videoRenderer;

          if (video && video.videoId) {
            const dur = parseRuns(video.lengthText || video.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text);
            videos.push({
              id: video.videoId,
              title: parseRuns(video.title),
              thumbnail: parseThumbnail(video.thumbnail),
              duration: dur,
              durationSeconds: parseDurationToSeconds(dur),
              author: {
                name: title,
                id: channelId,
                avatar,
                isVerified,
              },
              views: parseRuns(video.viewCountText || video.shortViewCountText),
              publishedTime: parseRuns(video.publishedTimeText),
              type: 'video',
            });
            continue;
          }

          // Shorts reel
          const reel = item.richItemRenderer?.content?.reelItemRenderer || item.reelItemRenderer;
          if (reel && reel.videoId) {
            videos.push({
              id: reel.videoId,
              title: parseRuns(reel.headline || reel.title),
              thumbnail: parseThumbnail(reel.thumbnail),
              views: parseRuns(reel.viewCountText),
              author: { name: title, id: channelId },
              type: 'short',
            });
          }
        }
      }
    }
  }

  return {
    id: channelId,
    title: title || 'Channel',
    handle,
    description,
    avatar: avatar || 'https://picsum.photos/seed/channel/160/160',
    banner,
    subscribers,
    videoCount,
    isVerified,
    availableTabs,
    activeTabContent: {
      tabId: activeTabId,
      videos,
      playlists,
      continuation: continuationToken,
    },
  };
}
