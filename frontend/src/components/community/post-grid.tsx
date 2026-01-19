/**
 * PostGrid Component
 * 
 * 포스트 카드들을 그리드 레이아웃으로 표시하는 컴포넌트입니다.
 * 무한 스크롤과 정렬 옵션을 지원합니다.
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { PostCard, type PostCardProps } from "./post-card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = "latest" | "popular" | "trending";

interface PostGridProps {
  posts: Omit<PostCardProps, "onLike">[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onLike?: (postId: string, isLiked: boolean) => void;
  emptyMessage?: string;
  className?: string;
}

export function PostGrid({
  posts,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onLike,
  emptyMessage = "아직 포스트가 없습니다.",
  className,
}: PostGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 무한 스크롤 설정
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  // 빈 상태
  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            {...post}
            onLike={onLike}
          />
        ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-1" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* End of list */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          모든 포스트를 불러왔습니다.
        </div>
      )}
    </div>
  );
}
