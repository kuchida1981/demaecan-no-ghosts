import { vi } from 'vitest';

let _store: Record<string, string> = {};

export function setupGMStorageMock() {
  _store = {};

  vi.stubGlobal('GM_setValue', (name: string, value: string): void => {
    _store[name] = value;
  });

  vi.stubGlobal('GM_getValue', (name: string, defaultValue?: string): string | undefined => {
    return name in _store ? _store[name] : defaultValue;
  });

  vi.stubGlobal('GM_deleteValue', (name: string): void => {
    delete _store[name];
  });

  return _store;
}
