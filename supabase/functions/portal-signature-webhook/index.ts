import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const WEBHOOK_SECRET_DOC = Deno.env.get("AUTENTIQUE_WEBHOOK_SECRET_DOC") ?? "";
const WEBHOOK_SECRET_SIGN = Deno.env.get("AUTENTIQUE_WEBHOOK_SECRET_SIGN") ?? "";
const WEBHOOK_SECRET_LEGACY = Deno.env.get("AUTENTIQUE_WEBHOOK_SECRET") ?? "";
const FD_KEY = Deno.env.get("FRESHDESK_API_KEY") ?? "";
const FD_DOMAIN = Deno.env.get("FRESHDESK_DOMAIN") ?? "hmdesk";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-autentique-secret, x-webhook-secret, x-autentique-webhook-secret",
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

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function getReceivedSecret(req: Request) {
  const url = new URL(req.url);
  return req.headers.get("x-autentique-secret") ??
    req.headers.get("x-webhook-secret") ??
    req.headers.get("x-autentique-webhook-secret") ??
    url.searchParams.get("secret") ??
    url.searchParams.get("webhook_secret");
}

function extractEventName(body: JsonRecord) {
  const eventRaw = body.event ?? body.data?.event ?? body.event_name ?? body.name ?? body.type ?? "";
  if (typeof eventRaw === "string") return eventRaw;
  const event = asRecord(eventRaw);
  return String(event.type ?? event.name ?? event.event ?? "");
}

function getWebhookGroup(req: Request, eventName = "") {
  const group = new URL(req.url).searchParams.get("group")?.toLowerCase();
  if (group === "document" || group === "doc") return "document";
  if (group === "signature" || group === "sign") return "signature";
  if (eventName.startsWith("document.")) return "document";
  if (eventName.startsWith("signature.")) return "signature";
  return "default";
}

function getAcceptedSecrets(group: string) {
  if (group === "document") return [WEBHOOK_SECRET_DOC, WEBHOOK_SECRET_LEGACY].filter(Boolean);
  if (group === "signature") return [WEBHOOK_SECRET_SIGN, WEBHOOK_SECRET_LEGACY].filter(Boolean);
  return [WEBHOOK_SECRET_DOC, WEBHOOK_SECRET_SIGN, WEBHOOK_SECRET_LEGACY].filter(Boolean);
}

function isWebhookAuthorized(req: Request, group: string) {
  const acceptedSecrets = getAcceptedSecrets(group);
  if (!acceptedSecrets.length) return true;
  const received = getReceivedSecret(req);
  return Boolean(received && acceptedSecrets.includes(received));
}

function normalizePayload(body: JsonRecord, group = "default") {
  const event = asRecord(body.event);
  const eventData = asRecord(event.data);
  const eventObject = asRecord(eventData.object);
  const previousAttributes = asRecord(eventData.previous_attributes);
  const eventName = extractEventName(body);
  const eventKey = eventName.toLowerCase();

  const legacySignature = asRecord(body.signature ?? body.data?.signature);
  const legacyDocument = asRecord(body.document ?? body.data?.document);

  const objectLooksLikeSignature = group === "signature" || eventKey.startsWith("signature.");
  const signature = objectLooksLikeSignature
    ? asRecord(eventObject.id ? eventObject : legacySignature)
    : legacySignature;

  const document = objectLooksLikeSignature
    ? asRecord(eventObject.document ?? signature.document ?? legacyDocument ?? body.data?.document)
    : asRecord(eventObject.id ? eventObject : legacyDocument ?? body.data ?? {});

  const documentId = String(
    document.id ??
    signature.document_id ??
    signature.document?.id ??
    body.document_id ??
    body.process_id ??
    body.data?.process_id ??
    "",
  );

  const documentSignatures = Array.isArray(document.signatures) ? document.signatures as JsonRecord[] : [];
  const signatures = documentSignatures.length ? documentSignatures : (signature.id ? [signature] : []);
  const hasRejected = signatures.some((s) => Boolean(s.rejected) || /reject|refus/i.test(String(asRecord(s.action).name ?? "")));
  const allSigned = documentSignatures.length > 0 && documentSignatures.every((s) => Boolean(s.signed) || /signed|assinado/i.test(String(asRecord(s.action).name ?? "")));

  let status = "pending";
  let workflowStatus = "aguardando_assinatura";
  let timelineEvent = eventKey || "signature.updated";
  let description = "Evento recebido via Autentique.";

  if (group === "document") {
    description = "Evento de documento recebido via Autentique.";
    if (eventKey === "document.finished") {
      status = "signed";
      workflowStatus = "assinado";
      timelineEvent = "signature.completed";
      description = "Documento finalizado no Autentique.";
    } else if (eventKey === "document.deleted") {
      status = "deleted";
      workflowStatus = "arquivado";
      timelineEvent = "document.archived";
      description = "Documento removido no Autentique.";
    } else if (eventKey === "document.created") {
      timelineEvent = "document.created";
      description = "Documento criado no Autentique.";
    } else if (eventKey === "document.updated") {
      timelineEvent = "document.updated";
      description = "Documento atualizado no Autentique.";
    }
  } else if (eventKey === "signature.rejected" || /reject|refus/i.test(eventName) || hasRejected) {
    status = "rejected";
    workflowStatus = "rejeitado";
    timelineEvent = "signature.rejected";
    description = "Assinatura rejeitada no Autentique.";
  } else if (eventKey === "signature.deleted" || /expir/i.test(eventName)) {
    status = eventKey === "signature.deleted" ? "deleted" : "expired";
    timelineEvent = eventKey === "signature.deleted" ? "signature.deleted" : "signature.expired";
    description = eventKey === "signature.deleted"
      ? "Assinatura removida no Autentique."
      : "Assinatura expirada no Autentique.";
  } else if (eventKey === "signature.accepted" || /sign|assin/i.test(eventName) || allSigned) {
    status = allSigned || eventKey === "signature.accepted" || /document|process/i.test(eventName) ? "signed" : "pending";
    workflowStatus = status === "signed" ? "assinado" : "aguardando_assinatura";
    timelineEvent = status === "signed" ? "signature.completed" : "signature.signer_signed";
    description = status === "signed"
      ? "Documento assinado via Autentique."
      : "Um signatário assinou o documento no Autentique.";
  } else if (eventKey === "signature.viewed") {
    timelineEvent = "signature.viewed";
    description = "Documento visualizado pelo signatário no Autentique.";
  } else if (eventKey.startsWith("signature.biometric_")) {
    timelineEvent = eventKey;
    description = "Evento biométrico de assinatura recebido via Autentique.";
  } else if (eventKey === "signature.delivery_failed") {
    status = "delivery_failed";
    timelineEvent = "signature.delivery_failed";
    description = "Falha na entrega da solicitação de assinatura pelo Autentique.";
  } else if (eventKey === "signature.created" || eventKey === "signature.updated") {
    timelineEvent = eventKey;
    description = "Evento de assinatura recebido via Autentique.";
  }

  return {
    autentiqueId: documentId,
    document,
    signature,
    group,
    eventName,
    status,
    workflowStatus,
    timelineEvent,
    description,
    signedFileUrl: asRecord(document.files).signed ?? body.data?.file_url ?? null,
    previousAttributes,
    signatures: signatures.map((s) => ({
      public_id: s.public_id ?? s.id,
      name: s.name,
      email: s.email,
      action: asRecord(s.action).name,
      signed_at: asRecord(s.signed).created_at ?? s.signed_at,
      rejected_at: asRecord(s.rejected).created_at ?? s.rejected_at,
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
    const body = await req.json() as JsonRecord;
    const eventName = extractEventName(body).toLowerCase();
    const group = getWebhookGroup(req, eventName);
    if (!isWebhookAuthorized(req, group)) return json({ error: "Unauthorized" }, 401);

    const parsed = normalizePayload(body, group);
    if (!parsed.autentiqueId) return json({ ok: false, error: "Autentique id ausente" }, 200);

    const admin = adminClient();
    const { data: doc, error } = await admin
      .from("portal_documentos")
      .select("*")
      .eq("autentique_id", parsed.autentiqueId)
      .maybeSingle();

    if (error) throw error;
    if (!doc) return json({ ok: true, ignored: true, reason: "document_not_found", autentique_id: parsed.autentiqueId, event: parsed.eventName });

    const metadata = {
      ...(doc.metadata ?? {}),
      autentique: {
        ...((doc.metadata as JsonRecord | null)?.autentique as JsonRecord | undefined),
        id: parsed.autentiqueId,
        webhook_group: parsed.group,
        status: parsed.status,
        event: parsed.eventName,
        signed_file_url: parsed.signedFileUrl,
        signatures: parsed.signatures,
        previous_attributes: parsed.previousAttributes,
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
        group: parsed.group,
        status: parsed.status,
        event: parsed.eventName,
        signatures: parsed.signatures,
        signed_file_url: parsed.signedFileUrl,
        previous_attributes: parsed.previousAttributes,
      },
      author_role: "system",
      is_visible_client: true,
    });

    await addFreshdeskNote(
      doc.fd_ticket_id,
      `${parsed.description}<br><strong>Documento:</strong> ${doc.nome_arquivo ?? doc.tipo}<br><strong>Autentique:</strong> ${parsed.autentiqueId}`,
    );

    return json({ ok: true, document_id: doc.id, group: parsed.group, event: parsed.eventName, status: parsed.status });
  } catch (err) {
    console.error("[portal-signature-webhook]", (err as Error).message);
    return json({ ok: false, error: (err as Error).message }, 200);
  }
});
