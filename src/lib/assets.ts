export function withBasePath(path: string): string {
  const meta = import.meta as ImportMeta & {
    env?: {
      BASE_URL?: string
    }
  }
  const base = meta.env?.BASE_URL ?? process.env.BASE_PATH ?? '/'

  if (/^(?:https?:)?\/\//.test(path)) {
    return path
  }

  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  return `${normalizedBase}${normalizedPath}`
}
