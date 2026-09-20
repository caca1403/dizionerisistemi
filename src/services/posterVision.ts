import { setRuntimeStatus } from '../lib/runtimeStatus';
export type PosterVisionResult = {
  labels: Array<{ label: string; confidence: number }>;
  embeddingNorm: number;
  dominantColors: string[];
  visualMood: string;
  lightingContrast: 'Low' | 'Medium' | 'High';
  source: 'mobilenet-v2';
};

type MobileNet = import('@tensorflow-models/mobilenet').MobileNet;
type Tensor = import('@tensorflow/tfjs').Tensor;
type Runtime = { mobilenet: typeof import('@tensorflow-models/mobilenet'); tf: typeof import('@tensorflow/tfjs') };

let runtimePromise: Promise<Runtime> | null = null;
let modelPromise: Promise<MobileNet> | null = null;
const memory = new Map<string, PosterVisionResult>();
const cacheKey = (url: string) => `sera-poster-vision-v1:${url}`;

function loadRuntime() {
  if (!runtimePromise) runtimePromise = Promise.all([import('@tensorflow-models/mobilenet'), import('@tensorflow/tfjs')]).then(([mobilenet, tf]) => ({ mobilenet, tf }));
  return runtimePromise;
}

function loadModel() {
  if (!modelPromise) {
    // The real pretrained MobileNet V2 runtime is requested only when the user opens analysis.
    setRuntimeStatus('vision', 'loading');
    modelPromise = loadRuntime().then(({ mobilenet }) => mobilenet.load({ version: 2, alpha: 0.25 })).then(model => { setRuntimeStatus('vision', 'ready'); return model; }).catch(error => { setRuntimeStatus('vision', 'failed'); modelPromise = null; throw error; });
  }
  return modelPromise;
}

/** Downloads and initializes the real MobileNet V2 graph before poster analysis opens. */
export async function warmPosterVision() {
  await loadModel();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Poster görseli analiz için yüklenemedi.'));
    image.src = src;
  });
}

function palette(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  const edge = 48;
  canvas.width = edge; canvas.height = edge;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return ['#182538', '#53647D', '#A7B6CA'];
  context.drawImage(image, 0, 0, edge, edge);
  const pixels = context.getImageData(0, 0, edge, edge).data;
  const bins = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let index = 0; index < pixels.length; index += 16) {
    const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2], a = pixels[index + 3];
    if (a < 200) continue;
    const key = `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}`;
    const entry = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    entry.count += 1; entry.r += r; entry.g += g; entry.b += b; bins.set(key, entry);
  }
  return [...bins.values()].sort((a, b) => b.count - a.count).slice(0, 3).map(value => {
    const count = Math.max(1, value.count);
    return '#' + [value.r / count, value.g / count, value.b / count].map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('').toUpperCase();
  });
}

function contrast(image: HTMLImageElement): 'Low' | 'Medium' | 'High' {
  const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return 'Medium';
  context.drawImage(image, 0, 0, 32, 32);
  const pixels = context.getImageData(0, 0, 32, 32).data;
  const lightness: number[] = [];
  for (let index = 0; index < pixels.length; index += 16) lightness.push(.2126 * pixels[index] + .7152 * pixels[index + 1] + .0722 * pixels[index + 2]);
  const mean = lightness.reduce((sum, value) => sum + value, 0) / Math.max(1, lightness.length);
  const deviation = Math.sqrt(lightness.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, lightness.length));
  return deviation > 66 ? 'High' : deviation < 34 ? 'Low' : 'Medium';
}

export async function analyzePoster(url: string): Promise<PosterVisionResult> {
  const cached = memory.get(url);
  if (cached) return cached;
  try {
    const disk = localStorage.getItem(cacheKey(url));
    if (disk) { const restored = JSON.parse(disk) as PosterVisionResult; memory.set(url, restored); return restored; }
  } catch { /* Cache is an enhancement. */ }
  const [model, image, runtime] = await Promise.all([loadModel(), loadImage(url), loadRuntime()]);
  const [predictions, tensor] = await Promise.all([model.classify(image, 3), Promise.resolve(model.infer(image, true) as Tensor)]);
  const vector = await tensor.data(); tensor.dispose();
  const embeddingNorm = Math.sqrt(Array.from(vector).reduce((sum, value) => sum + value * value, 0));
  const result: PosterVisionResult = {
    labels: predictions.map(item => ({ label: item.className, confidence: Math.round(item.probability * 100) })),
    embeddingNorm: Math.round(embeddingNorm * 100) / 100,
    dominantColors: palette(image),
    visualMood: predictions[0]?.className || 'Cinematic',
    lightingContrast: contrast(image),
    source: 'mobilenet-v2',
  };
  memory.set(url, result);
  try { localStorage.setItem(cacheKey(url), JSON.stringify(result)); } catch { /* ignore quota */ }
  return result;
}
