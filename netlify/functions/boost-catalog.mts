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
  { name: 'jap', server: 'Server 1', baseUrl: 'https://justanotherpanel.com/api/v2', keyEnv: 'JAP_API_KEY' },
  { name: 'peakerr', server: 'Server 2', baseUrl: 'https://peakerr.com/api/v2', keyEnv: 'PEAKERR_API_KEY' },
] as const;

// Ordered so more specific matches (Twitter/X before generic "X") win first.
const PLATFORM_KEYWORDS: { platform: string; keywords: string[] }[] = [
  { platform: 'Instagram', keywords: ['instagram', 'insta ig', ' ig '] },
  { platform: 'TikTok', keywords: ['tiktok', 'tik tok'] },
  { platform: 'Facebook', keywords: ['facebook', ' fb '] },
  { platform: 'Twitter / X', keywords: ['twitter', ' x.com', ' x -', '(x)'] },
  { platform: 'YouTube', keywords: ['youtube', ' yt '] },
  { platform: 'Telegram', keywords: ['telegram'] },
  { platform: 'Spotify', keywords: ['spotify'] },
  { platform: 'Snapchat', keywords: ['snapchat', 'snap chat'] },
  { platform: 'Discord', keywords: ['discord'] },
  { platform: 'LinkedIn', keywords: ['linkedin'] },
  { platform: 'Pinterest', keywords: ['pinterest'] },
  { platform: 'Twitch', keywords: ['twitch'] },
  { platform: 'Reddit', keywords: ['reddit'] },
  { platform: 'WhatsApp', keywords: ['whatsapp'] },
];

function detectPlatform(category: string, name: string): string {
  const haystack = ` ${category.toLowerCase()} ${name.toLowerCase()} `;
  for (const { platform, keywords } of PLATFORM_KEYWORDS) {
    if (keywords.some(k => haystack.includes(k))) return platform;
  }
  return 'Other';
}

export default async (req: Request) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const allServices: {
    id: string; provider: string; server: string; providerServiceId: number; name: string;
    category: string; platform: string; ratePerThousandNGN: number; min: number; max: number;
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
          server: provider.server,
          providerServiceId: s.service,
          name: `${s.name}`,
          category: s.category,
          platform: detectPlatform(s.category, s.name),
          ratePerThousandNGN: calcBoostPrice(rate, 1000),
          min: Number(s.min),
          max: Number(s.max),
        });
      }
    } catch (e) {
      console.error(`${provider.name} catalog fetch error:`, e);
    }
  }));

  allServices.sort((a, b) => a.platform.localeCompare(b.platform) || a.name.localeCompare(b.name));
  return json({ services: allServices });
};

export const config: Config = { path: '/api/boost/catalog' };
