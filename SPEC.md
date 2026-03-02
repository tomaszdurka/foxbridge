# Local Model API - Project Specification

## Overview

A TypeScript + Express API server that enables programmatic execution of Claude CLI commands with structured JSON output. The API supports both buffered (single response) and streaming (JSONL) modes, determined by the `Accept` header.

## Core Requirements

### 1. Technology Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **CLI Integration**: Claude CLI (via `claude` command)

### 2. Key Features
- Execute Claude CLI commands programmatically
- Automatic workspace creation for each run
- Two response modes: buffered JSON and streaming JSONL (based on `Accept` header)
- Structured schema output validation
- Workspace isolation with unique IDs

## API Specification

### Endpoint: `POST /runs/claude`

#### Request Headers
- `Content-Type: application/json`
- `Accept: application/json` (default, buffered) or `application/x-ndjson` (streaming)

#### Request Body Schema

```json
{
  "prompt": "string",           // Required: Claude CLI prompt
  "schema": "object?"            // Optional: JSON schema for structured output
}
```

**Notes:**
- No `workingDirectory` field — each run automatically creates a workspace under `./workspaces/{uuid}/`
- No `stream` field — streaming is determined by the `Accept` header
- Future enhancement: allow reusing a workspace by providing a `workspaceId`

#### Example Requests

**Buffered Mode (with schema):**
```bash
curl -X POST http://localhost:3100/runs/claude \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "prompt": "What is 2+2?",
    "schema": {
      "type": "object",
      "properties": {
        "answer": { "type": "number" }
      },
      "required": ["answer"]
    }
  }'
```

**Streaming Mode (no schema):**
```bash
curl -X POST http://localhost:3100/runs/claude \
  -H "Content-Type: application/json" \
  -H "Accept: application/x-ndjson" \
  -d '{
    "prompt": "Explain how TypeScript generics work"
  }'
```

### Response Modes

#### Buffered Mode (`Accept: application/json`)

**Response Headers:**
- `Content-Type: application/json`

**Response Body Schema:**
```json
{
  "workspaceId": "string",      // UUID of the workspace directory
  "runId": "string",            // UUID of this execution
  "status": "success|failure",  // Execution status
  "response": "object | string" // Structured output (if schema) or raw response
}
```

**Example Success Response:**
```json
{
  "workspaceId": "abc-123-def-456",
  "runId": "xyz-789-uvw-012",
  "status": "success",
  "response": {
    "answer": 4
  }
}
```

**Example Failure Response:**
```json
{
  "workspaceId": "abc-123-def-456",
  "runId": "xyz-789-uvw-012",
  "status": "failure",
  "response": "Error executing command: ..."
}
```

#### Streaming Mode (`Accept: application/x-ndjson`)

**Response Headers:**
- `Content-Type: application/x-ndjson` (JSONL)
- `Cache-Control: no-cache`

**Response Body (JSONL Stream):**

Each line is a JSON object representing an event:

```jsonl
{"type":"start","workspaceId":"abc-123","runId":"xyz-789","timestamp":"2026-03-02T10:30:00.000Z"}
{"type":"progress","content":"Analyzing request...","timestamp":"2026-03-02T10:30:01.000Z"}
{"type":"progress","content":"Generating response...","timestamp":"2026-03-02T10:30:02.000Z"}
{"type":"complete","workspaceId":"abc-123","runId":"xyz-789","status":"success","timestamp":"2026-03-02T10:30:05.000Z"}
```

**Event Types:**

- **start**: Initial event with `workspaceId`, `runId`, and `timestamp`
- **progress**: Content update from Claude CLI with `content` and `timestamp`
- **complete**: Final event with `workspaceId`, `runId`, `status` ("success" or "failure"), and `timestamp`
- **error**: Error event with `message`, `code`, and `timestamp` (for system errors)

## Workspace Management

### Strategy

Every run creates a new workspace:
- Directory: `./workspaces/{workspaceId}/` where `workspaceId` is a UUID
- The workspace is created before executing the command
- The `workspaceId` is returned in the response
- Future enhancement: allow clients to provide a `workspaceId` to reuse an existing workspace

### Directory Structure
```
local-model-api/
├── workspaces/
│   ├── abc-123-def-456/       # Workspace for run 1
│   └── xyz-789-uvw-012/       # Workspace for run 2
```

**Note:** The `workspaces/` directory is gitignored.

## Service Architecture

### Claude Executor Service

A service class responsible for spawning the Claude CLI process with the correct flags.

#### Interface

```typescript
interface ClaudeExecutorOptions {
  prompt: string;               // The prompt to execute
  workingDirectory: string;     // Resolved workspace directory path
  schema?: object;              // Optional JSON schema for structured output
}
```

#### Method

**`execute(options: ClaudeExecutorOptions): ChildProcess`**

- Spawns the `claude` CLI with the following flags:
  - `-p` — Non-interactive / print mode
  - `--output-format stream-json` — Always use streaming JSON output
  - `--json-schema '<json>'` — Optional, for structured output validation
- Sets `cwd` to `options.workingDirectory`
- Strips `CLAUDE_CODE` from environment to avoid nesting issues
- Returns the `ChildProcess` for the route handler to manage

#### Command Construction

Example command:
```bash
claude -p "What is 2+2?" --output-format stream-json
```

With schema:
```bash
claude -p "What is 2+2?" --output-format stream-json --json-schema '{"type":"object","properties":{"answer":{"type":"number"}},"required":["answer"]}'
```

**Notes:**
- The executor always uses `--output-format stream-json`
- The route handler decides whether to proxy the stream or buffer it
- The command is executed with `{ cwd: workingDirectory }`

## Error Handling

### Validation Errors (400)

```json
{
  "error": "Validation failed",
  "details": "prompt is required"
}
```

### System Errors (500)

In buffered mode:
```json
{
  "workspaceId": "abc-123",
  "runId": "xyz-789",
  "status": "failure",
  "response": "Failed to spawn Claude CLI: ..."
}
```

In streaming mode:
```jsonl
{"type":"error","message":"Failed to spawn Claude CLI","code":"SPAWN_ERROR","timestamp":"2026-03-02T10:30:00.000Z"}
```

## Implementation Notes

### Route Handler Logic

1. **Validate** request body (`prompt` required, must be string)
2. **Generate IDs**: Create `workspaceId` (UUID) and `runId` (UUID)
3. **Create workspace**: Create directory at `./workspaces/{workspaceId}/`
4. **Determine mode**: Check `Accept` header
   - `application/x-ndjson` → streaming mode
   - Anything else → buffered mode
5. **Spawn process**: Call `executor.execute()` to get `ChildProcess`
6. **Handle output**:
   - **Streaming**: Proxy stdout as JSONL with start/progress/complete events
   - **Buffered**: Collect stdout, parse final result, return single JSON response
7. **Error handling**: Handle spawn errors, process errors, and client disconnects

### Process Management

- **Client disconnect**: Kill the `claude` process with `SIGTERM`
- **Process errors**: Capture and return as error responses
- **Exit codes**: Determine `status` based on exit code (0 = success, non-zero = failure)
