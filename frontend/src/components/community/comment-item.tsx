/**
 * CommentItem Component
 * 
 * 개별 댓글을 표시하는 컴포넌트입니다.
 * 대댓글(답글)을 지원합니다.
 */
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LikeButton } from "./like-button";
import { MessageCircle, MoreHorizontal, Trash2, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export interface CommentItemData {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: CommentItemData[];
}

interface CommentItemProps {
  comment: CommentItemData;
  postId: string;
  isReply?: boolean;
  onReply?: (parentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  onReport?: (commentId: string) => void;
  className?: string;
}

export function CommentItem({
  comment,
  postId,
  isReply = false,
  onReply,
  onDelete,
  onReport,
  className,
}: CommentItemProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = user?.id === comment.authorId;

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onReply?.(comment.id, replyContent.trim());
      setReplyContent("");
      setShowReplyForm(false);
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 이 댓글을 삭제하시겠습니까?")) return;
    await onDelete?.(comment.id);
  };

  return (
    <div className={cn("group", className)}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0 overflow-hidden">
          {comment.authorAvatar ? (
            <img
              src={comment.authorAvatar}
              alt={comment.authorName}
              className="w-full h-full object-cover"
            />
          ) : (
            comment.authorName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>

          <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <LikeButton
              commentId={comment.id}
              initialLiked={comment.isLiked}
              initialCount={comment.likeCount}
              size="sm"
            />

            {!isReply && onReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                답글
              </Button>
            )}

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && onDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                )}
                {!isAuthor && onReport && (
                  <DropdownMenuItem onClick={() => onReport(comment.id)}>
                    <Flag className="h-4 w-4 mr-2" />
                    신고
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="답글을 입력하세요..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent("");
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? "등록 중..." : "답글 등록"}
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-muted">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  isReply
                  onDelete={onDelete}
                  onReport={onReport}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
