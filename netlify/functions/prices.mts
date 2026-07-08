import type { Config, Context } from '@netlify/functions';
import { requireAuth, json } from './_lib/auth';
import { calcPrice, COUNTRY_NAMES, env } from './_lib/db';

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const service = String(context.params.service ?? '');
  try {
    const apiKey = env('FIVESIM_API_KEY');
    const r = await fetch(`https://5sim.net/v1/guest/prices?product=${service}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    });
    if (!r.ok) {
      console.error('5sim prices error:', r.status, await r.text());
      return json({ prices: [] });
    }
    const raw = await r.json() as Record<string, Record<string, Record<string, { cost: number; count: number }>>>;
    const prices: { country: string; countryCode: string; price: number; available: number }[] = [];
    for (const [, countriesObj] of Object.entries(raw)) {
      for (const [countryCode, operators] of Object.entries(countriesObj)) {
        if (typeof operators !== 'object' || operators === null) continue;
        const countryName = COUNTRY_NAMES[countryCode] ?? (countryCode.charAt(0).toUpperCase() + countryCode.slice(1));
        let bestCost = Infinity;
        let totalCount = 0;
        for (const [, opData] of Object.entries(operators)) {
          if (opData && typeof opData.cost === 'number' && opData.cost > 0) {
            if (opData.cost < bestCost) bestCost = opData.cost;
            totalCount += opData.count ?? 0;
          }
        }
        if (bestCost < Infinity && totalCount > 0) {
          const existing = prices.find(p => p.countryCode === countryCode);
          if (existing) {
            if (bestCost < existing.price) existing.price = calcPrice(bestCost);
            existing.available += totalCount;
          } else {
            prices.push({ country: countryName, countryCode, price: calcPrice(bestCost), available: totalCount });
          }
        }
      }
    }
    prices.sort((a, b) => a.price - b.price);
    return json({ prices: prices.slice(0, 30) });
  } catch (e) {
    console.error('5sim fetch error:', e);
    return json({ prices: [] });
  }
};

export const config: Config = { path: '/api/prices/:service' };
