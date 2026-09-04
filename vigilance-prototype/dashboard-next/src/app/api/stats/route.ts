import { NextResponse } from 'next/server';
import { getStoredStats } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = getStoredStats();
  return NextResponse.json(stats);
}
