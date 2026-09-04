import { NextResponse } from 'next/server';
import { getStoredClusters } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clusters = getStoredClusters();
  return NextResponse.json(clusters);
}
