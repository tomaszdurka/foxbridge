import { listSessions } from '@/lib/api';
import SessionsListView from '@/components/sessions/SessionsListView';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const sessions = await listSessions();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Sessions</h1>
      <SessionsListView sessions={sessions} />
    </div>
  );
}
