# Escrow dApp Example

条件付き支払い（エスクロー）dApp の例です。

## 使用方法

```bash
pnpm install
pnpm run build
pnpm run deploy

pnpm run run fund 1000     # 1000 を預ける
pnpm run run release       # 受取人に解放
pnpm run run refund        # 送金者に返金
pnpm run run get_state     # 状態を取得
pnpm run run get_amount    # 金額を取得
pnpm run run is_completed  # 完了したか確認
```

## 状態遷移

```
Created → Funded → Released
                 → Refunded
```
