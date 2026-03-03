// Streaming event types
export type StreamEvent =
  | { type: 'start'; workspaceId: string; runId: string; timestamp: string }
  | { type: 'progress'; content: unknown; timestamp: string }
  | { type: 'complete'; workspaceId: string; runId: string; status: 'success' | 'failure'; timestamp: string };
