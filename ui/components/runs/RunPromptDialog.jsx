'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookmarkPlus, X, Copy } from 'lucide-react';
import PromptLibraryDialog from '@/components/prompts/PromptLibraryDialog';

export default function RunPromptDialog({
  open,
  onOpenChange,
  onSubmit,
  dialogTitle = 'Run Prompt',
  runs = [],
  submitButtonText = 'Run Prompt'
}) {
  const [selectedSavedPrompt, setSelectedSavedPrompt] = useState(null);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [runSchema, setRunSchema] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState(null);
  const [runSuccess, setRunSuccess] = useState(null);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);

  // Determine last used model from runs (most recent run's model)
  const lastUsedModel = useMemo(() => {
    if (!runs || runs.length === 0) return null;
    const sortedRuns = [...runs].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    return sortedRuns[0]?.model || null;
  }, [runs]);

  const defaultModel = lastUsedModel || 'claude';
  const [runModel, setRunModel] = useState(defaultModel);

  const handleSelectPrompt = (selectedPrompt) => {
    setSelectedSavedPrompt(selectedPrompt);
  };

  const handleCopyPromptToTextarea = () => {
    if (selectedSavedPrompt) {
      const currentText = additionalPrompt.trim();
      const promptText = selectedSavedPrompt.prompt.trim();
      setAdditionalPrompt(currentText ? `${promptText}\n\n${currentText}` : promptText);
      setSelectedSavedPrompt(null);
    }
  };

  const handleRemoveSavedPrompt = () => {
    setSelectedSavedPrompt(null);
  };

  const handleSubmit = async () => {
    const finalPrompt = selectedSavedPrompt
      ? (additionalPrompt.trim() ? `${selectedSavedPrompt.prompt}\n\n${additionalPrompt}` : selectedSavedPrompt.prompt)
      : additionalPrompt;

    if (!finalPrompt.trim()) {
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
        prompt: finalPrompt,
        schema,
        model: runModel,
      });

      setRunSuccess(`Job queued successfully! Run ID: ${result.runId}`);
      setSelectedSavedPrompt(null);
      setAdditionalPrompt('');
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  {selectedSavedPrompt ? 'Additional Instructions' : 'Prompt'} <span className="text-rose-600">*</span>
                </label>
                <button
                  onClick={() => setShowPromptLibrary(true)}
                  className="text-xs text-mint hover:text-mint/80 flex items-center gap-1 transition"
                  type="button"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  Browse Saved
                </button>
              </div>
              {selectedSavedPrompt && (
                <div className="mb-2 flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                  <Badge variant="outline" className="bg-mint/10 text-mint border-mint/20">
                    {selectedSavedPrompt.name}
                  </Badge>
                  <button
                    onClick={handleCopyPromptToTextarea}
                    className="ml-auto p-1 text-slate-600 hover:text-slate-900 transition"
                    title="Copy to textarea to edit"
                    type="button"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleRemoveSavedPrompt}
                    className="p-1 text-slate-600 hover:text-rose-600 transition"
                    title="Remove saved prompt"
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <textarea
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder={selectedSavedPrompt ? "Add additional instructions (optional)..." : "Enter your prompt here..."}
                className={`w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y ${selectedSavedPrompt ? 'min-h-[120px]' : 'min-h-[240px]'}`}
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
                disabled={isSubmitting || (!selectedSavedPrompt && !additionalPrompt.trim())}
              >
                {isSubmitting ? 'Queuing...' : submitButtonText}
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
      <PromptLibraryDialog
        open={showPromptLibrary}
        onOpenChange={setShowPromptLibrary}
        onSelectPrompt={handleSelectPrompt}
      />
    </Dialog>
  );
}
