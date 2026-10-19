import { NextRequest, NextResponse } from 'next/server';
import { postInnerTube } from '@/lib/innertube/client';
import { parseRuns, parseThumbnail } from '@/lib/innertube/parsers/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ continuation: string }> }
) {
  const { continuation } = await params;

  if (!continuation) {
    return NextResponse.json({ error: 'continuation token is required' }, { status: 400 });
  }

  try {
    const res = await postInnerTube({
      endpoint: 'live_chat/get_live_chat',
      clientType: 'WEB',
      body: { continuation },
    });

    const actions =
      (res as any)?.continuationContents?.liveChatContinuation?.actions || [];
    const continuations =
      (res as any)?.continuationContents?.liveChatContinuation?.continuations || [];
    const nextContinuation =
      continuations[0]?.invalidationContinuationData?.continuation ||
      continuations[0]?.timedContinuationData?.continuation ||
      '';

    const messages = [];
    for (const a of actions) {
      const item = a.addChatItemAction?.item?.liveChatTextMessageRenderer;
      if (item) {
        messages.push({
          id: item.id,
          authorName: parseRuns(item.authorName),
          authorPhoto: parseThumbnail(item.authorPhoto),
          message: parseRuns(item.message),
          timestamp: parseRuns(item.timestampText),
        });
      }
    }

    return NextResponse.json({
      messages,
      continuation: nextContinuation,
    });
  } catch (error: any) {
    console.error('Live chat API error:', error?.message);
    return NextResponse.json({ messages: [], continuation: '' });
  }
}
