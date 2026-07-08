import type { Config } from '@netlify/functions';

export default async () => new Response(JSON.stringify({ message: 'Success' }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

export const config: Config = { path: '/api/_healthcheck' };
