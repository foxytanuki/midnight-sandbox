#!/bin/bash
# Start cloudflared tunnels for Midnight Node

# Clean up old log files
rm -f /tmp/cloudflared-node.log /tmp/cloudflared-indexer.log /tmp/cloudflared-proof.log

echo "Starting cloudflared tunnels..."
echo ""

# Start each tunnel in background
cloudflared tunnel --url http://localhost:9944 > /tmp/cloudflared-node.log 2>&1 &
NODE_PID=$!

cloudflared tunnel --url http://localhost:8088 > /tmp/cloudflared-indexer.log 2>&1 &
INDEXER_PID=$!

cloudflared tunnel --url http://localhost:6300 > /tmp/cloudflared-proof.log 2>&1 &
PROOF_PID=$!

# Wait for tunnels to initialize and extract URLs
sleep 5

# Function to extract URL from log file
extract_url() {
    local log_file=$1
    grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$log_file" | head -1
}

# Extract URLs
NODE_URL=$(extract_url /tmp/cloudflared-node.log)
INDEXER_URL=$(extract_url /tmp/cloudflared-indexer.log)
PROOF_URL=$(extract_url /tmp/cloudflared-proof.log)

echo "=========================================="
echo "Cloudflared Tunnels Started"
echo "=========================================="
echo ""
echo "Node RPC (WebSocket/HTTP):"
if [ -n "$NODE_URL" ]; then
    echo "  URL: $NODE_URL"
    echo "  WSS: ${NODE_URL/http/wss}"
else
    echo "  URL: (checking...)"
fi
echo ""
echo "Indexer GraphQL:"
if [ -n "$INDEXER_URL" ]; then
    echo "  URL: $INDEXER_URL"
    echo "  GraphQL: ${INDEXER_URL}/api/v1/graphql"
else
    echo "  URL: (checking...)"
fi
echo ""
echo "Proof Server:"
if [ -n "$PROOF_URL" ]; then
    echo "  URL: $PROOF_URL"
else
    echo "  URL: (checking...)"
fi
echo ""
echo "=========================================="
echo "Process IDs:"
echo "  Node: $NODE_PID"
echo "  Indexer: $INDEXER_PID"
echo "  Proof Server: $PROOF_PID"
echo ""
echo "To stop tunnels:"
echo "  kill $NODE_PID $INDEXER_PID $PROOF_PID"
echo ""
echo "Log files:"
echo "  tail -f /tmp/cloudflared-node.log"
echo "  tail -f /tmp/cloudflared-indexer.log"
echo "  tail -f /tmp/cloudflared-proof.log"
echo "=========================================="

