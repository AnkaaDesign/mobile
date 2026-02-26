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
import { ArtworkFileUploadField, type ArtworkFileItem } from '../artwork-file-upload-field';
import { useAuth } from '@/hooks/useAuth';
import { useFormContext } from 'react-hook-form';
import { SECTOR_PRIVILEGES } from '@/constants';

interface FilesSectionProps {
  isSubmitting?: boolean;
  initialBaseFiles?: FilePickerItem[];
  initialArtworkFiles?: ArtworkFileItem[];
  initialProjectFiles?: FilePickerItem[];
  initialCheckinFiles?: FilePickerItem[];
  initialCheckoutFiles?: FilePickerItem[];
}

/** Extract IDs from file picker items */
function extractFileIds(files: Array<{ id?: string; fileId?: string; file?: { id?: string } }>): string[] {
  return files
    .map((f: any) => f.fileId || f.file?.id || f.id)
    .filter(Boolean);
}

export default function FilesSection({
  isSubmitting = false,
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
  const canViewCheckinCheckout = isAdmin || isCommercial || isFinancial || isLogistic;
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
      {/* Client Files (formerly "Arquivos Base") */}
      {canViewClientAndLayouts && (
        <FormCard title="Arquivos do Cliente" icon="IconFile">
          <FilePicker
            value={baseFiles}
            onChange={handleBaseFilesChange}
            maxFiles={30}
            placeholder="Adicionar arquivos do cliente"
            helperText="Arquivos do cliente para criação dos layouts (vídeos, imagens, PDFs)"
            showCamera={false}
            showVideoCamera={true}
            showGallery={true}
            showFilePicker={true}
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

      {/* Check-out */}
      {canViewCheckinCheckout && (
        <FormCard title="Check-out" icon="IconPhotoPlus">
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
