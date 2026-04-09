import React, { useState, useCallback, useMemo, useRef } from 'react'
import { View, StyleSheet, Alert, Image, ScrollView, TouchableOpacity } from 'react-native'
import { Stack, useLocalSearchParams, useRouter, usePathname } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { IconCamera, IconX } from '@tabler/icons-react-native'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormCard } from '@/components/ui/form-section'
import type { FilePickerItem } from '@/components/ui/file-picker'
import { FullCamera } from '@/components/ui/full-camera'
import { ImagePreviewModal } from '@/components/ui/image-preview-modal'
import { FormSkeleton } from '@/components/ui/form-skeleton'
import { MultiStepFormContainer } from '@/components/forms'
import { useTaskMutations, useTaskDetail, useScreenReady } from '@/hooks'
import { useAuth } from '@/contexts/auth-context'
import { navigationTracker } from '@/utils/navigation-tracker'
import { useTheme } from '@/lib/theme'
import { TASK_STATUS } from '@/constants'
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE } from '@/constants/enums'
import { spacing, fontSize, borderRadius } from '@/constants/design-system'
import { canViewCheckinCheckout } from '@/utils/permissions/entity-permissions'
import { getApiBaseUrl } from '@/utils/file'
import { rewriteCdnUrl } from '@/utils/file-viewer-utils'
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
  const pathname = usePathname()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { colors } = useTheme()
  const { updateAsync, isLoading: isSaving } = useTaskMutations()

  const navigation = useNavigation()
  const [checkingPermission, setCheckingPermission] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const savedSuccessfully = useRef(false)

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

  // Prevent accidental back navigation when there are unsaved changes
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges || savedSuccessfully.current) return
      e.preventDefault()
      Alert.alert(
        'Alterações não salvas',
        'Você tem fotos não salvas. Deseja sair sem salvar?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Sair sem salvar',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      )
    })
    return unsubscribe
  }, [navigation, hasChanges])

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

  // Image preview state
  const [previewImages, setPreviewImages] = useState<{ uri: string }[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewVisible, setPreviewVisible] = useState(false)

  const handlePreviewImage = useCallback((images: { uri: string }[], index: number) => {
    setPreviewImages(images)
    setPreviewIndex(index)
    setPreviewVisible(true)
  }, [])

  // Camera state: which service order is being photographed and for which phase
  const [cameraTarget, setCameraTarget] = useState<{
    serviceOrderId: string
    phase: 'checkin' | 'checkout'
  } | null>(null)
  // Track how many photos were added in the current camera session (for discard)
  const sessionPhotoCount = useRef(0)

  const handleOpenCamera = useCallback((serviceOrderId: string, phase: 'checkin' | 'checkout') => {
    sessionPhotoCount.current = 0
    setCameraTarget({ serviceOrderId, phase })
  }, [])

  const handleCameraCapture = useCallback(
    (uri: string) => {
      if (!cameraTarget) return
      const newFile: FilePickerItem = {
        uri,
        name: `${cameraTarget.phase}_${Date.now()}.jpg`,
        type: 'image/jpeg',
        mimeType: 'image/jpeg',
      }
      if (cameraTarget.phase === 'checkin') {
        setCheckinFilesByServiceOrder((prev) => ({
          ...prev,
          [cameraTarget.serviceOrderId]: [...(prev[cameraTarget.serviceOrderId] || []), newFile],
        }))
      } else {
        setCheckoutFilesByServiceOrder((prev) => ({
          ...prev,
          [cameraTarget.serviceOrderId]: [...(prev[cameraTarget.serviceOrderId] || []), newFile],
        }))
      }
      sessionPhotoCount.current += 1
      setHasChanges(true)
    },
    [cameraTarget]
  )

  // Concluído — keep photos and close camera
  const handleCameraClose = useCallback(() => {
    setCameraTarget(null)
  }, [])

  // X button — discard photos taken in this session
  const handleCameraDiscard = useCallback(() => {
    if (cameraTarget && sessionPhotoCount.current > 0) {
      const count = sessionPhotoCount.current
      if (cameraTarget.phase === 'checkin') {
        setCheckinFilesByServiceOrder((prev) => ({
          ...prev,
          [cameraTarget.serviceOrderId]: (prev[cameraTarget.serviceOrderId] || []).slice(0, -count),
        }))
      } else {
        setCheckoutFilesByServiceOrder((prev) => ({
          ...prev,
          [cameraTarget.serviceOrderId]: (prev[cameraTarget.serviceOrderId] || []).slice(0, -count),
        }))
      }
    }
    setCameraTarget(null)
  }, [cameraTarget])

  const handleRemoveFile = useCallback(
    (serviceOrderId: string, phase: 'checkin' | 'checkout', index: number) => {
      if (phase === 'checkin') {
        setCheckinFilesByServiceOrder((prev) => ({
          ...prev,
          [serviceOrderId]: (prev[serviceOrderId] || []).filter((_, i) => i !== index),
        }))
      } else {
        setCheckoutFilesByServiceOrder((prev) => ({
          ...prev,
          [serviceOrderId]: (prev[serviceOrderId] || []).filter((_, i) => i !== index),
        }))
      }
      setHasChanges(true)
    },
    []
  )

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

  const taskStatus = task?.status as string | undefined
  const isCompleted = taskStatus === TASK_STATUS.COMPLETED
  const showCheckout = isCompleted

  // Steps based on task status:
  // Not completed → Check-in + Resumo
  // COMPLETED → Check-in + Check-out + Resumo
  const steps: FormStep[] = useMemo(() => {
    if (showCheckout) {
      return [
        { id: 1, name: 'Check-in', description: 'Fotos de entrada' },
        { id: 2, name: 'Check-out', description: 'Fotos de saída' },
        { id: 3, name: 'Resumo', description: 'Visão geral' },
      ]
    }
    return [
      { id: 1, name: 'Check-in', description: 'Fotos de entrada' },
      { id: 2, name: 'Resumo', description: 'Visão geral' },
    ]
  }, [showCheckout])

  const totalSteps = steps.length

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
      // Infer the section from the current pathname for proper fallback
      let section = 'cronograma'
      if (pathname.includes('/agenda')) section = 'agenda'
      else if (pathname.includes('/historico')) section = 'historico'
      router.replace(`/(tabs)/producao/${section}/detalhes/${id}` as any)
    }
  }, [router, id, pathname])

  const goNext = useCallback(() => {
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1)
  }, [currentStep, totalSteps])

  const goPrev = useCallback(() => {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }, [currentStep])

  const handleSave = useCallback(async () => {
    if (!id || !task) return

    try {
      const formData = new FormData()
      const soFileMapping: { soId: string; type: 'checkin' | 'checkout'; count: number }[] = []
      const serviceOrderFiles: Record<string, { checkinFileIds?: string[]; checkoutFileIds?: string[] }> = {}

      for (const so of activeServiceOrders) {
        const soCheckinFiles = checkinFilesByServiceOrder[so.id] || []
        const soCheckoutFiles = checkoutFilesByServiceOrder[so.id] || []

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

        if (newCheckinFiles.length > 0) {
          for (const file of newCheckinFiles) {
            formData.append('soCheckinFiles', {
              uri: file.uri,
              name: file.name || `checkin_${Date.now()}.jpg`,
              type: file.type || file.mimeType || 'image/jpeg',
            } as any)
          }
          soFileMapping.push({ soId: so.id, type: 'checkin', count: newCheckinFiles.length })
        }

        if (newCheckoutFiles.length > 0) {
          for (const file of newCheckoutFiles) {
            formData.append('soCheckoutFiles', {
              uri: file.uri,
              name: file.name || `checkout_${Date.now()}.jpg`,
              type: file.type || file.mimeType || 'image/jpeg',
            } as any)
          }
          soFileMapping.push({ soId: so.id, type: 'checkout', count: newCheckoutFiles.length })
        }

        const origCheckin = ((so as any).checkinFiles || []).length > 0
        const origCheckout = ((so as any).checkoutFiles || []).length > 0
        const hasExisting = existingCheckinIds.length > 0 || existingCheckoutIds.length > 0
        const hasNew = newCheckinFiles.length > 0 || newCheckoutFiles.length > 0
        const hadFiles = origCheckin || origCheckout

        if (hasExisting || hasNew || hadFiles) {
          serviceOrderFiles[so.id] = {
            checkinFileIds: existingCheckinIds,
            checkoutFileIds: existingCheckoutIds,
          }
        }
      }

      formData.append('_soFileMapping', JSON.stringify(soFileMapping))
      formData.append('serviceOrderFiles', JSON.stringify(serviceOrderFiles))

      const result = await updateAsync({ id, data: formData })

      if (result.success) {
        savedSuccessfully.current = true
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

  // Check-in is always step 1; check-out is step 2 when IN_PRODUCTION or COMPLETED
  const isCheckinStep = currentStep === 1
  const isCheckoutStep = showCheckout && currentStep === 2

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
                      {/* Thumbnails */}
                      {soFiles.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
                          {soFiles.map((file, index) => (
                            <View key={file.id || file.uri || `ci-${index}`} style={[styles.thumbnailWrapper]}>
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handlePreviewImage(
                                  soFiles.map((f) => ({ uri: f.uploaded && f.thumbnailUrl ? getThumbnailUri(f) : f.uri })),
                                  index
                                )}
                              >
                                <Image
                                  source={{ uri: file.uploaded && file.thumbnailUrl ? getThumbnailUri(file) : file.uri }}
                                  style={[styles.thumbnailImage, { borderColor: colors.border }]}
                                />
                              </TouchableOpacity>
                              {!isSaving && (
                                <TouchableOpacity
                                  onPress={() => handleRemoveFile(so.id, 'checkin', index)}
                                  style={[styles.thumbnailRemove, { backgroundColor: colors.destructive }]}
                                >
                                  <IconX size={10} color="#fff" />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </ScrollView>
                      )}
                      {/* Open camera button */}
                      <TouchableOpacity
                        onPress={() => handleOpenCamera(so.id, 'checkin')}
                        disabled={isSaving}
                        style={[styles.cameraButton, { borderColor: colors.border, backgroundColor: colors.muted, opacity: isSaving ? 0.5 : 1 }]}
                        activeOpacity={0.7}
                      >
                        <IconCamera size={20} color={colors.foreground} />
                        <ThemedText style={[styles.cameraButtonText, { color: colors.foreground }]}>
                          Tirar foto
                        </ThemedText>
                      </TouchableOpacity>
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
                  return (
                    <View key={`checkout-${so.id}`} style={styles.serviceOrderGroup}>
                      <View style={styles.serviceOrderHeader}>
                        <ThemedText style={styles.serviceOrderLabel}>{so.description}</ThemedText>
                        <ThemedText style={[styles.fileCount, { color: colors.mutedForeground }]}>
                          {soCheckoutFiles.length} foto(s)
                        </ThemedText>
                      </View>
                      {/* Checkin reference thumbnails */}
                      {soCheckinFiles.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.thumbnailScroll}
                        >
                          {soCheckinFiles.map((file, index) => {
                            const src = getThumbnailUri(file)
                            return (
                              <View
                                key={file.id || file.uri || `ref-${index}`}
                                style={styles.thumbnailWrapper}
                              >
                                <TouchableOpacity
                                  activeOpacity={0.8}
                                  onPress={() => handlePreviewImage(
                                    soCheckinFiles.map((f) => ({ uri: getThumbnailUri(f) })),
                                    index
                                  )}
                                >
                                  {src ? (
                                    <Image source={{ uri: src }} style={[styles.thumbnailImage, { borderColor: colors.border }]} />
                                  ) : (
                                    <View style={[styles.thumbnailImage, { borderColor: colors.border, backgroundColor: colors.border }]} />
                                  )}
                                </TouchableOpacity>
                              </View>
                            )
                          })}
                        </ScrollView>
                      )}
                      {/* Checkout thumbnails */}
                      {soCheckoutFiles.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
                          {soCheckoutFiles.map((file, index) => (
                            <View key={file.id || file.uri || `co-${index}`} style={[styles.thumbnailWrapper]}>
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handlePreviewImage(
                                  soCheckoutFiles.map((f) => ({ uri: f.uploaded && f.thumbnailUrl ? getThumbnailUri(f) : f.uri })),
                                  index
                                )}
                              >
                                <Image
                                  source={{ uri: file.uploaded && file.thumbnailUrl ? getThumbnailUri(file) : file.uri }}
                                  style={[styles.thumbnailImage, { borderColor: colors.border }]}
                                />
                              </TouchableOpacity>
                              {!isSaving && (
                                <TouchableOpacity
                                  onPress={() => handleRemoveFile(so.id, 'checkout', index)}
                                  style={[styles.thumbnailRemove, { backgroundColor: colors.destructive }]}
                                >
                                  <IconX size={10} color="#fff" />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </ScrollView>
                      )}
                      {/* Open camera button */}
                      <TouchableOpacity
                        onPress={() => handleOpenCamera(so.id, 'checkout')}
                        disabled={isSaving}
                        style={[styles.cameraButton, { borderColor: colors.border, backgroundColor: colors.muted, opacity: isSaving ? 0.5 : 1 }]}
                        activeOpacity={0.7}
                      >
                        <IconCamera size={20} color={colors.foreground} />
                        <ThemedText style={[styles.cameraButtonText, { color: colors.foreground }]}>
                          Tirar foto
                        </ThemedText>
                      </TouchableOpacity>
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
                              <TouchableOpacity
                                key={file.id || file.uri || `ci-${index}`}
                                activeOpacity={0.8}
                                onPress={() => handlePreviewImage(
                                  soCheckinFiles.map((f) => ({ uri: getThumbnailUri(f) })),
                                  index
                                )}
                                style={[styles.overviewThumb, { borderColor: colors.border }]}
                              >
                                {src ? <Image source={{ uri: src }} style={styles.overviewThumbImage} /> : <View style={[styles.referencePlaceholder, { backgroundColor: colors.border }]} />}
                              </TouchableOpacity>
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
                                  <TouchableOpacity
                                    key={file.id || file.uri || `co-${index}`}
                                    activeOpacity={0.8}
                                    onPress={() => handlePreviewImage(
                                      soCheckoutFiles.map((f) => ({ uri: getThumbnailUri(f) })),
                                      index
                                    )}
                                    style={[styles.overviewThumb, { borderColor: colors.border }]}
                                  >
                                    {src ? <Image source={{ uri: src }} style={styles.overviewThumbImage} /> : <View style={[styles.referencePlaceholder, { backgroundColor: colors.border }]} />}
                                  </TouchableOpacity>
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

      <FullCamera
        visible={!!cameraTarget}
        onCapture={handleCameraCapture}
        onClose={handleCameraClose}
        onDiscard={handleCameraDiscard}
      />

      <ImagePreviewModal
        visible={previewVisible}
        images={previewImages}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />
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
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  cameraButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  thumbnailScroll: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: spacing.xs,
    padding: 4,
  },
  thumbnailImage: {
    width: 56,
    height: 56,
    borderRadius: 6,
    borderWidth: 1,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
