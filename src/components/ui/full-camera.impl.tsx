import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  Animated,
} from 'react-native'
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera'
import type { CameraDevice } from 'react-native-vision-camera'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import Reanimated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import {
  IconBolt,
  IconBoltOff,
  IconCheck,
  IconX,
} from '@tabler/icons-react-native'
import { ThemedText } from './themed-text'
import { ImagePreviewModal } from './image-preview-modal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ---------------------------------------------------------------------------
// Animated Camera — drive the `zoom` prop from the UI thread.
// ---------------------------------------------------------------------------
// `zoom` is not a layout/style prop, so Reanimated must be told it's a native
// prop it's allowed to forward. We render a Reanimated-wrapped <Camera> whose
// `zoom` is bound to a shared value via useAnimatedProps. This is the approach
// recommended by vision-camera (https://react-native-vision-camera.com/docs/
// guides/zooming): the pinch gesture mutates the shared value on the UI thread
// so zoom is butter-smooth and never round-trips through React state.
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)
Reanimated.addWhitelistedNativeProps({ zoom: true })

// ---------------------------------------------------------------------------
// Zoom model — react-native-vision-camera
// ---------------------------------------------------------------------------
// vision-camera exposes a device's REAL optical zoom range:
//   • device.minZoom      — widest factor reachable (< neutralZoom ⇒ ultra-wide)
//   • device.neutralZoom  — the "1x" point (main wide-angle lens). For a fused
//                           multi-camera this is > minZoom (e.g. 2.0 on iPhone,
//                           where minZoom 1.0 == the 0.5x ultra-wide lens).
//   • device.maxZoom      — maximum factor (optical telephoto + digital)
// The <Camera zoom={factor}> prop takes the ACTUAL zoom factor (not a 0..1
// ratio) and, for a FUSED logical device, the native layer switches across the
// physical lenses (ultra-wide ⇆ wide ⇆ tele) as the factor crosses boundaries.
//
// CRITICAL: ultra-wide is only reachable when the SELECTED device actually
// fuses the ultra-wide lens. With no filter, vision-camera's getCameraDevice
// deliberately prefers the SIMPLE wide-angle-only device ("we only want a
// simple camera") — which has minZoom == neutralZoom and can never reach 0.5x.
// So we MUST request the rich multi-camera via `physicalDevices`. See where
// `useCameraDevice` is called below.
//
// Two hardware topologies, both handled here:
//   1. Fused multi-cam (iPhone dual/tri-camera, modern Android logical multi-
//      cameras): ultra-wide is reached by zooming below neutralZoom. Single
//      device, smooth lens switch-over. → preset factor < neutralZoom.
//   2. Ultra-wide exposed as a SEPARATE device (some Android, e.g. budget
//      Xiaomi): no single device zooms to it, so the ".5" pill SWITCHES the
//      active `device` to the standalone ultra-wide camera. → preset carries
//      that device's id.
// ---------------------------------------------------------------------------

type FlashMode = 'off' | 'on' | 'auto'

interface ZoomPreset {
  label: string
  /** Actual zoom factor (device units, minZoom..maxZoom) for `deviceId`. */
  factor: number
  /** Which physical/logical device this stop lives on. */
  deviceId: string
}

const EPS = 0.05

/** Clamp a zoom factor to the device's optical range. Runs on the UI thread. */
function clampZoom(value: number, min: number, max: number): number {
  'worklet'
  return Math.min(Math.max(value, min), max)
}

/** Format a factor relative to the 1x point: 0.5 → ".5", 2 → "2", 1.5 → "1.5". */
function formatZoomLabel(factor: number, neutral: number): string {
  const ratio = factor / neutral
  if (ratio < 1) return ratio.toFixed(1).replace(/^0/, '') // 0.5 -> .5
  return Number.isInteger(ratio) ? String(ratio) : ratio.toFixed(1)
}

/** True when `device` can reach the ultra-wide lens purely by zooming out. */
function deviceReachesUltraWide(device: CameraDevice | undefined): boolean {
  return !!device && device.minZoom < device.neutralZoom - EPS
}

/**
 * Build the pill presets.
 * @param main   The primary (richest) back device — its neutralZoom is "1x".
 * @param uwOnly A standalone ultra-wide device to switch into, or undefined
 *               when ultra-wide is reachable on `main` by zoom (or absent).
 */
function buildZoomPresets(
  main: CameraDevice | undefined,
  uwOnly: CameraDevice | undefined,
): ZoomPreset[] {
  if (!main) return [{ label: '1', factor: 1, deviceId: '' }]
  const { minZoom, maxZoom, neutralZoom, id } = main
  const presets: ZoomPreset[] = []

  if (deviceReachesUltraWide(main)) {
    // Topology 1 — fused: ultra-wide is a zoom factor below neutral on `main`.
    presets.push({ label: formatZoomLabel(minZoom, neutralZoom), factor: minZoom, deviceId: id })
  } else if (uwOnly && uwOnly.id !== id) {
    // Topology 2 — separate ultra-wide device. Its own neutralZoom is its
    // natural (widest) view; switching to it gives the ~0.5x field of view.
    presets.push({ label: '.5', factor: uwOnly.neutralZoom, deviceId: uwOnly.id })
  }

  presets.push({ label: '1', factor: neutralZoom, deviceId: id })
  if (maxZoom >= neutralZoom * 2) {
    presets.push({ label: '2', factor: neutralZoom * 2, deviceId: id })
  }
  if (maxZoom >= neutralZoom * 3) {
    presets.push({ label: '3', factor: neutralZoom * 3, deviceId: id })
  }
  return presets
}

export interface FullCameraProps {
  visible: boolean
  onCapture: (uri: string) => void
  onClose: () => void
  /** Called when user discards photos (X button). If not provided, onClose is used. */
  onDiscard?: () => void
}

export function FullCamera({ visible, onCapture, onClose, onDiscard }: FullCameraProps) {
  const cameraRef = useRef<Camera>(null)
  const mountedRef = useRef(true)
  const [flash, setFlash] = useState<FlashMode>('off')
  const [isTakingPicture, setIsTakingPicture] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [allPhotoUris, setAllPhotoUris] = useState<string[]>([])
  const { hasPermission, requestPermission } = useCameraPermission()

  // Request the RICHEST back device (ultra-wide + wide + tele fused). Without
  // this filter vision-camera returns the simple wide-angle-only camera and
  // 0.5x ultra-wide is unreachable. On phones lacking some lenses the scorer
  // still returns the closest match (e.g. wide+tele, or wide-only).
  const mainDevice = useCameraDevice('back', {
    physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera'],
  })
  // Best device that actually contains an ultra-wide lens. On a fused phone
  // this is usually the same device as `mainDevice`; on phones that expose the
  // ultra-wide as a STANDALONE camera it's a different one we can switch into.
  const ultraWideCandidate = useCameraDevice('back', {
    physicalDevices: ['ultra-wide-angle-camera'],
  })

  // A genuine standalone ultra-wide we should switch into — only when `main`
  // can't already reach ultra-wide by zoom AND the candidate really has the
  // lens AND it's a different device.
  const standaloneUltraWide = useMemo(() => {
    if (deviceReachesUltraWide(mainDevice)) return undefined
    if (!ultraWideCandidate) return undefined
    if (!ultraWideCandidate.physicalDevices.includes('ultra-wide-angle-camera')) return undefined
    if (ultraWideCandidate.id === mainDevice?.id) return undefined
    return ultraWideCandidate
  }, [mainDevice, ultraWideCandidate])

  const insets = useSafeAreaInsets()
  const shutterScale = useRef(new Animated.Value(1)).current

  // `null` ⇒ use mainDevice; otherwise the id of the standalone ultra-wide.
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const activeDevice = useMemo(() => {
    if (activeDeviceId && standaloneUltraWide && activeDeviceId === standaloneUltraWide.id) {
      return standaloneUltraWide
    }
    return mainDevice
  }, [activeDeviceId, mainDevice, standaloneUltraWide])

  // Presets + the neutral (1x) factor, derived from the actual hardware.
  const presets = useMemo(
    () => buildZoomPresets(mainDevice, standaloneUltraWide),
    [mainDevice, standaloneUltraWide],
  )
  const defaultZoomIndex = useMemo(
    () => Math.max(0, presets.findIndex((p) => p.label === '1')),
    [presets],
  )

  // The live zoom factor lives on the UI thread (shared value) so the pinch
  // gesture can mutate it at 60fps without React re-renders. `zoomOffset`
  // snapshots the factor at the start of a pinch so scaling is multiplicative.
  const zoom = useSharedValue(1)
  const zoomOffset = useSharedValue(1)
  // The highlighted pill is React state (the only thing the UI needs to react
  // to); it's synced from the gesture's onEnd, never per-frame.
  const [selectedZoomIndex, setSelectedZoomIndex] = useState(0)

  // Bind the shared value to the native <Camera zoom> prop on the UI thread.
  const animatedProps = useAnimatedProps(() => ({ zoom: zoom.value }), [zoom])

  // The active device id, mirrored into a ref so the (JS-thread) gesture
  // callback can read it without re-creating the worklet on every change.
  const activeDeviceIdRef = useRef<string | undefined>(activeDevice?.id)
  useEffect(() => { activeDeviceIdRef.current = activeDevice?.id }, [activeDevice])

  // After a pinch settles, highlight the closest preset pill — but only among
  // the stops that belong to the CURRENTLY active device (a ".5" stop on a
  // different device must not be matched while we're zoomed on `main`).
  const syncClosestPreset = useCallback((factor: number) => {
    const activeId = activeDeviceIdRef.current
    let closest = -1
    let minDiff = Infinity
    for (let i = 0; i < presets.length; i++) {
      if (presets[i].deviceId !== activeId) continue
      const diff = Math.abs(factor - presets[i].factor)
      if (diff < minDiff) {
        minDiff = diff
        closest = i
      }
    }
    if (closest >= 0) setSelectedZoomIndex(closest)
  }, [presets])

  // Re-baseline to 1x (on the main device) whenever the hardware resolves or
  // its range changes.
  useEffect(() => {
    if (!mainDevice) return
    const factor = presets[defaultZoomIndex]?.factor ?? mainDevice.neutralZoom
    setActiveDeviceId(null)
    zoom.value = factor
    zoomOffset.value = factor
    setSelectedZoomIndex(defaultZoomIndex)
  }, [mainDevice, presets, defaultZoomIndex, zoom, zoomOffset])

  // Native-thread pinch-to-zoom via react-native-gesture-handler. This works
  // ON TOP of the native camera surface (which would otherwise swallow plain
  // RN touch events) and — critically — only fires inside the modal's own
  // GestureHandlerRootView below. Recreated when the device's range changes so
  // the worklet captures fresh min/max bounds.
  const pinchGesture = useMemo(() => {
    const minZoom = activeDevice?.minZoom ?? 1
    const maxZoom = activeDevice?.maxZoom ?? 1
    return Gesture.Pinch()
      .onBegin(() => {
        'worklet'
        zoomOffset.value = zoom.value
      })
      .onUpdate((event) => {
        'worklet'
        zoom.value = clampZoom(zoomOffset.value * event.scale, minZoom, maxZoom)
      })
      .onEnd(() => {
        'worklet'
        runOnJS(syncClosestPreset)(zoom.value)
      })
  }, [activeDevice, zoom, zoomOffset, syncClosestPreset])

  // Track mounted state to avoid "camera unmounted" errors
  React.useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const handleTakePicture = useCallback(async () => {
    if (!cameraRef.current || isTakingPicture) return

    setIsTakingPicture(true)
    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(shutterScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start()

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: activeDevice?.hasFlash ? flash : 'off',
      })
      const path = photo?.path
      if (path && mountedRef.current) {
        const uri = path.startsWith('file://') ? path : `file://${path}`
        onCapture(uri)
        setLastPhotoUri(uri)
        setAllPhotoUris((prev) => [...prev, uri])
        setPhotoCount((c) => c + 1)
      }
    } catch (err: any) {
      // Ignore "Camera unmounted" errors — user closed camera while photo was processing
      if (!err?.message?.includes('unmounted')) {
        console.error('Error taking picture:', err)
      }
    }

    if (mountedRef.current) {
      setTimeout(() => setIsTakingPicture(false), 250)
    }
  }, [isTakingPicture, onCapture, shutterScale, activeDevice, flash])

  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'))
  }, [])

  const handleZoomPreset = useCallback((index: number) => {
    const preset = presets[index]
    if (!preset) return
    setSelectedZoomIndex(index)

    const currentId = activeDevice?.id
    if (preset.deviceId !== currentId) {
      // Crossing a physical-device boundary (e.g. ".5" on a standalone ultra-
      // wide). The camera session reconfigures, so set zoom directly rather
      // than animating into the old device's range.
      setActiveDeviceId(preset.deviceId === mainDevice?.id ? null : preset.deviceId)
      zoom.value = preset.factor
      zoomOffset.value = preset.factor
    } else {
      // Same device — animate smoothly across the lens switch-over points.
      zoom.value = withTiming(preset.factor, { duration: 200 })
    }
  }, [presets, zoom, zoomOffset, activeDevice, mainDevice])

  const resetState = useCallback(() => {
    setPhotoCount(0)
    setLastPhotoUri(null)
    setAllPhotoUris([])
    setPreviewVisible(false)
    const factor = presets[defaultZoomIndex]?.factor ?? 1
    setActiveDeviceId(null)
    zoom.value = factor
    zoomOffset.value = factor
    setSelectedZoomIndex(defaultZoomIndex)
  }, [presets, defaultZoomIndex, zoom, zoomOffset])

  // X button — discard all photos taken in this session
  const handleCancel = useCallback(() => {
    resetState()
    if (onDiscard) {
      onDiscard()
    } else {
      onClose()
    }
  }, [resetState, onDiscard, onClose])

  // Concluído button — keep photos and close
  const handleDone = useCallback(() => {
    resetState()
    onClose()
  }, [resetState, onClose])

  const FlashIcon = flash === 'off' ? IconBoltOff : IconBolt
  const flashColor = flash === 'off' ? 'rgba(255,255,255,0.5)' : '#FFD60A'

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      {/* A Modal renders in its OWN native window, OUTSIDE the app-root
          GestureHandlerRootView — so gestures (the pinch below) are dead unless
          we re-root gesture-handler here. */}
      <GestureHandlerRootView style={styles.root}>
        {!hasPermission ? (
          <>
            <StatusBar barStyle="light-content" />
            <View style={styles.permissionContainer}>
              <ThemedText style={styles.permissionText}>
                Precisamos de permissão para usar a câmera.
              </ThemedText>
              <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                <ThemedText style={styles.permissionButtonText}>Permitir câmera</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel} style={[styles.permissionButton, { marginTop: 12 }]}>
                <ThemedText style={styles.permissionButtonText}>Voltar</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <StatusBar barStyle="light-content" />

            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
              <TouchableOpacity onPress={handleCancel} style={styles.topButton}>
                <IconX size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleFlash} style={styles.topButton}>
                <FlashIcon size={20} color={flashColor} />
                {flash === 'auto' && (
                  <View style={styles.flashBadge}>
                    <ThemedText style={styles.flashBadgeText}>A</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Camera viewfinder with pinch-to-zoom */}
            <View style={styles.viewfinderContainer}>
              {activeDevice ? (
                <GestureDetector gesture={pinchGesture}>
                  <ReanimatedCamera
                    ref={cameraRef}
                    style={styles.viewfinder}
                    device={activeDevice}
                    isActive={visible}
                    photo
                    animatedProps={animatedProps}
                    resizeMode="cover"
                    // SurfaceView (the Android default) renders BLACK inside a
                    // RN <Modal> because it punches a hole through the modal's
                    // separate window. TextureView composites normally, so the
                    // preview actually shows. No-op on iOS.
                    androidPreviewViewType="texture-view"
                    enableZoomGesture={false}
                  />
                </GestureDetector>
              ) : (
                <View style={styles.viewfinder} />
              )}

              {/* Zoom pills — overlaid at bottom of viewfinder */}
              <View style={styles.zoomOverlay} pointerEvents="box-none">
                <View style={styles.zoomPillBar}>
                  {presets.map((preset, index) => {
                    const isActive = selectedZoomIndex === index
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        onPress={() => handleZoomPreset(index)}
                        style={[
                          styles.zoomPill,
                          isActive && styles.zoomPillActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <ThemedText
                          style={[
                            styles.zoomLabel,
                            isActive && styles.zoomLabelActive,
                          ]}
                        >
                          {preset.label}
                        </ThemedText>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>

            {/* Bottom bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.bottomRow}>
                {/* Last photo thumbnail — tap to preview */}
                <View style={styles.sideSlot}>
                  {lastPhotoUri ? (
                    <TouchableOpacity
                      onPress={() => setPreviewVisible(true)}
                      style={styles.thumbnailContainer}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: lastPhotoUri }} style={styles.thumbnail} />
                      {photoCount > 1 && (
                        <View style={styles.thumbnailBadge}>
                          <ThemedText style={styles.thumbnailBadgeText}>{photoCount}</ThemedText>
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Shutter */}
                <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
                  <TouchableOpacity
                    onPress={handleTakePicture}
                    disabled={isTakingPicture}
                    style={styles.shutterOuter}
                    activeOpacity={0.9}
                  >
                    <View style={styles.shutterInner} />
                  </TouchableOpacity>
                </Animated.View>

                {/* Done button */}
                <View style={styles.sideSlot}>
                  {photoCount > 0 && (
                    <TouchableOpacity onPress={handleDone} style={styles.doneButton} activeOpacity={0.7}>
                      <IconCheck size={16} color="#000" />
                      <ThemedText style={styles.doneText}>Concluído</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </>
        )}
      </GestureHandlerRootView>

      {/* Fullscreen preview of taken photos */}
      <ImagePreviewModal
        visible={previewVisible}
        images={allPhotoUris.map((uri) => ({ uri }))}
        initialIndex={allPhotoUris.length - 1}
        onClose={() => setPreviewVisible(false)}
      />
    </Modal>
  )
}

const ACTIVE_YELLOW = '#FFD60A'

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashBadge: {
    position: 'absolute',
    bottom: 3,
    right: 5,
  },
  flashBadgeText: {
    color: ACTIVE_YELLOW,
    fontSize: 8,
    fontWeight: '800',
  },
  viewfinderContainer: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  viewfinder: {
    flex: 1,
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  zoomPillBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 50,
    padding: 3,
    gap: 2,
  },
  zoomPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomPillActive: {
    backgroundColor: 'rgba(255,214,10,0.2)',
  },
  zoomLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  zoomLabelActive: {
    color: ACTIVE_YELLOW,
    fontWeight: '700',
    fontSize: 13,
  },
  bottomBar: {
    paddingTop: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sideSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  thumbnailBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: ACTIVE_YELLOW,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ACTIVE_YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  doneText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
