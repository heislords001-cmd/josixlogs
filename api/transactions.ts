import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './_lib/auth';
import { getSupabase, toTransaction } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAuth(req, res);
  if (!user) return;
  const supabase = await getSupabase();
  const { data } = await supabase.from('transactions').select('*').eq('user_id', user.userId).order('date', { ascending: false });
  res.status(200).json({ transactions: (data ?? []).map(toTransaction) });
}
