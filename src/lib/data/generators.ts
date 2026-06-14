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
  MaintenancePriority,
  PriorityLevel,
  MaintenanceFeedback,
  ExperienceNode,
  EngineerFeedback,
  EarlyWarning,
  PlantBottleneck,
  SpareShortage,
  AlertSeverity,
  DocumentType,
} from "@/types/database";

const MACHINE_TYPES: MachineType[] = [
  "rolling_mill",
  "blast_furnace_fan",
  "hydraulic_pump",
  "conveyor",
  "overhead_crane",
  "gearbox",
  "compressor",
  "cooling_water_pump",
  "id_fan",
  "fd_fan",
  "bearing",
  "drive_system",
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
  process_criticality: number;
  production_impact: number;
}> = [
  { name: "Hot Strip Mill #1", machine_type: "rolling_mill", serial_number: "RM-2847", status: "operational", location_zone: "Mill Bay A", manufacturer: "Siemens", model: "X-Roll 4500", operating_hours: 38420, health_modifier: 0, risk: "low", process_criticality: 9.5, production_impact: 9.0 },
  { name: "Hot Strip Mill #2", machine_type: "rolling_mill", serial_number: "RM-2848", status: "degraded", location_zone: "Mill Bay A", manufacturer: "Siemens", model: "X-Roll 4500", operating_hours: 42100, health_modifier: -18, risk: "medium", process_criticality: 9.5, production_impact: 9.0 },
  { name: "Blast Furnace Fan A", machine_type: "blast_furnace_fan", serial_number: "BF-1102", status: "critical", location_zone: "Furnace Zone 3", manufacturer: "Howden", model: "HV-TURBO 88", operating_hours: 31200, health_modifier: -42, risk: "critical", process_criticality: 9.8, production_impact: 9.5 },
  { name: "Blast Furnace Fan B", machine_type: "blast_furnace_fan", serial_number: "BF-1103", status: "operational", location_zone: "Furnace Zone 3", manufacturer: "Howden", model: "HV-TURBO 88", operating_hours: 28900, health_modifier: -5, risk: "low", process_criticality: 9.8, production_impact: 9.5 },
  { name: "Hydraulic Pump H1", machine_type: "hydraulic_pump", serial_number: "HP-4421", status: "degraded", location_zone: "Hydraulics Room", manufacturer: "Bosch Rexroth", model: "A4VSO 250", operating_hours: 22100, health_modifier: -22, risk: "high", process_criticality: 7.5, production_impact: 7.0 },
  { name: "Hydraulic Pump H2", machine_type: "hydraulic_pump", serial_number: "HP-4422", status: "operational", location_zone: "Hydraulics Room", manufacturer: "Bosch Rexroth", model: "A4VSO 250", operating_hours: 19800, health_modifier: 0, risk: "low", process_criticality: 7.5, production_impact: 7.0 },
  { name: "Main Conveyor C1", machine_type: "conveyor", serial_number: "CV-7710", status: "operational", location_zone: "Material Handling", manufacturer: "Metso", model: "BeltLine 900", operating_hours: 51200, health_modifier: -8, risk: "low", process_criticality: 6.0, production_impact: 5.5 },
  { name: "Scrap Conveyor C2", machine_type: "conveyor", serial_number: "CV-7711", status: "maintenance", location_zone: "Scrap Yard", manufacturer: "Metso", model: "BeltLine 600", operating_hours: 44800, health_modifier: -30, risk: "medium", process_criticality: 6.0, production_impact: 5.5 },
  { name: "Overhead Crane OC-1", machine_type: "overhead_crane", serial_number: "OC-3301", status: "operational", location_zone: "Bay 7", manufacturer: "Konecranes", model: "CXT 50t", operating_hours: 28400, health_modifier: 0, risk: "low", process_criticality: 7.0, production_impact: 6.5 },
  { name: "Overhead Crane OC-2", machine_type: "overhead_crane", serial_number: "OC-3302", status: "degraded", location_zone: "Bay 9", manufacturer: "Konecranes", model: "CXT 50t", operating_hours: 30100, health_modifier: -15, risk: "medium", process_criticality: 7.0, production_impact: 6.5 },
  { name: "Main Mill Gearbox GB-1", machine_type: "gearbox", serial_number: "GB-5501", status: "degraded", location_zone: "Mill Bay A", manufacturer: "Flender", model: "H2SH 450", operating_hours: 36500, health_modifier: -12, risk: "medium", process_criticality: 8.0, production_impact: 7.5 },
  { name: "Cooling Tower Gearbox GB-2", machine_type: "gearbox", serial_number: "GB-5502", status: "operational", location_zone: "Cooling Tower", manufacturer: "Flender", model: "H2SH 280", operating_hours: 28200, health_modifier: 0, risk: "low", process_criticality: 8.0, production_impact: 7.5 },
  { name: "Air Compressor AC-1", machine_type: "compressor", serial_number: "CP-2201", status: "degraded", location_zone: "Compressor House", manufacturer: "Atlas Copco", model: "ZH 7000", operating_hours: 41800, health_modifier: -25, risk: "high", process_criticality: 8.5, production_impact: 8.0 },
  { name: "Instrument Compressor AC-2", machine_type: "compressor", serial_number: "CP-2202", status: "operational", location_zone: "Compressor House", manufacturer: "Atlas Copco", model: "ZH 7000", operating_hours: 37400, health_modifier: -5, risk: "low", process_criticality: 8.5, production_impact: 8.0 },
  { name: "Cooling Water Pump WP-1", machine_type: "cooling_water_pump", serial_number: "WP-1801", status: "operational", location_zone: "Pump House B", manufacturer: "Grundfos", model: "NK 300-400", operating_hours: 22500, health_modifier: 0, risk: "low", process_criticality: 7.5, production_impact: 7.0 },
  { name: "Cooling Water Pump WP-2", machine_type: "cooling_water_pump", serial_number: "WP-1802", status: "degraded", location_zone: "Pump House B", manufacturer: "Grundfos", model: "NK 300-400", operating_hours: 25100, health_modifier: -20, risk: "medium", process_criticality: 7.5, production_impact: 7.0 },
  { name: "ID Fan IF-1", machine_type: "id_fan", serial_number: "IF-9101", status: "critical", location_zone: "Furnace Zone 2", manufacturer: "ABB", model: "ARF 2000", operating_hours: 34800, health_modifier: -38, risk: "critical", process_criticality: 8.8, production_impact: 8.5 },
  { name: "ID Fan IF-2", machine_type: "id_fan", serial_number: "IF-9102", status: "degraded", location_zone: "Furnace Zone 2", manufacturer: "ABB", model: "ARF 2000", operating_hours: 31200, health_modifier: -14, risk: "medium", process_criticality: 8.8, production_impact: 8.5 },
  { name: "FD Fan FF-1", machine_type: "fd_fan", serial_number: "FF-8101", status: "operational", location_zone: "Boiler House", manufacturer: "Siemens", model: "SFA 1800", operating_hours: 29800, health_modifier: -6, risk: "low", process_criticality: 8.5, production_impact: 8.0 },
  { name: "FD Fan FF-2", machine_type: "fd_fan", serial_number: "FF-8102", status: "maintenance", location_zone: "Boiler House", manufacturer: "Siemens", model: "SFA 1800", operating_hours: 31500, health_modifier: -28, risk: "high", process_criticality: 8.5, production_impact: 8.0 },
  { name: "Drive Motor Bearing Assembly", machine_type: "bearing", serial_number: "BR-4401", status: "degraded", location_zone: "Mill Bay B", manufacturer: "SKF", model: "CARB C4028", operating_hours: 18500, health_modifier: -35, risk: "high", process_criticality: 5.0, production_impact: 4.5 },
  { name: "Roll Drive System DS-1", machine_type: "drive_system", serial_number: "DS-7701", status: "operational", location_zone: "Mill Bay A", manufacturer: "ABB", model: "ACS 880", operating_hours: 33200, health_modifier: -4, risk: "low", process_criticality: 8.2, production_impact: 7.8 },
];

const FAILURE_SCENARIOS = [
  { type: "Bearing degradation", symptoms: ["Elevated vibration on DE bearing", "Temperature rise 8-12C above baseline", "High-frequency noise in 2-4kHz range"], rootCause: "Grease contamination with scale dust", fix: "Replace bearing, clean housing, regrease with EP2", parts: ["Spherical roller bearing 22328", "Viton seal kit", "EP2 grease 5kg"], daysToFail: 14 },
  { type: "Lubrication contamination", symptoms: ["Oil analysis shows water ingress", "Filter differential pressure high", "Increased wear debris in oil sample"], rootCause: "Seal failure allowing moisture ingress", fix: "Replace all hydraulic seals, flush system, replace filters", parts: ["Seal kit HP-4421", "ISO VG 68 oil 200L", "Return filter element"], daysToFail: 7 },
  { type: "Shaft misalignment", symptoms: ["High 1X RPM vibration axial", "Coupling hub temperature elevated", "Bolt shear marks on coupling"], rootCause: "Thermal growth differential during startup", fix: "Laser align shaft train, replace coupling insert", parts: ["Coupling insert EZ-200", "Alignment shim set"], daysToFail: 21 },
  { type: "Rotor imbalance", symptoms: ["1X RPM vibration increasing with speed", "Bearing housing vibration >5mm/s", "Seal rub marks on rotor"], rootCause: "Erosion wear on fan blades from particulate", fix: "Dynamic balancing in-situ, blade profile restoration", parts: ["Balance weights set", "Wear-resistant coating"], daysToFail: 10 },
  { type: "Motor overheating", symptoms: ["Stator winding temp >130C", "Insulation resistance declining", "Cooling air outlet hot"], rootCause: "Cooling fan duct blockage + winding contamination", fix: "Clean cooling ducts, dry-out windings, test insulation", parts: ["Insulation cleaner aerosol", "Cooling fan filter set"], daysToFail: 5 },
  { type: "Pump cavitation", symptoms: ["Erratic pressure readings", "Gravel-like noise from pump casing", "Impeller pitting on inspection"], rootCause: "Suction strainer clogging + low NPSH", fix: "Clean suction strainer, replace impeller, adjust flow rate", parts: ["Impeller 250mm", "Suction strainer mesh", "Mechanical seal"], daysToFail: 3 },
  { type: "Belt slippage", symptoms: ["Drive motor amp draw fluctuating", "Rubber smell from drive area", "Speed reduction on driven shaft"], rootCause: "Belt tension loss + material buildup on pulleys", fix: "Replace drive belts, clean pulleys, re-tension", parts: ["V-belt set SPC-5000", "Pulley cleaning tool"], daysToFail: 2 },
  { type: "Gear wear", symptoms: ["Tooth contact pattern uneven", "Gear mesh frequency vibration rising", "Metal particles in oil sample"], rootCause: "Insufficient lubrication during peak load", fix: "Replace gearbox, clean sump, fill with correct viscosity", parts: ["Gearbox assembly GB-5501", "ISO 320 gear oil 100L"], daysToFail: 30 },
  { type: "Seal failure", symptoms: ["Visible leakage at shaft seal", "Oil level dropping", "Oil mist in ambient air"], rootCause: "Seal lip hardening from heat aging", fix: "Replace shaft seal, inspect shaft sleeve for wear", parts: ["Shaft seal 75x100x12", "Shaft sleeve"], daysToFail: 4 },
  { type: "Hydraulic leakage", symptoms: ["System pressure dropping", "Pump cycling frequency increased", "Oil puddles under valve bank"], rootCause: "O-ring degradation in manifold", fix: "Replace O-ring set, pressure test circuit", parts: ["O-ring kit NBR-70", "Hydraulic hose assembly"], daysToFail: 1 },
  { type: "Electrical winding fault", symptoms: ["Phase-to-ground resistance low", "Motor current imbalance >5%", "Burning smell from terminal box"], rootCause: "Moisture ingress + thermal cycling", fix: "Megger test, rewind stator, varnish dip", parts: ["Stator winding wire", "Varnish dip tank"], daysToFail: 14 },
  { type: "Vibration escalation", symptoms: ["Overall vibration >10mm/s broadband", "Multiple harmonic peaks in spectrum", "Bearing temperature >95C"], rootCause: "Cascading bearing failure from lubrication loss", fix: "Emergency bearing replacement, root cause investigation", parts: ["Bearing NU224", "Bearing 6228", "High-temp grease"], daysToFail: 2 },
];

const PLANT_BOTTLENECK_SCENARIOS = [
  { type: "Production bottleneck", severity: "critical" as AlertSeverity, desc: "Blast Furnace Fan A degradation limiting furnace throughput to 78% capacity", impact: "$380K/day production loss", downtime: 48, cost: 18500000 },
  { type: "Material handling constraint", severity: "warning" as AlertSeverity, desc: "Scrap Conveyor C2 maintenance causing scrap feed delay to BOF", impact: "18hr batch delay impact", downtime: 18, cost: 3200000 },
  { type: "Cooling constraint", severity: "warning" as AlertSeverity, desc: "Cooling Water Pump WP-2 degraded capacity risking mill cooling", impact: "Forced production rate reduction 15%", downtime: 24, cost: 4800000 },
  { type: "Draft group limitation", severity: "critical" as AlertSeverity, desc: "ID Fan IF-1 critical ▸ furnace draft limited, reducing melt rate", impact: "Melt rate reduced by 22%", downtime: 72, cost: 14200000 },
];

const SPARE_SHORTAGE_SCENARIOS = [
  { part: "Spherical roller bearing 22328", asset: "BR-4401", stock: 0, reorder: 3, lead: 14, priority: "p1_critical" as PriorityLevel, impact: "Cannot perform bearing replacement on Drive Motor Assembly" },
  { part: "Hydraulic seal kit HP-4421", asset: "HP-4421", stock: 1, reorder: 3, lead: 21, priority: "p2_high" as PriorityLevel, impact: "Only 1 seal kit available for 3 pumps in service" },
  { part: "Fan impeller ARF 2000", asset: "IF-9101", stock: 0, reorder: 1, lead: 60, priority: "p1_critical" as PriorityLevel, impact: "Lead time 60 days ▸ no spare impeller for ID Fan IF-1" },
  { part: "Cooling fan filter set", asset: "RM-2847", stock: 0, reorder: 5, lead: 7, priority: "p3_medium" as PriorityLevel, impact: "No filters in stock ▸ rolling mill motor cooling at risk" },
  { part: "V-belt set SPC-5000", asset: "CV-7710", stock: 2, reorder: 4, lead: 3, priority: "p3_medium" as PriorityLevel, impact: "Below reorder point ▸ 2 remaining" },
];

const EXPERIENCE_NODE_SCENARIOS = [
  { incidentType: "Bearings degradation ▸ grease contamination", symptoms: ["Elevated vibration 4.5mm/s", "Temperature rise 10C", "High-frequency noise"], rootCause: "Scale dust ingress through failed seal", fix: "Replaced bearing 22328, installed labyrinth seal", effective: true, parts: ["Bearing 22328", "Labyrinth seal kit", "EP2 grease"], downtime: 8, cost: 18500, recurring: true, confidence: 0.12 },
  { incidentType: "Hydraulic pump seal failure", symptoms: ["Pressure fluctuation +/-3bar", "Oil leakage 5L/day", "Pump cycling 2x normal"], rootCause: "O-ring thermal degradation in manifold", fix: "Replaced all manifold O-rings, pressure tested", effective: true, parts: ["O-ring kit NBR-70", "Hydraulic oil 20L"], downtime: 4, cost: 3200, recurring: true, confidence: 0.08 },
  { incidentType: "Fan rotor imbalance after rebuild", symptoms: ["1X RPM vibration 8mm/s", "Bearing housing hot 88C", "Seal rub marks visible"], rootCause: "Erosion wear uneven on blade trailing edges", fix: "In-situ dynamic balancing, blade profile restored", effective: true, parts: ["Balance weights", "Ceramic coating"], downtime: 12, cost: 28000, recurring: false, confidence: 0.15 },
  { incidentType: "Motor winding insulation failure", symptoms: ["Ground fault relay tripped", "Insulation resistance 0.5MΩ", "Burning smell from windings"], rootCause: "Moisture ingress through conduit seal", fix: "Rewound stator, installed heater bands, resealed conduit", effective: true, parts: ["Stator winding kit", "Heater band set", "Conduit seal"], downtime: 72, cost: 95000, recurring: false, confidence: 0.2 },
  { incidentType: "Gearbox tooth fracture ▸ overload", symptoms: ["Gear mesh frequency vibration spiking", "Metal chunks in oil filter", "Loud knocking from gearbox"], rootCause: "Torque spike from mill cobble event", fix: "Replaced gearbox assembly, upgraded coupling torque limiter", effective: true, parts: ["Gearbox H2SH 450", "Torque limiter"], downtime: 36, cost: 145000, recurring: true, confidence: 0.18 },
  { incidentType: "Pump cavitation damage", symptoms: ["Erratic discharge pressure", "Gravel noise from volute", "Impeller pitting found"], rootCause: "Suction strainer 60% blocked + low sump level", fix: "Cleaned strainer, replaced impeller, installed level control", effective: true, parts: ["Impeller 250mm", "Level transmitter"], downtime: 6, cost: 8500, recurring: true, confidence: 0.1 },
];

const FEEDBACK_SCENARIOS = [
  { query: "Elevated vibration on Blast Furnace Fan A", diagnosis: "Bearing wear from contamination", prediction: { failureProbability: 0.82, mode: "DE bearing failure" }, recommendation: "Replace bearing within 48 hours", outcome: "Bearing replaced, contamination found in grease", rootCauseApproved: "Grease contamination with scale dust", resolution: "Replaced bearing, installed labyrinth seal, switched to EP2 grease", feedback: "correct" as EngineerFeedback },
  { query: "Hydraulic Pump H1 pressure instability", diagnosis: "Seal degradation", prediction: { failureProbability: 0.65, mode: "Mechanical seal degradation" }, recommendation: "Schedule seal replacement", outcome: "Found O-ring degradation in manifold, not seal", rootCauseApproved: "O-ring thermal degradation", resolution: "Replaced all manifold O-rings, pressure test passed", feedback: "partially_correct" as EngineerFeedback },
  { query: "Conveyor C2 motor overheating", diagnosis: "Motor winding fault", prediction: { failureProbability: 0.55, mode: "Stator winding short" }, recommendation: "Megger test and inspection", outcome: "Cooling fan blockage ▸ no winding fault", rootCauseApproved: "Cooling air duct blockage", resolution: "Cleaned cooling ducts, replaced filter, motor running cool", feedback: "incorrect" as EngineerFeedback },
  { query: "ID Fan IF-1 vibration increasing", diagnosis: "Rotor imbalance from erosion", prediction: { failureProbability: 0.78, mode: "Fan blade erosion" }, recommendation: "In-situ dynamic balancing", outcome: "Confirmed blade erosion, balanced successfully", rootCauseApproved: "Erosion wear on blade trailing edges", resolution: "Balanced rotor, applied ceramic coating on blades", feedback: "correct" as EngineerFeedback },
  { query: "Rolling Mill RM-2848 gear noise", diagnosis: "Gear tooth wear", prediction: { failureProbability: 0.7, mode: "Gear fatigue spalling" }, recommendation: "Oil analysis and borescope inspection", outcome: "Lubrication contamination, not gear wear", rootCauseApproved: "Oil contamination with water and debris", resolution: "Oil flush, new filters, seal replacement on gearbox", feedback: "partially_correct" as EngineerFeedback },
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

function pickRandom<T>(arr: T[], rand?: () => number): T {
  const r = rand ?? Math.random;
  return arr[Math.floor(r() * arr.length)];
}

export function generatePlant(): Plant {
  const now = new Date().toISOString();
  return {
    id: "plant-arc-msw-001",
    name: "Tata Steel Integrated Plant",
    location: "Jamshedpur, Jharkhand ▸ India",
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
      metadata: { zone_priority: def.risk === "critical" ? 1 : 3, process_criticality: def.process_criticality, production_impact: def.production_impact },
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

  const criticalCount = assets.filter((a) => a.risk_level === "critical").length;
  assets.filter((a) => a.risk_level === "critical").forEach((asset, i) => {
    alerts.push({
      id: uuidv4(),
      asset_id: asset.id,
      title: `Critical: ${asset.name} Risk Escalation`,
      description: `Risk level for ${asset.name} escalated to CRITICAL. Failure probability ${((asset.failure_probability ?? 0) * 100).toFixed(0)}%. Executive attention required.`,
      severity: "critical",
      status: "active",
      sensor_metric: null,
      threshold: null,
      actual_value: null,
      acknowledged_at: null,
      resolved_at: null,
      created_at: subHours(new Date(), 4 + i * 2).toISOString(),
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

  const titles: Record<string, string[]> = {
    rolling_mill: ["Bearing lubrication service", "Roll grinding & profile check", "Gearbox oil analysis", "Emergency spindle replacement"],
    blast_furnace_fan: ["Fan bearing replacement", "Rotor dynamic balancing", "Vibration analysis & alignment", "Emergency motor rewind"],
    hydraulic_pump: ["Seal replacement ▸ hydraulic circuit", "Oil flush & filter change", "Pressure relief valve calibration", "Emergency pump rebuild"],
    conveyor: ["Belt tracking adjustment", "Idler roller replacement", "Drive pulley lagging check", "Emergency belt splice repair"],
    overhead_crane: ["Hoist brake adjustment", "Wire rope inspection & lubricate", "Trolley wheel replacement", "Emergency load cell replacement"],
    gearbox: ["Oil sample & analysis", "Bearing clearance check", "Seal replacement", "Gear tooth inspection"],
    compressor: ["Air filter replacement", "Oil separator change", "Cooler cleaning", "Emergency valve replacement"],
    cooling_water_pump: ["Mechanical seal check", "Coupling alignment", "Impeller clearance check", "Emergency bearing replacement"],
    id_fan: ["Blade cleaning", "Shaft alignment", "Damper linkage check", "Emergency balance"],
    fd_fan: ["Bearing greasing", "Casing inspection", "Inlet vane calibration", "Emergency coupling replacement"],
    bearing: ["Grease replenishment", "Temperature monitoring check", "Housing bolt torque check", "Emergency replacement"],
    drive_system: ["Converter cabinet cleaning", "Cable insulation test", "Cooling fan filter change", "Emergency drive replacement"],
  };

  assets.forEach((asset) => {
    const assetTitles = titles[asset.machine_type] ?? ["Routine inspection", "Scheduled maintenance", "Predictive check", "Emergency repair"];
    for (let i = 0; i < 3; i++) {
      records.push({
        id: uuidv4(),
        asset_id: asset.id,
        maintenance_type: types[i % types.length],
        title: assetTitles[i % assetTitles.length],
        description: `Routine maintenance performed on ${asset.name}. All safety checks passed.`,
        technician: ["J. Martinez", "S. Patel", "R. Okafor", "M. Chen", "K. Yamamoto", "L. Schmidt"][i % 6],
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
  return assets.map((asset) => {
    const scenario = pickRandom(FAILURE_SCENARIOS, seededRandom(asset.serial_number.charCodeAt(1) * 999));
    return {
      id: uuidv4(),
      asset_id: asset.id,
      failure_probability: asset.failure_probability ?? 0.1,
      remaining_useful_life_hours: asset.remaining_useful_life_hours ?? 5000,
      predicted_failure_mode: getFailureMode(asset.machine_type),
      confidence: 0.75 + (asset.health_score / 100) * 0.2,
      model_version: "v2.0-xgb",
      input_features: {
        temperature_c: MACHINE_BASELINES[asset.machine_type]?.temperature_c ?? 60,
        pressure_bar: MACHINE_BASELINES[asset.machine_type]?.pressure_bar ?? 5,
        rpm: MACHINE_BASELINES[asset.machine_type]?.rpm ?? 1500,
        vibration_mm_s: MACHINE_BASELINES[asset.machine_type]?.vibration_mm_s ?? 2.5,
        operating_hours: asset.operating_hours,
      },
      predicted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  });
}

export function generateMaintenancePriorities(assets: Asset[]): MaintenancePriority[] {
  const now = new Date().toISOString();
  return assets.map((asset) => {
    const baseline = MACHINE_BASELINES[asset.machine_type];
    const failureRisk = asset.failure_probability ?? 0.1;
    const rul = asset.remaining_useful_life_hours ?? 5000;
    const health = asset.health_score;

    const processCriticality = (baseline?.processCriticality ?? 5) / 10;
    const productionImpact = (baseline?.productionImpact ?? 5) / 10;
    const rulFactor = Math.max(0, 1 - rul / 20000);
    const spareAvailability = asset.status === "critical" ? 0.2 : asset.status === "degraded" ? 0.5 : 0.8;
    const leadTimeFactor = Math.min(1, (baseline?.procurementLeadDays ?? 30) / 120);

    const priorityScore = Math.round(
      (failureRisk * 0.25 +
        rulFactor * 0.2 +
        processCriticality * 0.2 +
        productionImpact * 0.15 +
        (1 - spareAvailability) * 0.1 +
        leadTimeFactor * 0.1) * 1000
    ) / 10;

    const priorityLevel: PriorityLevel =
      priorityScore >= 70 ? "p1_critical" :
      priorityScore >= 50 ? "p2_high" :
      priorityScore >= 30 ? "p3_medium" :
      "p4_low";

    const maintenanceWindow =
      priorityLevel === "p1_critical" ? "Within 24 hours" :
      priorityLevel === "p2_high" ? "Within 7 days" :
      priorityLevel === "p3_medium" ? "Within 30 days" :
      "Next scheduled shutdown";

    const procurementRecommendation =
      priorityLevel === "p1_critical" ? "EMERGENCY ORDER ▸ Express shipping required" :
      priorityLevel === "p2_high" ? "PRIORITY ORDER ▸ Initiate procurement within 48 hours" :
      priorityLevel === "p3_medium" ? "SCHEDULE ORDER ▸ Include in next quarterly procurement" :
      "ROUTINE ORDER ▸ Stock replenishment at standard lead time";

    const impactSummaries: Record<PriorityLevel, string> = {
      p1_critical: `CATASTROPHIC: ${asset.name} failure within ${Math.round(rul / 24)} days would cause plant-wide production loss. Estimated impact: $${(productionImpact * 5.2 * 1_000_000).toFixed(0)}M. No spare available, ${baseline?.procurementLeadDays ?? 60}-day procurement lead time.`,
      p2_high: `CRITICAL: ${asset.name} requires intervention within 7 days. Production impact: $${(productionImpact * 2.8 * 1_000_000).toFixed(0)}M if failed. Spare availability limited.`,
      p3_medium: `MODERATE: ${asset.name} can be maintained during next planned shutdown. Monitor condition weekly. RUL: ${rul.toLocaleString()} hours.`,
      p4_low: `LOW: ${asset.name} within acceptable parameters. Continue routine monitoring. Next maintenance in ${Math.round(rul / 720)} months.`,
    };

    return {
      id: uuidv4(),
      asset_id: asset.id,
      priority_score: priorityScore,
      priority_level: priorityLevel,
      failure_risk: failureRisk,
      remaining_useful_life_hours: rul,
      process_criticality: processCriticality,
      production_impact: productionImpact,
      spare_availability: spareAvailability,
      procurement_lead_time_days: baseline?.procurementLeadDays ?? 30,
      maintenance_window: maintenanceWindow,
      procurement_recommendation: procurementRecommendation,
      business_impact_summary: impactSummaries[priorityLevel],
      calculated_at: now,
      created_at: now,
    };
  });
}

export function generateFeedbackEntries(assets: Asset[]): MaintenanceFeedback[] {
  const now = new Date().toISOString();
  return FEEDBACK_SCENARIOS.map((scenario, i) => {
    const asset = assets[i % assets.length];
    return {
      id: uuidv4(),
      asset_id: asset.id,
      query: scenario.query,
      diagnosis: scenario.diagnosis,
      prediction: scenario.prediction,
      recommendation: scenario.recommendation,
      actual_outcome: scenario.outcome,
      root_cause: scenario.rootCauseApproved,
      resolution: scenario.resolution,
      engineer_feedback: scenario.feedback,
      resolution_notes: `Engineer confirmed findings. ${scenario.feedback === "correct" ? "Model prediction accurate." : scenario.feedback === "partially_correct" ? "Root cause differed from prediction ▸ model retrained." : "Incorrect diagnosis ▸ case logged for model improvement."}`,
      timestamp: subDays(new Date(), 15 - i * 2).toISOString(),
      created_at: subDays(new Date(), 15 - i * 2).toISOString(),
    };
  });
}

export function generateExperienceNodes(assets: Asset[]): ExperienceNode[] {
  const now = new Date().toISOString();
  return EXPERIENCE_NODE_SCENARIOS.map((scenario, i) => {
    const targetType: MachineType =
      scenario.incidentType.includes("Fan") ? "blast_furnace_fan" :
      scenario.incidentType.includes("Hydraulic") ? "hydraulic_pump" :
      scenario.incidentType.includes("Gearbox") ? "gearbox" :
      scenario.incidentType.includes("Motor") ? "drive_system" :
      scenario.incidentType.includes("Pump") ? "cooling_water_pump" :
      scenario.incidentType.includes("Bearings") ? "bearing" : "rolling_mill";
    const matchingAsset = assets.find(a => a.machine_type === targetType);
    const asset = matchingAsset ?? assets[i % assets.length];
    return {
      id: uuidv4(),
      asset_id: asset.id,
      machine_type: asset.machine_type,
      incident_type: scenario.incidentType,
      symptoms: scenario.symptoms,
      root_cause: scenario.rootCause,
      fix_applied: scenario.fix,
      fix_effective: scenario.effective,
      parts_used: scenario.parts,
      downtime_hours: scenario.downtime,
      cost_usd: scenario.cost,
      engineer_notes: `Case #${1000 + i}: ${scenario.incidentType}. ${scenario.effective ? "Fix proven effective." : "Alternative solution under review."}`,
      recurring: scenario.recurring,
      confidence_adjustment: scenario.confidence,
      created_at: subDays(new Date(), 90 - i * 15).toISOString(),
    };
  });
}

export function generateEarlyWarnings(assets: Asset[]): EarlyWarning[] {
  const now = new Date().toISOString();
  const warnings: EarlyWarning[] = [];

  const criticalAssets = assets.filter(a => a.status === "critical");
  criticalAssets.forEach((asset, i) => {
    warnings.push({
      id: uuidv4(),
      asset_id: asset.id,
      warning_type: "catastrophic_failure_risk",
      severity: "critical",
      description: `${asset.name} showing all precursor signatures for catastrophic bearing failure within ${Math.round((asset.remaining_useful_life_hours ?? 200) / 24)} days.`,
      sensor_metric: "vibration_mm_s",
      current_value: 6.8,
      threshold: 7.0,
      trend_direction: "increasing",
      days_to_threshold: Math.round((asset.remaining_useful_life_hours ?? 200) / 24),
      confidence: 0.87,
      detected_at: now,
    });
  });

  const degraded = assets.filter(a => a.status === "degraded").slice(0, 3);
  degraded.forEach((asset, i) => {
    warnings.push({
      id: uuidv4(),
      asset_id: asset.id,
      warning_type: "early_degradation",
      severity: "warning",
      description: `${asset.name} degradation trending toward critical zone. Health score dropped ${(5 + i * 3)}% in 30 days.`,
      sensor_metric: "health_score",
      current_value: asset.health_score,
      threshold: 50,
      trend_direction: "increasing",
      days_to_threshold: 30 - i * 5,
      confidence: 0.72,
      detected_at: now,
    });
  });

  warnings.push({
    id: uuidv4(),
    asset_id: assets.find(a => a.machine_type === "compressor")?.id ?? assets[0].id,
    warning_type: "oil_contamination",
    severity: "warning",
    description: "Air Compressor AC-1 oil analysis shows water ingress. Iron particles 180ppm (limit 50ppm).",
    sensor_metric: "oil_condition",
    current_value: 180,
    threshold: 50,
    trend_direction: "increasing",
    days_to_threshold: 5,
    confidence: 0.78,
    detected_at: now,
  });

  return warnings;
}

export function generatePlantBottlenecks(assets: Asset[]): PlantBottleneck[] {
  const now = new Date().toISOString();
  return PLANT_BOTTLENECK_SCENARIOS.map((scenario, i) => {
    const assetMapping: Record<string, string> = {
      "Production bottleneck": "blast_furnace_fan",
      "Material handling constraint": "conveyor",
      "Cooling constraint": "cooling_water_pump",
      "Draft group limitation": "id_fan",
    };
    const machineType = assetMapping[scenario.type] ?? "rolling_mill";
    const asset = assets.find(a => a.machine_type === machineType) ?? assets[0];
    return {
      id: uuidv4(),
      asset_id: asset.id,
      bottleneck_type: scenario.type,
      severity: scenario.severity,
      description: scenario.desc,
      production_impact_description: scenario.impact,
      estimated_downtime_hours: scenario.downtime,
      estimated_cost_usd: scenario.cost,
      dependent_assets: assets.filter(a => a.machine_type === (machineType === "blast_furnace_fan" ? "rolling_mill" : machineType === "id_fan" ? "blast_furnace_fan" : "conveyor")).map(a => a.name),
      detected_at: now,
    };
  });
}

export function generateSpareShortages(): SpareShortage[] {
  const now = new Date().toISOString();
  return SPARE_SHORTAGE_SCENARIOS.map((scenario) => ({
    id: uuidv4(),
    part_name: scenario.part,
    asset_id: scenario.asset,
    current_stock: scenario.stock,
    reorder_point: scenario.reorder,
    lead_time_days: scenario.lead,
    priority: scenario.priority,
    shortage_date: addHours(new Date(), scenario.stock === 0 ? 0 : 72).toISOString(),
    impact_description: scenario.impact,
  }));
}

export function generateRiskEscalations(assets: Asset[]): Array<{
  assetId: string;
  assetName: string;
  previousRisk: RiskLevel;
  currentRisk: RiskLevel;
  reason: string;
}> {
  return assets
    .filter(a => a.status === "critical" || a.risk_level === "critical")
    .map(a => ({
      assetId: a.id,
      assetName: a.name,
      previousRisk: (a.risk_level === "critical" ? "high" : a.risk_level) as RiskLevel,
      currentRisk: a.risk_level,
      reason: `Health score declined to ${a.health_score}%, failure probability ${((a.failure_probability ?? 0) * 100).toFixed(0)}%. Sensor trends indicate accelerated degradation.`,
    }));
}

export function generateBacklogRanking(assets: Asset[]): Array<{
  assetId: string;
  assetName: string;
  overdueHours: number;
  priority: PriorityLevel;
}> {
  return assets
    .filter(a => a.status === "critical" || a.status === "degraded")
    .map(a => ({
      assetId: a.id,
      assetName: a.name,
      overdueHours: a.status === "critical" ? 48 + Math.floor(Math.random() * 72) : 12 + Math.floor(Math.random() * 36),
      priority: (a.status === "critical" ? "p1_critical" : "p2_high") as PriorityLevel,
    }))
    .sort((a, b) => b.overdueHours - a.overdueHours);
}

export function generatePlantHealthRanking(assets: Asset[]): Array<{
  assetId: string;
  assetName: string;
  healthScore: number;
  trend: "improving" | "declining" | "stable";
}> {
  return assets.map(a => ({
    assetId: a.id,
    assetName: a.name,
    healthScore: a.health_score,
    trend: (a.status === "critical" ? "declining" : a.status === "degraded" ? "declining" : a.health_score > 80 ? "stable" : "stable") as "improving" | "declining" | "stable",
  })).sort((a, b) => a.healthScore - b.healthScore);
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
      metadata: { confidence: 0.87, evidence: ["Vibration trend 4.2->6.8mm/s in 72h", "Temperature rise 12C above baseline", "High-frequency noise in 3kHz band"] },
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
      metadata: { sop_ref: "SOP-HYD-014", evidence: ["Pressure trend declining 0.3bar/day", "Oil leakage observed 2L/day", "Similar case in experience DB: 85% fix rate"] },
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
    {
      id: uuidv4(),
      plant_id: plantId,
      asset_id: assets.find((a) => a.machine_type === "id_fan")?.id ?? null,
      insight_type: "prediction",
      title: "ID Fan Balance Deterioration",
      summary: "ID Fan IF-1 shows progressive imbalance trend. Projected to exceed alarm threshold within 48 hours.",
      impact: "Furnace draft limitation affecting melt rate",
      priority: 5,
      metadata: { confidence: 0.82, evidence: ["1X RPM vibration increasing 0.5mm/s/day", "Blade erosion pattern documented", "Similar failure in IF-2 last quarter"] },
      created_at: now,
      expires_at: null,
    },
    {
      id: uuidv4(),
      plant_id: plantId,
      asset_id: assets.find((a) => a.machine_type === "compressor")?.id ?? null,
      insight_type: "recommendation",
      title: "Compressor AC-1 Oil Contamination",
      summary: "Oil analysis shows water ingress and elevated wear debris in AC-1. Schedule oil change and seal inspection.",
      impact: "Prevents catastrophic bearing failure",
      priority: 4,
      metadata: { evidence: ["Oil sample Fe 180ppm (limit 50)", "Water content 0.2% (limit 0.05)", "Filter delta-P 2.1bar (limit 1.5)"] },
      created_at: now,
      expires_at: null,
    },
  ];
}

function getFailureMode(type: MachineType): string {
  const modes: Record<string, string> = {
    rolling_mill: "Roll bearing fatigue ▸ spalling on outer race",
    blast_furnace_fan: "Drive-end bearing failure ▸ grease starvation",
    hydraulic_pump: "Mechanical seal degradation ▸ lip wear",
    conveyor: "Drive motor bearing wear ▸ contamination ingress",
    overhead_crane: "Hoist gearbox wear ▸ tooth surface fatigue",
    gearbox: "Gear tooth pitting ▸ lubrication film breakdown",
    compressor: "Screw rotor contact ▸ oil system failure",
    cooling_water_pump: "Impeller cavitation damage ▸ NPSH violation",
    id_fan: "Rotor imbalance ▸ blade erosion",
    fd_fan: "Bearing wear ▸ misalignment induced",
    bearing: "Raceway spalling ▸ fatigue life exceeded",
    drive_system: "IGBT module failure ▸ thermal cycling",
  };
  return modes[type] ?? "Unknown failure mode";
}

export { MACHINE_TYPES, ASSET_DEFINITIONS };
