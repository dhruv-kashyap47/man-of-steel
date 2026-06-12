import { v4 as uuidv4 } from "uuid";
import { subDays, subHours, addHours } from "date-fns";
import { MACHINE_BASELINES } from "@/lib/config";
import type {
  Asset,
  Alert,
  AIInsight,
  FailurePrediction,
  MaintenanceRecord,
  Plant,
  SensorReading,
  MachineType,
  AssetStatus,
  RiskLevel,
} from "@/types/database";

const MACHINE_TYPES: MachineType[] = [
  "rolling_mill",
  "blast_furnace_fan",
  "hydraulic_pump",
  "conveyor",
  "overhead_crane",
];

const ASSET_DEFINITIONS: Array<{
  name: string;
  machine_type: MachineType;
  serial_number: string;
  status: AssetStatus;
  location_zone: string;
  manufacturer: string;
  model: string;
  operating_hours: number;
  health_modifier: number;
  risk: RiskLevel;
}> = [
  { name: "Hot Strip Mill #1", machine_type: "rolling_mill", serial_number: "RM-2847", status: "operational", location_zone: "Mill Bay A", manufacturer: "Siemens", model: "X-Roll 4500", operating_hours: 38420, health_modifier: 0, risk: "low" },
  { name: "Hot Strip Mill #2", machine_type: "rolling_mill", serial_number: "RM-2848", status: "degraded", location_zone: "Mill Bay A", manufacturer: "Siemens", model: "X-Roll 4500", operating_hours: 42100, health_modifier: -18, risk: "medium" },
  { name: "Blast Furnace Fan A", machine_type: "blast_furnace_fan", serial_number: "BF-1102", status: "critical", location_zone: "Furnace Zone 3", manufacturer: "Howden", model: "HV-TURBO 88", operating_hours: 31200, health_modifier: -42, risk: "critical" },
  { name: "Blast Furnace Fan B", machine_type: "blast_furnace_fan", serial_number: "BF-1103", status: "operational", location_zone: "Furnace Zone 3", manufacturer: "Howden", model: "HV-TURBO 88", operating_hours: 28900, health_modifier: -5, risk: "low" },
  { name: "Hydraulic Pump H1", machine_type: "hydraulic_pump", serial_number: "HP-4421", status: "degraded", location_zone: "Hydraulics Room", manufacturer: "Bosch Rexroth", model: "A4VSO 250", operating_hours: 22100, health_modifier: -22, risk: "high" },
  { name: "Hydraulic Pump H2", machine_type: "hydraulic_pump", serial_number: "HP-4422", status: "operational", location_zone: "Hydraulics Room", manufacturer: "Bosch Rexroth", model: "A4VSO 250", operating_hours: 19800, health_modifier: 0, risk: "low" },
  { name: "Main Conveyor C1", machine_type: "conveyor", serial_number: "CV-7710", status: "operational", location_zone: "Material Handling", manufacturer: "Metso", model: "BeltLine 900", operating_hours: 51200, health_modifier: -8, risk: "low" },
  { name: "Scrap Conveyor C2", machine_type: "conveyor", serial_number: "CV-7711", status: "maintenance", location_zone: "Scrap Yard", manufacturer: "Metso", model: "BeltLine 600", operating_hours: 44800, health_modifier: -30, risk: "medium" },
  { name: "Overhead Crane OC-1", machine_type: "overhead_crane", serial_number: "OC-3301", status: "operational", location_zone: "Bay 7", manufacturer: "Konecranes", model: "CXT 50t", operating_hours: 28400, health_modifier: 0, risk: "low" },
  { name: "Overhead Crane OC-2", machine_type: "overhead_crane", serial_number: "OC-3302", status: "degraded", location_zone: "Bay 9", manufacturer: "Konecranes", model: "CXT 50t", operating_hours: 30100, health_modifier: -15, risk: "medium" },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function noise(rand: () => number, amplitude: number): number {
  return (rand() - 0.5) * 2 * amplitude;
}

export function generatePlant(): Plant {
  const now = new Date().toISOString();
  return {
    id: "plant-arc-msw-001",
    name: "Tata Steel Integrated Plant",
    location: "Pittsburgh, PA — Zone 7",
    capacity: "4.2M tons/year",
    health_score: 74.2,
    created_at: now,
    updated_at: now,
  };
}

export function generateAssets(plantId: string): Asset[] {
  const now = new Date().toISOString();
  return ASSET_DEFINITIONS.map((def) => {
    const baseline = MACHINE_BASELINES[def.machine_type];
    const health = Math.max(20, Math.min(100, 88 + def.health_modifier + noise(() => Math.random(), 3)));
    const failureProb = Math.max(0.02, Math.min(0.95, (100 - health) / 100 * 0.85));
    const rul = baseline.maxOperatingHours - def.operating_hours;
    const remaining = Math.max(200, rul * (1 - failureProb * 0.6));

    return {
      id: uuidv4(),
      plant_id: plantId,
      name: def.name,
      machine_type: def.machine_type,
      serial_number: def.serial_number,
      status: def.status,
      health_score: Math.round(health * 10) / 10,
      location_zone: def.location_zone,
      manufacturer: def.manufacturer,
      model: def.model,
      install_date: "2018-03-15",
      operating_hours: def.operating_hours,
      last_maintenance: subDays(new Date(), def.status === "maintenance" ? 1 : 45 + Math.floor(Math.random() * 60)).toISOString(),
      failure_probability: Math.round(failureProb * 10000) / 10000,
      remaining_useful_life_hours: Math.round(remaining),
      risk_level: def.risk,
      metadata: { zone_priority: def.risk === "critical" ? 1 : 3 },
      created_at: now,
      updated_at: now,
    };
  });
}

export function generateSensorReadings(asset: Asset, hours = 72): SensorReading[] {
  const baseline = MACHINE_BASELINES[asset.machine_type];
  const rand = seededRandom(asset.serial_number.charCodeAt(0) * 1000);
  const readings: SensorReading[] = [];
  const degradation = (100 - asset.health_score) / 100;

  for (let h = hours; h >= 0; h -= 2) {
    const t = subHours(new Date(), h);
    const trend = degradation * (1 - h / hours) * 0.3;
    readings.push({
      id: uuidv4(),
      asset_id: asset.id,
      recorded_at: t.toISOString(),
      temperature_c: Math.round((baseline.temperature_c + trend * 15 + noise(rand, 3)) * 100) / 100,
      pressure_bar: Math.round((baseline.pressure_bar + trend * 2 + noise(rand, 0.4)) * 100) / 100,
      rpm: Math.round(baseline.rpm + trend * 200 + noise(rand, 50)),
      vibration_mm_s: Math.round((baseline.vibration_mm_s + trend * 3 + noise(rand, 0.3)) * 10000) / 10000,
      operating_hours: asset.operating_hours - h * 0.5,
      created_at: t.toISOString(),
    });
  }
  return readings;
}

export function generateAlerts(assets: Asset[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  const criticalAsset = assets.find((a) => a.status === "critical");
  if (criticalAsset) {
    alerts.push({
      id: uuidv4(),
      asset_id: criticalAsset.id,
      title: "Critical Vibration Exceeded",
      description: `Vibration on ${criticalAsset.name} exceeded 6.8 mm/s threshold. Bearing wear pattern detected. Immediate inspection recommended.`,
      severity: "critical",
      status: "active",
      sensor_metric: "vibration_mm_s",
      threshold: 7.0,
      actual_value: 6.82,
      acknowledged_at: null,
      resolved_at: null,
      created_at: subHours(new Date(), 2).toISOString(),
      updated_at: now,
    });
    alerts.push({
      id: uuidv4(),
      asset_id: criticalAsset.id,
      title: "Elevated Bearing Temperature",
      description: "Drive-end bearing temperature trending 12°C above baseline over 48 hours.",
      severity: "warning",
      status: "active",
      sensor_metric: "temperature_c",
      threshold: 75,
      actual_value: 84.3,
      acknowledged_at: null,
      resolved_at: null,
      created_at: subHours(new Date(), 8).toISOString(),
      updated_at: now,
    });
  }

  const degraded = assets.filter((a) => a.status === "degraded");
  degraded.forEach((asset, i) => {
    alerts.push({
      id: uuidv4(),
      asset_id: asset.id,
      title: i === 0 ? "Pressure Anomaly Detected" : "Performance Degradation",
      description: `${asset.name} showing gradual performance decline. Schedule predictive maintenance within 72 hours.`,
      severity: "warning",
      status: "active",
      sensor_metric: "pressure_bar",
      threshold: 8.5,
      actual_value: 7.8 + i,
      acknowledged_at: null,
      resolved_at: null,
      created_at: subHours(new Date(), 12 + i * 4).toISOString(),
      updated_at: now,
    });
  });

  alerts.push({
    id: uuidv4(),
    asset_id: assets[0].id,
    title: "Scheduled Calibration Due",
    description: "Annual sensor calibration window opens in 5 days.",
    severity: "info",
    status: "active",
    sensor_metric: null,
    threshold: null,
    actual_value: null,
    acknowledged_at: null,
    resolved_at: null,
    created_at: subDays(new Date(), 1).toISOString(),
    updated_at: now,
  });

  return alerts;
}

export function generateMaintenanceRecords(assets: Asset[]): MaintenanceRecord[] {
  const records: MaintenanceRecord[] = [];
  const types = ["preventive", "corrective", "predictive", "emergency"] as const;

  assets.forEach((asset) => {
    for (let i = 0; i < 3; i++) {
      records.push({
        id: uuidv4(),
        asset_id: asset.id,
        maintenance_type: types[i % types.length],
        title: [
          "Bearing lubrication service",
          "Seal replacement — hydraulic circuit",
          "Vibration analysis & alignment",
          "Emergency motor rewind",
        ][i % 4],
        description: `Routine maintenance performed on ${asset.name}. All safety checks passed.`,
        technician: ["J. Martinez", "S. Patel", "R. Okafor", "M. Chen"][i % 4],
        parts_replaced: i === 1 ? ["Mechanical seal kit", "O-ring set"] : ["Lubricant ISO VG 68"],
        downtime_hours: i === 3 ? 18 : 4 + i * 2,
        cost_usd: 2400 + i * 1800 + Math.floor(Math.random() * 1000),
        performed_at: subDays(new Date(), 30 + i * 45).toISOString(),
        next_due_at: addHours(subDays(new Date(), 30 + i * 45), 90 * 24).toISOString(),
        created_at: subDays(new Date(), 30 + i * 45).toISOString(),
      });
    }
  });
  return records;
}

export function generatePredictions(assets: Asset[]): FailurePrediction[] {
  return assets.map((asset) => ({
    id: uuidv4(),
    asset_id: asset.id,
    failure_probability: asset.failure_probability ?? 0.1,
    remaining_useful_life_hours: asset.remaining_useful_life_hours ?? 5000,
    predicted_failure_mode: getFailureMode(asset.machine_type),
    confidence: 0.75 + (asset.health_score / 100) * 0.2,
    model_version: "v1.0-xgb",
    input_features: {
      temperature_c: MACHINE_BASELINES[asset.machine_type].temperature_c,
      pressure_bar: MACHINE_BASELINES[asset.machine_type].pressure_bar,
      rpm: MACHINE_BASELINES[asset.machine_type].rpm,
      vibration_mm_s: MACHINE_BASELINES[asset.machine_type].vibration_mm_s,
      operating_hours: asset.operating_hours,
    },
    predicted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }));
}

export function generateInsights(plantId: string, assets: Asset[]): AIInsight[] {
  const critical = assets.find((a) => a.status === "critical");
  const now = new Date().toISOString();
  return [
    {
      id: uuidv4(),
      plant_id: plantId,
      asset_id: critical?.id ?? null,
      insight_type: "prediction",
      title: "Imminent Fan Bearing Failure",
      summary: "Blast Furnace Fan A shows classic bearing degradation signature. 87% failure probability within 120 hours if unaddressed.",
      impact: "$2.4M production loss risk if furnace trip occurs",
      priority: 5,
      metadata: { confidence: 0.87 },
      created_at: now,
      expires_at: null,
    },
    {
      id: uuidv4(),
      plant_id: plantId,
      asset_id: null,
      insight_type: "trend",
      title: "Plant-Wide Vibration Uptick",
      summary: "Average vibration across rolling assets increased 8% over 30 days. Correlates with summer ambient temperature rise.",
      impact: "Schedule fleet-wide vibration survey",
      priority: 3,
      metadata: {},
      created_at: now,
      expires_at: null,
    },
    {
      id: uuidv4(),
      plant_id: plantId,
      asset_id: assets.find((a) => a.machine_type === "hydraulic_pump" && a.status === "degraded")?.id ?? null,
      insight_type: "recommendation",
      title: "Hydraulic Pump Seal Replacement",
      summary: "HP-4421 pressure instability matches seal wear pattern from SOP-HYD-014. Replace mechanical seal during next shutdown window.",
      impact: "Prevents unplanned 18hr downtime",
      priority: 4,
      metadata: { sop_ref: "SOP-HYD-014" },
      created_at: now,
      expires_at: null,
    },
    {
      id: uuidv4(),
      plant_id: plantId,
      asset_id: null,
      insight_type: "anomaly",
      title: "Conveyor C2 Maintenance Overrun",
      summary: "Scrap Conveyor C2 maintenance duration exceeded plan by 6 hours. Parts availability flagged as root constraint.",
      impact: "Review spare parts stocking policy",
      priority: 2,
      metadata: {},
      created_at: now,
      expires_at: null,
    },
  ];
}

function getFailureMode(type: MachineType): string {
  const modes: Record<MachineType, string> = {
    rolling_mill: "Roll bearing fatigue",
    blast_furnace_fan: "Drive-end bearing failure",
    hydraulic_pump: "Mechanical seal degradation",
    conveyor: "Drive motor bearing wear",
    overhead_crane: "Hoist gearbox wear",
  };
  return modes[type];
}

export { MACHINE_TYPES, ASSET_DEFINITIONS };
