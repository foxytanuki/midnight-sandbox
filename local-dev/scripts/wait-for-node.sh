#!/bin/bash
# Node が起動するまで待機するスクリプト

set -e

NODE_URL="${NODE_URL:-http://localhost:9944}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-60}"
SLEEP_INTERVAL="${SLEEP_INTERVAL:-2}"

echo "⏳ Waiting for Midnight Node at $NODE_URL..."

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    if curl -sf "$NODE_URL/health" > /dev/null 2>&1; then
        echo "✅ Node is ready! (attempt $attempt)"
        exit 0
    fi
    
    echo "   Attempt $attempt/$MAX_ATTEMPTS - Node not ready yet..."
    sleep $SLEEP_INTERVAL
    attempt=$((attempt + 1))
done

echo "❌ Node did not become ready after $MAX_ATTEMPTS attempts"
exit 1

