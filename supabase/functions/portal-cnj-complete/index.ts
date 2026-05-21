// ============================================================
// Edge Function: portal-cnj-complete
// Sprint 8 — Portal Pós-Onboarding
//
// Chamada quando o cliente finaliza o formulário CNJ.
// Responsabilidades:
//   1. Criar ticket Freshdesk com resumo estruturado do caso
//   2. Atualizar portal_casos.fd_ticket_id
//   3. Espelhar ticket em freshdesk_tickets
//   4. Gravar evento ticket_criado em portal_cnj_timeline
//   5. Enviar e-mails (cliente + escritório) via Resend
//   6. Registrar em portal_cnj_notifications
// ============================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FD_KEY       = Deno.env.get('FRESHDESK_API_KEY')!;
const FD_DOMAIN    = Deno.env.get('FRESHDESK_DOMAIN') ?? 'hmdesk';
const FD_BASE      = `https://${FD_DOMAIN}.freshdesk.com/api/v2`;
const FD_CREDS     = btoa(`${FD_KEY}:X`);
const RESEND_KEY   = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL   = Deno.env.get('FROM_EMAIL') ?? 'Portal Hermida Maia <contato@hermidamaia.adv.br>';
const OFFICE_EMAIL = Deno.env.get('OFFICE_EMAIL') ?? 'contato@hermidamaia.adv.br';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function fmtCPF(cpf: string) {
  return String(cpf || '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ── Monta descrição HTML do ticket Freshdesk ──────────────────
function buildTicketHtml(caso: Record<string, unknown>, userEmail: string): string {
  const credores = (caso.credores_cnj as any[]) || [];
  const totalDividas = credores.reduce((s, c) => s + (Number(c.valorDeclarado) || 0), 0);
  const plano = (caso.plano_pagamento as any) || {};
  const despesas = (caso.despesas as any) || {};
  const totalDespesas = Object.values(despesas).reduce((s: number, v) => s + (Number(v) || 0), 0);

  const creditorsRows = credores.map((c: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
      <td style="padding:6px 10px">${c.nome || '—'}</td>
      <td style="padding:6px 10px">${c.tipo || '—'}</td>
      <td style="padding:6px 10px;text-align:right">${formatBRL(Number(c.valorDeclarado))}</td>
      <td style="padding:6px 10px;text-align:right">${c.parcela ? formatBRL(Number(c.parcela)) : '—'}</td>
      <td style="padding:6px 10px">${c.garantia || 'Sem garantia'}</td>
      <td style="padding:6px 10px;text-align:center">${c.processo_judicial ? '⚠️ Judicial' : '—'}</td>
    </tr>`).join('');

  const causas = ((caso.causas_endividamento as string[]) || []).join(', ') || '—';
  const neg = (caso.negativacoes as any) || {};
  const negativacoesStr = [
    neg.serasa       ? 'Serasa'        : '',
    neg.spc          ? 'SPC'           : '',
    neg.protestos    ? 'Protestos'     : '',
    neg.acoes_judiciais ? 'Ações judiciais' : '',
  ].filter(Boolean).join(', ') || 'Nenhuma declarada';

  return `
<div style="font-family:sans-serif;color:#222">
  <h2 style="color:#1A3A5C;border-bottom:2px solid #F5A623;padding-bottom:8px">
    📋 Formulário CNJ — Superendividamento (Lei 14.181/2021)
  </h2>

  <h3 style="color:#1A3A5C;margin-top:20px">§1 — Identificação</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr><td style="padding:4px 12px 4px 0;color:#666;width:180px">ID do caso</td><td style="padding:4px 0"><strong>${caso.id}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">E-mail</td><td>${userEmail}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Nome</td><td><strong>${caso.full_name || '—'}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">CPF</td><td>${fmtCPF(String(caso.cpf || ''))}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Data nascimento</td><td>${caso.data_nascimento || '—'}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Estado civil</td><td>${caso.estado_civil || '—'}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Situação profissional</td><td>${caso.situacao_profissional || '—'}</td></tr>
  </table>

  <h3 style="color:#1A3A5C;margin-top:20px">§2 — Situação Financeira</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr><td style="padding:4px 12px 4px 0;color:#666;width:180px">Renda individual</td><td>${formatBRL(Number(caso.renda))}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Renda familiar</td><td>${formatBRL(Number(caso.renda_familiar))}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Total despesas</td><td>${formatBRL(totalDespesas)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Comprometimento mensal</td><td><strong>${formatBRL(Number(caso.comprometimento_mensal))}</strong></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Causas endividamento</td><td>${causas}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Negativações</td><td>${negativacoesStr}</td></tr>
  </table>

  <h3 style="color:#1A3A5C;margin-top:20px">§3 — Mapa de Credores (${credores.length})</h3>
  <p><strong>Total declarado: ${formatBRL(totalDividas)}</strong></p>
  ${credores.length > 0 ? `
  <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;border:1px solid #ddd">
    <thead style="background:#1A3A5C;color:#fff">
      <tr>
        <th style="padding:8px 10px;text-align:left">Credor</th>
        <th style="padding:8px 10px;text-align:left">Tipo</th>
        <th style="padding:8px 10px;text-align:right">Saldo declarado</th>
        <th style="padding:8px 10px;text-align:right">Parcela</th>
        <th style="padding:8px 10px;text-align:left">Garantia</th>
        <th style="padding:8px 10px;text-align:center">Judicial</th>
      </tr>
    </thead>
    <tbody>${creditorsRows}</tbody>
  </table>` : '<p style="color:#888">Nenhum credor cadastrado</p>'}

  ${plano.prazo_meses ? `
  <h3 style="color:#1A3A5C;margin-top:20px">Plano de Pagamento (art. 104-A CDC)</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr><td style="padding:4px 12px 4px 0;color:#666;width:180px">Prazo proposto</td><td>${plano.prazo_meses} meses</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Parcela possível</td><td>${formatBRL(Number(plano.parcela_possivel))}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666">Renda disponível</td><td>${formatBRL(Number(plano.renda_disponivel))}</td></tr>
  </table>` : ''}

  ${caso.observacoes ? `
  <h3 style="color:#1A3A5C;margin-top:20px">Observações do cliente</h3>
  <p style="background:#f5f5f5;padding:12px;border-radius:4px">${caso.observacoes}</p>` : ''}

  <hr style="margin:20px 0;border:none;border-top:1px solid #eee"/>
  <p style="color:#999;font-size:11px">
    Enviado via Portal HMADV &mdash; Sprint 8 &mdash; ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
  </p>
</div>`.trim();
}

// ── E-mail de confirmação para o cliente ──────────────────────
function buildClientEmail(caso: Record<string, unknown>, userEmail: string, fdTicketId: number | null): string {
  const credores = (caso.credores_cnj as any[]) || [];
  const totalDividas = credores.reduce((s, c) => s + (Number(c.valorDeclarado) || 0), 0);
  const plano = (caso.plano_pagamento as any) || {};

  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#222">
  <div style="background:#1A3A5C;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:#F5A623;margin:0;font-size:20px">Hermida Maia Advocacia</h1>
    <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:13px">Portal do Superendividado</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
    <h2 style="color:#1A3A5C;margin-top:0">Formulário CNJ recebido ✅</h2>
    <p>Olá <strong>${caso.full_name || userEmail}</strong>,</p>
    <p>Recebemos seu formulário de superendividamento com sucesso. Nossa equipe irá analisar seu caso e entrar em contato em até <strong>2 dias úteis</strong>.</p>

    <div style="background:#f8f9fa;border-radius:6px;padding:16px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:6px 0;color:#666;font-size:14px">Total de dívidas declaradas</td>
          <td style="padding:6px 0;font-weight:700;text-align:right;font-size:16px;color:#C0392B">${formatBRL(totalDividas)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666;font-size:14px">Número de credores</td>
          <td style="padding:6px 0;font-weight:700;text-align:right">${credores.length}</td>
        </tr>
        ${plano.prazo_meses ? `
        <tr>
          <td style="padding:6px 0;color:#666;font-size:14px">Plano proposto</td>
          <td style="padding:6px 0;text-align:right">${plano.prazo_meses} meses — ${formatBRL(Number(plano.parcela_possivel))}/mês</td>
        </tr>` : ''}
        ${fdTicketId ? `
        <tr>
          <td style="padding:6px 0;color:#666;font-size:14px">Número do chamado</td>
          <td style="padding:6px 0;font-weight:700;text-align:right;color:#2E6DA4">#${fdTicketId}</td>
        </tr>` : ''}
      </table>
    </div>

    <h3 style="color:#1A3A5C">Próximos passos</h3>
    <ol style="color:#444;line-height:1.8">
      <li>Nossa equipe revisará seus dados e documentos</li>
      <li>Você receberá um contato para agendamento de reunião</li>
      <li>Será elaborado o plano de reestruturação conforme art. 104-A do CDC</li>
      <li>A conciliação será agendada conforme calendário do CEJUSC</li>
    </ol>

    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
      <p>Hermida Maia — Sociedade Individual de Advocacia<br>
      Lei 14.181/2021 — Proteção ao Consumidor Superendividado<br>
      Recomendação CNJ 125/2021 — Câmaras de Prevenção e Resolução de Conflitos</p>
    </div>
  </div>
</div>`.trim();
}

// ── E-mail de notificação para o escritório ───────────────────
function buildOfficeEmail(caso: Record<string, unknown>, userEmail: string, fdTicketId: number | null): string {
  const credores = (caso.credores_cnj as any[]) || [];
  const totalDividas = credores.reduce((s, c) => s + (Number(c.valorDeclarado) || 0), 0);
  const renda = Number(caso.renda) || 0;
  const comprometimento = Number(caso.comprometimento_mensal) || 0;
  const pct = renda > 0 ? ((comprometimento / renda) * 100).toFixed(1) : '—';

  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#222">
  <div style="background:#1A3A5C;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#F5A623;margin:0;font-size:16px">⚠️ Novo formulário CNJ recebido</h2>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:5px 16px 5px 0;color:#666;width:160px">Cliente</td><td><strong>${caso.full_name || '—'}</strong> (${userEmail})</td></tr>
      <tr><td style="padding:5px 16px 5px 0;color:#666">CPF</td><td>${fmtCPF(String(caso.cpf || ''))}</td></tr>
      <tr><td style="padding:5px 16px 5px 0;color:#666">Total dívidas</td><td style="color:#C0392B;font-weight:700">${formatBRL(totalDividas)} &mdash; ${credores.length} credor(es)</td></tr>
      <tr><td style="padding:5px 16px 5px 0;color:#666">Comprometimento</td><td>${formatBRL(comprometimento)} / mês (${pct}% da renda)</td></tr>
      ${fdTicketId ? `<tr><td style="padding:5px 16px 5px 0;color:#666">Ticket Freshdesk</td><td style="color:#2E6DA4;font-weight:700">#${fdTicketId}</td></tr>` : ''}
      <tr><td style="padding:5px 16px 5px 0;color:#666">ID do caso</td><td style="font-family:monospace;font-size:12px">${caso.id}</td></tr>
    </table>
    <p style="margin-top:16px;font-size:12px;color:#999">Enviado via Portal HMADV</p>
  </div>
</div>`.trim();
}

// ── Handler principal ─────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405 });

  // Auth: extrair usuário do JWT
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return json({ error: 'Unauthenticated' }, 401);

  let userEmail: string;
  let userId: string;
  try {
    const claims = JSON.parse(atob(token.split('.')[1]));
    userEmail = claims.email;
    userId    = claims.sub;
    if (!userEmail || !userId) throw new Error('Invalid token');
  } catch {
    return json({ error: 'Invalid token' }, 401);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Carrega caso
  const { data: caso, error: casoErr } = await admin
    .from('portal_casos')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (casoErr || !caso) {
    console.error('Caso não encontrado:', casoErr);
    return json({ error: 'Caso não encontrado' }, 404);
  }

  // ── 1. Criar ticket Freshdesk ─────────────────────────────
  let fdTicketId: number | null = null;
  let fdContactId: number | null = null;

  try {
    const fdRes = await fetch(`${FD_BASE}/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${FD_CREDS}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email:       userEmail,
        subject:     `[CNJ] Superendividamento — ${caso.full_name || userEmail}`,
        description: buildTicketHtml(caso, userEmail),
        priority:    2,
        status:      2,
        tags:        ['portal-cnj', 'superendividamento', 'lei-14181-2021'],
      }),
    });

    const ticket = await fdRes.json();

    if (fdRes.ok && ticket.id) {
      fdTicketId = ticket.id;

      // Busca contact para espelhar
      const { data: contact } = await admin
        .from('freshdesk_contacts')
        .select('fd_contact_id')
        .eq('email', userEmail)
        .maybeSingle();

      fdContactId = contact?.fd_contact_id ?? null;

      // Espelha em freshdesk_tickets
      await admin.from('freshdesk_tickets').upsert({
        fd_ticket_id:    ticket.id,
        fd_contact_id:   fdContactId,
        portal_caso_id:  caso.id,
        subject:         ticket.subject,
        status:          ticket.status,
        priority:        ticket.priority,
        tags:            ticket.tags ?? [],
        cnj_fase:        caso.fase ?? 'cadastro',
        cnj_form_json:   caso.cnj_json,
        fd_raw_payload:  ticket,
        created_at:      ticket.created_at,
        updated_at:      ticket.updated_at,
      }, { onConflict: 'fd_ticket_id', ignoreDuplicates: false });

      // ── 2. Atualiza fd_ticket_id no caso ───────────────────
      await admin
        .from('portal_casos')
        .update({ fd_ticket_id: fdTicketId })
        .eq('id', caso.id);

      // ── 3. Grava evento na timeline ─────────────────────────
      await admin.from('portal_cnj_timeline').insert({
        caso_id:           caso.id,
        workspace_id:      caso.workspace_id,
        evento_tipo:       'ticket_criado',
        descricao:         `Ticket Freshdesk #${fdTicketId} criado — análise do caso CNJ iniciada`,
        payload:           { fd_ticket_id: fdTicketId, subject: ticket.subject },
        author_role:       'sistema',
        fd_ticket_id:      fdTicketId,
        is_visible_client: true,
      });
    }
  } catch (err) {
    console.error('Freshdesk error:', err);
    // Não bloqueia — continua com e-mails
  }

  // ── 4. Enviar e-mails via Resend ──────────────────────────
  const emailResults = await Promise.allSettled([
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [userEmail],
        subject: 'Seu formulário CNJ foi recebido — Hermida Maia',
        html:    buildClientEmail(caso, userEmail, fdTicketId),
      }),
    }).then(r => r.json()),
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [OFFICE_EMAIL],
        subject: `[Portal CNJ] ${caso.full_name || userEmail} — ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((caso.credores_cnj as any[] || []).reduce((s, c) => s + (Number(c.valorDeclarado) || 0), 0))}`,
        html:    buildOfficeEmail(caso, userEmail, fdTicketId),
      }),
    }).then(r => r.json()),
  ]);

  // ── 5. Registrar na fila de notificações ──────────────────
  await admin.from('portal_cnj_notifications').insert({
    caso_id:         caso.id,
    workspace_id:    caso.workspace_id,
    recipient_email: userEmail,
    canal:           'email',
    assunto:         'Formulário CNJ recebido — Hermida Maia',
    status:          emailResults[0].status === 'fulfilled' ? 'enviado' : 'falhou',
    template_key:    'cnj.formulario_enviado',
    template_vars:   { fd_ticket_id: fdTicketId },
    enviado_em:      new Date().toISOString(),
    fd_note_id:      fdTicketId ? String(fdTicketId) : null,
  }).catch(console.warn);

  return json({
    ok:           true,
    fd_ticket_id: fdTicketId,
    caso_id:      caso.id,
    emails_sent:  emailResults.filter(r => r.status === 'fulfilled').length,
  });
});
