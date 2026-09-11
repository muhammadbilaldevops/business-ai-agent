"use client";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Analysis } from "@/lib/localops-types";
export function AnalysisResult({ result }: { result: Analysis }) {
  const numeric = result.columns.find((c) =>
    result.rows.some(
      (r) => r[c] !== "" && r[c] !== null && Number.isFinite(Number(r[c])),
    ),
  );
  const label = result.columns.find((c) => c !== numeric);
  return (
    <div className="analysis-result">
      {result.filename && (
        <p className="result-source">
          Source: {result.filename} · {result.rows.length} result rows
        </p>
      )}
      {numeric &&
        label &&
        result.rows.length > 1 &&
        result.rows.length <= 30 && (
          <div
            className="chart"
            role="img"
            aria-label={`${numeric} by ${label}. Exact values are in the table below.`}
          >
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={result.rows.map((r) => ({
                  ...r,
                  [numeric]: Number(r[numeric]),
                }))}
              >
                <CartesianGrid vertical={false} stroke="#e7ece8" />
                <XAxis
                  dataKey={label}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar
                  dataKey={numeric}
                  fill="#397d5c"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      <Table>
        <TableHeader>
          <TableRow>
            {result.columns.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.rows.slice(0, 100).map((r, i) => (
            <TableRow key={i}>
              {result.columns.map((c) => (
                <TableCell key={c}>
                  {r[c] === null ? "—" : String(r[c] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!result.rows.length && (
        <p className="empty-note">No rows match this query.</p>
      )}
    </div>
  );
}
