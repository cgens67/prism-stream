import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parseReelSequenceResponse } from '@/lib/innertube/parsers/reel';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sequenceParams = searchParams.get('sequenceParams');

  try {
    const res = await postInnerTube({
      endpoint: 'reel/reel_watch_sequence',
      clientType: 'WEB',
      body: sequenceParams ? { sequenceParams } : {},
    });

    const parsed = parseReelSequenceResponse(res);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.warn('Reel sequence error, attempting fallback via search shorts:', error?.message);
    try {
      // Fallback: search for shorts
      const searchRes = await postInnerTube({
        endpoint: 'search',
        clientType: 'WEB',
        body: { query: '#shorts' },
      });
      const { parseSearchResponse } = await import('@/lib/innertube/parsers/search');
      const searchParsed = parseSearchResponse(searchRes);
      const shortsItems = searchParsed.items.filter((i) => i.type === 'short' || i.type === 'video');
      return NextResponse.json({
        items: shortsItems,
      });
    } catch (e: any) {
      return NextResponse.json(
        { error: error?.message || 'Failed to fetch shorts reel', items: [] },
        { status: 500 }
      );
    }
  }
}
