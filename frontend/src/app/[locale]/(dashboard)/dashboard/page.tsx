"use client";

import { JobTable } from "@/components/dashboard/job-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Activity, CheckCircle2, Clock, XCircle, ListMusic } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Job } from "@/types/job";
import { toast } from "sonner";
import { useJobStore } from "@/store/use-job-store";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { jobs, setJobs } = useJobStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"ALL" | "PROCESSING" | "COMPLETED">("ALL");

  useEffect(() => {
    let isMounted = true;

    const fetchJobs = async () => {
      try {
        const { data } = await api.get<Job[]>("/jobs");
        if (!isMounted) return;

        // Check for completions
        const currentJobs = useJobStore.getState().jobs;
        data.forEach((newJob) => {
          const oldJob = currentJobs.find((j) => j.id === newJob.id);
          if (oldJob && oldJob.status !== "COMPLETED" && newJob.status === "COMPLETED") {
            toast.success(`Job "${newJob.title}" completed!`);
          }
        });

        setJobs(data);
      } catch (error) {
        console.error("Failed to fetch jobs", error);
      }
    };

    fetchJobs(); // Initial fetch
    const interval = setInterval(fetchJobs, 3000); // Poll every 3s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [setJobs]);

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "PROCESSING") return job.status === "PROCESSING" || job.status === "PENDING" || job.status === "UPLOADING";
    if (activeTab === "COMPLETED") return job.status === "COMPLETED";
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h2>
          <p className="text-muted-foreground mt-1">Manage your karaoke generation tasks.</p>
        </div>
        <Link href="/jobs/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.new_job')}
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.total_jobs')}
            </CardTitle>
            <ListMusic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
            <p className="text-xs text-muted-foreground">
              All created jobs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.completed')}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter((j) => j.status === "COMPLETED").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully generated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.processing')}
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter((j) => j.status === "PROCESSING").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.failed')}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.filter((j) => j.status === "FAILED").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs Table */}
      <Card className="col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('dashboard.recent_jobs')}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("ALL")}
              >
                All
              </Button>
              <Button
                variant={activeTab === "PROCESSING" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("PROCESSING")}
              >
                In Progress
              </Button>
              <Button
                variant={activeTab === "COMPLETED" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("COMPLETED")}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <JobTable jobs={filteredJobs} />
        </CardContent>
      </Card>
    </div>
  );
}
