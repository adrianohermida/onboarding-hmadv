import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const DD_TOKEN = Deno.env.get('DIRECTDATA_TOKEN')!;
const DD_BASE  = 'https://apiv3.directd.com.br/api/CadastroPessoaFisica';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405 });

  // Require authenticated user
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthenticated' }, 401);

  const { cpf } = await req.json();
  const clean = String(cpf ?? '').replace(/\D/g, '');
  if (clean.length !== 11) return json({ error: 'CPF inválido' }, 400);

  if (!DD_TOKEN) return json({ error: 'Token não configurado' }, 500);

  const url = `${DD_BASE}?CPF=${clean}&TOKEN=${DD_TOKEN}`;
  const res  = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) return json({ error: 'DirectData error', status: res.status }, 502);

  const data = await res.json();
  return json(data);
});
