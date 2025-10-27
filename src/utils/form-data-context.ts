/**
 * FormData Context Helper
 * Provides context-aware file upload functionality with metadata preservation
 * Similar to web implementation for consistency
 */

export interface FileContext {
  entityType?: string;
  entityId?: string;
  customer?: {
    id: string;
    name?: string;
    fantasyName?: string;
  };
  [key: string]: any;
}

export interface FileWithContext {
  uri: string;
  name: string;
  type: string;
  size?: number;
  context?: Record<string, any>;
}

/**
 * Creates a FormData object with context metadata for file uploads
 * This ensures proper file organization on the backend
 */
export function createFormDataWithContext(
  data: Record<string, any>,
  files: Record<string, FileWithContext[]>,
  context?: FileContext
): FormData {
  const formData = new FormData();

  // Add all non-file fields
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    // Handle arrays (e.g., services, paintIds)
    if (Array.isArray(value)) {
      // Check if it's an array of objects or primitives
      if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
        // Array of objects - serialize as JSON
        formData.append(key, JSON.stringify(value));
      } else {
        // Array of primitives - serialize as JSON
        formData.append(key, JSON.stringify(value));
      }
      return;
    }

    // Handle objects
    if (typeof value === "object" && value !== null) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    // Handle Date objects
    if (value instanceof Date) {
      formData.append(key, value.toISOString());
      return;
    }

    // Handle primitives
    formData.append(key, String(value));
  });

  // Add files with context
  Object.entries(files).forEach(([category, fileArray]) => {
    if (!fileArray || fileArray.length === 0) {
      return;
    }

    fileArray.forEach((file, index) => {
      // Create file object for FormData
      const fileData: any = {
        uri: file.uri,
        name: file.name,
        type: file.type,
      };

      // Append the file
      formData.append(category, fileData as any);

      // Add file context metadata if provided
      if (context || file.context) {
        const fileContext = {
          ...context,
          ...file.context,
          fileIndex: index,
          category: category,
        };

        // Append context for this specific file
        formData.append(`${category}_context_${index}`, JSON.stringify(fileContext));
      }
    });
  });

  // Add global context if provided
  if (context) {
    formData.append("_context", JSON.stringify(context));
  }

  return formData;
}

/**
 * Extracts file IDs from current state to preserve existing files
 * Used in edit mode to track which files to keep
 */
export function extractExistingFileIds(
  data: Record<string, any>,
  fileFields: string[]
): Record<string, string[]> {
  const fileIds: Record<string, string[]> = {};

  fileFields.forEach((field) => {
    const value = data[field];

    if (Array.isArray(value)) {
      // Filter for valid UUIDs
      fileIds[field] = value.filter((id) =>
        typeof id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      );
    } else if (typeof value === "string" && value.length > 0) {
      fileIds[field] = [value];
    } else {
      fileIds[field] = [];
    }
  });

  return fileIds;
}

/**
 * Merges new file uploads with existing file IDs
 * Ensures both new and existing files are sent to backend
 */
export function mergeFileUploadsWithExisting(
  existingFileIds: Record<string, string[]>,
  newFiles: Record<string, FileWithContext[]>
): { hasNewFiles: boolean; mergedData: Record<string, any> } {
  const mergedData: Record<string, any> = {};
  let hasNewFiles = false;

  // Combine all file field keys
  const allKeys = new Set([
    ...Object.keys(existingFileIds),
    ...Object.keys(newFiles),
  ]);

  allKeys.forEach((key) => {
    const existing = existingFileIds[key] || [];
    const newFilesForKey = newFiles[key] || [];

    if (newFilesForKey.length > 0) {
      hasNewFiles = true;
    }

    // Store existing IDs
    if (existing.length > 0) {
      mergedData[`${key}Ids`] = existing;
    }
  });

  return { hasNewFiles, mergedData };
}

/**
 * Validates file before upload
 */
export function validateFileForUpload(
  file: FileWithContext,
  options: {
    maxSizeInMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeInMB = 100, allowedTypes = [] } = options;

  // Size validation
  if (file.size) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`,
      };
    }
  }

  // Type validation
  if (allowedTypes.length > 0) {
    const fileType = file.type.toLowerCase();
    const isAllowed = allowedTypes.some((allowed) =>
      fileType.includes(allowed.toLowerCase())
    );

    if (!isAllowed) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(", ")}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Batch validates multiple files
 */
export function validateFiles(
  files: FileWithContext[],
  options: {
    maxSizeInMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  files.forEach((file, index) => {
    const validation = validateFileForUpload(file, options);
    if (!validation.valid && validation.error) {
      errors.push(`Arquivo ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Prepares files for FormData upload with proper structure
 */
export function prepareFilesForUpload(
  files: Record<string, any[]>,
  context?: FileContext
): Record<string, FileWithContext[]> {
  const prepared: Record<string, FileWithContext[]> = {};

  Object.entries(files).forEach(([category, fileArray]) => {
    if (!fileArray || fileArray.length === 0) {
      return;
    }

    prepared[category] = fileArray.map((file) => {
      // If already in correct format
      if (file.uri && file.name && file.type) {
        return {
          ...file,
          context: file.context || context,
        };
      }

      // If it's a raw file object, extract needed properties
      return {
        uri: file.uri || file.url,
        name: file.name || file.fileName || `file_${Date.now()}`,
        type: file.type || file.mimeType || "application/octet-stream",
        size: file.size || file.fileSize,
        context: file.context || context,
      };
    });
  });

  return prepared;
}
