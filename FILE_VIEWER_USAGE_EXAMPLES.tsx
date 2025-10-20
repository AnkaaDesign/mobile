/**
 * File Viewer Usage Examples
 * Complete examples showing how to use the new file viewer system
 */

import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useFileViewer } from '@/components/file';
import type { File as AnkaaFile } from '@/types';

// =====================
// Example 1: Basic File Viewing
// =====================

export function BasicFileViewExample({ file }: { file: AnkaaFile }) {
  const { actions } = useFileViewer();

  return (
    <Pressable
      style={styles.button}
      onPress={() => actions.viewFile(file)}
    >
      <Text style={styles.buttonText}>View File</Text>
    </Pressable>
  );
}

// =====================
// Example 2: File List with Auto-Detection
// =====================

export function FileListExample({ files }: { files: AnkaaFile[] }) {
  const { actions } = useFileViewer();

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          style={styles.listItem}
          onPress={() => actions.viewFile(item)}
        >
          <Text style={styles.filename}>{item.filename}</Text>
          <Text style={styles.filesize}>{formatFileSize(item.size)}</Text>
        </Pressable>
      )}
    />
  );
}

// =====================
// Example 3: Image Gallery
// =====================

export function ImageGalleryExample({ images }: { images: AnkaaFile[] }) {
  const { actions } = useFileViewer();

  return (
    <View style={styles.gallery}>
      {images.map((image, index) => (
        <Pressable
          key={image.id}
          style={styles.galleryItem}
          onPress={() => actions.viewFiles(images, index)}
        >
          <Text>{image.filename}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// =====================
// Example 4: File Card with Actions
// =====================

export function FileCardExample({ file }: { file: AnkaaFile }) {
  const { actions } = useFileViewer();

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{file.filename}</Text>
      <View style={styles.cardActions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => actions.viewFile(file)}
        >
          <Text>View</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => actions.downloadFile(file)}
        >
          <Text>Download</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => actions.shareFile(file)}
        >
          <Text>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================
// Example 5: Specific File Type Handling
// =====================

import { isPDFFile, isVideoFile, isImageFile } from '@/components/file';

export function TypeSpecificExample({ file }: { file: AnkaaFile }) {
  const { actions } = useFileViewer();

  const handleView = () => {
    if (isPDFFile(file)) {
      // Force PDF viewing even if file is large
      actions.openPdfModal(file);
    } else if (isVideoFile(file)) {
      // Force video playback
      actions.openVideoModal(file);
    } else if (isImageFile(file)) {
      // Force image preview
      actions.openImageModal([file], 0);
    } else {
      // Fallback to smart detection
      actions.viewFile(file);
    }
  };

  return (
    <Pressable style={styles.button} onPress={handleView}>
      <Text>
        View {isPDFFile(file) ? 'PDF' : isVideoFile(file) ? 'Video' : 'File'}
      </Text>
    </Pressable>
  );
}

// =====================
// Example 6: Task Files Integration
// =====================

export function TaskFilesExample({ task }: { task: { files?: AnkaaFile[] } }) {
  const { actions } = useFileViewer();

  if (!task.files || task.files.length === 0) {
    return <Text>No files attached</Text>;
  }

  return (
    <View style={styles.taskFiles}>
      <Text style={styles.sectionTitle}>Attached Files</Text>
      {task.files.map((file) => (
        <Pressable
          key={file.id}
          style={styles.taskFileItem}
          onPress={() => actions.viewFile(file)}
        >
          <Text>{file.filename}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// =====================
// Example 7: Customer Files Integration
// =====================

export function CustomerFilesExample({ customer }: { customer: { files?: AnkaaFile[] } }) {
  const { actions } = useFileViewer();

  const imageFiles = customer.files?.filter(isImageFile) || [];
  const documentFiles = customer.files?.filter(file => !isImageFile(file)) || [];

  return (
    <View style={styles.customerFiles}>
      {/* Image Gallery */}
      {imageFiles.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.imageGrid}>
            {imageFiles.map((image, index) => (
              <Pressable
                key={image.id}
                style={styles.imageGridItem}
                onPress={() => actions.viewFiles(imageFiles, index)}
              >
                <Text>{image.filename}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Document List */}
      {documentFiles.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Documents</Text>
          {documentFiles.map((doc) => (
            <Pressable
              key={doc.id}
              style={styles.documentItem}
              onPress={() => actions.viewFile(doc)}
            >
              <Text>{doc.filename}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// =====================
// Example 8: Complete Integration Example
// =====================

export function CompleteIntegrationExample() {
  const { state, actions } = useFileViewer();

  // Sample files for testing
  const sampleFiles: AnkaaFile[] = [
    {
      id: '1',
      filename: 'report.pdf',
      mimetype: 'application/pdf',
      size: 1024 * 1024 * 2, // 2MB
      originalName: 'report.pdf',
      path: '/uploads/report.pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      filename: 'presentation.mp4',
      mimetype: 'video/mp4',
      size: 1024 * 1024 * 50, // 50MB
      originalName: 'presentation.mp4',
      path: '/uploads/presentation.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      filename: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 500, // 500KB
      originalName: 'photo.jpg',
      path: '/uploads/photo.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>File Viewer Test</Text>

      {/* Current State Display */}
      <View style={styles.stateInfo}>
        <Text>Image Modal: {state.isImageModalOpen ? 'Open' : 'Closed'}</Text>
        <Text>PDF Modal: {state.isPdfModalOpen ? 'Open' : 'Closed'}</Text>
        <Text>Video Modal: {state.isVideoModalOpen ? 'Open' : 'Closed'}</Text>
      </View>

      {/* File List */}
      <View style={styles.fileList}>
        {sampleFiles.map((file) => (
          <View key={file.id} style={styles.fileRow}>
            <View style={styles.fileInfo}>
              <Text style={styles.filename}>{file.filename}</Text>
              <Text style={styles.filesize}>{formatFileSize(file.size)}</Text>
            </View>
            <View style={styles.fileActions}>
              <Pressable
                style={styles.smallButton}
                onPress={() => actions.viewFile(file)}
              >
                <Text style={styles.smallButtonText}>View</Text>
              </Pressable>
              <Pressable
                style={styles.smallButton}
                onPress={() => actions.downloadFile(file)}
              >
                <Text style={styles.smallButtonText}>Download</Text>
              </Pressable>
              <Pressable
                style={styles.smallButton}
                onPress={() => actions.shareFile(file)}
              >
                <Text style={styles.smallButtonText}>Share</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* Direct Modal Controls */}
      <View style={styles.directControls}>
        <Text style={styles.subtitle}>Direct Modal Controls</Text>
        <Pressable
          style={styles.button}
          onPress={() => actions.openPdfModal(sampleFiles[0])}
        >
          <Text style={styles.buttonText}>Open PDF Modal</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => actions.openVideoModal(sampleFiles[1])}
        >
          <Text style={styles.buttonText}>Open Video Modal</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => actions.openImageModal([sampleFiles[2]], 0)}
        >
          <Text style={styles.buttonText}>Open Image Modal</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================
// Utility Functions
// =====================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// =====================
// Styles
// =====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  smallButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  filename: {
    fontSize: 14,
    fontWeight: '500',
  },
  filesize: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  galleryItem: {
    width: '33%',
    padding: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  taskFiles: {
    marginVertical: 16,
  },
  taskFileItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginVertical: 4,
  },
  customerFiles: {
    marginVertical: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageGridItem: {
    width: '50%',
    padding: 8,
  },
  documentItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginVertical: 4,
  },
  stateInfo: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  fileList: {
    marginVertical: 16,
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 4,
  },
  fileInfo: {
    flex: 1,
  },
  fileActions: {
    flexDirection: 'row',
  },
  directControls: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
});
