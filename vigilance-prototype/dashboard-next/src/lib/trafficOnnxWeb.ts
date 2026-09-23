// Client-Side COCO YOLOv8 WebAssembly ONNX Runtime Inference Engine (Vehicles & Pedestrians)

export type TrafficDensity = 'free_flow' | 'light' | 'moderate' | 'heavy' | 'gridlock';

export interface TrafficDetection {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  w: number; // percentage 0 - 100
  h: number; // percentage 0 - 100
  label: string;
  category: 'vehicle' | 'pedestrian';
  classId: number;
  confidence: number;
}

export interface TrafficAnalysisResult {
  vehicleCount: number;
  pedestrianCount: number;
  vehicles: TrafficDetection[];
  pedestrians: TrafficDetection[];
  density: TrafficDensity;
}

// Relevant COCO classes to filter
const TARGET_CLASSES: Record<number, { name: string; category: 'vehicle' | 'pedestrian' }> = {
  0: { name: 'Pedestrian', category: 'pedestrian' },
  1: { name: 'Bicycle', category: 'vehicle' },
  2: { name: 'Car', category: 'vehicle' },
  3: { name: 'Motorcycle', category: 'vehicle' },
  5: { name: 'Bus', category: 'vehicle' },
  7: { name: 'Truck', category: 'vehicle' },
};

let cocoSession: any = null;
let isSessionLoading = false;
let offscreenCanvas: HTMLCanvasElement | null = null;

export async function initTrafficOnnxSession(
  modelUrl: string = '/models/yolov8n_coco.onnx'
): Promise<boolean> {
  if (cocoSession) return true;
  if (isSessionLoading) return false;
  if (typeof window === 'undefined') return false;

  const ort = (window as any).ort;
  if (!ort) {
    console.warn('[Traffic Web] ONNX Runtime Web (ort) is not yet loaded.');
    return false;
  }

  try {
    isSessionLoading = true;
    console.log(`[Traffic Web] Loading COCO traffic neural network from: ${modelUrl}`);

    if (ort.env && ort.env.wasm) {
      ort.env.wasm.numThreads = Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1));
      ort.env.wasm.simd = true;
    }

    cocoSession = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });

    console.log('[Traffic Web] ✓ COCO Traffic model loaded into browser memory successfully!');
    return true;
  } catch (err) {
    console.error('[Traffic Web] Failed to initialize COCO session:', err);
    return false;
  } finally {
    isSessionLoading = false;
  }
}

export function isTrafficOnnxReady(): boolean {
  return cocoSession !== null;
}

export function calculateDensity(vehicleCount: number): TrafficDensity {
  if (vehicleCount <= 1) return 'free_flow';
  if (vehicleCount <= 4) return 'light';
  if (vehicleCount <= 9) return 'moderate';
  if (vehicleCount <= 14) return 'heavy';
  return 'gridlock';
}

function calculateIoU(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
  const [x1A, y1A, x2A, y2A] = boxA;
  const [x1B, y1B, x2B, y2B] = boxB;

  const xLeft = Math.max(x1A, x1B);
  const yTop = Math.max(y1A, y1B);
  const xRight = Math.min(x2A, x2B);
  const yBottom = Math.min(y2A, y2B);

  if (xRight < xLeft || yBottom < yTop) return 0.0;

  const intersection = (xRight - xLeft) * (yBottom - yTop);
  const areaA = (x2A - x1A) * (y2A - y1A);
  const areaB = (x2B - x1B) * (y2B - y1B);
  const union = areaA + areaB - intersection;

  return union > 0 ? intersection / union : 0.0;
}

function nonMaxSuppression(
  candidates: Array<{ box: [number, number, number, number]; classId: number; score: number }>,
  iouThreshold: number = 0.45
): Array<{ box: [number, number, number, number]; classId: number; score: number }> {
  candidates.sort((a, b) => b.score - a.score);

  const selected: typeof candidates = [];
  const active = new Array(candidates.length).fill(true);

  for (let i = 0; i < candidates.length; i++) {
    if (!active[i]) continue;
    selected.push(candidates[i]);
    if (selected.length >= 20) break; // Allow up to 20 road entities

    for (let j = i + 1; j < candidates.length; j++) {
      if (!active[j]) continue;
      const iou = calculateIoU(candidates[i].box, candidates[j].box);
      if (iou > iouThreshold) {
        active[j] = false;
      }
    }
  }

  return selected;
}

export async function runTrafficOnnxInference(
  imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  confThreshold: number = 0.28
): Promise<TrafficAnalysisResult> {
  const emptyResult: TrafficAnalysisResult = {
    vehicleCount: 0,
    pedestrianCount: 0,
    vehicles: [],
    pedestrians: [],
    density: 'free_flow',
  };

  if (!cocoSession || typeof window === 'undefined') return emptyResult;
  const ort = (window as any).ort;
  if (!ort) return emptyResult;

  try {
    const inputSize = 640;
    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = inputSize;
      offscreenCanvas.height = inputSize;
    }

    const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return emptyResult;

    ctx.drawImage(imageSource, 0, 0, inputSize, inputSize);
    const imgData = ctx.getImageData(0, 0, inputSize, inputSize);
    const { data } = imgData;

    const float32Data = new Float32Array(3 * inputSize * inputSize);
    const pixelCount = inputSize * inputSize;

    for (let i = 0; i < pixelCount; i++) {
      float32Data[i] = data[i * 4] / 255.0;
      float32Data[pixelCount + i] = data[i * 4 + 1] / 255.0;
      float32Data[2 * pixelCount + i] = data[i * 4 + 2] / 255.0;
    }

    const inputName = cocoSession.inputNames[0];
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, inputSize, inputSize]);

    const results = await cocoSession.run({ [inputName]: tensor });
    const outputName = cocoSession.outputNames[0];
    const outputTensor = results[outputName];

    if (!outputTensor || !outputTensor.data) return emptyResult;

    const outData = outputTensor.data as Float32Array;
    const dims = outputTensor.dims; // [1, 84, 8400] for COCO (4 box coords + 80 class scores)

    const candidates: Array<{ box: [number, number, number, number]; classId: number; score: number }> = [];

    if (dims.length === 3 && dims[1] === 84) {
      const numBoxes = dims[2]; // 8400
      for (let i = 0; i < numBoxes; i++) {
        // Check only target classes: 0 (person), 1 (bicycle), 2 (car), 3 (motorcycle), 5 (bus), 7 (truck)
        let maxScore = 0;
        let bestTargetClass = -1;

        for (const classIdStr of Object.keys(TARGET_CLASSES)) {
          const c = Number(classIdStr);
          const score = outData[(4 + c) * numBoxes + i];
          if (score > maxScore) {
            maxScore = score;
            bestTargetClass = c;
          }
        }

        if (maxScore >= confThreshold && bestTargetClass >= 0) {
          const cx = outData[0 * numBoxes + i];
          const cy = outData[1 * numBoxes + i];
          const bw = outData[2 * numBoxes + i];
          const bh = outData[3 * numBoxes + i];

          const x1 = Math.max(0, cx - bw / 2);
          const y1 = Math.max(0, cy - bh / 2);
          const x2 = Math.min(inputSize, cx + bw / 2);
          const y2 = Math.min(inputSize, cy + bh / 2);

          if (x2 > x1 && y2 > y1) {
            candidates.push({
              box: [x1, y1, x2, y2],
              classId: bestTargetClass,
              score: maxScore,
            });
          }
        }
      }
    } else if (dims.length === 3 && dims[2] === 84) {
      // Shape [1, 8400, 84]
      const numBoxes = dims[1];
      for (let i = 0; i < numBoxes; i++) {
        const offset = i * 84;
        let maxScore = 0;
        let bestTargetClass = -1;

        for (const classIdStr of Object.keys(TARGET_CLASSES)) {
          const c = Number(classIdStr);
          const score = outData[offset + 4 + c];
          if (score > maxScore) {
            maxScore = score;
            bestTargetClass = c;
          }
        }

        if (maxScore >= confThreshold && bestTargetClass >= 0) {
          const cx = outData[offset + 0];
          const cy = outData[offset + 1];
          const bw = outData[offset + 2];
          const bh = outData[offset + 3];

          const x1 = Math.max(0, cx - bw / 2);
          const y1 = Math.max(0, cy - bh / 2);
          const x2 = Math.min(inputSize, cx + bw / 2);
          const y2 = Math.min(inputSize, cy + bh / 2);

          if (x2 > x1 && y2 > y1) {
            candidates.push({
              box: [x1, y1, x2, y2],
              classId: bestTargetClass,
              score: maxScore,
            });
          }
        }
      }
    }

    const nmsResults = nonMaxSuppression(candidates, 0.45);

    const vehicles: TrafficDetection[] = [];
    const pedestrians: TrafficDetection[] = [];

    for (const item of nmsResults) {
      const [x1, y1, x2, y2] = item.box;
      const meta = TARGET_CLASSES[item.classId];
      if (!meta) continue;

      const detection: TrafficDetection = {
        x: Math.round((x1 / inputSize) * 100),
        y: Math.round((y1 / inputSize) * 100),
        w: Math.max(4, Math.round(((x2 - x1) / inputSize) * 100)),
        h: Math.max(4, Math.round(((y2 - y1) / inputSize) * 100)),
        label: `${meta.name} (${Math.round(item.score * 100)}%)`,
        category: meta.category,
        classId: item.classId,
        confidence: Number(item.score.toFixed(2)),
      };

      if (meta.category === 'vehicle') {
        vehicles.push(detection);
      } else {
        pedestrians.push(detection);
      }
    }

    const density = calculateDensity(vehicles.length);

    return {
      vehicleCount: vehicles.length,
      pedestrianCount: pedestrians.length,
      vehicles,
      pedestrians,
      density,
    };
  } catch (err) {
    console.error('[Traffic Web] Inference error:', err);
    return emptyResult;
  }
}
