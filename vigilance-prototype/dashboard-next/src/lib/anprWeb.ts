// In-Browser License Plate Localization & Recognition Engine (ANPR)

export interface PlateResult {
  plateText: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in percentages (0-100)
  isValidIndian: boolean;
}

const INDIAN_PLATE_REGEX = /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$/;

let plateSession: any = null;
let isPlateSessionLoading = false;
let tesseractWorker: any = null;
let isTesseractLoading = false;

// 1. Initialize License Plate Detector ONNX Session
export async function initPlateDetector(
  modelUrl: string = '/models/plate_detector.onnx'
): Promise<boolean> {
  if (plateSession) return true;
  if (isPlateSessionLoading) return false;
  if (typeof window === 'undefined') return false;

  const ort = (window as any).ort;
  if (!ort) {
    console.warn('[ANPR] ONNX Runtime Web (ort) is not yet loaded.');
    return false;
  }

  try {
    isPlateSessionLoading = true;
    console.log(`[ANPR] Loading license plate detector from: ${modelUrl}`);

    plateSession = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });

    console.log('[ANPR] ✓ License plate detector ONNX loaded successfully!');
    return true;
  } catch (err) {
    console.error('[ANPR] Failed to initialize plate detector session:', err);
    return false;
  } finally {
    isPlateSessionLoading = false;
  }
}

export function isPlateDetectorReady(): boolean {
  return plateSession !== null;
}

// 2. Lazy load Tesseract.js Worker only when Incident / ANPR mode is actively triggered
export async function getTesseractWorker() {
  if (tesseractWorker) return tesseractWorker;
  if (isTesseractLoading) return null;

  try {
    isTesseractLoading = true;
    console.log('[ANPR OCR] Dynamically initializing Tesseract.js engine...');
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      tessedit_pageseg_mode: '7' as any, // Single text line
    });
    tesseractWorker = worker;
    console.log('[ANPR OCR] ✓ Tesseract OCR engine ready.');
    return tesseractWorker;
  } catch (err) {
    console.error('[ANPR OCR] Failed to initialize Tesseract worker:', err);
    return null;
  } finally {
    isTesseractLoading = false;
  }
}

// 3. Detect plates on source video/canvas and perform optical character recognition
export async function detectAndRecognizePlates(
  imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  confThreshold: number = 0.35
): Promise<PlateResult[]> {
  if (!plateSession || typeof window === 'undefined') return [];
  const ort = (window as any).ort;
  if (!ort) return [];

  try {
    const inputSize = 640;
    const canvas = document.createElement('canvas');
    canvas.width = inputSize;
    canvas.height = inputSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

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

    const inputName = plateSession.inputNames[0];
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, inputSize, inputSize]);

    const results = await plateSession.run({ [inputName]: tensor });
    const outputName = plateSession.outputNames[0];
    const outputTensor = results[outputName];

    if (!outputTensor || !outputTensor.data) return [];

    const outData = outputTensor.data as Float32Array;
    const dims = outputTensor.dims; // [1, 5, 8400] for single-class plate detector

    const plateBoxes: Array<{ box: [number, number, number, number]; score: number }> = [];

    if (dims.length === 3 && dims[1] === 5) {
      const numBoxes = dims[2];
      for (let i = 0; i < numBoxes; i++) {
        const score = outData[4 * numBoxes + i];
        if (score >= confThreshold) {
          const cx = outData[0 * numBoxes + i];
          const cy = outData[1 * numBoxes + i];
          const bw = outData[2 * numBoxes + i];
          const bh = outData[3 * numBoxes + i];

          const x1 = Math.max(0, cx - bw / 2);
          const y1 = Math.max(0, cy - bh / 2);
          const x2 = Math.min(inputSize, cx + bw / 2);
          const y2 = Math.min(inputSize, cy + bh / 2);

          if (x2 > x1 && y2 > y1) {
            plateBoxes.push({ box: [x1, y1, x2, y2], score });
          }
        }
      }
    } else if (dims.length === 3 && dims[2] === 5) {
      const numBoxes = dims[1];
      for (let i = 0; i < numBoxes; i++) {
        const offset = i * 5;
        const score = outData[offset + 4];
        if (score >= confThreshold) {
          const cx = outData[offset + 0];
          const cy = outData[offset + 1];
          const bw = outData[offset + 2];
          const bh = outData[offset + 3];

          const x1 = Math.max(0, cx - bw / 2);
          const y1 = Math.max(0, cy - bh / 2);
          const x2 = Math.min(inputSize, cx + bw / 2);
          const y2 = Math.min(inputSize, cy + bh / 2);

          if (x2 > x1 && y2 > y1) {
            plateBoxes.push({ box: [x1, y1, x2, y2], score });
          }
        }
      }
    }

    if (plateBoxes.length === 0) return [];

    // Sort by confidence and take top 2 plates
    plateBoxes.sort((a, b) => b.score - a.score);
    const topPlates = plateBoxes.slice(0, 2);

    const worker = await getTesseractWorker();
    const plateResults: PlateResult[] = [];

    for (const p of topPlates) {
      const [x1, y1, x2, y2] = p.box;
      const cropW = Math.max(10, Math.round(x2 - x1));
      const cropH = Math.max(10, Math.round(y2 - y1));

      // Crop the plate region
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) continue;

      cropCtx.drawImage(canvas, x1, y1, cropW, cropH, 0, 0, cropW, cropH);

      let recognizedText = '';
      if (worker) {
        try {
          const ocrRet = await worker.recognize(cropCanvas);
          recognizedText = (ocrRet?.data?.text || '').replace(/[^A-Z0-9]/g, '').trim();
        } catch (ocrErr) {
          console.warn('[ANPR OCR] OCR frame error:', ocrErr);
        }
      }

      const isValidIndian = INDIAN_PLATE_REGEX.test(recognizedText);

      plateResults.push({
        plateText: recognizedText || 'DETECTED_PLATE',
        confidence: Number(p.score.toFixed(2)),
        bbox: [
          Math.round((x1 / inputSize) * 100),
          Math.round((y1 / inputSize) * 100),
          Math.round((cropW / inputSize) * 100),
          Math.round((cropH / inputSize) * 100),
        ],
        isValidIndian,
      });
    }

    return plateResults;
  } catch (err) {
    console.error('[ANPR] Error in plate detection:', err);
    return [];
  }
}
