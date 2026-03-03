import Link from 'next/link';
import { getWorkspace } from '@/lib/api';
import WorkspaceDetailView from '@/components/workspaces/WorkspaceDetailView';

export default async function WorkspaceDetailPage({ params }) {
  const { workspaceId } = await params;
  let workspace = null;
  let error = null;

  try {
    workspace = await getWorkspace(workspaceId);
  } catch (err) {
    error = err.message;
  }

  return (
    <div className="ds-shell">
      <header className="mb-6">
        <div className="ds-label mb-2">FoxBridge</div>
        <h1 className="ds-title">Workspace Detail</h1>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <Link href="/workspaces" className="text-mint hover:underline">
            ← Back to Workspaces
          </Link>
          <Link href="/" className="text-mint hover:underline">
            View All Runs
          </Link>
        </div>
      </header>

      {error ? (
        <div className="surface p-6">
          <div className="text-rose font-semibold">Error loading workspace</div>
          <div className="text-sm text-muted mt-2">{error}</div>
        </div>
      ) : workspace ? (
        <WorkspaceDetailView workspace={workspace} />
      ) : null}
    </div>
  );
}
