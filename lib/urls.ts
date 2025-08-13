// lib/urls.ts
export function buildDestination(base: string, path: string, params?: Record<string, unknown>): string {
  const url =
    path.startsWith('http://') || path.startsWith('https://')
      ? new URL(path)
      : new URL(path, base);

  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v == null ? '' : String(v));
    }
  }
  return url.toString();
}

export function absolutize(base: string, maybeRelative?: string | null): string | undefined {
  if (!maybeRelative) return undefined;
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return undefined;
  }
}
