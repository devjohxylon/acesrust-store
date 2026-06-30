export type CmsBackend = 'blob' | 'file' | 'memory';
export type AdminAuthMode = 'password' | 'none';

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? process.env.LOCAL_ADMIN_PASSWORD ?? '';
}

/**
 * Where leaderboard + wipe data is persisted.
 * - blob: Vercel Blob (production, no database needed)
 * - file: local .data/cms.json (dev only)
 * - memory: ephemeral fallback (per-instance, not persistent)
 */
export function getCmsBackend(): CmsBackend {
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob';
  if (process.env.NODE_ENV === 'development' && process.env.LOCAL_CMS === 'true') {
    return 'file';
  }
  return 'memory';
}

export function getAdminAuthMode(): AdminAuthMode {
  return getAdminPassword() ? 'password' : 'none';
}
