// Global type declarations for React Native internals

/**
 * localStorage polyfill for React Native.
 * This is provided by src/lib/localStorage-polyfill.ts which uses AsyncStorage
 * with an in-memory cache for synchronous access.
 */
declare var localStorage: Storage;

/**
 * ErrorUtils is a React Native internal for global error handling.
 * It's not officially documented but is used to intercept JavaScript errors
 * before they trigger the red screen.
 */
declare const ErrorUtils: {
  setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void;
  getGlobalHandler: () => ((error: Error, isFatal: boolean) => void) | null;
  reportError: (error: Error) => void;
  reportFatalError: (error: Error) => void;
};

// Ensure __DEV__ is recognized
declare const __DEV__: boolean;

/**
 * EventSource is a web API for server-sent events (SSE).
 * This type definition provides TypeScript support for EventSource in React Native.
 * Note: Requires a polyfill like 'react-native-sse' or 'eventsource-polyfill' to work.
 */
declare class EventSource {
  constructor(url: string, eventSourceInitDict?: EventSourceInit);
  readonly url: string;
  readonly readyState: number;
  readonly withCredentials: boolean;
  onopen: ((this: EventSource, ev: Event) => any) | null;
  onmessage: ((this: EventSource, ev: MessageEvent) => any) | null;
  onerror: ((this: EventSource, ev: Event) => any) | null;
  close(): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  static readonly CONNECTING: number;
  static readonly OPEN: number;
  static readonly CLOSED: number;
}

interface EventSourceInit {
  withCredentials?: boolean;
}

interface MessageEvent extends Event {
  data: any;
  origin: string;
  lastEventId: string;
}
