# Local Model API - Project Specification

## Overview

A TypeScript + NestJS API server that enables programmatic execution of Claude CLI commands with structured JSON output. The API supports both buffered (single response) and streaming (JSONL) modes, determined by the `Accept` header.

## Core Requirements

### 1. Technology Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: NestJS
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

**Response Body:**
The response returns the result object from Claude CLI's `type: "result"` event, along with workspace metadata.

**Example Success Response:**
```json
{
  "workspaceId": "abc-123-def-456",
  "runId": "xyz-789-uvw-012",
  "timestamp": "2026-03-02T10:30:05.000Z",
  "type": "result",
  "result": {
    "answer": 4
  }
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
{"type":"thinking","content":"...","timestamp":"2026-03-02T10:30:01.000Z","workspaceId":"abc-123","runId":"xyz-789"}
{"type":"text","content":"The answer is 4","timestamp":"2026-03-02T10:30:02.000Z","workspaceId":"abc-123","runId":"xyz-789"}
{"type":"result","result":{"answer":4},"timestamp":"2026-03-02T10:30:05.000Z","workspaceId":"abc-123","runId":"xyz-789"}
```

**Event Types:**

- **start**: Initial event sent by the controller with `workspaceId`, `runId`, and `timestamp`
- **All Claude CLI events**: Forwarded directly from Claude CLI's `--output-format stream-json`, with added `workspaceId`, `runId`, and `timestamp` fields
  - Common types: `thinking`, `text`, `result`, `result_success`, `tool_use`, etc.

## Workspace Management

### Strategy

Every run creates a new workspace:
- Directory: `./workspaces/{workspaceId}/` where `workspaceId` is a UUID
- The workspace is created before executing the command via `RunsService.createWorkspace()`
- The `workspaceId` and `runId` are returned in the response
- Future enhancement: allow clients to provide a `workspaceId` to reuse an existing workspace

### Directory Structure
```
local-model-api/
├── workspaces/
│   ├── abc-123-def-456/       # Workspace for run 1
│   └── xyz-789-uvw-012/       # Workspace for run 2
```

**Note:** The `workspaces/` directory is gitignored.

## Architecture

### Module Structure

```
src/
├── main.ts                    # Bootstrap NestJS application
├── app.module.ts              # Root module (imports RunsModule)
├── types.ts                   # Shared types (StreamEvent)
├── claude/
│   ├── claude.module.ts       # Claude module (exports ClaudeService)
│   └── claude.service.ts      # Claude CLI execution logic
└── runs/
    ├── runs.module.ts         # Runs module (exports RunsService)
    ├── runs.controller.ts     # HTTP endpoint handler
    ├── runs.service.ts        # Workspace & JSON stream utilities
    └── dto/
        └── run.dto.ts         # Request validation DTO
```

### Service Responsibilities

#### RunsService

**Purpose:** Provides reusable utilities for workspace management and JSON stream processing.

**Methods:**

1. **`createWorkspace(): WorkspaceContext`**
   - Creates a new workspace directory under `./workspaces/{uuid}/`
   - Returns `{ workspaceId, runId, workingDir }`

2. **`executeJsonStream(options): Promise<number | null>`**
   - Generic utility for executing any command that outputs newline-delimited JSON
   - Handles buffering of stdout/stderr to prevent split JSON lines
   - Parses each complete line and calls `onLine` callback
   - Returns the process exit code
   - Options:
     - `command`: Command to execute
     - `args`: Command arguments
     - `cwd`: Working directory
     - `env`: Environment variables (optional)
     - `onLine`: Callback for each parsed JSON event (optional)

**Key Features:**
- Separate buffers for stdout and stderr to prevent data corruption
- Buffers incomplete lines until newline is received
- Error handling for malformed JSON

#### ClaudeService

**Purpose:** Handles Claude CLI-specific logic.

**Methods:**

**`run(options): Promise<unknown>`**
- Builds Claude CLI arguments
- Sets permission mode (`bypassPermissions`)
- Strips `CLAUDE_CODE` and `CLAUDECODE` from environment
- Uses `RunsService.executeJsonStream()` to run the command
- Finds and returns the `type: "result"` or `type: "result_success"` event
- Options:
  - `prompt`: The prompt to execute
  - `workingDir`: Workspace directory path
  - `outputSchema`: Optional JSON schema for structured output
  - `onOutput`: Callback for streaming events (optional)

**Command Construction:**

Example command:
```bash
claude -p "What is 2+2?" --output-format stream-json --verbose --permission-mode bypassPermissions
```

With schema:
```bash
claude -p "What is 2+2?" --output-format stream-json --verbose --permission-mode bypassPermissions --json-schema '{"type":"object",...}'
```

#### RunsController

**Purpose:** Handles HTTP requests and orchestrates the execution flow.

**Flow:**

1. Validate request body via `RunDto` (class-validator)
2. Create workspace using `RunsService.createWorkspace()`
3. Determine streaming mode from `Accept` header
4. Set up response headers and event writer
5. Execute Claude CLI via `ClaudeService.run()`
6. Stream or buffer the response
7. Handle client disconnects

## Error Handling

### Validation Errors (400)

NestJS ValidationPipe automatically handles DTO validation:
```json
{
  "statusCode": 400,
  "message": ["prompt must be a string", "prompt should not be empty"],
  "error": "Bad Request"
}
```

### JSON Parsing Errors

Malformed JSON lines are logged but don't crash the process:
```
[RunsService] Failed to parse JSON: {incomplete json...
```

### Spawn Errors

If the Claude CLI fails to spawn:
```json
{
  "statusCode": 500,
  "message": "Failed to spawn claude: command not found"
}
```

## Implementation Notes

### JSON Stream Buffering

The `RunsService.executeJsonStream()` method implements robust line buffering:

1. Maintains separate buffers for stdout and stderr
2. On each data chunk:
   - Append to buffer
   - Split by `\n`
   - Pop the last element (incomplete line) back into buffer
   - Parse and emit all complete lines
3. This prevents JSON parsing errors from split chunks

### Module Dependencies

- `RunsModule` and `ClaudeModule` have a circular dependency
- Resolved using `forwardRef()` in both module imports
- `ClaudeService` injects `RunsService` to use `executeJsonStream()`
- `RunsController` injects both `ClaudeService` and `RunsService`

### Process Management

- Client disconnects are tracked via `res.on('close', ...)`
- Stream events only written if client is still connected
- Process stdin is closed immediately after spawn to prevent hanging
