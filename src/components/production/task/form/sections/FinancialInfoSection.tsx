/**
 * Financial Information Section Component
 * Handles financial documents upload (pricing, invoice, receipts)
 *
 * File changes are tracked via react-hook-form ID array fields (budgetIds, invoiceIds,
 * receiptIds, bankSlipIds) matching the web pattern. The FilePicker stores full file
 * objects locally, while IDs are extracted and written to the form for submission.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFormContext } from 'react-hook-form';
import { FormCard } from '@/components/ui/form-section';
import { SimpleFormField } from '@/components/ui';
import { FilePicker, type FilePickerItem } from '@/components/ui/file-picker';
import { useAuth } from '@/hooks/useAuth';
import { SECTOR_PRIVILEGES } from '@/constants';

interface FinancialInfoSectionProps {
  isSubmitting?: boolean;
  errors?: any;
  initialPricingFiles?: FilePickerItem[];
  initialInvoiceFiles?: FilePickerItem[];
  initialReceiptFiles?: FilePickerItem[];
  initialBankSlipFiles?: FilePickerItem[];
}

/** Extract IDs from file picker items */
function extractFileIds(files: FilePickerItem[]): string[] {
  return files
    .map((f: any) => f.fileId || f.file?.id || f.id)
    .filter(Boolean);
}

export default function FinancialInfoSection({
  isSubmitting = false,
  errors = {},
  initialPricingFiles = [],
  initialInvoiceFiles = [],
  initialReceiptFiles = [],
  initialBankSlipFiles = [],
}: FinancialInfoSectionProps) {
  const { setValue } = useFormContext();
  const { user } = useAuth();

  // Only show for Admin and Financial users
  const userPrivilege = user?.sector?.privileges;
  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isFinancialUser = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

  // Local state for FilePicker display
  const [budgetFiles, setBudgetFiles] = useState<FilePickerItem[]>(initialPricingFiles);
  const [invoiceFiles, setInvoiceFiles] = useState<FilePickerItem[]>(initialInvoiceFiles);
  const [receiptFiles, setReceiptFiles] = useState<FilePickerItem[]>(initialReceiptFiles);
  const [bankSlipFiles, setBankSlipFiles] = useState<FilePickerItem[]>(initialBankSlipFiles);

  // Handlers that sync file IDs to react-hook-form
  const handleBudgetFilesChange = useCallback((files: FilePickerItem[]) => {
    setBudgetFiles(files);
    setValue('budgetIds', extractFileIds(files), { shouldDirty: true });
  }, [setValue]);

  const handleInvoiceFilesChange = useCallback((files: FilePickerItem[]) => {
    setInvoiceFiles(files);
    setValue('invoiceIds', extractFileIds(files), { shouldDirty: true });
  }, [setValue]);

  const handleReceiptFilesChange = useCallback((files: FilePickerItem[]) => {
    setReceiptFiles(files);
    setValue('receiptIds', extractFileIds(files), { shouldDirty: true });
  }, [setValue]);

  const handleBankSlipFilesChange = useCallback((files: FilePickerItem[]) => {
    setBankSlipFiles(files);
    setValue('bankSlipIds', extractFileIds(files), { shouldDirty: true });
  }, [setValue]);

  if (!isAdminUser && !isFinancialUser) {
    return null;
  }

  return (
    <FormCard title="Informações Financeiras" icon="IconFileInvoice">
      {/* Pricing/Budget Files */}
      <SimpleFormField
        label="Arquivos de Orçamento"
        helperText="Upload de arquivos de orçamento"
        error={errors.budgetIds}
      >
        <FilePicker
          value={budgetFiles}
          onChange={handleBudgetFilesChange}
          acceptedFileTypes={["application/pdf", "image/*", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]}
          maxFiles={10}
          disabled={isSubmitting}
          error={errors.budgetIds?.message}
        />
      </SimpleFormField>

      {/* Invoice/NFe Files */}
      <SimpleFormField
        label="Notas Fiscais"
        helperText="Upload de notas fiscais eletrônicas (NFe)"
        error={errors.invoiceIds}
      >
        <FilePicker
          value={invoiceFiles}
          onChange={handleInvoiceFilesChange}
          acceptedFileTypes={["application/pdf", "text/xml", "application/xml"]}
          maxFiles={10}
          disabled={isSubmitting}
          error={errors.invoiceIds?.message}
        />
      </SimpleFormField>

      {/* Receipt Files */}
      <SimpleFormField
        label="Recibos"
        helperText="Upload de recibos e comprovantes"
        error={errors.receiptFiles}
      >
        <FilePicker
          value={receiptFiles}
          onChange={handleReceiptFilesChange}
          acceptedFileTypes={["application/pdf", "image/*"]}
          maxFiles={10}
          disabled={isSubmitting}
          error={errors.receiptFiles?.message}
        />
      </SimpleFormField>

      {/* Bank Slip Files */}
      <SimpleFormField
        label="Boletos"
        helperText="Upload de boletos bancários"
        error={errors.bankSlipIds}
      >
        <FilePicker
          value={bankSlipFiles}
          onChange={handleBankSlipFilesChange}
          acceptedFileTypes={["application/pdf", "image/*"]}
          maxFiles={10}
          disabled={isSubmitting}
          error={errors.bankSlipIds?.message}
        />
      </SimpleFormField>
    </FormCard>
  );
}

const styles = StyleSheet.create({
  // Add any specific styles if needed
});
