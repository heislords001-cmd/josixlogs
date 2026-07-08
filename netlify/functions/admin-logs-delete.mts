import type { Config, Context } from '@netlify/functions';
import { requireAdmin, json } from './_lib/auth';
import { getSupabase } from './_lib/db';

export default async (req: Request, context: Context) => {
  if (req.method !== 'DELETE') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAdmin(req);
  if (user instanceof Response) return user;
  const id = String(context.params.id ?? '');
  const supabase = getSupabase();
  const { data: logRow } = await supabase.from('logs').select('id').eq('id', id).single();
  if (!logRow) return json({ error: 'Log not found' }, 404);
  await supabase.from('logs').delete().eq('id', id);
  return json({ success: true });
};

export const config: Config = { path: '/api/admin/logs/:id' };
