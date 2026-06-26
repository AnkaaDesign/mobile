export type CameraKind = 'public' | 'hidden-physical' | 'hidden-bruteforce';

export interface ProbedCamera {
  id: string;
  kind: CameraKind;
  parentLogicalId: string | null;
  facing?: 'front' | 'back' | 'external' | 'unknown';
  focalLengthsMm?: number[];
  sensorWidthMm?: number | null;
  sensorHeightMm?: number | null;
  horizontalFovDeg?: number | null;
  equivalent35mm?: number | null;
  hardwareLevel?: string;
  isLogicalMultiCamera?: boolean;
  physicalCameraIds?: string[];
  maxDigitalZoom?: number | null;
  zoomRatioMin?: number | null;
  zoomRatioMax?: number | null;
  error?: string;
}

export interface CameraInfo {
  androidApiLevel: number;
  manufacturer: string;
  model: string;
  publicCameraIds: string[];
  bruteForceFoundIds?: string[];
  cameras: ProbedCamera[];
}

export interface Camera2StatusEvent {
  status:
    | 'opened'
    | 'streaming'
    | 'configured'
    | 'error'
    | 'disconnected';
  cameraId: string | null;
  physicalCameraId: string | null;
  detail: string | null;
}

export interface Camera2PhotoEvent {
  uri: string;
  width: number;
  height: number;
}

export interface Camera2ZoomEvent {
  zoom: number;
  min: number;
  max: number;
}

export interface Camera2PreviewProps {
  cameraId: string;
  physicalCameraId?: string | null;
  active?: boolean;
  /** Bump this number to trigger a still capture. */
  captureTag?: number;
  /** Set zoom ratio directly (tap presets). */
  zoom?: number;
  style?: any;
  onStatus?: (event: { nativeEvent: Camera2StatusEvent }) => void;
  onPhoto?: (event: { nativeEvent: Camera2PhotoEvent }) => void;
  onZoom?: (event: { nativeEvent: Camera2ZoomEvent }) => void;
}
