import React, { useState, useCallback, useMemo } from 'react'
import { View, StyleSheet, Alert, Image, ScrollView } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormCard } from '@/components/ui/form-section'
import { FilePicker, type FilePickerItem } from '@/components/ui/file-picker'
import { FormSkeleton } from '@/components/ui/form-skeleton'
import { MultiStepFormContainer } from '@/components/forms'
import { useTaskMutations, useTaskDetail, useScreenReady } from '@/hooks'
import { useAuth } from '@/contexts/auth-context'
import { navigationTracker } from '@/utils/navigation-tracker'
import { useTheme } from '@/lib/theme'
import { TASK_STATUS } from '@/constants'
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE } from '@/constants/enums'
import { spacing, fontSize } from '@/constants/design-system'
import { canViewCheckinCheckout } from '@/utils/permissions/entity-permissions'
import { getApiBaseUrl } from '@/utils/file'
import { rewriteCdnUrl } from '@/utils/file-viewer-utils'
import { uploadSingleFile } from '@/api-client'
import type { File as AnkaaFile } from '@/types'
import type { FormStep } from '@/components/ui/form-steps'

/** Convert a File entity to a FilePickerItem */
function fileToPickerItem(file: AnkaaFile): FilePickerItem {
  return {
    uri: (file as any).url || '',
    name: file.filename || file.originalName || 'file',
    type: file.mimetype || 'application/octet-stream',
    size: file.size,
    mimeType: file.mimetype,
    id: file.id,
    uploaded: true,
    thumbnailUrl: file.thumbnailUrl || undefined,
  }
}

export default function CheckinCheckoutScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { colors } = useTheme()
  const { updateAsync, isLoading: isSaving } = useTaskMutations()

  const [checkingPermission, setCheckingPermission] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Permission check
  const canAccess = canViewCheckinCheckout(user)

  React.useEffect(() => {
    if (user !== undefined) {
      setCheckingPermission(false)
      if (!canAccess) {
        Alert.alert('Acesso negado', 'Você não tem permissão para acessar check-in/check-out.')
        router.replace('/(tabs)/producao/cronograma')
      }
    }
  }, [user, canAccess, router])

  // Fetch task with service orders + checkin/checkout files
  const {
    data: response,
    isLoading: isLoadingTask,
    error,
  } = useTaskDetail(id!, {
    include: {
      customer: {
        select: { id: true, fantasyName: true },
      },
      serviceOrders: {
        select: {
          id: true,
          description: true,
          status: true,
          type: true,
          checkinFiles: { select: { id: true, filename: true, mimetype: true, size: true, thumbnailUrl: true } },
          checkoutFiles: { select: { id: true, filename: true, mimetype: true, size: true, thumbnailUrl: true } },
        },
      },
    },
  })

  useScreenReady(!isLoadingTask)

  const task = response?.data

  // Active production service orders (non-cancelled)
  const activeServiceOrders = useMemo(
    () =>
      (task?.serviceOrders || []).filter(
        (so: any) =>
          so.id &&
          so.type === SERVICE_ORDER_TYPE.PRODUCTION &&
          so.status !== SERVICE_ORDER_STATUS?.CANCELLED
      ),
    [task?.serviceOrders]
  )

  // Per-service-order file state
  const [checkinFilesByServiceOrder, setCheckinFilesByServiceOrder] = useState<
    Record<string, FilePickerItem[]>
  >({})
  const [checkoutFilesByServiceOrder, setCheckoutFilesByServiceOrder] = useState<
    Record<string, FilePickerItem[]>
  >({})
  const [initialized, setInitialized] = useState(false)

  // Initialize file state from task data once loaded
  React.useEffect(() => {
    if (task && !initialized) {
      const checkinMap: Record<string, FilePickerItem[]> = {}
      const checkoutMap: Record<string, FilePickerItem[]> = {}
      for (const so of task.serviceOrders || []) {
        if (so.id) {
          checkinMap[so.id] = ((so as any).checkinFiles || []).map((f: any) => fileToPickerItem(f))
          checkoutMap[so.id] = ((so as any).checkoutFiles || []).map((f: any) => fileToPickerItem(f))
        }
      }
      setCheckinFilesByServiceOrder(checkinMap)
      setCheckoutFilesByServiceOrder(checkoutMap)
      setInitialized(true)
    }
  }, [task, initialized])

  const isCompleted = task?.status === TASK_STATUS.COMPLETED

  // Steps based on task status:
  // Not completed → Check-in + Overview
  // Completed → Check-out + Overview
  const steps: FormStep[] = useMemo(() => {
    if (isCompleted) {
      return [
        { id: 1, name: 'Check-out', description: 'Fotos de saída' },
        { id: 2, name: 'Resumo', description: 'Visão geral' },
      ]
    }
    return [
      { id: 1, name: 'Check-in', description: 'Fotos de entrada' },
      { id: 2, name: 'Resumo', description: 'Visão geral' },
    ]
  }, [isCompleted])

  const totalSteps = steps.length

  const handleCheckinFilesChange = useCallback((serviceOrderId: string, files: FilePickerItem[]) => {
    setCheckinFilesByServiceOrder((prev) => ({ ...prev, [serviceOrderId]: files }))
    setHasChanges(true)
  }, [])

  const handleCheckoutFilesChange = useCallback((serviceOrderId: string, files: FilePickerItem[]) => {
    setCheckoutFilesByServiceOrder((prev) => ({ ...prev, [serviceOrderId]: files }))
    setHasChanges(true)
  }, [])

  const getThumbnailUri = useCallback((file: FilePickerItem) => {
    const apiBase = getApiBaseUrl()
    if (file.thumbnailUrl) {
      if (file.thumbnailUrl.startsWith('/api')) return `${apiBase}${file.thumbnailUrl}`
      if (file.thumbnailUrl.startsWith('http')) return rewriteCdnUrl(file.thumbnailUrl)
      return file.thumbnailUrl
    }
    if (file.uri) return file.uri
    if (file.id) return `${apiBase}/files/thumbnail/${file.id}`
    return ''
  }, [])

  const handleNavigateBack = useCallback(() => {
    const source = navigationTracker.getSource()
    if (source) {
      router.replace(source as any)
    } else {
      router.replace(`/(tabs)/producao/cronograma/detalhes/${id}` as any)
    }
  }, [router, id])

  const goNext = useCallback(() => {
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1)
  }, [currentStep, totalSteps])

  const goPrev = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }, [currentStep])

  const handleSave = useCallback(async () => {
    if (!id || !task) return

    try {
      const customerName = task.customer?.fantasyName || ''

      // Pre-upload new files per service order, then build JSON-only payload
      // This ensures file IDs are properly associated with their service orders
      const serviceOrders = await Promise.all(
        activeServiceOrders.map(async (so: any) => {
          const soCheckinFiles = checkinFilesByServiceOrder[so.id] || []
          const soCheckoutFiles = checkoutFilesByServiceOrder[so.id] || []

          // Separate existing files from new files
          const existingCheckinIds = soCheckinFiles
            .filter((f: any) => f.id || f.fileId)
            .map((f: any) => f.fileId || f.file?.id || f.id)
            .filter(Boolean)
          const existingCheckoutIds = soCheckoutFiles
            .filter((f: any) => f.id || f.fileId)
            .map((f: any) => f.fileId || f.file?.id || f.id)
            .filter(Boolean)

          const newCheckinFiles = soCheckinFiles.filter((f: any) => !f.id && !f.fileId && f.uri)
          const newCheckoutFiles = soCheckoutFiles.filter((f: any) => !f.id && !f.fileId && f.uri)

          // Pre-upload new checkin files
          const uploadedCheckinIds = await Promise.all(
            newCheckinFiles.map(async (file: FilePickerItem) => {
              const res = await uploadSingleFile(
                { uri: file.uri, name: file.name || `checkin_${Date.now()}.jpg`, type: file.type || file.mimeType || 'image/jpeg' },
                { entityType: 'task', entityId: id, fileContext: 'serviceOrderCheckinFiles', customerName }
              )
              return res?.data?.id || res?.id
            })
          )

          // Pre-upload new checkout files
          const uploadedCheckoutIds = await Promise.all(
            newCheckoutFiles.map(async (file: FilePickerItem) => {
              const res = await uploadSingleFile(
                { uri: file.uri, name: file.name || `checkout_${Date.now()}.jpg`, type: file.type || file.mimeType || 'image/jpeg' },
                { entityType: 'task', entityId: id, fileContext: 'serviceOrderCheckoutFiles', customerName }
              )
              return res?.data?.id || res?.id
            })
          )

          return {
            id: so.id,
            description: so.description,
            status: so.status || 'PENDING',
            type: so.type,
            checkinFileIds: [...existingCheckinIds, ...uploadedCheckinIds.filter(Boolean)],
            checkoutFileIds: [...existingCheckoutIds, ...uploadedCheckoutIds.filter(Boolean)],
          }
        })
      )

      // Always send as JSON - files are already uploaded with proper IDs
      const result = await updateAsync({ id, data: { serviceOrders } })

      if (result.success) {
        handleNavigateBack()
      } else {
        Alert.alert(
          'Erro ao salvar',
          result?.message || 'Não foi possível salvar as fotos. Tente novamente.'
        )
      }
    } catch (error: any) {
      console.error('[CheckinCheckout] Error saving:', error)
      Alert.alert('Erro', 'Ocorreu um erro ao salvar. Tente novamente.')
    }
  }, [id, task, activeServiceOrders, checkinFilesByServiceOrder, checkoutFilesByServiceOrder, updateAsync, handleNavigateBack])

  // Compute totals for overview
  const totals = useMemo(() => {
    let totalCheckin = 0
    let totalCheckout = 0
    for (const so of activeServiceOrders) {
      totalCheckin += (checkinFilesByServiceOrder[so.id] || []).length
      totalCheckout += (checkoutFilesByServiceOrder[so.id] || []).length
    }
    return { totalCheckin, totalCheckout }
  }, [activeServiceOrders, checkinFilesByServiceOrder, checkoutFilesByServiceOrder])

  // Loading / permission check
  if (checkingPermission || !user || !canAccess) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Check-in / Check-out', headerBackTitle: 'Voltar', headerShown: true }} />
        <FormSkeleton cards={[{ title: true, titleWidth: '40%', fields: 2 }, { title: true, titleWidth: '40%', fields: 2 }]} />
      </ThemedView>
    )
  }

  if (isLoadingTask || !initialized) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Check-in / Check-out', headerBackTitle: 'Voltar', headerShown: true }} />
        <FormSkeleton cards={[{ title: true, titleWidth: '40%', fields: 2 }, { title: true, titleWidth: '40%', fields: 2 }]} />
      </ThemedView>
    )
  }

  if (error || !task) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Check-in / Check-out', headerBackTitle: 'Voltar', headerShown: true }} />
        <View style={styles.centered}>
          <ThemedText style={styles.errorTitle}>Tarefa não encontrada</ThemedText>
          <ThemedText style={[styles.errorSubtitle, { color: colors.mutedForeground }]}>
            A tarefa que você está procurando não existe ou foi removida.
          </ThemedText>
          <Button onPress={handleNavigateBack}>
            <ThemedText style={{ color: '#fff' }}>Voltar</ThemedText>
          </Button>
        </View>
      </ThemedView>
    )
  }

  const isOverviewStep = currentStep === totalSteps

  // Determine what step 1 shows based on task status
  const isCheckinStep = !isCompleted && currentStep === 1
  const isCheckoutStep = isCompleted && currentStep === 1

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Check-in / Check-out',
          headerBackTitle: 'Voltar',
          headerShown: true,
        }}
      />

      <MultiStepFormContainer
        steps={steps}
        currentStep={currentStep}
        onPrevStep={goPrev}
        onNextStep={goNext}
        onSubmit={handleSave}
        onCancel={handleNavigateBack}
        isSubmitting={isSaving}
        canProceed={true}
        canSubmit={hasChanges}
        submitLabel="Salvar"
        cancelLabel="Cancelar"
      >
        {/* Check-in step (only when task NOT completed) */}
        {isCheckinStep && (
          <View style={styles.stepContent}>
            {activeServiceOrders.length > 0 ? (
              <FormCard title="Check-in" icon="IconCamera" subtitle="Fotos de entrada por ordem de serviço">
                {activeServiceOrders.map((so: any) => {
                  const soFiles = checkinFilesByServiceOrder[so.id] || []
                  return (
                    <View key={`checkin-${so.id}`} style={styles.serviceOrderGroup}>
                      <View style={styles.serviceOrderHeader}>
                        <ThemedText style={styles.serviceOrderLabel}>{so.description}</ThemedText>
                        <ThemedText style={[styles.fileCount, { color: colors.mutedForeground }]}>
                          {soFiles.length} foto(s)
                        </ThemedText>
                      </View>
                      <FilePicker
                        value={soFiles}
                        onChange={(files) => handleCheckinFilesChange(so.id, files)}
                        maxFiles={20}
                        placeholder="Adicionar fotos de check-in"
                        showCamera={true}
                        showVideoCamera={false}
                        showGallery={true}
                        showFilePicker={false}
                        disabled={isSaving}
                        previewSize={56}
                      />
                    </View>
                  )
                })}
              </FormCard>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Nenhuma ordem de serviço de produção ativa encontrada.
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Check-out step (only when task IS completed) */}
        {isCheckoutStep && (
          <View style={styles.stepContent}>
            {activeServiceOrders.length > 0 ? (
              <FormCard title="Check-out" icon="IconCameraCheck" subtitle="Fotos de saída por ordem de serviço">
                {activeServiceOrders.map((so: any) => {
                  const soCheckinFiles = checkinFilesByServiceOrder[so.id] || []
                  const soCheckoutFiles = checkoutFilesByServiceOrder[so.id] || []
                  const checkinCount = soCheckinFiles.length
                  const checkoutCount = soCheckoutFiles.length
                  const needsMore = checkinCount > 0 && checkoutCount < checkinCount
                  return (
                    <View key={`checkout-${so.id}`} style={styles.serviceOrderGroup}>
                      <View style={styles.serviceOrderHeader}>
                        <ThemedText style={styles.serviceOrderLabel}>{so.description}</ThemedText>
                        {needsMore && (
                          <ThemedText style={[styles.fileCount, { color: '#d97706' }]}>
                            falta {checkinCount - checkoutCount}
                          </ThemedText>
                        )}
                      </View>
                      {/* Checkin reference thumbnails (like web - above the checkout picker) */}
                      {soCheckinFiles.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.referenceScroll}
                        >
                          {soCheckinFiles.map((file, index) => {
                            const src = getThumbnailUri(file)
                            return (
                              <View
                                key={file.id || file.uri || `ref-${index}`}
                                style={[styles.referenceThumbnail, { borderColor: colors.border }]}
                              >
                                {src ? (
                                  <Image source={{ uri: src }} style={styles.referenceImage} />
                                ) : (
                                  <View style={[styles.referencePlaceholder, { backgroundColor: colors.border }]} />
                                )}
                              </View>
                            )
                          })}
                        </ScrollView>
                      )}
                      <FilePicker
                        value={soCheckoutFiles}
                        onChange={(files) => handleCheckoutFilesChange(so.id, files)}
                        maxFiles={20}
                        placeholder="Adicionar fotos de check-out"
                        showCamera={true}
                        showVideoCamera={false}
                        showGallery={true}
                        showFilePicker={false}
                        disabled={isSaving}
                        previewSize={56}
                      />
                    </View>
                  )
                })}
              </FormCard>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Nenhuma ordem de serviço de produção ativa encontrada.
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Overview step (last step for both flows) */}
        {isOverviewStep && (
          <View style={styles.stepContent}>
            <Card style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <CardHeader>
                <CardTitle>
                  <ThemedText style={styles.overviewTitle}>Resumo</ThemedText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ThemedText style={[styles.overviewSubtitle, { color: colors.mutedForeground }]}>
                  {task.name}{task.customer?.fantasyName ? ` - ${task.customer.fantasyName}` : ''}
                </ThemedText>

                {activeServiceOrders.map((so: any) => {
                  const soCheckinFiles = checkinFilesByServiceOrder[so.id] || []
                  const soCheckoutFiles = checkoutFilesByServiceOrder[so.id] || []
                  return (
                    <View key={`overview-${so.id}`} style={[styles.overviewSection, { borderColor: colors.border }]}>
                      <ThemedText style={styles.overviewSoLabel}>{so.description}</ThemedText>

                      {/* Check-in summary */}
                      <View style={styles.overviewRow}>
                        <ThemedText style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Check-in:</ThemedText>
                        <ThemedText style={styles.overviewValue}>{soCheckinFiles.length} foto(s)</ThemedText>
                      </View>
                      {soCheckinFiles.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.overviewThumbnails}>
                          {soCheckinFiles.map((file, index) => {
                            const src = getThumbnailUri(file)
                            return (
                              <View key={file.id || file.uri || `ci-${index}`} style={[styles.overviewThumb, { borderColor: colors.border }]}>
                                {src ? <Image source={{ uri: src }} style={styles.overviewThumbImage} /> : <View style={[styles.referencePlaceholder, { backgroundColor: colors.border }]} />}
                              </View>
                            )
                          })}
                        </ScrollView>
                      )}

                      {/* Check-out summary */}
                      {isCompleted && (
                        <>
                          <View style={styles.overviewRow}>
                            <ThemedText style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Check-out:</ThemedText>
                            <ThemedText style={styles.overviewValue}>{soCheckoutFiles.length} foto(s)</ThemedText>
                          </View>
                          {soCheckoutFiles.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.overviewThumbnails}>
                              {soCheckoutFiles.map((file, index) => {
                                const src = getThumbnailUri(file)
                                return (
                                  <View key={file.id || file.uri || `co-${index}`} style={[styles.overviewThumb, { borderColor: colors.border }]}>
                                    {src ? <Image source={{ uri: src }} style={styles.overviewThumbImage} /> : <View style={[styles.referencePlaceholder, { backgroundColor: colors.border }]} />}
                                  </View>
                                )
                              })}
                            </ScrollView>
                          )}
                        </>
                      )}
                    </View>
                  )
                })}

                {/* Totals */}
                <View style={[styles.overviewTotals, { borderColor: colors.border }]}>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewTotalLabel}>Total check-in:</ThemedText>
                    <ThemedText style={styles.overviewTotalValue}>{totals.totalCheckin} foto(s)</ThemedText>
                  </View>
                  {isCompleted && (
                    <View style={styles.overviewRow}>
                      <ThemedText style={styles.overviewTotalLabel}>Total check-out:</ThemedText>
                      <ThemedText style={styles.overviewTotalValue}>{totals.totalCheckout} foto(s)</ThemedText>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </MultiStepFormContainer>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContent: {
    gap: spacing.md,
  },
  serviceOrderGroup: {
    marginBottom: spacing.md,
  },
  serviceOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  serviceOrderLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  fileCount: {
    fontSize: fontSize.xs,
  },
  referenceScroll: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  referenceThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    opacity: 0.6,
    marginRight: spacing.xs,
  },
  referenceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  referencePlaceholder: {
    width: '100%',
    height: '100%',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  overviewCard: {
    borderWidth: 1,
    borderRadius: 12,
  },
  overviewTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  overviewSubtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  overviewSection: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    marginBottom: spacing.xs,
  },
  overviewSoLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  overviewLabel: {
    fontSize: fontSize.sm,
  },
  overviewValue: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  overviewThumbnails: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  overviewThumb: {
    width: 52,
    height: 52,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  overviewThumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overviewTotals: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  overviewTotalLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  overviewTotalValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
})
