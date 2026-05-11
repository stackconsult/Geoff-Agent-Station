import '@testing-library/jest-dom';

// Mock Tauri's invoke — tests run in jsdom, not Tauri webview
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// jsdom does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
