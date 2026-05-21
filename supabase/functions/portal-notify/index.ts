import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_KEY   = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL   = Deno.env.get('FROM_EMAIL') ?? 'Portal Hermida Maia <contato@hermidamaia.adv.br>';
const OFFICE_EMAIL = Deno.env.get('OFFICE_EMAIL') ?? 'contato@hermidamaia.adv.br';

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST')    return new Response('Method Not Allowed', { status: 405 });

  const { type, clientEmail, clientName, payload } = await req.json();

  const messages: { to: string; subject: string; html: string }[] = [];

  if (type === 'document_upload') {
    const { tipoLabel } = payload;

    // Notify client
    messages.push({
      to: clientEmail,
      subject: 'Documento recebido — Hermida Maia',
      html: `<p>Olá${clientName ? ' ' + clientName : ''}!</p>
<p>Recebemos seu documento <strong>${tipoLabel}</strong>. Nossa equipe irá analisá-lo em breve.</p>
<p>Em caso de dúvidas, acesse o portal ou entre em contato conosco.</p>
<p style="color:#888;font-size:12px;">Hermida Maia — Sociedade Individual de Advocacia</p>`,
    });

    // Notify office
    messages.push({
      to: OFFICE_EMAIL,
      subject: `[Portal] Novo documento: ${tipoLabel}`,
      html: `<p>O cliente <strong>${clientName || clientEmail}</strong> (${clientEmail}) enviou o documento <strong>${tipoLabel}</strong>.</p>
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
      to:      clientEmail,
      subject: `Documento ${statusLabel[status] || status} — Hermida Maia`,
      html: `<p>Olá${clientName ? ' ' + clientName : ''}!</p>
<p>O status do documento <strong>${tipoLabel}</strong> foi atualizado para <strong>${statusLabel[status] || status}</strong>.</p>
${observacao ? `<p><strong>Observação:</strong> ${observacao}</p>` : ''}
<p>Acesse o portal para acompanhar seu caso.</p>
<p style="color:#888;font-size:12px;">Hermida Maia — Sociedade Individual de Advocacia</p>`,
    });

  } else if (type === 'ticket_created') {
    const { ticketId, subject } = payload;
    messages.push({
      to: clientEmail,
      subject: 'Chamado registrado — Hermida Maia',
      html: `<p>Olá${clientName ? ' ' + clientName : ''}!</p>
<p>Seu chamado <strong>#${ticketId}</strong> — <em>${subject}</em> — foi registrado com sucesso.</p>
<p>Nossa equipe irá respondê-lo em breve pelo mesmo canal.</p>
<p style="color:#888;font-size:12px;">Hermida Maia — Sociedade Individual de Advocacia</p>`,
    });
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
