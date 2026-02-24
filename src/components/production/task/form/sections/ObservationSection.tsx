/**
 * Observation Section Component
 * Handles observation notes and related files
 */

import React, { useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField } from '@/components/ui';
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
  const { control } = useFormContext();
  const [observationFiles, setObservationFiles] = useState<FilePickerItem[]>(initialFiles);
  const keyboardContext = useKeyboardAwareForm();

  return (
    <FormCard title="Observações" icon="note">
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
    </FormCard>
  );
}