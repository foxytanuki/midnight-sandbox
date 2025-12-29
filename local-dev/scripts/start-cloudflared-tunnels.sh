#!/bin/bash
# Start cloudflared tunnels for Midnight Node

# Start each tunnel in background
cloudflared tunnel --url ws://localhost:9944 > /tmp/cloudflared-node.log 2>&1 &
NODE_PID=$!

cloudflared tunnel --url http://localhost:8088 > /tmp/cloudflared-indexer.log 2>&1 &
INDEXER_PID=$!

cloudflared tunnel --url http://localhost:6300 > /tmp/cloudflared-proof.log 2>&1 &
PROOF_PID=$!

echo "Cloudflared tunnels started!"
echo "Node PID: $NODE_PID"
echo "Indexer PID: $INDEXER_PID"
echo "Proof Server PID: $PROOF_PID"
echo ""
echo "Check logs:"
echo "  tail -f /tmp/cloudflared-node.log"
echo "  tail -f /tmp/cloudflared-indexer.log"
echo "  tail -f /tmp/cloudflared-proof.log"
echo ""
echo "To stop tunnels:"
echo "  kill $NODE_PID $INDEXER_PID $PROOF_PID"

