import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../_lib/auth';
import { getSupabase } from '../../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAdmin(req, res);
  if (!user) return;
  const id = String(req.query.id ?? '');
  const supabase = await getSupabase();
  const { data: logRow } = await supabase.from('logs').select('id').eq('id', id).single();
  if (!logRow) return res.status(404).json({ error: 'Log not found' });
  await supabase.from('logs').delete().eq('id', id);
  res.status(200).json({ success: true });
}
