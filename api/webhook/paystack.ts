import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { getSupabase } from '../_lib/db';

// Paystack signature verification needs the raw request body, so the
// default JSON body-parser is disabled for this route.
export const config = {
  api: { bodyParser: false },
};

function readRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const raw = await readRawBody(req);
    const secretKey = process.env.PAYSTACK_SECRET_KEY!;
    const sig = String(req.headers['x-paystack-signature'] ?? '');
    const hash = crypto.createHmac('sha512', secretKey).update(raw).digest('hex');
    if (hash !== sig) return res.status(401).json({ error: 'Invalid signature' });

    const event = JSON.parse(raw) as { event: string; data: { amount: number; customer: { email: string } } };
    if (event.event !== 'charge.success') return res.status(200).json({ received: true });

    const amountNGN = event.data.amount / 100;
    const emailAddr = event.data.customer.email;
    const supabase = await getSupabase();
    const { data: userRows } = await supabase.from('users').select('*').eq('email', emailAddr).limit(1);
    if (!userRows || !userRows.length) return res.status(200).json({ received: true });
    const userRow = userRows[0];
    await supabase.from('users').update({ balance: Number(userRow.balance) + amountNGN }).eq('id', userRow.id);
    await supabase.from('transactions').insert({ user_id: userRow.user_id, type: 'credit', description: 'Wallet funded via bank transfer', amount: amountNGN });
    res.status(200).json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ error: 'Webhook error' });
  }
}
