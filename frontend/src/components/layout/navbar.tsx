import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic2 } from "lucide-react";

export const Navbar = () => {
  return (
    <div className="flex items-center p-4 border-b h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <MobileSidebar />

      {/* Logo & Desktop Nav */}
      <div className="flex items-center gap-8 pl-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="p-2 bg-primary/10 rounded-full">
            <Mic2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold hidden md:block">KaraokeGen</h1>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/community" className="transition-colors hover:text-primary text-muted-foreground">
            Community
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-primary text-muted-foreground">
            Dashboard
          </Link>
        </nav>
      </div>

      <div className="flex w-full justify-end items-center gap-4">
        {/* User Button or other top-right elements go here */}
        <Link href="/dashboard">
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    </div>
  );
};
