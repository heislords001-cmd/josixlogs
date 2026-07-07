import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './_lib/auth';
import { getSupabase, toLog } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAuth(req, res);
  if (!user) return;
  const supabase = await getSupabase();
  const { data } = await supabase.from('logs').select('*').eq('sold', false);
  res.status(200).json({ logs: (data ?? []).map(toLog) });
}
