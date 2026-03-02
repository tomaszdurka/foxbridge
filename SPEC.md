# Local Model API - Project Specification

## Overview

A TypeScript + Express API server that enables programmatic execution of Claude Code CLI commands with structured JSON output. The API supports both synchronous (single response) and streaming (JSONL) modes.

## Core Requirements

### 1. Technology Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **CLI Integration**: Claude Code (non-interactive mode)

### 2. Key Features
- Execute Claude Code commands programmatically
- Support for working directory specification
- Random working directory generation as fallback
- Two response modes: synchronous JSON and streaming JSONL
- Structured schema output from Claude Code

## API Specification

### Endpoint: `POST /runs/claude`

#### Request Headers
- `Content-Type: application/json`

#### Request Body Schema

```json
{
  "prompt": "string",           // Claude Code prompt
  "workingDirectory": "string?", // Optional: path to working directory
  "stream": "boolean",           // Whether to stream response (default: false)
  "schema": "object?"            // Optional: JSON schema for structured output
}
```

#### Example Requests

**Synchronous Mode (with schema):**
```json
{
  "prompt": "Analyze the main.ts file and return a summary",
  "workingDirectory": "/path/to/project",
  "stream": false,
  "schema": {
    "type": "object",
    "properties": {
      "summary": { "type": "string" },
      "issues": { "type": "array", "items": { "type": "string" } },
      "complexity": { "type": "number" }
    },
    "required": ["summary"]
  }
}
```

**Streaming Mode (no schema):**
```json
{
  "prompt": "Refactor the authentication module",
  "stream": true
}
```

### Response Modes

#### Non-Streaming (`stream: false`)

**Response Headers:**
- `Content-Type: application/json`

**Response Body Schema:**
```json
{
  "success": "boolean",
  "executionId": "string",        // Unique execution ID
  "workingDirectory": "string",   // Actual working directory used
  "startTime": "string",          // ISO timestamp
  "endTime": "string",            // ISO timestamp
  "duration": "number",           // Milliseconds
  "result": {
    "output": "object | string",  // Structured output from Claude Code
    "exitCode": "number"
  },
  "error": {                      // Only present if success: false
    "message": "string",
    "code": "string",
    "details": "object?"
  }
}
```

#### Streaming (`stream: true`)

**Response Headers:**
- `Content-Type: application/x-ndjson` (JSONL)
- `Transfer-Encoding: chunked`

**Response Body (JSONL Stream):**

Each line is a JSON object representing an event:

```jsonl
{"type":"start","executionId":"uuid","workingDirectory":"/path","timestamp":"2026-03-02T..."}
{"type":"progress","content":"Starting analysis...","timestamp":"2026-03-02T..."}
{"type":"progress","content":"Reading files...","timestamp":"2026-03-02T..."}
{"type":"result","output":{"summary":"..."},"timestamp":"2026-03-02T..."}
{"type":"complete","duration":5432,"exitCode":0,"timestamp":"2026-03-02T..."}
```

**Error event:**
```jsonl
{"type":"error","message":"Command failed","code":"EXECUTION_ERROR","timestamp":"2026-03-02T..."}
```

## Working Directory Management

### Strategy

1. **Explicit Path Provided**: Use the provided `workingDirectory` path
   - Validate path exists and is accessible
   - Return error if invalid

2. **No Path Provided**: Generate random working directory
   - Create temporary directory: `/tmp/claude-exec-{UUID}`
   - Initialize as empty workspace
   - Clean up after execution (configurable retention)

### Directory Structure
```
/tmp/claude-exec-{UUID}/
├── .claude/          # Claude Code configuration (if needed)
└── workspace/        # Working files
```

## Service Architecture

### Claude Executor Service

A service class responsible for executing Claude Code commands with specified options.

#### Interface

```typescript
interface ClaudeExecutorOptions {
  command: string;              // The prompt/command to execute
  workingDirectory: string;     // Directory to execute in
  stream: boolean;              // Whether to stream the response
  schema?: object;              // Optional JSON schema for structured output
}

interface ClaudeExecutorResult {
  output: any;                  // Parsed JSON output from Claude
  exitCode: number;             // Process exit code
  stderr?: string;              // Error output if any
}
```

#### Execution Behavior

**Non-Streaming Mode (`stream: false`):**
- Execute Claude Code command
- Wait for completion
- Parse and return full JSON output
- Return as `ClaudeExecutorResult`

**Streaming Mode (`stream: true`):**
- Execute Claude Code command
- Stream output line-by-line as JSONL
- Each line is a separate JSON event
- Close stream on completion

#### Command Construction

The service constructs Claude Code commands with:
- Non-interactive mode (always)
- JSON output format (always)
- Schema validation (if schema provided)
- Working directory context

Example command:
```bash
cd <workingDirectory> && \
  claude-code \
    --non-interactive \
    --json \
    [--schema '<json-schema>'] \
    "<user-command>"
```

#### Output Handling

- **stdout**: Capture for JSON output
- **stderr**: Capture for errors/warnings
- **Exit codes**:
  - `0` = Success
  - `1` = Command failed
  - `2` = Invalid arguments
  - Other codes = System errors

## Error Handling

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid working directory path",
    "details": {
      "field": "workingDirectory",
      "value": "/invalid/path",
      "reason": "Path does not exist"
    }
  },
  "timestamp": "2026-03-02T10:30:00.000Z"
}
```


