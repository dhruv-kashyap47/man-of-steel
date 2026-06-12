import { MACHINE_BASELINES } from "@/lib/config";
import { MODEL_COEFFICIENTS } from "./model";
import type { MachineType, RiskLevel } from "@/types/database";
import type { PredictionResult } from "@/types";

export interface SensorFeatures {
  temperature_c: number;
  pressure_bar: number;
  rpm: number;
  vibration_mm_s: number;
  operating_hours: number;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function normalizeOperatingHours(hours: number, machineType: MachineType): number {
  const max = MACHINE_BASELINES[machineType].maxOperatingHours;
  return Math.min(1, hours / max);
}

export function predictFailure(
  features: SensorFeatures,
  machineType: MachineType
): PredictionResult {
  const { weights, bias, rulCoefficients } = MODEL_COEFFICIENTS;
  const hoursNorm = normalizeOperatingHours(features.operating_hours, machineType);

  const logit =
    bias +
    weights.temperature_c * (features.temperature_c / 100) +
    weights.pressure_bar * (features.pressure_bar / 15) +
    weights.rpm * (features.rpm / 4000) +
    weights.vibration_mm_s * (features.vibration_mm_s / 10) +
    weights.operating_hours_norm * hoursNorm;

  const failureProbability = Math.round(sigmoid(logit) * 10000) / 10000;

  const rul =
    rulCoefficients.base +
    rulCoefficients.temperature_c * (features.temperature_c / 100) +
    rulCoefficients.pressure_bar * (features.pressure_bar / 15) +
    rulCoefficients.rpm * (features.rpm / 4000) +
    rulCoefficients.vibration_mm_s * (features.vibration_mm_s / 10) +
    rulCoefficients.operating_hours_norm * hoursNorm;

  const remainingUsefulLifeHours = Math.max(100, Math.round(rul));

  const riskLevel: RiskLevel =
    failureProbability > 0.75
      ? "critical"
      : failureProbability > 0.5
        ? "high"
        : failureProbability > 0.25
          ? "medium"
          : "low";

  const confidence = Math.min(
    0.95,
    0.7 + Math.abs(failureProbability - 0.5) * 0.4
  );

  return {
    failureProbability,
    remainingUsefulLifeHours,
    predictedFailureMode:
      MODEL_COEFFICIENTS.failureModes[machineType] ?? "Unknown failure mode",
    confidence: Math.round(confidence * 10000) / 10000,
    riskLevel,
    features: {
      temperature_c: features.temperature_c,
      pressure_bar: features.pressure_bar,
      rpm: features.rpm,
      vibration_mm_s: features.vibration_mm_s,
      operating_hours: features.operating_hours,
    },
  };
}

export function predictFromLatestSensors(
  readings: SensorFeatures,
  machineType: MachineType,
  operatingHours: number
): PredictionResult {
  return predictFailure(
    { ...readings, operating_hours: operatingHours },
    machineType
  );
}

export function whatIfAnalysis(
  base: SensorFeatures,
  machineType: MachineType,
  changes: Partial<SensorFeatures>
): PredictionResult {
  return predictFailure({ ...base, ...changes }, machineType);
}
