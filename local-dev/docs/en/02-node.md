# 02. Starting the Local Node

This guide explains how to start and configure the Midnight node.

## Starting with Docker Compose

```bash
# Start
make up

# Check logs
make node-logs

# Stop
make down
```

## Node Configuration

The following three services are started for local development:

| Service | Port | Description |
|---------|------|-------------|
| Node | 9944 | Blockchain node (WebSocket RPC) |
| Indexer | 8088 | GraphQL API |
| Proof Server | 6300 | ZK proof generation server |

## Verifying Node RPC

```bash
# WebSocket connection test (requires websocat)
echo '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}' | \
  websocat ws://localhost:9944

# Health check with curl
curl http://localhost:9944/health
```

## Verifying Indexer GraphQL

```bash
# GraphQL query (get current block height)
curl -X POST http://localhost:8088/api/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ block { height } }"}'

# Health check
curl http://localhost:8088/health
```

## Development Settings

You can change settings with environment variables in `compose.yaml`:

```yaml
node:
  environment:
    CFG_PRESET: dev        # Development preset
    RUST_LOG: debug        # Log level (debug for detailed logs)
```

## Troubleshooting

### Node won't start

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs node
```

### Port in use

```bash
# Check which process is using port 9944
lsof -i :9944

# Use a different port
# Change ports in compose.yaml
ports:
  - "19944:9944"
```

### Reset data

```bash
make clean
```

## Next Steps

- [03-compact.md](03-compact.md) - Compact language introduction

