import { vi, expect } from 'vitest';
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage with actual storage
const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }),
  get length() { return Object.keys(localStorageStore).length; },
  key: vi.fn((index: number) => Object.keys(localStorageStore)[index] || null),
};
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
});

// Mock navigator.geolocation
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
  },
});

// Mock Notification
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  },
});

// Mock serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    ready: Promise.resolve({
      pushManager: {
        subscribe: vi.fn().mockResolvedValue({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: {
            p256dh: 'test',
            auth: 'test',
          },
          toJSON: function() {
            return {
              endpoint: this.endpoint,
              keys: this.keys,
            };
          },
        }),
      },
    }),
    register: vi.fn().mockResolvedValue({}),
  },
});

// Mock PushManager
Object.defineProperty(window, 'PushManager', {
  writable: true,
  value: class PushManager {
    static supportedContentEncodings = ['aes128gcm', 'aesgcm'];
    subscribe() {
      return Promise.resolve({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' },
        toJSON() { return { endpoint: this.endpoint, keys: this.keys }; },
      });
    }
  },
});

// Mock fetch
global.fetch = vi.fn();

// Suppress console.error in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});