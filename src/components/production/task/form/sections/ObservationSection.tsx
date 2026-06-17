/**
 * Observation Section Component
 * Handles observation notes and related files
 */

import React, { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField, Button, ThemedText } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react-native';
import { Textarea } from '@/components/ui/textarea';
import { FilePicker, type FilePickerItem } from '@/components/ui/file-picker';
import { useKeyboardAwareForm } from '@/contexts/KeyboardAwareFormContext';

interface ObservationSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  initialFiles?: FilePickerItem[];
}

export default function ObservationSection({
  isSubmitting = false,
  errors = {},
  initialFiles = []
}: ObservationSectionProps) {
  const { control, setValue } = useFormContext();
  const [observationFiles, setObservationFiles] = useState<FilePickerItem[]>(initialFiles);
  const keyboardContext = useKeyboardAwareForm();

  // Watch the description so the "remove" affordance only shows when there's data
  const observationDescription = useWatch({ control, name: 'observation.description' });
  const hasObservationData = !!(observationDescription?.trim()) || observationFiles.length > 0;

  // Clearing the description normalizes the observation to null on submit (the API
  // deletes it), so removing = wiping description + files.
  const handleRemoveObservation = () => {
    setObservationFiles([]);
    setValue('observation.description', '', { shouldDirty: true, shouldValidate: true });
    setValue('observation.fileIds', [], { shouldDirty: true, shouldValidate: true });
  };

  return (
    <FormCard title="Observações" icon="note">
      {/* Privacy warning - observation data is visible to the whole company */}
      <Alert variant="warning" icon={IconAlertTriangle} style={{ marginBottom: 12 }}>
        <AlertDescription>
          Ao enviar, os dados desta observação (descrição e arquivos) serão compartilhados com todos os usuários da empresa.
        </AlertDescription>
      </Alert>

      {/* Observation Description */}
      <SimpleFormField label="Descrição da Observação" error={errors.observation?.description}>
        <View onLayout={keyboardContext ? (e: LayoutChangeEvent) => keyboardContext.onFieldLayout('observation.description', e) : undefined}>
          <Controller
            control={control}
            name="observation.description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Textarea
                value={value || ""}
                onChangeText={onChange}
                onBlur={onBlur}
                onFocus={() => keyboardContext?.onFieldFocus('observation.description')}
                placeholder="Adicione observações importantes sobre a tarefa..."
                numberOfLines={4}
                error={!!errors.observation?.description}
                editable={!isSubmitting}
              />
            )}
          />
        </View>
      </SimpleFormField>

      {/* Observation Files */}
      <SimpleFormField label="Arquivos de Observação" error={errors.observation?.fileIds}>
        <Controller
          control={control}
          name="observation.fileIds"
          render={({ field: { onChange, value } }) => (
            <FilePicker
              value={observationFiles}
              onChange={(files) => {
                setObservationFiles(files);
                onChange(files.map(f => f.id).filter(Boolean));
              }}
              maxFiles={10}
              placeholder="Adicionar arquivos de observação"
              helperText="Arquivos relacionados às observações"
              showCamera={true}
              showVideoCamera={true}
              showGallery={true}
              showFilePicker={true}
              disabled={isSubmitting}
            />
          )}
        />
      </SimpleFormField>

      {/* Remove the entire observation (the API deletes it when description is cleared) */}
      {hasObservationData && (
        <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onPress={handleRemoveObservation}
            icon={<IconTrash size={16} color="#dc2626" />}
          >
            <ThemedText style={{ color: '#dc2626' }}>Remover Observação</ThemedText>
          </Button>
        </View>
      )}
    </FormCard>
  );
}