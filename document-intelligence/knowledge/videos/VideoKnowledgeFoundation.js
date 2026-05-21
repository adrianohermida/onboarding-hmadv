export const YOUTUBE_PLAYLISTS = {
  onboarding: [
    { id: 'yt_onboarding_01', title: 'Boas-vindas', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { id: 'yt_onboarding_02', title: 'Envio de documentos', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  ],
  cnj: [
    { id: 'yt_cnj_01', title: 'Formulario CNJ', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  ],
};

export function listVideoTracks(track = 'onboarding') {
  return YOUTUBE_PLAYLISTS[track] || [];
}

export function buildVideoCheckpoint(payload = {}) {
  return {
    video_id: payload.video_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    actor_id: payload.actor_id || 'system',
    watched: !!payload.watched,
    completion: Number(payload.completion) || 0,
    timestamp: new Date().toISOString(),
  };
}
