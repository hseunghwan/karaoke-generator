"use client";

import { useState, useRef, useEffect } from "react";
import { SubtitleSegment } from "@/types/subtitle";
import { TimelineView } from "@/components/editor/timeline-view";
import { SubtitleList } from "@/components/editor/subtitle-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, ArrowLeft, Play, Pause, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { api } from "@/lib/api";

export default function EditorPage() {
  const params = useParams();
  const { t } = useTranslation();

  const [job, setJob] = useState<any>(null);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchJob = async () => {
      try {
        const { data } = await api.get(`/jobs/${params.id}`);
        if (!isMounted) return;

        setJob(data);

        if (data.status === 'COMPLETED' && data.result?.lyrics?.segments) {
          const mappedSegments = data.result.lyrics.segments.map((s: any, idx: number) => ({
            id: `seg-${idx}`,
            startTime: s.start * 1000,
            endTime: s.end * 1000,
            text: s.text,
            translation: s.translated,
            pronunciation: s.romanized
          }));
          setSegments(mappedSegments);

          if (mappedSegments.length > 0) {
            setDuration(mappedSegments[mappedSegments.length - 1].endTime + 5000);
          } else {
            setDuration(30000);
          }
        } else if (['PENDING', 'PROCESSING', 'QUEUED', 'UPLOADING'].includes(data.status)) {
          // Poll every 2 seconds
          setTimeout(fetchJob, 2000);
        }
      } catch (error) {
        console.error("Failed to fetch job:", error);
        toast.error("Failed to load job details");
      }
    };

    fetchJob();
    return () => { isMounted = false; };
  }, [params.id]);

  // Playback Logic
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
    // In real app: POST /api/jobs/{id}/subtitles with segments
  };

  const togglePlay = () => {
    if (currentTime >= duration) setCurrentTime(0);
    setIsPlaying(!isPlaying);
  };

  // Find active segment
  const activeSegmentId = segments.find(
    seg => currentTime >= seg.startTime && currentTime <= seg.endTime
  )?.id || null;

  if (!job) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (job.status === 'FAILED') {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-red-600">Job Processing Failed</h2>
        <p className="text-muted-foreground">{job.error || "An unknown error occurred."}</p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Show progress screen if not completed
  if (job.status !== 'COMPLETED') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] -m-8 p-8 bg-gray-50/50">
        <div className="w-full max-w-lg space-y-8 bg-white p-10 rounded-xl shadow-sm border text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {job.status === 'PENDING' ? 'Waiting in Queue' : 'Processing Your Job'}
            </h2>
            <p className="text-muted-foreground">
              {job.title} - {job.artist}
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative pt-2">
              <div className="flex mb-2 items-center justify-between">
                <div className="text-right w-full">
                  <span className="text-xs font-semibold inline-block text-primary">
                    {job.progress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-secondary">
                <div style={{ width: `${job.progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500 ease-in-out"></div>
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm font-medium animate-pulse">
              {job.detail || (job.status === 'PENDING' ? "Waiting for worker to pick up the job..." : "Processing...")}
            </div>

            {job.status === 'PENDING' && (
              <p className="text-xs text-muted-foreground">
                Your job is pending because the server is currently handling other requests. It will start automatically.
              </p>
            )}
          </div>

          <div className="pt-4">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <h2 className="text-xl font-bold tracking-tight">{job.title || t('editor.title')}</h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Completed
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{job.artist}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSegments([])}>
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
