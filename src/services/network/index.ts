/**
 * Network Service Exports
 *
 * This module exports the NetworkService for managing network connectivity
 * and automatic API URL switching between online/offline modes.
 */

export {
  default as NetworkService,
  getNetworkService,
} from './NetworkService';

export type {
  NetworkMode,
  NetworkStateListener,
  NetworkServiceState,
} from './NetworkService';
