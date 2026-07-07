import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth';
import { getSupabase } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const supabase = await getSupabase();

  if (req.method === 'POST') {
    const { message, duration } = req.body as { message: string; duration: number };
    if (!message || !duration) return res.status(400).json({ error: 'Missing fields' });
    const { data: existing } = await supabase.from('notices').select('id');
    if (existing && existing.length > 0) {
      await supabase.from('notices').delete().in('id', existing.map(n => n.id));
    }
    const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
    await supabase.from('notices').insert({ message, duration, expires_at: expiresAt });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { data } = await supabase.from('notices').select('id');
    if (data && data.length > 0) {
      await supabase.from('notices').delete().in('id', data.map(n => n.id));
    }
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
