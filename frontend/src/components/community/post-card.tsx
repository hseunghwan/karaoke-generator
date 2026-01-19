/**
 * PostCard Component
 * 
 * 커뮤니티 피드에서 개별 포스트를 표시하는 카드 컴포넌트입니다.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "./like-button";
import { Play, Eye, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PostCardProps {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  tags?: string[];
  createdAt: string;
  onLike?: (postId: string, isLiked: boolean) => void;
  className?: string;
}

export function PostCard({
  id,
  title,
  description,
  thumbnailUrl,
  authorName,
  authorAvatar,
  viewCount,
  likeCount,
  commentCount,
  isLiked = false,
  tags = [],
  createdAt,
  onLike,
  className,
}: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleLike = (newIsLiked: boolean) => {
    onLike?.(id, newIsLiked);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <Link href={`/community/${id}`}>
        <div className="relative aspect-video bg-muted overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Play overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="h-6 w-6 text-primary fill-primary ml-1" />
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-black/60 text-white border-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-sm text-muted-foreground truncate">{authorName}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko })}
          </span>
        </div>

        {/* Title */}
        <Link href={`/community/${id}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {viewCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {commentCount.toLocaleString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LikeButton
            postId={id}
            initialLiked={isLiked}
            initialCount={likeCount}
            onLikeChange={handleLike}
            size="sm"
          />
        </div>
      </CardFooter>
    </Card>
  );
}
