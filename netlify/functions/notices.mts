import type { Config } from '@netlify/functions';
import { json } from './_lib/auth';
import { getSupabase } from './_lib/db';

export default async (req: Request) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const supabase = getSupabase();
  const { data } = await supabase.from('notices').select('*').limit(1);
  if (!data || !data.length) return json({ notice: null });
  const notice = data[0];
  if (new Date(notice.expires_at) < new Date()) {
    await supabase.from('notices').delete().eq('id', notice.id);
    return json({ notice: null });
  }
  return json({ notice: { id: notice.id, message: notice.message, expiresAt: notice.expires_at } });
};

export const config: Config = { path: '/api/notices' };
