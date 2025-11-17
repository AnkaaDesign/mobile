// packages/utils/src/upload-queue.ts
// Upload queue manager with offline support and persistence

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { uploadSingleFile } from '@/api-client';
import type { FileUploadOptions as ApiFileUploadOptions } from '@/api-client';
import { smartCompressFile } from './file-compression';

// =====================
// Types
// =====================

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'paused' | 'cancelled';

export interface QueuedUpload {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: UploadStatus;
  progress: number;
  error?: string;
  uploadedFileId?: string;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  maxAttempts: number;
  // Optional context for WebDAV
  fileContext?: string;
  entityId?: string;
  entityType?: string;
  // Compression settings
  compress?: boolean;
  compressedUri?: string;
}

export interface QueueConfig {
  maxConcurrent?: number;
  maxRetries?: number;
  persistKey?: string;
  autoStart?: boolean;
  compressByDefault?: boolean;
}

export interface QueueStats {
  total: number;
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
  paused: number;
  cancelled: number;
}

export type QueueListener = (queue: QueuedUpload[]) => void;
export type ProgressListener = (upload: QueuedUpload) => void;

// =====================
// Upload Queue Manager
// =====================

export class UploadQueueManager {
  private queue: Map<string, QueuedUpload> = new Map();
  private activeUploads: Set<string> = new Set();
  private listeners: Set<QueueListener> = new Set();
  private progressListeners: Map<string, Set<ProgressListener>> = new Map();
  private isOnline: boolean = true;
  private isPaused: boolean = false;
  private config: Required<QueueConfig>;
  private persistKey: string;
  private processingInterval?: NodeJS.Timeout;

  constructor(config: QueueConfig = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 3,
      maxRetries: config.maxRetries ?? 3,
      persistKey: config.persistKey ?? '@upload_queue',
      autoStart: config.autoStart ?? true,
      compressByDefault: config.compressByDefault ?? true,
    };
    this.persistKey = this.config.persistKey;

    // Initialize network listener
    this.initNetworkListener();

    // Load persisted queue
    this.loadQueue();

    // Start processing if autoStart is enabled
    if (this.config.autoStart) {
      this.startProcessing();
    }
  }

  // =====================
  // Queue Management
  // =====================

  async addToQueue(
    uri: string,
    fileName: string,
    mimeType: string,
    size: number,
    options: {
      fileContext?: string;
      entityId?: string;
      entityType?: string;
      compress?: boolean;
      maxAttempts?: number;
    } = {}
  ): Promise<string> {
    const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queuedUpload: QueuedUpload = {
      id,
      uri,
      fileName,
      mimeType,
      size,
      status: 'pending',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.config.maxRetries,
      fileContext: options.fileContext,
      entityId: options.entityId,
      entityType: options.entityType,
      compress: options.compress ?? this.config.compressByDefault,
    };

    this.queue.set(id, queuedUpload);
    await this.persistQueue();
    this.notifyListeners();

    // Start processing if not paused
    if (!this.isPaused && this.isOnline) {
      this.processQueue();
    }

    return id;
  }

  removeFromQueue(id: string): boolean {
    const upload = this.queue.get(id);
    if (!upload) return false;

    // Can't remove if currently uploading
    if (upload.status === 'uploading') {
      upload.status = 'cancelled';
      this.queue.set(id, upload);
      return false;
    }

    this.queue.delete(id);
    this.persistQueue();
    this.notifyListeners();
    return true;
  }

  clearCompleted(): void {
    const completed: string[] = [];
    this.queue.forEach((upload, id) => {
      if (upload.status === 'completed') {
        completed.push(id);
      }
    });

    completed.forEach((id) => this.queue.delete(id));
    this.persistQueue();
    this.notifyListeners();
  }

  clearFailed(): void {
    const failed: string[] = [];
    this.queue.forEach((upload, id) => {
      if (upload.status === 'failed') {
        failed.push(id);
      }
    });

    failed.forEach((id) => this.queue.delete(id));
    this.persistQueue();
    this.notifyListeners();
  }

  retryFailed(): void {
    this.queue.forEach((upload) => {
      if (upload.status === 'failed') {
        upload.status = 'pending';
        upload.attempts = 0;
        upload.error = undefined;
        upload.updatedAt = Date.now();
        this.queue.set(upload.id, upload);
      }
    });

    this.persistQueue();
    this.notifyListeners();

    if (!this.isPaused && this.isOnline) {
      this.processQueue();
    }
  }

  retryUpload(id: string): boolean {
    const upload = this.queue.get(id);
    if (!upload || upload.status === 'uploading') return false;

    upload.status = 'pending';
    upload.attempts = 0;
    upload.error = undefined;
    upload.updatedAt = Date.now();
    this.queue.set(id, upload);

    this.persistQueue();
    this.notifyListeners();

    if (!this.isPaused && this.isOnline) {
      this.processQueue();
    }

    return true;
  }

  pauseQueue(): void {
    this.isPaused = true;
    this.stopProcessing();
  }

  resumeQueue(): void {
    this.isPaused = false;
    if (this.isOnline) {
      this.startProcessing();
    }
  }

  // =====================
  // Queue Processing
  // =====================

  private async processQueue(): Promise<void> {
    if (this.isPaused || !this.isOnline) return;

    const pending = Array.from(this.queue.values()).filter(
      (upload) => upload.status === 'pending' && upload.attempts < upload.maxAttempts
    );

    const slotsAvailable = this.config.maxConcurrent - this.activeUploads.size;
    const toProcess = pending.slice(0, slotsAvailable);

    for (const upload of toProcess) {
      this.processUpload(upload);
    }
  }

  private async processUpload(upload: QueuedUpload): Promise<void> {
    if (this.activeUploads.has(upload.id)) return;

    this.activeUploads.add(upload.id);
    upload.status = 'uploading';
    upload.attempts++;
    upload.updatedAt = Date.now();
    this.queue.set(upload.id, upload);
    this.notifyListeners();
    this.notifyProgress(upload);

    try {
      let fileUri = upload.uri;

      // Compress if needed
      if (upload.compress && !upload.compressedUri) {
        try {
          const compressed = await smartCompressFile(upload.uri, upload.mimeType, {
            networkAware: true,
          });
          if ('uri' in compressed && compressed.uri !== upload.uri) {
            fileUri = compressed.uri;
            upload.compressedUri = compressed.uri;
            this.queue.set(upload.id, upload);
          }
        } catch (compressionError) {
          console.warn('Compression failed, uploading original file:', compressionError);
        }
      } else if (upload.compressedUri) {
        fileUri = upload.compressedUri;
      }

      // Convert URI to blob for upload
      // In React Native, FormData can accept { uri, type, name } directly
      const fileForUpload: any = {
        uri: fileUri,
        type: upload.mimeType,
        name: upload.fileName,
      };

      const uploadOptions: ApiFileUploadOptions = {
        fileContext: upload.fileContext,
        entityId: upload.entityId,
        entityType: upload.entityType,
        onProgress: (progress) => {
          upload.progress = progress.percentage;
          upload.updatedAt = Date.now();
          this.queue.set(upload.id, upload);
          this.notifyProgress(upload);
        },
      };

      const response = await uploadSingleFile(fileForUpload, uploadOptions);

      if (response.success && response.data) {
        upload.status = 'completed';
        upload.progress = 100;
        upload.uploadedFileId = response.data.id;
        upload.updatedAt = Date.now();
        this.queue.set(upload.id, upload);
        this.notifyListeners();
        this.notifyProgress(upload);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      upload.status = upload.attempts >= upload.maxAttempts ? 'failed' : 'pending';
      upload.error = error instanceof Error ? error.message : 'Unknown error';
      upload.updatedAt = Date.now();
      this.queue.set(upload.id, upload);
      this.notifyListeners();
      this.notifyProgress(upload);
    } finally {
      this.activeUploads.delete(upload.id);
      await this.persistQueue();

      // Process next items in queue
      if (!this.isPaused && this.isOnline) {
        this.processQueue();
      }
    }
  }

  private startProcessing(): void {
    if (this.processingInterval) return;

    // Process queue every 5 seconds
    this.processingInterval = setInterval(() => {
      if (!this.isPaused && this.isOnline) {
        this.processQueue();
      }
    }, 5000);

    // Also process immediately
    this.processQueue();
  }

  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  // =====================
  // Persistence
  // =====================

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.persistKey);
      if (stored) {
        const uploads: QueuedUpload[] = JSON.parse(stored);
        uploads.forEach((upload) => {
          // Reset uploading status to pending on load
          if (upload.status === 'uploading') {
            upload.status = 'pending';
          }
          this.queue.set(upload.id, upload);
        });
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load upload queue:', error);
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      const uploads = Array.from(this.queue.values());
      await AsyncStorage.setItem(this.persistKey, JSON.stringify(uploads));
    } catch (error) {
      console.error('Failed to persist upload queue:', error);
    }
  }

  // =====================
  // Network Monitoring
  // =====================

  private initNetworkListener(): void {
    NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Resume processing if came back online
      if (!wasOnline && this.isOnline && !this.isPaused) {
        this.startProcessing();
      }

      // Pause if went offline
      if (wasOnline && !this.isOnline) {
        this.stopProcessing();
      }
    });
  }

  // =====================
  // Observers
  // =====================

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToProgress(uploadId: string, listener: ProgressListener): () => void {
    if (!this.progressListeners.has(uploadId)) {
      this.progressListeners.set(uploadId, new Set());
    }
    this.progressListeners.get(uploadId)!.add(listener);

    return () => {
      const listeners = this.progressListeners.get(uploadId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.progressListeners.delete(uploadId);
        }
      }
    };
  }

  private notifyListeners(): void {
    const queue = Array.from(this.queue.values());
    this.listeners.forEach((listener) => listener(queue));
  }

  private notifyProgress(upload: QueuedUpload): void {
    const listeners = this.progressListeners.get(upload.id);
    if (listeners) {
      listeners.forEach((listener) => listener(upload));
    }
  }

  // =====================
  // Getters
  // =====================

  getQueue(): QueuedUpload[] {
    return Array.from(this.queue.values());
  }

  getUpload(id: string): QueuedUpload | undefined {
    return this.queue.get(id);
  }

  getStats(): QueueStats {
    const stats: QueueStats = {
      total: this.queue.size,
      pending: 0,
      uploading: 0,
      completed: 0,
      failed: 0,
      paused: 0,
      cancelled: 0,
    };

    this.queue.forEach((upload) => {
      stats[upload.status]++;
    });

    return stats;
  }

  isProcessing(): boolean {
    return !this.isPaused && this.activeUploads.size > 0;
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  // =====================
  // Cleanup
  // =====================

  destroy(): void {
    this.stopProcessing();
    this.listeners.clear();
    this.progressListeners.clear();
  }
}

// =====================
// Singleton Instance
// =====================

let uploadQueueInstance: UploadQueueManager | null = null;

export function getUploadQueue(config?: QueueConfig): UploadQueueManager {
  if (!uploadQueueInstance) {
    uploadQueueInstance = new UploadQueueManager(config);
  }
  return uploadQueueInstance;
}

export function resetUploadQueue(): void {
  if (uploadQueueInstance) {
    uploadQueueInstance.destroy();
    uploadQueueInstance = null;
  }
}
