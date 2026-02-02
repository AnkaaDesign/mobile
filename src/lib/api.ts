/**
 * API Client Export
 *
 * Re-exports the apiClient from api-client/axiosClient for easier access
 * throughout the application.
 */

import { apiClient } from '@/api-client/axiosClient';

// Export as default for compatibility with existing code
export default apiClient;

// Also export as named export for flexibility
export { apiClient };

// Re-export useful types
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiPaginatedResponse,
} from '@/api-client/axiosClient';