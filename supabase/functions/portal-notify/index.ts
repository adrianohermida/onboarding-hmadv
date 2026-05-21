import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_KEY   = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL   = Deno.env.get('FROM_EMAIL') ?? 'Portal Hermida Maia <contato@hermidamaia.adv.br>';
const OFFICE_EMAIL = Deno.env.get('OFFICE_EMAIL') ?? 'contato@hermidamaia.adv.br';
const FD_KEY       = Deno.env.get('FRESHDESK_API_KEY') ?? '';
const FD_DOMAIN    = Deno.env.get('FRESHDESK_DOMAIN') ?? 'hmdesk';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST')    return new Response('Method Not Allowed', { status: 405 });

  const { type, clientEmail, clientName, targetUserId, payload } = await req.json();
  let resolvedEmail = clientEmail;
  let resolvedName  = clientName;
  let fdTicketId: number | null = null;

  if ((!resolvedEmail || targetUserId) && Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const uid = targetUserId;
    if (uid) {
      const { data: userData } = await admin.auth.admin.getUserById(uid);
      resolvedEmail = resolvedEmail || userData?.user?.email;
      const { data: caso } = await admin
        .from('portal_casos')
        .select('full_name, fd_ticket_id')
        .eq('user_id', uid)
        .maybeSingle();
      resolvedName = resolvedName || caso?.full_name;
      fdTicketId = caso?.fd_ticket_id ?? null;
    }
  }

  const messages: { to: string; subject: string; html: string }[] = [];

  if (type === 'document_upload') {
    const { tipoLabel } = payload;

    // Notify client
    messages.push({
      to: resolvedEmail,
      subject: 'Documento recebido — Hermida Maia',
      html: `<p>Olá${resolvedName ? ' ' + resolvedName : ''}!</p>
<p>Recebemos seu documento <strong>${tipoLabel}</strong>. Nossa equipe irá analisá-lo em breve.</p>
<p>Em caso de dúvidas, acesse o portal ou entre em contato conosco.</p>
<p style="color:#888;font-size:12px;">Hermida Maia — Sociedade Individual de Advocacia</p>`,
    });

    // Notify office
    messages.push({
      to: OFFICE_EMAIL,
      subject: `[Portal] Novo documento: ${tipoLabel}`,
      html: `<p>O cliente <strong>${resolvedName || resolvedEmail}</strong> (${resolvedEmail}) enviou o documento <strong>${tipoLabel}</strong>.</p>
<p>Acesse o portal administrativo para revisar.</p>`,
    });
  } else if (type === 'document_status_update') {
    const { tipoLabel, status, observacao } = payload;
    const statusLabel: Record<string,string> = {
      aprovado:   'aprovado ✅',
      recusado:   'recusado ❌',
      em_analise: 'em análise 🔍',
    };
    messages.push({
      to:      resolvedEmail,
      subject: `Documento ${statusLabel[status] || status} — Hermida Maia`,
      html: `<p>Olá${resolvedName ? ' ' + resolvedName : ''}!</p>
<p>O status do documento <strong>${tipoLabel}</strong> foi atualizado para <strong>${statusLabel[status] || status}</strong>.</p>
${observacao ? `<p><strong>Observação:</strong> ${observacao}</p>` : ''}
<p>Acesse o portal para acompanhar seu caso.</p>
<p style="color:#888;font-size:12px;">Hermida Maia — Sociedade Individual de Advocacia</p>`,
    });

  } else if (type === 'ticket_created') {
    const { ticketId, subject } = payload;
    messages.push({
      to: resolvedEmail,
      subject: 'Chamado registrado — Hermida Maia',
      html: `<p>Olá${resolvedName ? ' ' + resolvedName : ''}!</p>
<p>Seu chamado <strong>#${ticketId}</strong> — <em>${subject}</em> — foi registrado com sucesso.</p>
<p>Nossa equipe irá respondê-lo em breve pelo mesmo canal.</p>
<p style="color:#888;font-size:12px;">Hermida Maia — Sociedade Individual de Advocacia</p>`,
    });

  } else if (type === 'fase_alterada') {
    const { faseAnterior, faseNova, proxima_acao } = payload;
    const FASE_LABEL: Record<string, string> = {
      cadastro:    'Cadastro',
      analise:     'Em Análise',
      conciliacao: 'Conciliação',
      judicial:    'Judicial',
      encerrado:   'Encerrado',
    };
    messages.push({
      to: resolvedEmail,
      subject: `Atualização do seu caso — ${FASE_LABEL[faseNova] || faseNova}`,
      html: `<p>Olá${resolvedName ? ' ' + resolvedName : ''}!</p>
<p>Seu caso foi atualizado para a fase <strong>${FASE_LABEL[faseNova] || faseNova}</strong>.</p>
${proxima_acao ? `<p><strong>Próxima ação:</strong> ${proxima_acao}</p>` : ''}
<p>Acompanhe o andamento pelo portal.</p>
<p style="color:#888;font-size:12px;">Hermida Maia — Sociedade Individual de Advocacia</p>`,
    });
  } else if ([
    'document_approved',
    'document_rejected',
    'document_correction_requested',
    'document_signature_requested',
    'document_signed',
    'document_pending',
    'document_expiring',
  ].includes(type)) {
    const { tipoLabel, observacao } = payload;
    const copy: Record<string, { subject: string; title: string }> = {
      document_approved:             { subject: 'Documento aprovado — Hermida Maia', title: 'Seu documento foi aprovado.' },
      document_rejected:             { subject: 'Documento rejeitado — ação necessária', title: 'Precisamos de um novo envio.' },
      document_correction_requested: { subject: 'Correção documental solicitada', title: 'Há uma correção pendente.' },
      document_signature_requested:  { subject: 'Assinatura eletrônica solicitada', title: 'Um documento aguarda sua assinatura.' },
      document_signed:               { subject: 'Assinatura concluída — Hermida Maia', title: 'Documento assinado com sucesso.' },
      document_pending:              { subject: 'Documento pendente — Hermida Maia', title: 'Há documento pendente no portal.' },
      document_expiring:             { subject: 'Prazo documental expirando', title: 'Um prazo documental está próximo.' },
    };
    const msg = copy[type];
    if (resolvedEmail) {
      messages.push({
        to: resolvedEmail,
        subject: msg.subject,
        html: `<p>Olá${resolvedName ? ' ' + resolvedName : ''}!</p>
<p>${msg.title}</p>
<p><strong>Documento:</strong> ${tipoLabel || 'Documento jurídico'}</p>
${observacao ? `<p><strong>Observação:</strong> ${observacao}</p>` : ''}
<p>Acesse o portal para acompanhar seu caso.</p>
<p style="color:#888;font-size:12px;">Hermida Maia — Sociedade Individual de Advocacia</p>`,
      });
    }

    messages.push({
      to: OFFICE_EMAIL,
      subject: `[Portal] ${msg.subject}`,
      html: `<p>${msg.title}</p><p><strong>Cliente:</strong> ${resolvedName || resolvedEmail || 'não identificado'}</p><p><strong>Documento:</strong> ${tipoLabel || 'Documento jurídico'}</p>`,
    });

    if (FD_KEY && fdTicketId) {
      await fetch(`https://${FD_DOMAIN}.freshdesk.com/api/v2/tickets/${fdTicketId}/notes`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${btoa(`${FD_KEY}:X`)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          private: true,
          body: `[Portal Documentos] ${msg.title}<br><strong>Documento:</strong> ${tipoLabel || 'Documento jurídico'}${observacao ? `<br><strong>Obs:</strong> ${observacao}` : ''}`,
        }),
      }).catch(err => console.warn('Freshdesk note error:', err.message));
    }
  }

  const results = await Promise.allSettled(messages.map(msg =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [msg.to], subject: msg.subject, html: msg.html }),
    }).then(r => r.json())
  ));

  return new Response(JSON.stringify({ sent: results.length }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
