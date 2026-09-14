/** Local sentence embeddings. Document text never leaves the browser. */
type Encoder = (text: string[], options: { pooling: 'mean'; normalize: true }) => Promise<{ tolist(): number[][] }>;
let encoder: Promise<Encoder> | undefined;
const vectors = new Map<string, number[]>();
export async function semanticScores(question: string, passages: string[], signal?: AbortSignal): Promise<number[]> {
  signal?.throwIfAborted();
  if (!encoder) encoder = (async () => {
    const { pipeline, env } = await import('@huggingface/transformers');
    env.allowLocalModels = false;
    env.backends.onnx.wasm!.numThreads = 1;
    return await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { device: 'wasm', dtype: 'q8' }) as unknown as Encoder;
  })().catch(error => { encoder = undefined; throw error; });
  const encode = await encoder;
  signal?.throwIfAborted();
  // Only cache the current corpus, bounded to avoid retaining removed documents.
  const active = new Set(passages);
  for (const key of vectors.keys()) if (!active.has(key)) vectors.delete(key);
  const missing = [...active].filter(text => !vectors.has(text));
  for (let i = 0; i < missing.length; i += 16) {
    signal?.throwIfAborted();
    const batch = missing.slice(i, i + 16);
    const result = (await encode(batch, { pooling: 'mean', normalize: true })).tolist();
    batch.forEach((text, index) => vectors.set(text, result[index]));
  }
  signal?.throwIfAborted();
  const [query] = (await encode([question], { pooling: 'mean', normalize: true })).tolist();
  signal?.throwIfAborted();
  return passages.map(text => vectors.get(text)!.reduce((sum, value, i) => sum + value * query[i], 0));
}
