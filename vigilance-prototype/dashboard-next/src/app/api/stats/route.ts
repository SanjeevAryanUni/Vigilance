import { NextResponse } from 'next/server';
import { getStoredStats } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.FASTAPI_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  try {
    const res = await fetch(`${backendUrl}/api/stats`, {
      cache: 'no-store',
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'vigilance_sih_2026',
      },
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: { 'X-Data-Source': 'PostGIS-Live-Stream' },
      });
    }
  } catch {
    // Fallback to local reference
  }
  const stats = getStoredStats();
  return NextResponse.json(stats, {
    headers: { 'X-Data-Source': 'Historical-Benchmark' },
  });
}
