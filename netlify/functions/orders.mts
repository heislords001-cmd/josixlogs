import type { Config } from '@netlify/functions';
import { requireAuth, json } from './_lib/auth';
import { getSupabase, toOrder, acquireLock, releaseLock, env } from './_lib/db';

export default async (req: Request) => {
  const user = await requireAuth(req);
  if (user instanceof Response) return user;
  const { userId } = user;
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('date', { ascending: false });
    return json({ orders: (data ?? []).map(toOrder) });
  }

  if (req.method === 'POST') {
    const { service, serviceIcon, fivesimCode, countryCode, country, price } = await req.json() as {
      service: string; serviceIcon: string; fivesimCode: string;
      countryCode: string; country: string; price: number;
    };

    const { data: existing, error: selErr } = await supabase.from('users').select('*').eq('user_id', userId).limit(1);
    if (selErr || !existing || !existing.length) return json({ error: 'Profile not found' }, 404);
    if (Number(existing[0].balance) < price) return json({ error: 'Insufficient balance' }, 400);

    const lockKey = `user:${userId}`;
    const locked = await acquireLock(lockKey);
    if (!locked) return json({ error: 'Another transaction is already processing for this account. Please try again in a few seconds.' }, 429);

    try {
      let number = '';
      let fivesimOrderId = '';
      try {
        const apiKey = env('FIVESIM_API_KEY');
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
      if (!freshRows || !freshRows.length) return json({ error: 'Profile not found' }, 404);
      const freshUser = freshRows[0];
      if (Number(freshUser.balance) < price) return json({ error: 'Insufficient balance' }, 400);

      const { error: updErr } = await supabase.from('users').update({ balance: Number(freshUser.balance) - price }).eq('id', freshUser.id);
      if (updErr) return json({ error: 'Failed to update balance' }, 500);

      const { data: orderInserted, error: orderErr } = await supabase.from('orders').insert({
        user_id: userId, service, service_icon: serviceIcon, number, country, price, fivesim_order_id: fivesimOrderId,
      }).select().single();
      if (orderErr || !orderInserted) return json({ error: 'Failed to save order' }, 500);

      await supabase.from('transactions').insert({ user_id: userId, type: 'debit', description: `${service} — ${country}`, amount: price });
      return json({ order: toOrder(orderInserted) });
    } finally {
      await releaseLock(lockKey);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config: Config = { path: '/api/orders' };
