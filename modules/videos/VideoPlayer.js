/**
 * VideoPlayer — YouTube IFrame API wrapper com rastreamento real de assistido
 * - Usa youtube-nocookie.com para privacidade
 * - Rastreia watch_pct em tempo real (tick a cada 1s)
 * - Emite eventos via EventBus
 * - Suporta retomada a partir de last_position_sec
 */
import { bus } from '../events/EventBus.js';

// Queue global para montar players quando a API YT ainda não carregou
window._ytQueue = window._ytQueue ?? [];

window.onYouTubeIframeAPIReady = function () {
  for (const fn of window._ytQueue) fn();
  window._ytQueue = [];
  window._ytReady = true;
};

export class VideoPlayer {
  /**
   * @param {string} mountId       — id do elemento DOM onde o player será montado
   * @param {string} youtubeId     — ID do vídeo no YouTube
   * @param {string} dbVideoId     — UUID do onboarding_videos.id (para eventos)
   * @param {object} [opts]
   * @param {number} [opts.startAt=0]  — posição inicial em segundos
   */
  constructor(mountId, youtubeId, dbVideoId, opts = {}) {
    this.mountId    = mountId;
    this.youtubeId  = youtubeId;
    this.dbVideoId  = dbVideoId;
    this.startAt    = opts.startAt ?? 0;

    this._player    = null;
    this._timer     = null;
    this._watchPct  = 0;
    this._maxPct    = 0;
    this._watchSec  = 0;
    this._mounted   = false;
  }

  // ── Mount ──────────────────────────────────────────────────────────────────
  mount() {
    return new Promise((resolve) => {
      const create = () => {
        if (document.getElementById(this.mountId)) {
          this._createPlayer(resolve);
        }
      };
      if (window._ytReady) { create(); }
      else                  { window._ytQueue.push(create); }
    });
  }

  _createPlayer(resolve) {
    if (this._player) {
      try { this._player.destroy(); } catch {}
    }
    this._player = new YT.Player(this.mountId, {
      videoId:    this.youtubeId,
      playerVars: {
        start:         Math.floor(this.startAt),
        rel:           0,
        showinfo:      0,
        modestbranding: 1,
        enablejsapi:   1,
        origin:        window.location.origin,
        playsinline:   1,  // mobile
      },
      host: 'https://www.youtube-nocookie.com',
      events: {
        onReady:       (e) => this._onReady(e, resolve),
        onStateChange: (e) => this._onStateChange(e),
        onError:       (e) => this._onError(e),
      },
    });
    this._mounted = true;
  }

  _onReady(event, resolve) {
    const dur = event.target.getDuration?.() ?? 0;
    bus.emit('video.ready', {
      dbVideoId: this.dbVideoId,
      ytVideoId: this.youtubeId,
      duration:  dur,
    });
    resolve(this);
  }

  _onStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      this._startTracking();
    } else if (
      event.data === YT.PlayerState.PAUSED ||
      event.data === YT.PlayerState.ENDED
    ) {
      this._stopTracking();
      if (event.data === YT.PlayerState.ENDED) this._onEnded();
    }
  }

  _onError(event) {
    bus.emit('video.error', { dbVideoId: this.dbVideoId, code: event.data });
  }

  // ── Tracking ───────────────────────────────────────────────────────────────
  _startTracking() {
    if (this._timer) return;
    this._timer = setInterval(() => this._tick(), 1000);
  }

  _stopTracking() {
    clearInterval(this._timer);
    this._timer = null;
  }

  _tick() {
    const cur = this._player?.getCurrentTime?.() ?? 0;
    const dur = this._player?.getDuration?.()    ?? 0;
    if (dur <= 0) return;

    this._watchSec = Math.round(cur);
    const pct      = Math.min(100, Math.round((cur / dur) * 100));
    this._watchPct = pct;
    this._maxPct   = Math.max(this._maxPct, pct);

    bus.emit('video.progress', {
      dbVideoId: this.dbVideoId,
      pct,
      maxPct:    this._maxPct,
      cur:       Math.round(cur),
      dur:       Math.round(dur),
    });

    if (pct >= 100 && !this._ended) this._onEnded();
  }

  _onEnded() {
    if (this._ended) return;
    this._ended    = true;
    this._watchPct = 100;
    this._maxPct   = 100;
    this._stopTracking();
    bus.emit('video.completed', { dbVideoId: this.dbVideoId });
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  getCurrentPosition() { return this._player?.getCurrentTime?.() ?? 0; }
  getDuration()        { return this._player?.getDuration?.()    ?? 0; }
  getWatchPct()        { return this._watchPct; }
  getMaxPct()          { return this._maxPct; }
  getWatchSec()        { return this._watchSec; }

  pause()   { try { this._player?.pauseVideo?.();  } catch {} }
  resume()  { try { this._player?.playVideo?.();   } catch {} }

  destroy() {
    this._stopTracking();
    try { this._player?.destroy?.(); } catch {}
    this._player  = null;
    this._mounted = false;
  }
}
