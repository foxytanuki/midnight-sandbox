# 01. Environment Setup

A guide for setting up a local dApp development environment.

## Required Tools

### 1. direnv

Required to automatically set environment variables when entering the project directory.

```bash
# Ubuntu/Debian
sudo apt-get install direnv

# macOS
brew install direnv
```

Shell hook configuration (add to `~/.zshrc` or `~/.bashrc`):

```bash
# For zsh
eval "$(direnv hook zsh)"

# For bash
eval "$(direnv hook bash)"
```

After configuration, restart your shell or run `source ~/.zshrc`.

### 2. Docker

Required to run the node, indexer, and Proof Server.

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# macOS
brew install --cask docker
```

### 3. Node.js (v20+)

Required for dApp development with midnight-js.

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify
node --version  # v20.x.x
```

### 4. Compact Compiler

Required to write smart contracts in the Compact language.

```bash
# Install
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/download/compact-v0.3.0/compact-installer.sh | sh

# Verify
compact -V
```

## Starting the Local Environment

```bash
cd local-dev

# Start
make up

# Check status
make status

# Health check
make health
```

## Environment Variables

You can configure the URL of each service with the following environment variables:

```bash
export MIDNIGHT_NODE_URL="ws://localhost:9944"
export MIDNIGHT_INDEXER_URL="http://localhost:8088/graphql"
export MIDNIGHT_PROOF_SERVER_URL="http://localhost:6300"
```

## Next Steps

- [02-node.md](02-node.md) - Detailed node configuration
- [03-compact.md](03-compact.md) - Compact language introduction

