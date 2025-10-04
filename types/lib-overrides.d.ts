/**
 * Library Type Overrides
 * Provides type fixes for third-party libraries and DOM compatibility for React Native
 */

declare module "react-native" {
  export interface TextProps {
    displayName?: string;
  }
}

// DOM compatibility for React Native to fix package compilation errors
declare global {
  // Polyfill DOM APIs that don't exist in React Native
  const window: any;
  const document: any;

  interface Navigator {
    userAgent: string;
    product?: string;
  }

  interface FileList extends Array<File> {
    item(index: number): File | null;
    length: number;
  }

  interface File {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  }

  interface Storage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
    readonly length: number;
    key(index: number): string | null;
  }
}

export {};
