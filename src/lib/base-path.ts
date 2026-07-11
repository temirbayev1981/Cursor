/** Resolve a public asset path against Vite `BASE_URL` (GitHub Pages subpath deploy). */
export function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const normalized = path.startsWith('/') ? path.slice(1) : path
  if (base === '/') return `/${normalized}`
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}${normalized}`
}
