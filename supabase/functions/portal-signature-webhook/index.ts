import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("AUTENTIQUE_WEBHOOK_SECRET") ?? "";
const FD_KEY = Deno.env.get("FRESHDESK_API_KEY") ?? "";
const FD_DOMAIN = Deno.env.get("FRESHDESK_DOMAIN") ?? "hmdesk";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-autentique-secret, x-webhook-secret",
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

function normalizePayload(body: JsonRecord) {
  const document = (body.document ?? body.data?.document ?? body.data ?? {}) as JsonRecord;
  const eventRaw = body.event ?? body.event_name ?? body.name ?? body.type ?? "";
  const eventName = typeof eventRaw === "string"
    ? eventRaw
    : String((eventRaw as JsonRecord)?.name ?? "");

  const signatures = Array.isArray(document.signatures) ? document.signatures as JsonRecord[] : [];
  const hasRejected = signatures.some((s) => Boolean(s.rejected) || /reject|refus/i.test(String((s.action as JsonRecord | undefined)?.name ?? "")));
  const allSigned = signatures.length > 0 &&
    signatures.every((s) => Boolean(s.signed) || /signed|assinado/i.test(String((s.action as JsonRecord | undefined)?.name ?? "")));

  let status = "pending";
  let workflowStatus = "aguardando_assinatura";
  let timelineEvent = "signature.updated";
  let description = "Evento de assinatura recebido via Autentique.";

  if (/reject|refus/i.test(eventName) || hasRejected) {
    status = "rejected";
    workflowStatus = "rejeitado";
    timelineEvent = "signature.rejected";
    description = "Assinatura rejeitada no Autentique.";
  } else if (/expir/i.test(eventName)) {
    status = "expired";
    workflowStatus = "aguardando_assinatura";
    timelineEvent = "signature.expired";
    description = "Assinatura expirada no Autentique.";
  } else if (/sign|assin/i.test(eventName) || allSigned) {
    status = allSigned || /document|process/i.test(eventName) ? "signed" : "pending";
    workflowStatus = status === "signed" ? "assinado" : "aguardando_assinatura";
    timelineEvent = status === "signed" ? "signature.completed" : "signature.signer_signed";
    description = status === "signed"
      ? "Documento assinado via Autentique."
      : "Um signatário assinou o documento no Autentique.";
  }

  return {
    autentiqueId: String(document.id ?? body.document_id ?? body.process_id ?? body.data?.process_id ?? ""),
    document,
    eventName,
    status,
    workflowStatus,
    timelineEvent,
    description,
    signedFileUrl: (document.files as JsonRecord | undefined)?.signed ?? body.data?.file_url ?? null,
    signatures: signatures.map((s) => ({
      public_id: s.public_id,
      name: s.name,
      email: s.email,
      action: (s.action as JsonRecord | undefined)?.name,
      signed_at: (s.signed as JsonRecord | undefined)?.created_at,
      rejected_at: (s.rejected as JsonRecord | undefined)?.created_at,
    })),
  };
}

async function addFreshdeskNote(fdTicketId: unknown, body: string) {
  if (!FD_KEY || !fdTicketId) return;
  await fetch(`https://${FD_DOMAIN}.freshdesk.com/api/v2/tickets/${fdTicketId}/notes`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${FD_KEY}:X`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body, private: true }),
  }).catch((err) => console.warn("[portal-signature-webhook] Freshdesk note error", err.message));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  try {
    if (WEBHOOK_SECRET) {
      const received = req.headers.get("x-autentique-secret") ??
        req.headers.get("x-webhook-secret") ??
        new URL(req.url).searchParams.get("secret");
      if (received !== WEBHOOK_SECRET) return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json() as JsonRecord;
    const parsed = normalizePayload(body);
    if (!parsed.autentiqueId) return json({ ok: false, error: "Autentique id ausente" }, 200);

    const admin = adminClient();
    const { data: doc, error } = await admin
      .from("portal_documentos")
      .select("*")
      .eq("autentique_id", parsed.autentiqueId)
      .maybeSingle();

    if (error) throw error;
    if (!doc) return json({ ok: true, ignored: true, reason: "document_not_found", autentique_id: parsed.autentiqueId });

    const metadata = {
      ...(doc.metadata ?? {}),
      autentique: {
        ...((doc.metadata as JsonRecord | null)?.autentique as JsonRecord | undefined),
        id: parsed.autentiqueId,
        status: parsed.status,
        event: parsed.eventName,
        signed_file_url: parsed.signedFileUrl,
        signatures: parsed.signatures,
        last_webhook_at: new Date().toISOString(),
        last_webhook_payload: body,
      },
    };

    await admin.from("portal_documentos").update({
      workflow_status: parsed.workflowStatus,
      status: parsed.workflowStatus,
      autentique_status: parsed.status,
      signed_file_url: parsed.signedFileUrl,
      metadata,
      updated_at: new Date().toISOString(),
    }).eq("id", doc.id);

    await admin.from("portal_cnj_timeline").insert({
      caso_id: doc.caso_id,
      workspace_id: doc.workspace_id,
      documento_id: doc.id,
      evento_tipo: parsed.timelineEvent,
      evento_subtipo: "webhook",
      descricao: parsed.description,
      payload: {
        autentique_id: parsed.autentiqueId,
        status: parsed.status,
        event: parsed.eventName,
        signatures: parsed.signatures,
        signed_file_url: parsed.signedFileUrl,
      },
      author_role: "system",
      is_visible_client: true,
    });

    await addFreshdeskNote(
      doc.fd_ticket_id,
      `${parsed.description}<br><strong>Documento:</strong> ${doc.nome_arquivo ?? doc.tipo}<br><strong>Autentique:</strong> ${parsed.autentiqueId}`,
    );

    return json({ ok: true, document_id: doc.id, status: parsed.status });
  } catch (err) {
    console.error("[portal-signature-webhook]", (err as Error).message);
    return json({ ok: false, error: (err as Error).message }, 200);
  }
});
