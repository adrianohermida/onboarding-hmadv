import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FD_KEY    = Deno.env.get('FRESHDESK_API_KEY')!;
const FD_DOMAIN = Deno.env.get('FRESHDESK_DOMAIN') ?? 'hmdesk';
const FD_BASE   = `https://${FD_DOMAIN}.freshdesk.com/api/v2`;
const FD_CREDS  = btoa(`${FD_KEY}:X`);

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405 });

  // Decode email from the (already-verified) JWT
  const token     = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const claims    = JSON.parse(atob(token.split('.')[1]));
  const userEmail = claims.email as string;
  if (!userEmail)  return json({ error: 'Unauthenticated' }, 401);

  const { action, subject, description, tags = [], priority = 1 } = await req.json();

  if (action === 'create_ticket') {
    const fdRes = await fetch(`${FD_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${FD_CREDS}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        subject,
        description,
        priority,
        status: 2,
        tags: ['portal-cliente', ...tags],
      }),
    });

    const ticket = await fdRes.json();
    if (!fdRes.ok) return json(ticket, fdRes.status);

    // Mirror ticket to Supabase so the portal list updates immediately
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    // Find fd_contact_id for this user
    const { data: contact } = await admin
      .from('freshdesk_contacts')
      .select('fd_contact_id')
      .eq('email', userEmail)
      .maybeSingle();

    await admin.from('freshdesk_tickets').upsert({
      fd_ticket_id:   ticket.id,
      fd_contact_id:  contact?.fd_contact_id ?? null,
      subject:        ticket.subject,
      status:         ticket.status,
      priority:       ticket.priority,
      tags:           ticket.tags ?? [],
      fd_raw_payload: ticket,
      created_at:     ticket.created_at,
      updated_at:     ticket.updated_at,
    }, { onConflict: 'fd_ticket_id', ignoreDuplicates: false });

    return json(ticket);
  }

  return json({ error: 'Unknown action' }, 400);
});
