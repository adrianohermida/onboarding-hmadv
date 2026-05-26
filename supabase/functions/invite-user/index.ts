import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return err('Method Not Allowed', 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return err('Unauthorized', 401);
  const jwt = authHeader.slice(7);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Verify caller is an authenticated admin
  const caller = createClient(supabaseUrl, jwt);
  const { data: { user: callerUser }, error: authErr } = await caller.auth.getUser();
  if (authErr || !callerUser) return err('Unauthorized', 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: adminRow } = await admin
    .from('admin_users')
    .select('role')
    .eq('user_id', callerUser.id)
    .maybeSingle();
  if (!adminRow) return err('Forbidden: requer admin', 403);

  const { email, nome, cpf, telefone } = await req.json();
  if (!email || !nome) return err('email e nome são obrigatórios');

  // Send Supabase invite email (creates auth user + sends magic link)
  const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nome, full_name: nome },
    redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://portal.hermidamaia.adv.br'}/convite`,
  });

  if (inviteErr) {
    // User may already exist — try fetching them
    const { data: { users }, error: listErr } = await admin.auth.admin.listUsers();
    const existing = listErr ? null : users.find(u => u.email === email);
    if (!existing) return err(inviteErr.message, 422);
    inviteData!.user = existing;
  }

  const userId = inviteData?.user?.id;
  if (!userId) return err('Falha ao criar usuário', 500);

  // Upsert portal_casos row with initial client data
  const { error: casoErr } = await admin
    .from('portal_casos')
    .upsert({
      user_id:        userId,
      full_name:      nome,
      cpf:            cpf ?? null,
      telefone:       telefone ?? null,
      fase:           'cadastro',
      onboarding_done: false,
      cnj_step_atual: 0,
    }, { onConflict: 'user_id', ignoreDuplicates: false });

  if (casoErr) {
    console.error('portal_casos upsert error:', casoErr);
  }

  return new Response(JSON.stringify({ userId, email }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
