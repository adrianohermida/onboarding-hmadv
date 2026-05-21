/**
 * JourneyEngine — máquina de estados da jornada CNJ
 * Gerencia transições, persistência e propagação de desbloqueios.
 */
import { bus } from '../events/EventBus.js';

const STORAGE_KEY = 'journey:states:v2';

export class JourneyEngine {
  /** @param {Array} steps — JOURNEY_STEPS config array */
  constructor(steps) {
    this.steps  = steps;
    this.states = {};           // { stepId: state }
    this._videoProg = {};       // { stepKey: { pct, maxPct, status } } (in-memory, synced from DB)
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  /** Inicializa: restaura sessão + merges com progresso de vídeos do DB */
  init(videoProgressFromDB = []) {
    this._restoreSession();
    this._mergeVideoProgress(videoProgressFromDB);
    this._propagateUnlocks();
    this._persist();
  }

  _restoreSession() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}');
      this.states = saved;
    } catch { this.states = {}; }

    // Garante que pelo menos o primeiro passo está disponível
    for (let i = 0; i < this.steps.length; i++) {
      if (!this.states[this.steps[i].id]) {
        this.states[this.steps[i].id] = i === 0 ? 'available' : 'locked';
      }
    }
  }

  _mergeVideoProgress(progressList = []) {
    // progressList: [ { video_id, step_key (from join), status, max_pct_reached } ]
    for (const prog of progressList) {
      const stepKey = prog.onboarding_videos?.step_key ?? prog.step_key;
      if (!stepKey) continue;
      this._videoProg[stepKey] = prog;

      // Encontra o passo correspondente
      const step = this.steps.find(s => s.stepKey === stepKey);
      if (!step) continue;

      if (prog.status === 'completed' || prog.status === 'skipped') {
        this.states[step.id] = 'completed';
      } else if (prog.watch_pct > 0 || prog.status === 'in_progress') {
        if (this.states[step.id] !== 'completed') {
          this.states[step.id] = 'in_progress';
        }
      }
    }
  }

  _propagateUnlocks() {
    for (let i = 0; i < this.steps.length - 1; i++) {
      const s    = this.steps[i];
      const next = this.steps[i + 1];
      if (['completed', 'approved'].includes(this.states[s.id])) {
        if (this.states[next.id] === 'locked' || !this.states[next.id]) {
          this.states[next.id] = 'available';
        }
      }
    }
  }

  _persist() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.states)); } catch {}
  }

  // ── State reads ────────────────────────────────────────────────────────────
  getState(stepId) {
    return this.states[stepId] ?? 'locked';
  }

  getProgress() {
    const total = this.steps.length;
    const done  = this.steps.filter(s =>
      ['completed', 'approved'].includes(this.states[s.id])
    ).length;
    return { total, done, pct: Math.round((done / total) * 100) };
  }

  /** Retorna o passo corrente (primeiro que está ativo/disponível) */
  getCurrentStep() {
    // Preferência: in_progress → rejected → available → primeiro
    const order = ['in_progress', 'rejected', 'available'];
    for (const priority of order) {
      const found = this.steps.find(s => this.states[s.id] === priority);
      if (found) return found;
    }
    return this.steps[0];
  }

  isAllCompleted() {
    return this.steps.every(s => ['completed', 'approved'].includes(this.states[s.id]));
  }

  getVideoProgress(stepKey) {
    return this._videoProg[stepKey] ?? null;
  }

  // ── State writes ───────────────────────────────────────────────────────────
  setState(stepId, state) {
    if (this.states[stepId] === state) return;
    const prev = this.states[stepId];
    this.states[stepId] = state;
    this._propagateUnlocks();
    this._persist();

    bus.emit('journey.step.state_changed', { stepId, state, prev });

    if (['completed', 'approved'].includes(state)) {
      bus.emit('journey.step.completed', { stepId });
    }
  }

  setVideoProgress(stepKey, prog) {
    this._videoProg[stepKey] = { ...(this._videoProg[stepKey] ?? {}), ...prog };
  }

  nextStep(currentStepId) {
    const idx = this.steps.findIndex(s => s.id === currentStepId);
    return idx >= 0 && idx < this.steps.length - 1 ? this.steps[idx + 1] : null;
  }

  prevStep(currentStepId) {
    const idx = this.steps.findIndex(s => s.id === currentStepId);
    return idx > 0 ? this.steps[idx - 1] : null;
  }
}
