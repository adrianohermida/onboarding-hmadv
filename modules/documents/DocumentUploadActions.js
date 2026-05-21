import { UploadEngine } from './UploadEngine.js';

export function createDocumentUploader({
  dropZone,
  engine,
  toast,
} = {}) {
  const uploader = new UploadEngine(dropZone, {
    onUpload: (file, tipo) => engine.upload(tipo, file),
    onProgress: (pct, tipo) => updateDocumentUploadProgress(tipo, pct),
    onSuccess: (_result, tipo) => {
      toast?.success?.(`${tipo} enviado com sucesso!`);
    },
    onError: (error) => {
      toast?.error?.(error.message || 'Erro ao enviar documento.');
    },
    onPreview: () => {},
  });

  uploader.mount();
  return uploader;
}

export function triggerDocumentUpload(uploader, tipo) {
  if (!uploader) return;
  uploader.triggerPicker(tipo);
}

export function setDocumentCardUploading(tipo, active) {
  const progress = document.getElementById(`prog-${tipo}`);
  if (progress) progress.classList.toggle('active', active);
}

export function updateDocumentUploadProgress(tipo, pct) {
  const fill = document.getElementById(`prog-fill-${tipo}`);
  if (fill) fill.style.width = `${pct}%`;
}
