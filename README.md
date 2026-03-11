# メモリ厳選ツール

学園アイドルマスターの「あさり先生のプロデュースゼミ」で作りたいメモリー候補を絞り込み、同じ開催回で一緒に拾える `R` カードを確認するための静的サイトです。

## できること

- `Game8` のスキルカード一覧からカード名、効果、プラン、レアリティ、画像を同期
- `学マスwiki` で確認した開催回ごとの特別出現カード、選出率上昇カードを反映
- 開催回を選び、欲しいメモリー候補を複数選択
- 結果を `選択済みカード + Rカード` のみに絞って表示
- カード画像中心の UI で、タップ時に名前・効果・出現区分を詳細表示

## セットアップ

```bash
npm install
npm run sync:data
npm run dev
```

## 主なコマンド

```bash
npm run sync:data
npm run test:run
npm run lint
npm run build
```

`npm run sync:data` は `src/data/*.json` と `public/assets/cards/*` を更新します。

## データの前提

- 対象はプロデュースメモリーのみ
- サポートカード由来のスキルカードはメモリー候補から除外
- コンテスト用メモリー、ステージメモリーは扱わない
- 育成前提は `S4 / SSS / SSS+`
- 固有カードはメモリー候補から除外
- 異なるプラン側は「その開催回で実際に出現する確認済みカード」のみ表示

## デプロイ

`.github/workflows/deploy.yml` で GitHub Pages にデプロイできます。  
`BASE_PATH` は GitHub リポジトリ名から自動設定します。

1. GitHub に新しいリポジトリを作る
2. このディレクトリで `git remote add origin <your-repo-url>` を設定する
3. `main` ブランチを push する
4. GitHub の `Settings > Pages` で `Build and deployment` の `Source` を `GitHub Actions` にする
5. `Deploy Pages` workflow が走ると `https://<user>.github.io/<repo>/` に公開される

ローカルで GitHub Pages 用の出力を確認したい場合は次を実行します。

```bash
BASE_PATH=/<repo>/ npm run build
```
