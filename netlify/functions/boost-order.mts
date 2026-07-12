import type { Config } from '@netlify/functions';
import { requireAuth, json } from './_lib/auth';
import { getSupabase, acquireLock, releaseLock, checkRateLimit, calcBoostPrice, env } from './_lib/db';

interface ProviderService {
  service: number;
  name: string;
  category: string;
  rate: string;
  min: string;
  max: string;
}

const PROVIDERS: Record<string, { baseUrl: string; keyEnv: string }> = {
  jap: { baseUrl: 'https://justanotherpanel.com/api/v2', keyEnv: 'JAP_API_KEY' },
  peakerr: { baseUrl: 'https://peakerr.com/api/v2', keyEnv: 'PEAKERR_API_KEY' },
};

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAuth(req);
  if (user instanceof Response) return user;
  const { userId } = user;

  const allowed = await checkRateLimit(`boost-order:${userId}`, 15, 10 * 60 * 1000);
  if (!allowed) return json({ error: 'Too many orders too fast — wait a moment and try again.' }, 429);

  const { id, link, quantity } = await req.json() as { id: string; link: string; quantity: number };
  const [providerName, serviceIdStr] = (id ?? '').split(':');
  const provider = PROVIDERS[providerName];
  if (!provider || !serviceIdStr || !link || !quantity || quantity <= 0) {
    return json({ error: 'Invalid request' }, 400);
  }
  const serviceId = Number(serviceIdStr);

  const apiKey = env(provider.keyEnv);
  if (!apiKey) return json({ error: 'This provider is not configured yet.' }, 500);

  const lockKey = `user:${userId}`;
  const locked = await acquireLock(lockKey);
  if (!locked) return json({ error: 'Another transaction is already processing for this account. Please try again in a few seconds.' }, 429);

  try {
    // Re-fetch the live rate ourselves rather than trusting a client-supplied
    // price — this is the same reasoning as the numbers/logs purchase flows.
    const servicesRes = await fetch(provider.baseUrl, {
      method: 'POST',
      body: new URLSearchParams({ key: apiKey, action: 'services' }),
    });
    if (!servicesRes.ok) return json({ error: 'Could not verify pricing right now. Try again shortly.' }, 502);
    const services = await servicesRes.json() as ProviderService[];
    const match = services.find(s => s.service === serviceId);
    if (!match) return json({ error: 'That service is no longer available.' }, 404);

    const min = Number(match.min);
    const max = Number(match.max);
    if (quantity < min || quantity > max) {
      return json({ error: `Quantity must be between ${min} and ${max} for this service.` }, 400);
    }

    const price = calcBoostPrice(Number(match.rate), quantity);

    const supabase = getSupabase();
    const { data: userRows } = await supabase.from('users').select('*').eq('user_id', userId).limit(1);
    if (!userRows || !userRows.length) return json({ error: 'Profile not found' }, 404);
    const userRow = userRows[0];
    if (Number(userRow.balance) < price) return json({ error: 'Insufficient balance' }, 400);

    // Place the order with the provider before touching the wallet, so a
    // failed order never costs the user anything.
    const orderRes = await fetch(provider.baseUrl, {
      method: 'POST',
      body: new URLSearchParams({
        key: apiKey, action: 'add', service: String(serviceId), link, quantity: String(quantity),
      }),
    });
    const orderData = await orderRes.json() as { order?: number; error?: string };
    if (!orderData.order) {
      console.error(`${providerName} order error:`, orderData);
      return json({ error: orderData.error || 'The provider rejected this order.' }, 502);
    }

    await supabase.from('users').update({ balance: Number(userRow.balance) - price }).eq('id', userRow.id);
    await supabase.from('orders').insert({
      user_id: userId,
      service: match.name,
      service_icon: '🚀',
      number: `#${orderData.order} (${providerName.toUpperCase()})`,
      country: 'Boost',
      price,
    });
    await supabase.from('transactions').insert({
      user_id: userId, type: 'debit', description: `Boost — ${match.name} x${quantity}`, amount: price,
    });

    return json({ success: true, orderId: orderData.order, price });
  } finally {
    await releaseLock(lockKey);
  }
};

export const config: Config = { path: '/api/boost/order' };
