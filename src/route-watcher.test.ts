import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRouteChange } from './route-watcher';

function setUrl(path: string): void {
  window.history.pushState({}, '', path);
}

describe('onRouteChange', () => {
  let unsubscribe: (() => void) | null;

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    vi.useFakeTimers();
    unsubscribe = null;
  });

  afterEach(() => {
    unsubscribe?.();
    vi.useRealTimers();
  });

  it('invokes the callback with the new URL after pushState navigation', () => {
    const callback = vi.fn();
    unsubscribe = onRouteChange(callback);

    setUrl('/shop/menu/123');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(window.location.href);
    expect(window.location.pathname).toBe('/shop/menu/123');
  });

  it('invokes the callback with the new URL after replaceState navigation', () => {
    const callback = vi.fn();
    unsubscribe = onRouteChange(callback);

    window.history.replaceState({}, '', '/shop/menu/456');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe('/shop/menu/456');
  });

  it('invokes the callback on popstate navigation', () => {
    const callback = vi.fn();
    unsubscribe = onRouteChange(callback);

    // Simulate a browser back/forward: the URL changes first (as the
    // browser would do), then 'popstate' fires - without going through our
    // patched pushState/replaceState.
    window.location.hash = '#/shop/menu/999';
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('falls back to polling to detect URL changes not routed through pushState/replaceState/popstate', () => {
    const callback = vi.fn();
    unsubscribe = onRouteChange(callback);

    // A hash change updates window.location without going through
    // pushState/replaceState and without firing 'popstate'.
    window.location.hash = '#/shop/menu/789';

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/shop/menu/789');
  });

  it('does not invoke the callback when the URL has not changed', () => {
    const callback = vi.fn();
    unsubscribe = onRouteChange(callback);

    vi.advanceTimersByTime(5000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('stops invoking the callback after unsubscribing', () => {
    const callback = vi.fn();
    unsubscribe = onRouteChange(callback);
    unsubscribe();

    setUrl('/shop/menu/123');
    vi.advanceTimersByTime(5000);

    expect(callback).not.toHaveBeenCalled();
  });
});
