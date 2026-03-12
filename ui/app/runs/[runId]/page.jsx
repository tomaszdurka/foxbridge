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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {error ? (
        <div className="rounded-lg border bg-rose-50 p-6">
          <div className="text-rose-900 font-semibold">Error loading run</div>
          <div className="text-sm text-rose-700 mt-2">{error}</div>
        </div>
      ) : run ? (
        <RunDetailView run={run} />
      ) : null}
    </div>
  );
}
