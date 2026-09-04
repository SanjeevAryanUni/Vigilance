import { NextResponse } from 'next/server';
import { reclusterDetections } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function POST() {
  const clusters = reclusterDetections();
  return NextResponse.json({
    status: 'success',
    clusters_updated: clusters.length,
    clusters,
  });
}
