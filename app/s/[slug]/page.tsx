// app/s/[slug]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildDestination, absolutize } from '@/lib/urls';

export const dynamic = 'force-dynamic';

async function getLinkOrNull(slug: string) {
  const link = await prisma.link.findUnique({ where: { slug } });
  if (!link) return null;
  if (link.expiresAt && link.expiresAt <= new Date()) return null;
  return link;
}

export async function generateMetadata(
  { params }: { params: { slug?: string } }
): Promise<Metadata> {
  const BASE = process.env.PUBLIC_BASE_URL;
  const raw = typeof params?.slug === 'string' ? params.slug : '';
  if (!BASE || !raw) return {};

  const slug = decodeURIComponent(raw);
  const link = await getLinkOrNull(slug);
  if (!link) return { robots: { index: false, follow: true } };

  const deep = buildDestination(BASE, link.path, link.params as Record<string, unknown>);
  const ogImage = absolutize(BASE, link.imageUrl);

  return {
    metadataBase: new URL(BASE),
    robots: { index: false, follow: true }, // avoid indexing shortlinks
    title: link.title ?? 'Primaku',
    description: link.description ?? 'Open in the Primaku app',
    openGraph: {
      title: link.title ?? 'Primaku',
      description: link.description ?? '',
      images: ogImage ? [ogImage] : [],
      url: deep,
    },
    twitter: {
      card: 'summary_large_image',
      title: link.title ?? 'Primaku',
      description: link.description ?? '',
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function Page({ params }: { params: { slug?: string } }) {
  const BASE = process.env.PUBLIC_BASE_URL;
  const raw = typeof params?.slug === 'string' ? params.slug : '';
  if (!BASE || !raw) notFound();

  const slug = decodeURIComponent(raw);
  const link = await getLinkOrNull(slug);
  if (!link) notFound();

  const deep = buildDestination(BASE, link.path, link.params as Record<string, unknown>);

  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <h1 className="text-xl font-semibold mb-3">
        {link.title ?? 'Open in Primaku'}
      </h1>
      <p className="text-gray-600 mb-6">
        {link.description ?? 'Continue to the content in the app'}
      </p>
      <div className="flex gap-3 justify-center">
        {/* Use tracked redirect */}
        <a className="px-4 py-2 rounded bg-black text-white" href={`/s/${slug}/go`}>Open in app</a>
        <a className="px-4 py-2 rounded border" href="https://apps.apple.com/app/idYOUR_APP_STORE_ID">App Store</a>
        <a className="px-4 py-2 rounded border" href="https://play.google.com/store/apps/details?id=com.primaku.app">Google Play</a>
      </div>
    </main>
  );
}
