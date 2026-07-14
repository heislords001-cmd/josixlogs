import type { Config } from '@netlify/functions';
import { requireAdmin, json } from './_lib/auth';
import { getSupabase } from './_lib/db';

export default async (req: Request) => {
  const user = await requireAdmin(req);
  if (user instanceof Response) return user;
  const supabase = getSupabase();

  if (req.method === 'GET') {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    return json({
      tickets: (data ?? []).map(t => ({
        id: t.id, userEmail: t.user_email, topic: t.topic, subject: t.subject,
        message: t.message, status: t.status, createdAt: t.created_at,
      })),
    });
  }

  if (req.method === 'POST') {
    const { id, status } = await req.json() as { id: string; status: string };
    if (!id || !['open', 'resolved'].includes(status)) return json({ error: 'Invalid request' }, 400);
    await supabase.from('support_tickets').update({ status }).eq('id', id);
    return json({ success: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};

export const config: Config = { path: '/api/admin/tickets' };
