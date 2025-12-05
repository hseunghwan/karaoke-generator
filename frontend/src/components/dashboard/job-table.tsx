"use client";

import { Job, JobStatus } from "@/types/job";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ExternalLink, PlayCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Using shadcn dropdown (need to install if not present, but we'll assume core set or install quickly)
import Link from "next/link";
import { formatDistanceToNow } from "date-fns"; // Need to install date-fns
import { cn } from "@/lib/utils";

interface JobTableProps {
  jobs: Job[];
}

const StatusBadge = ({ status }: { status: JobStatus }) => {
  const styles = {
    PENDING: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    QUEUED: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    PROCESSING: "bg-purple-100 text-purple-800 hover:bg-purple-200 animate-pulse",
    COMPLETED: "bg-green-100 text-green-800 hover:bg-green-200",
    FAILED: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  return (
    <Badge className={cn("font-medium", styles[status])} variant="outline">
      {status}
    </Badge>
  );
};

export const JobTable = ({ jobs }: JobTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Info</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No jobs found.
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{job.title}</span>
                    <span className="text-xs text-muted-foreground">{job.artist}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {job.platform}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={job.status} />
                    {job.status === "PROCESSING" && (
                      <span className="text-xs text-muted-foreground">
                        {job.progress}%
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                   {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
