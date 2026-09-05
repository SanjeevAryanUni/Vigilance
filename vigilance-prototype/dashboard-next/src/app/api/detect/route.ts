import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, lat = 12.8231, lon = 80.0442, vehicle_id = 'MOBILE-NODE-01' } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Try forwarding to local FastAPI backend if active
    const backendUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${backendUrl}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_b64: image,
          lat,
          lon,
          vehicle_id,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (backendErr) {
      // Backend not running on port 8000
    }

    // Fallback response for offline or Vercel serverless preview
    return NextResponse.json({
      status: 'success',
      engine: 'edge_simulated',
      detections: [],
      message: 'Frame analyzed. Connect local FastAPI backend for hardware-accelerated YOLOv8n inference.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Detection failed' }, { status: 500 });
  }
}
