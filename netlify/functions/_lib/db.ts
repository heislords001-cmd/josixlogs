import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UserRecord {
  id: string;
  userId: string;
  email: string;
  name: string;
  balance: number;
  acctNumber: string;
  acctBank: string;
  joined: string;
  paystackCustomerCode?: string;
}

const MARKUP = 2.5;
const USD_TO_NGN = 1600;

export function calcPrice(usdCost: number): number {
  return Math.ceil((usdCost * USD_TO_NGN * MARKUP) / 50) * 50;
}

function env(key: string): string {
  return (typeof Netlify !== 'undefined' ? Netlify.env.get(key) : process.env[key]) ?? '';
}

let cachedClient: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars');
  cachedClient = createClient(url, key, { auth: { persistSession: false } });
  return cachedClient;
}

export { env };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toUserRecord(row: any): UserRecord {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    balance: Number(row.balance),
    acctNumber: row.acct_number,
    acctBank: row.acct_bank,
    joined: row.joined,
    paystackCustomerCode: row.paystack_customer_code ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toOrder(row: any) {
  return {
    id: row.id, userId: row.user_id, service: row.service, serviceIcon: row.service_icon,
    number: row.number, country: row.country, price: Number(row.price), date: row.date,
    fivesimOrderId: row.fivesim_order_id,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTransaction(row: any) {
  return { id: row.id, userId: row.user_id, type: row.type, desc: row.description, amount: Number(row.amount), date: row.date };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toLog(row: any) {
  return {
    id: row.id, platform: row.platform, domain: row.domain, label: row.label,
    description: row.description, price: Number(row.price), credentials: row.credentials,
    sold: row.sold, soldTo: row.sold_to, soldAt: row.sold_at, uploadedAt: row.uploaded_at,
  };
}

export async function getOrCreateProfile(userId: string, email: string, name: string): Promise<UserRecord> {
  const supabase = getSupabase();
  const { data: existing, error: selErr } = await supabase.from('users').select('*').eq('user_id', userId).limit(1);
  if (selErr) throw new Error(selErr.message);
  if (existing && existing.length > 0) return toUserRecord(existing[0]);

  let acctNumber = '';
  let acctBank = 'Wema Bank';
  let paystackCustomerCode = '';

  try {
    const secretKey = env('PAYSTACK_SECRET_KEY');
    const custRes = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
      }),
    });
    const custData = await custRes.json() as { status: boolean; data?: { customer_code: string } };
    if (custData.status && custData.data) {
      paystackCustomerCode = custData.data.customer_code;
      const dvaRes = await fetch('https://api.paystack.co/dedicated_account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: paystackCustomerCode, preferred_bank: 'wema-bank' }),
      });
      const dvaData = await dvaRes.json() as { status: boolean; data?: { account_number: string; bank: { name: string } } };
      if (dvaData.status && dvaData.data) {
        acctNumber = dvaData.data.account_number;
        acctBank = dvaData.data.bank.name;
      }
    }
  } catch (e) {
    console.error('Paystack DVA error:', e);
  }

  if (!acctNumber) {
    acctNumber = '90' + Math.floor(Math.random() * 1e8).toString().padStart(8, '0');
  }

  const { data: inserted, error: insErr } = await supabase.from('users').insert({
    user_id: userId, email, name, balance: 0, acct_number: acctNumber, acct_bank: acctBank, paystack_customer_code: paystackCustomerCode,
  }).select().single();
  if (insErr || !inserted) throw new Error('Failed to create profile: ' + (insErr?.message ?? 'unknown error'));
  return toUserRecord(inserted);
}

export const COUNTRY_NAMES: Record<string, string> = {
  usa: 'USA', russia: 'Russia', ukraine: 'Ukraine', england: 'UK',
  india: 'India', brazil: 'Brazil', indonesia: 'Indonesia',
  philippines: 'Philippines', nigeria: 'Nigeria', canada: 'Canada',
  australia: 'Australia', germany: 'Germany', france: 'France',
  china: 'China', vietnam: 'Vietnam', thailand: 'Thailand',
  malaysia: 'Malaysia', mexico: 'Mexico', poland: 'Poland',
  sweden: 'Sweden', spain: 'Spain', netherlands: 'Netherlands',
  italy: 'Italy', cambodia: 'Cambodia', myanmar: 'Myanmar',
  kazakhstan: 'Kazakhstan', moldova: 'Moldova', estonia: 'Estonia',
  portugal: 'Portugal', colombia: 'Colombia', egypt: 'Egypt',
};

export async function acquireLock(key: string): Promise<boolean> {
  const supabase = getSupabase();
  const LOCK_TTL_MS = 15000;
  const cutoff = new Date(Date.now() - LOCK_TTL_MS).toISOString();
  await supabase.from('locks').delete().eq('key', key).lt('created_at', cutoff);
  const { data: active } = await supabase.from('locks').select('id').eq('key', key);
  if (active && active.length > 0) return false;
  const { data: inserted, error: insErr } = await supabase.from('locks').insert({ key }).select().single();
  return !insErr && !!inserted;
}

export async function releaseLock(key: string): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('locks').delete().eq('key', key);
}

/**
 * Fixed-window rate limiter backed by Supabase, so it holds across
 * serverless invocations (an in-memory counter would reset per cold start).
 * Returns true if the request is allowed, false if the caller is over limit.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const supabase = getSupabase();
  const now = Date.now();
  const { data: existing } = await supabase.from('rate_limits').select('*').eq('key', key).maybeSingle();

  if (!existing || now - new Date(existing.window_start).getTime() > windowMs) {
    await supabase.from('rate_limits').upsert({ key, window_start: new Date().toISOString(), count: 1 });
    return true;
  }

  if (existing.count >= limit) return false;

  await supabase.from('rate_limits').update({ count: existing.count + 1 }).eq('key', key);
  return true;
}
