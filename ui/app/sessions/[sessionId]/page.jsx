import { getSession } from '@/lib/api';
import SessionDetailView from '@/components/sessions/SessionDetailView';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({params}) {
  const {sessionId} = await params
  const session = await getSession(sessionId);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4 text-sm">
        <Link href="/sessions" className="text-mint hover:underline">
          ← Back to Sessions
        </Link>
      </div>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Session Details</h1>
      <SessionDetailView session={session} />
    </div>
  );
}
