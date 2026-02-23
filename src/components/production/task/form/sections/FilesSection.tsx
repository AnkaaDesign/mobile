/**
 * Files Section Component
 * Handles base files and artwork uploads
 *
 * File changes are synced to react-hook-form via setValue on baseFileIds/artworkIds,
 * matching the web pattern where file ID arrays are tracked for dirty detection.
 */

import React, { useState, useCallback } from 'react';
import { FormCard } from '@/components/ui/form-section';
import { FilePicker, type FilePickerItem } from '@/components/ui/file-picker';
import { ArtworkFileUploadField, type ArtworkFileItem } from '../artwork-file-upload-field';
import { useAuth } from '@/hooks/useAuth';
import { useFormContext } from 'react-hook-form';

interface FilesSectionProps {
  isSubmitting?: boolean;
  initialBaseFiles?: FilePickerItem[];
  initialArtworkFiles?: ArtworkFileItem[];
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
}: FilesSectionProps) {
  const { user } = useAuth();
  const { setValue } = useFormContext();
  const [baseFiles, setBaseFiles] = useState<FilePickerItem[]>(initialBaseFiles);
  const [artworkFiles, setArtworkFiles] = useState<ArtworkFileItem[]>(initialArtworkFiles);

  // Check user sector
  const isWarehouseSector = user?.sector?.privileges === 'WAREHOUSE';
  const isFinancialSector = user?.sector?.privileges === 'FINANCIAL';
  const isLogisticSector = user?.sector?.privileges === 'LOGISTIC';

  // Hide files section for warehouse, financial, and logistic users
  const canViewFilesSection = !isWarehouseSector && !isFinancialSector && !isLogisticSector;

  if (!canViewFilesSection) {
    return null;
  }

  const handleBaseFilesChange = useCallback((files: FilePickerItem[]) => {
    setBaseFiles(files);
    // Sync IDs to react-hook-form for dirty detection and submission
    setValue('baseFileIds', extractFileIds(files), { shouldDirty: true });
  }, [setValue]);

  const handleArtworkFilesChange = useCallback((files: ArtworkFileItem[]) => {
    setArtworkFiles(files);
    // Sync IDs to react-hook-form for dirty detection and submission
    setValue('artworkIds', extractFileIds(files), { shouldDirty: true });
  }, [setValue]);

  return (
    <>
      {/* Base Files */}
      <FormCard title="Arquivos Base" icon="IconFile">
        <FilePicker
          value={baseFiles}
          onChange={handleBaseFilesChange}
          maxFiles={30}
          placeholder="Adicionar arquivos base"
          helperText="Arquivos base para criação das artes (vídeos, imagens, PDFs)"
          showCamera={false}
          showVideoCamera={true}
          showGallery={true}
          showFilePicker={true}
          disabled={isSubmitting}
        />
      </FormCard>

      {/* Artworks */}
      <FormCard title="Artes" icon="IconPhotoPlus">
        <ArtworkFileUploadField
          onFilesChange={handleArtworkFilesChange}
          maxFiles={10}
          disabled={isSubmitting}
          showPreview={true}
          existingFiles={artworkFiles}
          placeholder="Adicione artes relacionadas à tarefa"
        />
      </FormCard>
    </>
  );
}
