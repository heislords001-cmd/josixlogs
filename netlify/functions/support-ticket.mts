import type { Config } from '@netlify/functions';
import { requireAuth, json } from './_lib/auth';
import { getSupabase, checkRateLimit } from './_lib/db';

const VALID_TOPICS = ['General', 'Account', 'Payment', 'Logs / Purchase', 'Boosting', 'Refund', 'Technical', 'Other'];

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const allowed = await checkRateLimit(`support-ticket:${user.userId}`, 5, 10 * 60 * 1000);
  if (!allowed) return json({ error: 'Too many reports submitted — wait a bit and try again.' }, 429);

  const { topic, subject, message } = await req.json() as { topic: string; subject: string; message: string };
  if (!VALID_TOPICS.includes(topic)) return json({ error: 'Invalid topic' }, 400);
  if (!subject?.trim() || !message?.trim() || message.trim().length < 15) {
    return json({ error: 'Fill in a subject and at least 15 characters describing the issue.' }, 400);
  }

  const supabase = getSupabase();
  const { error: insErr } = await supabase.from('support_tickets').insert({
    user_id: user.userId,
    user_email: user.email,
    topic,
    subject: subject.trim().slice(0, 200),
    message: message.trim().slice(0, 3000),
  });
  if (insErr) return json({ error: 'Failed to submit — try again shortly.' }, 500);

  return json({ success: true });
};

export const config: Config = { path: '/api/support-ticket' };
