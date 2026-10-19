import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parseReelOverlayResponse } from '@/lib/innertube/parsers/reel';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  try {
    const res = await postInnerTube({
      endpoint: 'reel/reel_item_watch',
      clientType: 'WEB',
      body: {
        playerRequest: {
          videoId,
        },
      },
    });

    const parsed = parseReelOverlayResponse(res);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Reel overlay error:', error?.message);
    return NextResponse.json({ likeCount: '', commentCount: '', soundTitle: '' });
  }
}
