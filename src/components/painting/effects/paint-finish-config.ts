import { PAINT_FINISH } from '@/constants';

export interface PaintFinishConfig {
  label: string;
  roughness: number;
  metalness: number;
  clearCoat: number;
  reflectivity: number;
  specularIntensity: number;
  particleEffect?: {
    enabled: boolean;
    size: number;
    density: number;
    color: string;
  };
  effects: {
    hasSparkle: boolean;
    hasTexture: boolean;
  };
}

export const PAINT_FINISH_CONFIG: Record<PAINT_FINISH, PaintFinishConfig> = {
  [PAINT_FINISH.SOLID]: {
    label: "Lisa",
    roughness: 0,
    metalness: 0,
    clearCoat: 1.0,
    reflectivity: 0.8,
    specularIntensity: 1.2,
    effects: {
      hasSparkle: false,
      hasTexture: false,
    },
  },
  [PAINT_FINISH.METALLIC]: {
    label: "Metálico",
    roughness: 0.15,
    metalness: 0.8,
    clearCoat: 1.0,
    reflectivity: 0.9,
    specularIntensity: 1.5,
    particleEffect: {
      enabled: true,
      size: 1.5,
      density: 10,
      color: "rgba(255, 255, 255, 0.4)",
    },
    effects: {
      hasSparkle: true,
      hasTexture: true,
    },
  },
  [PAINT_FINISH.PEARL]: {
    label: "Perolizado",
    roughness: 0.2,
    metalness: 0.3,
    clearCoat: 1.0,
    reflectivity: 0.7,
    specularIntensity: 1.0,
    particleEffect: {
      enabled: true,
      size: 2.0,
      density: 8,
      color: "rgba(255, 192, 203, 0.3)",
    },
    effects: {
      hasSparkle: true,
      hasTexture: true,
    },
  },
  [PAINT_FINISH.MATTE]: {
    label: "Fosco",
    roughness: 0.9,
    metalness: 0,
    clearCoat: 0,
    reflectivity: 0.1,
    specularIntensity: 0.2,
    effects: {
      hasSparkle: false,
      hasTexture: true,
    },
  },
  [PAINT_FINISH.SATIN]: {
    label: "Semi Brilho",
    roughness: 0.4,
    metalness: 0,
    clearCoat: 0.5,
    reflectivity: 0.5,
    specularIntensity: 0.7,
    effects: {
      hasSparkle: false,
      hasTexture: false,
    },
  },
};
