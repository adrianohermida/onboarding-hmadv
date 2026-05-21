/**
 * POST /api/cancelar
 * Cancels an appointment and re-opens the slot.
 * Body: { agendamento_id, motivo? }
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

  const { agendamento_id, motivo } = body ?? {};
  if (!agendamento_id) {
    return Response.json({ ok: false, error: 'Campo obrigatório: agendamento_id.' }, { status: 400 });
  }

  // Get slot_id to re-open it
  const getRes = await fetch(
    `${supabaseUrl}/rest/v1/re_agendamentos?id=eq.${encodeURIComponent(agendamento_id)}&select=id,slot_id,status`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  const rows = await getRes.json().catch(() => []);
  const agendamento = Array.isArray(rows) ? rows[0] : null;

  if (!agendamento) {
    return Response.json({ ok: false, error: 'Agendamento não encontrado.' }, { status: 404 });
  }

  // Cancel the agendamento
  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/re_agendamentos?id=eq.${encodeURIComponent(agendamento_id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        status: 'cancelado',
        motivo_cancelamento: motivo ?? null,
        cancelado_em: new Date().toISOString(),
      }),
    },
  );

  if (!patchRes.ok) {
    const err = await patchRes.text().catch(() => patchRes.statusText);
    return Response.json({ ok: false, error: err }, { status: patchRes.status });
  }

  // Re-open slot
  if (agendamento.slot_id) {
    await fetch(`${supabaseUrl}/rest/v1/re_agenda_slots?id=eq.${encodeURIComponent(agendamento.slot_id)}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ disponivel: true }),
    });
  }

  return Response.json({ ok: true, cancelado: true });
}
