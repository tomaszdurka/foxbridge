import Link from 'next/link';
import { listSessions } from '@/lib/api';
import SessionsListView from '@/components/sessions/SessionsListView';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const sessions = await listSessions();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Sessions</h1>
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/workspaces" className="text-mint hover:underline">
          View Workspaces
        </Link>
        <Link href="/" className="text-mint hover:underline">
          View Runs
        </Link>
      </div>
      <SessionsListView sessions={sessions} />
    </div>
  );
}
