import test from "node:test";
import assert from "node:assert/strict";
import { demo, parseCSV } from "../../lib/demo.ts";
const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};

test("CSV parser preserves quoted commas, newlines and escaped quotes", () => {
  const result = parseCSV(
    'name,note\n"A, B","Said ""hello"""\nC,"two\nlines"\n',
  );
  assert.deepEqual(result.rows, [
    { name: "A, B", note: 'Said "hello"' },
    { name: "C", note: "two\nlines" },
  ]);
  assert.throws(() => parseCSV("a,a\n1,2"));
  assert.throws(() => parseCSV("a,b\n1,2,3"));
});

test("uploaded content, citations, analytics and approvals work without a model", async () => {
  demo.reset();
  await demo.upload(
    new File(["# Warranty\nThe warranty lasts 42 months."], "warranty.md"),
    "document",
  );
  const answer = demo.chat("What is the warranty?");
  assert.match(answer.answer, /42 months/);
  assert.equal(answer.citations[0].filename, "warranty.md");
  const id = await demo.upload(
    new File(["month,revenue\nMay,100\nMay,50\nJune,60\n"], "custom.csv"),
    "dataset",
  );
  assert.deepEqual(
    demo.query(
      id,
      "SELECT month, SUM(revenue) AS revenue FROM dataset GROUP BY month ORDER BY month",
    ).rows,
    [
      { month: "June", revenue: 60 },
      { month: "May", revenue: 150 },
    ],
  );
  const proposal = demo.chat("Create a follow-up task");
  assert.equal(demo.snapshot().tasks.length, 0);
  demo.decide(proposal.approval.id, true);
  demo.decide(proposal.approval.id, true);
  assert.equal(demo.snapshot().tasks.length, 1);
  const rejected = demo.chat("Create a task for rejection");
  demo.decide(rejected.approval.id, false);
  assert.equal(demo.snapshot().tasks.length, 1);
  assert.equal(demo.messages().length, 6);
});

test("demo refuses unsupported operations and unknown evidence", async () => {
  demo.reset();
  assert.equal(
    demo.chat("What is the interplanetary code?").citations.length,
    0,
  );
  assert.throws(() =>
    demo.query("sales", "SELECT * FROM read_csv('/etc/passwd')"),
  );
  await assert.rejects(
    demo.upload(new File(["pdf content"], "test.pdf"), "document"),
  );
});
