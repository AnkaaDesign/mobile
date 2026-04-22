import React, { useRef, useState, useCallback, useMemo } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  Animated,
  Platform,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import type { CameraType, FlashMode } from 'expo-camera'
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
// Zoom model
// ---------------------------------------------------------------------------
// iOS — expo-camera exposes a logical camera group (builtInDualWide / builtInTriple)
//   by default. zoom=0 is the widest lens available (typically 0.5x on modern
//   iPhones). We also pass selectedLens when we can identify a specific physical
//   lens via getAvailableLensesAsync, so each pill maps to a true optical lens
//   rather than a digital-zoom cropped view.
// Android — with the patched expo-camera, zoom=0 maps to minZoomRatio (can be
//   < 1x on devices with ultra-wide physical lenses, e.g. 0.6x on the Poco X7).
//   Zoom is linearly mapped from [0, 1] onto [minZoomRatio, maxZoomRatio].
// ---------------------------------------------------------------------------

type LensKind = 'ultraWide' | 'wide' | 'telephoto'

/** Match localized lens names in common Latin languages (en, pt, es, fr, it, de). */
const LENS_MATCHERS: Record<LensKind, RegExp> = {
  ultraWide: /ultra/i,
  telephoto: /tele/i,
  wide: /.*/,
}

interface ZoomPreset {
  label: string
  /** Preferred physical lens on iOS — fallback to zoom when not available. */
  lens: LensKind
  /** Zoom value (0..1) used as fallback on iOS or always on Android. */
  zoom: number
}

// iOS presets: calibrated against the logical camera group (pow zoom formula).
// 0.5x — widest via logical group (uses ultra-wide optically when present)
// 1x / 2x / 3x — calibrated empirically against iPhone's pow(maxZoom, zoom)
const ZOOM_PRESETS_IOS: ZoomPreset[] = [
  { label: '.5', lens: 'ultraWide', zoom: 0 },
  { label: '1', lens: 'wide', zoom: 0.12 },
  { label: '2', lens: 'wide', zoom: 0.26 },
  { label: '3', lens: 'telephoto', zoom: 0.41 },
]

// Android presets: CameraX linear mapping [0..1] → [minZoomRatio, maxZoomRatio].
// Calibrated against typical modern devices (ultra-wide minZoom ≈ 0.6x,
// maxZoom ≈ 8–10x). Device variance means these are approximations, but
// they give native-camera-like behavior on mainstream phones.
const ZOOM_PRESETS_ANDROID: ZoomPreset[] = [
  { label: '.5', lens: 'ultraWide', zoom: 0 },
  { label: '1', lens: 'wide', zoom: 0.05 },
  { label: '2', lens: 'wide', zoom: 0.16 },
  { label: '3', lens: 'telephoto', zoom: 0.27 },
]

const ZOOM_PRESETS: ZoomPreset[] =
  Platform.OS === 'ios' ? ZOOM_PRESETS_IOS : ZOOM_PRESETS_ANDROID

const DEFAULT_ZOOM_INDEX = 1 // 1x

interface FullCameraProps {
  visible: boolean
  onCapture: (uri: string) => void
  onClose: () => void
  /** Called when user discards photos (X button). If not provided, onClose is used. */
  onDiscard?: () => void
}

export function FullCamera({ visible, onCapture, onClose, onDiscard }: FullCameraProps) {
  const cameraRef = useRef<CameraView>(null)
  const mountedRef = useRef(true)
  const [facing, setFacing] = useState<CameraType>('back')
  const [flash, setFlash] = useState<FlashMode>('off')
  const [zoom, setZoom] = useState(ZOOM_PRESETS[DEFAULT_ZOOM_INDEX].zoom)
  const [selectedZoomIndex, setSelectedZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const [isTakingPicture, setIsTakingPicture] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [allPhotoUris, setAllPhotoUris] = useState<string[]>([])
  const [permission, requestPermission] = useCameraPermissions()
  const insets = useSafeAreaInsets()
  const shutterScale = useRef(new Animated.Value(1)).current

  // iOS physical-lens identifiers discovered via getAvailableLensesAsync.
  const [lensByKind, setLensByKind] = useState<Partial<Record<LensKind, string>>>({})

  // Pinch-to-zoom state (plain RN touch events — no gesture handler needed)
  const pinchRef = useRef<{ startDistance: number; startZoom: number } | null>(null)

  const selectedPreset = ZOOM_PRESETS[selectedZoomIndex]
  const selectedLens = useMemo(() => {
    if (Platform.OS !== 'ios') return undefined
    return lensByKind[selectedPreset.lens] ?? lensByKind.wide
  }, [lensByKind, selectedPreset])

  const getTouchDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX
    const dy = touches[0].pageY - touches[1].pageY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const updateZoomWithIndex = useCallback((newZoom: number) => {
    const clamped = Math.max(0, Math.min(1, newZoom))
    setZoom(clamped)
    // Find closest preset for the indicator
    let closest = 0
    let minDiff = Math.abs(clamped - ZOOM_PRESETS[0].zoom)
    for (let i = 1; i < ZOOM_PRESETS.length; i++) {
      const diff = Math.abs(clamped - ZOOM_PRESETS[i].zoom)
      if (diff < minDiff) {
        minDiff = diff
        closest = i
      }
    }
    setSelectedZoomIndex(closest)
  }, [])

  const handleTouchStart = useCallback((e: any) => {
    const touches = e.nativeEvent.touches
    if (touches.length === 2) {
      pinchRef.current = {
        startDistance: getTouchDistance(touches),
        startZoom: zoom,
      }
    }
  }, [zoom])

  const handleTouchMove = useCallback((e: any) => {
    const touches = e.nativeEvent.touches
    if (touches.length === 2 && pinchRef.current) {
      const currentDistance = getTouchDistance(touches)
      const scale = currentDistance / pinchRef.current.startDistance
      // Damped scaling — smooth, non-jumpy zoom
      const newZoom = pinchRef.current.startZoom + (scale - 1) * 0.15
      updateZoomWithIndex(newZoom)
    }
  }, [updateZoomWithIndex])

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null
  }, [])

  // Track mounted state to avoid "camera unmounted" errors
  React.useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Discover available physical lenses on iOS. Matching is keyword-based
  // against the AVCaptureDevice localizedName (which varies by locale, but
  // "ultra" and "tele" are stable across most Latin-script languages).
  const discoverLenses = useCallback(async () => {
    if (Platform.OS !== 'ios') return
    try {
      const lenses = (await cameraRef.current?.getAvailableLensesAsync()) ?? []
      const picks: Partial<Record<LensKind, string>> = {}
      for (const lens of lenses) {
        if (!picks.ultraWide && LENS_MATCHERS.ultraWide.test(lens)) {
          picks.ultraWide = lens
          continue
        }
        if (!picks.telephoto && LENS_MATCHERS.telephoto.test(lens)) {
          picks.telephoto = lens
          continue
        }
      }
      // Wide = first lens that isn't ultra-wide or telephoto (usually "Back Camera")
      picks.wide = lenses.find(
        (l) => l !== picks.ultraWide && l !== picks.telephoto,
      )
      if (mountedRef.current) setLensByKind(picks)
    } catch {
      // Ignore — selectedLens falls back to default behavior
    }
  }, [])

  const handleCameraReady = useCallback(() => {
    discoverLenses()
  }, [discoverLenses])

  const handleTakePicture = useCallback(async () => {
    if (!cameraRef.current || isTakingPicture) return

    setIsTakingPicture(true)
    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(shutterScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start()

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: true,
      })
      if (photo?.uri && mountedRef.current) {
        onCapture(photo.uri)
        setLastPhotoUri(photo.uri)
        setAllPhotoUris((prev) => [...prev, photo.uri])
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
  }, [isTakingPicture, onCapture, shutterScale])

  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'))
  }, [])

  const handleZoomPreset = useCallback((index: number) => {
    setSelectedZoomIndex(index)
    setZoom(ZOOM_PRESETS[index].zoom)
  }, [])

  const resetState = useCallback(() => {
    setPhotoCount(0)
    setLastPhotoUri(null)
    setAllPhotoUris([])
    setPreviewVisible(false)
    setZoom(ZOOM_PRESETS[DEFAULT_ZOOM_INDEX].zoom)
    setSelectedZoomIndex(DEFAULT_ZOOM_INDEX)
  }, [])

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
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.root}>
        {!permission?.granted ? (
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
            <View
              style={styles.viewfinderContainer}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <CameraView
                ref={cameraRef}
                style={styles.viewfinder}
                facing={facing}
                flash={flash}
                zoom={zoom}
                selectedLens={selectedLens}
                mode="picture"
                onCameraReady={handleCameraReady}
              />

              {/* Zoom pills — overlaid at bottom of viewfinder */}
              <View style={styles.zoomOverlay}>
                <View style={styles.zoomPillBar}>
                  {ZOOM_PRESETS.map((preset, index) => {
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
      </View>

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
