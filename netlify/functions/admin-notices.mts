import type { Config } from '@netlify/functions';
import { requireAdmin, json } from './_lib/auth';
import { getSupabase } from './_lib/db';

export default async (req: Request) => {
  const user = await requireAdmin(req);
  if (user instanceof Response) return user;
  const supabase = getSupabase();

  if (req.method === 'POST') {
    const { message, duration } = await req.json() as { message: string; duration: number };
    if (!message || !duration) return json({ error: 'Missing fields' }, 400);
    const { data: existing } = await supabase.from('notices').select('id');
    if (existing && existing.length > 0) {
      await supabase.from('notices').delete().in('id', existing.map(n => n.id));
    }
    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
    await supabase.from('notices').insert({ message, duration, expires_at: expiresAt });
    return json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { data } = await supabase.from('notices').select('id');
    if (data && data.length > 0) {
      await supabase.from('notices').delete().in('id', data.map(n => n.id));
    }
    return json({ success: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config: Config = { path: '/api/admin/notices' };
