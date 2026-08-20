## Why

店舗一覧の店舗カードは、カード内のどこにマウスオーバーしても詳細ポップオーバーが開く実装になっている。カードのほぼ全域でポップオーバーが出てしまうため、写真・店名など店舗カード自体がほとんど常に隠れてしまい、一覧が見づらい（GitHub Issue #3）。

なお`openspec/specs/shop-detail-overlay/spec.md`の「Hover reveals popover on pointer devices」シナリオ自体は元々「情報アイコンにカーソルを移動したとき」と記述されており、今回の不具合は実装がこのシナリオ通りになっていなかったことによるもの。要件レベルの正規文（Requirement本文）は対象要素を明示していなかったため、あわせて明確化する。

## What Changes

- ホバー対応デバイスでのポップオーバー開閉トリガーを、店舗カード全体から情報アイコン単体に変更する。
  - `src/managers/CardOverlayManager.ts`の`_wireEvents`内で`card`要素に貼られている`mouseenter`/`mouseleave`リスナーを、`icon`要素に貼り替える。
- クリック/タップでの開閉挙動（アイコンクリックでトグル）、カード外クリックで閉じる挙動は変更しない。

## Capabilities

### New Capabilities
(なし)

### Modified Capabilities
- `shop-detail-overlay`: 「Detail popover reveal」要件の本文に、ホバーによる表示は情報アイコンへのホバーに限られ、カードの他の部分へのホバーでは開かないことを明記する。

## Impact

- `src/managers/CardOverlayManager.ts`: `_wireEvents`のホバーリスナーの貼り付け先変更のみ。
- `src/managers/CardOverlayManager.test.ts`: 既存の「カードへのhoverで開閉する」テストを、カードの他の部分へのhoverでは開かないことを検証するテストに更新・追加する。
