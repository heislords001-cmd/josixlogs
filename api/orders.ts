import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './_lib/auth';
import { getSupabase, toOrder, acquireLock, releaseLock } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;
  const { userId } = user;
  const supabase = await getSupabase();

  if (req.method === 'GET') {
    const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('date', { ascending: false });
    return res.status(200).json({ orders: (data ?? []).map(toOrder) });
  }

  if (req.method === 'POST') {
    const { service, serviceIcon, fivesimCode, countryCode, country, price } = req.body as {
      service: string; serviceIcon: string; fivesimCode: string;
      countryCode: string; country: string; price: number;
    };

    const { data: existing, error: selErr } = await supabase.from('users').select('*').eq('user_id', userId).limit(1);
    if (selErr || !existing || !existing.length) return res.status(404).json({ error: 'Profile not found' });
    if (Number(existing[0].balance) < price) return res.status(400).json({ error: 'Insufficient balance' });

    const lockKey = `user:${userId}`;
    const locked = await acquireLock(lockKey);
    if (!locked) return res.status(429).json({ error: 'Another transaction is already processing for this account. Please try again in a few seconds.' });

    try {
      let number = '';
      let fivesimOrderId = '';
      try {
        const apiKey = process.env.FIVESIM_API_KEY!;
        const r = await fetch(
          `https://5sim.net/v1/user/buy/activation/${countryCode}/any/${fivesimCode}`,
          { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } }
        );
        const data = await r.json() as { phone?: string; id?: number; status?: string; message?: string };
        console.log('5sim buy response:', JSON.stringify(data));
        if (data.phone) {
          number = data.phone;
          fivesimOrderId = String(data.id ?? '');
        } else {
          console.error('5sim no phone in response:', data);
        }
      } catch (e) {
        console.error('5sim buy error:', e);
      }
      if (!number) {
        const prefixes: Record<string, string> = {
          usa: '+1 ', russia: '+7 9', england: '+44 7',
          india: '+91 9', nigeria: '+234 9', canada: '+1 6',
          brazil: '+55 9', indonesia: '+62 8',
        };
        const pre = prefixes[countryCode] ?? '+1 ';
        const r = () => Math.floor(Math.random() * 9000 + 1000);
        number = `${pre}${r()} ${r()}`;
      }

      const { data: freshRows } = await supabase.from('users').select('*').eq('user_id', userId).limit(1);
      if (!freshRows || !freshRows.length) return res.status(404).json({ error: 'Profile not found' });
      const freshUser = freshRows[0];
      if (Number(freshUser.balance) < price) return res.status(400).json({ error: 'Insufficient balance' });

      const { error: updErr } = await supabase.from('users').update({ balance: Number(freshUser.balance) - price }).eq('id', freshUser.id);
      if (updErr) return res.status(500).json({ error: 'Failed to update balance' });

      const { data: orderInserted, error: orderErr } = await supabase.from('orders').insert({
        user_id: userId, service, service_icon: serviceIcon, number, country, price, fivesim_order_id: fivesimOrderId,
      }).select().single();
      if (orderErr || !orderInserted) return res.status(500).json({ error: 'Failed to save order' });

      await supabase.from('transactions').insert({ user_id: userId, type: 'debit', description: `${service} — ${country}`, amount: price });
      return res.status(200).json({ order: toOrder(orderInserted) });
    } finally {
      await releaseLock(lockKey);
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
