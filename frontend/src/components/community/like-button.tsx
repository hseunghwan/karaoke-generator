/**
 * LikeButton Component
 * 
 * 좋아요 버튼 컴포넌트입니다.
 * 낙관적 업데이트(Optimistic Update)를 지원합니다.
 */
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface LikeButtonProps {
  postId?: string;
  commentId?: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (isLiked: boolean) => void;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function LikeButton({
  postId,
  commentId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  size = "md",
  showCount = true,
  className,
}: LikeButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated || !user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    if (isLoading) return;

    // 낙관적 업데이트
    const previousLiked = isLiked;
    const previousCount = count;
    
    setIsLiked(!isLiked);
    setCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLikeChange?.(!isLiked);

    setIsLoading(true);

    try {
      if (isLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from("likes")
          .delete()
          .match({
            user_id: user.id,
            ...(postId && { post_id: postId }),
            ...(commentId && { comment_id: commentId }),
          });

        if (error) throw error;
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from("likes")
          .insert({
            user_id: user.id,
            ...(postId && { post_id: postId }),
            ...(commentId && { comment_id: commentId }),
          });

        if (error) throw error;
      }
    } catch (error) {
      // 롤백
      setIsLiked(previousLiked);
      setCount(previousCount);
      onLikeChange?.(previousLiked);
      toast.error("좋아요 처리에 실패했습니다");
      console.error("Like error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, isLiked, count, postId, commentId, isLoading, onLikeChange]);

  const sizeClasses = {
    sm: "h-8 px-2 text-xs",
    md: "h-9 px-3 text-sm",
    lg: "h-10 px-4 text-base",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        "gap-1.5 transition-colors",
        isLiked && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Heart
        className={cn(
          iconSizes[size],
          "transition-all duration-200",
          isLiked && "fill-current scale-110"
        )}
      />
      {showCount && <span>{count.toLocaleString()}</span>}
    </Button>
  );
}
