.PHONY: up down restart logs status health clean node-logs indexer-logs proof-logs faucet-logs shell

# デフォルトターゲット
.DEFAULT_GOAL := help

# 環境変数
COMPOSE_FILE := compose.yaml

##@ 基本操作

up: ## ローカル環境を起動
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "🚀 Midnight local environment starting..."
	@echo ""
	@echo "Endpoints:"
	@echo "  Node RPC:     ws://localhost:9944"
	@echo "  Indexer:      http://localhost:8088/graphql"
	@echo "  Proof Server: http://localhost:6300"
	@echo "  Faucet API:   http://localhost:3000"
	@echo ""
	@echo "Run 'make status' to check service health"

down: ## 環境を停止
	docker compose -f $(COMPOSE_FILE) down
	@echo "✅ Midnight local environment stopped"

restart: down up ## 環境を再起動

##@ 状態確認

status: ## 各サービスの状態を表示
	@echo "=== Service Status ==="
	@docker compose -f $(COMPOSE_FILE) ps

health: ## ヘルスチェック実行
	@echo "=== Health Check ==="
	@./scripts/check-health.sh

logs: ## 全サービスのログを表示
	@exec docker compose -f $(COMPOSE_FILE) logs -f

node-logs: ## Node のログを表示
	@exec docker compose -f $(COMPOSE_FILE) logs -f node

indexer-logs: ## Indexer のログを表示
	@exec docker compose -f $(COMPOSE_FILE) logs -f indexer

proof-logs: ## Proof Server のログを表示
	@exec docker compose -f $(COMPOSE_FILE) logs -f proof-server

faucet-logs: ## Faucet API のログを表示
	@exec docker compose -f $(COMPOSE_FILE) logs -f faucet-api

##@ 開発ツール

shell: ## Node コンテナにシェル接続
	@exec docker compose -f $(COMPOSE_FILE) exec node /bin/sh

wait: ## Node が起動するまで待機
	@exec ./scripts/wait-for-node.sh

fund: ## アドレスに資金を供給 (ADDRESS=mnemonic|shielded-address|unshielded-address を指定)
	@if [ -z "$(ADDRESS)" ]; then \
		echo "Usage: make fund ADDRESS=\"<mnemonic or address>\""; \
		echo ""; \
		echo "Examples:"; \
		echo "  make fund ADDRESS=\"your twelve word mnemonic phrase here\""; \
		echo "  make fund ADDRESS=mn_shield-addr_undeployed1q..."; \
		echo "  make fund ADDRESS=mn_addr_undeployed1q..."; \
		exit 1; \
	fi
	@./scripts/fund.sh "$(ADDRESS)"

##@ Compact

compile: ## Compact コントラクトをコンパイル (CONTRACT=path を指定)
	@if [ -z "$(CONTRACT)" ]; then \
		echo "Usage: make compile CONTRACT=path/to/contract.compact"; \
		exit 1; \
	fi
	compact compile $(CONTRACT) $(dir $(CONTRACT))out

##@ クリーンアップ

clean: down ## 環境を完全にクリーンアップ (データ含む)
	docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	@echo "🧹 Cleaned up all containers and volumes"

##@ ヘルプ

help: ## このヘルプを表示
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

