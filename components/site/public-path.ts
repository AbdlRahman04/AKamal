// Next.js prefixes route links, but public asset URLs need the same build-time prefix.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function publicPath(path: string): string {
  return path.startsWith("/") && !path.startsWith("//") ? `${basePath}${path}` : path;
}
