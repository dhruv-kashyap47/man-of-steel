import { dataStore } from "@/lib/data/store";
import { embedText, embedTextLocal, cosineSimilarity } from "./embeddings";
import { ML_CONFIG } from "@/lib/config";
import type { Citation, DocumentType, MachineType } from "@/types/database";

interface SearchOptions {
  query: string;
  machineType?: MachineType | null;
  documentType?: DocumentType | null;
  limit?: number;
  threshold?: number;
}

export async function semanticSearch(options: SearchOptions): Promise<Citation[]> {
  const {
    query,
    machineType,
    documentType,
    limit = ML_CONFIG.maxCitations,
    threshold = ML_CONFIG.similarityThreshold,
  } = options;

  const queryEmbedding = await embedText(query);
  const chunks = dataStore.getDocumentChunks();
  const docs = dataStore.getKnowledgeDocuments();
  const docMap = new Map(docs.map((d) => [d.id, d]));

  const scored = chunks
    .filter((chunk) => {
      const doc = docMap.get(chunk.document_id);
      if (!doc) return false;
      if (machineType && doc.machine_type && doc.machine_type !== machineType) return false;
      if (documentType && doc.document_type !== documentType) return false;
      return true;
    })
    .map((chunk) => {
      const chunkEmb = chunk.embedding ?? embedTextLocal(chunk.content);
      const similarity = cosineSimilarity(queryEmbedding, chunkEmb);
      const doc = docMap.get(chunk.document_id)!;
      return {
        document_id: doc.id,
        document_title: doc.title,
        document_type: doc.document_type,
        chunk_index: chunk.chunk_index,
        content_snippet: chunk.content.slice(0, 350),
        similarity,
      };
    })
    .filter((c) => c.similarity >= threshold - 0.15)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}

export function keywordSearch(query: string, limit = 5): Citation[] {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const chunks = dataStore.getDocumentChunks();
  const docs = dataStore.getKnowledgeDocuments();
  const docMap = new Map(docs.map((d) => [d.id, d]));

  return chunks
    .map((chunk) => {
      const lower = chunk.content.toLowerCase();
      const score = terms.reduce((s, t) => s + (lower.includes(t) ? 1 : 0), 0);
      const doc = docMap.get(chunk.document_id)!;
      return {
        document_id: doc.id,
        document_title: doc.title,
        document_type: doc.document_type,
        chunk_index: chunk.chunk_index,
        content_snippet: chunk.content.slice(0, 300),
        similarity: score / terms.length,
      };
    })
    .filter((c) => c.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
