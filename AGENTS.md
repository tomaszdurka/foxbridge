# FoxBridge - Agent Development Guide

## Project Overview

**FoxBridge** is a NestJS-based REST API that acts as a bridge between HTTP clients and the Claude CLI. It enables programmatic execution of Claude CLI commands with workspace isolation, streaming support, and structured JSON output.

### Core Concept

- **HTTP API → Claude CLI**: Transform HTTP requests into `claude` command executions
- **Workspace Isolation**: Each run operates in an isolated directory under `workspaces/`
- **Dual Response Modes**: Buffered JSON or streaming JSONL based on `Accept` header
- **State Persistence**: Workspaces can be reused across runs for continuity

## Architecture

### Key Components

```
src/
├── main.ts                    # NestJS bootstrap, port 3100
├── app.module.ts              # Root module (imports RunsModule, ConfigModule)
├── lib/
│   └── enhancePrompt.ts       # Prompt enhancement with workspace file tracking
├── claude/
│   ├── claude.module.ts       # Provides ClaudeService
│   └── claude.service.ts      # Claude CLI execution logic
└── runs/
    ├── runs.module.ts         # Provides RunsService, RunsController
    ├── runs.controller.ts     # POST /runs/claude endpoint handler
    ├── runs.service.ts        # Workspace management + JSON stream utilities
    └── dto/
        └── run.dto.ts         # Request validation (prompt, schema?, workspaceId?)
```

### Service Responsibilities

**RunsService**
- `ensureWorkspace(existingWorkspaceId?)`: Creates new workspace or validates existing one
- `executeJsonStream()`: Generic utility for running commands that output JSONL
- Uses `WORKSPACES_DIR` env var (default: `./workspaces`)

**ClaudeService**
- `run(options)`: Execute Claude CLI with enhanced prompt
- Creates initial `CLAUDE.md` in workspace (reference file)
- Enhances prompt via `enhancePrompt()` utility
- Runs: `claude --continue -p <prompt> --output-format stream-json --verbose --permission-mode bypassPermissions`
- Strips `CLAUDE_CODE` and `CLAUDECODE` from environment to avoid nesting

**enhancePrompt()**
- Appends instructions to maintain workspace state files:
  - `AGENTS.md`: Project state, context, technical details
  - `SPECIFICATION.md`: Mid-high level feature documentation
  - `CHANGELOG.md`: Run history with date/time and run-id

### Request Flow

1. Client sends POST to `/runs/claude` with `{ prompt, schema?, workspaceId? }`
2. `RunsController` validates via `RunDto`
3. `RunsService.ensureWorkspace()` creates/reuses workspace
4. Controller determines mode from `Accept` header
5. `ClaudeService.run()` executes Claude CLI
6. Events streamed to client or buffered for single response

### Response Modes

**Buffered** (`Accept: application/json`):
- Single JSON response with `type: "result"` event
- Includes `workspaceId`, `runId`, `timestamp`

**Streaming** (`Accept: application/x-ndjson`):
- JSONL stream of all events from Claude CLI
- Each line augmented with `workspaceId`, `runId`, `timestamp`
- Client disconnect handling

## Development Guidelines

### When Modifying Code

**Adding Features**
- Follow existing NestJS patterns (modules, services, controllers)
- Keep workspace isolation intact
- Maintain both streaming and buffered modes
- Update SPEC.md if API changes

**Workspace State Files**
- `CLAUDE.md`: Generated reference (points to AGENTS.md, SPEC.md, CHANGELOG.md)
- `AGENTS.md`: Agent-facing project state
- `SPECIFICATION.md`: User-facing feature docs
- `CHANGELOG.md`: Chronological run history

**Error Handling**
- Use NestJS exceptions (`BadRequestException`, etc.)
- Validate workspaceId exists before reuse (400 if not)
- Log JSON parsing errors but don't crash

**Security**
- Never expose without authentication/rate limiting
- Validate all user inputs
- Be cautious with `--permission-mode bypassPermissions`
- Workspace isolation prevents cross-contamination but not malicious prompts

### Key Files to Know

- `src/runs/runs.service.ts`: Line buffering logic for JSONL parsing
- `src/claude/claude.service.ts`: Claude CLI command construction
- `src/lib/enhancePrompt.ts`: Prompt enhancement template
- `SPEC.md`: Complete API specification
- `vercel.json`: Deployment config (routes to `server.js`)

### Environment Variables

- `WORKSPACES_DIR`: Custom workspace directory (default: `./workspaces`)
- Load from `.env.local` (gitignored) via ConfigModule

### Testing Locally

```bash
npm run start:dev

# Buffered request
curl -X POST http://localhost:3100/runs/claude \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"prompt": "What is 2+2?"}'

# Streaming request
curl -X POST http://localhost:3100/runs/claude \
  -H "Content-Type: application/json" \
  -H "Accept: application/x-ndjson" \
  -d '{"prompt": "Explain async/await"}'
```

### Deployment Considerations

- **Vercel**: Uses `vercel.json` config, routes all to `server.js`
- **Production**: Add auth, rate limiting, input validation
- **Workspaces**: Consider cleanup strategy for old workspaces
- **Scaling**: Each request spawns a `claude` process - resource intensive

## Common Tasks

### Add New Endpoint
1. Create DTO in `src/runs/dto/`
2. Add method to `RunsController`
3. Implement logic in `RunsService` or new service
4. Update SPEC.md

### Modify Prompt Enhancement
- Edit `src/lib/enhancePrompt.ts`
- Change workspace file tracking instructions

### Change Permission Mode
- Edit `src/claude/claude.service.ts` line 37
- Options: `bypassPermissions`, `plan`, `prompt`

### Add CLI Flags
- Edit `args` array in `src/claude/claude.service.ts`
- Maintain `--output-format stream-json` for parsing

## Important Notes

- **Module Dependency**: `RunsModule` ↔ `ClaudeModule` have circular dependency, resolved via `forwardRef()`
- **Line Buffering**: Critical for JSONL parsing - buffers incomplete lines until `\n` received
- **Process Stdin**: Closed immediately after spawn to prevent hanging
- **Client Disconnects**: Tracked via `res.on('close')` to stop writing events
- **Workspace Persistence**: Workspaces are never auto-deleted, manual cleanup required

## Project Context

This project enables building applications on top of Claude CLI without needing to parse terminal output. It provides a clean HTTP → JSONL bridge with workspace state management.

Use cases:
- CI/CD integrations
- Programmatic code generation
- Multi-step workflows with workspace continuity
- Applications requiring structured Claude responses
