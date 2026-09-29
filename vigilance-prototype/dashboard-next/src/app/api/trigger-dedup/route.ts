import { NextResponse } from 'next/server';
import { reclusterDetections } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST() {
  const backendUrl = process.env.FASTAPI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  try {
    const res = await fetch(`${backendUrl}/api/trigger-dedup`, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'vigilance_sih_2026',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback to local store
  }
  const clusters = reclusterDetections();
  return NextResponse.json({
    status: 'success',
    clusters_updated: clusters.length,
    clusters,
  });
}
