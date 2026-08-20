## Context

出前館（demae-can.com）はNext.js + Tailwindでビルドされた本番サイトで、意味を持つCSSクラス名は存在しない（`class="absolute -right-2 -top-2 ..."`のようなユーティリティの羅列のみ）。そのため実装は「安定したクラス名」ではなく、以下の構造的フックに依存する。実際に取得した4種類のHTML（トップページ、カテゴリページ、店舗ページ、店舗詳細ページ）を調査して確認済み。

- 店舗カード: `<article aria-labelledby="shoplist-{shopId}-shopname" aria-describedby="shoplist-{shopId}-rating shoplist-{shopId}-waittime" ...>`。トップページで115件、カテゴリページで82件ヒットし、両ページで共通コンポーネント。カード内リンクは`href="/shop/menu/{shopId}"`。
- 住所は店舗カードのHTML・`__NEXT_DATA__`のApolloキャッシュのどこにも含まれない（確認済み: 一覧ページのApolloキャッシュに店舗一覧のエントリ自体が存在しない）。住所を得るには`/shopDetail/{shopId}`への追加リクエストが必須。
- `/shopDetail/{shopId}`のレスポンスは`<section><h2>住所</h2><div><p>{住所}</p></div></section>`という「ラベル(h2テキスト)＋値」のパターン。同じパターンで営業時間・定休日も並ぶ。blockCodeなしの`/shopDetail/{shopId}`でもページは解決する（店舗ページ内の「店舗詳細」リンクの遷移先がこの形）。
- 店舗ページ（`/shop/menu/{shopId}`）はh1が店舗名そのもの。
- 一覧ページには「もっと見る」ボタンがあり、クリックでページ遷移せず店舗カードが追記される（`aria-posinset`が連番で増えていくことを確認）。初期DOM走査だけでは新規カードを取りこぼす。

参考プロジェクトの`comic-viewer-helper`（Tampermonkey用スクリプト、TypeScript+Vite+Vitest、App/Store/Manager/Adapter構成、`GM_getValue`/`GM_setValue`でのStore永続化）をベース構成として踏襲する。

## Goals / Non-Goals

**Goals:**
- `openspec/specs/`配下3capability（`shop-detail-overlay`, `ghost-shop-judgment`, `ghost-shop-filter`）で定義した要件を満たすTampermonkeyユーザースクリプトを実装できる技術方針を定める。
- comic-viewer-helperと同様の保守しやすいモジュール構成（Store/Manager/Adapter分離、ロジックとDOM操作の分離）を踏襲する。
- サイトの頻繁なマークアップ変更に対して、可能な限り壊れにくい（安定したaria属性・テキストベースのラベル検索に依存する）実装方針にする。

**Non-Goals:**
- ゴーストレストラン判定の自動化（画像解析・ルールベース判定等）は行わない。判定は常にユーザーの手動操作。
- 出前館以外のサイト・ドメインへの対応。
- 判定データのクラウド同期・複数端末間共有の独自実装（Tampermonkey自体の同期機能に委ねる）。
- `/shopDetail/{shopId}`以外のAPI（GraphQL等の内部APIを直接叩く方式）の採用。HTMLレスポンスをDOMParserでパースする方式のみを採用する（後述Decisionsで理由を記載）。

## Decisions

### D1: 店舗カードの検出は`article[aria-labelledby^="shoplist-"]`をルートに、MutationObserverで継続監視する
Tailwindのユーティリティクラスはビルドごとに変わりうるため使用しない。`aria-labelledby`/`aria-describedby`の`shoplist-{shopId}-*`パターンはアクセシビリティ目的の属性でありUI変更の影響を受けにくいと判断。加えて「もっと見る」でカードが動的追加されるため、一覧コンテナに対して`MutationObserver`を設置し、追加された`article`要素にも同じ処理（アイコン注入・バッジ適用・フィルタ適用）を行う。shopIdは`article`の`aria-labelledby`属性値（`shoplist-(\d+)-shopname`）または内部の`href="/shop/menu/(\d+)"`から抽出する。

代替案: `IntersectionObserver`でビューポート内カードのみ処理する案も検討したが、アイコン注入自体は軽量なDOM操作でありコストが低いため、シンプルさを優先し全カード即時処理とする。

### D2: 住所取得は`/shopDetail/{shopId}`のHTMLを`fetch`し、`DOMParser`でラベルテキスト（`h2`が"住所"）を起点に値を抽出する
同一オリジンのため`fetch()`で追加のCORS対応なしに取得できる。GraphQL等の内部APIを直接叩く方式は応答が軽量になる利点があるが、エンドポイント名・クエリ構造がドキュメント化されておらず、静的HTMLダンプの調査だけでは実在も安定性も確認できないため今回は採用しない。HTML解析のほうが「実際にブラウザに表示される内容をそのまま解釈する」ため、内部API仕様変更に対しても比較的追従しやすいと判断した。

住所抽出は`h2`のテキストが完全一致で「住所」であるものを探し、その直後の兄弟要素内の`p`テキストを値とする（クラス名に依存しない）。同じ関数で「営業時間」「定休日」も将来的に拡張可能な設計にする（今回のスコープでは住所のみ利用）。

### D3: 永続化は`GM_setValue`/`GM_getValue`を使用し、`shopId`をキーとしたレコードで判定と住所キャッシュを1つのStoreにまとめる
localStorageはdemae-can.com自身のNext.jsアプリと同一オリジン内の名前空間を共有するため、キー衝突やサイト側のクリア処理に巻き込まれるリスクがある。IndexedDBは非同期・スキーマ管理のコストに見合うほどのデータ量（ユーザーが実際にhoverした店舗のみ蓄積、数百〜数千件規模を想定）ではない。`GM_setValue`はcomic-viewer-helperの`Store`実装と同じパターンであり、Tampermonkeyのデバイス間同期機能の恩恵も受けられる。

データ構造（概念レベル、実装時にTypeScript型として定義）:
```
Record<ShopId, {
  address?: string
  addressFetchedAt?: number  // epoch ms
  judgment?: 'ghost' | 'not-ghost'
  judgedAt?: number
}>
```
判定(`judgment`)と住所キャッシュ(`address`)は同じレコードにまとめるが、意味的に独立して更新される（住所再取得は`judgment`を変更しない、判定変更は`address`を変更しない）。

### D4: アドレス取得はオンデマンド＋永続キャッシュを基本とし、手動再取得の手段を必ず用意する
ポップオーバーを開いた時点でキャッシュが無ければfetchし、以後はキャッシュを使う（プリフェッチはしない＝一覧に表示された全店舗を先読みしない）。ユーザーとの合意により、キャッシュがある場合でも明示的な再取得アクション（ボタン）を常に提供し、店舗情報が変わった場合や取得失敗時にユーザー自身が再取得できるようにする。TTLによる自動失効は行わない（住所は基本的に変わらないため）。

### D5: バッジは`ghost`/`not-ghost`の両方を表示する
ユーザーとの合意により、非表示フィルタの対象である`ghost`だけでなく、調査済みで「実店舗と確認できた」`not-ghost`にも視覚的バッジを表示する。これにより一覧を流し見するだけで「調べ済みかどうか」が分かり、同じ店舗を何度も調べ直す手間を減らす。未判定の店舗にはバッジを出さない（3値: unknown/ghost/not-ghost、unknownはStoreにレコードが存在しない状態で表現する）。

### D6: フィルタは`ghost`判定済みのみを非表示にし、`unknown`は非表示にしない
ユーザーとの合意により、誤って未調査の店舗を隠してしまうリスクを避けるため、フィルタの対象は明示的に`ghost`と判定された店舗のみとする。フィルタのON/OFF状態自体も`GM_setValue`で永続化し、ページ再読み込み後も維持する。

### D7: モジュール構成はcomic-viewer-helperのApp/Store/Manager/Adapter構成を踏襲する
```
App                     ... エントリポイント、ページ種別（一覧/店舗ページ）判定
Store                   ... GM_setValue/GM_getValueラップ、shopIdキーのレコード管理
Adapter                 ... 一覧ページAdapter / 店舗ページAdapter（DOM抽出をカプセル化）
ShopDetailFetcher       ... /shopDetail/{shopId}のfetch・パース・キャッシュ制御
CardOverlayManager      ... カードへのアイコン注入・ポップオーバー表示・MutationObserver監視
JudgmentManager         ... 判定の読み書き、バッジ描画トリガー
FilterManager           ... フィルタトグルUIと表示/非表示の適用
```
`src/logic.ts`相当（DOM非依存の純粋関数、住所テキスト抽出・URL生成・shopId抽出など）とDOM操作を分離し、ユニットテストしやすくする方針もcomic-viewer-helperを踏襲する。

## Risks / Trade-offs

- [Risk] サイトのマークアップ変更で`aria-labelledby="shoplist-*"`や`h2`テキストラベルのパターンが変わると機能が壊れる → Mitigation: DOM抽出ロジックを`logic.ts`相当に集約し、抽出失敗時はエラー状態を表示するのみでページ全体は壊さない設計にする（`shop-detail-overlay`のFetch failure handling要件で担保）。
- [Risk] `/shopDetail/{shopId}`への追加fetchはサーバーへの負荷になりうる → Mitigation: オンデマンド実行＋永続キャッシュにより、同一ユーザーが同じ店舗を繰り返し閲覧しても再リクエストしない（D4）。プリフェッチは行わない。
- [Risk] GM_setValueに保存するJSONオブジェクトが将来的に肥大化する → Mitigation: 現状の想定データ量（ユーザーが実際に調べた店舗のみ）では問題にならないと判断。肥大化が顕在化した場合はキーを分割する等の対応を別途検討する（本changeのスコープ外）。
- [Risk] Tampermonkeyのサンドボックス環境によっては素の`fetch`がCSPやサイトのService Worker干渉を受ける可能性がある → Mitigation: 実装時に`fetch`が機能しない場合は`GM_xmlhttpRequest`（`@grant GM_xmlhttpRequest`）へのフォールバックを検討する。どちらを採用するかはtasks段階の実装検証で確定する。

## Open Questions

- アイコンの具体的な視覚デザイン・カード内の配置位置（left/right, top/bottom）は未確定。実装時に実際のカードレイアウト（モバイル: 横並び, デスクトップ: 縦並び）を見ながら既存の重なり要素（お気に入りボタン、価格バッジ等）と衝突しない位置を決める。
- `fetch` vs `GM_xmlhttpRequest`の最終選択は実装時の動作確認（D5のRisk参照）で確定する。
