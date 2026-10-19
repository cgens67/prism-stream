import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || !q.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const url = `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(
      q.trim()
    )}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const text = await res.text();
    const match = text.match(/\["(?:[^"\\]|\\.)*",\[([\s\S]*?)\]\s*,/);
    if (match && match[1]) {
      const rawEntries = `[${match[1]}]`;
      try {
        const parsed = JSON.parse(rawEntries);
        const suggestions = parsed
          .map((item: any) => (Array.isArray(item) ? item[0] : item))
          .filter((s: any) => typeof s === 'string');
        return NextResponse.json({ suggestions });
      } catch {
        // Fallback simple regex
        const matches = [...text.matchAll(/\["([^"]+)",\d+/g)].map((m) => m[1]);
        return NextResponse.json({ suggestions: matches });
      }
    }

    return NextResponse.json({ suggestions: [] });
  } catch (error: any) {
    console.error('Suggestions error:', error?.message);
    return NextResponse.json({ suggestions: [] });
  }
}
