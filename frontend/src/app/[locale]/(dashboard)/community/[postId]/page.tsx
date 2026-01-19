/**
 * Post Detail Page
 * 
 * 개별 포스트의 상세 페이지입니다.
 * 영상 재생, 좋아요, 댓글, 공유 기능을 제공합니다.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { LikeButton, CommentSection, type CommentItemData } from "@/components/community";
import { supabase, getSignedUrl } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  ArrowLeft,
  Play,
  Share2,
  Eye,
  Calendar,
  Globe,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRealtimeComments, useRealtimeLikes } from "@/hooks/use-realtime";

interface PostDetail {
  id: string;
  title: string;
  description: string | null;
  thumbnailPath: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  variants: {
    id: string;
    languageCode: string;
    storagePath: string;
    durationSeconds: number | null;
  }[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.postId as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 포스트 데이터 가져오기
  const fetchPost = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          description,
          thumbnail_path,
          view_count,
          like_count,
          comment_count,
          tags,
          created_at,
          profiles!posts_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          ),
          video_variants (
            id,
            language_code,
            storage_path,
            duration_seconds
          )
        `)
        .eq("id", postId)
        .single();

      if (error) throw error;

      // 좋아요 상태 확인
      let isLiked = false;
      if (user) {
        const { data: like } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .single();
        isLiked = !!like;
      }

      const postData: PostDetail = {
        id: data.id,
        title: data.title,
        description: data.description,
        thumbnailPath: data.thumbnail_path,
        viewCount: data.view_count,
        likeCount: data.like_count,
        commentCount: data.comment_count,
        isLiked,
        tags: data.tags || [],
        createdAt: data.created_at,
        author: {
          id: (data.profiles as any)?.id,
          username: (data.profiles as any)?.username || "unknown",
          displayName: (data.profiles as any)?.display_name,
          avatarUrl: (data.profiles as any)?.avatar_url,
        },
        variants: (data.video_variants || []).map((v: any) => ({
          id: v.id,
          languageCode: v.language_code,
          storagePath: v.storage_path,
          durationSeconds: v.duration_seconds,
        })),
      };

      setPost(postData);

      // 첫 번째 variant 선택
      if (postData.variants.length > 0) {
        setSelectedVariant(postData.variants[0].id);
      }

      // 조회수 증가 (비동기로 처리)
      supabase
        .from("posts")
        .update({ view_count: data.view_count + 1 })
        .eq("id", postId)
        .then();
    } catch (error) {
      console.error("Failed to fetch post:", error);
      toast.error("포스트를 불러오는데 실패했습니다");
      router.push("/community");
    } finally {
      setIsLoading(false);
    }
  }, [postId, user, router]);

  // 댓글 가져오기
  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          user_id,
          parent_id,
          like_count,
          created_at,
          profiles!comments_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // 사용자의 좋아요 상태 확인
      let likedCommentIds: string[] = [];
      if (user && data && data.length > 0) {
        const { data: likes } = await supabase
          .from("likes")
          .select("comment_id")
          .eq("user_id", user.id)
          .in(
            "comment_id",
            data.map((c) => c.id)
          );
        likedCommentIds = likes?.map((l) => l.comment_id as string) || [];
      }

      // 댓글 트리 구조 변환
      const commentMap = new Map<string, CommentItemData>();
      const rootComments: CommentItemData[] = [];

      data?.forEach((comment: any) => {
        const mappedComment: CommentItemData = {
          id: comment.id,
          content: comment.content,
          authorId: comment.user_id,
          authorName:
            comment.profiles?.display_name ||
            comment.profiles?.username ||
            "익명",
          authorAvatar: comment.profiles?.avatar_url,
          likeCount: comment.like_count,
          isLiked: likedCommentIds.includes(comment.id),
          createdAt: comment.created_at,
          replies: [],
        };

        commentMap.set(comment.id, mappedComment);

        if (!comment.parent_id) {
          rootComments.push(mappedComment);
        }
      });

      // 대댓글 연결
      data?.forEach((comment: any) => {
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          const child = commentMap.get(comment.id);
          if (parent && child) {
            parent.replies = parent.replies || [];
            parent.replies.push(child);
          }
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }, [postId, user]);

  // 비디오 URL 로드
  const loadVideoUrl = useCallback(async () => {
    if (!post || !selectedVariant) return;

    const variant = post.variants.find((v) => v.id === selectedVariant);
    if (!variant) return;

    setIsVideoLoading(true);

    try {
      const url = await getSignedUrl(variant.storagePath);
      setVideoUrl(url);
    } catch (error) {
      console.error("Failed to get video URL:", error);
      toast.error("영상을 불러오는데 실패했습니다");
    } finally {
      setIsVideoLoading(false);
    }
  }, [post, selectedVariant]);

  // 실시간 댓글 업데이트
  const { isConnected: isRealtimeConnected } = useRealtimeComments(postId, fetchComments);

  // 실시간 좋아요 업데이트
  useRealtimeLikes(postId, (newCount) => {
    if (post) {
      setPost({ ...post, likeCount: newCount });
    }
  });

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  useEffect(() => {
    loadVideoUrl();
  }, [loadVideoUrl]);

  // 공유 URL 복사
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("링크가 복사되었습니다");
    setTimeout(() => setCopied(false), 2000);
  };

  // 좋아요 변경 핸들러
  const handleLikeChange = (isLiked: boolean) => {
    if (post) {
      setPost({
        ...post,
        isLiked,
        likeCount: post.likeCount + (isLiked ? 1 : -1),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-xl font-semibold mb-2">포스트를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-4">
          삭제되었거나 존재하지 않는 포스트입니다.
        </p>
        <Link href="/community">
          <Button>커뮤니티로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        뒤로가기
      </Button>

      {/* Video Player */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
        {isVideoLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          </div>
        ) : videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full"
            poster={post.thumbnailPath || undefined}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Play className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-sm opacity-70">영상을 불러올 수 없습니다</p>
          </div>
        )}
      </div>

      {/* Video variants selector */}
      {post.variants.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {post.variants.map((variant) => (
            <Button
              key={variant.id}
              variant={selectedVariant === variant.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedVariant(variant.id)}
            >
              <Globe className="h-4 w-4 mr-1" />
              {variant.languageCode.toUpperCase()}
            </Button>
          ))}
        </div>
      )}

      {/* Post Info */}
      <div className="space-y-4">
        {/* Title */}
        <h1 className="text-2xl font-bold">{post.title}</h1>

        {/* Stats & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.viewCount.toLocaleString()} 조회
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.createdAt), "yyyy.MM.dd", { locale: ko })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <LikeButton
              postId={post.id}
              initialLiked={post.isLiked}
              initialCount={post.likeCount}
              onLikeChange={handleLikeChange}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  공유
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  링크 복사
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        window.location.href
                      )}&text=${encodeURIComponent(post.title)}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Twitter 공유
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Author */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary overflow-hidden">
                {post.author.avatarUrl ? (
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.displayName || post.author.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (post.author.displayName || post.author.username)
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {post.author.displayName || post.author.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  @{post.author.username}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {post.description && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{post.description}</p>
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/community?tag=${tag}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                >
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Comments */}
      <div className="relative">
        {/* Realtime indicator */}
        <div className="absolute -top-6 right-0 flex items-center gap-1 text-xs text-muted-foreground">
          {isRealtimeConnected ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span>실시간</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-muted-foreground" />
              <span>연결 중...</span>
            </>
          )}
        </div>

        <CommentSection
          postId={post.id}
          comments={comments}
          totalCount={post.commentCount}
          onCommentsChange={fetchComments}
        />
      </div>
    </div>
  );
}
