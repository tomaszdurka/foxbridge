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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {error ? (
        <div className="rounded-lg border bg-rose-50 p-6">
          <div className="text-rose-900 font-semibold">Error loading workspace</div>
          <div className="text-sm text-rose-700 mt-2">{error}</div>
        </div>
      ) : workspace ? (
        <WorkspaceDetailView workspace={workspace} />
      ) : null}
    </div>
  );
}
