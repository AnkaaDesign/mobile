/**
 * React Native Type Extensions
 */

declare module "react-native" {
  // Add any React Native specific type extensions here
  export interface VoidOrUndefinedOnly {
    [UNDEFINED_VOID_ONLY]: never;
  }

  export const UNDEFINED_VOID_ONLY: unique symbol;
}

export {};
