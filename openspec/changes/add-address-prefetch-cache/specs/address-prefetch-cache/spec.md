## ADDED Requirements

### Requirement: Gentle prefetch queue triggered by card detection
The system SHALL maintain a prefetch queue that receives a shop's `shopId` whenever a shop-listing card for that shop is detected (initial render or dynamically loaded cards), except when a cached address for that `shopId` already exists. The queue SHALL process queued shop IDs by requesting `/shopDetail/{shopId}` (the same address resolution used by on-demand lookups) with a bounded number of concurrent requests and a minimum interval between the start of consecutive requests, so that a shop-listing page with many cards does not issue a burst of simultaneous requests to demae-can.com.

#### Scenario: Newly detected cards are enqueued
- **WHEN** a shop-listing card is detected (on initial render or after a load-more action) for a shopId with no cached address
- **THEN** that shopId is added to the prefetch queue

#### Scenario: Already-cached shops are not enqueued
- **WHEN** a shop-listing card is detected for a shopId that already has a cached address in the store
- **THEN** that shopId is not added to the prefetch queue and no request is made for it

#### Scenario: Concurrent requests stay within the limit
- **WHEN** the prefetch queue has more queued shop IDs than the configured concurrency limit
- **THEN** no more than the configured limit of `/shopDetail/{shopId}` requests are in flight at the same time

#### Scenario: Requests are spaced out
- **WHEN** the prefetch queue completes one request and starts the next
- **THEN** at least the configured minimum interval elapses between the two requests starting

#### Scenario: A resolved prefetch is cached the same way as an on-demand fetch
- **WHEN** the prefetch queue successfully resolves an address for a shopId
- **THEN** the result is stored in the same persistent cache used by on-demand address fetches, so a later popover open or panel mount for that shopId reuses it without a new request

### Requirement: Prefetching is gated by an enable flag
The system SHALL persist a boolean "address prefetch enabled" flag (defaulting to enabled) and SHALL only allow the prefetch queue's worker to issue requests while this flag is enabled. Enqueueing (adding shop IDs to the queue as cards are detected) SHALL happen regardless of the flag's state, so that queued-but-unprocessed shop IDs are still processed once the flag becomes enabled.

#### Scenario: Prefetching pauses while the flag is disabled
- **WHEN** the address prefetch enabled flag is disabled
- **THEN** the prefetch queue's worker does not issue any new `/shopDetail/{shopId}` requests, even if shop IDs are queued

#### Scenario: Enqueueing continues while disabled
- **WHEN** the address prefetch enabled flag is disabled and a new shop-listing card is detected for an uncached shopId
- **THEN** that shopId is still added to the prefetch queue

#### Scenario: Prefetching resumes when the flag becomes enabled
- **WHEN** the address prefetch enabled flag transitions from disabled to enabled
- **THEN** the prefetch queue's worker resumes processing any shop IDs already in the queue, subject to the concurrency and interval limits

### Requirement: Shop name caching
The system SHALL cache a shop's display name, extracted from the shop-listing card DOM, in the same persistent shop record used for its address. The system SHALL only write the name into the cache the first time it is observed for a given shopId; if a cached name already exists, subsequent detections of that shop's card SHALL NOT overwrite it.

#### Scenario: First detection caches the name
- **WHEN** a shop-listing card is detected for a shopId with no cached name
- **THEN** the shop's name, extracted from the card, is stored in the persistent cache for that shopId

#### Scenario: Subsequent detections do not overwrite a cached name
- **WHEN** a shop-listing card is detected for a shopId that already has a cached name
- **THEN** the cached name is left unchanged, even if the name extracted from the current card's DOM differs

### Requirement: Address normalization utility
The system SHALL provide a function that normalizes a raw address string using Unicode NFKC normalization plus whitespace trimming and collapsing of consecutive whitespace into a single space, without attempting to separate a building name or truncate to a house-number level. This normalized form SHALL be used as the grouping key for identifying shops sharing the same address.

#### Scenario: Full-width characters are normalized
- **WHEN** a raw address contains full-width digits or symbols
- **THEN** the normalized address contains the equivalent half-width characters

#### Scenario: Whitespace is trimmed and collapsed
- **WHEN** a raw address has leading/trailing whitespace or multiple consecutive whitespace characters (including full-width spaces) between parts
- **THEN** the normalized address has no leading/trailing whitespace and each run of whitespace is collapsed to a single half-width space

### Requirement: Lookup of shops sharing a normalized address
The system SHALL provide a way to retrieve the list of cached shopIds whose normalized address matches a given normalized address, computed from the currently cached shop records.

#### Scenario: Multiple cached shops with the same normalized address are grouped
- **WHEN** two or more cached shop records have raw addresses that normalize to the same value
- **THEN** looking up that normalized address returns all of their shopIds

#### Scenario: A shop with no cached address is excluded from lookups
- **WHEN** a cached shop record has no address yet
- **THEN** that shopId is not returned by any normalized-address lookup

### Requirement: Debounced persistence of shop records
The system SHALL apply in-memory updates to shop records (address, name, judgment) immediately, but SHALL debounce the underlying persistent storage write so that multiple updates occurring within a short window result in a single write. The system SHALL also flush any pending write when the page is being unloaded, so a debounced update is not silently lost on navigation away from the page.

#### Scenario: In-memory state reflects updates immediately
- **WHEN** a shop record is updated (e.g. by a prefetch resolving an address)
- **THEN** subsequent reads of that shop record (e.g. from the same page's cache checks) reflect the update immediately, without waiting for the debounce window

#### Scenario: Rapid successive updates result in one persisted write
- **WHEN** multiple shop records are updated in quick succession, within less than the debounce window of each other
- **THEN** only one write to persistent storage occurs after the updates settle, containing all of the updates

#### Scenario: Pending writes are flushed on page unload
- **WHEN** the page is unloaded while a debounced write is still pending
- **THEN** the pending write is flushed to persistent storage before unload completes
