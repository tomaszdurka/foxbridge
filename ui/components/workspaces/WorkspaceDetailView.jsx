'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function elapsedForRun(run) {
  const started = Date.parse(run.startedAt ?? '');
  if (!started) return '-';
  const completed = run.completedAt ? Date.parse(run.completedAt) : null;
  const endTs = completed || Date.now();
  return formatElapsed(endTs - started);
}

function statusBadgeClass(status) {
  if (status === 'success') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'running') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (status === 'failure') return 'bg-rose-100 text-rose-900 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function WorkspaceDetailView({ workspace }) {
  const runs = workspace.runs ?? [];
  const sorted = [...runs].sort(
    (a, b) => (Date.parse(b.startedAt ?? '') || 0) - (Date.parse(a.startedAt ?? '') || 0)
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="grid-label">Workspace ID:</span>{' '}
            <span className="ml-2 font-mono">{workspace.workspaceId}</span>
          </p>
          <p>
            <span className="grid-label">Working Dir:</span>{' '}
            <span className="ml-2 text-muted-foreground">{workspace.workingDir || '-'}</span>
          </p>
          <p>
            <span className="grid-label">Created:</span>{' '}
            <span className="ml-2 text-muted-foreground">{workspace.createdAt}</span>
          </p>
          <p>
            <span className="grid-label">Updated:</span>{' '}
            <span className="ml-2 text-muted-foreground">{workspace.updatedAt}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Runs ({sorted.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-3 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground lg:grid-cols-[minmax(0,3fr)_110px_110px_190px]">
            <span>Prompt</span>
            <span>Status</span>
            <span>Elapsed</span>
            <span>Started</span>
          </div>
          <ul className="divide-y">
            {sorted.map((run) => (
              <li key={run.runId}>
                <Link href={`/runs/${run.runId}`} className="block px-4 py-4 transition hover:bg-muted/40">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_110px_110px_190px]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{run.prompt || 'No prompt'}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{run.runId}</p>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className={statusBadgeClass(run.status)}>
                        {run.status}
                      </Badge>
                    </div>
                    <div className="text-xs">{elapsedForRun(run)}</div>
                    <div className="text-xs text-muted-foreground">{run.startedAt}</div>
                  </div>
                </Link>
              </li>
            ))}
            {sorted.length === 0 ? (
              <li className="p-10 text-center text-sm text-muted-foreground">
                No runs found for this workspace.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
