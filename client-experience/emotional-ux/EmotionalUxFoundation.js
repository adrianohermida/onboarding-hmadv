const POSITIVE_DEFAULT = 'Voce nao esta sozinho. Vamos conduzir cada etapa com clareza e cuidado.';

export class EmotionalUxFoundation {
  compose(payload = {}) {
    return {
      title: payload.title || 'Estamos com voce em cada passo',
      microcopy: payload.microcopy || POSITIVE_DEFAULT,
      tone: payload.tone || 'acolhedor',
      clarity_level: payload.clarity_level || 'alto',
      anxiety_reduction: payload.anxiety_reduction !== false,
      legal_clarity: payload.legal_clarity !== false,
    };
  }
}

export const emotionalUxFoundation = new EmotionalUxFoundation();
