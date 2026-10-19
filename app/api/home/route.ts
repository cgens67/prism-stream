import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parseVideoHomeResponse, parseMusicHomeResponse } from '@/lib/innertube/parsers/home';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'video';
  const continuation = searchParams.get('continuation');

  try {
    if (type === 'music') {
      const body: Record<string, unknown> = continuation
        ? { continuation }
        : { browseId: 'FEmusic_home' };

      const res = await postInnerTube({
        endpoint: 'browse',
        clientType: 'WEB_REMIX',
        useMusicBase: true,
        body,
      });

      const parsed = parseMusicHomeResponse(res);
      // If music home is empty, try charts
      if (parsed.shelves.length === 0 && !continuation) {
        const chartsRes = await postInnerTube({
          endpoint: 'browse',
          clientType: 'WEB_REMIX',
          useMusicBase: true,
          body: { browseId: 'FEmusic_charts' },
        });
        const chartsParsed = parseMusicHomeResponse(chartsRes);
        return NextResponse.json({
          type: 'music',
          shelves: chartsParsed.shelves,
          continuation: chartsParsed.continuation,
        });
      }

      return NextResponse.json({
        type: 'music',
        shelves: parsed.shelves,
        continuation: parsed.continuation,
      });
    }

    // Video Home
    const body: Record<string, unknown> = continuation
      ? { continuation }
      : { browseId: 'FEwhat_to_watch' };

    const res = await postInnerTube({
      endpoint: 'browse',
      clientType: 'WEB',
      body,
    });

    const parsed = parseVideoHomeResponse(res);
    return NextResponse.json({
      type: 'video',
      items: parsed.items,
      shelves: parsed.shelves,
      continuation: parsed.continuation,
    });
  } catch (error: any) {
    console.error('Home API error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch home feed', items: [], shelves: [] },
      { status: 500 }
    );
  }
}
