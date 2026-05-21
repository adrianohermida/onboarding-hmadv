import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('documentos enterprise contract', () => {
  it('keeps upload, preview, comments, workflow and signature wired in the page', () => {
    const page = readFile('pages', 'documentos.html');

    [
      'drop-zone-global',
      'pdf-frame',
      'viewer-zoom-label',
      'data-tab="comments"',
      'doc-comment-form',
      'selectWorkflow',
      'confirmReview',
      'openSigModal',
      'SignatureService',
      'OCR preparado',
    ].forEach(token => {
      expect(page).toContain(token);
    });
  });

  it('persists document comments and OCR readiness through Supabase contracts', () => {
    const migration = readFile('supabase', 'migrations-safe', '20260521_safe_014_documents_comments_ocr.sql');
    const service = readFile('services', 'database.js');
    const engine = readFile('modules', 'documentos', 'DocumentEngine.js');

    expect(migration).toContain('portal_document_comments');
    expect(migration).toContain('ocr_status');
    expect(migration).toContain('ocr_metadata');
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
    expect(service).toContain('listComments');
    expect(service).toContain('addComment');
    expect(service).toContain('markViewed');
    expect(engine).toContain('listComments');
    expect(engine).toContain('addComment');
    expect(engine).toContain('markViewed');
  });

  it('covers Autentique document and signature webhooks with split secrets', () => {
    const signature = readFile('modules', 'documentos', 'SignatureService.js');
    const edge = readFile('supabase', 'functions', 'portal-signature', 'index.ts');
    const webhook = readFile('supabase', 'functions', 'portal-signature-webhook', 'index.ts');

    expect(signature).toContain('requestSignature');
    expect(signature).toContain('portal-signature');
    expect(signature).toContain('resend');
    expect(signature).toContain('cancel');
    expect(edge).toContain('createDocument');
    expect(edge).toContain('list_documents');
    expect(edge).toContain('documents_by_folder');
    expect(webhook).toContain('AUTENTIQUE_WEBHOOK_SECRET_DOC');
    expect(webhook).toContain('AUTENTIQUE_WEBHOOK_SECRET_SIGN');
    expect(webhook).toContain('document.finished');
    expect(webhook).toContain('signature.accepted');
  });
});
