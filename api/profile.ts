import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './_lib/auth';
import { getOrCreateProfile } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAuth(req, res);
  if (!user) return;
  try {
    const profile = await getOrCreateProfile(user.userId, user.email, user.name);
    res.status(200).json({ profile });
  } catch (e) {
    console.error('profile error:', e);
    res.status(500).json({ error: 'Failed to load profile' });
  }
}
