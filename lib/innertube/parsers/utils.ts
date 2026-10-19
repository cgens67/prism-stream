export function parseRuns(obj: unknown): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object') {
    const o = obj as Record<string, unknown>;
    if (typeof o.simpleText === 'string') return o.simpleText;
    if (Array.isArray(o.runs)) {
      return o.runs
        .map((r: { text?: string }) => r?.text || '')
        .join('');
    }
  }
  return '';
}

export function parseThumbnail(obj: unknown): string {
  if (!obj) return '';
  let thumbnails: { url: string; width?: number; height?: number }[] = [];
  if (Array.isArray(obj)) {
    thumbnails = obj;
  } else if (typeof obj === 'object' && obj !== null) {
    const o = obj as Record<string, unknown>;
    if (Array.isArray(o.thumbnails)) {
      thumbnails = o.thumbnails as { url: string; width?: number; height?: number }[];
    }
  }

  if (thumbnails.length === 0) return '';
  // Pick highest resolution
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  const url = sorted[0]?.url || '';
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

export function parseDurationToSeconds(durationText: string): number {
  if (!durationText) return 0;
  const parts = durationText.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
