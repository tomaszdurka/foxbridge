# FoxBridge 🦊

> Local Model API - Bridge to Claude CLI with workspace isolation

**FoxBridge** is a TypeScript + NestJS API server that enables programmatic execution of Claude CLI commands with structured JSON output.

## Features

- 🚀 Execute Claude CLI commands via REST API
- 📦 Automatic workspace isolation with persistent sessions
- 🔄 Two response modes: buffered JSON or streaming JSONL
- 📝 JSON schema validation for structured outputs
- 🔁 Session management for conversation continuity
- 💾 SQLite persistence with MikroORM
- 🎨 Next.js 16 dashboard UI for monitoring and management
- 📊 Built-in state tracking across runs

## ⚠️ Disclaimer

**USE AT YOUR OWN RISK.** FoxBridge executes Claude CLI commands programmatically and can run arbitrary code within isolated workspaces.

- **Security**: Exposing this API to untrusted networks or users can pose significant security risks
- **Responsibility**: You are solely responsible for securing, monitoring, and managing any deployment of FoxBridge
- **No Warranty**: This software is provided "as is" without warranty of any kind
- **Production Use**: Implement proper authentication, rate limiting, input validation, and network security before any production deployment

By using FoxBridge, you acknowledge and accept these risks and responsibilities.

## Quick Start

```bash
# Install dependencies
npm install
cd ui && npm install && cd ..

# Start API server
npm run dev:api

# Start UI (in another terminal)
npm run dev:ui

# API: http://localhost:3100
# UI Dashboard: http://localhost:3101
# Swagger Docs: http://localhost:3100/api
```

## Example Usage

### Buffered Mode (with schema)

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

### Streaming Mode

```bash
curl -X POST http://localhost:3100/runs/claude \
  -H "Content-Type: application/json" \
  -H "Accept: application/x-ndjson" \
  -d '{
    "prompt": "Explain how TypeScript generics work"
  }'
```

## Dashboard UI

FoxBridge includes a Next.js 16 dashboard for visual management:

- **Runs** - View all Claude CLI executions with status, results, and logs
- **Workspaces** - Manage isolated project environments
- **Sessions** - Track conversation continuity across multiple runs

Access the dashboard at `http://localhost:3101` after starting the UI server.

## Documentation

See [SPEC.md](./SPEC.md) for complete API documentation and architecture details.

## License

ISC
