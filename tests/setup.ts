import "@testing-library/jest-dom/vitest";

// jsdom lacks crypto.randomUUID in some node versions; polyfill for determinism.
if (typeof globalThis.crypto === "undefined" || typeof globalThis.crypto.randomUUID !== "function") {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        return arr;
      },
      randomUUID: () => `test-${Math.random().toString(36).slice(2)}`,
    },
  });
}
