'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { queueRun } from '@/lib/api';
import { Play } from 'lucide-react';

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

export default function SessionDetailView({ session }) {
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [runPrompt, setRunPrompt] = useState('');
  const [runSchema, setRunSchema] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState(null);
  const [runSuccess, setRunSuccess] = useState(null);

  const runs = session.runs ?? [];
  const sorted = [...runs].sort(
    (a, b) => (Date.parse(b.startedAt ?? '') || 0) - (Date.parse(a.startedAt ?? '') || 0)
  );

  const handleRunPrompt = async () => {
    if (!runPrompt.trim()) {
      setRunError('Prompt is required');
      return;
    }

    setIsSubmitting(true);
    setRunError(null);
    setRunSuccess(null);

    try {
      let schema = undefined;
      if (runSchema.trim()) {
        try {
          schema = JSON.parse(runSchema);
        } catch (err) {
          setRunError('Invalid JSON schema format');
          setIsSubmitting(false);
          return;
        }
      }

      const result = await queueRun({
        prompt: runPrompt,
        schema,
        sessionId: session.sessionId,
      });

      setRunSuccess(`Job queued successfully! Run ID: ${result.runId}`);
      setRunPrompt('');
      setRunSchema('');

      setTimeout(() => {
        setShowRunDialog(false);
        setRunSuccess(null);
        window.location.reload();
      }, 2000);
    } catch (err) {
      setRunError(err.message || 'Failed to queue job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Session Info</CardTitle>
            <Button onClick={() => setShowRunDialog(true)}>
              <Play className="h-4 w-4 mr-2" />
              Continue Session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="grid-label">Session ID:</span>{' '}
            <span className="ml-2 font-mono">{session.sessionId}</span>
          </p>
          <p>
            <span className="grid-label">Workspace:</span>{' '}
            <span className="ml-2">
              {session.workspace ? (
                <Link href={`/workspaces/${session.workspace.workspaceId}`} className="text-mint hover:underline font-mono text-xs">
                  {session.workspace.name || session.workspace.workspaceId}
                </Link>
              ) : (
                '-'
              )}
            </span>
          </p>
          <p>
            <span className="grid-label">Created:</span>{' '}
            <span className="ml-2 text-muted-foreground">{session.createdAt}</span>
          </p>
          <p>
            <span className="grid-label">Updated:</span>{' '}
            <span className="ml-2 text-muted-foreground">{session.updatedAt}</span>
          </p>
          <p>
            <span className="grid-label">Runs:</span>{' '}
            <span className="ml-2">{runs.length}</span>
          </p>
        </CardContent>
      </Card>

      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent onClose={() => setShowRunDialog(false)}>
          <DialogHeader>
            <DialogTitle>Continue Session</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prompt <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={runPrompt}
                  onChange={(e) => setRunPrompt(e.target.value)}
                  placeholder="Enter your prompt here..."
                  className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Output Schema (Optional JSON)
                </label>
                <textarea
                  value={runSchema}
                  onChange={(e) => setRunSchema(e.target.value)}
                  placeholder='{"type": "object", "properties": {...}}'
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                  disabled={isSubmitting}
                />
              </div>
              {runError && (
                <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  {runError}
                </div>
              )}
              {runSuccess && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  {runSuccess}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRunDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRunPrompt}
                  disabled={isSubmitting || !runPrompt.trim()}
                >
                  {isSubmitting ? 'Queuing...' : 'Run Prompt'}
                </Button>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Runs ({sorted.length})</CardTitle>
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
                No runs in this session yet.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
