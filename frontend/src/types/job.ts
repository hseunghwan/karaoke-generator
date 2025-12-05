export type JobStatus = "PENDING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Job {
  id: string;
  title: string;
  artist: string;
  status: JobStatus;
  platform: "YOUTUBE" | "TIKTOK" | "SHORTS";
  presetId: string; // e.g., 'youtube-landscape', 'tiktok-portrait'
  createdAt: string; // ISO Date string
  completedAt?: string;
  thumbnailUrl?: string;
  progress: number; // 0-100
  targetLanguages: string[];
}

export const MOCK_JOBS: Job[] = [
  {
    id: "job-1",
    title: "Let It Go",
    artist: "Idina Menzel",
    status: "COMPLETED",
    platform: "YOUTUBE",
    presetId: "youtube-landscape",
    createdAt: "2023-10-25T10:00:00Z",
    completedAt: "2023-10-25T10:05:00Z",
    progress: 100,
    targetLanguages: ["ko", "ja"],
  },
  {
    id: "job-2",
    title: "Butter",
    artist: "BTS",
    status: "PROCESSING",
    platform: "TIKTOK",
    presetId: "tiktok-portrait",
    createdAt: "2023-10-26T14:30:00Z",
    progress: 45,
    targetLanguages: ["es"],
  },
  {
    id: "job-3",
    title: "Failed Song",
    artist: "Unknown",
    status: "FAILED",
    platform: "SHORTS",
    presetId: "shorts-portrait",
    createdAt: "2023-10-26T15:00:00Z",
    progress: 10,
    targetLanguages: ["fr"],
  },
];

