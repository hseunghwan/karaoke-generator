/**
 * CommentSection Component
 * 
 * 댓글 목록과 댓글 작성 폼을 포함하는 섹션 컴포넌트입니다.
 */
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CommentItem, type CommentItemData } from "./comment-item";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";

interface CommentSectionProps {
  postId: string;
  comments: CommentItemData[];
  totalCount: number;
  isLoading?: boolean;
  onCommentsChange?: () => void;
}

export function CommentSection({
  postId,
  comments,
  totalCount,
  isLoading = false,
  onCommentsChange,
}: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 댓글 작성
  const handleSubmitComment = useCallback(async () => {
    if (!isAuthenticated || !user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      toast.success("댓글이 등록되었습니다");
      onCommentsChange?.();
    } catch (error) {
      console.error("Failed to submit comment:", error);
      toast.error("댓글 등록에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, user, newComment, postId, onCommentsChange]);

  // 답글 작성
  const handleReply = useCallback(
    async (parentId: string, content: string) => {
      if (!isAuthenticated || !user) {
        toast.error("로그인이 필요합니다");
        return;
      }

      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        parent_id: parentId,
        content,
      });

      if (error) throw error;

      toast.success("답글이 등록되었습니다");
      onCommentsChange?.();
    },
    [isAuthenticated, user, postId, onCommentsChange]
  );

  // 댓글 삭제
  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!isAuthenticated || !user) return;

      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("댓글이 삭제되었습니다");
      onCommentsChange?.();
    },
    [isAuthenticated, user, onCommentsChange]
  );

  // 댓글 신고
  const handleReport = useCallback((commentId: string) => {
    toast.info("신고 기능은 준비 중입니다");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">댓글</h3>
        <span className="text-muted-foreground">({totalCount})</span>
      </div>

      {/* Comment form */}
      {isAuthenticated ? (
        <div className="space-y-3">
          <Textarea
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              댓글 등록
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-muted-foreground mb-2">
            댓글을 작성하려면 로그인이 필요합니다.
          </p>
          <Link href="/login">
            <Button variant="outline" size="sm">
              로그인
            </Button>
          </Link>
        </div>
      )}

      <Separator />

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>아직 댓글이 없습니다.</p>
          <p className="text-sm">첫 번째 댓글을 남겨보세요!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={handleReply}
              onDelete={handleDelete}
              onReport={handleReport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
