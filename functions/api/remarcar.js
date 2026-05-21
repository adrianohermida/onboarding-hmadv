/**
 * POST /api/remarcar
 * Reschedules an appointment to a new slot.
 * Body: { agendamento_id, novo_slot_id }
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

  const { agendamento_id, novo_slot_id } = body ?? {};
  if (!agendamento_id || !novo_slot_id) {
    return Response.json({ ok: false, error: 'Campos obrigatórios: agendamento_id, novo_slot_id.' }, { status: 400 });
  }

  // Get current agendamento
  const getRes = await fetch(
    `${supabaseUrl}/rest/v1/re_agendamentos?id=eq.${encodeURIComponent(agendamento_id)}&select=id,slot_id`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  const rows = await getRes.json().catch(() => []);
  const agendamento = Array.isArray(rows) ? rows[0] : null;
  if (!agendamento) {
    return Response.json({ ok: false, error: 'Agendamento não encontrado.' }, { status: 404 });
  }

  // Verify new slot is available
  const slotRes = await fetch(
    `${supabaseUrl}/rest/v1/re_agenda_slots?id=eq.${encodeURIComponent(novo_slot_id)}&disponivel=eq.true&select=id,data,hora`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  const slots = await slotRes.json().catch(() => []);
  if (!Array.isArray(slots) || slots.length === 0) {
    return Response.json({ ok: false, error: 'Novo slot indisponível ou não encontrado.' }, { status: 409 });
  }

  const novoSlot = slots[0];

  // Update agendamento to new slot
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
        slot_id: novo_slot_id,
        data: novoSlot.data,
        hora: novoSlot.hora,
        status: 'remarcado',
        remarcado_em: new Date().toISOString(),
      }),
    },
  );

  if (!patchRes.ok) {
    const err = await patchRes.text().catch(() => patchRes.statusText);
    return Response.json({ ok: false, error: err }, { status: patchRes.status });
  }

  // Re-open old slot
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

  // Lock new slot
  await fetch(`${supabaseUrl}/rest/v1/re_agenda_slots?id=eq.${encodeURIComponent(novo_slot_id)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ disponivel: false }),
  });

  const data = await patchRes.json().catch(() => ({}));
  const record = Array.isArray(data) ? data[0] : data;

  return Response.json({ ok: true, agendamento: record });
}
