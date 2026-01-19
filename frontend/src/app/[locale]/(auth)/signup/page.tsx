/**
 * Signup Page
 * 
 * 이메일/비밀번호 회원가입, OAuth 회원가입을 지원합니다.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Github, Chrome, CheckCircle2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
const signupSchema = z.object({
  username: z
    .string()
    .min(3, "사용자 이름은 최소 3자 이상이어야 합니다")
    .max(20, "사용자 이름은 최대 20자입니다")
    .regex(/^[a-zA-Z0-9_]+$/, "영문, 숫자, 언더스코어만 사용 가능합니다"),
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "대문자, 소문자, 숫자를 각각 1개 이상 포함해야 합니다"
    ),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "이용약관에 동의해주세요",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithOAuth } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  // 이메일/비밀번호 회원가입
  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    
    const { error } = await signUpWithEmail(data.email, data.password, {
      username: data.username,
    });
    
    if (error) {
      toast.error(error.message || "회원가입에 실패했습니다");
      setIsLoading(false);
      return;
    }

    setRegisteredEmail(data.email);
    setSignupSuccess(true);
    setIsLoading(false);
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

  // 회원가입 성공 화면
  if (signupSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>회원가입 완료!</CardTitle>
          <CardDescription>
            <strong>{registeredEmail}</strong>로 확인 이메일을 전송했습니다.
            <br />
            이메일의 링크를 클릭하여 계정을 활성화하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">다음 단계:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>이메일 받은편지함을 확인하세요</li>
              <li>확인 링크를 클릭하세요</li>
              <li>로그인하여 서비스를 이용하세요</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/login" className="w-full">
            <Button className="w-full">로그인 페이지로</Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setSignupSuccess(false);
              form.reset();
            }}
          >
            다른 이메일로 가입
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription>
          무료로 가입하고 AI 노래방 영상을 만들어보세요.
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
              또는 이메일로 가입
            </span>
          </div>
        </div>

        {/* 회원가입 폼 */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>사용자 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormDescription>
                    커뮤니티에서 표시될 이름입니다.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    최소 8자, 대소문자 및 숫자 포함
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 확인</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal text-sm">
                      <Link href="/terms" className="text-primary hover:underline">
                        이용약관
                      </Link>
                      {" "}및{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        개인정보처리방침
                      </Link>
                      에 동의합니다.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              회원가입
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <div className="text-center text-sm text-muted-foreground w-full">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            로그인
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
