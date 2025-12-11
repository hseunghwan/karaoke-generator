"use client";

import { Job } from "@/types/job";
import { create } from "zustand";

interface JobStore {
  jobs: Job[];
  addJob: (job: Job) => void;
  updateJobStatus: (id: string, status: Job["status"], progress?: number) => void;
  setJobs: (jobs: Job[]) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  updateJobStatus: (id, status, progress) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, status, progress: progress ?? job.progress } : job
      ),
    })),
  setJobs: (jobs) => set({ jobs }),
}));






