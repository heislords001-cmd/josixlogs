import { getSupabase, env } from './db';

export interface AuthedUser {
  userId: string;
  email: string;
  name: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Verifies a Supabase-issued JWT sent as `Authorization: Bearer <token>`.
 * Returns the user, or a 401 Response to return immediately.
 */
export async function requireAuth(req: Request): Promise<AuthedUser | Response> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const supabase = getSupabase();
  const { data, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !data?.user) return json({ error: 'Unauthorized' }, 401);

  const u = data.user;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  return {
    userId: u.id,
    email: u.email ?? '',
    name: (meta.full_name as string) || (meta.name as string) || u.email || 'User',
  };
}

export async function requireAdmin(req: Request): Promise<AuthedUser | Response> {
  const result = await requireAuth(req);
  if (result instanceof Response) return result;
  const adminEmail = env('ADMIN_EMAIL');
  if (result.email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
    return json({ error: 'Unauthorized' }, 403);
  }
  return result;
}
