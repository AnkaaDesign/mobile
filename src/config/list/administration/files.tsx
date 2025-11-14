import type { ListConfig } from '@/components/list/types'
import type { File } from '@/types'
import { formatFileSize} from '@/utils'
import { fontSize, fontWeight } from '@/constants/design-system'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Badge } from '@/components/ui/badge'
import { FileTypeIcon } from '@/components/ui/file-type-icon'

const styles = StyleSheet.create({
  fileCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileNameContainer: {
    flex: 1,
  },
  nameText: {
    fontWeight: fontWeight.medium,
    fontSize: fontSize.xs,
  },
  subtitleText: {
    fontSize: fontSize.xs,
    opacity: 0.7,
    marginTop: 2,
  },
  cellText: {
    fontSize: fontSize.xs,
  },
  numberText: {
    fontWeight: fontWeight.normal,
    fontSize: fontSize.xs,
  },
})

// Common MIME type presets for filters
const COMMON_MIME_TYPES = [
  { value: 'image/*', label: 'Imagens' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'application/vnd.ms-excel', label: 'Excel' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel (XLSX)' },
  { value: 'application/msword', label: 'Word' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word (DOCX)' },
  { value: 'video/*', label: 'Vídeos' },
  { value: 'audio/*', label: 'Áudio' },
  { value: 'text/plain', label: 'Texto' },
  { value: 'text/csv', label: 'CSV' },
]

export const filesListConfig: ListConfig<File> = {
  key: 'administration-files',
  title: 'Arquivos',

  query: {
    hook: 'useFilesInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },

  table: {
    columns: [
      {
        key: 'filename',
        label: 'ARQUIVO',
        sortable: true,
        width: 3.0,
        align: 'left',
        render: (file: File) => (
          <View style={styles.fileCell}>
            <FileTypeIcon filename={file.filename} mimeType={file.mimetype} size="md" />
            <View style={styles.fileNameContainer}>
              <ThemedText style={styles.nameText} numberOfLines={1}>
                {file.filename}
              </ThemedText>
              <ThemedText style={styles.subtitleText} numberOfLines={1}>
                {file.originalName}
              </ThemedText>
            </View>
          </View>
        ),
      },
      {
        key: 'mimetype',
        label: 'TIPO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (file: File) => {
          const type = file.mimetype.split('/')[1]?.toUpperCase() || file.mimetype
          return (
            <Badge variant="outline" size="sm">
              <ThemedText style={{ fontSize: fontSize.xs }}>{type}</ThemedText>
            </Badge>
          )
        },
      },
      {
        key: 'size',
        label: 'TAMANHO',
        sortable: true,
        width: 1.0,
        align: 'right',
        render: (file: File) => formatFileSize(file.size),
      },
      {
        key: 'createdAt',
        label: 'ENVIADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (file: File) => file.createdAt,
        format: 'date',
      },
      {
        key: 'updatedAt',
        label: 'ATUALIZADO EM',
        sortable: true,
        width: 1.5,
        align: 'left',
        render: (file: File) => file.updatedAt,
        format: 'date',
      },
    ],
    defaultVisible: ['filename', 'mimetype', 'size', 'createdAt'],
    rowHeight: 60,
    actions: [
      {
        key: 'preview',
        label: 'Visualizar',
        icon: 'eye',
        variant: 'default',
        onPress: (file, router) => {
          // Preview file - could implement modal or navigation
          console.log('Preview file:', file.id)
        },
      },
      {
        key: 'download',
        label: 'Baixar',
        icon: 'download',
        variant: 'default',
        onPress: async (file) => {
          // Download file
          console.log('Download file:', file.id)
        },
      },
      {
        key: 'share',
        label: 'Compartilhar',
        icon: 'share',
        variant: 'default',
        onPress: async (file) => {
          // Share file
          console.log('Share file:', file.id)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (file) => `Deseja excluir o arquivo "${file.filename}"?`,
        },
        onPress: async (file, _, { delete: deleteFile }) => {
          await deleteFile(file.id)
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'fileType',
        label: 'Tipo de Arquivo',
        icon: 'file',
        collapsible: true,
        defaultOpen: true,
        fields: [
          {
            key: 'mimetypes',
            label: 'Tipos de Arquivo',
            type: 'select',
            multiple: true,
            options: COMMON_MIME_TYPES.map((type) => ({
              label: type.label,
              value: type.value,
            })),
            placeholder: 'Selecione os tipos',
          },
          {
            key: 'isImage',
            label: 'Apenas Imagens',
            description: 'Incluir apenas arquivos de imagem',
            type: 'toggle',
          },
          {
            key: 'isPdf',
            label: 'Apenas PDF',
            description: 'Incluir apenas arquivos PDF',
            type: 'toggle',
          },
          {
            key: 'isDocument',
            label: 'Apenas Documentos',
            description: 'Incluir apenas documentos (PDF, Word, Excel, etc.)',
            type: 'toggle',
          },
          {
            key: 'isVideo',
            label: 'Apenas Vídeos',
            description: 'Incluir apenas arquivos de vídeo',
            type: 'toggle',
          },
          {
            key: 'isAudio',
            label: 'Apenas Áudio',
            description: 'Incluir apenas arquivos de áudio',
            type: 'toggle',
          },
        ],
      },
      {
        key: 'fileSize',
        label: 'Tamanho',
        icon: 'ruler',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'sizeRange',
            label: 'Faixa de Tamanho (bytes)',
            type: 'number-range',
            placeholder: { min: 'Mínimo (bytes)', max: 'Máximo (bytes)' },
          },
        ],
      },
      {
        key: 'fileStatus',
        label: 'Status',
        icon: 'file-check',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'hasThumbnail',
            label: 'Possui Miniatura',
            description: 'Incluir apenas arquivos com miniatura',
            type: 'toggle',
          },
          {
            key: 'isOrphaned',
            label: 'Arquivos Órfãos',
            description: 'Arquivos sem vínculos com outras entidades',
            type: 'toggle',
          },
          {
            key: 'hasRelations',
            label: 'Possui Vínculos',
            description: 'Arquivos vinculados a outras entidades',
            type: 'toggle',
          },
        ],
      },
      {
        key: 'dates',
        label: 'Datas',
        icon: 'calendar',
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            key: 'createdAt',
            label: 'Data de Criação',
            type: 'date-range',
          },
          {
            key: 'updatedAt',
            label: 'Data de Atualização',
            type: 'date-range',
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar arquivos...',
    debounce: 300,
    searchKey: 'searchingFor',
  },

  export: {
    title: 'Arquivos',
    filename: 'arquivos',
    formats: ['csv', 'json'],
    columns: [
      { key: 'filename', label: 'Nome do Arquivo', path: 'filename' },
      { key: 'originalName', label: 'Nome Original', path: 'originalName' },
      { key: 'mimetype', label: 'Tipo MIME', path: 'mimetype' },
      { key: 'size', label: 'Tamanho', path: 'size', format: (value: number) => formatFileSize(value) },
      { key: 'path', label: 'Caminho', path: 'path' },
      { key: 'thumbnailUrl', label: 'URL da Miniatura', path: 'thumbnailUrl' },
      { key: 'createdAt', label: 'Criado Em', path: 'createdAt', format: 'date' },
      { key: 'updatedAt', label: 'Atualizado Em', path: 'updatedAt', format: 'date' },
    ],
  },

  actions: {
    create: {
      label: 'Enviar Arquivo',
      route: '/administracao/arquivos/enviar',
    },
    bulk: [
      {
        key: 'download',
        label: 'Baixar',
        icon: 'download',
        variant: 'default',
        onPress: async (ids) => {
          // Download multiple files
          console.log('Download files:', ids)
        },
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (count) => `Deseja excluir ${count} ${count === 1 ? 'arquivo' : 'arquivos'}?`,
        },
        onPress: async (ids, { batchDeleteAsync }) => {
          await batchDeleteAsync({ ids: Array.from(ids) })
        },
      },
    ],
  },
}
