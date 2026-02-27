/**
 * Files Section Component
 * Handles client files, layout/artwork uploads, project files, and check-in/check-out photos
 *
 * File changes are synced to react-hook-form via setValue on baseFileIds/artworkIds/projectFileIds/
 * checkinFileIds/checkoutFileIds, matching the web pattern where file ID arrays are tracked
 * for dirty detection.
 *
 * Visibility & editability per sector:
 *   - Client files & Layouts: visible to ADMIN, COMMERCIAL, LOGISTIC, DESIGN; editable by all who can view
 *   - Project files: visible to ADMIN, COMMERCIAL, LOGISTIC, DESIGN; editable by ADMIN, COMMERCIAL, LOGISTIC
 *   - Check-in/Check-out: visible to ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC; editable by ADMIN, LOGISTIC
 */

import React, { useState, useCallback } from 'react';
import { FormCard } from '@/components/ui/form-section';
import { FilePicker, type FilePickerItem } from '@/components/ui/file-picker';
import { FileSuggestions } from '@/components/ui/file-suggestions';
import { ArtworkFileUploadField, type ArtworkFileItem } from '../artwork-file-upload-field';
import { useAuth } from '@/hooks/useAuth';
import { useFormContext } from 'react-hook-form';
import { SECTOR_PRIVILEGES, TASK_STATUS } from '@/constants';
import type { File as AnkaaFile } from '@/types';

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
}: FilesSectionProps) {
  const { user } = useAuth();
  const { setValue } = useFormContext();
  const [baseFiles, setBaseFiles] = useState<FilePickerItem[]>(initialBaseFiles);
  const [artworkFiles, setArtworkFiles] = useState<ArtworkFileItem[]>(initialArtworkFiles);
  const [projectFiles, setProjectFiles] = useState<FilePickerItem[]>(initialProjectFiles);
  const [checkinFiles, setCheckinFiles] = useState<FilePickerItem[]>(initialCheckinFiles);
  const [checkoutFiles, setCheckoutFiles] = useState<FilePickerItem[]>(initialCheckoutFiles);

  // Check user sector privileges
  const userPrivilege = user?.sector?.privileges;
  const isAdmin = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isCommercial = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL;
  const isLogistic = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;
  const isDesigner = userPrivilege === SECTOR_PRIVILEGES.DESIGNER;
  const isFinancial = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

  // Client files & Layouts: visible to ADMIN, COMMERCIAL, LOGISTIC, DESIGN
  const canViewClientAndLayouts = isAdmin || isCommercial || isLogistic || isDesigner;

  // Project files: visible to ADMIN, COMMERCIAL, LOGISTIC, DESIGN; editable by ADMIN, COMMERCIAL, LOGISTIC
  const canViewProjectFiles = isAdmin || isCommercial || isLogistic || isDesigner;
  const canEditProjectFiles = isAdmin || isCommercial || isLogistic;

  // Check-in/Check-out: visible to ADMIN, COMMERCIAL, FINANCIAL, LOGISTIC; editable by ADMIN, LOGISTIC
  // Not available in create mode; checkout only available for completed tasks
  const isEditMode = mode === 'edit';
  const canViewCheckinCheckout = isEditMode && (isAdmin || isCommercial || isFinancial || isLogistic);
  const canViewCheckout = canViewCheckinCheckout && taskStatus === TASK_STATUS.COMPLETED;
  const canEditCheckinCheckout = isAdmin || isLogistic;

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

  const handleCheckinFilesChange = useCallback((files: FilePickerItem[]) => {
    setCheckinFiles(files);
    setValue('checkinFileIds', extractFileIds(files), { shouldDirty: true });
    // Store raw file objects for new file upload at submission time
    setValue('_checkinFiles', files);
  }, [setValue]);

  const handleCheckoutFilesChange = useCallback((files: FilePickerItem[]) => {
    setCheckoutFiles(files);
    setValue('checkoutFileIds', extractFileIds(files), { shouldDirty: true });
    setValue('_checkoutFiles', files);
  }, [setValue]);

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

      {/* Check-in */}
      {canViewCheckinCheckout && (
        <FormCard title="Check-in" icon="IconCamera">
          <FilePicker
            value={checkinFiles}
            onChange={handleCheckinFilesChange}
            maxFiles={20}
            placeholder="Adicionar fotos de check-in"
            helperText="Fotos de check-in da tarefa"
            showCamera={true}
            showVideoCamera={false}
            showGallery={true}
            showFilePicker={false}
            disabled={isSubmitting || !canEditCheckinCheckout}
          />
        </FormCard>
      )}

      {/* Check-out - only available for completed tasks */}
      {canViewCheckout && (
        <FormCard title="Check-out" icon="IconCameraOff">
          <FilePicker
            value={checkoutFiles}
            onChange={handleCheckoutFilesChange}
            maxFiles={20}
            placeholder="Adicionar fotos de check-out"
            helperText="Fotos de check-out da tarefa"
            showCamera={true}
            showVideoCamera={false}
            showGallery={true}
            showFilePicker={false}
            disabled={isSubmitting || !canEditCheckinCheckout}
          />
        </FormCard>
      )}
    </>
  );
}
