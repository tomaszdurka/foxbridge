'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import RunPromptDialog from '@/components/runs/RunPromptDialog';
import { queueRun } from '@/lib/api';

export default function Navigation() {
  const pathname = usePathname();
  const [showNewRunDialog, setShowNewRunDialog] = useState(false);

  const navLinks = [
    { href: '/workspaces', label: 'Workspaces' },
    { href: '/sessions', label: 'Sessions' },
    { href: '/runs', label: 'Runs' },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleNewRun = async ({ prompt, schema, model }) => {
    return await queueRun({
      prompt,
      schema,
      model,
      // No workspaceId or sessionId - creates new workspace and session
    });
  };

  return (
    <>
      <nav className="border-b bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-slate-900">
                FoxBridge
              </Link>
              <div className="flex gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                      isActive(link.href)
                        ? 'bg-mint/10 text-mint'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <Button onClick={() => setShowNewRunDialog(true)} size="sm">
              <Play className="h-4 w-4 mr-2" />
              New Run
            </Button>
          </div>
        </div>
      </nav>

      <RunPromptDialog
        open={showNewRunDialog}
        onOpenChange={setShowNewRunDialog}
        onSubmit={handleNewRun}
        dialogTitle="New Run (Creates New Workspace)"
        runs={[]}
        submitButtonText="Start Run"
      />
    </>
  );
}
