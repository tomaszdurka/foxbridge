import Link from 'next/link';
import { listWorkspaces } from '@/lib/api';
import WorkspacesListView from '@/components/workspaces/WorkspacesListView';

export default async function WorkspacesPage() {
  let workspaces = [];
  let error = null;

  try {
    workspaces = await listWorkspaces();
  } catch (err) {
    error = err.message;
  }

  return (
    <div className="ds-shell">
      <header className="mb-6">
        <div className="ds-label mb-2">FoxBridge</div>
        <h1 className="ds-title">Workspaces</h1>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <Link href="/sessions" className="text-mint hover:underline">
            View Sessions
          </Link>
          <Link href="/" className="text-mint hover:underline">
            View Runs
          </Link>
        </div>
      </header>

      {error ? (
        <div className="surface p-6">
          <div className="text-rose font-semibold">Error loading workspaces</div>
          <div className="text-sm text-muted mt-2">{error}</div>
        </div>
      ) : (
        <WorkspacesListView workspaces={workspaces} />
      )}
    </div>
  );
}
