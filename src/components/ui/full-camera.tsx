/**
 * FullCamera wrapper — 100% safe for Expo Go.
 *
 * The real implementation (`./full-camera.impl`) imports `react-native-vision-camera`,
 * a native module that is NOT available in Expo Go — importing it there throws
 * `system/camera-module-not-found` at module-evaluation time and crashes any
 * screen that pulls in <FullCamera>.
 *
 * To avoid that, the implementation is only dynamically imported when running
 * outside Expo Go (dev client / EAS build). In Expo Go we never load the native
 * module: opening the camera shows an explanatory alert and closes instead.
 */

import React, { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import Constants from 'expo-constants'
import type { FullCameraProps } from './full-camera.impl'

export type { FullCameraProps }

const isExpoGo = Constants.appOwnership === 'expo'

// Module-level cache so the native module is only imported once per session.
let FullCameraComponent: React.ComponentType<FullCameraProps> | null = null
let loadAttempted = false

export function FullCamera(props: FullCameraProps) {
  const [isReady, setIsReady] = useState(isExpoGo || loadAttempted)

  useEffect(() => {
    if (isExpoGo || loadAttempted) {
      setIsReady(true)
      return
    }

    loadAttempted = true
    let cancelled = false

    import('./full-camera.impl')
      .then((module) => {
        FullCameraComponent = module.FullCamera
      })
      .catch((error) => {
        console.log('[FullCamera] Native camera not available:', error)
        FullCameraComponent = null
      })
      .finally(() => {
        if (!cancelled) setIsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // When the camera is opened but no native module is available (Expo Go or a
  // failed load), inform the user and close instead of rendering nothing.
  useEffect(() => {
    if (!isReady || !props.visible || FullCameraComponent) return

    Alert.alert(
      'Câmera indisponível',
      isExpoGo
        ? 'A câmera não está disponível no Expo Go. Use um development build (EAS) para tirar fotos dentro do app.'
        : 'A câmera não está disponível neste dispositivo.',
      [{ text: 'OK' }],
    )
    props.onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, props.visible])

  if (!isReady || !FullCameraComponent) return null

  const Component = FullCameraComponent
  return <Component {...props} />
}

export default FullCamera
