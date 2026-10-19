import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parseWatchResponse } from '@/lib/innertube/parsers/watch';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  try {
    const res = await postInnerTube({
      endpoint: 'next',
      clientType: 'WEB',
      body: {
        videoId,
      },
    });

    const parsed = parseWatchResponse(videoId, res);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Watch API error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch watch metadata' },
      { status: 500 }
    );
  }
}
