import type { Config } from '@netlify/functions';
import { requireAuth, json } from './_lib/auth';
import { getSupabase, toTransaction } from './_lib/db';

export default async (req: Request) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAuth(req);
  if (user instanceof Response) return user;
  const supabase = getSupabase();
  const { data } = await supabase.from('transactions').select('*').eq('user_id', user.userId).order('date', { ascending: false });
  return json({ transactions: (data ?? []).map(toTransaction) });
};

export const config: Config = { path: '/api/transactions' };
