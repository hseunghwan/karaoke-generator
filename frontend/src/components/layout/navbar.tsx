import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";

export const Navbar = () => {
  return (
    <div className="flex items-center p-4 border-b h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <MobileSidebar />

      <div className="flex w-full justify-end items-center gap-4">
        <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-muted">
            <User className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
