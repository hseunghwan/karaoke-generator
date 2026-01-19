/**
 * Landing Page
 * 
 * AI 노래방 영상 생성 서비스의 마케팅 랜딩 페이지입니다.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Music,
  Share2,
  Sparkles,
  Globe,
  Zap,
  Users,
  Play,
  Check,
  Upload,
  Wand2,
  Star,
  ChevronRight,
  Music2,
  Subtitles,
  Palette,
} from "lucide-react";

// 기능 목록
const FEATURES = [
  {
    icon: Music2,
    title: "AI 음원 분리",
    description: "보컬과 MR을 자동으로 분리합니다. Meta의 Demucs 모델로 깨끗한 음원 추출.",
    color: "bg-blue-500",
  },
  {
    icon: Subtitles,
    title: "자동 자막 생성",
    description: "WhisperX로 음절 단위 정밀 싱크. 한국어, 영어, 일본어 등 100개 이상 언어 지원.",
    color: "bg-purple-500",
  },
  {
    icon: Globe,
    title: "다국어 번역",
    description: "AI가 가사를 자연스럽게 번역하고 발음 표기까지 자동 생성합니다.",
    color: "bg-green-500",
  },
  {
    icon: Palette,
    title: "비주얼 편집기",
    description: "폰트, 색상, 위치를 자유롭게 커스터마이징. 타임라인에서 싱크 미세 조정.",
    color: "bg-orange-500",
  },
  {
    icon: Zap,
    title: "빠른 렌더링",
    description: "GPU 가속으로 3분 이내에 완성. YouTube, TikTok 최적화 프리셋 제공.",
    color: "bg-pink-500",
  },
  {
    icon: Users,
    title: "커뮤니티 공유",
    description: "만든 영상을 글로벌 커뮤니티에 공유하고 다른 크리에이터와 소통하세요.",
    color: "bg-cyan-500",
  },
];

// 단계별 프로세스
const STEPS = [
  {
    number: "01",
    title: "음원 업로드",
    description: "좋아하는 노래 파일을 업로드하거나 YouTube URL을 입력하세요.",
    icon: Upload,
  },
  {
    number: "02",
    title: "AI 자동 처리",
    description: "AI가 음원 분리, 가사 인식, 싱크 맞춤을 자동으로 처리합니다.",
    icon: Wand2,
  },
  {
    number: "03",
    title: "편집 & 공유",
    description: "원하는 대로 편집한 후 다운로드하거나 커뮤니티에 공유하세요.",
    icon: Share2,
  },
];

// 가격 플랜 (미리보기)
const PLANS = [
  {
    name: "Free",
    price: "₩0",
    description: "시작하기 좋은 무료 플랜",
    credits: "3 크레딧/월",
    features: ["기본 템플릿", "720p 출력", "워터마크 포함"],
    cta: "무료로 시작",
    popular: false,
  },
  {
    name: "Pro",
    price: "₩9,900",
    period: "/월",
    description: "크리에이터를 위한 플랜",
    credits: "30 크레딧/월",
    features: ["모든 템플릿", "1080p 출력", "워터마크 없음", "우선 처리"],
    cta: "Pro 시작하기",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "문의",
    description: "대량 작업을 위한 플랜",
    credits: "무제한",
    features: ["API 액세스", "4K 출력", "전용 지원", "커스텀 브랜딩"],
    cta: "문의하기",
    popular: false,
  },
];

// 후기 (placeholder)
const TESTIMONIALS = [
  {
    content: "유튜브 노래방 채널 운영이 훨씬 쉬워졌어요. 자막 싱크가 정확해서 편집 시간이 반으로 줄었습니다.",
    author: "김유튜버",
    role: "YouTube 크리에이터",
    avatar: "K",
  },
  {
    content: "일본어 노래를 한국어 자막으로 바로 만들 수 있어서 좋아요. 팬 번역 영상 만들기에 딱입니다.",
    author: "J-Pop 팬",
    role: "번역가",
    avatar: "J",
  },
  {
    content: "노래 연습용으로 완벽해요. 발음 표기가 나와서 외국어 노래도 쉽게 따라 부를 수 있어요.",
    author: "보컬 연습생",
    role: "음악 학생",
    avatar: "V",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Karaoke Gen</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              기능
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              사용법
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              요금제
            </Link>
            <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              커뮤니티
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">무료로 시작</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10 -z-10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-30 -z-10" />
        
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
              <Sparkles className="mr-2 h-4 w-4" />
              AI 기반 노래방 영상 제작
            </Badge>
            
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              노래방 영상,{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AI로 쉽게
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
              음원을 업로드하면 AI가 자동으로 보컬 분리, 가사 인식, 싱크 맞춤까지.
              <br className="hidden sm:inline" />
              100개 이상의 언어로 자막을 생성하고 글로벌 커뮤니티와 공유하세요.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-8 text-lg w-full sm:w-auto">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg w-full sm:w-auto">
                  <Play className="mr-2 h-5 w-5" />
                  데모 보기
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 border-t mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">생성된 영상</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">지원 언어</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.8</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  평점
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border shadow-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
              {/* Placeholder for video */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="h-8 w-8 text-primary fill-primary ml-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white text-left">
                <p className="text-sm font-medium opacity-80">데모 영상</p>
                <p className="text-lg font-bold">3분 만에 노래방 영상 만들기</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">사용 방법</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              3단계로 완성하는 노래방 영상
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              복잡한 영상 편집 없이 AI가 알아서 처리합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <step.icon className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">기능</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              강력한 AI 기능
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              전문가 수준의 노래방 영상을 누구나 쉽게 만들 수 있습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">요금제</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              합리적인 가격
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              무료로 시작하고, 필요에 따라 업그레이드하세요.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">인기</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <Badge variant="secondary" className="mt-2">{plan.credits}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"} className="block">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing" className="text-primary hover:underline inline-flex items-center gap-1">
              자세한 요금제 비교 보기
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">후기</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              사용자들의 이야기
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-12 text-primary-foreground">
            <h2 className="text-3xl font-bold mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              무료 크레딧으로 첫 노래방 영상을 만들어보세요.
              <br />
              신용카드 없이 바로 시작할 수 있습니다.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-lg">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary rounded-lg">
                  <Music className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Karaoke Gen</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                AI 기반 다국어 노래방 영상 제작 서비스
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">기능</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">요금제</Link></li>
                <li><Link href="/community" className="hover:text-foreground">커뮤니티</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground">문서</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">문의하기</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">법적 고지</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground">이용약관</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Karaoke Gen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
