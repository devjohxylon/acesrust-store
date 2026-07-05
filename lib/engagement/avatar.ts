/** Returns true only for absolute http(s) URLs safe to pass to <img src>. */
export function isValidAvatarUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  return url.startsWith('https://') || url.startsWith('http://');
}
