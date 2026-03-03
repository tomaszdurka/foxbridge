import Link from 'next/link';
import { listRuns } from '@/lib/api';
import RunsListView from '@/components/runs/RunsListView';

export default async function Home() {
  let runs = [];
  let error = null;

  try {
    runs = await listRuns();
  } catch (err) {
    error = err.message;
  }

  return (
    <div className="ds-shell">
      <header className="mb-6">
        <div className="ds-label mb-2">FoxBridge</div>
        <h1 className="ds-title">Runs Dashboard</h1>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <Link href="/workspaces" className="text-mint hover:underline">
            View Workspaces
          </Link>
          <Link href="/sessions" className="text-mint hover:underline">
            View Sessions
          </Link>
        </div>
      </header>

      {error ? (
        <div className="surface p-6">
          <div className="text-rose font-semibold">Error loading runs</div>
          <div className="text-sm text-muted mt-2">{error}</div>
        </div>
      ) : (
        <RunsListView runs={runs} />
      )}
    </div>
  );
}
