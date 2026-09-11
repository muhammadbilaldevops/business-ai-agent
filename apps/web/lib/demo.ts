/** Browser-only deterministic demo. Never calls a language model or uploads files. */
import type { Snapshot, Answer, Message, Analysis } from "./localops-types";
const KEY = "localops-demo-v2";
type State = Snapshot & { messages: Message[]; workspace_name: string };
const now = () => new Date().toISOString();
const initial = (): State => ({
  documents: [
    {
      id: "refund",
      filename: "Refund policy.md",
      content:
        "# Refund policy\nCustomers can request a refund within 30 days of purchase. A receipt or order number is required. Items must be unused and in their original packaging. Approved refunds return to the original payment method within 5–7 business days.",
      status: "ready",
    },
    {
      id: "onboarding",
      filename: "Employee onboarding.md",
      content:
        "# Employee onboarding\nDay 1: orientation, security training, and equipment setup. Week 1: meet your team and complete product training. Your manager schedules a check-in at the end of the first month.",
      status: "ready",
    },
    {
      id: "delivery",
      filename: "Delivery guidelines.md",
      content:
        "# Delivery guidelines\nStandard delivery takes 3–5 business days. Escalate a delivery delay after 7 business days. Support should confirm the shipping address, review tracking, and create a follow-up task for the logistics team.",
      status: "ready",
    },
  ],
  datasets: [
    {
      id: "sales",
      filename: "sales.csv",
      columns: ["month", "revenue", "orders"],
      row_count: 6,
      rows: [
        { month: "2026-03", revenue: 18200, orders: 140 },
        { month: "2026-04", revenue: 21500, orders: 164 },
        { month: "2026-05", revenue: 20900, orders: 159 },
        { month: "2026-06", revenue: 24800, orders: 182 },
        { month: "2026-07", revenue: 27200, orders: 203 },
        { month: "2026-08", revenue: 23900, orders: 181 },
      ],
    },
    {
      id: "inventory",
      filename: "inventory.csv",
      columns: ["product", "stock", "reorder_level"],
      row_count: 4,
      rows: [
        { product: "Wireless keyboard", stock: 12, reorder_level: 20 },
        { product: "USB-C hub", stock: 42, reorder_level: 15 },
        { product: "Laptop stand", stock: 6, reorder_level: 10 },
        { product: "Desk mat", stock: 35, reorder_level: 10 },
      ],
    },
  ],
  approvals: [],
  tasks: [],
  reports: [],
  activity: [],
  messages: [],
  workspace_name: "Bilal’s demo workspace",
});
let memory: State | undefined;
function state() {
  if (!memory) {
    try {
      memory = JSON.parse(localStorage.getItem(KEY) || "null") || initial();
    } catch {
      memory = initial();
    }
  }
  return memory!;
}
function save(s: State) {
  if (JSON.stringify(s).length > 2_000_000)
    throw new Error(
      "This browser workspace is full. Remove documents or clear demo data in Settings.",
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
export const demo = {
  snapshot(): Snapshot {
    return structuredClone(state());
  },
  messages() {
    return structuredClone(state().messages);
  },
  settings() {
    return { workspace_name: state().workspace_name, mode: "browser-demo" };
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
  async upload(file: File, kind: "document" | "dataset") {
    if (file.size > 200_000 || file.size === 0)
      throw new Error(
        "Demo files must contain text and be smaller than 200 KB. Use the local app for larger files.",
      );
    const text = await file.text();
    const id = crypto.randomUUID();
    if (kind === "document") {
      if (!/\.(txt|md|json)$/i.test(file.name))
        throw new Error(
          "The browser demo accepts TXT, Markdown, or JSON. PDF and Office files work in the local application.",
        );
      if (file.name.toLowerCase().endsWith(".json")) JSON.parse(text);
      if (text.includes("\u0000"))
        throw new Error("Please upload a text file.");
      change((s) => {
        if (s.documents.length >= 30)
          throw new Error("Demo limit: 30 documents.");
        s.documents.push({
          id,
          filename: file.name,
          content: text,
          status: "ready",
        });
        audit(s, "document_uploaded", id);
      });
    } else {
      if (!/\.csv$/i.test(file.name))
        throw new Error(
          "The browser demo accepts CSV. XLSX works in the local application.",
        );
      const { columns, rows } = parseCSV(text);
      change((s) => {
        if (s.datasets.length >= 10)
          throw new Error("Demo limit: 10 datasets.");
        s.datasets.push({
          id,
          filename: file.name,
          columns,
          rows,
          row_count: rows.length,
        });
        audit(s, "dataset_uploaded", id);
      });
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
      "This demo supports the three example queries shown below. Run the local app for validated DuckDB SQL.",
    );
  },
  chat(query: string, datasetId?: string): Answer {
    const q = query.toLowerCase();
    const result: Answer = {
      answer: "",
      citations: [],
      trajectory: ["supervisor"],
      conversation_id: "browser",
      mode: "browser-demo",
    };
    const analytical =
      /\b(sales|inventory|restock|revenue|dataset|analy[sz]e|stock)\b/.test(
        q,
      ) || !!datasetId;
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
      const ignored = new Set([
        "what",
        "is",
        "our",
        "the",
        "a",
        "an",
        "for",
        "to",
        "of",
        "and",
        "are",
        "in",
        "how",
        "does",
        "can",
        "you",
        "please",
        "me",
        "it",
        "about",
        "with",
      ]);
      const terms = Array.from(
        new Set(q.match(/[\p{L}\p{N}]+/gu) || []),
      ).filter((w) => !ignored.has(w) && w.length > 1);
      const evidence = state()
        .documents.flatMap((d) => {
          const matches = [...(d.content || "").matchAll(/[\s\S]{1,900}/g)]
            .map((m) => ({
              text: m[0],
              score: terms.filter((t) => m[0].toLowerCase().includes(t)).length,
            }))
            .sort((a, b) => b.score - a.score);
          return matches[0]?.score
            ? [
                {
                  document_id: d.id,
                  filename: d.filename,
                  excerpt: matches[0].text,
                  score: matches[0].score,
                },
              ]
            : [];
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      result.citations = evidence;
      result.trajectory.push("knowledge_agent");
      result.answer = evidence.length
        ? "Relevant source excerpts (browser demo; no language model):\n\n" +
          evidence.map((e, i) => `[${i + 1}] ${e.excerpt}`).join("\n\n")
        : "I do not have sufficient evidence to answer that. Upload a relevant document or try one of the suggested questions.";
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
