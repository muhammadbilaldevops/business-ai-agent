// Build-only compatibility for containers without /proc. Normal hosts are untouched.
// RSS falls back to the process high-water mark, not a performance measurement.
import process from "node:process";
import { getHeapStatistics } from "node:v8";
const original = process.memoryUsage;
try {
  original();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.warn(
    "Build metrics: /proc unavailable; using V8 heap data and peak RSS.",
  );
  const peak = () => process.resourceUsage().maxRSS * 1024;
  process.memoryUsage = Object.assign(
    () => {
      const h = getHeapStatistics();
      return {
        rss: peak(),
        heapTotal: h.total_heap_size,
        heapUsed: h.used_heap_size,
        external: h.external_memory,
        arrayBuffers: 0,
      };
    },
    { rss: peak },
  );
}
