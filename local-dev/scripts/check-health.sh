#!/bin/bash
# 各サービスのヘルスチェックを実行するスクリプト

set -e

NODE_URL="${NODE_URL:-http://localhost:9944}"
INDEXER_URL="${INDEXER_URL:-http://localhost:8088}"
PROOF_SERVER_URL="${PROOF_SERVER_URL:-http://localhost:6300}"

check_service() {
    local name=$1
    local url=$2
    local endpoint=$3
    
    if curl -sf "${url}${endpoint}" > /dev/null 2>&1; then
        echo "✅ $name: OK ($url)"
        return 0
    else
        echo "❌ $name: UNAVAILABLE ($url)"
        return 1
    fi
}

echo "=== Midnight Local Environment Health Check ==="
echo ""

errors=0

check_service "Node" "$NODE_URL" "/health" || errors=$((errors + 1))

# Indexer GraphQL check
if curl -sf "$INDEXER_URL/graphql" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}' > /dev/null 2>&1; then
    echo "✅ Indexer: OK ($INDEXER_URL/graphql)"
else
    echo "❌ Indexer: UNAVAILABLE ($INDEXER_URL/graphql)"
    errors=$((errors + 1))
fi

check_service "Proof Server" "$PROOF_SERVER_URL" "/health" || errors=$((errors + 1))

echo ""
if [ $errors -eq 0 ]; then
    echo "🎉 All services are healthy!"
    exit 0
else
    echo "⚠️  $errors service(s) are not available"
    exit 1
fi

