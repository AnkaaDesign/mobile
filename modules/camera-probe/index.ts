import { requireNativeModule, requireNativeView } from 'expo';
import * as React from 'react';

import type {
  CameraInfo,
  Camera2PreviewProps,
} from './src/CameraProbe.types';

export * from './src/CameraProbe.types';

const CameraProbeModule = requireNativeModule('CameraProbe');

/**
 * Pure Camera2 enumeration of every camera the OS knows about,
 * including hidden physical lenses behind logical multi-cameras.
 */
export function getCameraInfo(): CameraInfo {
  return CameraProbeModule.getCameraInfo();
}

const NativeView: React.ComponentType<Camera2PreviewProps> =
  requireNativeView('CameraProbe');

/**
 * Raw Camera2 preview. Pass a logical `cameraId` and optionally a
 * `physicalCameraId` to stream a specific hidden physical sensor.
 */
export function Camera2Preview(props: Camera2PreviewProps) {
  return React.createElement(NativeView, props);
}
