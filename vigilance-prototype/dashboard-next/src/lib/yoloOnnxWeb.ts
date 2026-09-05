// Client-Side YOLOv8 WebAssembly ONNX Runtime Inference Engine

export interface WebYoloDetection {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  w: number; // percentage 0 - 100
  h: number; // percentage 0 - 100
  label: string;
  defect_type: 'D00' | 'D10' | 'D20' | 'D40';
  confidence: number;
  severity: 'critical' | 'high' | 'medium';
}

const CLASS_NAMES: Record<number, { code: 'D00' | 'D10' | 'D20' | 'D40'; name: string }> = {
  0: { code: 'D00', name: 'Longitudinal Crack' },
  1: { code: 'D10', name: 'Transverse Crack' },
  2: { code: 'D20', name: 'Alligator Crack' },
  3: { code: 'D40', name: 'Pothole' },
};

let ortSession: any = null;
let isSessionLoading = false;
let offscreenCanvas: HTMLCanvasElement | null = null;

// Initialize ONNX Web Runtime Session
export async function initOnnxWebSession(
  modelUrl: string = '/models/road_damage_yolov8n_int8.onnx'
): Promise<boolean> {
  if (ortSession) return true;
  if (isSessionLoading) return false;
  if (typeof window === 'undefined') return false;

  const ort = (window as any).ort;
  if (!ort) {
    console.warn('[YOLO Web] ONNX Runtime Web (ort) is not yet loaded.');
    return false;
  }

  try {
    isSessionLoading = true;
    console.log(`[YOLO Web] Loading neural network model from: ${modelUrl}`);

    // Configure WASM paths if available
    if (ort.env && ort.env.wasm) {
      ort.env.wasm.numThreads = Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1));
      ort.env.wasm.simd = true;
    }

    try {
      ortSession = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
    } catch (primaryErr) {
      console.warn(`[YOLO Web] Failed to load INT8 model (${primaryErr}). Trying FP32 fallback...`);
      ortSession = await ort.InferenceSession.create('/models/road_damage_yolov8n.onnx', {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
    }

    console.log('[YOLO Web] ✓ Neural network loaded into browser memory successfully!');
    return true;
  } catch (err) {
    console.error('[YOLO Web] Failed to initialize ONNX session:', err);
    return false;
  } finally {
    isSessionLoading = false;
  }
}

// Check if model is loaded and ready
export function isOnnxWebReady(): boolean {
  return ortSession !== null;
}

// Calculate Intersection over Union (IoU) for NMS
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

// Non-Maximum Suppression (NMS)
function nonMaxSuppression(
  candidates: Array<{ box: [number, number, number, number]; classId: number; score: number }>,
  iouThreshold: number = 0.45
): Array<{ box: [number, number, number, number]; classId: number; score: number }> {
  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  const selected: typeof candidates = [];
  const active = new Array(candidates.length).fill(true);

  for (let i = 0; i < candidates.length; i++) {
    if (!active[i]) continue;
    selected.push(candidates[i]);
    if (selected.length >= 6) break; // Limit to top 6 detections per frame

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

// Run client-side inference on an image/video source
export async function runOnnxWebInference(
  imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  confThreshold: number = 0.25
): Promise<WebYoloDetection[]> {
  if (!ortSession || typeof window === 'undefined') return [];
  const ort = (window as any).ort;
  if (!ort) return [];

  try {
    const inputSize = 640;
    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = inputSize;
      offscreenCanvas.height = inputSize;
    }

    const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    ctx.drawImage(imageSource, 0, 0, inputSize, inputSize);
    const imgData = ctx.getImageData(0, 0, inputSize, inputSize);
    const { data } = imgData;

    // Convert RGBA to Float32Array in CHW (Channels-Height-Width) format normalized to [0.0, 1.0]
    const float32Data = new Float32Array(3 * inputSize * inputSize);
    const pixelCount = inputSize * inputSize;

    for (let i = 0; i < pixelCount; i++) {
      float32Data[i] = data[i * 4] / 255.0; // Red
      float32Data[pixelCount + i] = data[i * 4 + 1] / 255.0; // Green
      float32Data[2 * pixelCount + i] = data[i * 4 + 2] / 255.0; // Blue
    }

    const inputName = ortSession.inputNames[0];
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, inputSize, inputSize]);

    const results = await ortSession.run({ [inputName]: tensor });
    const outputName = ortSession.outputNames[0];
    const outputTensor = results[outputName];

    if (!outputTensor || !outputTensor.data) return [];

    const outData = outputTensor.data as Float32Array;
    const dims = outputTensor.dims; // e.g. [1, 8, 8400]

    const candidates: Array<{ box: [number, number, number, number]; classId: number; score: number }> = [];

    // Format: [1, 8, 8400] (8 features x 8400 anchor boxes)
    if (dims.length === 3 && dims[1] === 8) {
      const numBoxes = dims[2]; // 8400
      for (let i = 0; i < numBoxes; i++) {
        // Find best class score among 4 classes (indices 4, 5, 6, 7)
        let maxScore = 0;
        let maxClass = -1;

        for (let c = 0; c < 4; c++) {
          const score = outData[(4 + c) * numBoxes + i];
          if (score > maxScore) {
            maxScore = score;
            maxClass = c;
          }
        }

        if (maxScore >= confThreshold && maxClass >= 0) {
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
              classId: maxClass,
              score: maxScore,
            });
          }
        }
      }
    } else if (dims.length === 3 && dims[2] === 8) {
      // Format: [1, 8400, 8]
      const numBoxes = dims[1]; // 8400
      for (let i = 0; i < numBoxes; i++) {
        const offset = i * 8;
        let maxScore = 0;
        let maxClass = -1;

        for (let c = 0; c < 4; c++) {
          const score = outData[offset + 4 + c];
          if (score > maxScore) {
            maxScore = score;
            maxClass = c;
          }
        }

        if (maxScore >= confThreshold && maxClass >= 0) {
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
              classId: maxClass,
              score: maxScore,
            });
          }
        }
      }
    }

    // Apply Non-Maximum Suppression
    const nmsResults = nonMaxSuppression(candidates, 0.45);

    // Map to percentage bounding boxes for UI
    return nmsResults.map((item) => {
      const [x1, y1, x2, y2] = item.box;
      const normX = Math.round((x1 / inputSize) * 100);
      const normY = Math.round((y1 / inputSize) * 100);
      const normW = Math.max(5, Math.round(((x2 - x1) / inputSize) * 100));
      const normH = Math.max(4, Math.round(((y2 - y1) / inputSize) * 100));

      const clsMeta = CLASS_NAMES[item.classId] || { code: 'D40', name: 'Road Defect' };
      const defectType = clsMeta.code;

      let severity: 'critical' | 'high' | 'medium' = 'medium';
      if (defectType === 'D40') {
        severity = item.score > 0.45 || normW * normH > 400 ? 'critical' : 'high';
      } else if (defectType === 'D20') {
        severity = item.score > 0.45 ? 'high' : 'medium';
      } else {
        severity = 'medium';
      }

      return {
        x: normX,
        y: normY,
        w: normW,
        h: normH,
        label: `${defectType}: ${clsMeta.name}`,
        defect_type: defectType,
        confidence: Number(item.score.toFixed(2)),
        severity,
      };
    });
  } catch (e) {
    console.error('[YOLO Web] Inference error:', e);
    return [];
  }
}
