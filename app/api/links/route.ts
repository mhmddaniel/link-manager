import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 8);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') ?? '1');
  const size = Math.min(Number(url.searchParams.get('size') ?? '10'), 100);
  const [items, total] = await Promise.all([
    prisma.link.findMany({ skip: (page-1)*size, take: size, orderBy: { createdAt: 'desc' } }),
    prisma.link.count()
  ]);
  return NextResponse.json({ items, total, page, size });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, path, params, title, description, imageUrl, slug: wanted } = body;

  const slug = wanted?.trim() || await (async () => {
    let s; while(true){ s = nanoid(); if(!await prisma.link.findUnique({ where: { slug: s }})) return s; }
  })();

  const link = await prisma.link.create({
    data: { name, slug, path, params: params ?? {}, title, description, imageUrl }
  });

  return NextResponse.json({ link, shortUrl: `${process.env.PUBLIC_BASE_URL}/s/${slug}` }, { status: 201 });
}
