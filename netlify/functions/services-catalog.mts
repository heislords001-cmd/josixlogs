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
    // With no filters, 5sim's shape is {country: {product: {operator: {...}}}} —
    // the OPPOSITE nesting from the product-filtered endpoint we use in
    // prices.mts, which returns {product: {country: {operator}}}. Products
    // live one level deeper here, not at the top.
    const r = await fetch('https://5sim.net/v1/guest/prices', {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    });
    if (!r.ok) {
      console.error('5sim full catalog error:', r.status, await r.text());
      return json({ services: [] });
    }
    const raw = await r.json() as Record<string, Record<string, Record<string, { cost: number; count: number }>>>;

    const availability = new Map<string, boolean>();
    for (const country of Object.keys(raw)) {
      const products = raw[country];
      for (const product of Object.keys(products)) {
        const operators = products[product];
        const hasStock = Object.values(operators).some(o => o && o.count > 0 && o.cost > 0);
        availability.set(product, (availability.get(product) ?? false) || hasStock);
      }
    }

    const services = Array.from(availability.entries())
      .filter(([, available]) => available)
      .map(([slug]) => slug)
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
