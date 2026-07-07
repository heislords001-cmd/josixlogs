import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './db';

export interface AuthedUser {
  userId: string;
  email: string;
  name: string;
}

/**
 * Verifies a Supabase-issued JWT sent as `Authorization: Bearer <token>`.
 * Returns the user, or writes a 401 response and returns null.
 *
 * This replaces AppDeploy's requireAuth() — on Vercel there's no restriction
 * on custom headers, so the token travels the normal way instead of being
 * smuggled through a query param / body field.
 */
export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<AuthedUser | null> {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const supabase = await getSupabase();
  const { data, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !data?.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  const u = data.user;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  return {
    userId: u.id,
    email: u.email ?? '',
    name: (meta.full_name as string) || (meta.name as string) || u.email || 'User',
  };
}

export async function requireAdmin(req: VercelRequest, res: VercelResponse): Promise<AuthedUser | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;
  const adminEmail = process.env.ADMIN_EMAIL ?? '';
  if (user.email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
    res.status(403).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}
