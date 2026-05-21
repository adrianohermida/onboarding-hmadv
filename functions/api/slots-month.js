/**
 * GET /api/slots-month
 * Returns all available slot dates for a given month (query: ?ano=YYYY&mes=MM).
 * Returns a list of dates that have at least one available slot.
 */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const ano = url.searchParams.get('ano') ?? new Date().getFullYear().toString();
  const mes = (url.searchParams.get('mes') ?? String(new Date().getMonth() + 1)).padStart(2, '0');

  const supabaseUrl = (env.SUPABASE_URL ?? '').trim();
  const serviceKey  = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

  if (!supabaseUrl || !serviceKey) {
    return Response.json({ ok: false, error: 'Configuração de ambiente ausente.' }, { status: 500 });
  }

  const inicio = `${ano}-${mes}-01`;
  const lastDay = new Date(Number(ano), Number(mes), 0).getDate();
  const fim = `${ano}-${mes}-${String(lastDay).padStart(2, '0')}`;

  const query = `${supabaseUrl}/rest/v1/re_agenda_slots?select=data&disponivel=eq.true&data=gte.${encodeURIComponent(inicio)}&data=lte.${encodeURIComponent(fim)}&order=data.asc&limit=500`;

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

  const rows = await res.json();
  // Unique dates that have availability
  const datas = [...new Set(rows.map((r) => r.data))];

  return Response.json({ ok: true, datas, mes: `${ano}-${mes}` });
}
