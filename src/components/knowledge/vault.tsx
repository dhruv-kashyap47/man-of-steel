"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Search, FileText, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MACHINE_TYPE_LABELS } from "@/types";
import type { KnowledgeDocument } from "@/types/database";
import type { Citation } from "@/types/database";

export function KnowledgeVault() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Citation[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "search" | "upload">("browse");

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState("manual");
  const [uploadMachine, setUploadMachine] = useState("");
  const [uploadContent, setUploadContent] = useState("");

  useEffect(() => {
    fetch("/api/knowledge").then((r) => r.json()).then((d) => setDocuments(d.documents));
  }, []);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setSearchResults(data.citations);
      setActiveTab("search");
    } finally {
      setSearching(false);
    }
  }

  async function handleUpload() {
    if (!uploadTitle || !uploadContent) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", uploadTitle);
      formData.append("document_type", uploadType);
      formData.append("content", uploadContent);
      if (uploadMachine) formData.append("machine_type", uploadMachine);

      const res = await fetch("/api/knowledge", { method: "POST", body: formData });
      const data = await res.json();
      setDocuments((prev) => [data.document, ...prev]);
      setUploadTitle("");
      setUploadContent("");
      setActiveTab("browse");
    } finally {
      setUploading(false);
    }
  }

  const docTypeIcon = (type: string) => {
    switch (type) {
      case "manual": return <BookOpen className="h-4 w-4" />;
      case "sop": return <FileText className="h-4 w-4" />;
      case "incident_report": return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div>
      <PageHeader
        badge="Semantic Knowledge Base"
        title="Knowledge Vault"
        subtitle="Manuals, SOPs, incident reports — semantic search with citations"
      />

      <div className="p-8 space-y-6">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Semantic search across all documents..."
              className="w-full rounded-lg border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm focus:border-accent/50 focus:outline-none"
            />
          </div>
          <Button variant="hud" onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("upload")}>
            <Upload className="h-4 w-4" /> Upload
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["browse", "search", "upload"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-1.5 text-sm capitalize transition-colors ${
                activeTab === tab
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "browse" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full hover:border-accent/20 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="text-accent">{docTypeIcon(doc.document_type)}</div>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {doc.document_type.replace("_", " ")}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm normal-case tracking-normal">
                      {doc.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {doc.content.slice(0, 200)}...
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {doc.machine_type && (
                        <Badge variant="cyan" className="text-[10px]">
                          {MACHINE_TYPE_LABELS[doc.machine_type]}
                        </Badge>
                      )}
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">{doc.file_name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "search" && (
          <div className="space-y-4">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {searching ? "Searching..." : "No results. Try a different query."}
              </p>
            ) : (
              searchResults.map((result, i) => (
                <Card key={i} className="hud-panel-accent">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{result.document_title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {result.document_type.replace("_", " ")} · Chunk {result.chunk_index}
                        </p>
                      </div>
                      <Badge variant="cyan">{(result.similarity * 100).toFixed(0)}% match</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{result.content_snippet}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "upload" && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Document title"
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="sop">SOP</option>
                  <option value="incident_report">Incident Report</option>
                  <option value="maintenance_log">Maintenance Log</option>
                </select>
                <select
                  value={uploadMachine}
                  onChange={(e) => setUploadMachine(e.target.value)}
                  className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm"
                >
                  <option value="">All Machine Types</option>
                  {Object.entries(MACHINE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder="Paste document content (Markdown or plain text)..."
                rows={10}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm focus:outline-none resize-none"
              />
              <Button variant="hud" onClick={handleUpload} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload to Vault
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
