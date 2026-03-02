# FoxBridge 🦊

> Local Model API - Bridge to Claude CLI with workspace isolation

**FoxBridge** is a TypeScript + NestJS API server that enables programmatic execution of Claude CLI commands with structured JSON output.

## Features

- 🚀 Execute Claude CLI commands via REST API
- 📦 Automatic workspace isolation for each run
- 🔄 Two response modes: buffered JSON or streaming JSONL
- 📝 JSON schema validation for structured outputs
- 🔁 Workspace reuse for multi-run continuity
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

# Start development server
npm run start:dev

# API will be available at http://localhost:3100
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

## Documentation

See [SPEC.md](./SPEC.md) for complete API documentation and architecture details.

## License

ISC
