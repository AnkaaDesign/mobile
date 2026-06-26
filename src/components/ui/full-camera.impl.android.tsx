import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
  Animated,
} from 'react-native'
import { useCameraPermissions } from 'expo-camera'
import { IconBolt, IconBoltOff, IconCheck, IconX } from '@tabler/icons-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemedText } from './themed-text'
import { ImagePreviewModal } from './image-preview-modal'
import { Camera2Preview, getCameraInfo } from '../../../modules/camera-probe'
import type { CameraInfo } from '../../../modules/camera-probe'

// ---------------------------------------------------------------------------
// Android camera — raw Camera2 via the local `camera-probe` native module.
// ---------------------------------------------------------------------------
// vision-camera / expo-camera (both CameraX) cannot reach the ultra-wide lens
// on Xiaomi/Poco: those phones omit the ultra-wide from CameraManager
// .cameraIdList, so CameraX never lists it. The native module opens the lens
// directly (logical multi-camera + OutputConfiguration.setPhysicalCameraId, or
// the hidden physical id directly), which DOES reach it (verified on a Poco:
// logical 4 + physical 2 = 96° / 15.5mm ultra-wide).
//
// This component mirrors the iOS FullCamera UI and the SAME FullCameraProps
// contract, so check-in/check-out and the task form need no changes.
// ---------------------------------------------------------------------------

type FlashMode = 'off' | 'on' | 'auto'

interface Combo {
  logical: string
  physical: string | null
}

interface ZoomPreset {
  label: string
  /** 'ultra' switches to the ultra-wide combo; 'main' stays on the main combo. */
  kind: 'ultra' | 'main'
  /** Zoom ratio to apply within the combo. */
  factor: number
}

export interface FullCameraProps {
  visible: boolean
  onCapture: (uri: string) => void
  onClose: () => void
  /** Called when user discards photos (X button). If not provided, onClose is used. */
  onDiscard?: () => void
}

export function FullCamera({ visible, onCapture, onClose, onDiscard }: FullCameraProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const insets = useSafeAreaInsets()
  const mountedRef = useRef(true)

  // Resolve the camera topology ONCE (cheap, synchronous Camera2 enumeration).
  const { ultraCombo, mainCombo, hasUltra } = useMemo(() => {
    let info: CameraInfo | null = null
    try {
      info = getCameraInfo()
    } catch {
      info = null
    }
    const cams = info?.cameras ?? []
    const mainId = info?.publicCameraIds?.[0] ?? '0'
    const back = cams.filter((c) => c.facing === 'back' && typeof c.horizontalFovDeg === 'number')
    const ultra = [...back].sort((a, b) => (b.horizontalFovDeg! - a.horizontalFovDeg!))[0]

    // A "real" ultra-wide is meaningfully wider than the main lens.
    const mainCam = cams.find((c) => c.id === mainId)
    const mainFov = mainCam?.horizontalFovDeg ?? 0
    const ultraIsReal = !!ultra && ultra.id !== mainId && (ultra.horizontalFovDeg ?? 0) > mainFov + 10

    let uCombo: Combo = { logical: mainId, physical: null }
    if (ultraIsReal) {
      const logicalMulti = cams.find(
        (c) => c.isLogicalMultiCamera && (c.physicalCameraIds ?? []).includes(ultra.id),
      )
      uCombo = logicalMulti
        ? { logical: logicalMulti.id, physical: ultra.id }
        : { logical: ultra.id, physical: null }
    }
    return {
      ultraCombo: uCombo,
      mainCombo: { logical: mainId, physical: null } as Combo,
      hasUltra: ultraIsReal,
    }
  }, [])

  const presets = useMemo<ZoomPreset[]>(() => {
    const list: ZoomPreset[] = []
    if (hasUltra) list.push({ label: '.6', kind: 'ultra', factor: 1 })
    list.push({ label: '1', kind: 'main', factor: 1 })
    list.push({ label: '2', kind: 'main', factor: 2 })
    list.push({ label: '3', kind: 'main', factor: 3 })
    return list
  }, [hasUltra])

  // Default to the "1" pill (main lens), matching the iOS camera.
  const defaultIndex = useMemo(() => presets.findIndex((p) => p.label === '1'), [presets])
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex)
  const selected = presets[selectedIndex] ?? presets[0]
  const mode: 'ultra' | 'main' = selected?.kind ?? 'main'
  const combo = mode === 'ultra' ? ultraCombo : mainCombo

  const [zoomProp, setZoomProp] = useState<number>(1)
  const [zoomDisplay, setZoomDisplay] = useState(1)
  const [flash, setFlash] = useState<FlashMode>('off')
  const [statusOk, setStatusOk] = useState(false)
  const [statusDetail, setStatusDetail] = useState<string | null>(null)

  const [captureTag, setCaptureTag] = useState(0)
  const [isTakingPicture, setIsTakingPicture] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null)
  const [allPhotoUris, setAllPhotoUris] = useState<string[]>([])
  const [previewVisible, setPreviewVisible] = useState(false)

  const shutterScale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (permission && !permission.granted && visible) {
      requestPermission()
    }
  }, [permission?.granted, visible])

  const resetState = useCallback(() => {
    setPhotoCount(0)
    setLastPhotoUri(null)
    setAllPhotoUris([])
    setPreviewVisible(false)
    setSelectedIndex(defaultIndex)
    setZoomProp(1)
  }, [defaultIndex])

  const handleCancel = useCallback(() => {
    resetState()
    if (onDiscard) onDiscard()
    else onClose()
  }, [resetState, onDiscard, onClose])

  const handleDone = useCallback(() => {
    resetState()
    onClose()
  }, [resetState, onClose])

  const handlePreset = useCallback(
    (index: number) => {
      const p = presets[index]
      if (!p) return
      setSelectedIndex(index)
      setZoomProp(p.factor)
    },
    [presets],
  )

  const handleShutter = useCallback(() => {
    if (isTakingPicture) return
    setIsTakingPicture(true)
    Animated.sequence([
      Animated.timing(shutterScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(shutterScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start()
    setCaptureTag((t) => t + 1)
    // Re-enable quickly — the native layer queues rapid shots (maxImages=4).
    setTimeout(() => {
      if (mountedRef.current) setIsTakingPicture(false)
    }, 220)
  }, [isTakingPicture, shutterScale])

  const handlePhoto = useCallback(
    (uri: string) => {
      if (!mountedRef.current) return
      onCapture(uri)
      setLastPhotoUri(uri)
      setAllPhotoUris((prev) => [...prev, uri])
      setPhotoCount((c) => c + 1)
    },
    [onCapture],
  )

  const toggleFlash = useCallback(() => {
    setFlash((prev) => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'))
  }, [])

  const FlashIcon = flash === 'off' ? IconBoltOff : IconBolt
  const flashColor = flash === 'off' ? 'rgba(255,255,255,0.5)' : '#FFD60A'

  // Highlight the nearest pill as the live zoom changes (pinch).
  const syncPill = useCallback(
    (zoom: number) => {
      if (mode === 'ultra') return
      let best = -1
      let diff = Infinity
      presets.forEach((p, i) => {
        if (p.kind !== 'main') return
        const d = Math.abs(zoom - p.factor)
        if (d < diff) {
          diff = d
          best = i
        }
      })
      if (best >= 0) setSelectedIndex(best)
    },
    [presets, mode],
  )

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={handleCancel}>
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

            {/* Viewfinder */}
            <View style={styles.viewfinderContainer}>
              {visible && (
                <Camera2Preview
                  key={`${combo.logical}-${combo.physical ?? 'none'}`}
                  cameraId={combo.logical}
                  physicalCameraId={combo.physical}
                  active={visible}
                  zoom={zoomProp}
                  flash={flash}
                  captureTag={captureTag}
                  style={StyleSheet.absoluteFill}
                  onStatus={(e) => {
                    setStatusOk(e.nativeEvent.status === 'streaming')
                    setStatusDetail(e.nativeEvent.status === 'error' ? e.nativeEvent.detail : null)
                  }}
                  onZoom={(e) => {
                    const z = e.nativeEvent.zoom
                    setZoomDisplay(z)
                    // Keep zoomProp in sync with the live (pinch-driven) value so
                    // re-tapping the same pill afterwards still re-applies it.
                    setZoomProp((prev) => (Math.abs(prev - z) > 0.01 ? z : prev))
                    syncPill(z)
                  }}
                  onPhoto={(e) => handlePhoto(e.nativeEvent.uri)}
                />
              )}

              {/* zoom factor badge */}
              {statusOk && (
                <View style={styles.zoomBadge}>
                  <ThemedText style={styles.zoomBadgeText}>{zoomDisplay.toFixed(1)}x</ThemedText>
                </View>
              )}

              {/* error banner */}
              {!!statusDetail && (
                <View style={styles.errorBanner}>
                  <ThemedText style={styles.errorText}>{statusDetail}</ThemedText>
                </View>
              )}

              {/* Zoom / lens pills */}
              <View style={styles.zoomOverlay} pointerEvents="box-none">
                <View style={styles.zoomPillBar}>
                  {presets.map((preset, index) => {
                    const isActive = selectedIndex === index
                    return (
                      <TouchableOpacity
                        key={preset.label}
                        onPress={() => handlePreset(index)}
                        style={[styles.zoomPill, isActive && styles.zoomPillActive]}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={[styles.zoomLabel, isActive && styles.zoomLabelActive]}>
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

                <Animated.View style={{ transform: [{ scale: shutterScale }] }}>
                  <TouchableOpacity
                    onPress={handleShutter}
                    disabled={isTakingPicture}
                    style={styles.shutterOuter}
                    activeOpacity={0.9}
                  >
                    <View style={styles.shutterInner} />
                  </TouchableOpacity>
                </Animated.View>

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
  root: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  flashBadge: { position: 'absolute', bottom: 3, right: 5 },
  flashBadgeText: { color: ACTIVE_YELLOW, fontSize: 8, fontWeight: '800' },
  viewfinderContainer: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  zoomBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  zoomBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  errorBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 80,
    backgroundColor: 'rgba(127,29,29,0.85)',
    borderRadius: 8,
    padding: 8,
  },
  errorText: { color: '#fff', fontSize: 11 },
  zoomOverlay: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  zoomPillBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 50,
    padding: 3,
    gap: 2,
  },
  zoomPill: { minWidth: 36, height: 36, paddingHorizontal: 10, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  zoomPillActive: { backgroundColor: 'rgba(255,214,10,0.2)' },
  zoomLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  zoomLabelActive: { color: ACTIVE_YELLOW, fontWeight: '700', fontSize: 13 },
  bottomBar: { paddingTop: 20 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  sideSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  thumbnailContainer: { position: 'relative' },
  thumbnail: { width: 44, height: 44, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
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
  thumbnailBadgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ACTIVE_YELLOW,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  doneText: { color: '#000', fontSize: 13, fontWeight: '700' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionText: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  permissionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})

export default FullCamera
