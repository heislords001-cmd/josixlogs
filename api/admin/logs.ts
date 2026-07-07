import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth';
import { getSupabase, toLog } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const supabase = await getSupabase();

  if (req.method === 'GET') {
    const { data } = await supabase.from('logs').select('*');
    return res.status(200).json({ logs: (data ?? []).map(toLog) });
  }

  if (req.method === 'POST') {
    const { platform, domain, label, description, price, credentials } = req.body as {
      platform: string; domain: string; label: string; description: string; price: number; credentials: string;
    };
    if (!platform || !price || !credentials) return res.status(400).json({ error: 'Missing fields' });
    await supabase.from('logs').insert({
      platform, domain: domain || platform.toLowerCase() + '.com', label: label || platform,
      description: description || '', price, credentials, sold: false,
    });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
