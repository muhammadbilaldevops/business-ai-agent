type Progress = (text: string) => void;
type Transcriber = (audio: Float32Array, options: Record<string, unknown>) => Promise<{ text: string } | { text: string }[]>;
let model: Promise<Transcriber> | undefined;
async function getModel(progress?: Progress) {
  if (!model) model = (async () => {
    const { pipeline, env } = await import('@huggingface/transformers');
    env.allowLocalModels = false;
    env.backends.onnx.wasm!.numThreads = 1;
    return await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny.en', {
      device: 'wasm', dtype: 'q8',
      progress_callback: (event: { status: string; progress?: number }) => {
        if (event.status === 'progress') progress?.('Downloading speech model… ' + Math.round(event.progress || 0) + '%');
      },
    }) as unknown as Transcriber;
  })().catch(error => { model = undefined; throw error; });
  return model;
}
export async function transcribeAudio(blob: Blob, progress?: Progress): Promise<string> {
  const context = new AudioContext();
  let decoded: AudioBuffer;
  try { decoded = await context.decodeAudioData(await blob.arrayBuffer()); }
  finally { await context.close(); }
  if (decoded.duration > 65) throw new Error('Please use a recording of one minute or less.');
  if (decoded.duration < 0.5) throw new Error('Recording is too short. Please speak for a few seconds.');
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const source = offline.createBufferSource(); source.buffer = decoded; source.connect(offline.destination); source.start();
  const samples = (await offline.startRendering()).getChannelData(0);
  const energy = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
  if (energy < 0.001) throw new Error('No speech detected. Check your microphone and try again.');
  progress?.('Preparing speech model… First use requires a download.');
  const transcriber = await getModel(progress);
  progress?.('Transcribing your recording…');
  const result = await transcriber(samples, { chunk_length_s: 30, stride_length_s: 5 });
  const text = (Array.isArray(result) ? result.map(r => r.text).join(' ') : result.text).trim();
  if (!text) throw new Error('No speech detected. Please try again.');
  return text;
}
