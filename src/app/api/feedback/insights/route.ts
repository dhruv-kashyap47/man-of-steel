import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data/store";

export async function GET() {
  const insights = dataStore.getFeedbackInsights();
  const experiences = dataStore.getExperiences();
  const recurring = dataStore.findRecurringFaults();

  const incidentCounts: Record<string, number> = {};
  experiences.forEach((e) => {
    incidentCounts[e.incident_type] = (incidentCounts[e.incident_type] ?? 0) + 1;
  });
  const recurringIncidents = Object.entries(incidentCounts)
    .map(([incidentType, count]) => ({ incidentType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({
    ...insights,
    recurringIncidents,
    totalExperiences: experiences.length,
    recurringFaults: recurring.length,
    learningProgress: experiences.length > 0
      ? Math.round((experiences.filter((e) => e.fix_effective).length / experiences.length) * 100)
      : 0,
  });
}
