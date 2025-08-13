'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u).then(r => r.json());

type LinkRow = {
  id: string;
  name: string;
  slug: string;
  path: string;
  params: Record<string, string>;
  clicks: number;
  createdAt: string;
};

type LinksResp = { items: LinkRow[]; total?: number };

/** Accepts absolute ("https://...") OR relative ("/path?x=1") URLs. */
function parseLongUrl(longUrl: string) {
  if (!longUrl) return { ok: false as const };
  try {
    if (longUrl.startsWith('/')) {
      const [pathname, query = ''] = longUrl.split('?', 2);
      const params: Record<string, string> = {};
      new URLSearchParams(query).forEach((v, k) => (params[k] = v));
      return { ok: true as const, path: pathname || '/', params };
    }
    const u = new URL(longUrl);
    const params: Record<string, string> = {};
    u.searchParams.forEach((v, k) => (params[k] = v));
    return { ok: true as const, path: u.pathname || '/', params };
  } catch {
    return { ok: false as const };
  }
}

const isValidSlug = (s: string) => /^[A-Za-z0-9._~-]+$/.test(s);

export default function Admin() {
  const { data, mutate, isLoading } = useSWR<LinksResp>('/api/links?page=1&size=10', fetcher);

  // NEW: name (Link Title)
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [longUrl, setLongUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const parsed = useMemo(() => parseLongUrl(longUrl), [longUrl]);

  const shortPreview =
    typeof window !== 'undefined' && slug
      ? `${location.origin}/s/${slug}`
      : slug
      ? `/s/${slug}`
      : '';

  async function onSave() {
    setError(null);
    setOkMsg(null);

    const cleanedSlug = slug.trim().replace(/\s+/g, '-');
    const cleanedName = name.trim();

    if (!cleanedName) return setError('Please provide a Link Title.');
    if (!cleanedSlug) return setError('Please provide a custom ShortLink (slug).');
    if (!isValidSlug(cleanedSlug)) {
      return setError('Slug may only contain letters, numbers, dot, underscore, tilde, and hyphen.');
    }

    const p = parseLongUrl(longUrl);
    if (!p.ok) return setError('Long URL is invalid. Include protocol or start with "/".');

    setSaving(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanedName,     // <-- Link Title
          slug: cleanedSlug,     // <-- ShortLink
          path: p.path,
          params: p.params,
          // you can extend with { title, description, imageUrl, expiresAt } later
        }),
      });

      if (res.status === 409) {
        setError('Slug already exists. Pick another.');
        return;
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `Save failed (${res.status})`);
      }

      setOkMsg('Saved!');
      setName('');
      setSlug('');
      setLongUrl('');
      mutate();
    } catch (e: any) {
      setError(e?.message || 'Failed to save link.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Shortlinks</h1>

      {/* Form: stacked top-to-bottom */}
      <div className="space-y-4 border rounded-xl p-4">
        <div>
          <label className="block text-sm mb-1">Link Title</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. Summer Promo 2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">ShortLink (slug)</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="e.g. promo-aug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-'))}
          />
          {shortPreview && (
            <p className="text-xs text-gray-500 mt-1">
              Preview: <span className="font-mono">{shortPreview}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Actual Long URL (with params)</label>
          <input
            className="border rounded p-2 w-full"
            placeholder="/detail_premium_class?uuid=123"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
          />
          {!longUrl ? null : parsed.ok ? (
            <p className="text-xs text-gray-500 mt-1">
              Path: <span className="font-mono">{parsed.path}</span>{' '}
              {Object.keys(parsed.params).length > 0 && (
                <>
                  • Params:{' '}
                  <span className="font-mono">
                    {new URLSearchParams(parsed.params).toString()}
                  </span>
                </>
              )}
            </p>
          ) : (
            <p className="text-xs text-red-600 mt-1">Invalid URL</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saving || !name || !slug || !parsed.ok}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
          {okMsg && <span className="text-sm text-green-700">{okMsg}</span>}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Title</th>
              <th>Short</th>
              <th>Destination</th>
              <th>Clicks</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="py-3" colSpan={5}>Loading…</td></tr>
            )}
            {data?.items?.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="py-2">{row.name}</td>
                <td className="py-2">
                  {/* If you added /s/[slug]/go for tracked redirects, use that here */}
                  <a className="text-blue-600" href={`/s/${row.slug}/go`} target="_blank" rel="noreferrer">
                    {typeof window !== 'undefined' ? `${location.origin}/s/${row.slug}` : `/s/${row.slug}`}
                  </a>
                </td>
                <td className="max-w-[640px] truncate">
                  <span className="font-mono">
                    {row.path}
                    {Object.keys(row.params || {}).length > 0 && `?${new URLSearchParams(row.params).toString()}`}
                  </span>
                </td>
                <td>{row.clicks}</td>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {!isLoading && !data?.items?.length && (
              <tr><td className="py-3 text-gray-500" colSpan={5}>No links yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
