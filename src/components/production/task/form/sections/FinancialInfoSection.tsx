/**
 * Financial Information Section Component
 * Handles financial documents upload (pricing, invoice, receipts)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
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

export default function FinancialInfoSection({
  isSubmitting = false,
  errors = {},
  initialPricingFiles = [],
  initialInvoiceFiles = [],
  initialReceiptFiles = [],
  initialBankSlipFiles = [],
}: FinancialInfoSectionProps) {
  const { control } = useFormContext();
  const { user } = useAuth();

  // Only show for Admin and Financial users
  const userPrivilege = user?.sector?.privileges;
  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isFinancialUser = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

  if (!isAdminUser && !isFinancialUser) {
    return null;
  }

  return (
    <FormCard title="Informações Financeiras" icon="IconFileInvoice">
      {/* Pricing/Budget Files */}
      <SimpleFormField
        label="Arquivos de Orçamento"
        helperText="Upload de arquivos de orçamento"
        error={errors.pricingFiles}
      >
        <Controller
          control={control}
          name="pricingFiles"
          render={({ field: { onChange, value } }) => (
            <FilePicker
              value={value || initialPricingFiles}
              onChange={onChange}
              acceptedFileTypes={["application/pdf", "image/*", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]}
              maxFiles={10}
              disabled={isSubmitting}
              error={errors.pricingFiles?.message}
            />
          )}
        />
      </SimpleFormField>

      {/* Invoice/NFe Files */}
      <SimpleFormField
        label="Notas Fiscais"
        helperText="Upload de notas fiscais eletrônicas (NFe)"
        error={errors.invoiceFiles}
      >
        <Controller
          control={control}
          name="invoiceFiles"
          render={({ field: { onChange, value } }) => (
            <FilePicker
              value={value || initialInvoiceFiles}
              onChange={onChange}
              acceptedFileTypes={["application/pdf", "text/xml", "application/xml"]}
              maxFiles={10}
              disabled={isSubmitting}
              error={errors.invoiceFiles?.message}
            />
          )}
        />
      </SimpleFormField>

      {/* Receipt Files */}
      <SimpleFormField
        label="Recibos"
        helperText="Upload de recibos e comprovantes"
        error={errors.receiptFiles}
      >
        <Controller
          control={control}
          name="receiptFiles"
          render={({ field: { onChange, value } }) => (
            <FilePicker
              value={value || initialReceiptFiles}
              onChange={onChange}
              acceptedFileTypes={["application/pdf", "image/*"]}
              maxFiles={10}
              disabled={isSubmitting}
              error={errors.receiptFiles?.message}
            />
          )}
        />
      </SimpleFormField>

      {/* Bank Slip Files */}
      <SimpleFormField
        label="Boletos"
        helperText="Upload de boletos bancários"
        error={errors.bankSlipFiles}
      >
        <Controller
          control={control}
          name="bankSlipFiles"
          render={({ field: { onChange, value } }) => (
            <FilePicker
              value={value || initialBankSlipFiles}
              onChange={onChange}
              acceptedFileTypes={["application/pdf", "image/*"]}
              maxFiles={10}
              disabled={isSubmitting}
              error={errors.bankSlipFiles?.message}
            />
          )}
        />
      </SimpleFormField>
    </FormCard>
  );
}

const styles = StyleSheet.create({
  // Add any specific styles if needed
});