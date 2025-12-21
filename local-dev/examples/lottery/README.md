# Lottery dApp Example

シンプルな抽選 dApp の例です。

## 使用方法

```bash
pnpm install
pnpm run build
pnpm run deploy

pnpm run run enter                  # 抽選に参加
pnpm run run close_entry            # 参加を締め切る
pnpm run run draw                   # 抽選を実行
pnpm run run get_participant_count  # 参加者数を取得
pnpm run run get_winner             # 当選番号を取得
pnpm run run is_drawn               # 抽選が完了したか確認
```

## コントラクト

- `enter()` - 抽選に参加
- `close_entry()` - 参加を締め切る
- `draw()` - 抽選を実行
- `get_participant_count()` - 参加者数
- `get_winner()` - 当選番号
- `is_drawn()` - 抽選完了フラグ
