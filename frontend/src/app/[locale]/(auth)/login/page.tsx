/**
 * Login Page
 * 
 * 이메일/비밀번호 로그인, OAuth 로그인, Magic Link 로그인을 지원합니다.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Github, Chrome } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 폼 스키마
const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Magic Link 스키마
const magicLinkSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const { signInWithEmail, signInWithOAuth, signInWithMagicLink } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // 이메일/비밀번호 폼
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Magic Link 폼
  const magicLinkForm = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  // URL 에러 파라미터 처리
  if (errorParam) {
    toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
  }

  // 이메일/비밀번호 로그인
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    const { error } = await signInWithEmail(data.email, data.password);
    
    if (error) {
      toast.error(error.message || "로그인에 실패했습니다");
      setIsLoading(false);
      return;
    }

    toast.success("로그인 성공!");
    router.push(redirectTo);
  };

  // OAuth 로그인
  const handleOAuthLogin = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    
    const { error } = await signInWithOAuth(provider);
    
    if (error) {
      toast.error(error.message || "OAuth 로그인에 실패했습니다");
      setOauthLoading(null);
    }
  };

  // Magic Link 로그인
  const onMagicLinkSubmit = async (data: MagicLinkFormValues) => {
    setIsLoading(true);
    
    const { error } = await signInWithMagicLink(data.email);
    
    if (error) {
      toast.error(error.message || "Magic Link 전송에 실패했습니다");
      setIsLoading(false);
      return;
    }

    setMagicLinkSent(true);
    toast.success("이메일을 확인해주세요!");
    setIsLoading(false);
  };

  // Magic Link 전송 완료 화면
  if (magicLinkSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>이메일을 확인해주세요</CardTitle>
          <CardDescription>
            {magicLinkForm.getValues("email")}로 로그인 링크를 전송했습니다.
            <br />
            이메일의 링크를 클릭하여 로그인을 완료하세요.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setMagicLinkSent(false);
              setShowMagicLink(false);
            }}
          >
            다른 방법으로 로그인
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Magic Link 입력 폼
  if (showMagicLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Magic Link로 로그인</CardTitle>
          <CardDescription>
            이메일 주소를 입력하면 로그인 링크를 보내드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...magicLinkForm}>
            <form onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
              <FormField
                control={magicLinkForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                로그인 링크 보내기
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowMagicLink(false)}
          >
            비밀번호로 로그인
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // 기본 로그인 폼
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>
          계정에 로그인하여 노래방 영상을 만들어보세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* OAuth 버튼 */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => handleOAuthLogin("google")}
            disabled={!!oauthLoading}
          >
            {oauthLoading === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOAuthLogin("github")}
            disabled={!!oauthLoading}
          >
            {oauthLoading === "github" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              또는
            </span>
          </div>
        </div>

        {/* 이메일/비밀번호 폼 */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>비밀번호</FormLabel>
                    <button
                      type="button"
                      onClick={() => setShowMagicLink(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      비밀번호 없이 로그인
                    </button>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              로그인
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-center text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            회원가입
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
