'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { updateWorkspace, getWorkspaceFile, queueRun } from '@/lib/api';
import { Edit2, Check, X, FileText, Play } from 'lucide-react';

export default function WorkspaceDetailView({ workspace }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workspace.name || '');
  const [currentName, setCurrentName] = useState(workspace.name || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState('AGENTS.md');
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [runPrompt, setRunPrompt] = useState('');
  const [runSchema, setRunSchema] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState(null);
  const [runSuccess, setRunSuccess] = useState(null);

  const runs = workspace.runs ?? [];
  const availableFiles = ['AGENTS.md', 'SPECIFICATION.md', 'CHANGELOG.md'];

  // Extract unique sessions from runs
  const sessions = useMemo(() => {
    const sessionMap = new Map();
    runs.forEach((run) => {
      if (run.session) {
        const sid = run.session.sessionId;
        if (!sessionMap.has(sid)) {
          sessionMap.set(sid, {
            sessionId: sid,
            lastUsed: run.startedAt,
            runCount: 0
          });
        }
        sessionMap.get(sid).runCount++;
        const lastUsed = sessionMap.get(sid).lastUsed;
        if (Date.parse(run.startedAt) > Date.parse(lastUsed)) {
          sessionMap.get(sid).lastUsed = run.startedAt;
        }
      }
    });
    return Array.from(sessionMap.values()).sort(
      (a, b) => (Date.parse(b.lastUsed ?? '') || 0) - (Date.parse(a.lastUsed ?? '') || 0)
    );
  }, [runs]);

  const handleSaveName = async () => {
    setIsSaving(true);
    try {
      await updateWorkspace(workspace.workspaceId, {
        name: editedName.trim() || null
      });
      setCurrentName(editedName.trim() || null);
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update workspace name:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(currentName || '');
    setIsEditingName(false);
  };

  const handleOpenFiles = async () => {
    setShowFilesDialog(true);
    await loadFile('AGENTS.md');
  };

  const loadFile = async (filename) => {
    setSelectedFile(filename);
    setLoadingFile(true);
    setFileError(null);
    try {
      const data = await getWorkspaceFile(workspace.workspaceId, filename);
      setFileContent(data.content);
    } catch (err) {
      setFileError(err.message || 'Failed to load file');
      setFileContent('');
    } finally {
      setLoadingFile(false);
    }
  };

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
        workspaceId: workspace.workspaceId, // Always create new session
      });

      setRunSuccess(`Job queued successfully! Run ID: ${result.runId}`);
      setRunPrompt('');
      setRunSchema('');

      // Close dialog after 2 seconds
      setTimeout(() => {
        setShowRunDialog(false);
        setRunSuccess(null);
        window.location.reload(); // Refresh to show new run
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
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Workspace name"
                  className="flex-1 text-lg font-semibold"
                  autoFocus
                  disabled={isSaving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition"
                  title="Save"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-2 text-rose-700 hover:bg-rose-50 rounded-lg transition"
                  title="Cancel"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <h2 className="flex-1 text-2xl font-bold tracking-tight">
                  {currentName || (
                    <span className="text-muted-foreground italic">Unnamed Workspace</span>
                  )}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  title="Edit name"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showFilesDialog} onOpenChange={setShowFilesDialog}>
        <DialogContent onClose={() => setShowFilesDialog(false)}>
          <DialogHeader>
            <DialogTitle>Workspace Files</DialogTitle>
          </DialogHeader>
          <DialogBody className="max-h-[70vh]">
            <div className="mb-4 flex gap-2 border-b">
              {availableFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => loadFile(file)}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    selectedFile === file
                      ? 'border-b-2 border-mint text-mint'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>
            {loadingFile ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            ) : fileError ? (
              <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
                {fileError}
              </div>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-slate-900" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-slate-900" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-900" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-base font-semibold mt-3 mb-2 text-slate-900" {...props} />,
                    h5: ({node, ...props}) => <h5 className="text-sm font-semibold mt-3 mb-2 text-slate-900" {...props} />,
                    h6: ({node, ...props}) => <h6 className="text-sm font-semibold mt-3 mb-2 text-slate-700" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-slate-700 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700" {...props} />,
                    ol: ({node, ...props}) => <ol className="mb-4 ml-6 list-decimal space-y-2 text-slate-700" {...props} />,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 pl-4 my-4 italic text-slate-600" {...props} />,
                    code: ({node, inline, ...props}) =>
                      inline
                        ? <code className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                        : <code className="block bg-slate-100 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-slate-100 p-4 rounded-lg my-4 overflow-x-auto" {...props} />,
                    a: ({node, ...props}) => <a className="text-mint hover:underline font-medium" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-6 border-slate-200" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                  }}
                >
                  {fileContent}
                </ReactMarkdown>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Workspace Info</CardTitle>
            <Button onClick={() => setShowRunDialog(true)}>
              <Play className="h-4 w-4 mr-2" />
              Run Prompt
            </Button>
          </div>
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
          <Separator className="my-4" />
          <Button
            variant="outline"
            className="w-full"
            onClick={handleOpenFiles}
          >
            <FileText className="h-4 w-4 mr-2" />
            View Workspace Files
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
        <DialogContent onClose={() => setShowRunDialog(false)}>
          <DialogHeader>
            <DialogTitle>New Run (Creates New Session)</DialogTitle>
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
          <CardTitle className="text-base">Sessions ({sessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-3 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground lg:grid-cols-[minmax(0,2fr)_100px_190px]">
            <span>Session ID</span>
            <span>Runs</span>
            <span>Last Activity</span>
          </div>
          <ul className="divide-y">
            {sessions.map((session) => (
              <li key={session.sessionId}>
                <Link href={`/sessions/${session.sessionId}`} className="block px-4 py-4 transition hover:bg-muted/40">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_100px_190px]">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-semibold">{session.sessionId}</p>
                    </div>
                    <div className="text-sm">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {session.runCount} run{session.runCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{session.lastUsed}</div>
                  </div>
                </Link>
              </li>
            ))}
            {sessions.length === 0 ? (
              <li className="p-10 text-center text-sm text-muted-foreground">
                No sessions in this workspace yet.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
