import type { Config } from '@netlify/functions';
import { requireAuth, json } from './_lib/auth';
import { getSupabase, acquireLock, releaseLock } from './_lib/db';

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAuth(req);
  if (user instanceof Response) return user;
  const { userId } = user;
  const { logId } = await req.json() as { logId: string };
  const supabase = getSupabase();

  const userLockKey = `user:${userId}`;
  const logLockKey = `log:${logId}`;
  const gotUserLock = await acquireLock(userLockKey);
  if (!gotUserLock) return json({ error: 'Another transaction is already processing for this account. Please try again in a few seconds.' }, 429);
  const gotLogLock = await acquireLock(logLockKey);
  if (!gotLogLock) {
    await releaseLock(userLockKey);
    return json({ error: 'This log is currently being purchased by someone else. Please try another.' }, 429);
  }

  try {
    const { data: userRows } = await supabase.from('users').select('*').eq('user_id', userId).limit(1);
    if (!userRows || !userRows.length) return json({ error: 'Profile not found' }, 404);
    const userRow = userRows[0];

    const { data: logRow } = await supabase.from('logs').select('*').eq('id', logId).single();
    if (!logRow) return json({ error: 'Log not found' }, 404);
    if (logRow.sold) return json({ error: 'This log has already been sold' }, 400);
    const price = Number(logRow.price);
    if (Number(userRow.balance) < price) return json({ error: 'Insufficient balance' }, 400);

    await supabase.from('users').update({ balance: Number(userRow.balance) - price }).eq('id', userRow.id);
    await supabase.from('logs').update({ sold: true, sold_to: userId, sold_at: new Date().toISOString() }).eq('id', logRow.id);
    await supabase.from('orders').insert({ user_id: userId, service: logRow.platform, service_icon: '📁', number: logRow.credentials, country: 'Log', price });
    await supabase.from('transactions').insert({ user_id: userId, type: 'debit', description: `${logRow.platform} log — ${logRow.label}`, amount: price });
    return json({ credentials: logRow.credentials });
  } finally {
    await releaseLock(userLockKey);
    await releaseLock(logLockKey);
  }
};

export const config: Config = { path: '/api/logs/buy' };
