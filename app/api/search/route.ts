import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parseSearchResponse, parseMusicSearchResponse } from '@/lib/innertube/parsers/search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'video';
  const params = searchParams.get('params') || undefined;
  const continuation = searchParams.get('continuation') || undefined;

  if (!q && !continuation) {
    return NextResponse.json({ items: [] });
  }

  try {
    if (type === 'music') {
      const res = await postInnerTube({
        endpoint: 'search',
        clientType: 'WEB_REMIX',
        useMusicBase: true,
        body: continuation ? { continuation } : { query: q, params },
      });

      const parsed = parseMusicSearchResponse(res);
      return NextResponse.json({ items: parsed.items });
    }

    // Video Search
    const res = await postInnerTube({
      endpoint: 'search',
      clientType: 'WEB',
      body: continuation ? { continuation } : { query: q, params },
    });

    const parsed = parseSearchResponse(res);
    return NextResponse.json({
      items: parsed.items,
      continuation: parsed.continuation,
    });
  } catch (error: any) {
    console.error('Search API error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Search failed', items: [] },
      { status: 500 }
    );
  }
}
