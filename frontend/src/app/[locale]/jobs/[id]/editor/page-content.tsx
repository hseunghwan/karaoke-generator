"use client";

import { useState, useRef, useEffect } from "react";
import { MOCK_SUBTITLES, SubtitleSegment } from "@/types/subtitle";
import { TimelineView } from "@/components/editor/timeline-view";
import { SubtitleList } from "@/components/editor/subtitle-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { useJobStore } from "@/store/use-job-store";

export default function EditorPage() {
  const params = useParams();
  const { jobs } = useJobStore();
  const [segments, setSegments] = useState<SubtitleSegment[]>(MOCK_SUBTITLES);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(15000); // Mock duration: 15s
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();

  // Find current job info
  const currentJob = jobs.find(j => j.id === params.id);

  // Mock Video Playback Logic (since we don't have a real file)
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 100; // 100ms tick
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, duration]);

  const handleUpdateSegment = (id: string, field: keyof SubtitleSegment, value: string | number) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, [field]: value } : seg))
    );
  };

  const handleSeek = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  };

  const handleSave = () => {
    toast.success(t('editor.save_changes') + " " + t('common.save'));
    // In real app: POST /api/jobs/{id}/subtitles
  };

  const togglePlay = () => {
    if (currentTime >= duration) setCurrentTime(0);
    setIsPlaying(!isPlaying);
  };

  // Find active segment
  const activeSegmentId = segments.find(
    seg => currentTime >= seg.startTime && currentTime <= seg.endTime
  )?.id || null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{currentJob?.title || t('editor.title')}</h2>
              {currentJob?.status === 'COMPLETED' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {t('dashboard.completed') || 'Completed'}
                </Badge>
              )}
            </div>
            {currentJob && <span className="text-xs text-muted-foreground">{currentJob.artist}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSegments(MOCK_SUBTITLES)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('editor.reset')}
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {t('editor.save_changes')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 overflow-hidden">

        {/* Left Panel: Video & Timeline */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Video Preview Mock */}
          <div className="flex-1 bg-black rounded-lg relative flex items-center justify-center group">
            {/* Placeholder for video element */}
            <div className="text-white/50 text-lg font-medium flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors cursor-pointer" onClick={togglePlay}>
                {isPlaying ? <Pause className="fill-white" /> : <Play className="fill-white ml-1" />}
              </div>
              <span>{t('editor.preview')}</span>
              <span className="text-sm mt-2 font-mono text-white/30">
                {(currentTime / 1000).toFixed(1)}s / {(duration / 1000).toFixed(1)}s
              </span>
            </div>

            {/* Overlay Subtitles */}
            <div className="absolute bottom-10 left-0 right-0 text-center px-8">
              {activeSegmentId && (
                <div className="bg-black/60 inline-block px-4 py-2 rounded text-white text-lg leading-tight backdrop-blur-sm">
                  {segments.find(s => s.id === activeSegmentId)?.text}
                  <div className="text-sm text-yellow-300 mt-1">
                    {segments.find(s => s.id === activeSegmentId)?.translation}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="shrink-0">
            <TimelineView
              segments={segments}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
          </div>
        </div>

        {/* Right Panel: Subtitle List */}
        <div className="w-[400px] border rounded-lg bg-white shadow-sm shrink-0 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gray-50 font-medium flex justify-between items-center">
            <span>Subtitle Tracks</span>
            <span className="text-xs text-gray-500">{segments.length} segments</span>
          </div>
          <SubtitleList
            segments={segments}
            activeSegmentId={activeSegmentId}
            onUpdate={handleUpdateSegment}
            onSeek={handleSeek}
          />
        </div>

      </div>
    </div>
  );
}
