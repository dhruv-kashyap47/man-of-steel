export const APP_CONFIG = {
  name: "MAN OF STEEL",
  tagline: "Integrated Plant Monitoring & Predictive Intelligence",
  version: "1.0.0",
  plantName: "Tata Steel Integrated Plant",
  plantLocation: "Pittsburgh, PA — Zone 7",
} as const;

export const ML_CONFIG = {
  modelVersion: "v1.0-xgb",
  embeddingDimensions: 1536,
  embeddingModel: "text-embedding-3-small",
  chunkSize: 800,
  chunkOverlap: 100,
  similarityThreshold: 0.72,
  maxCitations: 6,
} as const;

export const SENSOR_THRESHOLDS: Record<
  string,
  { warning: number; critical: number; unit: string }
> = {
  temperature_c: { warning: 75, critical: 90, unit: "°C" },
  pressure_bar: { warning: 8.5, critical: 10, unit: "bar" },
  rpm: { warning: 3200, critical: 3600, unit: "RPM" },
  vibration_mm_s: { warning: 4.5, critical: 7.0, unit: "mm/s" },
};

export const MACHINE_BASELINES: Record<
  string,
  {
    temperature_c: number;
    pressure_bar: number;
    rpm: number;
    vibration_mm_s: number;
    maxOperatingHours: number;
  }
> = {
  rolling_mill: {
    temperature_c: 68,
    pressure_bar: 6.2,
    rpm: 2800,
    vibration_mm_s: 2.8,
    maxOperatingHours: 50000,
  },
  blast_furnace_fan: {
    temperature_c: 72,
    pressure_bar: 4.8,
    rpm: 1450,
    vibration_mm_s: 3.2,
    maxOperatingHours: 40000,
  },
  hydraulic_pump: {
    temperature_c: 55,
    pressure_bar: 12.5,
    rpm: 1800,
    vibration_mm_s: 1.9,
    maxOperatingHours: 30000,
  },
  conveyor: {
    temperature_c: 45,
    pressure_bar: 2.1,
    rpm: 420,
    vibration_mm_s: 1.2,
    maxOperatingHours: 60000,
  },
  overhead_crane: {
    temperature_c: 38,
    pressure_bar: 8.0,
    rpm: 960,
    vibration_mm_s: 1.5,
    maxOperatingHours: 35000,
  },
};
