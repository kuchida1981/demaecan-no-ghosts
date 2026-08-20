## Context

現状READMEが存在しない。プロジェクトの情報源は`package.json`（説明文・リポジトリURL）、`src/header.ts`（ユーザースクリプトのメタデータ・インストールURL）、`.github/workflows/deploy.yml`（stable/unstableブランチへのビルド成果物配布の仕組み）に分散している。

## Goals / Non-Goals

**Goals:**
- 初めて訪れた人が「これが何か」「どうインストールするか」を数分で理解できる。
- 日本語・英語のどちらの話者にも対応する。

**Non-Goals:**
- 詳細な開発ガイド（コントリビューションガイドライン、アーキテクチャ解説等）を書くこと。必要になれば別途`CONTRIBUTING.md`等で対応する。
- スクリーンショットや画像の作成（テキストのみで完結させる）。

## Decisions

### 1. `README.md`（英語）と`README.ja.md`（日本語）を独立したファイルとして用意し、冒頭で相互リンクする

GitHubは`README.md`をリポジトリトップページに自動表示するため、`README.md`を英語のデフォルトとし、冒頭に「日本語版はこちら」的なリンクを置く。`README.ja.md`側も冒頭に英語版へのリンクを置く。

- **却下した代替案: 1ファイルに英語・日本語を両方書く（言語ごとにセクションを分ける）**
  Issue本文で明示的に「README.ja.md（日本語）、README.md（英語）それぞれで用意してほしい」と2ファイルでの用意が指定されているため、この案は採用しない。

### 2. インストールURLは`src/header.ts`のstable向けURLをそのまま案内する

```
https://raw.githubusercontent.com/kuchida1981/demaecan-no-ghosts/stable/demaecan-no-ghosts.user.js
```

`deploy.yml`により、タグ付けされたリリースで`stable`ブランチにビルド成果物が配布される仕組みになっている。このURLをTampermonkeyに登録すればインストール・自動更新される。開発版を試したい人向けに`unstable`ブランチのURLも補足で載せる。

### 3. 開発者向けセクションには`package.json`の実際のnpm scriptsをそのまま記載する

`npm test`（vitest + coverage）、`npm run lint`、`npm run check-types`、`npm run build`の4つ。記載内容がコマンド追加・変更で陳腐化しないよう、`package.json`の`scripts`をそのまま反映する形にする。

## Risks / Trade-offs

- [Risk] READMEの内容が将来のコマンド変更・機能追加で陳腐化する → 今回のスコープでは許容し、次に大きな機能追加をする際に合わせて見直す運用とする。
