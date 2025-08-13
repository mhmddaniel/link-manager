import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (typeof slug !== 'string' || !slug) return NextResponse.json({}, { status: 204 });
    await prisma.link.update({ where: { slug }, data: { clicks: { increment: 1 } } });
    return NextResponse.json({}, { status: 204 });
  } catch {
    return NextResponse.json({}, { status: 204 });
  }
}
