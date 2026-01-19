/**
 * useRealtime Hooks
 * 
 * Supabase Realtime을 활용한 실시간 업데이트 훅들입니다.
 */
"use client";

import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE";

/**
 * 테이블의 실시간 변경사항을 구독하는 훅
 */
export function useRealtimeSubscription<T extends { id: string }>(
  tableName: string,
  filter?: { column: string; value: string },
  events: ChangeEvent[] = ["INSERT", "UPDATE", "DELETE"]
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [lastChange, setLastChange] = useState<{
    event: ChangeEvent;
    data: T;
  } | null>(null);

  const subscribe = useCallback(() => {
    const channelName = `${tableName}-changes-${filter?.value || "all"}`;
    
    const newChannel = supabase.channel(channelName);

    events.forEach((event) => {
      newChannel.on(
        "postgres_changes" as any,
        {
          event,
          schema: "public",
          table: tableName,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          const data = (payload.new || payload.old) as T;
          setLastChange({ event: payload.eventType as ChangeEvent, data });
        }
      );
    });

    newChannel.subscribe();
    setChannel(newChannel);

    return newChannel;
  }, [tableName, filter?.column, filter?.value, events]);

  useEffect(() => {
    const ch = subscribe();

    return () => {
      ch.unsubscribe();
    };
  }, [subscribe]);

  return { channel, lastChange };
}

/**
 * 댓글 실시간 업데이트 훅
 */
export function useRealtimeComments(postId: string, onUpdate: () => void) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log("Comment realtime update:", payload);
          onUpdate();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      channel.unsubscribe();
    };
  }, [postId, onUpdate]);

  return { isConnected };
}

/**
 * 좋아요 실시간 업데이트 훅
 */
export function useRealtimeLikes(
  postId: string,
  onLikeChange: (likeCount: number) => void
) {
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`likes:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          // 좋아요 수 다시 가져오기
          const { count } = await supabase
            .from("likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId);

          if (count !== null) {
            onLikeChange(count);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [postId, onLikeChange]);
}

/**
 * Job 상태 실시간 업데이트 훅
 */
export function useRealtimeJobStatus(
  jobId: string,
  onStatusChange: (status: string, progress: number, detail?: string) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const newData = payload.new as {
            status: string;
            progress: number;
            detail?: string;
          };
          onStatusChange(newData.status, newData.progress, newData.detail);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      channel.unsubscribe();
    };
  }, [jobId, onStatusChange]);

  return { isConnected };
}

/**
 * 알림 실시간 업데이트 훅
 */
export function useRealtimeNotifications(
  userId: string | undefined,
  onNewNotification: (notification: any) => void
) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // 읽지 않은 알림 수 가져오기
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setUnreadCount((prev) => prev + 1);
          onNewNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, onNewNotification]);

  return { unreadCount, setUnreadCount };
}
