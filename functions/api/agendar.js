/**
 * POST /api/agendar
 * Books an appointment slot.
 * Body: { slot_id, nome, email, telefone, tipo?, observacao? }
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

  const { slot_id, nome, email, telefone, tipo, observacao } = body ?? {};
  if (!slot_id || !nome || !email) {
    return Response.json({ ok: false, error: 'Campos obrigatórios: slot_id, nome, email.' }, { status: 400 });
  }

  // Lock the slot — check availability first
  const checkRes = await fetch(
    `${supabaseUrl}/rest/v1/re_agenda_slots?id=eq.${encodeURIComponent(slot_id)}&disponivel=eq.true&select=id,data,hora`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  const slots = await checkRes.json().catch(() => []);
  if (!Array.isArray(slots) || slots.length === 0) {
    return Response.json({ ok: false, error: 'Slot indisponível ou não encontrado.' }, { status: 409 });
  }

  const slot = slots[0];

  // Create agendamento record
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/re_agendamentos`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      slot_id,
      nome,
      email,
      telefone: telefone ?? null,
      tipo: tipo ?? 'consulta',
      observacao: observacao ?? null,
      status: 'pendente',
      data: slot.data,
      hora: slot.hora,
    }),
  });

  if (!insertRes.ok) {
    const err = await insertRes.text().catch(() => insertRes.statusText);
    return Response.json({ ok: false, error: err }, { status: insertRes.status });
  }

  // Mark slot as unavailable
  await fetch(`${supabaseUrl}/rest/v1/re_agenda_slots?id=eq.${encodeURIComponent(slot_id)}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ disponivel: false }),
  });

  const agendamento = await insertRes.json().catch(() => ({}));
  const record = Array.isArray(agendamento) ? agendamento[0] : agendamento;

  return Response.json({ ok: true, agendamento: record }, { status: 201 });
}
