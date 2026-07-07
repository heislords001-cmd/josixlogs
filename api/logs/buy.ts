import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth';
import { getSupabase, acquireLock, releaseLock } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAuth(req, res);
  if (!user) return;
  const { userId } = user;
  const { logId } = req.body as { logId: string };
  const supabase = await getSupabase();

  const userLockKey = `user:${userId}`;
  const logLockKey = `log:${logId}`;
  const gotUserLock = await acquireLock(userLockKey);
  if (!gotUserLock) return res.status(429).json({ error: 'Another transaction is already processing for this account. Please try again in a few seconds.' });
  const gotLogLock = await acquireLock(logLockKey);
  if (!gotLogLock) {
    await releaseLock(userLockKey);
    return res.status(429).json({ error: 'This log is currently being purchased by someone else. Please try another.' });
  }

  try {
    const { data: userRows } = await supabase.from('users').select('*').eq('user_id', userId).limit(1);
    if (!userRows || !userRows.length) return res.status(404).json({ error: 'Profile not found' });
    const userRow = userRows[0];

    const { data: logRow } = await supabase.from('logs').select('*').eq('id', logId).single();
    if (!logRow) return res.status(404).json({ error: 'Log not found' });
    if (logRow.sold) return res.status(400).json({ error: 'This log has already been sold' });
    const price = Number(logRow.price);
    if (Number(userRow.balance) < price) return res.status(400).json({ error: 'Insufficient balance' });

    await supabase.from('users').update({ balance: Number(userRow.balance) - price }).eq('id', userRow.id);
    await supabase.from('logs').update({ sold: true, sold_to: userId, sold_at: new Date().toISOString() }).eq('id', logRow.id);
    await supabase.from('orders').insert({ user_id: userId, service: logRow.platform, service_icon: '📁', number: logRow.credentials, country: 'Log', price });
    await supabase.from('transactions').insert({ user_id: userId, type: 'debit', description: `${logRow.platform} log — ${logRow.label}`, amount: price });
    res.status(200).json({ credentials: logRow.credentials });
  } finally {
    await releaseLock(userLockKey);
    await releaseLock(logLockKey);
  }
}
