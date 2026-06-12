// Exported coefficients from XGBoost-style training (scripts/ml/train_model.py)
// Feature order: temperature_c, pressure_bar, rpm, vibration_mm_s, operating_hours_norm

export const MODEL_COEFFICIENTS = {
  version: "v1.0-xgb",
  featureNames: [
    "temperature_c",
    "pressure_bar",
    "rpm",
    "vibration_mm_s",
    "operating_hours_norm",
  ],
  weights: {
    temperature_c: 0.18,
    pressure_bar: 0.12,
    rpm: 0.08,
    vibration_mm_s: 0.35,
    operating_hours_norm: 0.27,
  },
  bias: -0.42,
  rulCoefficients: {
    base: 12000,
    temperature_c: -45,
    pressure_bar: -120,
    rpm: -2.5,
    vibration_mm_s: -800,
    operating_hours_norm: -6000,
  },
  failureModes: {
    rolling_mill: "Roll bearing fatigue",
    blast_furnace_fan: "Drive-end bearing failure",
    hydraulic_pump: "Mechanical seal degradation",
    conveyor: "Drive motor bearing wear",
    overhead_crane: "Hoist gearbox wear",
  } as Record<string, string>,
};
