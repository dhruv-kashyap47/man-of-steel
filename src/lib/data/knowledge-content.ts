import type { DocumentType, MachineType } from "@/types/database";

export interface KnowledgeSeedDoc {
  title: string;
  document_type: DocumentType;
  file_name: string;
  file_type: "markdown" | "text";
  machine_type: MachineType | null;
  tags: string[];
  content: string;
}

export const KNOWLEDGE_DOCUMENTS: KnowledgeSeedDoc[] = [
  {
    title: "Rolling Mill Maintenance Manual",
    document_type: "manual",
    file_name: "RM-MANUAL-001.md",
    file_type: "markdown",
    machine_type: "rolling_mill",
    tags: ["maintenance", "bearings", "lubrication"],
    content: `# Rolling Mill Maintenance Manual — X-Roll 4500

## Section 4.2 — Work Roll Bearing Inspection
Inspect work roll bearings every 2,000 operating hours. Acceptable vibration: < 3.5 mm/s RMS.
Warning threshold: 4.5 mm/s. Critical threshold: 7.0 mm/s.

### Bearing Temperature Limits
- Normal operating: 55–70°C
- Warning: 75°C
- Critical shutdown: 90°C

## Section 6.1 — Hydraulic Pressure System
Normal operating pressure: 5.8–6.5 bar. Pressure drops below 5.0 bar indicate pump cavitation or filter blockage.

## Section 8.3 — Predictive Maintenance Triggers
Schedule bearing replacement when:
1. Vibration exceeds 4.5 mm/s for 48+ consecutive hours
2. Temperature rise > 10°C above 30-day rolling average
3. Failure probability model output exceeds 0.65`,
  },
  {
    title: "Blast Furnace Fan Operating Procedures",
    document_type: "sop",
    file_name: "SOP-BF-FAN-003.md",
    file_type: "markdown",
    machine_type: "blast_furnace_fan",
    tags: ["operations", "safety", "startup"],
    content: `# SOP-BF-FAN-003: Blast Furnace Fan Startup & Monitoring

## Pre-Start Checklist
1. Verify bearing lubrication system pressure > 2.5 bar
2. Confirm inlet damper position: 15% minimum
3. Check vibration baseline < 3.0 mm/s

## Operating Limits
| Parameter | Normal | Warning | Critical |
|-----------|--------|---------|----------|
| Temperature | 65-75°C | 80°C | 95°C |
| Vibration | < 3.5 mm/s | 5.0 mm/s | 7.0 mm/s |
| RPM | 1400-1500 | > 1550 | > 1600 |

## Emergency Shutdown Criteria
Initiate immediate shutdown if:
- Vibration exceeds 7.0 mm/s for > 5 minutes
- Bearing temperature exceeds 95°C
- Unusual noise or metal-on-metal contact detected

## Bearing Replacement Procedure
Estimated downtime: 24-36 hours. Required parts: SKF 22240 CC/W33 bearing set, housing gasket kit.`,
  },
  {
    title: "Hydraulic Pump Seal Replacement SOP",
    document_type: "sop",
    file_name: "SOP-HYD-014.md",
    file_type: "markdown",
    machine_type: "hydraulic_pump",
    tags: ["hydraulics", "seals", "maintenance"],
    content: `# SOP-HYD-014: Mechanical Seal Replacement — A4VSO Series

## Symptoms of Seal Failure
- Pressure instability (±1.5 bar fluctuation)
- Increased fluid temperature (+8°C above baseline)
- Visible leakage at shaft seal housing
- Cavitation noise at pressures below 10 bar

## Replacement Procedure
1. Lock out / tag out hydraulic circuit (LOTO-HYD-001)
2. Depressurize system completely — verify 0 bar on gauge H-042
3. Drain reservoir to minimum level
4. Remove seal housing bolts (torque spec: 45 Nm)
5. Install new seal kit P/N: R909001234
6. Refill with ISO VG 46 fluid
7. Pressure test at 14 bar for 30 minutes

## Post-Replacement Verification
Pressure stability within ±0.3 bar for 4 hours indicates successful repair.
Estimated repair time: 6-8 hours.`,
  },
  {
    title: "Conveyor Belt Maintenance Guide",
    document_type: "manual",
    file_name: "CV-MANUAL-002.md",
    file_type: "markdown",
    machine_type: "conveyor",
    tags: ["conveyor", "belt", "drive"],
    content: `# BeltLine Conveyor Maintenance Guide

## Drive Motor Bearing Monitoring
Drive motor bearings should be greased every 4,000 hours using NLGI Grade 2 lithium complex grease.
Vibration baseline for BeltLine 900: 1.0-1.5 mm/s.

## Belt Tension & Tracking
Check belt tension weekly. Deflection at center span: 25-30mm under 50N force.
Misalignment causes increased vibration and premature bearing failure.

## Common Failure Modes
1. Drive motor bearing wear — indicated by vibration increase at 2x running speed
2. Gearbox oil degradation — check oil analysis every 6 months
3. Idler roller seizure — causes belt drift and motor overload`,
  },
  {
    title: "Overhead Crane Inspection Protocol",
    document_type: "sop",
    file_name: "SOP-CRANE-007.md",
    file_type: "markdown",
    machine_type: "overhead_crane",
    tags: ["crane", "inspection", "safety"],
    content: `# SOP-CRANE-007: Overhead Crane Monthly Inspection

## Hoist Gearbox
Inspect hoist gearbox oil level and color monthly. Milky oil indicates water contamination.
Vibration limit for CXT 50t: 1.8 mm/s warning, 3.0 mm/s critical.

## Wire Rope & Brake System
Measure wire rope diameter at three points. Replace if reduction exceeds 10%.
Brake holding torque test required quarterly.

## Load Test Requirements
Annual load test at 110% rated capacity. Document results in maintenance log.`,
  },
  {
    title: "Incident Report: BF Fan Bearing Failure 2024-Q3",
    document_type: "incident_report",
    file_name: "INC-BF-2024-Q3.md",
    file_type: "markdown",
    machine_type: "blast_furnace_fan",
    tags: ["incident", "bearing", "failure"],
    content: `# Incident Report — BF-1102 Bearing Failure (September 2024)

## Summary
Blast Furnace Fan A experienced catastrophic drive-end bearing failure after vibration warnings were not escalated for 36 hours.

## Timeline
- Day 1: Vibration reached 5.2 mm/s (warning threshold)
- Day 2: Temperature rose to 82°C, vibration 5.8 mm/s
- Day 3: Emergency shutdown at 6.9 mm/s, metal particles in oil sample

## Root Cause
Delayed response to predictive maintenance alert. Bearing had exceeded L10 life by estimated 2,400 hours.

## Corrective Actions
1. Reduced vibration alert escalation time from 48hr to 4hr
2. Installed continuous vibration monitoring on all furnace fans
3. Updated SOP-BF-FAN-003 emergency thresholds

## Business Impact
- 52 hours unplanned downtime
- $1.8M production loss
- 14 hours emergency bearing replacement`,
  },
  {
    title: "Incident Report: Hydraulic Pump Seal Failure 2025-Q1",
    document_type: "incident_report",
    file_name: "INC-HYD-2025-Q1.md",
    file_type: "markdown",
    machine_type: "hydraulic_pump",
    tags: ["incident", "hydraulics", "seal"],
    content: `# Incident Report — HP-4421 Seal Failure (January 2025)

## Summary
Hydraulic Pump H1 mechanical seal failed during peak production, causing pressure loss across rolling mill auxiliary systems.

## Symptoms Prior to Failure
- Pressure fluctuation ±2.1 bar over 72 hours
- Fluid temperature increase of 11°C
- Minor visible seepage at seal housing

## Root Cause
Seal exceeded recommended service life (18,000 hours vs 16,500 hour limit). SOP-HYD-014 replacement was deferred during planned shutdown.

## Resolution
Emergency seal replacement per SOP-HYD-014. Total downtime: 11 hours.

## Lessons Learned
Do not defer seal replacement when pressure instability is detected. Cost of planned replacement: $4,200. Cost of emergency failure: $340,000.`,
  },
  {
    title: "Plant-Wide Predictive Maintenance Policy",
    document_type: "sop",
    file_name: "SOP-PM-POLICY-001.md",
    file_type: "markdown",
    machine_type: null,
    tags: ["policy", "predictive", "maintenance"],
    content: `# Plant-Wide Predictive Maintenance Policy

## Risk Classification
| Risk Level | Failure Probability | Action Required |
|------------|-------------------|-----------------|
| Low | < 0.25 | Monitor |
| Medium | 0.25 - 0.50 | Schedule within 30 days |
| High | 0.50 - 0.75 | Schedule within 7 days |
| Critical | > 0.75 | Immediate action |

## ML Model Integration
Failure probability and RUL estimates from the MAN OF STEEL prediction engine should be reviewed during daily morning meetings.

## Escalation Matrix
Critical alerts must be acknowledged within 2 hours and resolved or mitigated within 24 hours.`,
  },
];
