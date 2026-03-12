'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { listPrompts, createPrompt, deletePrompt } from '@/lib/api';
import { BookmarkPlus, Plus, Trash2 } from 'lucide-react';

export default function PromptSelector({ onSelect }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: '', description: '', prompt: '' });

  useEffect(() => {
    if (open) {
      loadPrompts();
    }
  }, [open]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await listPrompts();
      setPrompts(data);
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async () => {
    if (!newPrompt.name.trim() || !newPrompt.prompt.trim()) {
      return;
    }

    try {
      await createPrompt(newPrompt);
      setNewPrompt({ name: '', description: '', prompt: '' });
      setShowCreateDialog(false);
      await loadPrompts();
    } catch (err) {
      console.error('Failed to create prompt:', err);
    }
  };

  const handleDeletePrompt = async (e, promptId) => {
    e.stopPropagation();
    if (!confirm('Delete this prompt?')) return;

    try {
      await deletePrompt(promptId);
      await loadPrompts();
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const handleSelectPrompt = (prompt) => {
    onSelect(prompt);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="text-xs text-mint hover:text-mint/80 flex items-center gap-1 transition"
            type="button"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            Browse Saved
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2 max-h-[400px] overflow-y-auto" align="end">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {prompts.length} saved
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCreateDialog(true)}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </div>
            {loading ? (
              <p className="text-center py-4 text-xs text-muted-foreground">Loading...</p>
            ) : prompts.length === 0 ? (
              <p className="text-center py-4 text-xs text-muted-foreground">No saved prompts</p>
            ) : (
              prompts.map((prompt) => (
                <div
                  key={prompt.promptId}
                  className="p-2 rounded hover:bg-muted cursor-pointer group"
                  onClick={() => handleSelectPrompt(prompt)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{prompt.name}</p>
                      {prompt.description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {prompt.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeletePrompt(e, prompt.promptId)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent onClose={() => setShowCreateDialog(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Prompt</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <Input
                placeholder="Prompt name"
                value={newPrompt.name}
                onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
              />
              <Input
                placeholder="Description (optional)"
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
              />
              <textarea
                placeholder="Prompt text"
                value={newPrompt.prompt}
                onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                className="w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePrompt}>
                  Save Prompt
                </Button>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
