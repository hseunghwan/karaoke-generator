/**
 * useDashboardRealtime Hook
 * 
 * 대시보드에서 Job 상태 변경을 실시간으로 감지하는 훅입니다.
 * 기존 API 폴링과 병행하여 즉각적인 UI 업데이트를 제공합니다.
 */
"use client";

import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useJobStore } from "@/store/use-job-store";
import { toast } from "sonner";

export function useDashboardRealtime() {
  const { user, isAuthenticated } = useAuth();
  const { jobs, updateJobStatus, setJobs } = useJobStore();
  const [isConnected, setIsConnected] = useState(false);

  // Job 업데이트 처리
  const handleJobUpdate = useCallback(
    (payload: any) => {
      const newJob = payload.new;
      const oldJob = payload.old;

      // 상태 변경 시 토스트 알림
      if (oldJob?.status !== newJob.status) {
        if (newJob.status === "completed") {
          toast.success(`"${newJob.title}" 영상 생성이 완료되었습니다!`, {
            action: {
              label: "보기",
              onClick: () => window.location.href = `/jobs/${newJob.id}/editor`,
            },
          });
        } else if (newJob.status === "failed") {
          toast.error(`"${newJob.title}" 처리 중 오류가 발생했습니다.`, {
            description: newJob.error || "알 수 없는 오류",
          });
        }
      }

      // Store 업데이트
      updateJobStatus(
        newJob.id,
        newJob.status.toUpperCase(),
        newJob.progress
      );
    },
    [updateJobStatus]
  );

  // 실시간 구독
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsConnected(false);
      return;
    }

    const channel = supabase
      .channel(`dashboard:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `user_id=eq.${user.id}`,
        },
        handleJobUpdate
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "jobs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // 새 Job 추가 시 목록 새로고침
          toast.info("새로운 작업이 시작되었습니다.");
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          console.log("Dashboard realtime connected");
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [isAuthenticated, user, handleJobUpdate]);

  return { isConnected };
}

/**
 * useJobRealtimeStatus Hook
 * 
 * 개별 Job의 상태를 실시간으로 추적하는 훅입니다.
 * Editor 페이지에서 처리 중인 Job의 진행 상황을 표시하는 데 사용됩니다.
 */
export function useJobRealtimeStatus(jobId: string) {
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [detail, setDetail] = useState<string | null>(null);
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
          const job = payload.new as any;
          setStatus(job.status);
          setProgress(job.progress || 0);
          setDetail(job.detail);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      channel.unsubscribe();
    };
  }, [jobId]);

  return { status, progress, detail, isConnected };
}
