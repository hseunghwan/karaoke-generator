/**
 * Community Page
 * 
 * 커뮤니티 피드 페이지입니다.
 * 최신순/인기순/추천순 정렬 및 무한 스크롤을 지원합니다.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PostGrid, type SortOption, type PostCardProps } from "@/components/community";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  TrendingUp,
  Clock,
  Sparkles,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 12;

export default function CommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [posts, setPosts] = useState<Omit<PostCardProps, "onLike">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "latest"
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedTag, setSelectedTag] = useState(searchParams.get("tag") || "");

  // 인기 태그 (실제로는 API에서 가져와야 함)
  const popularTags = ["kpop", "jpop", "ballad", "rock", "hiphop", "anime", "ost"];

  // 포스트 가져오기
  const fetchPosts = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      setIsLoading(true);

      try {
        let query = supabase
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
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("moderation_status", "approved");

        // 정렬
        if (sortBy === "latest") {
          query = query.order("created_at", { ascending: false });
        } else if (sortBy === "popular") {
          query = query.order("like_count", { ascending: false });
        } else if (sortBy === "trending") {
          // 트렌딩은 최근 7일 내 좋아요 수 기준
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          query = query
            .gte("created_at", weekAgo.toISOString())
            .order("like_count", { ascending: false });
        }

        // 검색
        if (searchQuery) {
          query = query.ilike("title", `%${searchQuery}%`);
        }

        // 태그 필터
        if (selectedTag) {
          query = query.contains("tags", [selectedTag]);
        }

        // 페이지네이션
        query = query.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        const { data, error } = await query;

        if (error) throw error;

        // 사용자의 좋아요 상태 확인
        let likedPostIds: string[] = [];
        if (user && data && data.length > 0) {
          const { data: likes } = await supabase
            .from("likes")
            .select("post_id")
            .eq("user_id", user.id)
            .in(
              "post_id",
              data.map((p) => p.id)
            );
          likedPostIds = likes?.map((l) => l.post_id as string) || [];
        }

        // 데이터 변환
        const mappedPosts: Omit<PostCardProps, "onLike">[] = (data || []).map(
          (post: any) => ({
            id: post.id,
            title: post.title,
            description: post.description,
            thumbnailUrl: post.thumbnail_path,
            authorName:
              post.profiles?.display_name ||
              post.profiles?.username ||
              "익명",
            authorAvatar: post.profiles?.avatar_url,
            viewCount: post.view_count,
            likeCount: post.like_count,
            commentCount: post.comment_count,
            isLiked: likedPostIds.includes(post.id),
            tags: post.tags || [],
            createdAt: post.created_at,
          })
        );

        if (reset) {
          setPosts(mappedPosts);
        } else {
          setPosts((prev) => [...prev, ...mappedPosts]);
        }

        setHasMore(mappedPosts.length === PAGE_SIZE);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [sortBy, searchQuery, selectedTag, user]
  );

  // 초기 로드 및 필터 변경 시 재로드
  useEffect(() => {
    setPage(0);
    fetchPosts(0, true);
  }, [sortBy, searchQuery, selectedTag, fetchPosts]);

  // 더 불러오기
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, false);
  }, [page, fetchPosts]);

  // 좋아요 처리
  const handleLike = useCallback(
    (postId: string, isLiked: boolean) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked,
                likeCount: post.likeCount + (isLiked ? 1 : -1),
              }
            : post
        )
      );
    },
    []
  );

  // 정렬 변경
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    router.push(`/community?sort=${value}${selectedTag ? `&tag=${selectedTag}` : ""}`);
  };

  // 태그 선택
  const handleTagSelect = (tag: string) => {
    const newTag = selectedTag === tag ? "" : tag;
    setSelectedTag(newTag);
    router.push(`/community?sort=${sortBy}${newTag ? `&tag=${newTag}` : ""}`);
  };

  // 검색
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/community?sort=${sortBy}&q=${searchQuery}${selectedTag ? `&tag=${selectedTag}` : ""}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">커뮤니티</h1>
          <p className="text-muted-foreground mt-1">
            크리에이터들의 노래방 영상을 감상하고 소통하세요.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제목으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </form>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  최신순
                </div>
              </SelectItem>
              <SelectItem value="popular">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  인기순
                </div>
              </SelectItem>
              <SelectItem value="trending">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  트렌딩
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {popularTags.map((tag) => (
          <Badge
            key={tag}
            variant={selectedTag === tag ? "default" : "secondary"}
            className="cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={() => handleTagSelect(tag)}
          >
            #{tag}
          </Badge>
        ))}
        {selectedTag && !popularTags.includes(selectedTag) && (
          <Badge variant="default" className="cursor-pointer">
            #{selectedTag}
          </Badge>
        )}
      </div>

      {/* Post Grid */}
      <PostGrid
        posts={posts}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onLike={handleLike}
        emptyMessage={
          searchQuery
            ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
            : selectedTag
            ? `#${selectedTag} 태그의 포스트가 없습니다.`
            : "아직 포스트가 없습니다. 첫 번째로 공유해보세요!"
        }
      />
    </div>
  );
}
