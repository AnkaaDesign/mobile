// packages/hooks/src/useUploadQueue.ts
// React hook for upload queue manager

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getUploadQueue,
  type QueuedUpload,
  type QueueStats,
  type QueueConfig,
} from '@/utils/upload-queue';

// Additional options specific to the hook
export type UseUploadQueueOptions = QueueConfig;

export function useUploadQueue(options: UseUploadQueueOptions = {}) {
  const queueManager = useMemo(() => getUploadQueue(options), []);
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [stats, setStats] = useState<QueueStats>(queueManager.getStats());
  const [isOnline, setIsOnline] = useState(queueManager.getIsOnline());
  const [isPaused, setIsPaused] = useState(queueManager.getIsPaused());
  const [isProcessing, setIsProcessing] = useState(queueManager.isProcessing());

  // Subscribe to queue changes
  useEffect(() => {
    const unsubscribe = queueManager.subscribe((updatedQueue) => {
      setQueue(updatedQueue);
      setStats(queueManager.getStats());
      setIsOnline(queueManager.getIsOnline());
      setIsPaused(queueManager.getIsPaused());
      setIsProcessing(queueManager.isProcessing());
    });

    // Initialize with current queue
    setQueue(queueManager.getQueue());
    setStats(queueManager.getStats());

    return unsubscribe;
  }, [queueManager]);

  // Add file to queue
  const addToQueue = useCallback(
    async (
      uri: string,
      fileName: string,
      mimeType: string,
      size: number,
      options?: {
        fileContext?: string;
        entityId?: string;
        entityType?: string;
        compress?: boolean;
        maxAttempts?: number;
      }
    ): Promise<string> => {
      return queueManager.addToQueue(uri, fileName, mimeType, size, options);
    },
    [queueManager]
  );

  // Remove from queue
  const removeFromQueue = useCallback(
    (id: string): boolean => {
      return queueManager.removeFromQueue(id);
    },
    [queueManager]
  );

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    queueManager.clearCompleted();
  }, [queueManager]);

  // Clear failed uploads
  const clearFailed = useCallback(() => {
    queueManager.clearFailed();
  }, [queueManager]);

  // Retry all failed uploads
  const retryFailed = useCallback(() => {
    queueManager.retryFailed();
  }, [queueManager]);

  // Retry specific upload
  const retryUpload = useCallback(
    (id: string): boolean => {
      return queueManager.retryUpload(id);
    },
    [queueManager]
  );

  // Pause queue
  const pauseQueue = useCallback(() => {
    queueManager.pauseQueue();
    setIsPaused(true);
  }, [queueManager]);

  // Resume queue
  const resumeQueue = useCallback(() => {
    queueManager.resumeQueue();
    setIsPaused(false);
  }, [queueManager]);

  // Get specific upload
  const getUpload = useCallback(
    (id: string): QueuedUpload | undefined => {
      return queueManager.getUpload(id);
    },
    [queueManager]
  );

  return {
    // Queue state
    queue,
    stats,
    isOnline,
    isPaused,
    isProcessing,

    // Actions
    addToQueue,
    removeFromQueue,
    clearCompleted,
    clearFailed,
    retryFailed,
    retryUpload,
    pauseQueue,
    resumeQueue,
    getUpload,
  };
}

// Hook to track progress of a specific upload
export function useUploadProgress(uploadId: string) {
  const queueManager = useMemo(() => getUploadQueue(), []);
  const [upload, setUpload] = useState<QueuedUpload | undefined>(
    queueManager.getUpload(uploadId)
  );

  useEffect(() => {
    const unsubscribe = queueManager.subscribeToProgress(uploadId, (updatedUpload) => {
      setUpload(updatedUpload);
    });

    // Initialize with current state
    setUpload(queueManager.getUpload(uploadId));

    return unsubscribe;
  }, [queueManager, uploadId]);

  return upload;
}
