'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function WorkspacesListView({ workspaces }) {
  const sorted = [...workspaces].sort(
    (a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0)
  );

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-3 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_100px_190px_190px]">
        <span>Name</span>
        <span>Workspace ID</span>
        <span>Working Dir</span>
        <span>Runs</span>
        <span>Created</span>
        <span>Updated</span>
      </div>
      <ul className="divide-y">
        {sorted.map((workspace) => (
          <li key={workspace.workspaceId}>
            <Link
              href={`/workspaces/${workspace.workspaceId}`}
              className="block px-4 py-4 transition hover:bg-muted/40"
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_100px_190px_190px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {workspace.name || (
                      <span className="text-muted-foreground italic font-normal">Unnamed</span>
                    )}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-muted-foreground">{workspace.workspaceId}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">{workspace.workingDir || '-'}</p>
                </div>
                <div className="text-xs">{workspace.runs?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground">{workspace.createdAt}</div>
                <div className="text-xs text-muted-foreground">{workspace.updatedAt}</div>
              </div>
            </Link>
          </li>
        ))}
        {sorted.length === 0 ? (
          <li className="p-10 text-center text-sm text-muted-foreground">No workspaces found.</li>
        ) : null}
      </ul>
    </Card>
  );
}
