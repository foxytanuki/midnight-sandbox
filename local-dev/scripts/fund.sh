#!/bin/bash
# Faucet APIを使用してアドレスに資金を供給するスクリプト

set -e

FAUCET_API_URL="${FAUCET_API_URL:-http://localhost:3000}"

usage() {
    cat << EOF
Usage: $0 <mnemonic|shielded-address|unshielded-address>

Examples:
  $0 "your twelve word mnemonic phrase here"
  $0 mn_shield-addr_undeployed1q...
  $0 mn_addr_undeployed1q...

Environment variables:
  FAUCET_API_URL  Faucet API URL (default: http://localhost:3000)
EOF
    exit 1
}

check_api() {
    if ! curl -sf "${FAUCET_API_URL}/health" > /dev/null 2>&1; then
        echo "❌ Faucet API is not available at ${FAUCET_API_URL}"
        echo "   Make sure the service is running: make up"
        exit 1
    fi
}

fund() {
    local input="$1"
    
    if [ -z "$input" ]; then
        echo "❌ No input provided"
        usage
    fi

    check_api

    # Determine input type and build request
    local request_body
    
    if [[ "$input" =~ ^mn_shield-addr_undeployed ]]; then
        # Shielded address
        request_body=$(cat << EOF
{
  "shieldedAddress": "$input"
}
EOF
        )
    elif [[ "$input" =~ ^mn_addr_undeployed ]]; then
        # Unshielded address
        request_body=$(cat << EOF
{
  "unshieldedAddress": "$input"
}
EOF
        )
    else
        # Assume mnemonic (space-separated words)
        # Escape quotes in mnemonic
        local escaped_mnemonic=$(echo "$input" | sed 's/"/\\"/g')
        request_body=$(cat << EOF
{
  "mnemonic": "$escaped_mnemonic"
}
EOF
        )
    fi

    echo -n "🚀 Requesting funds from Faucet API"
    
    # Show loading spinner in background
    local spinner_pid
    (
        local spinner_chars="⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏"
        while true; do
            for char in $spinner_chars; do
                echo -ne "\r🚀 Requesting funds from Faucet API $char"
                sleep 0.1
            done
        done
    ) &
    spinner_pid=$!
    
    # Make API request (suppress errors temporarily for spinner cleanup)
    set +e
    local response=$(curl -s -X POST "${FAUCET_API_URL}/fund" \
        -H "Content-Type: application/json" \
        -d "$request_body")
    local curl_exit=$?
    set -e
    
    # Stop spinner and clear line
    kill $spinner_pid 2>/dev/null || true
    wait $spinner_pid 2>/dev/null || true
    echo -ne "\r🚀 Requesting funds from Faucet API... Done!"
    echo ""
    echo ""
    
    # Check if curl failed
    if [ $curl_exit -ne 0 ]; then
        echo "❌ Failed to connect to Faucet API"
        exit 1
    fi

    # Check if response contains success
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ Funds sent successfully!"
        echo ""
        
        # Extract and display transaction hash
        local tx_hash=$(echo "$response" | grep -o '"txHash":"[^"]*' | cut -d'"' -f4)
        if [ -n "$tx_hash" ]; then
            echo "📝 Transaction Hash: $tx_hash"
        fi
        
        # If mnemonic was used, show derived addresses
        if echo "$response" | grep -q '"shieldedAddress"'; then
            local shielded_addr=$(echo "$response" | grep -o '"shieldedAddress":"[^"]*' | cut -d'"' -f4)
            local unshielded_addr=$(echo "$response" | grep -o '"unshieldedAddress":"[^"]*' | cut -d'"' -f4)
            if [ -n "$shielded_addr" ]; then
                echo "🔒 Shielded Address: $shielded_addr"
            fi
            if [ -n "$unshielded_addr" ]; then
                echo "🔓 Unshielded Address: $unshielded_addr"
            fi
        fi
        
        echo ""
        echo "💰 Transfer amount: 1,000,000,000 tokens (1e9)"
        exit 0
    else
        echo "❌ Failed to fund address"
        echo ""
        echo "Response:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        exit 1
    fi
}

# Main
if [ $# -eq 0 ]; then
    usage
fi

fund "$1"

