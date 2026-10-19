import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parsePlaylistResponse } from '@/lib/innertube/parsers/playlist';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  const { playlistId } = await params;

  if (!playlistId) {
    return NextResponse.json({ error: 'playlistId is required' }, { status: 400 });
  }

  const browseId = playlistId.startsWith('VL') ? playlistId : `VL${playlistId}`;

  try {
    const res = await postInnerTube({
      endpoint: 'browse',
      clientType: 'WEB',
      body: { browseId },
    });

    const parsed = parsePlaylistResponse(res);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Playlist API error:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}
