/**
 * GET /api/slots
 * Returns available agenda slots for a given date (query: ?data=YYYY-MM-DD).
 * Reads from re_agenda_slots via Supabase REST.
 */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const data = url.searchParams.get('data');

  const supabaseUrl = (env.SUPABASE_URL ?? '').trim();
  const serviceKey  = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

  if (!supabaseUrl || !serviceKey) {
    return Response.json({ ok: false, error: 'Configuração de ambiente ausente.' }, { status: 500 });
  }

  let query = `${supabaseUrl}/rest/v1/re_agenda_slots?select=id,data,hora,disponivel,tipo,duracao_min&disponivel=eq.true&order=data.asc,hora.asc&limit=50`;
  if (data) query += `&data=eq.${encodeURIComponent(data)}`;

  const res = await fetch(query, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    return Response.json({ ok: false, error: err }, { status: res.status });
  }

  const slots = await res.json();
  return Response.json({ ok: true, slots });
}
