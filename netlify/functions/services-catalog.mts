import type { Config } from '@netlify/functions';
import { requireAuth, json } from './_lib/auth';
import { env } from './_lib/db';

function humanize(slug: string): string {
  return slug
    .split(/[_-]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async (req: Request) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  try {
    const apiKey = env('FIVESIM_API_KEY');
    // No product/country filter — 5sim returns its ENTIRE catalog this way,
    // which is what lets us list everything they offer instead of a
    // hand-picked subset.
    const r = await fetch('https://5sim.net/v1/guest/prices', {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    });
    if (!r.ok) {
      console.error('5sim full catalog error:', r.status, await r.text());
      return json({ services: [] });
    }
    const raw = await r.json() as Record<string, Record<string, Record<string, { cost: number; count: number }>>>;

    const services = Object.keys(raw)
      .filter(slug => {
        // Skip products with zero live availability anywhere so the list
        // stays browsable instead of full of dead entries.
        const countries = raw[slug];
        return Object.values(countries).some(ops =>
          Object.values(ops).some(o => o && o.count > 0 && o.cost > 0)
        );
      })
      .sort((a, b) => a.localeCompare(b))
      .map(slug => ({
        id: slug,
        name: humanize(slug),
        fivesimCode: slug,
        logo: `https://www.google.com/s2/favicons?domain=${slug}.com&sz=128`,
      }));

    return json({ services });
  } catch (e) {
    console.error('services-catalog error:', e);
    return json({ services: [] });
  }
};

export const config: Config = { path: '/api/services-catalog' };
