import type { Config } from '@netlify/functions';
import { requireAuth, json } from './_lib/auth';
import { env, calcBoostPrice } from './_lib/db';

interface ProviderService {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill?: boolean;
  cancel?: boolean;
}

const PROVIDERS = [
  { name: 'jap', baseUrl: 'https://justanotherpanel.com/api/v2', keyEnv: 'JAP_API_KEY' },
  { name: 'peakerr', baseUrl: 'https://peakerr.com/api/v2', keyEnv: 'PEAKERR_API_KEY' },
] as const;

export default async (req: Request) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const allServices: {
    id: string; provider: string; providerServiceId: number; name: string;
    category: string; ratePerThousandNGN: number; min: number; max: number;
  }[] = [];

  await Promise.all(PROVIDERS.map(async provider => {
    const apiKey = env(provider.keyEnv);
    if (!apiKey) return;
    try {
      const body = new URLSearchParams({ key: apiKey, action: 'services' });
      const r = await fetch(provider.baseUrl, { method: 'POST', body });
      if (!r.ok) {
        console.error(`${provider.name} services error:`, r.status, await r.text());
        return;
      }
      const list = await r.json() as ProviderService[];
      if (!Array.isArray(list)) return;
      for (const s of list) {
        const rate = Number(s.rate);
        if (!rate || rate <= 0) continue;
        allServices.push({
          id: `${provider.name}:${s.service}`,
          provider: provider.name,
          providerServiceId: s.service,
          name: `${s.name}`,
          category: s.category,
          ratePerThousandNGN: calcBoostPrice(rate, 1000),
          min: Number(s.min),
          max: Number(s.max),
        });
      }
    } catch (e) {
      console.error(`${provider.name} catalog fetch error:`, e);
    }
  }));

  allServices.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  return json({ services: allServices });
};

export const config: Config = { path: '/api/boost/catalog' };
