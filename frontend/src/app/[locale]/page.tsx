import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music, Share2, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-background to-muted/50">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-secondary text-secondary-foreground mb-4">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Powered Karaoke Generator
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Create, Edit, and Share <br className="hidden sm:inline" />
            <span className="text-primary">Karaoke Videos</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Upload your favorite tracks, auto-generate lyrics, customize the visuals, and share your masterpiece with our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/community">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                <Share2 className="mr-2 h-5 w-5" />
                Explore Community
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 text-lg">
                Start Creating
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border shadow-sm">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Music className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Smart Lyrics Sync</h3>
            <p className="text-muted-foreground">
              Automatically sync lyrics to audio using advanced AI, or fine-tune timing manually in our editor.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border shadow-sm">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Visual Editor</h3>
            <p className="text-muted-foreground">
              Customize fonts, colors, and backgrounds. Add visual effects to make your karaoke video pop.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border shadow-sm">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Share2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Community Sharing</h3>
            <p className="text-muted-foreground">
              Publish your videos to the community, get feedback, and discover songs created by others.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
