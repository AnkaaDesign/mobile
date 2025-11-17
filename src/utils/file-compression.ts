// packages/utils/src/file-compression.ts
// File compression utilities for images and videos with network awareness

import * as ImageManipulator from 'expo-image-manipulator';
import NetInfo from '@react-native-community/netinfo';
import { isImageFile, isVideoFile } from './file-utils';

// =====================
// Network Detection
// =====================

export type NetworkSpeed = 'slow' | 'medium' | 'fast';
export type CompressionLevel = 'low' | 'medium' | 'high';

export interface NetworkInfo {
  type: string | null;
  effectiveType: string | null;
  isConnected: boolean | null;
  speed: NetworkSpeed;
}

export async function detectNetworkSpeed(): Promise<NetworkInfo> {
  const netInfo = await NetInfo.fetch();

  let speed: NetworkSpeed = 'medium';

  // Map effective connection type to speed
  if (netInfo.details && 'cellularGeneration' in netInfo.details) {
    const generation = netInfo.details.cellularGeneration;
    if (generation === '2g') {
      speed = 'slow';
    } else if (generation === '3g') {
      speed = 'medium';
    } else if (generation === '4g' || generation === '5g') {
      speed = 'fast';
    }
  } else if (netInfo.type === 'wifi') {
    speed = 'fast';
  } else if (netInfo.type === 'cellular') {
    speed = 'medium';
  } else if (netInfo.type === 'none') {
    speed = 'slow';
  }

  return {
    type: netInfo.type,
    effectiveType: netInfo.details && 'cellularGeneration' in netInfo.details
      ? netInfo.details.cellularGeneration as string
      : null,
    isConnected: netInfo.isConnected,
    speed,
  };
}

// =====================
// Compression Configuration
// =====================

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  preserveAspectRatio?: boolean;
  networkAware?: boolean;
}

export interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  format?: string;
}

// Network-aware compression presets
const COMPRESSION_PRESETS: Record<NetworkSpeed, ImageCompressionOptions> = {
  slow: {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.6,
    format: 'jpeg',
  },
  medium: {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.75,
    format: 'jpeg',
  },
  fast: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    format: 'webp',
  },
};

// =====================
// Image Compression
// =====================

export async function compressImage(
  uri: string,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'webp',
    preserveAspectRatio = true,
    networkAware = false,
  } = options;

  // Apply network-aware compression if enabled
  let finalOptions = { maxWidth, maxHeight, quality, format };

  if (networkAware) {
    const networkInfo = await detectNetworkSpeed();
    const preset = COMPRESSION_PRESETS[networkInfo.speed];
    finalOptions = {
      ...finalOptions,
      ...preset,
      // Override with explicit options if provided
      ...(options.maxWidth && { maxWidth: options.maxWidth }),
      ...(options.maxHeight && { maxHeight: options.maxHeight }),
      ...(options.quality && { quality: options.quality }),
      ...(options.format && { format: options.format }),
    };
  }

  // Determine save format
  let saveFormat: ImageManipulator.SaveFormat;
  switch (finalOptions.format) {
    case 'png':
      saveFormat = ImageManipulator.SaveFormat.PNG;
      break;
    case 'webp':
      saveFormat = ImageManipulator.SaveFormat.WEBP;
      break;
    case 'jpeg':
    default:
      saveFormat = ImageManipulator.SaveFormat.JPEG;
      break;
  }

  try {
    // Manipulate the image
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: finalOptions.maxWidth,
            height: finalOptions.maxHeight,
          },
        },
      ],
      {
        compress: finalOptions.quality,
        format: saveFormat,
        base64: false,
      }
    );

    return {
      uri: manipulatedImage.uri,
      width: manipulatedImage.width,
      height: manipulatedImage.height,
      format: finalOptions.format,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Falha ao comprimir imagem');
  }
}

export async function compressImageWithSizeTarget(
  uri: string,
  targetSizeMB: number,
  options: Omit<ImageCompressionOptions, 'quality'> = {}
): Promise<CompressionResult> {
  const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
  let bestResult: CompressionResult | null = null;

  for (const quality of qualities) {
    const result = await compressImage(uri, {
      ...options,
      quality,
    });

    // For React Native, we can't easily get file size without additional file system operations
    // Return the compressed image at the lowest quality that meets requirements
    bestResult = result;

    // If we have compressed enough (this is a heuristic based on dimensions)
    if (result.width <= (options.maxWidth || 1920) * 0.7) {
      break;
    }
  }

  if (!bestResult) {
    throw new Error('Não foi possível comprimir a imagem para o tamanho desejado');
  }

  return bestResult;
}

// =====================
// Batch Compression
// =====================

export async function compressImages(
  uris: string[],
  options: ImageCompressionOptions = {},
  onProgress?: (index: number, total: number, result: CompressionResult) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < uris.length; i++) {
    try {
      const result = await compressImage(uris[i], options);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, uris.length, result);
      }
    } catch (error) {
      console.error(`Error compressing image ${i + 1}:`, error);
      // Continue with other images even if one fails
    }
  }

  return results;
}

// =====================
// Smart Compression
// =====================

export interface SmartCompressionOptions {
  fileSizeMB?: number;
  networkAware?: boolean;
  preferQuality?: boolean;
}

export async function smartCompressFile(
  uri: string,
  mimeType: string,
  options: SmartCompressionOptions = {}
): Promise<CompressionResult | { uri: string }> {
  const { networkAware = true, preferQuality = false } = options;

  // Only compress images and videos
  if (isImageFile(uri, mimeType)) {
    let compressionOptions: ImageCompressionOptions = {
      networkAware,
    };

    if (preferQuality) {
      // Higher quality, less compression
      compressionOptions = {
        ...compressionOptions,
        maxWidth: 2560,
        maxHeight: 2560,
        quality: 0.9,
        format: 'webp',
      };
    }

    return await compressImage(uri, compressionOptions);
  }

  // For videos, we'd need video compression library
  // For now, return the original URI
  if (isVideoFile(uri, mimeType)) {
    console.warn('Video compression not yet implemented');
    return { uri };
  }

  // Return original for non-media files
  return { uri };
}

// =====================
// Compression Utilities
// =====================

export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0;
  return ((originalSize - compressedSize) / originalSize) * 100;
}

export function shouldCompressFile(
  fileSizeMB: number,
  mimeType: string,
  networkSpeed: NetworkSpeed
): boolean {
  // Always compress large files
  if (fileSizeMB > 10) return true;

  // Compress images on slow networks
  if (isImageFile('', mimeType) && networkSpeed === 'slow' && fileSizeMB > 2) {
    return true;
  }

  // Compress videos on non-fast networks
  if (isVideoFile('', mimeType) && networkSpeed !== 'fast' && fileSizeMB > 5) {
    return true;
  }

  return false;
}

export function getRecommendedCompression(
  fileSizeMB: number,
  networkSpeed: NetworkSpeed
): CompressionLevel {
  if (networkSpeed === 'slow') {
    return 'high';
  }

  if (networkSpeed === 'medium') {
    return fileSizeMB > 5 ? 'high' : 'medium';
  }

  // Fast network
  return fileSizeMB > 10 ? 'medium' : 'low';
}

// =====================
// Export Compression Utils Object
// =====================

export const fileCompression = {
  // Network detection
  detectNetworkSpeed,

  // Image compression
  compressImage,
  compressImageWithSizeTarget,
  compressImages,

  // Smart compression
  smartCompressFile,

  // Utilities
  calculateCompressionRatio,
  shouldCompressFile,
  getRecommendedCompression,

  // Presets
  COMPRESSION_PRESETS,
};
