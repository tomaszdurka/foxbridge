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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Workspaces</h1>
      {error ? (
        <div className="rounded-lg border bg-rose-50 p-6">
          <div className="text-rose-900 font-semibold">Error loading workspaces</div>
          <div className="text-sm text-rose-700 mt-2">{error}</div>
        </div>
      ) : (
        <WorkspacesListView workspaces={workspaces} />
      )}
    </div>
  );
}
