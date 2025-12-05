"use client";

import { SubtitleSegment } from "@/types/subtitle";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';

interface SubtitleListProps {
    segments: SubtitleSegment[];
    activeSegmentId: string | null;
    onUpdate: (id: string, field: keyof SubtitleSegment, value: string | number) => void;
    onSeek: (time: number) => void;
}

export const SubtitleList = ({ segments, activeSegmentId, onUpdate, onSeek }: SubtitleListProps) => {
    const activeRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeSegmentId]);

    const formatTime = (ms: number) => {
        const date = new Date(ms);
        return date.toISOString().slice(14, 19); // mm:ss
    };

    return (
        <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
                {segments.map((seg) => {
                    const isActive = seg.id === activeSegmentId;

                    return (
                        <div
                            key={seg.id}
                            ref={isActive ? activeRef : null}
                            className={cn(
                                "p-4 rounded-lg border transition-all space-y-3",
                                isActive ? "bg-blue-50 border-blue-300 ring-1 ring-blue-200" : "bg-white border-gray-200 hover:border-gray-300"
                            )}
                        >
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                <div className="flex gap-2 font-mono bg-gray-100 px-2 py-1 rounded">
                                    <span className="cursor-pointer hover:text-blue-600" onClick={() => onSeek(seg.startTime)}>
                                        {formatTime(seg.startTime)}
                                    </span>
                                    <span>-</span>
                                    <span className="cursor-pointer hover:text-blue-600" onClick={() => onSeek(seg.endTime)}>
                                        {formatTime(seg.endTime)}
                                    </span>
                                </div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                                    Segment {seg.id.split('-')[1]}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">{t('editor.original')}</label>
                                    <Textarea
                                        value={seg.text}
                                        onChange={(e) => onUpdate(seg.id, 'text', e.target.value)}
                                        className="min-h-[2.5rem] resize-none text-sm"
                                        rows={1}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">{t('editor.translation')}</label>
                                    <Input
                                        value={seg.translation || ""}
                                        onChange={(e) => onUpdate(seg.id, 'translation', e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                                {seg.pronunciation && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">{t('editor.pronunciation')}</label>
                                        <Input
                                            value={seg.pronunciation}
                                            onChange={(e) => onUpdate(seg.id, 'pronunciation', e.target.value)}
                                            className="text-xs text-gray-500 font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
};
