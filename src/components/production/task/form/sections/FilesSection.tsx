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

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { FormCard } from '@/components/ui/form-section';
import { FilePicker, type FilePickerItem } from '@/components/ui/file-picker';
import { FileSuggestions } from '@/components/ui/file-suggestions';
import { ArtworkFileUploadField, type ArtworkFileItem } from '../artwork-file-upload-field';
import { ThemedText } from '@/components/ui/themed-text';
import { useAuth } from '@/hooks/useAuth';
import { useFormContext } from 'react-hook-form';
import { SECTOR_PRIVILEGES, TASK_STATUS } from '@/constants';
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE } from '@/constants/enums';
import { spacing, fontSize } from '@/constants/design-system';
import { useTheme } from '@/lib/theme';
import type { File as AnkaaFile } from '@/types';
import { getApiBaseUrl } from '@/utils/file';

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

  const handleCheckinFilesChange = useCallback((serviceOrderId: string, files: FilePickerItem[]) => {
    setCheckinFilesByServiceOrder(prev => ({ ...prev, [serviceOrderId]: files }));
    // Store per-SO checkin files for submission
    setValue(`_checkinFilesByServiceOrder.${serviceOrderId}`, files, { shouldDirty: true });
    // Also store raw files for new file upload
    setValue('_checkinFiles', files.filter((f: any) => !f.id && !f.fileId && f.uri));
  }, [setValue]);

  const handleCheckoutFilesChange = useCallback((serviceOrderId: string, files: FilePickerItem[]) => {
    setCheckoutFilesByServiceOrder(prev => ({ ...prev, [serviceOrderId]: files }));
    // Store per-SO checkout files for submission
    setValue(`_checkoutFilesByServiceOrder.${serviceOrderId}`, files, { shouldDirty: true });
    setValue('_checkoutFiles', files.filter((f: any) => !f.id && !f.fileId && f.uri));
  }, [setValue]);

  const getThumbnailUri = (file: FilePickerItem) => {
    const apiBase = getApiBaseUrl();
    if (file.thumbnailUrl) {
      if (file.thumbnailUrl.startsWith('/api')) return `${apiBase}${file.thumbnailUrl}`;
      if (file.thumbnailUrl.startsWith('http')) return file.thumbnailUrl;
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
                  <ThemedText style={styles.fileCount}>{soFiles.filter((f: any) => f.uploaded || f.id).length} foto(s)</ThemedText>
                </View>
                <FilePicker
                  value={soFiles}
                  onChange={(files) => handleCheckinFilesChange(so.id, files)}
                  maxFiles={20}
                  placeholder="Adicionar fotos de check-in"
                  showCamera={true}
                  showVideoCamera={false}
                  showGallery={true}
                  showFilePicker={false}
                  disabled={isSubmitting || !canEditCheckinCheckout}
                  previewSize={56}
                />
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
            const checkinCount = soCheckinFiles.filter((f: any) => f.uploaded || f.id).length;
            const checkoutCount = soCheckoutFiles.filter((f: any) => f.uploaded || f.id).length;
            const needsMore = checkinCount > 0 && checkoutCount < checkinCount;
            return (
              <View key={`checkout-${so.id}`} style={styles.serviceOrderGroup}>
                <View style={styles.serviceOrderHeader}>
                  <ThemedText style={styles.serviceOrderLabel}>{so.description}</ThemedText>
                  {needsMore && (
                    <ThemedText style={[styles.fileCount, { color: '#d97706' }]}>
                      falta {checkinCount - checkoutCount}
                    </ThemedText>
                  )}
                </View>
                {/* Checkin reference images - small horizontal row */}
                {soCheckinFiles.length > 0 && (
                  <View style={styles.referenceRow}>
                    <ThemedText style={styles.referenceLabel}>Ref:</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.referenceScroll}>
                      {soCheckinFiles.filter((f: any) => f.uploaded || f.id).map((file) => {
                        const src = getThumbnailUri(file);
                        return (
                          <View key={file.id || file.uri} style={[styles.referenceThumbnail, { borderColor: colors.border }]}>
                            {src ? (
                              <Image source={{ uri: src }} style={styles.referenceImage} />
                            ) : (
                              <View style={[styles.referencePlaceholder, { backgroundColor: colors.border }]} />
                            )}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
                <FilePicker
                  value={soCheckoutFiles}
                  onChange={(files) => handleCheckoutFilesChange(so.id, files)}
                  maxFiles={20}
                  placeholder="Adicionar fotos de check-out"
                  showCamera={true}
                  showVideoCamera={false}
                  showGallery={true}
                  showFilePicker={false}
                  disabled={isSubmitting || !canEditCheckinCheckout}
                  previewSize={56}
                />
              </View>
            );
          })}
        </FormCard>
      )}
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
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  referenceLabel: {
    fontSize: 10,
    opacity: 0.5,
  },
  referenceScroll: {
    flexDirection: 'row',
  },
  referenceThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    opacity: 0.6,
    marginRight: spacing.xs,
  },
  referenceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  referencePlaceholder: {
    width: '100%',
    height: '100%',
  },
});
