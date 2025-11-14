import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { orderUpdateSchema } from '@/schemas';
import type { OrderUpdateFormData } from '@/schemas';
import { useOrderMutations, useOrder, useSuppliers} from '@/hooks';
import { ThemedText } from '@/components/ui/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useTheme } from '@/lib/theme';
import { showToast } from '@/lib/toast';

interface OrderEditFormProps {
  orderId: string;
  onSuccess?: () => void;
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({ orderId, onSuccess }) => {
  const theme = useTheme();
  const router = useRouter();

  const { data: order, isLoading: isLoadingOrder } = useOrder(orderId, {
    include: {
      supplier: true,
      items: {
        include: { item: { include: { brand: true, category: true } } },
      },
    },
  });

  const form = useForm<OrderUpdateFormData>({
    resolver: zodResolver(orderUpdateSchema),
    mode: 'onTouched',
  });

  const { updateAsync, isLoading } = useOrderMutations();
  const { data: suppliersResponse } = useSuppliers({
    orderBy: { fantasyName: 'asc' },
    take: 100,
  });
  const suppliers = suppliersResponse?.data || [];

  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        label: s.fantasyName || s.name,
        value: s.id,
      })),
    [suppliers]
  );

  // Load order data into form
  useEffect(() => {
    if (order) {
      form.reset({
        description: order.description,
        supplierId: order.supplierId || undefined,
        forecast: order.forecast ? new Date(order.forecast) : undefined,
        notes: order.notes || '',
      });
    }
  }, [order, form]);

  const handleSubmit = useCallback(
    async (data: OrderUpdateFormData) => {
      try {
        // Only send changed fields
        const changedData: Partial<OrderUpdateFormData> = {};

        if (data.description !== order?.description) {
          changedData.description = data.description;
        }
        if (data.supplierId !== order?.supplierId) {
          changedData.supplierId = data.supplierId;
        }
        if (data.forecast?.getTime() !== order?.forecast?.getTime()) {
          changedData.forecast = data.forecast;
        }
        if (data.notes !== order?.notes) {
          changedData.notes = data.notes;
        }

        if (Object.keys(changedData).length === 0) {
          Alert.alert('Aviso', 'Nenhuma alteração foi feita');
          return;
        }

        const result = await updateAsync({ id: orderId, data: changedData });

        if (result.success) {
          showToast({
            type: 'success',
            message: 'Pedido atualizado com sucesso!',
          });

          if (onSuccess) {
            onSuccess();
          } else {
            router.back();
          }
        }
      } catch (error) {
        console.error('Error updating order:', error);
        Alert.alert('Erro', 'Falha ao atualizar pedido');
      }
    },
    [orderId, order, updateAsync, onSuccess, router]
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    field: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium as any,
      marginBottom: theme.spacing.xs,
      color: theme.colors.textSecondary,
    },
    required: {
      color: theme.colors.error,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionButton: {
      flex: 1,
    },
    itemsNote: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.muted,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.md,
    },
  });

  if (isLoadingOrder) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Carregando...</ThemedText>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>Pedido não encontrado</ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <View style={styles.field}>
            <ThemedText style={styles.label}>
              Descrição <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Ex: Pedido de materiais de escritório"
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Fornecedor</ThemedText>
            <Controller
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  options={supplierOptions}
                  placeholder="Selecione um fornecedor (opcional)"
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Previsão de Entrega</ThemedText>
            <Controller
              control={form.control}
              name="forecast"
              render={({ field }) => (
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  mode="date"
                  placeholder="Selecione uma data"
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Observações</ThemedText>
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Input
                  value={field.value || ''}
                  onChangeText={field.onChange}
                  placeholder="Observações sobre o pedido (opcional)"
                  multiline
                  numberOfLines={4}
                />
              )}
            />
          </View>

          <View style={styles.itemsNote}>
            <ThemedText style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
              Nota: Para editar itens, quantidades ou preços, acesse a página de detalhes do pedido.
            </ThemedText>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={() => router.back()}
          style={styles.actionButton}
          disabled={isLoading}
        >
          <ThemedText>Cancelar</ThemedText>
        </Button>
        <Button
          onPress={form.handleSubmit(handleSubmit)}
          style={styles.actionButton}
          disabled={isLoading}
          loading={isLoading}
        >
          <ThemedText>Salvar</ThemedText>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};
