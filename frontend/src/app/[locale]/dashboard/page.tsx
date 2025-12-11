"use client";

import { JobTable } from "@/components/dashboard/job-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { MOCK_JOBS } from "@/types/job";
import { useJobStore } from "@/store/use-job-store";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { jobs, setJobs } = useJobStore();
  const { t } = useTranslation();

  useEffect(() => {
    // Initialize store with mock data only once
    if (jobs.length === 0) {
      setJobs(MOCK_JOBS);
    }
  }, [setJobs, jobs.length]);

  // Simulate realtime updates
  useEffect(() => {
      const interval = setInterval(() => {
          useJobStore.getState().updateJobStatus(
              "job-2",
              "PROCESSING",
              Math.min((useJobStore.getState().jobs.find(j => j.id === "job-2")?.progress || 0) + 5, 100)
          );
      }, 3000);

      return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h2>
        <Link href="/jobs/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.new_job')}
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium leading-none text-muted-foreground">
            {t('dashboard.total_jobs')}
          </div>
          <div className="mt-2 text-3xl font-bold">{jobs.length}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium leading-none text-muted-foreground">
            {t('dashboard.completed')}
          </div>
          <div className="mt-2 text-3xl font-bold">
            {jobs.filter((j) => j.status === "COMPLETED").length}
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium leading-none text-muted-foreground">
            {t('dashboard.processing')}
          </div>
          <div className="mt-2 text-3xl font-bold">
            {jobs.filter((j) => j.status === "PROCESSING").length}
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium leading-none text-muted-foreground">
            {t('dashboard.failed')}
          </div>
          <div className="mt-2 text-3xl font-bold">
             {jobs.filter((j) => j.status === "FAILED").length}
          </div>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('dashboard.recent_jobs')}</h3>
        <JobTable jobs={jobs} />
      </div>
    </div>
  );
}






