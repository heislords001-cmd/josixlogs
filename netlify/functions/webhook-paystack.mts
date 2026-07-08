import type { Config } from '@netlify/functions';
import crypto from 'node:crypto';
import { json } from './_lib/auth';
import { getSupabase, env } from './_lib/db';

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const raw = await req.text();
    const secretKey = env('PAYSTACK_SECRET_KEY');
    const sig = req.headers.get('x-paystack-signature') ?? '';
    const hash = crypto.createHmac('sha512', secretKey).update(raw).digest('hex');
    if (hash !== sig) return json({ error: 'Invalid signature' }, 401);

    const event = JSON.parse(raw) as { event: string; data: { amount: number; customer: { email: string } } };
    if (event.event !== 'charge.success') return json({ received: true });

    const amountNGN = event.data.amount / 100;
    const emailAddr = event.data.customer.email;
    const supabase = getSupabase();
    const { data: userRows } = await supabase.from('users').select('*').eq('email', emailAddr).limit(1);
    if (!userRows || !userRows.length) return json({ received: true });
    const userRow = userRows[0];
    await supabase.from('users').update({ balance: Number(userRow.balance) + amountNGN }).eq('id', userRow.id);
    await supabase.from('transactions').insert({ user_id: userRow.user_id, type: 'credit', description: 'Wallet funded via bank transfer', amount: amountNGN });
    return json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return json({ error: 'Webhook error' }, 500);
  }
};

export const config: Config = { path: '/api/webhook/paystack' };
