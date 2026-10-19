'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Chapter, HeatmapPoint } from '@/lib/innertube/types';
import { formatDuration } from '@/lib/innertube/parsers/utils';

interface HeatmapTimelineProps {
  currentTime: number;
  duration: number;
  chapters: Chapter[];
  heatmap: HeatmapPoint[];
  onSeek: (seconds: number) => void;
}

export function HeatmapTimeline({
  currentTime,
  duration,
  chapters,
  heatmap,
  onSeek,
}: HeatmapTimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverFraction, setHoverFraction] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const progressFraction = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  // Active chapter lookup
  const activeChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return null;
    let found = chapters[0];
    for (const ch of chapters) {
      if (currentTime >= ch.timeStartSeconds) {
        found = ch;
      } else {
        break;
      }
    }
    return found;
  }, [chapters, currentTime]);

  // Hover chapter lookup
  const hoverChapter = useMemo(() => {
    if (hoverFraction === null || !chapters || chapters.length === 0) return null;
    const targetSeconds = hoverFraction * duration;
    let found = chapters[0];
    for (const ch of chapters) {
      if (targetSeconds >= ch.timeStartSeconds) {
        found = ch;
      } else {
        break;
      }
    }
    return found;
  }, [chapters, hoverFraction, duration]);

  // Generate SVG path for heatmap
  const heatmapSvgPath = useMemo(() => {
    if (!heatmap || heatmap.length < 2) return null;
    const width = 1000;
    const height = 36;

    const points = heatmap.map((p, idx) => {
      const x = (idx / (heatmap.length - 1)) * width;
      // Invert y: 0 intensity at bottom (height), 1 at top (4px padding)
      const y = height - p.value * (height - 6);
      return { x, y };
    });

    // Create smoothed curve
    let d = `M 0,${height} L 0,${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` Q ${p0.x},${p0.y} ${cx},${(p0.y + p1.y) / 2}`;
    }
    d += ` L ${width},${points[points.length - 1].y} L ${width},${height} Z`;

    return d;
  }, [heatmap]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current || duration <= 0) return;
    setIsScrubbing(true);
    const rect = containerRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(frac * duration);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverFraction(frac);

    if (isScrubbing) {
      onSeek(frac * duration);
    }
  };

  const handlePointerUp = () => {
    setIsScrubbing(false);
  };

  return (
    <div
      className="relative select-none py-2 px-1 cursor-pointer group"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        setHoverFraction(null);
        setIsScrubbing(false);
      }}
      onPointerUp={handlePointerUp}
    >
      {/* Heatmap Area Visualizer */}
      {heatmapSvgPath && (
        <div className="absolute -top-7 left-1 right-1 h-8 pointer-events-none opacity-40 group-hover:opacity-90 transition-opacity duration-200">
          <svg
            viewBox="0 0 1000 36"
            preserveAspectRatio="none"
            className="w-full h-full fill-[#ff6f43]/40 stroke-[#ff6f43]/70 stroke-[1.5]"
          >
            <path d={heatmapSvgPath} />
          </svg>
        </div>
      )}

      {/* Hover preview tooltip */}
      {hoverFraction !== null && (
        <div
          className="absolute -top-10 -translate-x-1/2 pointer-events-none z-30 px-2 py-1 rounded-md bg-[#212737] border border-[#3c4355] text-[11px] font-medium text-white shadow-xl flex items-center gap-1.5 whitespace-nowrap"
          style={{ left: `${hoverFraction * 100}%` }}
        >
          <span>{formatDuration(hoverFraction * duration)}</span>
          {hoverChapter && (
            <>
              <span className="text-[#9da4b6]">·</span>
              <span className="text-[#ffdbd1] font-normal truncate max-w-[140px]">
                {hoverChapter.title}
              </span>
            </>
          )}
        </div>
      )}

      {/* Main Timeline Bar */}
      <div className="relative h-1.5 group-hover:h-2.5 bg-white/20 rounded-full overflow-hidden transition-all duration-150">
        {/* Played Progress Bar */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-[#ff6f43] rounded-full transition-all duration-75"
          style={{ width: `${progressFraction * 100}%` }}
        />

        {/* Hover Highlight */}
        {hoverFraction !== null && (
          <div
            className="absolute left-0 top-0 bottom-0 bg-white/25 rounded-full pointer-events-none"
            style={{ width: `${hoverFraction * 100}%` }}
          />
        )}

        {/* Chapter break dividers */}
        {chapters.map((ch, idx) => {
          if (idx === 0) return null;
          const leftPct = (ch.timeStartSeconds / duration) * 100;
          if (leftPct <= 0 || leftPct >= 100) return null;
          return (
            <div
              key={idx}
              className="absolute top-0 bottom-0 w-[2px] bg-black/60 z-10"
              style={{ left: `${leftPct}%` }}
            />
          );
        })}
      </div>

      {/* Scrub handle knob */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#ff6f43] shadow-md border-2 border-white scale-0 group-hover:scale-100 transition-transform duration-100 pointer-events-none"
        style={{ left: `${progressFraction * 100}%` }}
      />
    </div>
  );
}
