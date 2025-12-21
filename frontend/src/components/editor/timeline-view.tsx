"use client";

import { SubtitleSegment } from "@/types/subtitle";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface TimelineProps {
  segments: SubtitleSegment[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const TimelineView = ({ segments, currentTime, duration, onSeek }: TimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth);
    }
    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    };
    window.addEventListener('resize', handleResize);

    // Generate static random heights on client-side only to avoid hydration mismatch
    setWaveformHeights(Array.from({ length: 100 }, () => Math.random() * 100));

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / width;
    onSeek(percentage * duration);
  };

  // simple milliseconds to pixels conversion for visualization
  const msToPx = (ms: number) => {
    if (duration === 0) return 0;
    return (ms / duration) * 100;
  };

  return (
    <div className="bg-slate-900 rounded-lg p-4 space-y-2 select-none">
      <div className="flex justify-between text-xs text-slate-400 font-mono">
        <span>00:00</span>
        <span>{(duration / 1000).toFixed(1)}s</span>
      </div>

      <div
        ref={containerRef}
        className="relative h-24 bg-slate-800 rounded cursor-pointer overflow-hidden group"
        onClick={handleTrackClick}
      >
        {/* Mock Waveform Background */}
        <div className="absolute inset-0 opacity-20 flex items-center gap-[2px]">
          {waveformHeights.map((height, i) => (
            <div
              key={i}
              className="w-full bg-slate-400"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-20 pointer-events-none transition-all duration-75"
          style={{ left: `${msToPx(currentTime)}%` }}
        >
          <div className="w-3 h-3 -ml-[5px] bg-red-500 transform rotate-45 -mt-1.5" />
        </div>

        {/* Subtitle Blocks */}
        {segments.map((seg) => {
          const startPct = msToPx(seg.startTime);
          const widthPct = msToPx(seg.endTime - seg.startTime);
          const isActive = currentTime >= seg.startTime && currentTime <= seg.endTime;

          return (
            <div
              key={seg.id}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-12 rounded-md border border-white/20 flex items-center justify-center px-2 overflow-hidden text-[10px] text-white/90 transition-colors",
                isActive ? "bg-blue-600/80 border-blue-400 z-10" : "bg-slate-700/80 hover:bg-slate-600/80"
              )}
              style={{
                left: `${startPct}%`,
                width: `${widthPct}%`
              }}
              title={seg.text}
            >
              <span className="truncate">{seg.text}</span>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs text-slate-500">
        Click on timeline to seek • Drag blocks to adjust (Coming Soon)
      </div>
    </div>
  );
};
