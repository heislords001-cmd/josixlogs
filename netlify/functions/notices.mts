import type { Config } from '@netlify/functions';
import { getSupabase } from './_lib/db';

export default async (req: Request) => {
  if (req.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  const supabase = getSupabase();

  // Clean up anything expired before reading, so neither the toast nor the
  // bell panel ever show a stale notice.
  await supabase.from('notices').delete().lt('expires_at', new Date().toISOString());

  const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
  const all = (data ?? []).map(n => ({ id: n.id, message: n.message, expiresAt: n.expires_at, createdAt: n.created_at }));

  return new Response(JSON.stringify({
    // "latest" is only what the auto-popup toast shows — one at a time,
    // never a stack. "all" is the full active list for the bell panel.
    latest: all[0] ?? null,
    all,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const config: Config = { path: '/api/notices' };
