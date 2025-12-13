"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Share2, Heart } from "lucide-react";
import Link from "next/link";

// 더미 데이터
const MOCK_VIDEOS = [
  { id: 1, title: "K-Pop Hit Song Cover", author: "User1", views: 1200, likes: 45, thumbnail: "bg-pink-100" },
  { id: 2, title: "Ballad Practice", author: "Singer2", views: 850, likes: 23, thumbnail: "bg-blue-100" },
  { id: 3, title: "Rock Spirit", author: "Rocker1", views: 3000, likes: 120, thumbnail: "bg-red-100" },
  { id: 4, title: "Jazz Night", author: "JazzLover", views: 500, likes: 15, thumbnail: "bg-purple-100" },
  { id: 5, title: "Acoustic Session", author: "GuitarBoy", views: 2100, likes: 88, thumbnail: "bg-yellow-100" },
  { id: 6, title: "Trot Medley", author: "TrotKing", views: 5000, likes: 300, thumbnail: "bg-green-100" },
];

export default function CommunityPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Community</h1>
        <div className="flex gap-2">
          <Button variant="outline">Latest</Button>
          <Button variant="outline">Popular</Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MOCK_VIDEOS.map((video) => (
          <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className={`aspect-video w-full ${video.thumbnail} flex items-center justify-center relative group cursor-pointer`}>
              <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <CardHeader className="p-4">
              <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
              <p className="text-sm text-muted-foreground">by {video.author}</p>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between text-sm text-muted-foreground">
              <span>Views {video.views}</span>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" /> {video.likes}
                </button>
                <button className="hover:text-blue-500 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center bg-muted/50 p-8 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Want to share your work?</h3>
        <Link href="/dashboard">
          <Button size="lg">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
