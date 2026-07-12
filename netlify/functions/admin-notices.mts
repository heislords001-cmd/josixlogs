import type { Config } from '@netlify/functions';
import { requireAdmin, json } from './_lib/auth';
import { getSupabase } from './_lib/db';

export default async (req: Request) => {
  const user = await requireAdmin(req);
  if (user instanceof Response) return user;
  const supabase = getSupabase();

  if (req.method === 'GET') {
    await supabase.from('notices').delete().lt('expires_at', new Date().toISOString());
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    return json({ notices: (data ?? []).map(n => ({ id: n.id, message: n.message, expiresAt: n.expires_at, createdAt: n.created_at })) });
  }

  if (req.method === 'POST') {
    const { message, duration } = await req.json() as { message: string; duration: number };
    if (!message || !duration) return json({ error: 'Missing fields' }, 400);
    // Multiple notices can now be active at once — this just adds a new
    // one instead of replacing whatever's already live.
    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
    await supabase.from('notices').insert({ message, duration, expires_at: expiresAt });
    return json({ success: true });
  }

  if (req.method === 'DELETE') {
    let id: string | undefined;
    try {
      const body = await req.json() as { id?: string };
      id = body?.id;
    } catch { /* no body sent — treated as clear-all below */ }
    if (id) {
      await supabase.from('notices').delete().eq('id', id);
    } else {
      // No id provided — treat as "clear everything", kept for convenience.
      const { data } = await supabase.from('notices').select('id');
      if (data && data.length > 0) await supabase.from('notices').delete().in('id', data.map(n => n.id));
    }
    return json({ success: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config: Config = { path: '/api/admin/notices' };
