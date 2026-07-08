import type { Config } from '@netlify/functions';
import { requireAdmin, json } from './_lib/auth';
import { getSupabase, toLog } from './_lib/db';

export default async (req: Request) => {
  const user = await requireAdmin(req);
  if (user instanceof Response) return user;
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data } = await supabase.from('logs').select('*');
    return json({ logs: (data ?? []).map(toLog) });
  }

  if (req.method === 'POST') {
    const { platform, domain, label, description, price, credentials } = await req.json() as {
      platform: string; domain: string; label: string; description: string; price: number; credentials: string;
    };
    if (!platform || !price || !credentials) return json({ error: 'Missing fields' }, 400);
    await supabase.from('logs').insert({
      platform, domain: domain || platform.toLowerCase() + '.com', label: label || platform,
      description: description || '', price, credentials, sold: false,
    });
    return json({ success: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config: Config = { path: '/api/admin/logs' };
