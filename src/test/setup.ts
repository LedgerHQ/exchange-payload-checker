import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

if (typeof window !== "undefined") {
  // jsdom installs its own Uint8Array, which Node's Buffer and TextEncoder do not extend.
  globalThis.Uint8Array = Object.getPrototypeOf(Buffer.prototype).constructor;

  // jsdom lacks browser APIs that Lumen components use.
  window.matchMedia ??= (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
