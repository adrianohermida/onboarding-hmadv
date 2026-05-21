/**
 * UploadEngine — motor de upload enterprise
 *
 * Recursos:
 * - Drag & Drop com visual feedback
 * - Validação tipo/tamanho
 * - Preview (imagens e PDF)
 * - Progresso em tempo real
 * - Retry automático (3 tentativas)
 * - Compressão de imagens (canvas resize)
 * - Eventos via EventBus
 *
 * Uso:
 *   const engine = new UploadEngine(containerEl, { onFile: (file, tipo) => ... });
 *   engine.mount(tipo);
 */
import { bus } from '../events/EventBus.js';

const ACCEPTED_MIME  = ['application/pdf','image/jpeg','image/png','image/webp','image/jpg'];
const ACCEPTED_EXT   = '.pdf,.jpg,.jpeg,.png,.webp';
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_IMG_DIM    = 2400;              // px — resize larger images
const RETRY_LIMIT    = 3;

export class UploadEngine {
  /**
   * @param {HTMLElement} dropZone — element to attach drag-drop to
   * @param {object} opts
   * @param {function} opts.onUpload(file, tipo) — async upload handler, must return result
   * @param {function} [opts.onProgress(pct, tipo)] — progress callback
   * @param {function} [opts.onSuccess(result, tipo)] — upload success callback
   * @param {function} [opts.onError(error, tipo)] — upload error callback
   * @param {function} [opts.onPreview(dataUrl, tipo)] — file preview ready callback
   * @param {boolean}  [opts.compress=true] — compress images before upload
   */
  constructor(dropZone, opts = {}) {
    this._zone       = dropZone;
    this._opts       = opts;
    this._activeJobs = {}; // { tipo: { status, retries, file } }
    this._mounted    = false;
  }

  // ── Mount ─────────────────────────────────────────────────────────────────────
  mount() {
    if (this._mounted || !this._zone) return;
    this._mounted = true;
    this._bindDragDrop();
  }

  unmount() {
    if (!this._zone) return;
    this._zone.removeEventListener('dragenter',  this._onDragEnter);
    this._zone.removeEventListener('dragover',   this._onDragOver);
    this._zone.removeEventListener('dragleave',  this._onDragLeave);
    this._zone.removeEventListener('drop',       this._onDrop);
    this._mounted = false;
  }

  // ── Drag & Drop bindings ──────────────────────────────────────────────────────
  _bindDragDrop() {
    this._onDragEnter = (e) => { e.preventDefault(); this._zone.classList.add('drag-over'); };
    this._onDragOver  = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
    this._onDragLeave = (e) => {
      if (!this._zone.contains(e.relatedTarget)) this._zone.classList.remove('drag-over');
    };
    this._onDrop = (e) => {
      e.preventDefault();
      this._zone.classList.remove('drag-over');
      const file = e.dataTransfer.files?.[0];
      if (file) this._handleFile(file, this._zone.dataset.tipo || 'generic');
    };

    this._zone.addEventListener('dragenter',  this._onDragEnter);
    this._zone.addEventListener('dragover',   this._onDragOver);
    this._zone.addEventListener('dragleave',  this._onDragLeave);
    this._zone.addEventListener('drop',       this._onDrop);
  }

  // ── Public: trigger file selection ───────────────────────────────────────────
  triggerPicker(tipo) {
    const inp = this._getOrCreateInput(tipo);
    inp.click();
  }

  _getOrCreateInput(tipo) {
    const id  = `_up_inp_${tipo}`;
    let   inp = document.getElementById(id);
    if (!inp) {
      inp = document.createElement('input');
      inp.type   = 'file';
      inp.id     = id;
      inp.accept = ACCEPTED_EXT;
      inp.style.display = 'none';
      inp.addEventListener('change', () => {
        if (inp.files?.[0]) this._handleFile(inp.files[0], tipo);
        inp.value = ''; // reset so same file can be reselected
      });
      document.body.appendChild(inp);
    }
    return inp;
  }

  // ── File processing ───────────────────────────────────────────────────────────
  async _handleFile(rawFile, tipo) {
    // 1. Validate
    const valErr = this._validate(rawFile);
    if (valErr) {
      this._opts.onError?.(new Error(valErr), tipo);
      bus.emit('upload.validation_error', { tipo, error: valErr, file: rawFile.name });
      return;
    }

    // 2. Preview (async, non-blocking)
    this._generatePreview(rawFile, tipo);

    // 3. Compress if image
    let file = rawFile;
    if (this._opts.compress !== false && rawFile.type.startsWith('image/')) {
      try { file = await this._compressImage(rawFile); }
      catch { file = rawFile; }
    }

    // 4. Upload with retry
    this._activeJobs[tipo] = { status: 'uploading', retries: 0, file };
    bus.emit('upload.started', { tipo, fileName: file.name, size: file.size });
    this._opts.onProgress?.(0, tipo);

    await this._uploadWithRetry(file, tipo);
  }

  _validate(file) {
    if (!ACCEPTED_MIME.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp)$/i)) {
      return 'Formato não aceito. Use PDF, JPG ou PNG.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 10 MB.`;
    }
    return null;
  }

  async _uploadWithRetry(file, tipo, attempt = 1) {
    try {
      // Simulate progress: 0 → 90% during upload, 100% on success
      const progressInterval = setInterval(() => {
        const job = this._activeJobs[tipo];
        if (!job || job.status !== 'uploading') { clearInterval(progressInterval); return; }
        const fake = Math.min(85, (job._pct || 0) + Math.random() * 15);
        job._pct = fake;
        this._opts.onProgress?.(Math.round(fake), tipo);
      }, 300);

      const result = await this._opts.onUpload(file, tipo);

      clearInterval(progressInterval);
      this._opts.onProgress?.(100, tipo);
      this._activeJobs[tipo] = { status: 'done', file };

      bus.emit('upload.completed', { tipo, fileName: file.name, size: file.size, result });
      this._opts.onSuccess?.(result, tipo);

    } catch (err) {
      const job = this._activeJobs[tipo];
      if (job && job.retries < RETRY_LIMIT - 1) {
        job.retries++;
        const delay = 1000 * Math.pow(2, job.retries); // exponential backoff
        console.warn(`[UploadEngine] retry ${job.retries}/${RETRY_LIMIT} for ${tipo} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        return this._uploadWithRetry(file, tipo, attempt + 1);
      }

      this._activeJobs[tipo] = { status: 'error', file, error: err };
      bus.emit('upload.failed', { tipo, fileName: file.name, error: err.message, attempts: attempt });
      this._opts.onError?.(err, tipo);
    }
  }

  // ── Preview ───────────────────────────────────────────────────────────────────
  _generatePreview(file, tipo) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => this._opts.onPreview?.(e.target.result, tipo, 'image');
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // Use blob URL for PDF preview
      const url = URL.createObjectURL(file);
      this._opts.onPreview?.(url, tipo, 'pdf');
    }
  }

  // ── Image compression (canvas resize) ────────────────────────────────────────
  _compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        // Only resize if larger than MAX_IMG_DIM
        if (width <= MAX_IMG_DIM && height <= MAX_IMG_DIM) {
          resolve(file); return;
        }

        const ratio = Math.min(MAX_IMG_DIM / width, MAX_IMG_DIM / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          },
          'image/jpeg', 0.88
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
  }

  // ── Status getters ────────────────────────────────────────────────────────────
  isUploading(tipo) { return this._activeJobs[tipo]?.status === 'uploading'; }
  getJobStatus(tipo) { return this._activeJobs[tipo]?.status || 'idle'; }
  clearJob(tipo) { delete this._activeJobs[tipo]; }

  // ── Utility ───────────────────────────────────────────────────────────────────
  static formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024)         return `${bytes} B`;
    if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  static getFileIcon(mimeType, fileName = '') {
    if (!mimeType && fileName) {
      if (fileName.endsWith('.pdf')) return 'PDF';
      if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) return 'IMG';
    }
    if (mimeType === 'application/pdf')  return 'PDF';
    if (mimeType?.startsWith('image/')) return 'IMG';
    return 'ARQ';
  }
}
