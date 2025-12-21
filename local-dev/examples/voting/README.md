# Voting dApp Example

シンプルな Yes/No 投票 dApp の例です。

## セットアップ

```bash
pnpm install
pnpm run build
```

## 使用方法

```bash
pnpm run deploy              # デプロイ

pnpm run run vote_yes        # Yes に投票
pnpm run run vote_no         # No に投票
pnpm run run close_voting    # 投票を締め切る
pnpm run run get_yes_votes   # Yes 票数を取得
pnpm run run get_no_votes    # No 票数を取得
pnpm run run get_total_votes # 総票数を取得
```

## コントラクト

`contract/voting.compact` のサーキット：

- `vote_yes()` - Yes に投票
- `vote_no()` - No に投票
- `close_voting()` - 投票を締め切る
- `get_yes_votes()` - Yes 票数を取得
- `get_no_votes()` - No 票数を取得
- `get_total_votes()` - 総票数を取得
