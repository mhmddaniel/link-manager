import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const link = await prisma.link.findUnique({ where: { slug: params.slug }});
  if (!link) return {};
  const q = new URLSearchParams(link.params as Record<string,string>);
  const deep = `${process.env.PUBLIC_BASE_URL}${link.path}${q.toString() ? `?${q}` : ''}`;
  return {
    metadataBase: new URL(process.env.PUBLIC_BASE_URL!),
    title: link.title ?? 'Primaku',
    description: link.description ?? 'Open in the Primaku app',
    openGraph: { title: link.title ?? 'Primaku', description: link.description ?? '', images: link.imageUrl ? [link.imageUrl] : [], url: deep },
    twitter: { card: 'summary_large_image', title: link.title ?? 'Primaku', description: link.description ?? '', images: link.imageUrl ? [link.imageUrl] : [] }
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const link = await prisma.link.findUnique({ where: { slug: params.slug }});
  if (!link) return notFound();
  const q = new URLSearchParams(link.params as Record<string,string>);
  const deep = `${process.env.PUBLIC_BASE_URL}${link.path}${q.toString() ? `?${q}` : ''}`;

  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <h1 className="text-xl font-semibold mb-3">{link.title ?? 'Open in Primaku'}</h1>
      <p className="text-gray-600 mb-6">{link.description ?? 'Continue to the content in the app'}</p>
      <div className="flex gap-3 justify-center">
        <a className="px-4 py-2 rounded bg-black text-white" href={deep}>Open in app</a>
        <a className="px-4 py-2 rounded border" href="https://apps.apple.com/app/idYOUR_APP_STORE_ID">App Store</a>
        <a className="px-4 py-2 rounded border" href="https://play.google.com/store/apps/details?id=com.primaku.app">Google Play</a>
      </div>
    </main>
  );
}
