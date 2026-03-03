'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString();
}

export default function SessionsListView({ sessions }) {
  const sorted = [...sessions].sort(
    (a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0)
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Sessions ({sorted.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-3 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_100px_190px]">
            <span>Session ID</span>
            <span>Workspace</span>
            <span>Runs</span>
            <span>Created</span>
          </div>
          <ul className="divide-y">
            {sorted.map((session) => (
              <li key={session.sessionId}>
                <Link href={`/sessions/${session.sessionId}`} className="block px-4 py-4 transition hover:bg-muted/40">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_100px_190px]">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-semibold">{session.sessionId}</p>
                    </div>
                    <div className="min-w-0">
                      {session.workspace ? (
                        <Link
                          href={`/workspaces/${session.workspace.workspaceId}`}
                          className="text-mint hover:underline font-mono text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {session.workspace.name || session.workspace.workspaceId}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </div>
                    <div className="text-sm">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {session.runs?.length || 0} run{session.runs?.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(session.createdAt)}</div>
                  </div>
                </Link>
              </li>
            ))}
            {sorted.length === 0 ? (
              <li className="p-10 text-center text-sm text-muted-foreground">
                No sessions found.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
