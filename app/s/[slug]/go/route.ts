// app/s/[slug]/go/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildDestination } from '@/lib/urls';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const BASE = process.env.PUBLIC_BASE_URL!;
  const link = await prisma.link.findUnique({ where: { slug: params.slug } });
  if (!link || (link.expiresAt && link.expiresAt <= new Date())) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const dest = buildDestination(BASE, link.path, link.params as Record<string, unknown>);

  prisma.link.update({
    where: { slug: params.slug },
    data: { clicks: { increment: 1 } },
  }).catch(() => {});

  return NextResponse.redirect(dest, { status: 302 });
}
