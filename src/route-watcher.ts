const LOCATIONCHANGE_EVENT = 'ghosts-locationchange';
const POLL_INTERVAL_MS = 1000;

let historyPatched = false;

function patchHistory(): void {
  if (historyPatched) return;
  historyPatched = true;

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = ((...args: Parameters<History['pushState']>) => {
    originalPushState(...args);
    window.dispatchEvent(new Event(LOCATIONCHANGE_EVENT));
  }) as History['pushState'];

  history.replaceState = ((...args: Parameters<History['replaceState']>) => {
    originalReplaceState(...args);
    window.dispatchEvent(new Event(LOCATIONCHANGE_EVENT));
  }) as History['replaceState'];
}

/**
 * Invokes `callback` with the new URL whenever the page navigates via
 * client-side routing (SPA), without requiring a full page reload.
 *
 * Detection combines a patched `history.pushState`/`replaceState` and
 * `popstate` (fires almost immediately) with a low-frequency polling
 * fallback (safety net for navigation not covered by the patch).
 *
 * Returns an unsubscribe function that stops watching.
 */
export function onRouteChange(callback: (url: string) => void): () => void {
  patchHistory();

  let lastUrl = window.location.href;
  const checkForChange = (): void => {
    const currentUrl = window.location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;
    callback(currentUrl);
  };

  window.addEventListener(LOCATIONCHANGE_EVENT, checkForChange);
  window.addEventListener('popstate', checkForChange);
  const intervalId = setInterval(checkForChange, POLL_INTERVAL_MS);

  return () => {
    window.removeEventListener(LOCATIONCHANGE_EVENT, checkForChange);
    window.removeEventListener('popstate', checkForChange);
    clearInterval(intervalId);
  };
}
