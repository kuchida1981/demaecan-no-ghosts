export const STYLE_ELEMENT_ID = 'demaecan-no-ghosts-style';

export const styles = `
  .ghosts-icon-btn {
    all: unset;
    position: absolute;
    top: 0.375rem;
    right: 0.375rem;
    z-index: 2147483000;
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 1.125rem;
    font-weight: 700;
    cursor: pointer;
    box-sizing: border-box;
  }
  .ghosts-icon-btn:hover,
  .ghosts-icon-btn:focus-visible {
    background: rgba(0, 0, 0, 0.8);
  }
  .ghosts-icon-btn--info {
    font-style: italic;
  }

  .ghosts-popover {
    display: none;
    position: absolute;
    top: 2.625rem;
    right: 0.375rem;
    z-index: 2147483000;
    width: 15rem;
    max-width: calc(100vw - 1.5rem);
    background: #fff;
    color: #111;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    padding: 0.625rem;
    font-size: 0.75rem;
    line-height: 1.4;
    text-align: left;
  }
  .ghosts-popover--open {
    display: block;
  }
  .ghosts-popover__shop-name {
    font-weight: 700;
    margin: 0 0 0.375rem;
  }
  .ghosts-popover__address {
    margin: 0 0 0.5rem;
    min-height: 1.4em;
  }
  .ghosts-popover__links {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .ghosts-popover__links a {
    color: #1a73e8;
    text-decoration: underline;
  }
  .ghosts-popover__refetch {
    all: unset;
    cursor: pointer;
    color: #1a73e8;
    text-decoration: underline;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
    display: inline-block;
  }
  .ghosts-popover__judgment {
    display: flex;
    gap: 0.375rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    padding-top: 0.5rem;
  }

  .ghosts-judge-btn {
    all: unset;
    cursor: pointer;
    box-sizing: border-box;
    flex: 1;
    text-align: center;
    padding: 0.25rem 0.375rem;
    border-radius: 0.25rem;
    border: 1px solid rgba(0, 0, 0, 0.2);
    font-size: 0.6875rem;
  }
  .ghosts-judge-btn--ghost.is-active {
    background: #da3734;
    color: #fff;
    border-color: #da3734;
  }
  .ghosts-judge-btn--not-ghost.is-active {
    background: #2e7d32;
    color: #fff;
    border-color: #2e7d32;
  }

  .ghosts-badge {
    position: absolute;
    top: 0.375rem;
    left: 0.375rem;
    z-index: 2147483000;
    padding: 0.0625rem 0.375rem;
    border-radius: 9999px;
    font-size: 0.625rem;
    font-weight: 700;
    color: #fff;
  }
  .ghosts-badge--ghost {
    background: #da3734;
  }
  .ghosts-badge--not-ghost {
    background: #2e7d32;
  }

  .ghosts-hidden {
    display: none !important;
  }

  .ghosts-filter-panel {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 2147483000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 0.75rem;
  }
  .ghosts-filter-panel label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    cursor: pointer;
  }

  .ghosts-shop-page-panel {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    z-index: 2147483000;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    width: 12rem;
    padding: 0.625rem;
    border-radius: 0.5rem;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 0.75rem;
  }
  .ghosts-shop-page-panel__title {
    margin: 0;
    font-weight: 700;
  }
  .ghosts-shop-page-panel .ghosts-badge {
    position: static;
    align-self: flex-start;
  }
`;

export function injectStyles(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = styles;
  document.head.appendChild(style);
}
