"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  ChartNoAxesCombined,
  CheckCheck,
  Cpu,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Mic,
  Settings,
  ShieldCheck,
  Activity,
  Plus,
  Trash2,
  Upload,
  Download,
  RefreshCw,
  Square,
  Search,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Copy,
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { LocalOpsClient } from "@/lib/api";
import { suggestQuestions } from "@/lib/document-answers";
import { browserWorkspace } from "@/lib/browser-workspace";
import type {
  Snapshot,
  Message,
  Source,
  Analysis,
  Health,
} from "@/lib/localops-types";
import { AnalysisResult } from "@/components/analysis-result";
import { VoiceControls } from "@/components/voice-controls";
const REPO =
  "https://github.com/muhammadbilaldevops/Ai-Agent-Industry-Level-Project";
const views = [
  { name: "Workspace", icon: MessageSquare },
  { name: "Knowledge base", icon: BookOpen },
  { name: "Analytics", icon: ChartNoAxesCombined },
  { name: "Approvals", icon: CheckCheck },
  { name: "Activity", icon: Activity },
  { name: "Settings", icon: Settings },
];

const empty: Snapshot = {
  documents: [],
  datasets: [],
  approvals: [],
  tasks: [],
  reports: [],
  activity: [],
};
const queries = [
  "SELECT * FROM dataset LIMIT 10",
  "SELECT month, SUM(revenue) AS revenue FROM dataset GROUP BY month ORDER BY month",
  "SELECT * FROM dataset WHERE stock < reorder_level",
];
function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Text({ text }: { text: string }) {
  return (
    <div className="answer-text">
      {text.split(/(```[\s\S]*?```)/g).map((part, i) =>
        part.startsWith("```") ? (
          <pre key={i}>
            <code>{part.replace(/^```[^\n]*\n?/, "").replace(/```$/, "")}</code>
          </pre>
        ) : (
          part
            .split("\n\n")
            .map((p, j) => (
              <p key={`${i}-${j}`}>
                {p
                  .split(/(\*\*[^*]+\*\*)/)
                  .map((s, k) =>
                    s.startsWith("**") ? (
                      <strong key={k}>{s.slice(2, -2)}</strong>
                    ) : (
                      s
                    ),
                  )}
              </p>
            ))
        ),
      )}
    </div>
  );
}
export default function Home() {
  const [view, setView] = useState("Workspace"),
    [local, setLocal] = useState(false),
    [token, setToken] = useState(""),
    [ready, setReady] = useState(false),
    [snapshot, setSnapshot] = useState<Snapshot>(empty),
    [messages, setMessages] = useState<Message[]>([]),
    [name, setName] = useState("My workspace"),
    [health, setHealth] = useState<Health | null>(null),
    [error, setError] = useState(""),
    [info, setInfo] = useState(""),
    [busy, setBusy] = useState(false),
    [sending, setSending] = useState(false),
    [input, setInput] = useState(""),
    [attachments, setAttachments] = useState<
      { name: string; id: string; kind: string }[]
    >([]),
    [streamText, setStreamText] = useState(""),
    [search, setSearch] = useState(""),
    [opened, setOpened] = useState<Source | null>(null),
    [selected, setSelected] = useState(""),
    [sql, setSql] = useState(queries[0]),
    [analysis, setAnalysis] = useState<Analysis | null>(null),
    [confirm, setConfirm] = useState<{
      label: string;
      action: () => Promise<void>;
    } | null>(null);
  const client = useMemo(
    () => new LocalOpsClient(local, token),
    [local, token],
  );
  const conversation = useRef(""),
    abort = useRef<AbortController | null>(null),
    lastQuestion = useRef(""),
    end = useRef<HTMLDivElement | null>(null);
  const onError = useCallback(
    (e: unknown) =>
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please retry.",
      ),
    [],
  );
  const refresh = useCallback(
    async (c = client) => {
      const data = await c.snapshot();
      setSnapshot(data);
      setSelected((current) =>
        data.datasets.some((d) => d.id === current)
          ? current
          : data.datasets[0]?.id || "",
      );
    },
    [client],
  );
  useEffect(() => {
    let live = true;
    async function init() {
      let isLocal = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
      if (
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        ["localhost", "127.0.0.1", "::1"].includes(location.hostname)
      ) {
        try {
          const r = await fetch(
            (process.env.NEXT_PUBLIC_API_BASE_URL || "/api") + "/health",
            {
              signal: AbortSignal.timeout(65000),
            },
          );
          const h = (await r.json()) as Health;
          isLocal = isLocal || (r.ok && h.version === "0.2.0");
          if (r.ok && live) setHealth(h);
        } catch {
          /* A standalone static preview uses the browser browserWorkspace. */
        }
      }
      if (!live) return;
      conversation.current =
        localStorage.getItem("localops-conversation") || crypto.randomUUID();
      localStorage.setItem("localops-conversation", conversation.current);
      setLocal(isLocal);
      setReady(true);
    }
    void init().catch(onError);
    return () => {
      live = false;
      abort.current?.abort();
    };
  }, [onError]);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    async function load() {
      try {
        const [data, prefs, h, history] = await Promise.all([
          client.snapshot(),
          client.settings(),
          client.health(),
          client.history(conversation.current),
        ]);
        if (live) {
          setSnapshot(data);
          setName(prefs.workspace_name);
          setHealth(h);
          setMessages(history);
          setSelected(data.datasets[0]?.id || "");
        }
      } catch (e) {
        if (live) onError(e);
      }
    }
    void load();
    return () => {
      live = false;
    };
  }, [client, ready, onError]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, streamText]);
  async function perform(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await fn();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  async function send(question = input) {
    const q = question.trim();
    if (!q || sending || busy || !ready) return;
    setView("Workspace");
    setInput("");
    setError("");
    setInfo("");
    setSending(true);
    setStreamText("");
    lastQuestion.current = q;
    abort.current = new AbortController();
    setMessages((m) => [...m, { role: "user", content: q }]);
    try {
      const answer = await client.chat(
        q,
        conversation.current,
        (/sales|revenue|inventory|dataset|rows|columns/i.test(q) ? attachments.find((a) => a.kind === "dataset")?.id : undefined),
        abort.current.signal,
        (t) => setStreamText((s) => s + t),
      );
      setMessages((m) => [
        ...m,
        { role: "assistant", content: answer.answer, metadata: answer },
      ]);
      setAttachments([]);
      await refresh();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError")
        setInfo(
          "Response stopped. Any proposed action still requires approval.",
        );
      else { setInput(q); onError(e); }
    } finally {
      setSending(false);
      setStreamText("");
    }
  }
  async function uploadMany(
    files: FileList | File[] | null,
    forcedKind?: "document" | "dataset",
  ) {
    if (!files?.length || busy || sending) return;
    const batch = Array.from(files);
    if (batch.length > 10) {
      setError("Choose up to 10 files at a time.");
      return;
    }
    await perform(async () => {
      const failures: string[] = [];
      for (const file of batch) {
        const kind =
          forcedKind ||
          (/\.(csv|xlsx)$/i.test(file.name) ? "dataset" : "document");
        try {
          setInfo("Reading " + file.name + "…");
          const id = await client.upload(file, kind, setInfo);
          if (kind === "dataset") setSelected(id);
          setAttachments((a) => [
            ...a.filter((x) => x.id !== id),
            { name: file.name, id, kind },
          ]);
        } catch (e) {
          failures.push(
            file.name +
              ": " +
              (e instanceof Error ? e.message : "Upload failed"),
          );
        }
      }
      await refresh();
      if (failures.length) setError(failures.join("\n"));
      setInfo(
        batch.length - failures.length + " file(s) ready in your workspace.",
      );
    });
  }
  async function newChat() {
    if (sending) return;
    conversation.current = crypto.randomUUID();
    localStorage.setItem("localops-conversation", conversation.current);
    if (!local) browserWorkspace.clearChat();
    setMessages([]);
    setInput("");
    setAttachments([]);
    setView("Workspace");
    setError("");
    setInfo("");
  }
  async function preview(id: string) {
    await perform(async () => {
      setOpened(await client.document(id));
    });
  }
  const suggestions = useMemo(() => suggestQuestions(snapshot.documents, snapshot.datasets), [snapshot]);
  const pending = snapshot.approvals.filter(
    (a) => a.status === "pending",
  ).length;
  const requestDelete = (
    id: string,
    kind: "document" | "dataset",
    filename: string,
  ) =>
    setConfirm({
      label: `Delete ${filename}?`,
      action: async () => {
        await client.remove(id, kind);
        if (kind === "dataset") setAnalysis(null);
        await refresh();
      },
    });
  useEffect(() => {
    type Context = {
      registerTool: (
        tool: unknown,
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "navigate_localops_workspace",
          title: "Open a Business AI Agent view",
          description:
            "Navigate to a workspace view without executing or approving actions.",
          inputSchema: {
            type: "object",
            properties: {
              view: { type: "string", enum: views.map((v) => v.name) },
            },
            required: ["view"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: (value: unknown) => {
            if (
              !value ||
              typeof value !== "object" ||
              !("view" in value) ||
              !views.some((v) => v.name === value.view)
            )
              throw new Error("Choose a supported workspace view");
            setView(String(value.view));
            return { view: value.view };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, []);
  return (
    <SidebarProvider>
      <a className="skip-link" href="#workspace-main">
        Skip to workspace
      </a>
      <Sidebar>
        <SidebarHeader>
          <Link className="brand" href="/">
            <span className="brand-mark">
              <Sparkles size={23} />
            </span>
            <span>
              Business <b>AI Agent</b>
            </span>
          </Link>
          <Button
            className="new-chat"
            variant="ghost"
            disabled={sending}
            onClick={newChat}
          >
            <Plus size={18} /> New chat
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {views.map((v) => (
              <SidebarMenuItem key={v.name}>
                <SidebarMenuButton
                  isActive={view === v.name}
                  onClick={() => {
                    setView(v.name);
                    setInfo("");
                    setError("");
                  }}
                >
                  <v.icon />
                  <span>{v.name === "Workspace" ? "Chat" : v.name}</span>
                  {v.name === "Approvals" && pending > 0 && (
                    <b className="nav-count">{pending}</b>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <a className="author" href={REPO} target="_blank" rel="noreferrer">
            <span className="avatar">MB</span>
            <span>
              Muhammad Bilal<small>View project on GitHub ↗</small>
            </span>
          </a>
          <a
            className="linkedin-link"
            aria-label="Muhammad Bilal on LinkedIn (opens in new tab)"
            href="https://www.linkedin.com/in/muhammadbilaldevops/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="19"
              height="19"
              fill="currentColor"
            >
              <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.53v16.94c0 .85.69 1.53 1.55 1.53h16.9c.86 0 1.55-.68 1.55-1.53V3.53c0-.85-.69-1.53-1.55-1.53zM7.93 18.75H4.98V9.2h2.95v9.55zM6.46 7.89a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42zm12.29 10.86H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.36-1.52 2.8-1.52 2.99 0 3.57 1.97 3.57 4.53v5.24z" />
            </svg>{" "}
            LinkedIn
          </a>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="topbar">
          <div>
            <SidebarTrigger />
            <span>
              <strong>
                {view === "Workspace" ? "Business AI Agent" : view}
              </strong>
            </span>
          </div>
          <span className="mode-badge">
            <Cpu size={14} />
            {local
              ? health?.mode === "ollama"
                ? "Local Ollama"
                : health?.mode === "gemini"
                  ? "Gemini"
                  : "Document excerpts"
              : "Document mode"}
          </span>
        </header>
        <main
          id="workspace-main"
          className={
            "workspace " + (view === "Workspace" ? "chat-workspace" : "")
          }
        >
          {view !== "Workspace" && (
            <div className="page-heading">
              <div>
                <p className="eyebrow">YOUR OPERATIONS, CONNECTED</p>
                <h1>{view === "Workspace" ? "Let’s get to work." : view}</h1>
                <p>
                  {view === "Workspace"
                    ? "Find answers. Understand your data. Move work forward."
                    : view === "Knowledge base"
                      ? "Give your assistant the context behind your business."
                      : view === "Analytics"
                        ? "Turn business files into clear, reproducible results."
                        : view === "Approvals"
                          ? "Review exactly what will change before it happens."
                          : view === "Settings"
                            ? "Make this workspace your own."
                            : "Your workspace, with a visible trail."}
                </p>
              </div>
              {view === "Workspace" && (
                <Button
                  variant="outline"
                  onClick={() => setView("Knowledge base")}
                >
                  <Plus />
                  Add your documents
                </Button>
              )}
            </div>
          )}
          {error && (
            <div role="alert" className="error-banner">
              <span>{error}</span>
              {local && !token && (
                <Button variant="ghost" onClick={() => setView("Settings")}>
                  Open Settings
                </Button>
              )}
              <Button
                variant="ghost"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X />
              </Button>
            </div>
          )}
          {info && (
            <div role="status" className="notice">
              {info}
            </div>
          )}
          {!ready && <p role="status">Opening your workspace…</p>}
          {view === "Workspace" && (
            <>
              <div className="work-grid">
                <section
                  className="chat-panel"
                  aria-label="Operations assistant"
                >
                  {messages.length === 0 ? (
                    <div className="welcome">
                      <div className="welcome-orbit" aria-hidden="true"><Sparkles size={28} /></div><h1>Ready when <span>you are</span></h1><p className="welcome-hint">Ideas, answers, and a little less busywork.</p>
                    </div>
                  ) : (
                    <div className="message-list" aria-live="polite">
                      {messages.map((m, i) => (
                        <article className={"message " + m.role} key={i}>
                          <div className="message-author">
                            {m.role === "assistant" ? (
                              <Cpu size={16} />
                            ) : (
                              <span className="user-dot">Y</span>
                            )}
                            {m.role === "assistant"
                              ? "Business AI Agent"
                              : "You"}
                            {m.metadata?.mode && (
                              <small>{m.metadata.mode === "browser-demo" ? "document-mode" : m.metadata.mode}</small>
                            )}
                          </div>
                          <Text text={m.content} />
                          {m.role === "assistant" && (
                            <button
                              className="copy-answer"
                              aria-label="Copy answer"
                              onClick={() =>
                                navigator.clipboard
                                  .writeText(m.content)
                                  .then(() => setInfo("Answer copied."))
                                  .catch(onError)
                              }
                            >
                              <Copy size={16} />
                            </button>
                          )}
                          {m.metadata?.analytics && (
                            <AnalysisResult result={m.metadata.analytics} />
                          )}{" "}
                          {!!m.metadata?.citations?.length && (
                            <div className="citation-list">
                              {m.metadata.citations.map((c, j) => (
                                <button
                                  key={j}
                                  onClick={() => preview(c.document_id)}
                                >
                                  <FileText size={14} />[{j + 1}] {c.filename}
                                  {c.page ? ` · page ${c.page}` : ""}
                                </button>
                              ))}
                            </div>
                          )}
                          {m.metadata?.approval && (
                            <Button
                              className="review-action"
                              variant="outline"
                              onClick={() => setView("Approvals")}
                            >
                              <CheckCheck />
                              Review action
                            </Button>
                          )}
                          {m.metadata?.trajectory && (
                            <details className="trace">
                              <summary>Execution steps</summary>
                              <ol>
                                {m.metadata.trajectory.map((t, k) => (
                                  <li key={k}>{t.replaceAll("_", " ")}</li>
                                ))}
                              </ol>
                            </details>
                          )}
                        </article>
                      ))}
                      {sending && (
                        <article className="message assistant">
                          <div role="status">{streamText || "Thinking…"}</div>
                        </article>
                      )}
                      <div ref={end} />
                    </div>
                  )}
                  <form
                    className="composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send();
                    }}
                  >
                    {attachments.length > 0 && (
                      <div className="attachment-chips">
                        {attachments.map((f) => (
                          <span key={f.id}>
                            <FileText size={15} />
                            {f.name}
                            <button
                              type="button"
                              aria-label={"Dismiss upload status for " + f.name}
                              onClick={() =>
                                setAttachments((a) =>
                                  a.filter((x) => x.id !== f.id),
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <textarea
                      aria-label="Message"
                      maxLength={4000}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask Business AI Agent"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                    />
                    <div className="composer-toolbar">
                      <label className="attach-control" title="Add files">
                        <Plus size={23} />
                        <span className="sr-only">Add files</span>
                        <input
                          aria-label="Add files"
                          type="file"
                          multiple
                          disabled={busy || sending}
                          accept=".pdf,.docx,.txt,.md,.csv,.json,.xlsx,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            void uploadMany(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <span className="composer-status" role="status">
                        {busy
                          ? "Uploading…"
                          : local
                            ? "Workspace connected"
                            : "Document mode"}
                      </span>
                      <VoiceControls
                        onTranscript={(text) =>
                          setInput((s) => (s ? s + " " + text : text))
                        }
                        lastAnswer={
                          [...messages]
                            .reverse()
                            .find((m) => m.role === "assistant")?.content || ""
                        }
                        onError={onError}
                        disabled={sending || busy}
                      />
                      {sending ? (
                        <Button
                          type="button"
                          aria-label="Stop generation"
                          onClick={() => abort.current?.abort()}
                        >
                          <Square />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          aria-label="Send message"
                          disabled={!input.trim() || !ready || busy}
                        >
                          <ArrowUp />
                        </Button>
                      )}
                    </div>
                  </form>
                  {suggestions.length > 0 && (
                    <div className="quick-prompts" aria-label="Questions from your files">
                      {suggestions.slice(0, 3).map((q) => (
                        <button
                          key={q}
                          disabled={!ready || busy || sending}
                          onClick={() => void send(q)}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                  {messages.length === 0 && <details className="usage-guide"><summary>How to use Business AI Agent</summary><ol><li><strong>Add your files.</strong> Use the + button to choose up to 10 files at once. Wait for the upload to finish.</li><li><strong>Ask your question.</strong> Type in the message box or use the microphone. Review your words, then press Send.</li><li><strong>Explore the answer.</strong> Open cited sources, copy the response, or use the speaker button to listen.</li><li><strong>Stay in control.</strong> Review proposed tasks in Approvals. Use New chat to start a fresh conversation.</li></ol><p>{local ? "Connected workspaces support PDF, Word, text, JSON, CSV, and Excel files." : "Upload PDF, Word, text, JSON, CSV, Excel, or an image. Scanned pages are read with English OCR. Files stay in this browser in Document mode."}</p><p>Voice input uses your browser’s speech service and may send audio to its provider. Allow microphone access when prompted.</p></details>}
                  <p className="chat-disclaimer">
                    {local
                      ? "Check important answers against their sources."
                      : "Answers are grounded in your files. Always check the linked sources."}
                  </p>
                  {error && messages.some((m) => m.role === "user") && (
                    <Button
                      variant="ghost"
                      disabled={sending}
                      onClick={() => send(lastQuestion.current)}
                    >
                      Retry last message
                    </Button>
                  )}
                </section>
              </div>
            </>
          )}
          {view === "Knowledge base" && (
            <>
              <div className="upload-zone">
                <Upload size={26} />
                <h2>Add business knowledge</h2>
                <p>
                  {local
                    ? "PDF, DOCX, TXT, Markdown, CSV, JSON, XLSX · up to 10 MB"
                    : "PDF, Word, text, JSON, Excel, CSV, and images · up to 20 MB per file."}
                </p>
                <label className="upload-button">
                  Choose documents
                  <input
                    aria-label="Upload document"
                    type="file"
                    multiple
                    disabled={busy}
                    accept=".pdf,.docx,.txt,.md,.csv,.json,.xlsx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      void uploadMany(e.target.files, "document");
                      e.target.value = "";
                    }}
                  />
                </label>
                <small>
                  {busy
                    ? "Processing your file…"
                    : local
                      ? "Saved and indexed in this workspace."
                      : "Saved only in this browser. Clearing browser data removes your uploads."}
                </small>
              </div>
              <div className="section-toolbar">
                <h2>
                  Documents{" "}
                  <span className="count">{snapshot.documents.length}</span>
                </h2>
                <div className="search-box">
                  <Search size={17} />
                  <Input
                    aria-label="Search documents"
                    placeholder="Search by filename…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <section className="content-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.documents
                      .filter((d) =>
                        d.filename.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>
                            <button
                              className="document-name"
                              onClick={() => preview(d.id)}
                            >
                              <FileText size={18} />
                              {d.filename}
                            </button>
                          </TableCell>
                          <TableCell>
                            <span className="tag">
                              Ready
                              {d.chunk_count
                                ? ` · ${d.chunk_count} chunks`
                                : ""}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="button-row">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Re-index ${d.filename}`}
                                disabled={busy}
                                onClick={() =>
                                  perform(async () => {
                                    await client.reindex(d.id);
                                    setInfo("Document index is ready.");
                                  })
                                }
                              >
                                <RefreshCw size={15} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete ${d.filename}`}
                                onClick={() =>
                                  requestDelete(d.id, "document", d.filename)
                                }
                              >
                                <Trash2 size={15} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {snapshot.documents.length === 0 && (
                  <p className="empty-note">
                    No documents yet. Upload a policy or handbook to ask
                    questions about it.
                  </p>
                )}
              </section>
            </>
          )}
          {view === "Analytics" && (
            <>
              <div className="section-toolbar">
                <div>
                  <h2>Explore a dataset</h2>
                  <p className="muted">
                    {local
                      ? "Read-only DuckDB queries · 500-row result limit"
                      : "Browser calculations on sample or uploaded CSV data."}
                  </p>
                </div>
                <label className="upload-button">
                  <Upload size={16} />
                  Upload dataset
                  <input
                    aria-label="Upload dataset"
                    type="file"
                    multiple
                    accept=".csv,.xlsx"
                    disabled={busy}
                    onChange={(e) => {
                      void uploadMany(e.target.files, "dataset");
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <section className="content-card">
                <label id="dataset-label">Dataset</label>
                <div className="button-row">
                  <Select
                    value={selected}
                    onValueChange={(id) => {
                      setSelected(id);
                      setAnalysis(null);
                    }}
                  >
                    <SelectTrigger
                      aria-labelledby="dataset-label"
                      className="dataset-select"
                    >
                      <SelectValue placeholder="Choose a dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {snapshot.datasets.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.filename} · {d.row_count} rows
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete selected dataset"
                    disabled={!selected}
                    onClick={() =>
                      requestDelete(
                        selected,
                        "dataset",
                        snapshot.datasets.find((d) => d.id === selected)
                          ?.filename || "dataset",
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                <label htmlFor="sql">SQL query</label>
                <textarea
                  id="sql"
                  className="sql-input"
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  maxLength={4000}
                />
                <div className="query-examples">
                  {queries.map((q, i) => (
                    <button key={q} onClick={() => setSql(q)}>
                      {["Preview rows", "Revenue by month", "Low stock"][i]}
                    </button>
                  ))}
                </div>
                <div className="button-row">
                  <Button
                    disabled={busy || !selected}
                    onClick={() =>
                      perform(async () =>
                        setAnalysis(await client.query(selected, sql)),
                      )
                    }
                  >
                    <ChartNoAxesCombined />
                    Run query
                  </Button>
                  {analysis && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        download(
                          "analysis.json",
                          JSON.stringify(analysis, null, 2),
                          "application/json",
                        )
                      }
                    >
                      <Download />
                      Download result
                    </Button>
                  )}
                </div>
                {!local && (
                  <p className="muted small">
                    Document mode supports the three example queries. The local app
                    supports a broader, validated SQL subset.
                  </p>
                )}
              </section>
              {analysis && (
                <section className="content-card">
                  <h2>Query results</h2>
                  <AnalysisResult result={analysis} />
                </section>
              )}
            </>
          )}
          {view === "Approvals" && (
            <>
              <div className="notice">
                <ShieldCheck size={18} />
                Tasks and reports are created only after you approve. Nothing is
                sent to an external service.
              </div>
              <section className="approvals-grid">
                {snapshot.approvals.map((a) => (
                  <article
                    className="content-card approval-card"
                    key={a.id || a.approval_id}
                  >
                    <div className="section-toolbar">
                      <span className={"tag " + a.status}>{a.status}</span>
                      <small>{a.tool.replaceAll("_", " ")}</small>
                    </div>
                    <h2>{String(a.payload?.title || "Proposed action")}</h2>
                    <p className="muted">
                      Writes a {a.tool === "create_task" ? "task" : "report"} to{" "}
                      {local ? "your local workspace" : "this browser"}.
                    </p>
                    <details>
                      <summary>Review exact arguments</summary>
                      <pre>{JSON.stringify(a.payload, null, 2)}</pre>
                    </details>
                    {a.status === "pending" && (
                      <div className="button-row">
                        <Button
                          disabled={busy}
                          onClick={() =>
                            perform(async () => {
                              await client.decide(
                                (a.id || a.approval_id)!,
                                true,
                              );
                              await refresh();
                              setInfo("Approved and completed.");
                            })
                          }
                        >
                          <Check />
                          Approve action
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            perform(async () => {
                              await client.decide(
                                (a.id || a.approval_id)!,
                                false,
                              );
                              await refresh();
                              setInfo("Rejected. No changes were made.");
                            })
                          }
                        >
                          <X />
                          Reject
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </section>
              {!snapshot.approvals.length && (
                <div className="content-card empty-state">
                  <CheckCheck size={30} />
                  <h2>Nothing waiting for approval</h2>
                  <p>
                    Ask the assistant to create a follow-up task or generate a
                    report.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => send("Create a follow-up task")}
                  >
                    Prepare a sample task
                  </Button>
                </div>
              )}
              <div className="two-column">
                <section className="content-card">
                  <h2>
                    Created tasks{" "}
                    <span className="count">{snapshot.tasks.length}</span>
                  </h2>
                  {snapshot.tasks.map((t) => (
                    <div className="task-item" key={t.id}>
                      <CheckCheck size={18} />
                      <div>
                        <strong>{t.title}</strong>
                        <p>{t.description}</p>
                      </div>
                    </div>
                  ))}
                  {!snapshot.tasks.length && (
                    <p className="empty-note">
                      Approved tasks will appear here.
                    </p>
                  )}
                </section>
                <section className="content-card">
                  <h2>
                    Reports{" "}
                    <span className="count">{snapshot.reports.length}</span>
                  </h2>
                  {snapshot.reports.map((r) => (
                    <div className="task-item" key={r.id}>
                      <FileText />
                      <span>{r.title}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Download ${r.title}`}
                        onClick={() =>
                          perform(async () =>
                            download(
                              "operations-report.md",
                              await client.report(r.id),
                              "text/markdown",
                            ),
                          )
                        }
                      >
                        <Download />
                      </Button>
                    </div>
                  ))}
                  {!snapshot.reports.length && (
                    <p className="empty-note">
                      Approved reports will appear here.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}
          {view === "Activity" && (
            <section className="content-card">
              <div className="section-toolbar">
                <h2>Workspace activity</h2>
                <Button
                  variant="outline"
                  onClick={() =>
                    download(
                      "activity.json",
                      JSON.stringify(snapshot.activity, null, 2),
                      "application/json",
                    )
                  }
                >
                  <Download />
                  Export log
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.activity.map((a, i) => (
                    <TableRow key={`${a.id}-${i}`}>
                      <TableCell>{a.event.replaceAll("_", " ")}</TableCell>
                      <TableCell>{a.created_at}</TableCell>
                      <TableCell className="mono">
                        {a.entity_id.slice(0, 12)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!snapshot.activity.length && (
                <p className="empty-note">
                  Your first upload, query, or action will appear here.
                </p>
              )}
            </section>
          )}
          {view === "Settings" && (
            <div className="settings-grid">
              <section className="content-card">
                <h2>Your workspace</h2>
                <label htmlFor="workspace-name">Workspace name</label>
                <Input
                  id="workspace-name"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                />
                <Button
                  disabled={!name.trim() || busy}
                  onClick={() =>
                    perform(async () => {
                      await client.setName(name.trim());
                      setInfo("Workspace name saved.");
                    })
                  }
                >
                  Save name
                </Button>
                <h2>Runtime status</h2>
                <dl className="status-list">
                  <div>
                    <dt>Mode</dt>
                    <dd>{health?.mode || "Checking"}</dd>
                  </div>
                  <div>
                    <dt>Retrieval</dt>
                    <dd>{health?.retrieval || "Keyword"}</dd>
                  </div>
                  <div>
                    <dt>Language model</dt>
                    <dd>
                      {["ollama", "gemini"].includes(health?.mode || "")
                        ? "Connected"
                        : "Not used in this mode"}
                    </dd>
                  </div>
                  <div>
                    <dt>Document storage</dt>
                    <dd>
                      {local ? "Connected workspace" : "This browser only"}
                    </dd>
                  </div>
                </dl>
                {local && (
                  <>
                    <label htmlFor="api-token">Workspace access token</label>
                    <Input
                      id="api-token"
                      type="password"
                      value={token}
                      autoComplete="off"
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Kept in memory for this tab only"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        perform(async () => {
                          const h = await client.request<{
                            available: boolean;
                          }>("/health/model");
                          setInfo(
                            h.available
                              ? "Language model is configured."
                              : "Add a model API key to the backend settings.",
                          );
                        })
                      }
                    >
                      Check model
                    </Button>
                  </>
                )}
                {!local && (
                  <>
                    <h2>Browser data</h2>
                    <p className="muted">
                      Files and conversations are stored on this device.
                      Resetting removes your uploads and clears this workspace.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setConfirm({
                          label: "Reset all browser data?",
                          action: async () => {
                            browserWorkspace.reset();
                            await refresh();
                            setMessages([]);
                            setName(browserWorkspace.settings().workspace_name);
                            setInfo("Workspace reset.");
                          },
                        })
                      }
                    >
                      <Trash2 />
                      Reset workspace
                    </Button>
                  </>
                )}
              </section>
              <section className="content-card setup-card">
                <p className="eyebrow">RUN IT YOURSELF</p>
                <h2>
                  Your files. Your models.
                  <br />
                  Your computer.
                </h2>
                <p>
                  Start with the included extractive mode, then enable Ollama
                  for generated answers. No cloud API key is required.
                </p>
                <ol>
                  <li>Install Git and Docker Desktop.</li>
                  <li>Clone the repository.</li>
                  <li>Run the startup command below.</li>
                  <li>Open localhost:8000 and upload your files.</li>
                </ol>
                <pre>
                  git clone {REPO}.git
                  {`\ncd Ai-Agent-Industry-Level-Project\ndocker compose up --build`}
                </pre>
                <a
                  className="text-link"
                  href={`${REPO}#quick-start`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the complete setup guide <ExternalLink size={14} />
                </a>
                <div className="notice">
                  Document mode works in your browser without a connected model. The
                  repository includes the full local runtime and its test
                  suites.
                </div>
                <a
                  className="text-link"
                  href={`${REPO}/blob/main/docs/requirements-coverage.md`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Review implementation coverage →
                </a>
              </section>
            </div>
          )}
          <footer className="workspace-footer">
            <span className="footer-author">
              Built by Muhammad Bilal{" "}
              <a
                aria-label="Muhammad Bilal LinkedIn"
                href="https://www.linkedin.com/in/muhammadbilaldevops/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="19"
                  height="19"
                  fill="currentColor"
                >
                  <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.53v16.94c0 .85.69 1.53 1.55 1.53h16.9c.86 0 1.55-.68 1.55-1.53V3.53c0-.85-.69-1.53-1.55-1.53zM7.93 18.75H4.98V9.2h2.95v9.55zM6.46 7.89a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42zm12.29 10.86H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.36-1.52 2.8-1.52 2.99 0 3.57 1.97 3.57 4.53v5.24z" />
                </svg>
              </a>
            </span>
            <a
              href={`${REPO}/blob/main/docs/architecture.md`}
              target="_blank"
              rel="noreferrer"
            >
              Architecture & documentation ↗
            </a>
          </footer>
        </main>
      </SidebarInset>
      <Dialog
        open={!!opened}
        onOpenChange={(open) => {
          if (!open) setOpened(null);
        }}
      >
        <DialogContent className="source-dialog">
          <DialogHeader>
            <DialogTitle>{opened?.filename}</DialogTitle>
            <DialogDescription>
              Source content is evidence, not instructions for the agent.
            </DialogDescription>
          </DialogHeader>
          <div className="source-content">
            <Text text={opened?.content || ""} />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the selected data from this workspace. Keep a copy of
              anything you need.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = confirm?.action;
                setConfirm(null);
                if (action) void perform(action);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
