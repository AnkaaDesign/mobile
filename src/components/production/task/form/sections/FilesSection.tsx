/**
 * Files Section Component
 * Handles client files, layout/artwork uploads, project files, and check-in/check-out photos
 *
 * Check-in/check-out files are now grouped by service order (matching web behavior).
 * Each service order gets its own file picker for checkin and checkout photos.
 * File IDs are injected into service order data on submission.
 *
 * Visibility & editability per sector:
 *   - Client files & Layouts: visible to ADMIN, COMMERCIAL, LOGISTIC, DESIGN; editable by all who can view
 *   - Project files: visible to ADMIN, COMMERCIAL, LOGISTIC, DESIGN; editable by ADMIN, COMMERCIAL, LOGISTIC
 *   - Check-in/Check-out: visible to ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC; editable by ADMIN, LOGISTIC
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { IconCamera, IconX } from '@tabler/icons-react-native';
import { FormCard } from '@/components/ui/form-section';
import { FilePicker, type FilePickerItem } from '@/components/ui/file-picker';
import { FullCamera } from '@/components/ui/full-camera';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';
import { FileSuggestions } from '@/components/ui/file-suggestions';
import { ArtworkFileUploadField, type ArtworkFileItem } from '../artwork-file-upload-field';
import { ThemedText } from '@/components/ui/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useFormContext } from 'react-hook-form';
import { SECTOR_PRIVILEGES, TASK_STATUS } from '@/constants';
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE } from '@/constants/enums';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import { useTheme } from '@/lib/theme';
import type { File as AnkaaFile } from '@/types';
import { getApiBaseUrl } from '@/utils/file';
import { rewriteCdnUrl } from '@/utils/file-viewer-utils';

interface FilesSectionProps {
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
  taskStatus?: string;
  customerId?: string;
  initialBaseFiles?: FilePickerItem[];
  initialArtworkFiles?: ArtworkFileItem[];
  initialProjectFiles?: FilePickerItem[];
  initialCheckinFiles?: FilePickerItem[];
  initialCheckoutFiles?: FilePickerItem[];
  serviceOrders?: any[];
}

/** Convert a File entity to a FilePickerItem */
function fileToPickerItem(file: AnkaaFile): FilePickerItem {
  return {
    uri: (file as any).url || '',
    name: file.filename || file.originalName || 'file',
    type: file.mimetype || 'application/octet-stream',
    size: file.size,
    mimeType: file.mimetype,
    id: file.id,
    uploaded: true,
    thumbnailUrl: file.thumbnailUrl || undefined,
  };
}

/** Extract IDs from file picker items */
function extractFileIds(files: Array<{ id?: string; fileId?: string; file?: { id?: string } }>): string[] {
  return files
    .map((f: any) => f.fileId || f.file?.id || f.id)
    .filter(Boolean);
}

export default function FilesSection({
  isSubmitting = false,
  mode = 'edit',
  taskStatus,
  customerId,
  initialBaseFiles = [],
  initialArtworkFiles = [],
  initialProjectFiles = [],
  initialCheckinFiles = [],
  initialCheckoutFiles = [],
  serviceOrders = [],
}: FilesSectionProps) {
  const { user } = useAuth();
  const { setValue } = useFormContext();
  const { colors } = useTheme();
  const [baseFiles, setBaseFiles] = useState<FilePickerItem[]>(initialBaseFiles);
  const [artworkFiles, setArtworkFiles] = useState<ArtworkFileItem[]>(initialArtworkFiles);
  const [projectFiles, setProjectFiles] = useState<FilePickerItem[]>(initialProjectFiles);

  // Per-service-order checkin/checkout files
  const [checkinFilesByServiceOrder, setCheckinFilesByServiceOrder] = useState<Record<string, FilePickerItem[]>>(() => {
    const map: Record<string, FilePickerItem[]> = {};
    if (serviceOrders) {
      for (const so of serviceOrders) {
        if (so.id) {
          map[so.id] = ((so as any).checkinFiles || []).map((f: any) => fileToPickerItem(f));
        }
      }
    }
    return map;
  });
  const [checkoutFilesByServiceOrder, setCheckoutFilesByServiceOrder] = useState<Record<string, FilePickerItem[]>>(() => {
    const map: Record<string, FilePickerItem[]> = {};
    if (serviceOrders) {
      for (const so of serviceOrders) {
        if (so.id) {
          map[so.id] = ((so as any).checkoutFiles || []).map((f: any) => fileToPickerItem(f));
        }
      }
    }
    return map;
  });

  // Camera state for checkin/checkout
  const [cameraTarget, setCameraTarget] = useState<{
    serviceOrderId: string;
    phase: 'checkin' | 'checkout';
  } | null>(null);
  const sessionPhotoCount = useRef(0);

  const handleOpenCamera = useCallback((serviceOrderId: string, phase: 'checkin' | 'checkout') => {
    sessionPhotoCount.current = 0;
    setCameraTarget({ serviceOrderId, phase });
  }, []);

  const handleCameraCapture = useCallback(
    (uri: string) => {
      if (!cameraTarget) return;
      const newFile: FilePickerItem = {
        uri,
        name: `${cameraTarget.phase}_${Date.now()}.jpg`,
        type: 'image/jpeg',
        mimeType: 'image/jpeg',
      };
      if (cameraTarget.phase === 'checkin') {
        setCheckinFilesByServiceOrder((prev) => {
          const updated = { ...prev, [cameraTarget.serviceOrderId]: [...(prev[cameraTarget.serviceOrderId] || []), newFile] };
          setValue(`_checkinFilesByServiceOrder.${cameraTarget.serviceOrderId}`, updated[cameraTarget.serviceOrderId], { shouldDirty: true });
          return updated;
        });
      } else {
        setCheckoutFilesByServiceOrder((prev) => {
          const updated = { ...prev, [cameraTarget.serviceOrderId]: [...(prev[cameraTarget.serviceOrderId] || []), newFile] };
          setValue(`_checkoutFilesByServiceOrder.${cameraTarget.serviceOrderId}`, updated[cameraTarget.serviceOrderId], { shouldDirty: true });
          return updated;
        });
      }
      sessionPhotoCount.current += 1;
    },
    [cameraTarget, setValue]
  );

  // Concluído — keep photos
  const handleCameraClose = useCallback(() => {
    setCameraTarget(null);
  }, []);

  // X button — discard photos taken in this session
  const handleCameraDiscard = useCallback(() => {
    if (cameraTarget && sessionPhotoCount.current > 0) {
      const count = sessionPhotoCount.current;
      if (cameraTarget.phase === 'checkin') {
        setCheckinFilesByServiceOrder((prev) => {
          const updated = { ...prev, [cameraTarget.serviceOrderId]: (prev[cameraTarget.serviceOrderId] || []).slice(0, -count) };
          setValue(`_checkinFilesByServiceOrder.${cameraTarget.serviceOrderId}`, updated[cameraTarget.serviceOrderId], { shouldDirty: true });
          return updated;
        });
      } else {
        setCheckoutFilesByServiceOrder((prev) => {
          const updated = { ...prev, [cameraTarget.serviceOrderId]: (prev[cameraTarget.serviceOrderId] || []).slice(0, -count) };
          setValue(`_checkoutFilesByServiceOrder.${cameraTarget.serviceOrderId}`, updated[cameraTarget.serviceOrderId], { shouldDirty: true });
          return updated;
        });
      }
    }
    setCameraTarget(null);
  }, [cameraTarget, setValue]);

  // Image preview state
  const [previewImages, setPreviewImages] = useState<{ uri: string }[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handlePreviewImage = useCallback((images: { uri: string }[], index: number) => {
    setPreviewImages(images);
    setPreviewIndex(index);
    setPreviewVisible(true);
  }, []);

  const handleRemoveCheckinFile = useCallback(
    (serviceOrderId: string, index: number) => {
      setCheckinFilesByServiceOrder((prev) => {
        const updated = { ...prev, [serviceOrderId]: (prev[serviceOrderId] || []).filter((_, i) => i !== index) };
        setValue(`_checkinFilesByServiceOrder.${serviceOrderId}`, updated[serviceOrderId], { shouldDirty: true });
        return updated;
      });
    },
    [setValue]
  );

  const handleRemoveCheckoutFile = useCallback(
    (serviceOrderId: string, index: number) => {
      setCheckoutFilesByServiceOrder((prev) => {
        const updated = { ...prev, [serviceOrderId]: (prev[serviceOrderId] || []).filter((_, i) => i !== index) };
        setValue(`_checkoutFilesByServiceOrder.${serviceOrderId}`, updated[serviceOrderId], { shouldDirty: true });
        return updated;
      });
    },
    [setValue]
  );

  // Check user sector privileges
  const userPrivilege = user?.sector?.privileges;
  const isAdmin = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isCommercial = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL;
  const isLogistic = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;
  const isProductionManager = userPrivilege === SECTOR_PRIVILEGES.PRODUCTION_MANAGER;
  const isDesigner = userPrivilege === SECTOR_PRIVILEGES.DESIGNER;
  const isFinancial = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

  // Client files & Layouts: visible to ADMIN, COMMERCIAL, LOGISTIC, PRODUCTION_MANAGER, DESIGN
  const canViewClientAndLayouts = isAdmin || isCommercial || isLogistic || isProductionManager || isDesigner;

  // Project files: visible to ADMIN, COMMERCIAL, LOGISTIC, PRODUCTION_MANAGER, DESIGN; editable by ADMIN, COMMERCIAL, LOGISTIC, PRODUCTION_MANAGER
  const canViewProjectFiles = isAdmin || isCommercial || isLogistic || isProductionManager || isDesigner;
  const canEditProjectFiles = isAdmin || isCommercial || isLogistic || isProductionManager;

  // Check-in/Check-out: visible to ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC, PRODUCTION_MANAGER; editable by ADMIN, LOGISTIC, PRODUCTION_MANAGER
  // Not available in create mode; checkout only available for completed tasks
  const isEditMode = mode === 'edit';
  const canViewCheckinCheckout = isEditMode && (isAdmin || isCommercial || isFinancial || isLogistic || isProductionManager);
  const canViewCheckout = canViewCheckinCheckout && taskStatus === TASK_STATUS.COMPLETED;
  const canEditCheckinCheckout = isAdmin || isLogistic || isProductionManager;

  // Filter active service orders (non-cancelled, with ID)
  const activeServiceOrders = (serviceOrders || []).filter(
    (so: any) => so.id && so.type === SERVICE_ORDER_TYPE.PRODUCTION && so.status !== SERVICE_ORDER_STATUS?.CANCELLED
  );

  // If the user cannot see any section, hide the entire component
  if (!canViewClientAndLayouts && !canViewProjectFiles && !canViewCheckinCheckout) {
    return null;
  }

  const handleBaseFilesChange = useCallback((files: FilePickerItem[]) => {
    setBaseFiles(files);
    setValue('baseFileIds', extractFileIds(files), { shouldDirty: true });
  }, [setValue]);

  const handleArtworkFilesChange = useCallback((files: ArtworkFileItem[]) => {
    setArtworkFiles(files);
    setValue('artworkIds', extractFileIds(files), { shouldDirty: true });
  }, [setValue]);

  const handleProjectFilesChange = useCallback((files: FilePickerItem[]) => {
    setProjectFiles(files);
    setValue('projectFileIds', extractFileIds(files), { shouldDirty: true });
    setValue('_projectFiles', files);
  }, [setValue]);

  const getThumbnailUri = (file: FilePickerItem) => {
    const apiBase = getApiBaseUrl();
    if (file.thumbnailUrl) {
      if (file.thumbnailUrl.startsWith('/api')) return `${apiBase}${file.thumbnailUrl}`;
      if (file.thumbnailUrl.startsWith('http')) return rewriteCdnUrl(file.thumbnailUrl);
      return file.thumbnailUrl;
    }
    if (file.uri) return file.uri;
    if (file.id) return `${apiBase}/files/thumbnail/${file.id}`;
    return '';
  };

  return (
    <>
      {/* Base Files */}
      {canViewClientAndLayouts && (
        <FormCard title="Arquivos Base" icon="IconFile">
          <FilePicker
            value={baseFiles}
            onChange={handleBaseFilesChange}
            maxFiles={30}
            placeholder="Adicionar arquivos base"
            helperText="Arquivos base para criação dos layouts (vídeos, imagens, PDFs)"
            showCamera={false}
            showVideoCamera={true}
            showGallery={true}
            showFilePicker={true}
            disabled={isSubmitting}
          />
          <FileSuggestions
            customerId={customerId}
            fileContext="taskBaseFiles"
            excludeFileIds={extractFileIds(baseFiles)}
            onSelect={(newFile) => {
              const item = fileToPickerItem(newFile);
              const updated = [...baseFiles, item];
              setBaseFiles(updated);
              setValue('baseFileIds', extractFileIds(updated), { shouldDirty: true });
            }}
            disabled={isSubmitting}
          />
        </FormCard>
      )}

      {/* Layouts (formerly "Artes") */}
      {canViewClientAndLayouts && (
        <FormCard title="Layouts" icon="IconPhotoPlus">
          <ArtworkFileUploadField
            onFilesChange={handleArtworkFilesChange}
            maxFiles={10}
            disabled={isSubmitting}
            showPreview={true}
            existingFiles={artworkFiles}
            placeholder="Adicione layouts relacionados à tarefa"
          />
          <FileSuggestions
            customerId={customerId}
            fileContext="tasksArtworks"
            excludeFileIds={extractFileIds(artworkFiles)}
            onSelect={(newFile) => {
              const item: ArtworkFileItem = {
                id: newFile.id,
                uri: (newFile as any).url || '',
                name: newFile.filename || newFile.originalName || 'artwork',
                type: newFile.mimetype || 'application/octet-stream',
                size: newFile.size,
                mimeType: newFile.mimetype,
                uploaded: true,
                uploadedFileId: newFile.id,
                thumbnailUrl: newFile.thumbnailUrl || undefined,
                status: 'DRAFT',
              };
              const updated = [...artworkFiles, item];
              setArtworkFiles(updated);
              setValue('artworkIds', extractFileIds(updated), { shouldDirty: true });
            }}
            disabled={isSubmitting}
          />
        </FormCard>
      )}

      {/* Project Files */}
      {canViewProjectFiles && (
        <FormCard title="Projetos" icon="IconFolderShare">
          <FilePicker
            value={projectFiles}
            onChange={handleProjectFilesChange}
            maxFiles={30}
            placeholder="Adicionar arquivos de projeto"
            helperText="Arquivos de projeto relacionados à tarefa"
            showCamera={true}
            showVideoCamera={false}
            showGallery={true}
            showFilePicker={true}
            disabled={isSubmitting || !canEditProjectFiles}
          />
          <FileSuggestions
            customerId={customerId}
            fileContext="taskProjectFiles"
            excludeFileIds={extractFileIds(projectFiles)}
            onSelect={(newFile) => {
              const item = fileToPickerItem(newFile);
              const updated = [...projectFiles, item];
              setProjectFiles(updated);
              setValue('projectFileIds', extractFileIds(updated), { shouldDirty: true });
            }}
            disabled={isSubmitting || !canEditProjectFiles}
          />
        </FormCard>
      )}

      {/* Check-in - Grouped by Service Order */}
      {canViewCheckinCheckout && activeServiceOrders.length > 0 && (
        <FormCard title="Check-in" icon="IconCamera">
          {activeServiceOrders.map((so: any) => {
            const soFiles = checkinFilesByServiceOrder[so.id] || [];
            return (
              <View key={`checkin-${so.id}`} style={styles.serviceOrderGroup}>
                <View style={styles.serviceOrderHeader}>
                  <ThemedText style={styles.serviceOrderLabel}>{so.description}</ThemedText>
                  <ThemedText style={styles.fileCount}>{soFiles.length} foto(s)</ThemedText>
                </View>
                {/* Thumbnails */}
                {soFiles.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
                    {soFiles.map((file, index) => (
                      <View key={file.id || file.uri || `ci-${index}`} style={styles.thumbnailWrapper}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handlePreviewImage(
                            soFiles.map((f) => ({ uri: f.uploaded && f.thumbnailUrl ? getThumbnailUri(f) : f.uri })),
                            index
                          )}
                        >
                          <Image
                            source={{ uri: file.uploaded && file.thumbnailUrl ? getThumbnailUri(file) : file.uri }}
                            style={[styles.thumbnailImage, { borderColor: colors.border }]}
                          />
                        </TouchableOpacity>
                        {!isSubmitting && canEditCheckinCheckout && (
                          <TouchableOpacity
                            onPress={() => handleRemoveCheckinFile(so.id, index)}
                            style={[styles.thumbnailRemove, { backgroundColor: colors.destructive }]}
                          >
                            <IconX size={10} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                )}
                {/* Open camera button */}
                {canEditCheckinCheckout && (
                  <TouchableOpacity
                    onPress={() => handleOpenCamera(so.id, 'checkin')}
                    disabled={isSubmitting}
                    style={[styles.cameraButton, { borderColor: colors.border, backgroundColor: colors.muted, opacity: isSubmitting ? 0.5 : 1 }]}
                    activeOpacity={0.7}
                  >
                    <IconCamera size={20} color={colors.foreground} />
                    <ThemedText style={[styles.cameraButtonText, { color: colors.foreground }]}>
                      Tirar foto
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </FormCard>
      )}

      {/* Check-out - Grouped by Service Order, with checkin reference images */}
      {canViewCheckout && activeServiceOrders.length > 0 && (
        <FormCard title="Check-out" icon="IconCameraCheck">
          {activeServiceOrders.map((so: any) => {
            const soCheckinFiles = checkinFilesByServiceOrder[so.id] || [];
            const soCheckoutFiles = checkoutFilesByServiceOrder[so.id] || [];
            return (
              <View key={`checkout-${so.id}`} style={styles.serviceOrderGroup}>
                <View style={styles.serviceOrderHeader}>
                  <ThemedText style={styles.serviceOrderLabel}>{so.description}</ThemedText>
                  <ThemedText style={styles.fileCount}>{soCheckoutFiles.length} foto(s)</ThemedText>
                </View>
                {/* Checkin reference images */}
                {soCheckinFiles.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
                    {soCheckinFiles.map((file, index) => {
                      const src = getThumbnailUri(file);
                      return (
                        <View key={file.id || file.uri} style={styles.thumbnailWrapper}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handlePreviewImage(
                              soCheckinFiles.map((f) => ({ uri: getThumbnailUri(f) })),
                              index
                            )}
                          >
                            {src ? (
                              <Image source={{ uri: src }} style={[styles.thumbnailImage, { borderColor: colors.border }]} />
                            ) : (
                              <View style={[styles.thumbnailImage, { borderColor: colors.border, backgroundColor: colors.border }]} />
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
                {/* Checkout thumbnails */}
                {soCheckoutFiles.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
                    {soCheckoutFiles.map((file, index) => (
                      <View key={file.id || file.uri || `co-${index}`} style={styles.thumbnailWrapper}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handlePreviewImage(
                            soCheckoutFiles.map((f) => ({ uri: f.uploaded && f.thumbnailUrl ? getThumbnailUri(f) : f.uri })),
                            index
                          )}
                        >
                          <Image
                            source={{ uri: file.uploaded && file.thumbnailUrl ? getThumbnailUri(file) : file.uri }}
                            style={[styles.thumbnailImage, { borderColor: colors.border }]}
                          />
                        </TouchableOpacity>
                        {!isSubmitting && canEditCheckinCheckout && (
                          <TouchableOpacity
                            onPress={() => handleRemoveCheckoutFile(so.id, index)}
                            style={[styles.thumbnailRemove, { backgroundColor: colors.destructive }]}
                          >
                            <IconX size={10} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                )}
                {/* Open camera button */}
                {canEditCheckinCheckout && (
                  <TouchableOpacity
                    onPress={() => handleOpenCamera(so.id, 'checkout')}
                    disabled={isSubmitting}
                    style={[styles.cameraButton, { borderColor: colors.border, backgroundColor: colors.muted, opacity: isSubmitting ? 0.5 : 1 }]}
                    activeOpacity={0.7}
                  >
                    <IconCamera size={20} color={colors.foreground} />
                    <ThemedText style={[styles.cameraButtonText, { color: colors.foreground }]}>
                      Tirar foto
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </FormCard>
      )}

      <FullCamera
        visible={!!cameraTarget}
        onCapture={handleCameraCapture}
        onClose={handleCameraClose}
        onDiscard={handleCameraDiscard}
      />

      <ImagePreviewModal
        visible={previewVisible}
        images={previewImages}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  serviceOrderGroup: {
    marginBottom: spacing.md,
  },
  serviceOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  serviceOrderLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  fileCount: {
    fontSize: fontSize.xs,
    opacity: 0.6,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  cameraButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  thumbnailScroll: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: spacing.xs,
    padding: 4,
  },
  thumbnailImage: {
    width: 56,
    height: 56,
    borderRadius: 6,
    borderWidth: 1,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
