# Sealed Auction dApp Example

入札オークション dApp の例です。

## 使用方法

```bash
bun install
bun run build
bun run deploy

bun run run bid 100          # 100 で入札
bun run run bid 200          # 200 で入札（より高い額）
bun run run close_bidding    # 入札を締め切る
bun run run reveal           # 結果を公開
bun run run get_highest_bid  # 最高入札額を取得
bun run run get_bid_count    # 入札数を取得
bun run run is_revealed      # 公開されたか確認
```

## コントラクト

- `bid(amount)` - 入札（最高額より高い必要あり）
- `close_bidding()` - 入札を締め切る
- `reveal()` - 結果を公開
- `get_highest_bid()` - 最高入札額
- `get_bid_count()` - 入札数
- `is_revealed()` - 公開フラグ
