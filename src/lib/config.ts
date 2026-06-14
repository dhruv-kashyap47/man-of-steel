export const APP_CONFIG = {
  name: "MAN OF STEEL",
  tagline: "Integrated Plant Monitoring & Predictive Intelligence",
  version: "2.0.0",
  plantName: "Tata Steel Integrated Plant",
  plantLocation: "Jamshedpur, Jharkhand ▸ India",
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
    processCriticality: number;
    productionImpact: number;
    spareCostUsd: number;
    procurementLeadDays: number;
  }
> = {
  rolling_mill: {
    temperature_c: 68,
    pressure_bar: 6.2,
    rpm: 2800,
    vibration_mm_s: 2.8,
    maxOperatingHours: 50000,
    processCriticality: 9.5,
    productionImpact: 9.0,
    spareCostUsd: 850000,
    procurementLeadDays: 120,
  },
  blast_furnace_fan: {
    temperature_c: 72,
    pressure_bar: 4.8,
    rpm: 1450,
    vibration_mm_s: 3.2,
    maxOperatingHours: 40000,
    processCriticality: 9.8,
    productionImpact: 9.5,
    spareCostUsd: 450000,
    procurementLeadDays: 90,
  },
  hydraulic_pump: {
    temperature_c: 55,
    pressure_bar: 12.5,
    rpm: 1800,
    vibration_mm_s: 1.9,
    maxOperatingHours: 30000,
    processCriticality: 7.5,
    productionImpact: 7.0,
    spareCostUsd: 25000,
    procurementLeadDays: 45,
  },
  conveyor: {
    temperature_c: 45,
    pressure_bar: 2.1,
    rpm: 420,
    vibration_mm_s: 1.2,
    maxOperatingHours: 60000,
    processCriticality: 6.0,
    productionImpact: 5.5,
    spareCostUsd: 120000,
    procurementLeadDays: 60,
  },
  overhead_crane: {
    temperature_c: 38,
    pressure_bar: 8.0,
    rpm: 960,
    vibration_mm_s: 1.5,
    maxOperatingHours: 35000,
    processCriticality: 7.0,
    productionImpact: 6.5,
    spareCostUsd: 180000,
    procurementLeadDays: 75,
  },
  gearbox: {
    temperature_c: 62,
    pressure_bar: 4.5,
    rpm: 1200,
    vibration_mm_s: 2.5,
    maxOperatingHours: 45000,
    processCriticality: 8.0,
    productionImpact: 7.5,
    spareCostUsd: 95000,
    procurementLeadDays: 55,
  },
  compressor: {
    temperature_c: 78,
    pressure_bar: 9.5,
    rpm: 3600,
    vibration_mm_s: 3.5,
    maxOperatingHours: 35000,
    processCriticality: 8.5,
    productionImpact: 8.0,
    spareCostUsd: 210000,
    procurementLeadDays: 70,
  },
  cooling_water_pump: {
    temperature_c: 48,
    pressure_bar: 6.8,
    rpm: 1480,
    vibration_mm_s: 2.2,
    maxOperatingHours: 40000,
    processCriticality: 7.5,
    productionImpact: 7.0,
    spareCostUsd: 18000,
    procurementLeadDays: 30,
  },
  id_fan: {
    temperature_c: 82,
    pressure_bar: 3.2,
    rpm: 980,
    vibration_mm_s: 4.2,
    maxOperatingHours: 38000,
    processCriticality: 8.8,
    productionImpact: 8.5,
    spareCostUsd: 320000,
    procurementLeadDays: 80,
  },
  fd_fan: {
    temperature_c: 75,
    pressure_bar: 5.5,
    rpm: 1480,
    vibration_mm_s: 3.8,
    maxOperatingHours: 36000,
    processCriticality: 8.5,
    productionImpact: 8.0,
    spareCostUsd: 280000,
    procurementLeadDays: 75,
  },
  bearing: {
    temperature_c: 58,
    pressure_bar: 0.5,
    rpm: 2400,
    vibration_mm_s: 1.8,
    maxOperatingHours: 25000,
    processCriticality: 5.0,
    productionImpact: 4.5,
    spareCostUsd: 4500,
    procurementLeadDays: 14,
  },
  drive_system: {
    temperature_c: 65,
    pressure_bar: 3.8,
    rpm: 2200,
    vibration_mm_s: 2.8,
    maxOperatingHours: 42000,
    processCriticality: 8.2,
    productionImpact: 7.8,
    spareCostUsd: 160000,
    procurementLeadDays: 65,
  },
};
