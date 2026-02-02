/**
 * Files Section Component
 * Handles base files and artwork uploads
 */

import React, { useState } from 'react';
import { FormCard } from '@/components/ui/form-section';
import { FilePicker, type FilePickerItem } from '@/components/ui/file-picker';
import { ArtworkFileUploadField, type ArtworkFileItem } from '../artwork-file-upload-field';
import { useAuth } from '@/hooks/useAuth';

interface FilesSectionProps {
  isSubmitting?: boolean;
  initialBaseFiles?: FilePickerItem[];
  initialArtworkFiles?: ArtworkFileItem[];
  onBaseFilesChange?: (files: FilePickerItem[]) => void;
  onArtworkFilesChange?: (files: ArtworkFileItem[]) => void;
  onArtworkStatusChange?: (fileId: string, status: string) => void;
}

export default function FilesSection({
  isSubmitting = false,
  initialBaseFiles = [],
  initialArtworkFiles = [],
  onBaseFilesChange,
  onArtworkFilesChange,
  onArtworkStatusChange
}: FilesSectionProps) {
  const { user } = useAuth();
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

  const handleBaseFilesChange = (files: FilePickerItem[]) => {
    setBaseFiles(files);
    onBaseFilesChange?.(files);
  };

  const handleArtworkFilesChange = (files: ArtworkFileItem[]) => {
    console.log('[FilesSection] 🎨 Artworks changed:', files.length);
    setArtworkFiles(files);
    onArtworkFilesChange?.(files);
  };

  const handleArtworkStatusChange = (fileId: string, status: string) => {
    console.log('[FilesSection] 🎨 Artwork status changed:', { fileId, status });
    onArtworkStatusChange?.(fileId, status);
  };

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
          onStatusChange={handleArtworkStatusChange}
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