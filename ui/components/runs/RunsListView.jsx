'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  if (status === 'stopped') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function RunsListView({ runs }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs
      .filter((run) => {
        if (status !== 'all' && run.status !== status) return false;
        if (!q) return true;
        return (
          String(run.runId).toLowerCase().includes(q)
          || String(run.prompt ?? '').toLowerCase().includes(q)
          || String(run.workspace?.workspaceId ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (Date.parse(b.startedAt ?? '') || 0) - (Date.parse(a.startedAt ?? '') || 0));
  }, [runs, query, status]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-0 md:grid-cols-4">
          <Input
            placeholder="Search by runId, prompt..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="running">running</SelectItem>
              <SelectItem value="success">success</SelectItem>
              <SelectItem value="failure">failure</SelectItem>
              <SelectItem value="stopped">stopped</SelectItem>
            </SelectContent>
          </Select>
          <div className="md:col-span-2 flex items-center justify-end text-xs text-muted-foreground">
            {filtered.length} runs
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground lg:grid-cols-[minmax(0,3fr)_110px_180px_110px_190px]">
          <span>Prompt</span>
          <span>Status</span>
          <span>Workspace</span>
          <span>Elapsed</span>
          <span>Started</span>
        </div>
        <ul className="divide-y">
          {filtered.map((run) => (
            <li key={run.runId}>
              <Link href={`/runs/${run.runId}`} className="block px-4 py-4 transition hover:bg-muted/40">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_110px_180px_110px_190px]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{run.prompt || 'No prompt'}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{run.runId}</p>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className={statusBadgeClass(run.status)}>{run.status}</Badge>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-mono">{run.workspace?.workspaceId ?? '-'}</p>
                  </div>
                  <div className="text-xs">{elapsedForRun(run)}</div>
                  <div className="text-xs text-muted-foreground">{run.startedAt}</div>
                </div>
              </Link>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="p-10 text-center text-sm text-muted-foreground">No runs match current filters.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
