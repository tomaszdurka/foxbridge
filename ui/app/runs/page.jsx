import { listRuns } from '@/lib/api';
import RunsListView from '@/components/runs/RunsListView';

export const dynamic = 'force-dynamic';

export default async function RunsPage() {
  const runs = await listRuns();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">All Runs</h1>
      <RunsListView runs={runs} />
    </div>
  );
}
