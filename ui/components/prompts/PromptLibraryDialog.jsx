'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { listPrompts, createPrompt, deletePrompt } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';

export default function PromptLibraryDialog({ open, onOpenChange, onSelectPrompt }) {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
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

  const handleAddPrompt = async () => {
    if (!newPrompt.name.trim() || !newPrompt.prompt.trim()) {
      return;
    }

    try {
      await createPrompt(newPrompt);
      setNewPrompt({ name: '', description: '', prompt: '' });
      setShowAddForm(false);
      await loadPrompts();
    } catch (err) {
      console.error('Failed to create prompt:', err);
    }
  };

  const handleDeletePrompt = async (promptId) => {
    if (!confirm('Delete this prompt?')) return;

    try {
      await deletePrompt(promptId);
      await loadPrompts();
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const handleSelectPrompt = (prompt) => {
    onSelectPrompt(prompt);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Saved Prompts</DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[60vh]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {prompts.length} saved {prompts.length === 1 ? 'prompt' : 'prompts'}
              </p>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                variant={showAddForm ? 'outline' : 'default'}
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddForm ? 'Cancel' : 'New Prompt'}
              </Button>
            </div>

            {showAddForm && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
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
                  className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                />
                <Button onClick={handleAddPrompt} className="w-full">
                  Save Prompt
                </Button>
              </div>
            )}

            {loading ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Loading...</p>
            ) : prompts.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">
                No saved prompts yet. Click "New Prompt" to create one.
              </p>
            ) : (
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.promptId}
                    className="border rounded-lg p-3 hover:bg-muted/40 transition cursor-pointer group"
                    onClick={() => handleSelectPrompt(prompt)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{prompt.name}</h3>
                        {prompt.description && (
                          <p className="text-xs text-muted-foreground mt-1">{prompt.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {prompt.prompt}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(prompt.promptId);
                        }}
                        className="ml-3 p-2 text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
