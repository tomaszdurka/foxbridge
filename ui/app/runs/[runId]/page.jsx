import Link from 'next/link';
import { getRun } from '@/lib/api';
import RunDetailView from '@/components/runs/RunDetailView';

export default async function RunDetailPage({ params }) {
  const { runId } = await params;
  let run = null;
  let error = null;

  try {
    run = await getRun(runId);
  } catch (err) {
    error = err.message;
  }

  return (
    <div className="ds-shell">
      <header className="mb-6">
        <div className="ds-label mb-2">FoxBridge</div>
        <h1 className="ds-title">Run Detail</h1>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <Link href="/" className="text-mint hover:underline">
            ← Back to Runs
          </Link>
          {run?.workspace && (
            <Link href={`/workspaces/${run.workspace.workspaceId}`} className="text-mint hover:underline">
              View Workspace
            </Link>
          )}
        </div>
      </header>

      {error ? (
        <div className="surface p-6">
          <div className="text-rose font-semibold">Error loading run</div>
          <div className="text-sm text-muted mt-2">{error}</div>
        </div>
      ) : run ? (
        <RunDetailView run={run} />
      ) : null}
    </div>
  );
}
