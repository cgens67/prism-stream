import { VideoItem } from '../types';
import { parseRuns, parseThumbnail } from './utils';

export function parseReelSequenceResponse(data: Record<string, unknown>): {
  items: VideoItem[];
  sequenceParams?: string;
} {
  const items: VideoItem[] = [];
  const entries = (data as any)?.entries || [];
  let sequenceParams: string | undefined;

  for (const entry of entries) {
    const reel = entry.command?.reelWatchEndpoint;
    if (reel && reel.videoId) {
      items.push({
        id: reel.videoId,
        title: parseRuns(reel.overlay?.reelPlayerOverlayRenderer?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.reelTitleText) || 'Shorts',
        thumbnail: parseThumbnail(reel.thumbnail),
        author: {
          name: parseRuns(reel.overlay?.reelPlayerOverlayRenderer?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.channelTitleText),
          id: reel.overlay?.reelPlayerOverlayRenderer?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.channelNavigationEndpoint?.browseEndpoint?.browseId,
          avatar: parseThumbnail(reel.overlay?.reelPlayerOverlayRenderer?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.channelThumbnail),
        },
        views: parseRuns(reel.overlay?.reelPlayerOverlayRenderer?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.viewCountText),
        type: 'short',
      });
      if (reel.sequenceParams) {
        sequenceParams = reel.sequenceParams;
      }
    }
  }

  return { items, sequenceParams };
}

export function parseReelOverlayResponse(data: Record<string, unknown>): {
  likeCount?: string;
  commentCount?: string;
  soundTitle?: string;
} {
  const overlay = (data as any)?.overlay?.reelPlayerOverlayRenderer;
  let likeCount: string | undefined;
  let commentCount: string | undefined;
  let soundTitle: string | undefined;

  if (overlay) {
    const actions = overlay.actions || [];
    for (const action of actions) {
      const likeBtn = action.likeButtonRenderer?.likeButton?.toggleButtonRenderer;
      if (likeBtn) {
        likeCount = parseRuns(likeBtn.defaultText);
      }
    }
    soundTitle = parseRuns(overlay.soundMetadata?.musicMetadataRenderer?.title);
  }

  return { likeCount, commentCount, soundTitle };
}
