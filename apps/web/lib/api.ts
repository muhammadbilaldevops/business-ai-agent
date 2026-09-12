import { browserWorkspace } from "./browser-workspace";
import type {
  Snapshot,
  Answer,
  Health,
  Message,
  Source,
  Dataset,
  Analysis,
} from "./localops-types";
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
export class LocalOpsClient {
  constructor(
    public local = false,
    public token = "",
  ) {}
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (this.token) headers.set("Authorization", `Bearer ${this.token}`);
    if (init.body && !(init.body instanceof FormData))
      headers.set("Content-Type", "application/json");
    const r = await fetch(API_BASE + path, { ...init, headers });
    if (!r.ok) {
      const body = (await r.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new Error(body.error?.message || `Request failed (${r.status})`);
    }
    return r.json();
  }
  async health(): Promise<Health> {
    return this.local
      ? this.request("/health")
      : {
          status: "ok",
          mode: "document-mode",
          retrieval: "keyword",
          voice: { stt: false, tts: false },
        };
  }
  async snapshot(): Promise<Snapshot> {
    if (!this.local) return browserWorkspace.snapshot();
    const [documents, datasets, approvals, tasks, reports, activity] =
      await Promise.all([
        this.request<Snapshot["documents"]>("/documents"),
        this.request<Snapshot["datasets"]>("/analytics/datasets"),
        this.request<Snapshot["approvals"]>("/approvals"),
        this.request<Snapshot["tasks"]>("/tasks"),
        this.request<Snapshot["reports"]>("/reports"),
        this.request<Snapshot["activity"]>("/activity"),
      ]);
    return { documents, datasets, approvals, tasks, reports, activity };
  }
  async history(conversation: string): Promise<Message[]> {
    if (!this.local) return browserWorkspace.messages();
    try {
      return await this.request(
        "/conversations/" + encodeURIComponent(conversation),
      );
    } catch {
      return [];
    }
  }
  async chat(
    message: string,
    conversation: string,
    datasetId: string | undefined,
    signal: AbortSignal,
    onToken: (text: string) => void,
  ): Promise<Answer> {
    if (!this.local) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      // Yield to the browser so the pending state paints before local processing.
      await new Promise<void>(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const answer = browserWorkspace.chat(message, datasetId);
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      return answer;
    }
    const response = await fetch(API_BASE + "/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({
        message,
        conversation_id: conversation,
        dataset_id: datasetId,
      }),
      signal,
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new Error(data.error?.message || "The local API is unavailable.");
    }
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "",
      answer: Answer | undefined;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const event = block
          .split("\n")
          .find((l) => l.startsWith("event:"))
          ?.slice(6)
          .trim();
        const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const data = JSON.parse(dataLine.slice(5));
        if (event === "token") onToken(data.text);
        if (event === "result") answer = data;
        if (event === "error") throw new Error(data.message);
      }
    }
    if (!answer) throw new Error("Response interrupted. Retry your message.");
    return answer;
  }
  async upload(file: File, kind: "document" | "dataset", onProgress?: (text:string)=>void) {
    if (!this.local) return browserWorkspace.upload(file, kind, onProgress);
    const body = new FormData();
    body.append("file", file);
    return (
      await this.request<{ id: string }>(
        kind === "document" ? "/documents/upload" : "/analytics/upload",
        { method: "POST", body },
      )
    ).id;
  }
  async document(id: string): Promise<Source> {
    return this.local ? this.request("/documents/" + id) : browserWorkspace.document(id);
  }
  async dataset(id: string): Promise<Dataset> {
    return this.local
      ? this.request("/analytics/datasets/" + id)
      : browserWorkspace.snapshot().datasets.find((d) => d.id === id)!;
  }
  async remove(id: string, kind: "document" | "dataset") {
    if (!this.local) {
      browserWorkspace.remove(id, kind);
      return;
    }
    await this.request(
      (kind === "document" ? "/documents/" : "/analytics/datasets/") + id,
      { method: "DELETE" },
    );
  }
  async reindex(id: string) {
    if (this.local)
      await this.request("/documents/" + id + "/reindex", { method: "POST" });
  }
  async query(id: string, query: string): Promise<Analysis> {
    return this.local
      ? this.request("/analytics/query", {
          method: "POST",
          body: JSON.stringify({ dataset_id: id, query }),
        })
      : browserWorkspace.query(id, query);
  }
  async decide(id: string, approved: boolean) {
    if (this.local)
      await this.request("/approvals/" + id, {
        method: "POST",
        body: JSON.stringify({ approved }),
      });
    else browserWorkspace.decide(id, approved);
  }
  async settings(): Promise<{
    workspace_name: string;
    mode: string;
    model?: string;
  }> {
    return this.local ? this.request("/settings") : browserWorkspace.settings();
  }
  async setName(workspace_name: string) {
    if (this.local)
      await this.request("/settings", {
        method: "PUT",
        body: JSON.stringify({ workspace_name }),
      });
    else browserWorkspace.setName(workspace_name);
  }
  async clearChat(id: string) {
    if (this.local)
      await this.request("/conversations/" + id, { method: "DELETE" });
    else browserWorkspace.clearChat();
  }
  async report(id: string) {
    if (!this.local) return browserWorkspace.report(id);
    const r = await fetch(API_BASE + "/reports/" + id, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    if (!r.ok) throw new Error("Report download failed");
    return r.text();
  }
  async transcribe(blob: Blob) {
    const body = new FormData();
    body.append("file", blob, "recording.webm");
    return this.request<{ text: string }>("/voice/transcribe", {
      method: "POST",
      body,
    });
  }
  async synthesize(text: string) {
    const r = await fetch(API_BASE + "/voice/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({ text: text.slice(0, 2000) }),
    });
    if (!r.ok) {
      const e = (await r.json()) as { error?: { message?: string } };
      throw new Error(e.error?.message || "Speech unavailable");
    }
    return r.blob();
  }
}
