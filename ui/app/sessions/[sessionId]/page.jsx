import { getSession } from '@/lib/api';
import SessionDetailView from '@/components/sessions/SessionDetailView';

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({params}) {
  const {sessionId} = await params
  const session = await getSession(sessionId);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <SessionDetailView session={session} />
    </div>
  );
}
