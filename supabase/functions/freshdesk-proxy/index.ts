import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FD_KEY = Deno.env.get("FRESHDESK_API_KEY") ?? "";
const FD_DOMAIN = Deno.env.get("FRESHDESK_DOMAIN") ?? "hmdesk";
const FD_BASE = `https://${FD_DOMAIN}.freshdesk.com/api/v2`;
const FD_CREDS = btoa(`${FD_KEY}:X`);
const SUPPORT_EMAIL = Deno.env.get("FRESHDESK_SUPPORT_EMAIL") ?? "suporte@hermidamaia.adv.br";
const EMAIL_CONFIG_ID = Number(Deno.env.get("FRESHDESK_EMAIL_CONFIG_ID") ?? "0") || undefined;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};

type JsonRecord = Record<string, any>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function anonClient(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonFromEnv = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const anonFromHeader = req.headers.get("apikey") ?? "";
  const anonKey = anonFromEnv || anonFromHeader;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createClient(supabaseUrl, anonKey);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toHtml(description: string, meta: JsonRecord = {}) {
  const base = escapeHtml(description).replace(/\n/g, "<br>");
  const details = Object.entries(meta)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`)
    .join("");
  return details
    ? `${base}<hr><p><strong>Dados do portal</strong></p><ul>${details}</ul>`
    : base;
}

function decodeClaims(token: string): JsonRecord {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch (_) {
    return {};
  }
}

async function getAuthenticatedUser(req: Request, anon: NonNullable<ReturnType<typeof anonClient>>) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { user: null, email: null, token: null, error: "Sessão ausente" };

  const { data, error } = await anon.auth.getUser(token);
  const claims = decodeClaims(token);
  const user = data?.user ?? null;
  const email = user?.email ?? claims.email ?? claims.user_metadata?.email ?? null;

  if (error || !user || !email) {
    return { user, email, token, error: error?.message ?? "Sessão inválida" };
  }

  return { user, email: String(email).toLowerCase(), token, error: null };
}

async function fetchFreshdesk(path: string, init: RequestInit = {}) {
  if (!FD_KEY) return { ok: false, status: 500, data: { error: "FRESHDESK_API_KEY não configurado" } };

  const response = await fetch(`${FD_BASE}${path}`, {
    ...init,
    headers: {
      "Authorization": `Basic ${FD_CREDS}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : { message: await response.text().catch(() => "") };

  return { ok: response.ok, status: response.status, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  try {
    const anon = anonClient(req);
    if (!anon) {
      return json({ error: "ServerMisconfigured", message: "SUPABASE_URL/SUPABASE_ANON_KEY ausentes" }, 500);
    }

    const auth = await getAuthenticatedUser(req, anon);
    if (auth.error || !auth.user || !auth.email) {
      return json({ error: "Unauthenticated", message: auth.error }, 401);
    }

    if (!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      return json({ error: "ServerMisconfigured", message: "SUPABASE_SERVICE_ROLE_KEY ausente" }, 500);
    }

    const admin = adminClient();

    const body = await req.json().catch(() => ({})) as JsonRecord;
    const action = String(body.action ?? "");

    if (action !== "create_ticket") return json({ error: "Unknown action" }, 400);

    const subject = String(body.subject ?? "").trim();
    const description = String(body.description ?? "").trim();
    const priority = Number(body.priority ?? 1) || 1;
    const inputTags = Array.isArray(body.tags) ? body.tags.map(String) : [];

    if (!subject) return json({ error: "Assunto obrigatório" }, 400);
    if (!description) return json({ error: "Descrição obrigatória" }, 400);

    const { data: caso } = await admin
      .from("portal_casos")
      .select("id,user_id,workspace_id,full_name,email,cpf,fd_contact_id,fd_ticket_id,fase,cnj_json")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    const requesterName = caso?.full_name ?? auth.user.user_metadata?.full_name ?? auth.user.user_metadata?.name ?? auth.email;
    const tags = Array.from(new Set(["portal-cliente", "portal-suporte", ...inputTags].filter(Boolean)));

    const fdPayload: JsonRecord = {
      email: auth.email,
      name: requesterName,
      subject,
      description: toHtml(description, {
        remetente: auth.email,
        destinatario: SUPPORT_EMAIL,
        portal_caso_id: caso?.id,
        fase: caso?.fase,
      }),
      priority,
      status: 2,
      source: 2,
      tags,
    };

    if (EMAIL_CONFIG_ID) fdPayload.email_config_id = EMAIL_CONFIG_ID;

    const fdRes = await fetchFreshdesk("/tickets", {
      method: "POST",
      body: JSON.stringify(fdPayload),
    });

    if (!fdRes.ok) return json(fdRes.data, fdRes.status);

    const ticket = fdRes.data as JsonRecord;
    const fdTicketId = Number(ticket.id);
    const fdContactId = Number(ticket.requester_id ?? caso?.fd_contact_id ?? 0) || null;
    const now = new Date().toISOString();

    if (fdContactId) {
      await admin.from("freshdesk_contacts").upsert({
        fd_contact_id: fdContactId,
        email: auth.email,
        name: requesterName,
        cpf: caso?.cpf ?? null,
        sync_status: "synced",
        tickets_count: 1,
        fd_raw_payload: { requester_id: fdContactId, source: "ticket_create" },
        metadata: {
          source: "portal_suporte",
          portal_caso_id: caso?.id ?? null,
        },
        last_synced_at: now,
        updated_at: now,
      }, { onConflict: "fd_contact_id", ignoreDuplicates: false });
    }

    await admin.from("freshdesk_tickets").upsert({
      fd_ticket_id: fdTicketId,
      fd_contact_id: fdContactId,
      portal_caso_id: caso?.id ?? null,
      requester_email: auth.email,
      support_email: SUPPORT_EMAIL,
      subject: String(ticket.subject ?? subject),
      status: Number(ticket.status ?? 2),
      priority: Number(ticket.priority ?? priority),
      tags: Array.isArray(ticket.tags) ? ticket.tags : tags,
      cnj_fase: caso?.fase ?? null,
      cnj_form_json: caso?.cnj_json ?? null,
      fd_raw_payload: ticket,
      metadata: {
        source: "portal_suporte",
        support_email: SUPPORT_EMAIL,
        requester_email: auth.email,
        portal_caso_id: caso?.id ?? null,
      },
      created_at: ticket.created_at ?? now,
      updated_at: ticket.updated_at ?? now,
      last_synced_at: now,
    }, { onConflict: "fd_ticket_id", ignoreDuplicates: false });

    if (caso?.id) {
      await admin.from("portal_casos").update({
        fd_ticket_id: fdTicketId,
        fd_contact_id: fdContactId,
        updated_at: now,
      }).eq("id", caso.id);

      await admin.from("portal_cnj_timeline").insert({
        caso_id: caso.id,
        workspace_id: caso.workspace_id,
        evento_tipo: "ticket_criado",
        evento_subtipo: "suporte",
        descricao: `Chamado Freshdesk #${fdTicketId} criado pelo portal de suporte`,
        payload: {
          fd_ticket_id: fdTicketId,
          requester_email: auth.email,
          support_email: SUPPORT_EMAIL,
          subject: ticket.subject ?? subject,
        },
        author_role: "client",
        fd_ticket_id: fdTicketId,
        is_visible_client: true,
      });
    }

    return json({
      ok: true,
      ticket,
      id: fdTicketId,
      fd_ticket_id: fdTicketId,
      portal_caso_id: caso?.id ?? null,
      requester_email: auth.email,
      support_email: SUPPORT_EMAIL,
    });
  } catch (err) {
    console.error("[freshdesk-proxy]", (err as Error).message);
    return json({ error: "Erro interno ao criar chamado", message: (err as Error).message }, 500);
  }
});
