/**
 * MAN OF STEEL — Database Seed Script
 * Populates Supabase with synthetic industrial data.
 * Run: npm run seed (requires .env.local with Supabase credentials)
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import {
  generatePlant,
  generateAssets,
  generateSensorReadings,
  generateAlerts,
  generateMaintenanceRecords,
  generatePredictions,
  generateInsights,
} from "../../src/lib/data/generators";
import { KNOWLEDGE_DOCUMENTS } from "../../src/lib/data/knowledge-content";
import { embedTextLocal } from "../../src/lib/rag/embeddings";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }
  return chunks;
}

async function seed() {
  console.log("🔄 Clearing existing data...");
  const tables = [
    "agent_runs", "copilot_messages", "copilot_conversations", "reports",
    "document_chunks", "knowledge_documents", "ai_insights", "failure_predictions",
    "maintenance_records", "alerts", "sensor_readings", "assets", "plants",
  ];
  for (const table of tables) {
    await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  console.log("🏭 Seeding plant...");
  const plant = generatePlant();
  const { error: plantErr } = await supabase.from("plants").insert(plant);
  if (plantErr) throw plantErr;

  console.log("⚙️  Seeding assets...");
  const assets = generateAssets(plant.id);
  const { error: assetErr } = await supabase.from("assets").insert(assets);
  if (assetErr) throw assetErr;

  console.log("📊 Seeding sensor readings...");
  const allReadings = assets.flatMap((a) => generateSensorReadings(a));
  for (let i = 0; i < allReadings.length; i += 100) {
    const batch = allReadings.slice(i, i + 100);
    const { error } = await supabase.from("sensor_readings").insert(batch);
    if (error) throw error;
  }

  console.log("🚨 Seeding alerts...");
  const alerts = generateAlerts(assets);
  await supabase.from("alerts").insert(alerts);

  console.log("🔧 Seeding maintenance records...");
  const maintenance = generateMaintenanceRecords(assets);
  for (let i = 0; i < maintenance.length; i += 50) {
    await supabase.from("maintenance_records").insert(maintenance.slice(i, i + 50));
  }

  console.log("🔮 Seeding predictions...");
  await supabase.from("failure_predictions").insert(generatePredictions(assets));

  console.log("💡 Seeding AI insights...");
  await supabase.from("ai_insights").insert(generateInsights(plant.id, assets));

  console.log("📚 Seeding knowledge documents...");
  for (const doc of KNOWLEDGE_DOCUMENTS) {
    const { data: inserted, error } = await supabase
      .from("knowledge_documents")
      .insert({
        title: doc.title,
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_type: doc.file_type,
        content: doc.content,
        machine_type: doc.machine_type,
        tags: doc.tags,
        metadata: {},
      })
      .select()
      .single();
    if (error) throw error;

    const chunks = chunkText(doc.content);
    const chunkRows = chunks.map((content, i) => ({
      document_id: inserted.id,
      chunk_index: i,
      content,
      embedding: JSON.stringify(embedTextLocal(content)),
      token_count: Math.ceil(content.length / 4),
      metadata: { title: doc.title },
    }));

    for (let i = 0; i < chunkRows.length; i += 20) {
      await supabase.from("document_chunks").insert(chunkRows.slice(i, i + 20));
    }
  }

  console.log("✅ Seed complete!");
  console.log(`   Plant: ${plant.name}`);
  console.log(`   Assets: ${assets.length}`);
  console.log(`   Sensor readings: ${allReadings.length}`);
  console.log(`   Alerts: ${alerts.length}`);
  console.log(`   Knowledge docs: ${KNOWLEDGE_DOCUMENTS.length}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
