/**
 * Pricing Page
 * 
 * 요금제 비교 및 결제 페이지입니다.
 */
import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  ArrowLeft,
  Music,
  Zap,
  Shield,
  HeadphonesIcon,
  HelpCircle,
} from "lucide-react";

// 가격 플랜 상세
const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceDisplay: "₩0",
    period: "영구 무료",
    description: "노래방 영상 제작을 처음 시작하는 분들을 위한 플랜",
    credits: 3,
    creditsLabel: "3 크레딧/월",
    features: {
      templates: "기본 템플릿 3종",
      resolution: "720p HD",
      watermark: true,
      processing: "일반 처리",
      languages: "모든 언어",
      storage: "7일",
      support: "커뮤니티",
      api: false,
    },
    cta: "무료로 시작",
    ctaVariant: "outline" as const,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 9900,
    priceDisplay: "₩9,900",
    period: "/월",
    description: "크리에이터와 소규모 채널을 위한 플랜",
    credits: 30,
    creditsLabel: "30 크레딧/월",
    features: {
      templates: "모든 템플릿",
      resolution: "1080p Full HD",
      watermark: false,
      processing: "우선 처리",
      languages: "모든 언어",
      storage: "30일",
      support: "이메일",
      api: false,
    },
    cta: "Pro 시작하기",
    ctaVariant: "default" as const,
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 29900,
    priceDisplay: "₩29,900",
    period: "/월",
    description: "전문 크리에이터와 팀을 위한 플랜",
    credits: 100,
    creditsLabel: "100 크레딧/월",
    features: {
      templates: "모든 템플릿 + 프리미엄",
      resolution: "4K Ultra HD",
      watermark: false,
      processing: "최우선 처리",
      languages: "모든 언어 + 커스텀",
      storage: "무제한",
      support: "우선 이메일",
      api: true,
    },
    cta: "Business 시작하기",
    ctaVariant: "outline" as const,
    popular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    priceDisplay: "맞춤 견적",
    period: "",
    description: "대규모 조직과 특수 요구사항을 위한 플랜",
    credits: null,
    creditsLabel: "무제한",
    features: {
      templates: "커스텀 템플릿 개발",
      resolution: "4K+ 커스텀",
      watermark: false,
      processing: "전용 서버",
      languages: "커스텀 언어 모델",
      storage: "무제한",
      support: "전담 매니저",
      api: true,
    },
    cta: "문의하기",
    ctaVariant: "outline" as const,
    popular: false,
  },
];

// 기능 비교 표
const FEATURE_COMPARISON = [
  {
    category: "기본 기능",
    features: [
      { name: "AI 음원 분리", free: true, pro: true, business: true, enterprise: true },
      { name: "자동 가사 인식", free: true, pro: true, business: true, enterprise: true },
      { name: "다국어 번역", free: true, pro: true, business: true, enterprise: true },
      { name: "발음 표기 생성", free: true, pro: true, business: true, enterprise: true },
    ],
  },
  {
    category: "템플릿 & 출력",
    features: [
      { name: "기본 템플릿", free: "3종", pro: "전체", business: "전체+프리미엄", enterprise: "커스텀" },
      { name: "출력 해상도", free: "720p", pro: "1080p", business: "4K", enterprise: "4K+" },
      { name: "워터마크 제거", free: false, pro: true, business: true, enterprise: true },
      { name: "커스텀 브랜딩", free: false, pro: false, business: true, enterprise: true },
    ],
  },
  {
    category: "처리 & 저장",
    features: [
      { name: "처리 우선순위", free: "일반", pro: "우선", business: "최우선", enterprise: "전용 서버" },
      { name: "파일 저장 기간", free: "7일", pro: "30일", business: "무제한", enterprise: "무제한" },
      { name: "동시 처리 작업", free: "1개", pro: "3개", business: "10개", enterprise: "무제한" },
    ],
  },
  {
    category: "API & 연동",
    features: [
      { name: "REST API 액세스", free: false, pro: false, business: true, enterprise: true },
      { name: "Webhook 지원", free: false, pro: false, business: true, enterprise: true },
      { name: "화이트라벨 옵션", free: false, pro: false, business: false, enterprise: true },
    ],
  },
  {
    category: "지원",
    features: [
      { name: "고객 지원", free: "커뮤니티", pro: "이메일", business: "우선 이메일", enterprise: "전담 매니저" },
      { name: "응답 시간", free: "-", pro: "48시간", business: "24시간", enterprise: "4시간" },
      { name: "온보딩 지원", free: false, pro: false, business: true, enterprise: true },
    ],
  },
];

// FAQ
const FAQ = [
  {
    question: "크레딧은 어떻게 사용되나요?",
    answer: "1 크레딧 = 1개의 노래방 영상 생성입니다. 영상 길이나 언어 수와 관계없이 동일하게 소모됩니다. 미사용 크레딧은 다음 달로 이월되지 않습니다.",
  },
  {
    question: "플랜을 변경할 수 있나요?",
    answer: "네, 언제든지 업그레이드 또는 다운그레이드할 수 있습니다. 업그레이드 시 차액이 즉시 청구되며, 다운그레이드 시 다음 결제일부터 적용됩니다.",
  },
  {
    question: "환불 정책은 어떻게 되나요?",
    answer: "결제 후 7일 이내에 크레딧을 사용하지 않은 경우 전액 환불이 가능합니다. 부분 환불은 지원하지 않습니다.",
  },
  {
    question: "Enterprise 플랜 문의는 어떻게 하나요?",
    answer: "contact@karaokegen.com으로 이메일을 보내주시거나, 문의하기 버튼을 통해 연락 주시면 영업일 기준 1일 이내에 답변 드립니다.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">홈으로</span>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4">요금제</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            당신에게 맞는 플랜을 선택하세요
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            무료로 시작하고, 필요에 따라 업그레이드하세요.
            <br />
            모든 플랜에서 핵심 AI 기능을 사용할 수 있습니다.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.popular ? "border-primary shadow-lg ring-2 ring-primary" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">가장 인기</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.priceDisplay}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="bg-muted/50 rounded-lg p-3 text-center mb-6">
                    <div className="text-2xl font-bold text-primary">{plan.creditsLabel}</div>
                  </div>
                  
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {plan.features.templates}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {plan.features.resolution}
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.features.watermark ? (
                        <X className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                      <span className={plan.features.watermark ? "text-muted-foreground" : ""}>
                        {plan.features.watermark ? "워터마크 포함" : "워터마크 없음"}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {plan.features.processing}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      저장 기간: {plan.features.storage}
                    </li>
                    <li className="flex items-center gap-2">
                      {plan.features.api ? (
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={!plan.features.api ? "text-muted-foreground" : ""}>
                        API 액세스
                      </span>
                    </li>
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Link href={plan.id === "enterprise" ? "/contact" : "/signup"} className="w-full">
                    <Button className="w-full" variant={plan.ctaVariant}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">상세 기능 비교</h2>
            <p className="text-muted-foreground">모든 플랜의 기능을 한눈에 비교하세요.</p>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-medium">기능</th>
                  <th className="text-center py-4 px-4 font-medium">Free</th>
                  <th className="text-center py-4 px-4 font-medium bg-primary/5">Pro</th>
                  <th className="text-center py-4 px-4 font-medium">Business</th>
                  <th className="text-center py-4 px-4 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((category, categoryIndex) => (
                  <Fragment key={`category-${categoryIndex}`}>
                    <tr className="bg-muted/50">
                      <td colSpan={5} className="py-3 px-4 font-semibold text-sm">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={`feature-${categoryIndex}-${featureIndex}`} className="border-b">
                        <td className="py-3 px-4 text-sm">{feature.name}</td>
                        {["free", "pro", "business", "enterprise"].map((plan) => {
                          const value = feature[plan as keyof typeof feature];
                          return (
                            <td
                              key={plan}
                              className={`text-center py-3 px-4 text-sm ${
                                plan === "pro" ? "bg-primary/5" : ""
                              }`}
                            >
                              {typeof value === "boolean" ? (
                                value ? (
                                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-4 w-4 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                value
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold">안전한 결제</h4>
                <p className="text-sm text-muted-foreground">SSL 암호화 및 PCI DSS 준수</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold">즉시 활성화</h4>
                <p className="text-sm text-muted-foreground">결제 후 바로 사용 가능</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <HeadphonesIcon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold">고객 지원</h4>
                <p className="text-sm text-muted-foreground">친절한 한국어 지원</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">자주 묻는 질문</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {FAQ.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    {item.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">아직 결정하지 못하셨나요?</h2>
          <p className="text-muted-foreground mb-6">
            무료 플랜으로 시작해서 서비스를 직접 경험해보세요.
          </p>
          <Link href="/signup">
            <Button size="lg">무료로 시작하기</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Karaoke Gen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
