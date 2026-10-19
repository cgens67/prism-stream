import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parsePlaylistResponse } from '@/lib/innertube/parsers/playlist';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  const { albumId } = await params;

  if (!albumId) {
    return NextResponse.json({ error: 'albumId is required' }, { status: 400 });
  }

  try {
    const res = await postInnerTube({
      endpoint: 'browse',
      clientType: 'WEB_REMIX',
      useMusicBase: true,
      body: { browseId: albumId },
    });

    const parsed = parsePlaylistResponse(res);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Album API error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch album' },
      { status: 500 }
    );
  }
}
