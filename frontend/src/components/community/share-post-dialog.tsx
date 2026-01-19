/**
 * SharePostDialog Component
 * 
 * Job 완료 후 커뮤니티에 공유하기 위한 다이얼로그 컴포넌트입니다.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Share2, X, Loader2 } from "lucide-react";

// 폼 스키마
const sharePostSchema = z.object({
  title: z.string().min(2, "제목은 최소 2자 이상이어야 합니다").max(100, "제목은 100자 이내로 입력해주세요"),
  description: z.string().max(500, "설명은 500자 이내로 입력해주세요").optional(),
  tags: z.array(z.string()).max(5, "태그는 최대 5개까지 가능합니다").optional(),
});

type SharePostFormValues = z.infer<typeof sharePostSchema>;

interface SharePostDialogProps {
  jobId: string;
  jobTitle: string;
  jobArtist: string;
  thumbnailUrl?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function SharePostDialog({
  jobId,
  jobTitle,
  jobArtist,
  thumbnailUrl,
  trigger,
  onSuccess,
}: SharePostDialogProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<SharePostFormValues>({
    resolver: zodResolver(sharePostSchema),
    defaultValues: {
      title: `${jobTitle} - ${jobArtist}`,
      description: "",
      tags: [],
    },
  });

  const tags = form.watch("tags") || [];

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) {
      toast.error("이미 추가된 태그입니다");
      return;
    }
    if (tags.length >= 5) {
      toast.error("태그는 최대 5개까지 가능합니다");
      return;
    }
    form.setValue("tags", [...tags, trimmedTag]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (data: SharePostFormValues) => {
    if (!isAuthenticated || !user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          job_id: jobId,
          title: data.title,
          description: data.description || null,
          tags: data.tags || [],
          thumbnail_path: thumbnailUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("커뮤니티에 공유되었습니다!");
      setOpen(false);
      onSuccess?.();
      
      // 공유된 포스트로 이동
      router.push(`/community/${post.id}`);
    } catch (error) {
      console.error("Failed to share post:", error);
      toast.error("공유에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            커뮤니티에 공유
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>커뮤니티에 공유하기</DialogTitle>
          <DialogDescription>
            이 노래방 영상을 커뮤니티에 공유하세요. 다른 사용자들이 감상하고 좋아요와 댓글을 남길 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        {thumbnailUrl && (
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={thumbnailUrl}
              alt={jobTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명 (선택)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="이 영상에 대한 설명을 작성해보세요..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    최대 500자까지 입력 가능합니다.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>태그 (선택)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="태그 입력 후 Enter"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddTag}
                        >
                          추가
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="gap-1"
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    최대 5개까지 추가 가능합니다.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                공유하기
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
