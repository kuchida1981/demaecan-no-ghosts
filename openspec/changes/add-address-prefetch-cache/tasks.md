## 1. Store: 型・永続化の拡張

- [ ] 1.1 `ShopRecord`（`src/types.ts`）に `name?: string` を追加する
- [ ] 1.2 `STORAGE_KEYS`（`src/store.ts`）に `ADDRESS_PREFETCH_ENABLED` を追加し、`Store` にデフォルト値 `true` で読み込む処理を追加する
- [ ] 1.3 `Store` に先読み有効フラグを切り替えるメソッド（例: `setAddressPrefetchEnabled(enabled: boolean)`）を追加し、`GM_setValue` に永続化する
- [ ] 1.4 `Store` の `GM_setValue` 書き込み（`_setShopRecords` など）を、メモリ上の `this.state` は即時更新しつつ実際の `GM_setValue` 呼び出しは 800ms debounce するよう変更する
- [ ] 1.5 `beforeunload` / `pagehide` で保留中の debounce 書き込みを強制 flush する処理を追加する
- [ ] 1.6 `Store` のdebounce・flush挙動に対するユニットテストを追加する（連続更新が1回の書き込みにまとまること、flushで即時書き込みされること）

## 2. 住所正規化とグルーピング

- [ ] 2.1 `normalizeAddress(raw: string): string`（NFKC正規化 + 前後trim + 連続空白の圧縮）を `src/logic.ts` に追加する
- [ ] 2.2 `Store` に、指定した正規化済み住所に一致する shopId 一覧を返すメソッド（例: `getShopIdsByNormalizedAddress`）を追加する（`shopRecords` を都度線形走査する単純な実装）
- [ ] 2.3 `normalizeAddress` のユニットテストを追加する（全角→半角、空白trim/圧縮）
- [ ] 2.4 `getShopIdsByNormalizedAddress` のユニットテストを追加する（同一正規化キーの複数shopIdが返る、住所未取得のshopIdは含まれない）

## 3. 店舗名のキャッシュ

- [ ] 3.1 `CardOverlayManager.decorateCard`（`src/managers/CardOverlayManager.ts`）で、shopId確定後に `Store.getShopRecord(shopId)?.name` が未設定の場合のみ、DOM抽出した店舗名を `Store` に保存するよう変更する
- [ ] 3.2 既にキャッシュ済みの場合は上書きしないことを確認するユニットテストを追加する

## 4. 先読みキュー（PrefetchQueue）

- [ ] 4.1 新規クラス `PrefetchQueue` を実装する（`enqueue(shopId)`：キュー内・処理中・キャッシュ済みのいずれかであれば無視して投入をスキップ）
- [ ] 4.2 同時実行数の上限（2）とジョブ完了後のインターバル（400ms）を守るワーカーループを実装する。値は1箇所の定数にまとめる
- [ ] 4.3 `PrefetchQueue` が `Store.subscribe` で先読み有効フラグの変化を監視し、OFF→ONでワーカーを起動、ON→OFFでワーカーを一時停止する（キューの中身は破棄しない）ようにする
- [ ] 4.4 ワーカーは `ShopDetailFetcher.getAddress(shopId)` を呼び、成否に関わらず（失敗時も）次のジョブへ進むようにする
- [ ] 4.5 `PrefetchQueue` のユニットテストを追加する（重複投入の排除、キャッシュ済み除外、同時実行数の上限、インターバル、フラグOFF時に処理が進まないこと、フラグONへの遷移で再開すること）

## 5. 配線

- [ ] 5.1 `CardOverlayManager.decorateCard` で、カード検出時に `PrefetchQueue.enqueue(shopId)` を呼ぶよう変更する
- [ ] 5.2 `src/main.ts` で `PrefetchQueue` をインスタンス化し、`Store` / `ShopDetailFetcher` / `CardOverlayManager` と配線する

## 6. 検証

- [ ] 6.1 `npm run test` を実行し、既存テストを含めて全て通ることを確認する
- [ ] 6.2 lint・型チェック（`npm run lint` 等、リポジトリのスクリプトに従う）を実行する
