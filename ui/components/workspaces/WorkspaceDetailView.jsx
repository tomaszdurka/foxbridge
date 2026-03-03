'use client';

import Link from 'next/link';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { updateWorkspace, getWorkspaceFile } from '@/lib/api';
import { Edit2, Check, X, FileText } from 'lucide-react';

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workspace.name || '');
  const [currentName, setCurrentName] = useState(workspace.name || null);
  const [isSaving, setIsSaving] = useState(false);
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState('AGENTS.md');
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState(null);

  const runs = workspace.runs ?? [];
  const availableFiles = ['AGENTS.md', 'CLAUDE.md', 'changelog.md', 'specification.md', 'agents.md'];
  const sorted = [...runs].sort(
    (a, b) => (Date.parse(b.startedAt ?? '') || 0) - (Date.parse(a.startedAt ?? '') || 0)
  );

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
                  onClick={handleOpenFiles}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  title="View workspace files"
                >
                  <FileText className="h-5 w-5" />
                </button>
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
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{fileContent}</ReactMarkdown>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

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
