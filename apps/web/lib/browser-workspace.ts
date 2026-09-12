/** Browser-only document workspace. Never calls a language model or uploads files. */
import { readDocument, readSpreadsheet } from './document-readers';
import { answerDocuments } from './document-answers';
import type { Snapshot, Answer, Message, Analysis } from "./localops-types";
const KEY = "business-ai-workspace-v3";
type State = Snapshot & { messages: Message[]; workspace_name: string };
const now = () => new Date().toISOString();
const initial = (): State => ({
  documents: [],
  datasets: [],
  approvals: [],
  tasks: [],
  reports: [],
  activity: [],
  messages: [],
  workspace_name: "Bilal’s workspace",
});
let memory: State | undefined;
function state() {
  if (!memory) {
    try {
      const saved = localStorage.getItem(KEY);
      memory = saved ? JSON.parse(saved) : initial();
      if (!saved) {
        const legacy = JSON.parse(localStorage.getItem("localops-demo-v2") || "null");
        if(legacy) {
          memory!.documents = (legacy.documents || []).filter((d: {id:string})=>!["refund","onboarding","delivery"].includes(d.id));
          memory!.datasets = (legacy.datasets || []).filter((d: {id:string})=>!["sales","inventory"].includes(d.id));
          memory!.approvals = legacy.approvals || [];memory!.tasks=legacy.tasks||[];memory!.reports=legacy.reports||[];
        }
      }
    } catch {
      memory = initial();
    }
  }
  return memory!;
}
function save(s: State) {
  if (JSON.stringify(s).length > 4_000_000)
    throw new Error(
      "This browser workspace is full. Remove documents or clear browser data in Settings.",
    );
  localStorage.setItem(KEY, JSON.stringify(s));
  memory = s;
}
function change<T>(fn: (s: State) => T): T {
  const next = structuredClone(state());
  const result = fn(next);
  save(next);
  return result;
}
function audit(s: State, event: string, id: string) {
  s.activity.unshift({
    id: Date.now(),
    event,
    entity_id: id,
    created_at: now(),
  });
  s.activity = s.activity.slice(0, 100);
}
export const browserWorkspace = {
  snapshot(): Snapshot {
    return structuredClone(state());
  },
  messages() {
    return structuredClone(state().messages);
  },
  settings() {
    return { workspace_name: state().workspace_name, mode: "document-mode" };
  },
  setName(name: string) {
    change((s) => {
      s.workspace_name = name;
    });
  },
  reset() {
    localStorage.removeItem(KEY);
    memory = initial();
  },
  clearChat() {
    change((s) => {
      s.messages = [];
    });
  },
  document(id: string) {
    const d = state().documents.find((d) => d.id === id);
    if (!d) throw new Error("Document not found");
    return structuredClone(d);
  },
  async upload(file: File, kind: "document" | "dataset", onProgress?: (text:string)=>void) {
    const id=crypto.randomUUID();
    if(file.size===0 || file.size>20*1024*1024)throw new Error("Choose a non-empty file up to 20 MB.");
    if(kind === "document") {
      const content=await readDocument(file,onProgress);
      change(s=>{if(s.documents.length>=30)throw new Error("Workspace limit: 30 documents.");s.documents.push({id,filename:file.name,content,status:"ready"});audit(s,"document_uploaded",id);});
    } else {
      const data=/\.xlsx$/i.test(file.name)?await readSpreadsheet(file):parseCSV(await file.text());
      change(s=>{if(s.datasets.length>=10)throw new Error("Workspace limit: 10 datasets.");s.datasets.push({id,filename:file.name,...data,row_count:data.rows.length});audit(s,"dataset_uploaded",id);});
    }
    return id;
  },
  remove(id: string, kind: "document" | "dataset") {
    change((s) => {
      if (kind === "document")
        s.documents = s.documents.filter((d) => d.id !== id);
      else s.datasets = s.datasets.filter((d) => d.id !== id);
      audit(s, kind + "_deleted", id);
    });
  },
  query(id: string, sql: string): Analysis {
    const d = state().datasets.find((d) => d.id === id);
    if (!d) throw new Error("Choose a dataset first");
    const q = sql.trim().replace(/;$/, "").toLowerCase();
    if (/^select \* from dataset(?: limit (?:10|100))?$/.test(q))
      return {
        columns: d.columns,
        rows: (d.rows || []).slice(0, q.endsWith("10") ? 10 : 100),
        filename: d.filename,
        query: sql,
      };
    if (
      q ===
        "select month, sum(revenue) as revenue from dataset group by month order by month" &&
      d.columns.includes("month") &&
      d.columns.includes("revenue")
    ) {
      const groups: Record<string, number> = {};
      for (const row of d.rows || []) {
        const n = Number(row.revenue);
        if (!Number.isFinite(n)) throw new Error("Revenue must be numeric");
        const key = String(row.month);
        groups[key] = (groups[key] || 0) + n;
      }
      return {
        columns: ["month", "revenue"],
        rows: Object.keys(groups)
          .sort()
          .map((month) => ({ month, revenue: groups[month] })),
        filename: d.filename,
        query: sql,
      };
    }
    if (
      q === "select * from dataset where stock < reorder_level" &&
      d.columns.includes("stock") &&
      d.columns.includes("reorder_level")
    )
      return {
        columns: d.columns,
        rows: (d.rows || []).filter(
          (r) => Number(r.stock) < Number(r.reorder_level),
        ),
        filename: d.filename,
        query: sql,
      };
    throw new Error(
      "Document mode supports the three example queries shown below. Run the local app for validated DuckDB SQL.",
    );
  },
  chat(query: string, datasetId?: string): Answer {
    const q = query.toLowerCase();
    const result: Answer = {
      answer: "",
      citations: [],
      trajectory: ["supervisor"],
      conversation_id: "browser",
      mode: "document-mode",
    };
    const analytical = state().datasets.length > 0 && (
      /\b(sales|inventory|restock|revenue|dataset|analy[sz]e|stock)\b/.test(
        q,
      ) || !!datasetId);
    const action =
      /\b(create|prepare|generate|make|draft)\b.*\b(task|report|follow-up)\b/.test(
        q,
      );
    if (analytical) {
      const d =
        state().datasets.find((d) => d.id === datasetId) ||
        state().datasets.find((d) =>
          d.filename
            .toLowerCase()
            .includes(/inventory|stock/.test(q) ? "inventory" : "sales"),
        ) ||
        state().datasets[0];
      if (!d) result.answer = "Upload a CSV dataset in Analytics first.";
      else {
        const sql =
          d.columns.includes("stock") && d.columns.includes("reorder_level")
            ? "SELECT * FROM dataset WHERE stock < reorder_level"
            : d.columns.includes("month") && d.columns.includes("revenue")
              ? "SELECT month, SUM(revenue) AS revenue FROM dataset GROUP BY month ORDER BY month"
              : "SELECT * FROM dataset LIMIT 10";
        result.analytics = this.query(d.id, sql);
        result.answer = `Computed ${result.analytics.rows.length} result rows from ${d.filename}. These are descriptive results; this data does not establish causes.`;
      }
      result.trajectory.push("analyst_agent");
    }
    if (action) {
      const id = crypto.randomUUID();
      const tool = q.includes("report") ? "create_report" : "create_task";
      const payload =
        tool === "create_report"
          ? {
              title: query.slice(0, 200),
              content:
                "# Operations report\n\n" +
                (result.answer || query) +
                "\n\n" +
                JSON.stringify(result.analytics?.rows || [], null, 2),
            }
          : { title: query.slice(0, 200), description: query };
      result.approval = {
        id,
        approval_id: id,
        tool,
        payload,
        status: "pending",
        created_at: now(),
      };
      result.answer +=
        (result.answer ? "\n\n" : "") +
        "Review the proposed action in Approvals. Nothing has been executed yet.";
      result.trajectory.push("action_agent");
    } else if (!analytical) {
      const grounded = answerDocuments(query, state().documents);
      result.answer = grounded.answer;
      result.citations = grounded.citations;
      result.trajectory.push("knowledge_agent");
    }
    change((s) => {
      s.messages.push(
        { role: "user", content: query },
        { role: "assistant", content: result.answer, metadata: result },
      );
      if (result.approval) {
        s.approvals.unshift(result.approval);
        audit(s, "action_requested", result.approval.id!);
      }
      audit(s, "query_completed", "browser");
    });
    return result;
  },
  decide(id: string, approved: boolean) {
    change((s) => {
      const a = s.approvals.find((a) => (a.id || a.approval_id) === id);
      if (!a) throw new Error("Approval not found");
      if (a.status !== "pending") return;
      a.status = approved ? "approved" : "rejected";
      if (approved) {
        if (a.tool === "create_task")
          s.tasks.unshift({
            id,
            title: String(a.payload?.title),
            description: String(a.payload?.description || ""),
          });
        else
          s.reports.unshift({
            id,
            title: String(a.payload?.title),
            content: String(a.payload?.content || ""),
          });
      }
      audit(s, "action_" + a.status, id);
    });
  },
  report(id: string) {
    return state().reports.find((r) => r.id === id)?.content || "";
  },
};
export function parseCSV(text: string) {
  const data: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      data.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  if (cell || row.length) {
    row.push(cell);
    data.push(row);
  }
  const columns = (data.shift() || []).map((c) =>
    c.replace(/^\uFEFF/, "").trim(),
  );
  if (
    !columns.length ||
    columns.length > 100 ||
    columns.some((c) => !c) ||
    new Set(columns.map((c) => c.toLowerCase())).size !== columns.length ||
    !data.length ||
    data.length > 1000 ||
    data.some((r) => r.length !== columns.length)
  )
    throw new Error(
      "Use unique column headers and 1–1,000 rows with matching columns.",
    );
  return {
    columns,
    rows: data.map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]]))),
  };
}
