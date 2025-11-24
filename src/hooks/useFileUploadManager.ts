/**
 * useFileUploadManager
 *
 * A hook that manages file uploads with state tracking.
 * Provides an API for adding files, tracking upload progress,
 * and retrieving uploaded file IDs.
 *
 * Usage:
 * ```tsx
 * const budgetUpload = useFileUploadManager({
 *   entityType: 'order',
 *   fileContext: 'budget',
 * });
 *
 * // Add a file to upload
 * await budgetUpload.addFile(file);
 *
 * // Get uploaded file IDs
 * const ids = budgetUpload.uploadedFiles
 *   .filter(f => f.status === 'completed')
 *   .map(f => f.id);
 * ```
 */

import { useState, useCallback } from "react";
import { uploadSingleFile } from "@/api-client";

export interface UploadedFileState {
  id?: string;
  uri: string;
  name: string;
  type: string;
  size: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  progress?: number;
}

export interface FileUploadManagerOptions {
  entityType?: string;
  fileContext?: string;
  entityId?: string;
  onSuccess?: (file: UploadedFileState) => void;
  onError?: (error: Error) => void;
}

export interface FileToUpload {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export function useFileUploadManager(options: FileUploadManagerOptions = {}) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Convert a URI to a File object for upload
   */
  const uriToFile = useCallback(async (fileInfo: FileToUpload): Promise<File> => {
    const response = await fetch(fileInfo.uri);
    const blob = await response.blob();
    return new File([blob], fileInfo.name, { type: fileInfo.type });
  }, []);

  /**
   * Add and upload a file
   */
  const addFile = useCallback(
    async (fileInfo: FileToUpload): Promise<UploadedFileState | null> => {
      // Add file to state as pending
      const newFile: UploadedFileState = {
        uri: fileInfo.uri,
        name: fileInfo.name,
        type: fileInfo.type,
        size: fileInfo.size,
        status: "pending",
        progress: 0,
      };

      setUploadedFiles((prev) => [...prev, newFile]);
      const fileIndex = uploadedFiles.length;

      try {
        setIsUploading(true);

        // Update status to uploading
        setUploadedFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex ? { ...f, status: "uploading" as const } : f
          )
        );

        // Convert URI to File object
        const file = await uriToFile(fileInfo);

        // Upload the file
        const response = await uploadSingleFile(file, {
          fileContext: options.fileContext,
          entityType: options.entityType,
          entityId: options.entityId,
          onProgress: (progress) => {
            setUploadedFiles((prev) =>
              prev.map((f, i) =>
                i === fileIndex
                  ? { ...f, progress: progress.percentage }
                  : f
              )
            );
          },
        });

        if (response.data) {
          const completedFile: UploadedFileState = {
            ...newFile,
            id: response.data.id,
            status: "completed",
            progress: 100,
          };

          setUploadedFiles((prev) =>
            prev.map((f, i) => (i === fileIndex ? completedFile : f))
          );

          options.onSuccess?.(completedFile);
          return completedFile;
        } else {
          throw new Error("Upload failed - no data returned");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        setUploadedFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex
              ? { ...f, status: "error" as const, error: errorMessage }
              : f
          )
        );

        options.onError?.(
          error instanceof Error ? error : new Error(errorMessage)
        );
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadedFiles.length, options, uriToFile]
  );

  /**
   * Remove a file from the list
   */
  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  /**
   * Get IDs of successfully uploaded files
   */
  const getUploadedIds = useCallback(() => {
    return uploadedFiles
      .filter((f) => f.status === "completed" && f.id)
      .map((f) => f.id!);
  }, [uploadedFiles]);

  /**
   * Check if all files have been uploaded successfully
   */
  const allUploaded = uploadedFiles.every((f) => f.status === "completed");

  /**
   * Check if any uploads failed
   */
  const hasErrors = uploadedFiles.some((f) => f.status === "error");

  return {
    uploadedFiles,
    isUploading,
    addFile,
    removeFile,
    clearFiles,
    getUploadedIds,
    allUploaded,
    hasErrors,
  };
}

export default useFileUploadManager;
