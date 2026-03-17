'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Play } from 'lucide-react';
import RunPromptDialog from '@/components/runs/RunPromptDialog';
import { queueRun } from '@/lib/api';

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
  const started = Date.parse(run?.startedAt ?? '');
  if (!started) return '-';
  if (!run?.completedAt) return 'running...';
  const completed = Date.parse(run.completedAt);
  return formatElapsed(completed - started);
}

function statusBadgeClass(status) {
  if (status === 'success') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'running') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (status === 'failure') return 'bg-rose-100 text-rose-900 border-rose-200';
  if (status === 'stopped') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function EventRow({ event }) {
  const [open, setOpen] = useState(false);
  let payloadPreview = null;
  let payloadObj = null;

  try {
    payloadObj = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
    payloadPreview = typeof event.payload === 'string'
      ? (event.payload.length > 200 ? event.payload.slice(0, 200) + '...' : event.payload)
      : JSON.stringify(payloadObj, null, 2).slice(0, 200);
  } catch {
    payloadPreview = String(event.payload ?? '').slice(0, 200);
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-0 top-[18px] h-3 w-3 rounded-sm bg-slate-500" />
      <div
        className="rounded-xl border bg-card p-3 transition hover:bg-muted/40 cursor-pointer"
        onClick={() => setOpen((x) => !x)}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
            {event.type}
          </Badge>
          <span>{event.createdAt}</span>
          <span>#{event.eventId}</span>
        </div>
        {payloadPreview ? (
          <div className="mt-2">
            <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{payloadPreview}</pre>
          </div>
        ) : null}
        {open && payloadObj ? (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs">
            {JSON.stringify(payloadObj, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export default function RunDetailView({ run }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  const events = run.events ?? [];

  const promptLines = (run.prompt || '').split('\n').length;
  const isLongPrompt = promptLines > 5;

  const handleContinueSession = async ({ prompt, schema, model }) => {
    return await queueRun({
      prompt,
      schema,
      sessionId: run.session?.sessionId,
      model,
    });
  };

  const typeOptions = useMemo(() => {
    const types = events.map((e) => e.type);
    return ['all', ...new Set(types)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...events]
      .sort((a, b) => (Date.parse(a.createdAt ?? '') || 0) - (Date.parse(b.createdAt ?? '') || 0))
      .filter((event) => {
        if (typeFilter !== 'all' && event.type !== typeFilter) return false;
        if (!q) return true;
        const blob = `${event.type}\n${event.payload ?? ''}`.toLowerCase();
        return blob.includes(q);
      });
  }, [events, query, typeFilter]);

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Run Metadata</CardTitle>
            {run.session?.sessionId && (
              <Button
                onClick={() => setShowContinueDialog(true)}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Continue Session
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="grid-label">Status:</span>{' '}
            <span className="ml-2">
              <Badge variant="outline" className={statusBadgeClass(run.status)}>
                {run.status}
              </Badge>
            </span>
          </p>
          <p>
            <span className="grid-label">Workspace:</span>{' '}
            <span className="ml-2">
              {run.workspace ? (
                <Link href={`/workspaces/${run.workspace.workspaceId}`} className="text-mint hover:underline font-mono text-xs">
                  {run.workspace.name || run.workspace.workspaceId}
                </Link>
              ) : (
                '-'
              )}
            </span>
          </p>
          <p>
            <span className="grid-label">Session:</span>{' '}
            <span className="ml-2">
              {run.session?.sessionId ? (
                <Link href={`/sessions/${run.session.sessionId}`} className="text-mint hover:underline font-mono text-xs">
                  {run.session.sessionId}
                </Link>
              ) : (
                '-'
              )}
            </span>
          </p>
          <p>
            <span className="grid-label">Exit Code:</span> <span className="ml-2">{run.exitCode ?? '-'}</span>
          </p>
          <p>
            <span className="grid-label">Elapsed:</span> <span className="ml-2">{elapsedForRun(run)}</span>
          </p>
          <p>
            <span className="grid-label">Started:</span>{' '}
            <span className="ml-2 text-muted-foreground">{run.startedAt}</span>
          </p>
          <p>
            <span className="grid-label">Completed:</span>{' '}
            <span className="ml-2 text-muted-foreground">{run.completedAt ?? '-'}</span>
          </p>
          {run.outputSchema ? (
            <>
              <Separator />
              <div>
                <p className="grid-label mb-2">Output Schema</p>
                <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs">
                  {JSON.stringify(run.outputSchema, null, 2)}
                </pre>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Prompt & Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="grid-label mb-2">Prompt</p>
            <div className="relative">
              <p className={`whitespace-pre-wrap text-sm ${!isPromptExpanded && isLongPrompt ? 'line-clamp-5' : ''}`}>
                {run.prompt || 'No prompt'}
              </p>
              {isLongPrompt && !isPromptExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f5f6fb] via-[#f5f6fb]/95 to-transparent flex items-end justify-center pb-2">
                  <button
                    onClick={() => setIsPromptExpanded(true)}
                    className="text-xs font-medium text-mint hover:text-mint/80 transition"
                  >
                    Show more
                  </button>
                </div>
              )}
              {isLongPrompt && isPromptExpanded && (
                <div className="flex justify-center mt-2">
                  <button
                    onClick={() => setIsPromptExpanded(false)}
                    className="text-xs font-medium text-mint hover:text-mint/80 transition"
                  >
                    Show less
                  </button>
                </div>
              )}
            </div>
          </div>
          {run.result ? (
            <div>
              <p className="grid-label mb-2">Result</p>
              <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs">
                {JSON.stringify(run.result, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No result available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-5">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Event Timeline</CardTitle>
            <p className="text-xs text-muted-foreground">
              {filteredEvents.length} / {events.length} events
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Search event text..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v === 'all' ? 'All types' : v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative space-y-3 pl-2">
            <div className="timeline-rail absolute left-[13px] top-2 bottom-2" />
            {filteredEvents.map((event) => (
              <EventRow key={event.eventId} event={event} />
            ))}
            {filteredEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events match current filters.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <RunPromptDialog
        open={showContinueDialog}
        onOpenChange={setShowContinueDialog}
        onSubmit={handleContinueSession}
        dialogTitle="Continue Session"
        runs={run.session?.runs || []}
        submitButtonText="Run Prompt"
      />
    </div>
  );
}
