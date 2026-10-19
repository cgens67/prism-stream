import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parsePlayerResponse } from '@/lib/innertube/parsers/player';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  try {
    // 1. Try VISIONOS client (provides direct unthrottled streams)
    let playerData: any = null;
    try {
      playerData = await postInnerTube({
        endpoint: 'player',
        clientType: 'VISIONOS',
        body: {
          videoId,
          contentCheckOk: true,
          racyCheckOk: true,
        },
      });
    } catch (e: any) {
      console.warn('VISIONOS player attempt failed, attempting fallback:', e?.message);
    }

    let parsed = playerData ? parsePlayerResponse(playerData) : null;

    // 2. If VISIONOS didn't yield formats, fall back to ANDROID_VR or WEB_REMIX
    if (!parsed || (!parsed.bestDirectStream && parsed.formats.length === 0)) {
      try {
        const vrData = await postInnerTube({
          endpoint: 'player',
          clientType: 'ANDROID_VR',
          body: {
            videoId,
            contentCheckOk: true,
            racyCheckOk: true,
          },
        });
        parsed = parsePlayerResponse(vrData);
      } catch (e: any) {
        console.warn('ANDROID_VR player fallback failed:', e?.message);
      }
    }

    // 3. If still no audio stream, try WEB_REMIX for audio
    if (!parsed || !parsed.bestAudioStream) {
      try {
        const musicData = await postInnerTube({
          endpoint: 'player',
          clientType: 'WEB_REMIX',
          useMusicBase: true,
          body: {
            videoId,
            contentCheckOk: true,
            racyCheckOk: true,
          },
        });
        const musicParsed = parsePlayerResponse(musicData);
        if (parsed) {
          if (!parsed.bestAudioStream && musicParsed.bestAudioStream) {
            parsed.bestAudioStream = musicParsed.bestAudioStream;
          }
          if (parsed.formats.length === 0 && musicParsed.formats.length > 0) {
            parsed.formats = musicParsed.formats;
            parsed.bestDirectStream = musicParsed.bestDirectStream;
          }
        } else {
          parsed = musicParsed;
        }
      } catch (e: any) {
        console.warn('WEB_REMIX fallback failed:', e?.message);
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: 'Unable to retrieve stream for this video' },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Player API error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch player stream' },
      { status: 500 }
    );
  }
}
