/**
 * POST /api/confirmar
 * Confirms a pending appointment.
 * Body: { agendamento_id, token? }
 */
export async function onRequestPost({ request, env }) {
  const supabaseUrl = (env.SUPABASE_URL ?? '').trim();
  const serviceKey  = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

  if (!supabaseUrl || !serviceKey) {
    return Response.json({ ok: false, error: 'Configuração de ambiente ausente.' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const { agendamento_id } = body ?? {};
  if (!agendamento_id) {
    return Response.json({ ok: false, error: 'Campo obrigatório: agendamento_id.' }, { status: 400 });
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/re_agendamentos?id=eq.${encodeURIComponent(agendamento_id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ status: 'confirmado', confirmado_em: new Date().toISOString() }),
    },
  );

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    return Response.json({ ok: false, error: err }, { status: res.status });
  }

  const data = await res.json().catch(() => ({}));
  const record = Array.isArray(data) ? data[0] : data;

  return Response.json({ ok: true, agendamento: record });
}
