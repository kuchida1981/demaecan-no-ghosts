import { describe, it, expect, beforeEach } from 'vitest';
import { setupGMStorageMock } from '../test/mocks/gm_storage';
import { Store } from '../store';
import { JudgmentManager } from './JudgmentManager';

describe('JudgmentManager', () => {
  let store: Store;
  let manager: JudgmentManager;

  beforeEach(() => {
    setupGMStorageMock();
    store = new Store();
    manager = new JudgmentManager(store);
  });

  describe('badge', () => {
    it('starts hidden for an unjudged shop', () => {
      const badge = manager.mountBadge('123');
      expect(badge.style.display).toBe('none');
      expect(badge.textContent).toBe('');
    });

    it('shows the ghost badge after judging as ghost', () => {
      const badge = manager.mountBadge('123');
      manager.judge('123', 'ghost');

      expect(badge.style.display).toBe('');
      expect(badge.textContent).toBe('ゴースト');
      expect(badge.classList.contains('ghosts-badge--ghost')).toBe(true);
    });

    it('shows the not-ghost badge after judging as not-ghost', () => {
      const badge = manager.mountBadge('123');
      manager.judge('123', 'not-ghost');

      expect(badge.textContent).toBe('実店舗');
      expect(badge.classList.contains('ghosts-badge--not-ghost')).toBe(true);
    });

    it('hides the badge again after clearing the judgment', () => {
      const badge = manager.mountBadge('123');
      manager.judge('123', 'ghost');
      manager.clearJudgment('123');

      expect(badge.style.display).toBe('none');
    });

    it('updates every mounted badge for the same shop', () => {
      const badgeA = manager.mountBadge('123');
      const badgeB = manager.mountBadge('123');

      manager.judge('123', 'ghost');

      expect(badgeA.textContent).toBe('ゴースト');
      expect(badgeB.textContent).toBe('ゴースト');
    });
  });

  describe('controls', () => {
    it('marks the ghost button active after clicking it', () => {
      const controls = manager.createControls('123');
      const ghostBtn = controls.querySelector<HTMLButtonElement>('.ghosts-judge-btn--ghost')!;
      const notGhostBtn = controls.querySelector<HTMLButtonElement>('.ghosts-judge-btn--not-ghost')!;

      ghostBtn.click();

      expect(ghostBtn.classList.contains('is-active')).toBe(true);
      expect(ghostBtn.getAttribute('aria-pressed')).toBe('true');
      expect(notGhostBtn.classList.contains('is-active')).toBe(false);
      expect(store.getShopRecord('123')?.judgment).toBe('ghost');
    });

    it('switches active state when clicking not-ghost after ghost', () => {
      const controls = manager.createControls('123');
      const ghostBtn = controls.querySelector<HTMLButtonElement>('.ghosts-judge-btn--ghost')!;
      const notGhostBtn = controls.querySelector<HTMLButtonElement>('.ghosts-judge-btn--not-ghost')!;

      ghostBtn.click();
      notGhostBtn.click();

      expect(ghostBtn.classList.contains('is-active')).toBe(false);
      expect(notGhostBtn.classList.contains('is-active')).toBe(true);
      expect(store.getShopRecord('123')?.judgment).toBe('not-ghost');
    });

    it('clears the judgment and active state when clicking clear', () => {
      const controls = manager.createControls('123');
      const ghostBtn = controls.querySelector<HTMLButtonElement>('.ghosts-judge-btn--ghost')!;
      const clearBtn = controls.querySelector<HTMLButtonElement>('.ghosts-judge-btn--clear')!;

      ghostBtn.click();
      clearBtn.click();

      expect(ghostBtn.classList.contains('is-active')).toBe(false);
      expect(store.getShopRecord('123')).toBeUndefined();
    });

    it('keeps badges and controls for the same shop in sync', () => {
      const badge = manager.mountBadge('123');
      const controls = manager.createControls('123');
      const ghostBtn = controls.querySelector<HTMLButtonElement>('.ghosts-judge-btn--ghost')!;

      ghostBtn.click();

      expect(badge.textContent).toBe('ゴースト');
    });
  });
});
