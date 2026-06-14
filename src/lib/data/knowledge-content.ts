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
    content: `# Rolling Mill Maintenance Manual ▸ X-Roll 4500

## Section 4.2 ▸ Work Roll Bearing Inspection
Inspect work roll bearings every 2,000 operating hours. Acceptable vibration: < 3.5 mm/s RMS.
Warning threshold: 4.5 mm/s. Critical threshold: 7.0 mm/s.

### Bearing Temperature Limits
- Normal operating: 55–70°C
- Warning: 75°C
- Critical shutdown: 90°C

## Section 6.1 ▸ Hydraulic Pressure System
Normal operating pressure: 5.8–6.5 bar. Pressure drops below 5.0 bar indicate pump cavitation or filter blockage.

## Section 8.3 ▸ Predictive Maintenance Triggers
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
    content: `# SOP-HYD-014: Mechanical Seal Replacement ▸ A4VSO Series

## Symptoms of Seal Failure
- Pressure instability (±1.5 bar fluctuation)
- Increased fluid temperature (+8°C above baseline)
- Visible leakage at shaft seal housing
- Cavitation noise at pressures below 10 bar

## Replacement Procedure
1. Lock out / tag out hydraulic circuit (LOTO-HYD-001)
2. Depressurize system completely ▸ verify 0 bar on gauge H-042
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
1. Drive motor bearing wear ▸ indicated by vibration increase at 2x running speed
2. Gearbox oil degradation ▸ check oil analysis every 6 months
3. Idler roller seizure ▸ causes belt drift and motor overload`,
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
    content: `# Incident Report ▸ BF-1102 Bearing Failure (September 2024)

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
    content: `# Incident Report ▸ HP-4421 Seal Failure (January 2025)

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
  {
    title: "Sensor Data Reference ▸ All Machine Types",
    document_type: "manual",
    file_name: "SENSOR-REF-001.md",
    file_type: "markdown",
    machine_type: null,
    tags: ["sensors", "baselines", "thresholds", "reference"],
    content: `# Sensor Data Reference ▸ Tata Steel Integrated Plant

## Rolling Mill (X-Roll 4500)
- Normal vibration: < 3.5 mm/s, Warning: 4.5 mm/s, Critical: 7.0 mm/s
- Normal temperature: 55-70°C, Warning: 75°C, Critical: 90°C
- Normal pressure: 5.8-6.5 bar
- Normal RPM: 2800, Max: 3500
- Max operating hours: 50,000 hrs
- Process criticality: 9.5/10, Production impact: 9.0/10

## Blast Furnace Fan (HV-TURBO 88)
- Normal vibration: < 3.5 mm/s, Warning: 5.0 mm/s, Critical: 7.0 mm/s
- Normal temperature: 65-75°C, Warning: 80°C, Critical: 95°C
- Normal RPM: 1400-1500, Max RPM: 1600
- Max operating hours: 40,000 hrs
- Process criticality: 9.8/10, Production impact: 9.5/10

## Hydraulic Pump (A4VSO 250)
- Normal vibration: < 1.9 mm/s, Warning: 3.0 mm/s, Critical: 5.0 mm/s
- Normal temperature: 50-60°C, Warning: 70°C, Critical: 85°C
- Normal pressure: 12-14 bar, Warning: < 10 bar
- Max operating hours: 30,000 hrs
- Process criticality: 7.5/10, Production impact: 7.0/10

## Conveyor (BeltLine 900)
- Normal vibration: < 1.5 mm/s, Warning: 2.5 mm/s, Critical: 4.0 mm/s
- Normal temperature: 40-50°C, Warning: 60°C
- Normal RPM: 420, Max: 600
- Max operating hours: 60,000 hrs

## Overhead Crane (CXT 50t)
- Normal vibration: < 1.8 mm/s, Warning: 3.0 mm/s, Critical: 4.5 mm/s
- Normal temperature: 35-42°C
- Max operating hours: 35,000 hrs

## Gearbox (H2SH 450)
- Normal vibration: < 2.5 mm/s, Warning: 4.0 mm/s, Critical: 6.0 mm/s
- Normal temperature: 58-66°C
- Max operating hours: 45,000 hrs

## Compressor (ZH 7000)
- Normal vibration: < 3.5 mm/s
- Normal temperature: 72-84°C
- Normal pressure: 8-10 bar
- Max operating hours: 35,000 hrs

## ID Fan (ARF 2000)
- Normal vibration: < 4.2 mm/s, Critical: 7.0 mm/s
- Normal temperature: 75-88°C
- Max operating hours: 38,000 hrs
- Process criticality: 8.8/10

## Cooling Water Pump (NK 300-400)
- Normal vibration: < 2.2 mm/s
- Normal temperature: 44-52°C
- Max operating hours: 40,000 hrs`,
  },
  {
    title: "Root Cause Analysis Reference ▸ Common Failure Modes",
    document_type: "failure_analysis",
    file_name: "RCA-REF-001.md",
    file_type: "markdown",
    machine_type: null,
    tags: ["rca", "failure-modes", "diagnostics", "reference"],
    content: `# Root Cause Analysis Reference ▸ Common Failure Modes

## Bearing Failures (All Rotating Equipment)
### Symptoms
- Vibration increasing at 1x and 2x running speed
- Temperature rise above baseline
- High-frequency noise in 2-4 kHz range
### Root Causes
1. Grease contamination with scale dust ▸ most common in steel plant environment
2. Lubrication starvation due to blocked grease lines
3. Fatigue life exceeded (L10 life calculation)
4. Misalignment-induced loading
### Recommended Diagnostics
- Spectrum analysis: look for sidebands around 1x RPM
- Shock pulse measurement
- Oil analysis for wear debris
- Thermography for hot bearing housings

## Mechanical Seal Failures (Pumps)
### Symptoms
- Pressure fluctuation > 1.5 bar
- Visible leakage at shaft seal
- Fluid temperature increase > 8°C
- Cavitation noise
### Root Causes
1. O-ring thermal degradation from heat aging
2. Seal face wear from abrasive particles in fluid
3. Dry running due to low sump level
4. Chemical attack from incompatible fluids
### Evidence Collection
- Check seal flush plan operation
- Inspect seal faces for heat cracking
- Measure seal face flatness
- Review operating hours vs seal life rating

## Gearbox Failures
### Symptoms
- Gear mesh frequency vibration
- Metal particles in oil filter
- Loud knocking or rhythmic noise
### Root Causes
1. Lubrication film breakdown under peak load
2. Misalignment causing edge loading
3. Fatigue spalling from cyclic overload
4. Water contamination of oil
### Diagnostic Steps
- Oil sample analysis (wear debris, viscosity, water content)
- Borescope inspection of gear teeth
- Vibration spectrum at gear mesh frequency
- Temperature trend analysis

## Rotor Imbalance (Fans)
### Symptoms
- 1x RPM vibration dominant
- Increases with operating speed
- Radial vibration higher than axial
### Root Causes
1. Erosion wear on blade trailing edges (particulate)
2. Uneven dust buildup on blades
3. Blade fatigue cracking
4. Thermal distortion
### Correction
- In-situ dynamic balancing (portable balancer)
- Blade profile restoration
- Ceramic coating for erosion protection`,
  },
  {
    title: "Tata Steel ▸ Integrated Plant Sensor Network Specifications",
    document_type: "manual",
    file_name: "SENSOR-NET-001.md",
    file_type: "markdown",
    machine_type: null,
    tags: ["sensors", "iot", "network", "specifications"],
    content: `# Tata Steel ▸ Integrated Plant Sensor Network

## Sensor Types Deployed

### Vibration Sensors
- Type: IEPE accelerometers, 100 mV/g sensitivity
- Frequency range: 2 Hz ▸ 10 kHz
- Locations: Bearing housings on all rotating equipment
- Sampling: 25.6 kHz, 3200 lines FFT
- Monitoring: Overall, 1x, 2x, broadband high-frequency

### Temperature Sensors
- Type: RTD PT100, 3-wire
- Range: -50°C to 200°C
- Locations: Bearing housings, motor windings, fluid reservoirs
- Accuracy: ±0.1°C

### Pressure Transmitters
- Type: Piezoresistive, 4-20 mA loop
- Range: 0-25 bar (hydraulic), 0-10 bar (cooling)
- Locations: Pump discharge, system manifold

### Speed Sensors
- Type: Proximity probe / magnetic pickup
- Range: 0-4000 RPM
- Locations: Motor shaft non-drive end

## Network Architecture
- Edge gateways: Siemens IOT2050
- Protocol: OPC UA (client-server) + MQTT for cloud streaming
- Sampling interval: 2 seconds for real-time, 10-minute averages for trend
- Data retention: Raw 30 days, hourly aggregates 2 years

## Alert Threshold Philosophy
- Warning threshold: 85% of critical value, triggers notification to shift engineer
- Critical threshold: 95% of damage limit, triggers alarm + SMS to maintenance manager
- Alert escalation time: Warning 4 hours, Critical 2 hours`,
  },
  {
    title: "Failure Mode Library ▸ Rolling Mill & Associated Equipment",
    document_type: "failure_analysis",
    file_name: "FM-LIB-001.md",
    file_type: "markdown",
    machine_type: null,
    tags: ["failure-modes", "rolling-mill", "reference"],
    content: `# Failure Mode Library ▸ Rolling Mill Equipment

## Hot Strip Mill (X-Roll 4500)
### 1. Roll Bearing Fatigue Spalling
- Probability: Moderate
- Detection: Vibration 1x RPM increasing, shock pulse rising
- Precursors: > 80% of L10 life consumed, operating temperature rising
- Failure progression: 14-21 days from first warning to critical
- Consequence: Mill stoppage 8-12 hours for bearing replacement
- Cost: $420K per incident (parts + labor + lost production)

### 2. Backup Roll Bearing Seizure
- Probability: Low (but catastrophic)
- Detection: Sudden temperature spike, vibration > 10 mm/s
- Prevention: Strict lubrication schedule every 2,000 hrs
- Consequence: Roll surface damage, 24+ hour repair

## Blast Furnace Fan
### 1. Drive-End Bearing Failure
- Probability: High (most common failure mode)
- Precursors: Vibration 4.5->6.8 mm/s over 72 hours, temperature +12°C
- Progression: 36-48 hours from warning to critical
- Root Cause: Grease contamination from furnace gas ingress
- Consequence: 52 hrs downtime, $1.8M production loss

### 2. Rotor Imbalance
- Probability: Moderate
- Detection: 1x RPM vibration increasing, blade erosion on inspection
- Remedy: In-situ dynamic balancing (12 hr job)
- Cost: $28K per balance job

## Hydraulic Pump A4VSO 250
### 1. Mechanical Seal Degradation
- Probability: High
- Indicators: Pressure fluctuation +1.5 bar, leakage 2-5 L/day
- RUL at first symptom: 250-350 operating hours
- Replacement cost planned: $4,200
- Replacement cost emergency: $340K (including production impact)

### 2. Pump Cavitation
- Probability: Moderate
- Indicators: Gravel-like noise, erratic pressure, impeller pitting
- Root Cause: Suction strainer blockage + low reservoir level
- Remedy: Clean strainer, replace impeller (6 hr job)

## Gearbox H2SH 450
### 1. Gear Tooth Pitting / Spalling
- Probability: Moderate
- Detection: Gear mesh frequency vibration rising, Fe particles in oil
- Progression: 30+ days from initial detection to functional failure
- Prevention: Oil analysis every 6 months, maintain ISO 320 viscosity

## ID Fan ARF 2000
### 1. Blade Erosion
- Probability: High
- Rate: 0.5 mm/s vibration increase per day
- Critical threshold: 7.0 mm/s
- Protection: Ceramic coating on blade leading edges
- Replacement cost: $320K, 60-day lead time`,
  },
  {
    title: "Daily Shift Handover Protocol ▸ Maintenance Team",
    document_type: "shift_notes",
    file_name: "SHIFT-PROTOCOL-001.md",
    file_type: "markdown",
    machine_type: null,
    tags: ["shift", "handover", "protocol", "maintenance"],
    content: `# Daily Shift Handover Protocol ▸ Maintenance Team

## Pre-Handover Review (15 minutes before shift end)
1. Review MAN OF STEEL AI Copilot dashboard for new alerts
2. Check prediction engine output for all critical assets
3. Review any maintenance work orders completed during shift
4. Document any abnormal sensor readings or events

## Critical Information to Pass
- Active alerts (status, severity, trend)
- Assets with elevated vibration or temperature
- Any emergency repairs or lockout/tagout in place
- Spare parts consumed and reorder status
- Safety incidents or near-misses

## Morning Meeting Agenda (07:00 daily)
1. Plant health score ▸ trend vs 7-day average
2. Top 3 critical assets by failure probability
3. Maintenance backlog status
4. Spare parts shortages
5. Production schedule conflicts with maintenance windows
6. AI Copilot predictions for the next 48 hours

## Escalation Contacts
- Shift Engineer: +1-412-555-0112
- Maintenance Manager: +1-412-555-0134
- Reliability Engineer: +1-412-555-0156`,
  },
  {
    title: "Spare Parts Inventory & Procurement Guide",
    document_type: "maintenance_log",
    file_name: "SPARE-GUIDE-001.md",
    file_type: "markdown",
    machine_type: null,
    tags: ["spare-parts", "procurement", "inventory"],
    content: `# Spare Parts Inventory & Procurement Guide

## Critical Spares ▸ Never Below Reorder Point

### Rolling Mill
- Spherical roller bearing 22328 ▸ Lead time: 14 days ▸ Reorder at 3
- Backup roll bearing set ▸ Lead time: 90 days ▸ Reorder at 1 set
- Hydraulic servo valve ▸ Lead time: 21 days ▸ Reorder at 2

### Blast Furnace Fans
- SKF 22240 CC/W33 bearing ▸ Lead time: 14 days ▸ Reorder at 2
- Fan rotor assembly ▸ Lead time: 120 days ▸ Reorder at 0 (custom fab)
- Labyrinth seal kit ▸ Lead time: 30 days ▸ Reorder at 3

### Hydraulic Pumps
- Mechanical seal kit R909001234 ▸ Lead time: 21 days ▸ Reorder at 3
- O-ring kit NBR-70 ▸ Lead time: 7 days ▸ Reorder at 5
- Impeller 250mm ▸ Lead time: 45 days ▸ Reorder at 1

### ID Fans
- Fan impeller ARF 2000 ▸ Lead time: 60 days ▸ Reorder at 1
- Bearing housing assembly ▸ Lead time: 45 days ▸ Reorder at 1
- Ceramic coating kit ▸ Lead time: 14 days ▸ Reorder at 2

## Current Stock Status
- Spherical roller bearing 22328: OUT OF STOCK (P1 critical)
- Fan impeller ARF 2000: OUT OF STOCK (P1 critical)
- Hydraulic seal kit HP-4421: 1 remaining (P2 high)
- V-belt set SPC-5000: 2 remaining (P3 medium)
- Cooling fan filter set: OUT OF STOCK (P3 medium)`,
  },
  {
    title: "Sensor Trend Analysis ▸ Predictive Indicators Reference",
    document_type: "inspection_report",
    file_name: "TREND-REF-001.md",
    file_type: "markdown",
    machine_type: null,
    tags: ["trends", "predictive", "sensors", "analysis"],
    content: `# Sensor Trend Analysis ▸ Predictive Indicators

## Vibration Trend Patterns

### Gradual Increase (Wear-out)
- Slope: 0.05-0.15 mm/s per day
- Indicates: Normal wear progression
- Action: Plan maintenance within 14 days
- Example: Bearing fatigue, gear wear

### Accelerating Increase (Fault Cascade)
- Slope: 0.3-0.8 mm/s per day, increasing
- Indicates: Secondary damage occurring
- Action: Schedule within 48 hours
- Example: Bearing spalling progressing to race fracture

### Step Change (Sudden Fault)
- Delta: > 2.0 mm/s in one reading
- Indicates: Component fracture or severe event
- Action: Immediate shutdown and inspection
- Example: Gear tooth breakage, bearing cage failure

## Temperature Trend Analysis

### Baseline Shift
- Change: +5-8°C sustained over 24 hours
- Action: Investigate cooling/lubrication system
- Common cause: Lubrication starvation or cooling failure

### Thermal Runaway
- Rate: > 2°C per hour sustained
- Action: Emergency shutdown
- Indicates: Imminent catastrophic failure

## Combined Indicator Analysis
- Vibration + Temperature rise: Bearing failure (85% accuracy)
- Vibration + Pressure drop: Cavitation (78% accuracy)
- Temperature + Pressure rise: Blockage or restriction (72% accuracy)
- Vibration + RPM correlation: Rotor imbalance (82% accuracy)`,
  },
  {
    title: "Predictive Maintenance Economics ▸ Cost-Benefit Reference",
    document_type: "failure_analysis",
    file_name: "ECON-REF-001.md",
    file_type: "markdown",
    machine_type: null,
    tags: ["economics", "cost-analysis", "roi"],
    content: `# Predictive Maintenance Economics ▸ Cost-Benefit Analysis

## Cost Comparison: Planned vs Emergency Repairs

| Equipment | Planned Repair | Emergency Repair | Savings Ratio |
|-----------|---------------|-----------------|---------------|
| BF Fan bearing replacement | $45,000 | $1,850,000 | 41:1 |
| Hydraulic pump seal | $4,200 | $340,000 | 81:1 |
| Gearbox rebuild | $95,000 | $1,200,000 | 13:1 |
| Motor rewind | $28,000 | $620,000 | 22:1 |
| Conveyor belt splice | $12,000 | $280,000 | 23:1 |
| ID Fan balance | $28,000 | $450,000 | 16:1 |

## Production Impact Estimates
- 1 hour unplanned downtime at Hot Strip Mill: $350K
- 1 hour at Blast Furnace: $280K
- 1 hour at Rolling Mill: $190K
- 1 hour at Conveyor system: $85K

## Maintenance Strategy ROI
- Preventive maintenance ROI: 3:1 (base case)
- Predictive maintenance ROI: 8:1 (with ML model)
- Prescriptive maintenance ROI: 12:1 (with AI Copilot recommendations)

## Key Metrics
- Mean Time Between Failure (MTBF): baseline 2,400 hrs, target 4,800 hrs
- Mean Time To Repair (MTTR): baseline 8.2 hrs, target 4 hrs
- Overall Equipment Effectiveness (OEE): baseline 72%, target 88%`,
  },
];
