import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const AUTENTIQUE_API_KEY = Deno.env.get("AUTENTIQUE_API_KEY") ?? "";
const AUTENTIQUE_GRAPHQL_URL = Deno.env.get("AUTENTIQUE_GRAPHQL_URL") ??
  "https://api.autentique.com.br/v2/graphql";
const STORAGE_BUCKET = Deno.env.get("PORTAL_DOCUMENTS_BUCKET") ?? "portal-documentos";
const FD_KEY = Deno.env.get("FRESHDESK_API_KEY") ?? "";
const FD_DOMAIN = Deno.env.get("FRESHDESK_DOMAIN") ?? "hmdesk";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

type JsonRecord = Record<string, any>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function parseJsonOrRaw(raw: string) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function userClient(req: Request) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
}

async function requireUser(req: Request) {
  const client = userClient(req);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new HttpError("Não autenticado", 401);
  return data.user;
}

class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function autentiqueGraphQL(query: string, variables: JsonRecord = {}) {
  if (!AUTENTIQUE_API_KEY) throw new HttpError("AUTENTIQUE_API_KEY não configurada", 500);

  const resp = await fetch(AUTENTIQUE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AUTENTIQUE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const raw = await resp.text();
  const body = parseJsonOrRaw(raw);
  if (!resp.ok) throw new HttpError("Erro Autentique", resp.status, body);
  if (Array.isArray(body.errors) && body.errors.length) {
    throw new HttpError("Erro GraphQL Autentique", 400, body.errors);
  }
  return body.data ?? body;
}

async function autentiqueUpload(query: string, variables: JsonRecord, file: Blob, fileName: string) {
  if (!AUTENTIQUE_API_KEY) throw new HttpError("AUTENTIQUE_API_KEY não configurada", 500);

  const form = new FormData();
  form.append("operations", JSON.stringify({ query, variables: { ...variables, file: null } }));
  form.append("map", JSON.stringify({ file: ["variables.file"] }));
  form.append("file", file, fileName);

  const resp = await fetch(AUTENTIQUE_GRAPHQL_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${AUTENTIQUE_API_KEY}` },
    body: form,
  });
  const raw = await resp.text();
  const body = parseJsonOrRaw(raw);
  if (!resp.ok) throw new HttpError("Erro Autentique", resp.status, body);
  if (Array.isArray(body.errors) && body.errors.length) {
    throw new HttpError("Erro GraphQL Autentique", 400, body.errors);
  }
  return body.data ?? body;
}

function firstSignatureLink(doc: JsonRecord) {
  const signatures = Array.isArray(doc.signatures) ? doc.signatures as JsonRecord[] : [];
  const withLink = signatures.find((s) => (s.link as JsonRecord | undefined)?.short_link);
  return (withLink?.link as JsonRecord | undefined)?.short_link ?? null;
}

async function logTimeline(admin: ReturnType<typeof adminClient>, doc: JsonRecord, event: string, description: string, payload: JsonRecord) {
  if (!doc.caso_id) return;
  await admin.from("portal_cnj_timeline").insert({
    caso_id: doc.caso_id,
    workspace_id: doc.workspace_id ?? null,
    documento_id: doc.id,
    evento_tipo: event,
    evento_subtipo: "autentique",
    descricao: description,
    payload,
    author_role: "system",
    is_visible_client: true,
  });
}

async function addFreshdeskNote(doc: JsonRecord, body: string) {
  const ticketId = doc.fd_ticket_id;
  if (!FD_KEY || !ticketId) return;

  await fetch(`https://${FD_DOMAIN}.freshdesk.com/api/v2/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${FD_KEY}:X`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body, private: true }),
  }).catch((err) => console.warn("[portal-signature] Freshdesk note error", err.message));
}

async function requestSignature(req: Request, body: JsonRecord) {
  const user = await requireUser(req);
  const admin = adminClient();

  const documentId = String(body.document_id ?? "");
  const signerEmail = String(body.signer_email ?? "");
  if (!documentId || !signerEmail) throw new HttpError("document_id e signer_email são obrigatórios", 400);

  const { data: doc, error } = await admin
    .from("portal_documentos")
    .select("*, portal_casos(full_name, fd_ticket_id)")
    .eq("id", documentId)
    .maybeSingle();
  if (error) throw new HttpError(error.message, 500);
  if (!doc) throw new HttpError("Documento não encontrado", 404);
  if (!doc.storage_path && !body.storage_path) throw new HttpError("Documento sem arquivo no Storage", 400);

  const path = String(body.storage_path ?? doc.storage_path);
  const { data: fileData, error: fileError } = await admin.storage.from(STORAGE_BUCKET).download(path);
  if (fileError || !fileData) throw new HttpError(fileError?.message ?? "Arquivo não encontrado no Storage", 404);

  const documentName = String(body.document_name ?? doc.nome_arquivo ?? doc.tipo ?? "Documento jurídico");
  const signerName = String(body.signer_name ?? signerEmail);
  const query = `
    mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(document: $document, signers: $signers, file: $file) {
        id name refusable sortable created_at
        files { original signed }
        signatures {
          public_id name email created_at
          action { name }
          link { short_link }
          user { id name email }
        }
      }
    }
  `;
  const result = await autentiqueUpload(query, {
    document: { name: documentName },
    signers: [{ email: signerEmail, name: signerName, action: "SIGN" }],
  }, fileData, doc.nome_arquivo ?? documentName);

  const created = result.createDocument as JsonRecord;
  const metadata = {
    ...(doc.metadata ?? {}),
    autentique: {
      id: created.id,
      requested_at: new Date().toISOString(),
      requested_by: user.id,
      signer_email: signerEmail,
      signer_name: signerName,
      signing_url: firstSignatureLink(created),
      raw: created,
    },
  };

  await admin.from("portal_documentos").update({
    workflow_status: "aguardando_assinatura",
    status: "aguardando_assinatura",
    require_signature: true,
    autentique_id: created.id,
    autentique_status: "pending",
    metadata,
    updated_at: new Date().toISOString(),
  }).eq("id", documentId);

  await logTimeline(admin, doc, "signature.requested", "Assinatura eletrônica solicitada via Autentique.", {
    autentique_id: created.id,
    signer_email: signerEmail,
  });
  await addFreshdeskNote(doc, `Assinatura solicitada via Autentique para ${signerEmail}. Documento: ${documentName}.`);

  return {
    ok: true,
    autentique_id: created.id,
    status: "pending",
    signing_url: firstSignatureLink(created),
    document: created,
  };
}

async function getDocument(id: string) {
  const query = `
    query Document($id: UUID!) {
      document(id: $id) {
        id name refusable sortable created_at
        files { original signed }
        signatures {
          public_id name email created_at
          action { name }
          link { short_link }
          user { id name email }
          email_events { sent opened delivered refused reason }
          viewed { ip port reason created_at geolocation { country countryISO state stateISO city zipcode latitude longitude } }
          signed { ip port reason created_at geolocation { country countryISO state stateISO city zipcode latitude longitude } }
          rejected { ip port reason created_at geolocation { country countryISO state stateISO city zipcode latitude longitude } }
        }
      }
    }
  `;
  return autentiqueGraphQL(query, { id });
}

async function handleAction(req: Request, body: JsonRecord) {
  const action = String(body.action ?? "");
  await requireUser(req);

  if (action === "request" || action === "create_document") return requestSignature(req, body);
  if (action === "get_document" || action === "status") return getDocument(String(body.autentique_id ?? body.id));
  if (action === "list_documents") {
    const limit = Number(body.limit ?? 60);
    const page = Number(body.page ?? 1);
    return autentiqueGraphQL(`query Documents($limit: Int, $page: Int) { documents(limit: $limit, page: $page) { total data { id name refusable sortable created_at signatures { public_id name email created_at action { name } link { short_link } user { id name email } viewed { created_at } signed { created_at } rejected { created_at } } files { original signed } } } }`, { limit, page });
  }
  if (action === "delete" || action === "delete_document") {
    const id = String(body.autentique_id ?? body.id);
    return autentiqueGraphQL(`mutation DeleteDocument($id: UUID!) { deleteDocument(id: $id) }`, { id });
  }
  if (action === "sign_document") {
    const id = String(body.autentique_id ?? body.id);
    return autentiqueGraphQL(`mutation SignDocument($id: UUID!) { signDocument(id: $id) }`, { id });
  }
  if (action === "resend") {
    const id = String(body.autentique_id ?? body.id);
    return autentiqueGraphQL(`mutation SignDocument($id: UUID!) { signDocument(id: $id) }`, { id });
  }
  if (action === "add_signer") {
    const id = String(body.autentique_id ?? body.id);
    const signer = body.signer ?? { email: body.signer_email, name: body.signer_name, action: "SIGN" };
    return autentiqueGraphQL(`mutation CreateSignerMutation($id: UUID!, $signer: SignerInput!) { createSigner(document_id: $id, signer: $signer) { public_id } }`, { id, signer: { action: "SIGN", ...(signer as JsonRecord) } });
  }
  if (action === "create_folder") {
    return autentiqueGraphQL(`mutation CreateFolderMutation($folder: FolderInput!) { createFolder(folder: $folder) { id name type created_at } }`, { folder: body.folder ?? { name: body.name } });
  }
  if (action === "get_folder") {
    return autentiqueGraphQL(`query Folder($id: UUID!) { folder(id: $id) { id name type created_at } }`, { id: body.folder_id ?? body.id });
  }
  if (action === "list_folders") {
    return autentiqueGraphQL(`query { folders { id name type created_at } }`);
  }
  if (action === "delete_folder") {
    return autentiqueGraphQL(`mutation DeleteFolder($id: UUID!) { deleteFolder(id: $id) }`, { id: body.folder_id ?? body.id });
  }
  if (action === "move_document_to_folder") {
    return autentiqueGraphQL(`mutation MoveDocumentToFolder($document_id: UUID!, $folder_id: UUID!) { moveDocumentToFolder(document_id: $document_id, folder_id: $folder_id) }`, { document_id: body.document_id, folder_id: body.folder_id });
  }
  if (action === "documents_by_folder") {
    return autentiqueGraphQL(`query DocumentsByFolder($folder_id: UUID!, $limit: Int, $page: Int) { documentsByFolder(folder_id: $folder_id, limit: $limit, page: $page) { total data { id name created_at files { original signed } signatures { public_id name email action { name } viewed { created_at } signed { created_at } rejected { created_at } } } } }`, { folder_id: body.folder_id, limit: body.limit ?? 60, page: body.page ?? 1 });
  }

  throw new HttpError(`Ação não suportada: ${action}`, 400);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  try {
    if (req.method === "GET") {
      await requireUser(req);
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return json({ error: "id obrigatório" }, 400);
      return json(await getDocument(id));
    }

    if (req.method === "DELETE") {
      const body = await req.json().catch(() => ({}));
      return json(await handleAction(req, { ...body, action: "delete" }));
    }

    if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
    const body = await req.json();
    return json(await handleAction(req, body));
  } catch (err) {
    const e = err as HttpError;
    console.error("[portal-signature]", e.message, e.details ?? "");
    return json({ error: e.message, details: e.details ?? null }, e.status ?? 500);
  }
});
