import { NextResponse } from 'next/server';
import { addDetection, getStoredDetections } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const detections = getStoredDetections(limit);
  return NextResponse.json(detections);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = addDetection(body);

    // If FastAPI backend is configured, forward asynchronously
    const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
    if (fastApiUrl) {
      fetch(`${fastApiUrl}/api/detections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch((e) => console.warn('FastAPI forward failed:', e));
    }

    return NextResponse.json({
      status: 'success',
      id: created.id,
      cluster_id: created.cluster_id,
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Invalid detection payload' }, { status: 400 });
  }
}
