import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parseChannelResponse } from '@/lib/innertube/parsers/channel';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  if (!channelId) {
    return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const continuation = searchParams.get('continuation');
  const paramsQuery = searchParams.get('params');

  try {
    const body: Record<string, unknown> = continuation
      ? { continuation }
      : { browseId: channelId, ...(paramsQuery ? { params: paramsQuery } : {}) };

    const res = await postInnerTube({
      endpoint: 'browse',
      clientType: 'WEB',
      body,
    });

    const parsed = parseChannelResponse(channelId, res);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Channel API error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch channel' },
      { status: 500 }
    );
  }
}
