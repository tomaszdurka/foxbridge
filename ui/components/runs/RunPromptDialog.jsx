'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';

export default function RunPromptDialog({
  open,
  onOpenChange,
  onSubmit,
  dialogTitle = 'Run Prompt',
  runs = [],
  submitButtonText = 'Run Prompt'
}) {
  const [runPrompt, setRunPrompt] = useState('');
  const [runSchema, setRunSchema] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState(null);
  const [runSuccess, setRunSuccess] = useState(null);

  // Determine last used model from runs (most recent run's model)
  const lastUsedModel = useMemo(() => {
    if (!runs || runs.length === 0) return null;
    const sortedRuns = [...runs].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    return sortedRuns[0]?.model || null;
  }, [runs]);

  const defaultModel = lastUsedModel || 'claude';
  const [runModel, setRunModel] = useState(defaultModel);

  const handleSubmit = async () => {
    if (!runPrompt.trim()) {
      setRunError('Prompt is required');
      return;
    }

    setIsSubmitting(true);
    setRunError(null);
    setRunSuccess(null);

    try {
      let schema = undefined;
      if (runSchema.trim()) {
        try {
          schema = JSON.parse(runSchema);
        } catch (err) {
          setRunError('Invalid JSON schema format');
          setIsSubmitting(false);
          return;
        }
      }

      const result = await onSubmit({
        prompt: runPrompt,
        schema,
        model: runModel,
      });

      setRunSuccess(`Job queued successfully! Run ID: ${result.runId}`);
      setRunPrompt('');
      setRunSchema('');

      // Close dialog after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setRunSuccess(null);
        window.location.reload(); // Refresh to show new run
      }, 2000);
    } catch (err) {
      setRunError(err.message || 'Failed to queue job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Model
              </label>
              <select
                value={runModel}
                onChange={(e) => setRunModel(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={isSubmitting}
              >
                <option value="claude">
                  claude {defaultModel === 'claude' ? (lastUsedModel ? '(last used)' : '(default)') : ''}
                </option>
                <option value="gemini">
                  gemini {defaultModel === 'gemini' ? '(last used)' : ''}
                </option>
                <option value="codex">
                  codex {defaultModel === 'codex' ? '(last used)' : ''}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Prompt <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={runPrompt}
                onChange={(e) => setRunPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Output Schema (Optional JSON)
              </label>
              <textarea
                value={runSchema}
                onChange={(e) => setRunSchema(e.target.value)}
                placeholder='{"type": "object", "properties": {...}}'
                className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                disabled={isSubmitting}
              />
            </div>
            {runError && (
              <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {runError}
              </div>
            )}
            {runSuccess && (
              <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                {runSuccess}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !runPrompt.trim()}
              >
                {isSubmitting ? 'Queuing...' : submitButtonText}
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
