import type { Config } from '@netlify/functions';
import { requireAuth, json } from './_lib/auth';
import { getOrCreateProfile } from './_lib/db';

export default async (req: Request) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAuth(req);
  if (user instanceof Response) return user;
  try {
    const profile = await getOrCreateProfile(user.userId, user.email, user.name);
    return json({ profile });
  } catch (e) {
    console.error('profile error:', e);
    return json({ error: 'Failed to load profile' }, 500);
  }
};

export const config: Config = { path: '/api/profile' };
