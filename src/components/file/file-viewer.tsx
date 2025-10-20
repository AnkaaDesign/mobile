import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { File as AnkaaFile } from "../../types";
import { isImageFile, isVideoFile } from "../../utils/file";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform, Alert } from "react-native";
import { showToast } from "@/components/ui/toast";

export interface FileViewerState {
  isPreviewModalOpen: boolean;
  currentFiles: AnkaaFile[];
  currentFileIndex: number;
}

export interface FileViewerContextValue {
  state: FileViewerState;
  actions: {
    openPreview: (files: AnkaaFile[], initialIndex?: number) => void;
    closePreview: () => void;
    viewFile: (file: AnkaaFile) => void;
    viewFiles: (files: AnkaaFile[], initialIndex: number) => void;
    downloadFile: (file: AnkaaFile) => Promise<void>;
    shareFile: (file: AnkaaFile) => Promise<void>;
    openFile: (file: AnkaaFile) => Promise<void>;
  };
}

const FileViewerContext = createContext<FileViewerContextValue | null>(null);

export interface FileViewerProviderProps {
  children: React.ReactNode;
  baseUrl?: string;
}

// EPS file detection
const isEpsFile = (file: AnkaaFile): boolean => {
  const epsMimeTypes = ["application/postscript", "application/x-eps", "application/eps", "image/eps", "image/x-eps"];
  return epsMimeTypes.includes(file.mimetype.toLowerCase());
};

// Check if file can be previewed
const isPreviewableFile = (file: AnkaaFile): boolean => {
  return isImageFile(file) || (isEpsFile(file) && !!file.thumbnailUrl);
};

export const FileViewerProvider: React.FC<FileViewerProviderProps> = ({ children, baseUrl = "" }) => {
  const [state, setState] = useState<FileViewerState>({
    isPreviewModalOpen: false,
    currentFiles: [],
    currentFileIndex: 0,
  });

  const getFileUrl = useCallback((file: AnkaaFile): string => {
    const apiUrl = baseUrl || (global as any).__ANKAA_API_URL__ || "http://localhost:3030";
    // NOTE: No /api prefix - just /files/serve/{id}
    return `${apiUrl}/files/serve/${file.id}`;
  }, [baseUrl]);

  const getDownloadUrl = useCallback((file: AnkaaFile): string => {
    const apiUrl = baseUrl || (global as any).__ANKAA_API_URL__ || "http://localhost:3030";
    // NOTE: No /api prefix - just /files/{id}/download
    return `${apiUrl}/files/${file.id}/download`;
  }, [baseUrl]);

  const openPreview = useCallback((files: AnkaaFile[], initialIndex: number = 0) => {
    setState({
      isPreviewModalOpen: true,
      currentFiles: files,
      currentFileIndex: initialIndex,
    });
  }, []);

  const closePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPreviewModalOpen: false,
    }));

    // Clear files after animation
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentFiles: [],
        currentFileIndex: 0,
      }));
    }, 300);
  }, []);

  const downloadFile = useCallback(async (file: AnkaaFile) => {
    try {
      const fileUrl = getDownloadUrl(file);
      const fileUri = FileSystem.documentDirectory + file.filename;

      showToast({ message: "Baixando arquivo...", type: "info" });

      const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);

      if (downloadResult.status === 200) {
        showToast({ message: "Arquivo baixado com sucesso!", type: "success" });
        return downloadResult.uri;
      } else {
        throw new Error("Download falhou");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      showToast({ message: "Erro ao baixar arquivo", type: "error" });
      throw error;
    }
  }, [getDownloadUrl]);

  const shareFile = useCallback(async (file: AnkaaFile) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert("Compartilhamento não disponível", "Seu dispositivo não suporta compartilhamento de arquivos.");
        return;
      }

      showToast({ message: "Preparando arquivo...", type: "info" });

      // Download to cache first
      const fileUrl = getDownloadUrl(file);
      const fileUri = FileSystem.cacheDirectory + file.filename;
      const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: file.mimetype,
          dialogTitle: "Compartilhar arquivo",
          UTI: file.mimetype,
        });
      } else {
        throw new Error("Download falhou");
      }
    } catch (error) {
      console.error("Error sharing file:", error);
      showToast({ message: "Erro ao compartilhar arquivo", type: "error" });
    }
  }, [getDownloadUrl]);

  const openFile = useCallback(async (file: AnkaaFile) => {
    try {
      // For Android, we can use Sharing to open with appropriate app
      // For iOS, Sharing will present share sheet which allows opening
      await shareFile(file);
    } catch (error) {
      console.error("Error opening file:", error);
      showToast({ message: "Erro ao abrir arquivo", type: "error" });
    }
  }, [shareFile]);

  const viewFile = useCallback((file: AnkaaFile) => {
    // Check if file can be previewed
    if (isPreviewableFile(file)) {
      openPreview([file], 0);
    } else {
      // For non-previewable files, open with system app
      openFile(file);
    }
  }, [openPreview, openFile]);

  const viewFiles = useCallback((files: AnkaaFile[], initialIndex: number) => {
    // Filter to only previewable files
    const previewableFiles = files.filter(f => isPreviewableFile(f));

    if (previewableFiles.length === 0) {
      // No previewable files, try to open the first one
      if (files[initialIndex]) {
        openFile(files[initialIndex]);
      }
      return;
    }

    // Find the index of the initial file in the filtered array
    const targetFile = files[initialIndex];
    const adjustedIndex = previewableFiles.findIndex(f => f.id === targetFile?.id);
    const finalIndex = adjustedIndex >= 0 ? adjustedIndex : 0;

    openPreview(previewableFiles, finalIndex);
  }, [openPreview, openFile]);

  const actions = useMemo(() => ({
    openPreview,
    closePreview,
    viewFile,
    viewFiles,
    downloadFile,
    shareFile,
    openFile,
  }), [openPreview, closePreview, viewFile, viewFiles, downloadFile, shareFile, openFile]);

  const contextValue = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);

  return (
    <FileViewerContext.Provider value={contextValue}>
      {children}
    </FileViewerContext.Provider>
  );
};

/**
 * Hook to use the file viewer context
 */
export const useFileViewer = () => {
  const context = useContext(FileViewerContext);
  if (!context) {
    throw new Error("useFileViewer must be used within a FileViewerProvider");
  }
  return context;
};

export default FileViewerProvider;
