export const basePath = '/master-class';

export function siteUrl(url: string): string {
  if (!url.startsWith('/') || url.startsWith('//') ||
      url === basePath || url.startsWith(`${basePath}/`)) {
    return url;
  }
  return `${basePath}${url}`;
}
