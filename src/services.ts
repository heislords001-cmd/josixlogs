export interface Service {
  id: string;
  name: string;
  logo: string; // URL to real brand logo
  category?: string;
  fivesimCode: string;
  badge?: 'HOT' | 'NEW' | 'GOLD' | 'PRO';
}

// Real brand logos from Clearbit / Google favicon CDN
// Use Google's favicon service as primary (more reliable than Clearbit)
const LOGO = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
const FAVICON = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const SERVICES: Service[] = [
  // Messaging
  { id: 'whatsapp', name: 'WhatsApp', logo: LOGO('whatsapp.com'), category: 'Messaging', fivesimCode: 'whatsapp', badge: 'HOT' },
  { id: 'telegram', name: 'Telegram', logo: LOGO('telegram.org'), category: 'Messaging', fivesimCode: 'telegram', badge: 'NEW' },
  { id: 'viber', name: 'Viber', logo: LOGO('viber.com'), category: 'Messaging', fivesimCode: 'viber' },
  { id: 'signal', name: 'Signal', logo: LOGO('signal.org'), category: 'Messaging', fivesimCode: 'signal' },
  { id: 'wechat', name: 'WeChat', logo: LOGO('wechat.com'), category: 'Messaging', fivesimCode: 'wechat' },
  // Social
  { id: 'instagram', name: 'Instagram', logo: LOGO('instagram.com'), category: 'Social', fivesimCode: 'instagram', badge: 'HOT' },
  { id: 'twitter', name: 'Twitter / X', logo: LOGO('x.com'), category: 'Social', fivesimCode: 'twitter' },
  { id: 'facebook', name: 'Facebook', logo: LOGO('facebook.com'), category: 'Social', fivesimCode: 'facebook' },
  { id: 'tiktok', name: 'TikTok', logo: LOGO('tiktok.com'), category: 'Social', fivesimCode: 'tiktok', badge: 'NEW' },
  { id: 'snapchat', name: 'Snapchat', logo: LOGO('snapchat.com'), category: 'Social', fivesimCode: 'snapchat' },
  { id: 'pinterest', name: 'Pinterest', logo: LOGO('pinterest.com'), category: 'Social', fivesimCode: 'pinterest' },
  // Tech
  { id: 'google', name: 'Google', logo: LOGO('google.com'), category: 'Tech', fivesimCode: 'google' },
  { id: 'discord', name: 'Discord', logo: LOGO('discord.com'), category: 'Tech', fivesimCode: 'discord' },
  { id: 'microsoft', name: 'Microsoft', logo: LOGO('microsoft.com'), category: 'Tech', fivesimCode: 'microsoft' },
  { id: 'apple', name: 'Apple', logo: LOGO('apple.com'), category: 'Tech', fivesimCode: 'apple' },
  { id: 'yahoo', name: 'Yahoo', logo: LOGO('yahoo.com'), category: 'Tech', fivesimCode: 'yahoo' },
  // Shopping
  { id: 'amazon', name: 'Amazon', logo: LOGO('amazon.com'), category: 'Shopping', fivesimCode: 'amazon' },
  { id: 'ebay', name: 'eBay', logo: LOGO('ebay.com'), category: 'Shopping', fivesimCode: 'ebay' },
  { id: 'aliexpress', name: 'AliExpress', logo: LOGO('aliexpress.com'), category: 'Shopping', fivesimCode: 'aliexpress' },
  { id: 'shein', name: 'SHEIN', logo: FAVICON('shein.com'), category: 'Shopping', fivesimCode: 'shein' },
  // Finance
  { id: 'paypal', name: 'PayPal', logo: LOGO('paypal.com'), category: 'Finance', fivesimCode: 'paypal', badge: 'PRO' },
  { id: 'cashapp', name: 'Cash App', logo: LOGO('cash.app'), category: 'Finance', fivesimCode: 'cashapp' },
  { id: 'revolut', name: 'Revolut', logo: LOGO('revolut.com'), category: 'Finance', fivesimCode: 'revolut' },
  // Crypto
  { id: 'binance', name: 'Binance', logo: LOGO('binance.com'), category: 'Crypto', fivesimCode: 'binance', badge: 'GOLD' },
  { id: 'coinbase', name: 'Coinbase', logo: LOGO('coinbase.com'), category: 'Crypto', fivesimCode: 'coinbase', badge: 'GOLD' },
  { id: 'okx', name: 'OKX', logo: LOGO('okx.com'), category: 'Crypto', fivesimCode: 'okx' },
  { id: 'bybit', name: 'Bybit', logo: LOGO('bybit.com'), category: 'Crypto', fivesimCode: 'bybit' },
  // Apps
  { id: 'uber', name: 'Uber', logo: LOGO('uber.com'), category: 'Apps', fivesimCode: 'uber' },
  { id: 'airbnb', name: 'Airbnb', logo: LOGO('airbnb.com'), category: 'Apps', fivesimCode: 'airbnb' },
  { id: 'fetchrewards', name: 'Fetch Rewards', logo: FAVICON('fetchrewards.com'), category: 'Apps', fivesimCode: 'fetchrewards' },
  { id: 'aap', name: 'AAP', logo: FAVICON('aap.com.au'), category: 'Apps', fivesimCode: 'aap' },
  // Entertainment
  { id: 'netflix', name: 'Netflix', logo: LOGO('netflix.com'), category: 'Entertainment', fivesimCode: 'netflix' },
  { id: 'spotify', name: 'Spotify', logo: LOGO('spotify.com'), category: 'Entertainment', fivesimCode: 'spotify' },
  { id: 'youtube', name: 'YouTube', logo: LOGO('youtube.com'), category: 'Entertainment', fivesimCode: 'youtube' },
  // Dating
  { id: 'tinder', name: 'Tinder', logo: LOGO('tinder.com'), category: 'Dating', fivesimCode: 'tinder' },
  { id: 'bumble', name: 'Bumble', logo: LOGO('bumble.com'), category: 'Dating', fivesimCode: 'bumble' },
  { id: 'hinge', name: 'Hinge', logo: LOGO('hinge.co'), category: 'Dating', fivesimCode: 'hinge' },
  // Professional
  { id: 'linkedin', name: 'LinkedIn', logo: LOGO('linkedin.com'), category: 'Professional', fivesimCode: 'linkedin', badge: 'PRO' },
  { id: 'indeed', name: 'Indeed', logo: LOGO('indeed.com'), category: 'Professional', fivesimCode: 'indeed' },
];

export const CATEGORIES = ['All', ...Array.from(new Set(SERVICES.map(s => s.category)))];
