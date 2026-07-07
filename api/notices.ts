import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = await getSupabase();
  const { data } = await supabase.from('notices').select('*').limit(1);
  if (!data || !data.length) return res.status(200).json({ notice: null });
  const notice = data[0];
  if (new Date(notice.expires_at) < new Date()) {
    await supabase.from('notices').delete().eq('id', notice.id);
    return res.status(200).json({ notice: null });
  }
  res.status(200).json({ notice: { id: notice.id, message: notice.message, expiresAt: notice.expires_at } });
}
