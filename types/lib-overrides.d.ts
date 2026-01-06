/**
 * Library Type Overrides
 * Provides type fixes for third-party libraries and DOM compatibility for React Native
 */

declare module "react-native" {
  export interface TextProps {
    displayName?: string;
  }
}

// Expo File System type overrides for missing exports
declare module "expo-file-system" {
  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;

  export enum EncodingType {
    UTF8 = "utf8",
    Base64 = "base64",
  }

  export * from "expo-file-system/build/index";
}

// DOM compatibility for React Native to fix package compilation errors
declare global {
  // Polyfill DOM APIs that don't exist in React Native
  var window: any;
  var document: any;

  // Extend existing File interface for React Native
  interface File {
    arrayBuffer?(): Promise<ArrayBuffer>;
  }

  // Extend existing Crypto interface for React Native
  interface Crypto {
    getRandomValues<T extends ArrayBufferView | null>(array: T): T;
  }

  // Buffer polyfill for React Native
  interface BufferConstructor {
    from(data: string | ArrayBuffer | Uint8Array, encoding?: string): Buffer;
  }

  interface Buffer extends Uint8Array {
    toString(encoding?: string): string;
  }

  var Buffer: BufferConstructor;
  var crypto: Crypto;
}

export {};
